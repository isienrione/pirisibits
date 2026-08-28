/* Gate 2E — Santiago Route Lab client UI (embedded payload in DATA global). */
(function () {
  const DATA = window.__ROUTE_LAB_DATA__;
  if (!DATA) {
    document.body.innerHTML = '<p>Route Lab payload missing. Run npm run gate:2e:build</p>';
    return;
  }

  const state = {
    fixtureId: DATA.defaultFixtureId || 'F2',
    candidateRouteId: null,
    selectedStopStgoId: null,
    panel: 'timeline',
  };

  function q(id) { return document.getElementById(id); }
  function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function readUrl() {
    const p = new URLSearchParams(location.search);
    if (p.get('fixture') && DATA.results[p.get('fixture')]) state.fixtureId = p.get('fixture');
    if (p.get('candidate')) state.candidateRouteId = p.get('candidate');
    if (p.get('stop')) state.selectedStopStgoId = p.get('stop');
  }

  function writeUrl() {
    const p = new URLSearchParams();
    p.set('fixture', state.fixtureId);
    if (state.candidateRouteId) p.set('candidate', state.candidateRouteId);
    if (state.selectedStopStgoId) p.set('stop', state.selectedStopStgoId);
    history.replaceState(null, '', location.pathname + '?' + p.toString());
  }

  function currentResult() { return DATA.results[state.fixtureId]; }

  function currentReranked() {
    const r = currentResult();
    if (!r) return null;
    if (!state.candidateRouteId) return r.reranked.find(x => x.rerankedRank === 1) || r.reranked[0];
    return r.reranked.find(x => x.routeId === state.candidateRouteId) || r.reranked[0];
  }

  function projectPoints(stops) {
    const pts = stops.map(s => DATA.coordinates[s.stgoId]).filter(Boolean);
    if (!pts.length) return [];
    const lats = pts.map(p => p.lat), lngs = pts.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const latSpan = Math.max(maxLat - minLat, 0.001), lngSpan = Math.max(maxLng - minLng, 0.001);
    const W = 520, H = 320, pad = 28;
    return stops.map(s => {
      const c = DATA.coordinates[s.stgoId];
      if (!c) return null;
      return {
        stgoId: s.stgoId,
        x: pad + ((c.lng - minLng) / lngSpan) * (W - pad * 2),
        y: pad + (1 - (c.lat - minLat) / latSpan) * (H - pad * 2),
        n: s.sequenceIndex + 1,
        selected: s.stgoId === state.selectedStopStgoId,
      };
    }).filter(Boolean);
  }

  function renderMap(entry) {
    const stops = entry.candidate.orderedStops;
    const pts = projectPoints(stops);
    let svg = '<svg viewBox="0 0 520 320" class="map-svg">';
    svg += '<rect width="520" height="320" fill="#eef2f7"/>';
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i-1], b = pts[i];
      const seg = entry.mapSegments[i-1];
      const metro = seg && seg.mode === 'METRO';
      svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${metro?'#7c3aed':'#64748b'}" stroke-width="2" stroke-dasharray="${metro?'6 4':'4 4'}" opacity="0.85"/>`;
    }
    pts.forEach(p => {
      const fill = p.selected ? '#0f766e' : '#dc2626';
      svg += `<circle cx="${p.x}" cy="${p.y}" r="11" fill="${fill}" stroke="#fff" stroke-width="2" data-stop="${p.stgoId}" class="map-stop"/>`;
      svg += `<text x="${p.x}" y="${p.y+4}" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">${p.n}</text>`;
    });
    svg += '</svg>';
    svg += '<div class="map-note">Segments use sparse adjacency only — no polyline geometry. Dashed links are diagnostic, not routed paths.</div>';
    if (DATA.results[state.fixtureId].stgo104Diagnostic && !DATA.results[state.fixtureId].stgo104Diagnostic.presentInRoute) {
      const c104 = DATA.coordinates.STGO_104;
      if (c104) {
        svg += `<div class="map-note warn">STGO_104 omitted (${esc(DATA.results[state.fixtureId].stgo104Diagnostic.omissionReason || 'PHYSICAL_STATUS_PENDING')}) — not in routed path.</div>`;
      }
    }
    q('mapHost').innerHTML = svg;
    q('mapHost').querySelectorAll('.map-stop').forEach(el => {
      el.addEventListener('click', () => { state.selectedStopStgoId = el.getAttribute('data-stop'); writeUrl(); render(); });
    });
  }

  function renderCandidates(r) {
    q('candidateCards').innerHTML = r.reranked.map(entry => {
      const c = entry.candidate;
      const win = entry.rerankedRank === 1;
      const sel = currentReranked()?.routeId === entry.routeId;
      return `<button type="button" class="cand-card ${win?'winner':''} ${sel?'selected':''}" data-route="${entry.routeId}">
        <div class="cand-head"><strong>#${entry.rerankedRank} reranked</strong> <span class="muted">composer #${entry.originalComposerRank}</span> ${win?'<span class="pill win">WINNER</span>':''}</div>
        <div class="cand-metrics">${entry.rankChange?`<span class="${entry.rankChange>0?'up':'down'}">${entry.rankChange>0?'+':''}${entry.rankChange} rank</span>`:''}
          ${c.stopCount} stops · ${c.totalEstimatedMin} min · Δ${c.budgetDeltaMin}m</div>
        <div class="cand-scores">Comp ${entry.composerProvisionalScore} · Arc ${entry.arcQualityScore} · Rerank ${entry.rerankedScore}</div>
        <div class="cand-meta">A/P/M ${c.anchorCount}/${c.thematicPocketCount}/${c.microRevealCount} · ${(c.dominantThemes||[]).join(', ')}</div>
        <div class="cand-tags">${(entry.shapeSummary.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
        ${(c.warnings||[]).length?`<div class="warn-sm">${esc(c.warnings[0])}</div>`:''}
      </button>`;
    }).join('');
    q('candidateCards').querySelectorAll('.cand-card').forEach(btn => {
      btn.onclick = () => { state.candidateRouteId = btn.dataset.route; state.selectedStopStgoId = null; writeUrl(); render(); };
    });
  }

  function renderTimeline(entry) {
    const rows = entry.candidate.orderedStops.map((s, i) => {
      const role = entry.positionRoles.find(r => r.stgoId === s.stgoId)?.role || '—';
      const letter = entry.ribbon.split(' — ')[i] || '·';
      return `<div class="stop-row ${s.stgoId===state.selectedStopStgoId?'sel':''}" data-stop="${s.stgoId}">
        <div class="stop-num">${i+1}</div>
        <div class="stop-body">
          <div><strong>${esc(s.stgoId)}</strong> ${esc(s.name)} <span class="pill">${letter}</span> <span class="pill">${esc(role)}</span></div>
          <div class="muted">NU ${s.nodeUtility} · dwell ${s.estimatedDwellMin}m · move ${s.transitionTimeMin}m · cum ${s.cumulativeTimeMin}m</div>
          ${i>0?`<div class="muted">← ${esc(s.narrativeRelationFromPrevious)} · edge ${s.narrativeEdgeScore ?? '—'}</div>`:''}
          <div class="explain">${esc(s.inclusionExplanation.slice(0,160))}${s.inclusionExplanation.length>160?'…':''}</div>
        </div>
      </div>`;
    }).join('');
    q('timelineHost').innerHTML = rows;
    q('timelineHost').querySelectorAll('.stop-row').forEach(row => {
      row.onclick = () => { state.selectedStopStgoId = row.dataset.stop; writeUrl(); render(); };
    });
  }

  function renderStopInspector(entry) {
    const s = entry.candidate.orderedStops.find(x => x.stgoId === state.selectedStopStgoId);
    if (!s) { q('stopInspector').innerHTML = '<p class="muted">Select a stop on the map or timeline.</p>'; return; }
    const ctx = currentResult().nodeContextByStgoId[s.stgoId] || {};
    const sem = ctx.semantic;
    const role = entry.positionRoles.find(r => r.stgoId === s.stgoId);
    q('stopInspector').innerHTML = `
      <h3>${esc(s.name)} <span class="muted">${esc(s.stgoId)}</span></h3>
      <details open><summary>Identity</summary>
        <p>Commune: ${esc(sem?.commune || '—')} · Launch: ${sem?.launchCorpus ?? '—'} · Provenance: ${esc(sem?.inventoryProvenance || '—')}</p>
        <p><a href="/docs/engine/gate-2a1-founder-calibration-cockpit.html?stgoId=${encodeURIComponent(s.stgoId)}" target="_blank">Open in Curator ↗</a></p>
      </details>
      <details><summary>Route fit</summary>
        <p>Role: ${esc(role?.role)} — ${esc(role?.rationale || '')}</p>
        <p>NodeUtility ${s.nodeUtility} (editorial ${s.nodeUtilityBreakdown.editorial.score}, interests ${s.nodeUtilityBreakdown.interests.score})</p>
        <p>${esc(s.inclusionExplanation)}</p>
      </details>
      <details><summary>Transition</summary>
        <p>Mode: ${esc(s.arrivalMode)} · ${s.transitionTimeMin} min · ${s.transition?.explanation ? esc(s.transition.explanation.slice(0,200)) : '—'}</p>
        <p>Relation: ${esc(s.narrativeRelationFromPrevious)} · Score: ${s.narrativeEdgeScore ?? '—'}</p>
      </details>
      <details><summary>Semantics (T1A–T9 sample)</summary>
        <p>${sem ? Object.entries(sem.thematicVector||{}).slice(0,5).map(([k,v])=>k+':'+v).join(' · ') : '—'}</p>
      </details>`;
  }

  function renderArc(entry) {
    const pos = entry.arcDisplay.filter(r => r.kind === 'positive');
    const pen = entry.arcDisplay.filter(r => r.kind === 'penalty' && r.value > 0.02);
    q('arcInspector').innerHTML = `
      <div class="arc-summary">ArcQuality <strong>${entry.arcQualityScore}</strong> · raw ${entry.arcQuality.normalizedScore} · weighted +${entry.arcQuality.weightedPositiveSum} −${entry.arcQuality.weightedPenaltySum}</div>
      <div class="two-col">
        <div><h4>Positive</h4>${pos.map(r=>`<div class="arc-row"><span>${esc(r.key)}</span><span>${r.value} × ${r.weight} = ${r.contribution}</span></div>`).join('')}</div>
        <div><h4>Penalties</h4>${pen.length?pen.map(r=>`<div class="arc-row warn"><span>${esc(r.key)}</span><span>${r.value} × ${r.weight} = ${r.contribution}</span></div>`).join(''):'<p class="muted">No significant penalties</p>'}</div>
      </div>
      <p class="muted">${esc(entry.arcQuality.timeUtilizationReason)}</p>`;
  }

  function renderDiagnostics(entry) {
    q('diagPanel').innerHTML = entry.diagnostics.map(d => {
      const lab = d.severity==='SEVERE'||d.severity==='MODERATE'?'STRONG WARNING':d.severity==='MILD'?'WARNING':'INFO';
      return `<div class="diag ${lab.replace(' ','-')}"><strong>${esc(d.code)}</strong> <span class="pill">${lab}</span>
        <div>${esc(d.explanation)}</div><div class="muted">value=${d.value} threshold=${d.threshold}</div></div>`;
    }).join('');
  }

  function renderOmissions(entry) {
    const om = entry.candidate.omittedHighUtilityNodes.slice(0, 12);
    q('omitPanel').innerHTML = om.length ? om.map(o => `<div class="omit"><strong>${esc(o.stgoId)}</strong> ${esc(o.displayName||'')} · NU ${o.nodeUtility ?? '—'}
      <div class="warn-sm">${esc(o.reasonCode)} — ${esc(o.message)}</div></div>`).join('') : '<p class="muted">No high-utility omissions recorded.</p>';
  }

  function renderRerankCompare(r) {
    const banner = r.winnerChanged ? `<div class="banner-win">WINNER CHANGED BY ARC RERANKER — ${esc(r.winnerChangeExplanation||'')}</div>` : '';
    q('rerankPanel').innerHTML = banner + r.reranked.map(e => `<div class="rerow">
      <strong>${esc(e.routeId.slice(-24))}</strong> composer #${e.originalComposerRank} → rerank #${e.rerankedRank} (${e.rankChange>0?'+':''}${e.rankChange})
      · comp ${e.composerProvisionalScore} arc ${e.arcQualityScore} rerank ${e.rerankedScore}
      <div class="muted">${esc(e.rerankExplanation.rankChangeReason)}</div></div>`).join('');
  }

  function renderCompare(r) {
    q('comparePanel').innerHTML = r.comparison.map(p => `<div class="cmp"><strong>A↔B</strong> sim ${p.similarity.toFixed(2)} · stop ${p.stopOverlap.toFixed(2)} · ordered ${p.orderedOverlap.toFixed(2)} · time Δ${p.timeDiff} · score Δ${p.scoreDiff.toFixed(1)}</div>`).join('') +
      `<div class="muted">Shared stops: ${(r.sharedStops.shared||[]).join(', ')||'—'}</div>`;
  }

  function renderRhythms(entry) {
    q('ribbonHost').innerHTML = `<div class="ribbon">${esc(entry.ribbon)}</div>
      <div class="muted">Longest runs — anchor ${entry.structuralRuns.anchor} · pocket ${entry.structuralRuns.pocket} · micro ${entry.structuralRuns.micro}</div>`;
    q('themeHost').innerHTML = entry.themeProgression.map((t,i)=>`<span class="chip">${i+1}:${esc(t)}</span>`).join(' → ');
    q('relationHost').innerHTML = entry.relationProgression.filter((_,i)=>i>0).map((r,i)=>`<span class="chip ${entry.relationRun.run>=3&&r.relation===entry.relationRun.relation?'rep':''}">${esc(r.relation||'—')}</span>`).join(' → ');
  }

  function renderTimeBar(entry) {
    const t = entry.timeBreakdown;
    const total = t.timeBudgetMin;
    const usedPct = Math.min(100, (t.totalEstimatedMin / total) * 100);
    const movePct = (t.movementMin / total) * 100;
    const dwellPct = (t.dwellMin / total) * 100;
    q('timeBar').innerHTML = `<div class="tbar"><div class="t-move" style="width:${movePct}%"></div><div class="t-dwell" style="width:${dwellPct}%"></div><div class="t-unused" style="width:${Math.max(0,100-usedPct)}%"></div></div>
      <div class="muted">Move ${t.movementMin}m · Dwell ${t.dwellMin}m · Used ${t.totalEstimatedMin}/${total}m · Unused ${t.unusedMin}m · tol ±${t.toleranceMin}m ${t.metroUsed?'· Metro':''}</div>`;
  }

  function renderControls() {
    const fx = DATA.fixtures.find(f => f.id === state.fixtureId) || DATA.fixtures[0];
    q('fixtureSelect').innerHTML = DATA.fixtures.map(f => `<option value="${f.id}" ${f.id===state.fixtureId?'selected':''}>${esc(f.label)}</option>`).join('');
    q('fixtureDesc').textContent = fx.description + (fx.watchNote ? ' · WATCH: ' + fx.watchNote : '');
    q('reqSummary').innerHTML = `<pre class="req-pre">${esc(JSON.stringify(currentResult()?.request||{}, null, 2))}</pre>`;
  }

  async function runLive() {
    try {
      const res = await fetch('/api/run', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ fixtureId: state.fixtureId }) });
      if (!res.ok) throw new Error('run failed');
      const json = await res.json();
      DATA.results[state.fixtureId] = json;
      state.candidateRouteId = null;
      render();
    } catch (e) {
      alert('Live run requires npm run gate:2e:serve (embedded fixture data still available).');
    }
  }

  function exportSnapshot() {
    const entry = currentReranked();
    const payload = { exportedAt: new Date().toISOString(), fixtureId: state.fixtureId, result: currentResult(), selected: entry };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `route-lab-${state.fixtureId}-${Date.now()}.json`;
    a.click();
  }

  function render() {
    const r = currentResult();
    if (!r) return;
    if (!state.candidateRouteId && r.topRerankedRouteId) state.candidateRouteId = r.topRerankedRouteId;
    const entry = currentReranked();
    if (!entry) return;
    renderControls();
    renderCandidates(r);
    renderMap(entry);
    renderTimeline(entry);
    renderStopInspector(entry);
    renderArc(entry);
    renderDiagnostics(entry);
    renderOmissions(entry);
    renderRerankCompare(r);
    renderCompare(r);
    renderRhythms(entry);
    renderTimeBar(entry);
    writeUrl();
  }

  q('fixtureSelect').onchange = e => { state.fixtureId = e.target.value; state.candidateRouteId = null; state.selectedStopStgoId = null; render(); };
  q('btnRun').onclick = runLive;
  q('btnReset').onclick = () => { state.fixtureId = DATA.defaultFixtureId; state.candidateRouteId = null; state.selectedStopStgoId = null; render(); };
  q('btnExport').onclick = exportSnapshot;
  DATA.fixtures.filter(f=>f.watchCase).forEach(f => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'watch-btn'; b.textContent = f.id;
    b.title = f.watchNote || '';
    b.onclick = () => { state.fixtureId = f.id; state.candidateRouteId = null; render(); };
    q('watchBar').appendChild(b);
  });

  readUrl();
  render();
})();
