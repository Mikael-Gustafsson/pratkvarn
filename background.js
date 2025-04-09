chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content-script.js"]
  });

  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ["style.css"]
  });
});
