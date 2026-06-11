let lookupCache = null;

async function getLookups() {
    if (lookupCache) return lookupCache;
    const [regions, journeys] = await Promise.all([
        fetch(chrome.runtime.getURL('regions.json')).then(r => r.json()),
        fetch(chrome.runtime.getURL('journeys.json')).then(r => r.json())
    ]);
    lookupCache = { regions, journeys };
    return lookupCache;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'getLookups') {
        getLookups().then(data => sendResponse(data));
        return true;
    }
    if (msg.type === 'getToggleState') {
        chrome.storage.local.get('enabled', data => sendResponse(data.enabled !== false));
        return true;
    }
});

function inject(tabId) {
    chrome.scripting.executeScript({
        target: { tabId },
        files: ['regions.js', 'journeys.js', 'app.js']
    }).catch(() => {});
}

const urlPatterns = [{
    originAndPathMatches: '^https://www\\.ancestry\\.[a-z.]+/dna/origins/[^/]+/regions'
}, {
    originAndPathMatches: '^https://www\\.ancestry\\.[a-z.]+/dna/origins/[^/]+/journeys'
}, {
    originAndPathMatches: '^https://www\\.ancestry\\.[a-z.]+/discoveryui-matches/compare/[^/]+/with/'
}, {
    originAndPathMatches: '^https://www\\.ancestry\\.[a-z.]+/dna/matches/[^/]+/compare/[^/]+'
}];

chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId !== 0) return;
    chrome.storage.local.get('enabled', data => {
        if (data.enabled !== false) inject(details.tabId);
    });
}, { url: urlPatterns });

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId !== 0) return;
    chrome.storage.local.get('enabled', data => {
        if (data.enabled !== false) inject(details.tabId);
    });
}, { url: urlPatterns });

// Toggle on/off via toolbar icon
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ enabled: true });
    updateBadge(true);
});
// Set badge on service worker startup
chrome.storage.local.get('enabled', data => { updateBadge(data.enabled !== false); });

chrome.action.onClicked.addListener((tab) => {
    chrome.storage.local.get('enabled', data => {
        const newState = data.enabled === false;
        chrome.storage.local.set({ enabled: newState });
        updateBadge(newState);
        // Reload current page to apply/remove changes
        if (tab.id) chrome.tabs.reload(tab.id);
    });
});

function updateBadge(enabled) {
    if (enabled) {
        chrome.action.setBadgeText({ text: 'ON' });
        chrome.action.setBadgeBackgroundColor({ color: '#1a8a3f' });
    } else {
        chrome.action.setBadgeText({ text: 'OFF' });
        chrome.action.setBadgeBackgroundColor({ color: '#c00' });
    }
}
