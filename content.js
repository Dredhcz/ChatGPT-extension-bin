function waitForResponseToFinish(callback){
    const target = document.querySelector("main");

    if (!target) return;

    const observer = new MutationObserver(() => {//composer-submit-button tohle je id toho čtverce (button) když se generuje
        const isGenerating = document.querySelector('#composer-submit-button');
        
        if(!isGenerating){
            observer.disconnect();
            console.log("✅ Odpověď hotová");
            callback();
            
        }
    });
    observer.observe(target, {childList: true, subtree: true});
}

function sendNextMessageFromBuffer() {
    console.log("Funkce sendNextMessageFromBuffer se spustila");
  
    chrome.storage.local.get(["buffer"]).then(result => {
      let buffer = result.buffer;
      console.log("Buffer uvnitř .then:", buffer);
  
      if (!buffer || buffer.length === 0) {
        console.log("Buffer je prázdný");
        return;
      }
  
      const nextMessage = buffer[0];
      const inputBox = document.querySelector('div[contenteditable="true"]');
      const sendButton = document.querySelector('button[id="composer-submit-button"]');
  
      if (!inputBox) {
        console.warn("Nelze najít vstupní pole");
        return;
      }
  
      // 1. Focus + vyplnění
      inputBox.focus();
      inputBox.textContent = nextMessage;
      //inputBox.dispatchEvent(new InputEvent("input", { bubbles: true }));
      //inputBox.dispatchEvent(new Event("change", { bubbles: true }));
  
      // 2. Pokusíme se použít tlačítko (spolehlivější než enter)
      if (sendButton) {
        sendButton.click();
        console.log("Klikám na tlačítko odeslání");
      } else {
        console.log("Tlačítko nenalezeno, zkouším Enter");
        const enterDown = new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13
        });
        
  
        inputBox.dispatchEvent(enterDown);
      }
  
      // 3. Odebereme zprávu z bufferu
      buffer.shift();
      chrome.storage.local.set({ buffer });
  
      // 4. Čekáme, až odpověď skončí (ne od teď, ale od začátku generování)
      waitForResponseToFinish(() => {
        console.log("✅ Odpověď hotová čekám 2s a pokračuju");
  
        setTimeout(() => {
          sendNextMessageFromBuffer();
        }, 2000); // Přestávka mezi odpověďmi
      });
    });
  }
  

window.sendNextMessageFromBuffer = sendNextMessageFromBuffer;

console.log("✅ content.js běží");



  