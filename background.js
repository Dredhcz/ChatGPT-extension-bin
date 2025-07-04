console.log("background.js běží");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "refresh") {
    // Přepošli zprávu popupu, pokud je otevřený
    chrome.runtime.sendMessage({ action: "updatePopup", buffer: request.buffer || [] });
    sendResponse({ status: "ok" });
  }

  if (request.action === "startAutoSend") {
    // Reinjektuj content.js na aktivní tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        sendResponse({ status: "no-active-tab" });
        return;
      }
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content.js']
      }).then(() => {
        sendResponse({ status: "content-injected" });
      }).catch(err => {
        console.error("Injection failed", err);
        sendResponse({ status: "injection-failed" });
      });
    });
    return true; // říká, že odpověď přijde asynchronně
  }
});
