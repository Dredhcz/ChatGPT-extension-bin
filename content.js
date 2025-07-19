console.log("✅ content.js běží");

async function isPremiumUser() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "checkLicense" }, (response) => {
      resolve(response.paid);
    });
  });
}

async function canUsePrompt() {
  const isPremium = await isPremiumUser();

  if (isPremium) {
    console.log("👑 Premium uživatel - žádný limit");
    return true;
  }

  const today = new Date().toISOString().split('T')[0];
  const { promptCount = 0, lastDate = "" } = await chrome.storage.local.get(['promptCount', 'lastDate']);

  let remaining = lastDate !== today ? 5 : (5 - promptCount);

  if (remaining > 0) {
    console.log(`📊 Free: zbývá ${remaining} promptů dnes`);
    return true;
  }

  console.log("🚫 Limit dosažen");
  alert("Dnešní limit 5 promptů ve free verzi byl dosažen.\nKup Premium pro neomezený přístup.");
  chrome.runtime.sendMessage({ action: "openPaymentPage" });
  return false;
}

async function incrementPromptCount() {
  const today = new Date().toISOString().split('T')[0];
  let { promptCount = 0, lastDate = "" } = await chrome.storage.local.get(['promptCount', 'lastDate']);

  if (lastDate !== today) {
    promptCount = 0;
    lastDate = today;
  }

  promptCount++;
  await chrome.storage.local.set({ promptCount, lastDate });
  console.log(`✅ Prompt count zvýšen: ${promptCount}/5 dnes`);
}

async function sendNextMessageFromBuffer() {
  console.log("📤 Spouštím sendNextMessageFromBuffer");

  chrome.storage.local.get(["buffer"]).then(async result => {
    let buffer = result.buffer;

    if (buffer.length === 0) {
      console.log("🚫 Buffer je prázdný");
      alert("All prompts generated");
      return;
    }

    if (!(await canUsePrompt())) return; // ⛔ STOP pro free když překročil limit

    const nextMessage = buffer[0];
    const inputBox = document.querySelector('div[contenteditable="true"]');
    const sendButton = document.querySelector('button[id="composer-submit-button"]');

    if (!inputBox) {
      console.warn("⚠️ Nelze najít vstupní pole");
      return;
    }

    inputBox.focus();
    inputBox.textContent = nextMessage;
    inputBox.dispatchEvent(new Event("input", { bubbles: true }));

    setTimeout(() => {
      if (sendButton) {
        sendButton.click();
        console.log("🖱️ Klikám na tlačítko odeslání");
      } else {
        const enterDown = new KeyboardEvent("keydown", {
          key: "Enter", code: "Enter", keyCode: 13, which: 13
        });
        inputBox.focus();
        inputBox.dispatchEvent(enterDown);
      }
    }, 2000);

    await incrementPromptCount();

    buffer.shift();
    await chrome.storage.local.set({ buffer });
    chrome.runtime.sendMessage({ action: "refresh" });

    waitUntilGenerationStartsThenFinish(() => {
      console.log("✅ Odpověď hotová, čekám 2s a pokračuju");
      setTimeout(sendNextMessageFromBuffer, 2000);
    });
  });
}

window.sendNextMessageFromBuffer = sendNextMessageFromBuffer;
