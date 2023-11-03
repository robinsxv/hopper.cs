chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url.includes("steamcommunity.com")) {
        // Send a message to the content script
        chrome.tabs.sendMessage(tabId, {
            skinHash: tab.url.split('730/')[1]
        });
        console.log("Injecting content script into market.");
    }
});