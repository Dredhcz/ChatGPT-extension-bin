function waitForResponseToFinish(callback) {
    const target = document.querySelector('main');
    if (!target) return;
  
    const observer = new MutationObserver(() => {
      const isGenerating = document.querySelector('#composer-submit-button');
  
      if (!isGenerating) {
        observer.disconnect();
        console.log("✅ Odpověď hotová");
        callback();
      }
    });
  
    observer.observe(target, { childList: true, subtree: true });
  }
  
  function waitUntilGenerationStartsThenFinish(callback) {
    const target = document.querySelector('main');
    if (!target) return;
  
    const observer = new MutationObserver(() => {
      const isGenerating = document.querySelector('#composer-submit-button');
  
      if (isGenerating) {
        console.log("🟡 Detekováno zahájení generování");
        observer.disconnect();
  
        // Nyní sleduj konec generování
        waitForResponseToFinish(callback);
      }
    });
  
    observer.observe(target, { childList: true, subtree: true });
  }
  
  function sendNextMessageFromBuffer() {
    console.log("📤 Funkce sendNextMessageFromBuffer se spustila");
  
    chrome.storage.local.get(["buffer"]).then(result => {
      let buffer = result.buffer;
      console.log("📦 Buffer uvnitř .then:", buffer);
  
      if (!buffer || buffer.length === 0) {
        console.log("🚫 Buffer je prázdný");
        alert("All prompts generated");
        return;
      }
  
      const nextMessage = buffer[0];
      const inputBox = document.querySelector('div[contenteditable="true"]');
      const sendButton = document.querySelector('button[id="composer-submit-button"]');
  
      if (!inputBox) {
        console.warn("⚠️ Nelze najít vstupní pole");
        return;
      }
  
      // 1. Vyplnění vstupního pole
      inputBox.focus();
      inputBox.textContent = nextMessage;
      inputBox.dispatchEvent(new Event("input", {bubbles: true}));
      setTimeout(() => {
      // 2. Odeslání zprávy
      if (sendButton) {
        sendButton.click();
        console.log("🖱️ Klikám na tlačítko odeslání");
      } else {
        console.log("↩️ Tlačítko nenalezeno, zkouším Enter");
        const enterDown = new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13
        });
        inputBox.focus();
        inputBox.dispatchEvent(enterDown);
      }}, 2000); 
  
      // 3. Odebrání zprávy z bufferu
      buffer.shift();
      chrome.storage.local.set({ buffer }).then(() => {
        chrome.runtime.sendMessage({ action: "refresh" }, (response) => {
          console.log("🔄 Buffer aktualizován a popup refreshnut:", response);
        });
      });
  
      // 4. Čekání na odpověď (nejprve start, pak konec)
      waitUntilGenerationStartsThenFinish(() => {
        console.log("✅ Odpověď hotová, čekám 2s a pokračuju");
  
        setTimeout(() => {
          sendNextMessageFromBuffer();
        }, 2000); // Pauza mezi odpověďmi
      });
    });
  }
  
  // Umožní spuštění z konzole
  window.sendNextMessageFromBuffer = sendNextMessageFromBuffer;
  
  console.log("✅ content.js běží");
  