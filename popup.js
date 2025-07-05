// 📥 Uložení nové zprávy do bufferu
document.getElementById("save").addEventListener("click", async () => {
  const textarea = document.getElementById("message");
  const text = textarea.value.trim();

  if (text) {
    let { buffer } = await chrome.storage.local.get({ buffer: [] });
    buffer.push(text);
    await chrome.storage.local.set({ buffer }); // Triggruje onChanged
    textarea.value = "";
  }
});

// 🗑️ Smazání celého bufferu
document.getElementById("delete").addEventListener("click", async () => {
  if (confirm("Do you really want to delete your prompts?")) {
    await chrome.storage.local.set({ buffer: [] }); // Triggruje onChanged
  }
});

// ▶️ Spuštění automatického odesílání
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

// 🔁 Funkce na aktualizaci UI seznamu zpráv
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

  initSortable(list, buffer); // 🎯 Aktivuj Sortable po vykreslení
}

// ⏳ Načti seznam zpráv při otevření popupu
window.addEventListener("DOMContentLoaded", async () => {
  let { buffer } = await chrome.storage.local.get({ buffer: [] });
  updatePopupList(buffer);
});

// 📦 Sleduj změny v storage a aktualizuj seznam
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.buffer) {
    const newBuffer = changes.buffer.newValue;
    updatePopupList(newBuffer);
  }
});

// 📦 Inicializace SortableJS
function initSortable(list, buffer) {
  if (window.sortableInstance) {
    window.sortableInstance.destroy(); // 💥 Znič starý instance
  }

  window.sortableInstance = new Sortable(list, {
    handle: '.commas', // Táhne se jen za ☰
    animation: 150,
    onEnd: async function (evt) {
      // 📦 Ulož nový pořádek do storage
      const newOrder = [...list.children].map(li => {
        // 🆕 UPRAVENO - odstraní číslo při ukládání
        const text = li.querySelector("p").textContent;
        return text.replace(/^\d+\.\s/, ""); // odstraní "1. ", "2. " apod.
      });
      await chrome.storage.local.set({ buffer: newOrder });
    }
  });
}
