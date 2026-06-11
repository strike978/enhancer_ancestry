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
}];

chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId !== 0) return;
    inject(details.tabId);
}, { url: urlPatterns });

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId !== 0) return;
    inject(details.tabId);
}, { url: urlPatterns });
