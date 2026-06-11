(function() {
    function connColor(val) {
        const map = { 'VERY_LIKELY': '#1a8a3f', 'LIKELY': '#4a90d9', 'POSSIBLE': '#c07a1a' };
        return map[val] || '#666';
    }

    function formatConn(val) {
        return (val || '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    function mkPill(val) {
        const c = connColor(val);
        const b = document.createElement('span');
        b.textContent = formatConn(val);
        b.style.cssText = `display:inline-block;background:${c};color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px;`;
        return b;
    }

    function buildJourneyCard(j, journeyNames, subjourneyNames) {
        const card = document.createElement('div');
        card.style.cssText = 'margin-bottom:12px;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.08);overflow:hidden;';

        const head = document.createElement('div');
        head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f8f9fb;border-bottom:1px solid #eee;';

        const jName = document.createElement('span');
        jName.style.cssText = 'font-size:12px;font-weight:700;color:#333;';
        jName.textContent = journeyNames[j.id] || j.id;

        head.appendChild(jName);
        head.appendChild(mkPill(j.connection));
        card.appendChild(head);

        const body = document.createElement('div');
        body.style.cssText = 'padding:4px 12px;';

        if (j.communities && j.communities.length > 0) {
            j.communities.forEach((c, ci) => {
                const last = ci === j.communities.length - 1;
                const cc = connColor(c.connection);
                const cw = Math.max(c.connectionPercent, 2);

                const row = document.createElement('div');
                row.style.cssText = `display:flex;align-items:center;padding:6px 0;${last ? '' : 'border-bottom:1px solid #f5f5f5;'}`;

                const track = document.createElement('div');
                track.style.cssText = 'width:80px;min-width:80px;height:8px;background:#eef1f5;border-radius:4px;margin-right:10px;overflow:hidden;';

                const fill = document.createElement('div');
                fill.style.cssText = `height:100%;width:${cw}%;background:${cc};border-radius:4px;transition:width .4s;`;
                track.appendChild(fill);

                const lab = document.createElement('span');
                lab.style.cssText = 'flex:1;font-size:12px;color:#444;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
                lab.textContent = subjourneyNames[c.id] || c.id;

                const pct = document.createElement('span');
                pct.style.cssText = 'font-size:12px;font-weight:700;color:#111;min-width:32px;text-align:right;margin-left:6px;';
                pct.textContent = `${c.connectionPercent}%`;

                row.appendChild(track);
                row.appendChild(lab);
                row.appendChild(pct);
                body.appendChild(row);
            });
        }

        card.appendChild(body);
        return card;
    }

    function buildJourneyList(journeysData, journeyNames, subjourneyNames, showHeading) {
        const c = document.createElement('div');
        if (!journeysData || journeysData.length === 0) return c;

        if (showHeading) {
            const t = document.createElement('h2');
            t.textContent = 'Journeys';
            t.style.cssText = 'font-size:16px;font-weight:700;margin:0 0 12px;color:#222;';
            c.appendChild(t);
        }

        for (const j of journeysData) {
            c.appendChild(buildJourneyCard(j, journeyNames, subjourneyNames));
        }
        return c;
    }

    window.buildJourneysUI = function(journeysData, journeyNames, subjourneyNames) {
        return buildJourneyList(journeysData, journeyNames, subjourneyNames, true);
    };

    window.buildJourneysPageUI = function(journeysData, journeyNames, subjourneyNames, targetEl) {
        const target = targetEl || document.querySelector('div[data-testid="journeys-results-area"]');
        if (!target) return null;
        const container = buildJourneyList(journeysData, journeyNames, subjourneyNames, false);
        target.innerHTML = '';
        target.appendChild(container);
        return target;
    };
})();
