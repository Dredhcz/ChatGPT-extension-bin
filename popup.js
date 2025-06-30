refreshMessageList()
document.getElementById("save").addEventListener("click", async () => {
  const textarea = document.getElementById("message");
  const text = textarea.value.trim();

  if(text){
    let { buffer } = await chrome.storage.local.get({ buffer: [] });
    buffer.push(text);
    await chrome.storage.local.set({buffer});
    textarea.value = "";

    alert(buffer);
    refreshMessageList();
    
  }
});
async function refreshMessageList(){
  const { buffer } = await chrome.storage.local.get({ buffer: [] });
  const list = document.getElementById("message-list");


  list.innerHTML = "";

  buffer.forEach((msg, index) => {
    const li = document.createElement("li");
    li.textContent = msg;
    list.appendChild(li);
  })
}
async function deleteFirstElement(){
  let { buffer } = await chrome.storage.local.get({ buffer: [] });
  buffer.shift();
  await chrome.storage.local.set({buffer});
  refreshMessageList();
}

document.getElementById("delete").addEventListener("click", async () => {
  buffer = [];
  await chrome.storage.local.set({buffer});
  refreshMessageList();
});

document.getElementById("start-auto").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: () => {
      window.sendNextMessageFromBuffer?.();
    }
  })
  })

  

  
