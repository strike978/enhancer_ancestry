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
        return Promise.race([
            new Promise(resolve => chrome.runtime.sendMessage({ type: 'getLookups' }, resolve)),
            new Promise(resolve => setTimeout(() => resolve({ regions: { items: [] }, journeys: {} }), 3000))
        ]);
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

    function initRegions(ethnicity, lookups, targetEl) {
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

        window.buildRegionsUI({ regions }, regionNames, targetEl);
    }

    function initJourneys(branches, lookups, targetEl) {
        for (const [key, val] of Object.entries(lookups?.journeys || {})) {
            journeyNames[key] = val.name;
            if (val.subjourneys) {
                for (const [sk, sn] of Object.entries(val.subjourneys)) {
                    subjourneyNames[sk] = sn;
                }
            }
        }

        const journeys = buildJourneyData(branches);
        window.buildJourneysPageUI(journeys, journeyNames, subjourneyNames, targetEl);
    }

    function run() {
        // Skip if extension is toggled off
        chrome.storage.local.get('enabled', data => {
            if (data.enabled === false) return;
            doRun();
        });
    }

    function doRun() {
        const loc = window.location.href;
        const isRegions = /^https:\/\/www\.ancestry\.[a-z.]+\/dna\/origins\/[^/]+\/regions/.test(loc);
        const isJourneys = /^https:\/\/www\.ancestry\.[a-z.]+\/dna\/origins\/[^/]+\/journeys/.test(loc);
        const isMatchCompare = /^https:\/\/www\.ancestry\.[a-z.]+\/dna\/matches\/([^/]+)\/compare\/([^/]+)/.test(loc);

        if (!isRegions && !isJourneys && !isMatchCompare) return;

        if (isMatchCompare) {
            initMatchCompare();
            return;
        }

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

    function initMatchCompare() {
        const match = window.location.pathname.match(/\/dna\/matches\/([^/]+)\/compare\/([^/]+)/);
        if (!match) return;
        const testId = match[1];
        const matchId = match[2];

        // Replace the ethnicity section with a wrapper that holds both ethnicity and communities divs
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (attempts > 30) { clearInterval(interval); return; }

            const es = document.querySelector('section.ethnicityComparisonChart.flex-1.w-100');
            if (es && !document.getElementById('enhancer-compare-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.id = 'enhancer-compare-wrapper';

                const ethDiv = document.createElement('div');
                ethDiv.id = 'enhancer-compare-ethnicity';
                ethDiv.style.cssText = 'margin:16px 0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
                ethDiv.innerHTML = spinnerHTML();

                const comDiv = document.createElement('div');
                comDiv.id = 'enhancer-compare-communities';
                comDiv.style.cssText = 'margin:16px 0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
                comDiv.innerHTML = spinnerHTML();

                wrapper.appendChild(ethDiv);
                wrapper.appendChild(comDiv);
                es.parentNode?.replaceChild(wrapper, es);
            }

            if (document.getElementById('enhancer-compare-wrapper')) {
                clearInterval(interval);
                setTimeout(() => {
                    const ethnicityEl = document.getElementById('enhancer-compare-ethnicity');
                    const communitiesEl = document.getElementById('enhancer-compare-communities');

                    // Fetch lookups + ethnicity, then 1s delay, then communities
                    loadLookups().then(lookups => {
                        fetch(`${window.location.origin}/dna/origins/secure/compare/${testId}/batchEthnicity`, {
                            method: 'PUT', credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify([matchId])
                        }).then(r => {
                            if (!r.ok) throw new Error(`HTTP ${r.status}`);
                            return r.json().then(j => { const inner = j[Object.keys(j)[0]]; return inner.regions || []; });
                        }).then(regions => {
                            if (ethnicityEl) initRegions({ regions }, lookups, ethnicityEl);
                            // Wait 1s then fetch communities
                            setTimeout(() => {
                                fetch(`${window.location.origin}/dna/origins/secure/compare/${testId}/batchCommunities`, {
                                    method: 'POST', credentials: 'include',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify([matchId])
                                }).then(r => {
                                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                                    return r.json().then(j => { const inner = j[Object.keys(j)[0]]; return inner.branches || []; });
                                }).then(branches => {
                                    if (communitiesEl) initJourneys(branches, lookups, communitiesEl);
                                }).catch(err => console.error('[EA] communities fetch failed:', err.message));
                            }, 1000);
                        }).catch(err => console.error('[EA] ethnicity fetch failed:', err.message));
                    });
                }, 800);
            }
        }, 500);
    }

    run();
})();
