
const extpay = ExtPay('promptqueue');

document.querySelector('#upgrade-btn').addEventListener('click', function(evt) {
  evt.preventDefault();
  extpay.openPaymentPage('promptqueue');
})


  

const statusDiv = document.getElementById("status");

// Funkce na aktualizaci UI seznamu zpráv
function updatePopupList(buffer) {
  const list = document.getElementById("message-list");
  list.innerHTML = "";

  buffer.forEach((msg, index) => {
    const li = document.createElement("li");

    const commas = document.createElement("button");
    commas.className = "commas";
    commas.textContent = "☰";

    const prgrh = document.createElement("p");
    prgrh.textContent = `${index + 1}. ${msg}`;
    const btn = document.createElement("button");
    btn.className = "delete-separate-button";
    btn.textContent = "Delete";

    btn.addEventListener("click", async () => {
      buffer.splice(index, 1);
      await chrome.storage.local.set({ buffer });
    });

    li.appendChild(commas);
    li.appendChild(prgrh);
    li.appendChild(btn);

    list.appendChild(li);
  });

  initSortable(list, buffer);
}

// Inicializace SortableJS
function initSortable(list, buffer) {
  if (window.sortableInstance) {
    window.sortableInstance.destroy();
  }

  window.sortableInstance = new Sortable(list, {
    handle: '.commas',
    animation: 150,
    onEnd: async () => {
      const newOrder = [...list.children].map(li => {
        const text = li.querySelector("p").textContent;
        return text.replace(/^\d+\.\s/, "");
      });
      await chrome.storage.local.set({ buffer: newOrder });
    }
  });
}

// Načti seznam zpráv při otevření popupu
window.addEventListener("DOMContentLoaded", async () => {
  const { buffer } = await chrome.storage.local.get({ buffer: [] });
  updatePopupList(buffer);
  updateStatus();
});

// Aktualizace UI při změně bufferu
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.buffer) {
    updatePopupList(changes.buffer.newValue);
  }
});

// Aktualizace stavu free/premium
async function updateStatus() {
  const statusDiv = document.getElementById("status");
  const upgradeBtn = document.getElementById("upgrade-btn");

  chrome.runtime.sendMessage({ action: "checkLicense" }, (response) => {
    if (!response) {
      console.error("❌ Nepřišla žádná odpověď z background.js");
      statusDiv.textContent = "❗ Chyba při kontrole licence";
      return;
    }

    chrome.storage.local.get(['promptCount', 'lastDate']).then(data => {
      const { promptCount = 0, lastDate = "" } = data;
      const today = new Date().toISOString().split('T')[0];
      let remaining = lastDate !== today ? 5 : (5 - promptCount);

      if (response.paid) {
        statusDiv.textContent = "👑 Premium aktivní – neomezené používání";
        upgradeBtn.style.display = "none";
      } else {
        statusDiv.textContent = `🆓 Free verze: Zbývá ${remaining}/5 promptů dnes`;
        upgradeBtn.style.display = "inline-block";
      }
    });
  });
}


// Uložení nové zprávy do bufferu
document.getElementById("save").addEventListener("click", async () => {
  const textarea = document.getElementById("message");
  const text = textarea.value.trim();

  if (text) {
    let { buffer } = await chrome.storage.local.get({ buffer: [] });
    buffer.push(text);
    await chrome.storage.local.set({ buffer });
    textarea.value = "";
  }
});

// Smazání celého bufferu
document.getElementById("delete").addEventListener("click", async () => {
  if (confirm("Do you really want to delete your prompts?")) {
    await chrome.storage.local.set({ buffer: [] });
  }
});

// Spuštění automatického odesílání
document.getElementById("start-auto").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.runtime.sendMessage({ action: "startAutoSend" }, (response) => {
    if (response.status === "content-injected") {
      setTimeout(() => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            window.sendNextMessageFromBuffer?.();
            
          }
        });
      }, 500);
    } else {
      alert("Nelze injectovat content script");
    }
  });
});



// Naslouchání na zprávy od backgroundu pro aktualizaci bufferu
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "updatePopup" && request.buffer) {
    updatePopupList(request.buffer);
  }
});
chrome.runtime.sendMessage({ action: "ping" }, (response) => {
  console.log("↩️ Odpověď z background.js:", response);
});