importScripts('ExtPay.js');
const extpay = ExtPay('promptqueue');
extpay.startBackground();

console.log("✅ background.js běží");

extpay.getUser().then(user => {
	console.log(user);
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "refresh") {
    chrome.runtime.sendMessage({ action: "updatePopup", buffer: request.buffer || [] });
    sendResponse({ status: "ok" });
  }

  if (request.action === "startAutoSend") {
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
    return true; // async response
  }

  if (request.action === "checkLicense") {
    extpay.getUser().then(user => {
      sendResponse({ paid: user.paid });
    }).catch(err => {
      console.error("❌ Chyba při kontrole licence", err);
      sendResponse({ paid: false });
    });
    return true; // async response
  }
  if (request.action === "openPaymentPage") {
    extpay.openPaymentPage();
    sendResponse({ status: "opened" });
  }
});
