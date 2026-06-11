(function() {
    function formatKey(k) {
        return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    window.buildRegionsUI = function(ethnicityData, regionNames) {
        const id = 'enhancer-ancestry-regions';
        document.querySelector(`#${id}`)?.remove();

        const el = document.querySelector('ul.macroRegions');
        if (!el) return null;

        const root = document.createElement('div');
        root.id = id;
        root.style.cssText = 'padding:12px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

        const groups = {};
        for (const r of ethnicityData.regions) {
            const k = r.macroRegionKey || 'Other';
            if (!groups[k]) groups[k] = [];
            groups[k].push(r);
        }

        const sorted = Object.entries(groups)
            .map(([k, rs]) => ({ k, rs: rs.sort((a, b) => b.percentage - a.percentage), total: rs.reduce((s, r) => s + r.percentage, 0) }))
            .sort((a, b) => b.total - a.total);

        sorted.forEach(({ k, rs, total }) => {
            const card = document.createElement('div');
            card.style.cssText = 'margin-bottom:12px;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.08);overflow:hidden;';

            const head = document.createElement('div');
            head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f8f9fb;border-bottom:1px solid #eee;';

            const name = document.createElement('span');
            name.style.cssText = 'font-size:12px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.4px;';
            name.textContent = formatKey(k);

            const pill = document.createElement('span');
            pill.textContent = `${total}%`;
            pill.style.cssText = 'display:inline-block;background:#4a90d9;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px;';

            head.appendChild(name);
            head.appendChild(pill);
            card.appendChild(head);

            const body = document.createElement('div');
            body.style.cssText = 'padding:4px 12px;';

            rs.forEach((r, ri) => {
                const last = ri === rs.length - 1;
                const rName = regionNames[r.key] || r.key;
                const w = Math.max(r.percentage, 2);

                const row = document.createElement('div');
                row.style.cssText = `display:flex;align-items:center;padding:6px 0;${last ? '' : 'border-bottom:1px solid #f5f5f5;'}`;

                const track = document.createElement('div');
                track.style.cssText = 'width:80px;min-width:80px;height:8px;background:#eef1f5;border-radius:4px;margin-right:10px;overflow:hidden;';

                const fill = document.createElement('div');
                fill.style.cssText = `height:100%;width:${w}%;background:#4a90d9;border-radius:4px;transition:width .4s;`;
                track.appendChild(fill);

                const lab = document.createElement('span');
                lab.style.cssText = 'flex:1;font-size:12px;color:#444;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
                lab.textContent = rName;

                const pct = document.createElement('span');
                pct.style.cssText = 'font-size:12px;font-weight:700;color:#111;min-width:32px;text-align:right;';
                pct.textContent = `${r.percentage}%`;

                const rng = document.createElement('span');
                rng.style.cssText = 'font-size:11px;font-weight:500;color:#666;margin-left:6px;min-width:50px;text-align:right;';
                rng.textContent = `(${r.lowerConfidence}% – ${r.upperConfidence}%)`;

                row.appendChild(track);
                row.appendChild(lab);
                row.appendChild(pct);
                row.appendChild(rng);
                body.appendChild(row);
            });

            card.appendChild(body);
            root.appendChild(card);
        });

        el.replaceWith(root);
        return root;
    };
})();
