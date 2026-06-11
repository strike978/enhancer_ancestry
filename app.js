(function() {
    'use strict';

    const journeyNames = {};
    const subjourneyNames = {};

    function spinnerHTML() {
        return `<div style="display:flex;align-items:center;justify-content:center;padding:40px;color:#666;font-family:sans-serif;">
            <div style="width:20px;height:20px;border:3px solid #e0e0e0;border-top-color:#4a90d9;border-radius:50%;animation:enhancer-spin .6s linear infinite;margin-right:12px;"></div>
            <span>Loading enhanced data...</span>
            <style>@keyframes enhancer-spin{to{transform:rotate(360deg)}}</style>
        </div>`;
    }

    function loadLookups() {
        return new Promise(resolve => chrome.runtime.sendMessage({ type: 'getLookups' }, resolve));
    }

    function buildJourneyData(branches) {
        return branches.map(b => ({
            id: b.id,
            connection: b.connection,
            connectionPercent: b.connectionPercent,
            communities: b.communities.map(c => ({
                id: c.id,
                connection: c.connection,
                connectionPercent: c.connectionPercent
            }))
        }));
    }

    function initRegions(ethnicity, lookups) {
        const regionsData = lookups?.regions || { items: [] };
        const regionNames = {};
        for (const item of regionsData.items || []) {
            regionNames[item.region] = item.name;
        }

        const regions = ethnicity.regions.map(r => ({
            key: r.key,
            lowerConfidence: r.lowerConfidence,
            macroRegionKey: r.macroRegionKey,
            percentage: r.percentage,
            upperConfidence: r.upperConfidence
        }));

        window.buildRegionsUI({ regions }, regionNames);
    }

    function initJourneys(branches, lookups) {
        for (const [key, val] of Object.entries(lookups?.journeys || {})) {
            journeyNames[key] = val.name;
            if (val.subjourneys) {
                for (const [sk, sn] of Object.entries(val.subjourneys)) {
                    subjourneyNames[sk] = sn;
                }
            }
        }

        const journeys = buildJourneyData(branches);
        window.buildJourneysPageUI(journeys, journeyNames, subjourneyNames);
    }

    function run() {
        const loc = window.location.href;
        const isRegions = /^https:\/\/www\.ancestry\.[a-z.]+\/dna\/origins\/[^/]+\/regions/.test(loc);
        const isJourneys = /^https:\/\/www\.ancestry\.[a-z.]+\/dna\/origins\/[^/]+\/journeys/.test(loc);
        if (!isRegions && !isJourneys) return;

        document.querySelector('#enhancer-spinner')?.remove();
        document.querySelector('#enhancer-ancestry-regions')?.remove();

        const selector = isRegions ? 'ul.macroRegions' : 'div[data-testid="journeys-results-area"]';
        const target = document.querySelector(selector);

        if (!target) {
            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    showSpinnerAndFetch(el, isRegions);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => observer.disconnect(), 15000);
            return;
        }

        showSpinnerAndFetch(target, isRegions);
    }

    function showSpinnerAndFetch(target, isRegions) {
        const parent = target.parentNode;
        const placeholder = document.createElement('div');
        placeholder.id = 'enhancer-spinner';
        placeholder.innerHTML = spinnerHTML();
        target.style.display = 'none';
        parent.insertBefore(placeholder, target.nextSibling);

        const testId = (window.location.pathname.match(/\/dna\/origins\/([^/]+)\//) || [])[1];
        if (!testId) return;
        const baseUrl = `${window.location.origin}/dna/origins/secure/tests/${testId}`;

        setTimeout(() => {
            const promises = [loadLookups()];
            if (isRegions) {
                promises.unshift(fetch(`${baseUrl}/v2/ethnicity`, { credentials: 'include' }).then(r => r.json()));
            } else {
                promises.unshift(fetch(`${baseUrl}/branches`, { credentials: 'include' }).then(r => r.json()));
            }

            Promise.all(promises).then(results => {
                placeholder.remove();
                target.style.display = '';
                if (isRegions) {
                    initRegions(results[0], results[1]);
                } else {
                    initJourneys(results[0], results[1]);
                }
            }).catch(err => {
                console.error('OriginsHelper: failed', err);
                placeholder.innerHTML = `<div style="padding:20px;color:#c00;font-family:sans-serif;">Failed to load data. Check console.</div>`;
            });
        }, 800);
    }

    run();
})();
