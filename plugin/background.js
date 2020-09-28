// Shared background instance
const metabolic = METABOLIC.create(self);

// When a tab is activated
chrome.tabs.onActivated.addListener(function(activated) {
    metabolic.logTabSwitch(activated);
});

chrome.tabs.onCreated.addListener(function(tab) {
    metabolic._updateMetaTab(tab);
    metabolic._cacheValid = false;
});

// When a tab is removed
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    metabolic.removeTab(tabId);
});

// When a window is removed
chrome.windows.onRemoved.addListener(function(windowId) {
    metabolic._cacheValid = false;
});

// When window focus changes
chrome.windows.onFocusChanged.addListener(function(window_id) {
    if (window_id == chrome.windows.WINDOW_ID_NONE) {
        return;
    }

    chrome.tabs.query({active: true, windowId: window_id}, function(tabs) {
        if (tabs[0]) {
            console.log("log tab switch from window", tabs);
            metabolic.logTabSwitch(tabs[0]);
        }
    });
});

chrome.runtime.onStartup.addListener(function() { metabolic.init(); });

// https://developer.chrome.com/extensions/webNavigation
chrome.webNavigation.onCommitted.addListener(function(details) {
    if (details.transitionType.indexOf("subframe") == -1) {
        metabolic.refreshTab(details.tabId);
    }
});