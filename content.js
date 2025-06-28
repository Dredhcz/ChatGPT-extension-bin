function waitForResponseToFinish(callback){
    const target = document.querySelector("main");

    if (!target) return;

    const observer = new MutationObserver(() => {
        const isGenerating = document.querySelector('[data-testid="conversation-turn-loading"]');
        if(!isGenerating){
            observer.disconnect();
            callback();
        }
    });
    observer.observe(target, {childList: true, subtree: true});
}
async function sendNextMessageFromBuffer(){
    const { buffer } = await chrome.storage.local.get({ buffer: [] });

    if(!buffer.lenght) {
        console.log("Buffer je prázdný");
        return;
    }
    const nextMessage = buffer[0];

    const inputBox = document.querySelector("textarea");
    const sendButton = document.querySelector('button[data-testid="send-button"]');

    if (!inputBox || !sendButton) {
        console.warm("Nelze najít input nebo tlačítko");
        return;
    }

    inputBox.focus();
    inputBox.value = nextMessage;
    inputBox.dispatchEvent(new Event("input", {bubbles: true}));

    sendButton.click();

    buffer.shift();
    await chrome.storage.local.set({ buffer });

    waitForResponseToFinish(() => {
    console.log("Odpověď hotová. Posílám další zprávu...");
    sendNextMessageFromBuffer();
    });
    window.sendNextMessageFromBuffer = sendNextMessageFromBuffer;

    console.log("✅ content.js běží haha");
}
console.log("✅ content.js běží");