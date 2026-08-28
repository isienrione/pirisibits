/* Gate 2E.1 — Santiago Route Lab client UI with geographic QA. */
(function () {
  const DATA = window.__ROUTE_LAB_DATA__;
  if (!DATA) {
    document.body.innerHTML = '<p>Route Lab payload missing. Run npm run gate:2e:build</p>';
    return;
  }

  const HUMAN_REVIEW_KEY = 'cw_route_lab_human_review_v0_1';
  const REVIEW_MATRIX_FIXTURES = ['F1', 'F2', 'F6', 'F8', 'F9', 'F15', 'F17'];
  const RATING_OPTS = ['', 'GOOD', 'QUESTIONABLE', 'BAD'];

  const state = {
    fixtureId: DATA.defaultFixtureId || 'F2',
    candidateRouteId: null,
    selectedStopStgoId: null,
    compareCandidates: false,
    winnerOverlayMode: 'RERANKED',
    mapReady: false,
    mapboxOk: false,
    showReviewMatrix: false,
  };

  function q(id) { return document.getElementById(id); }
  function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function readUrl() {
    const p = new URLSearchParams(location.search);
    if (p.get('fixture') && DATA.results[p.get('fixture')]) state.fixtureId = p.get('fixture');
    if (p.get('candidate')) state.candidateRouteId = p.get('candidate');
    if (p.get('stop')) state.selectedStopStgoId = p.get('stop');
    if (p.get('compare') === '1') state.compareCandidates = true;
    if (p.get('winner')) state.winnerOverlayMode = p.get('winner');
  }

  function writeUrl() {
    const p = new URLSearchParams();
    p.set('fixture', state.fixtureId);
    if (state.candidateRouteId) p.set('candidate', state.candidateRouteId);
    if (state.selectedStopStgoId) p.set('stop', state.selectedStopStgoId);
    if (state.compareCandidates) p.set('compare', '1');
    if (state.winnerOverlayMode !== 'RERANKED') p.set('winner', state.winnerOverlayMode);
    history.replaceState(null, '', location.pathname + '?' + p.toString());
  }

  function currentResult() { return DATA.results[state.fixtureId]; }

  function composerWinner(r) {
    return r.reranked.find(x => x.originalComposerRank === 1) || r.reranked[0];
  }

  function rerankWinner(r) {
    return r.reranked.find(x => x.rerankedRank === 1) || r.reranked[0];
  }

  function currentReranked() {
    const r = currentResult();
    if (!r) return null;
    if (!state.candidateRouteId) return rerankWinner(r);
    return r.reranked.find(x => x.routeId === state.candidateRouteId) || rerankWinner(r);
  }

  function loadReviewStore() {
    try {
      const raw = localStorage.getItem(HUMAN_REVIEW_KEY);
      if (!raw) return { schemaVersion: 'cw_route_lab_human_review.v0.1', reviews: {} };
      const parsed = JSON.parse(raw);
      if (parsed.schemaVersion !== 'cw_route_lab_human_review.v0.1') return { schemaVersion: 'cw_route_lab_human_review.v0.1', reviews: {} };
      return parsed;
    } catch {
      return { schemaVersion: 'cw_route_lab_human_review.v0.1', reviews: {} };
    }
  }

  function saveReviewStore(store) {
    localStorage.setItem(HUMAN_REVIEW_KEY, JSON.stringify(store));
  }

  function reviewKey(fixtureId, routeId) { return `${fixtureId}::${routeId}`; }

  function getReview(fixtureId, routeId) {
    const store = loadReviewStore();
    return store.reviews[reviewKey(fixtureId, routeId)] || {
      fixtureId, routeId, geography: '', sequence: '', travelerFit: '', narrativeShape: '', timeUse: '', founderNote: '', updatedAt: '',
    };
  }

  function projectPoints(stops) {
    const pts = stops.map(s => DATA.coordinates[s.stgoId]).filter(Boolean);
    if (!pts.length) return [];
    const lats = pts.map(p => p.lat), lngs = pts.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const latSpan = Math.max(maxLat - minLat, 0.001), lngSpan = Math.max(maxLng - minLng, 0.001);
    const W = 520, H = 380, pad = 28;
    return stops.map((s, i) => {
      const c = DATA.coordinates[s.stgoId];
      if (!c) return null;
      const role = s;
      return {
        stgoId: s.stgoId,
        x: pad + ((c.lng - minLng) / lngSpan) * (W - pad * 2),
        y: pad + (1 - (c.lat - minLat) / latSpan) * (H - pad * 2),
        n: i + 1,
        selected: s.stgoId === state.selectedStopStgoId,
        name: s.name,
        role: role,
        dwell: s.estimatedDwellMin,
        move: s.transitionTimeMin,
      };
    }).filter(Boolean);
  }

  function renderFallbackMap(routes) {
    q('mapboxHost').style.display = 'none';
    q('mapHost').style.display = 'block';
    const primary = routes[0];
    if (!primary) { q('mapHost').innerHTML = '<p class="muted">No route to display.</p>'; return; }
    const stops = primary.stops;
    const pts = projectPoints(stops);
    let svg = '<svg viewBox="0 0 520 380" class="map-svg">';
    svg += '<rect width="520" height="380" fill="#eef2f7"/>';
    svg += '<text x="260" y="18" text-anchor="middle" fill="#64748b" font-size="11">Fallback diagnostic map (no Mapbox token)</text>';

    routes.forEach((route, ri) => {
      const rPts = projectPoints(route.stops);
      const dash = ri === 0 ? 'none' : '6 4';
      const stroke = route.kind === 'composer' ? '#2563eb' : route.kind === 'rerank' ? '#0f766e' : ['#dc2626','#7c3aed','#ea580c'][ri % 3];
      const opacity = route.dominant ? 1 : 0.55;
      const segs = route.geoSegments || [];
      for (let i = 1; i < rPts.length; i++) {
        const a = rPts[i-1], b = rPts[i];
        const seg = segs[i-1];
        const noGeom = seg && seg.geometryStatus !== 'CANONICAL_GEOMETRY';
        const metro = seg && seg.geometryStatus === 'METRO_NO_GEOMETRY';
        svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${metro?'#7c3aed':stroke}" stroke-width="${route.dominant?3:2}" stroke-dasharray="${noGeom?'4 3':dash}" opacity="${opacity}"/>`;
        if (noGeom && route.dominant) {
          const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
          svg += `<text x="${mx}" y="${my-4}" text-anchor="middle" fill="#f59e0b" font-size="8" font-weight="700">GEOMETRY NOT STORED</text>`;
        }
      }
    });

    const domRoute = routes.find(r => r.dominant) || routes[0];
    const domPts = projectPoints(domRoute.stops);
    domPts.forEach(p => {
      const fill = p.selected ? '#0f766e' : '#dc2626';
      svg += `<circle cx="${p.x}" cy="${p.y}" r="11" fill="${fill}" stroke="#fff" stroke-width="2" data-stop="${p.stgoId}" class="map-stop"/>`;
      svg += `<text x="${p.x}" y="${p.y+4}" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">${p.n}</text>`;
    });
    svg += '</svg>';
    svg += '<div class="map-note">Fallback map — dashed orange segments = GEOMETRY NOT STORED (not actual walk path).</div>';
    q('mapHost').innerHTML = svg;
    q('mapHost').querySelectorAll('.map-stop').forEach(el => {
      el.addEventListener('click', () => { state.selectedStopStgoId = el.getAttribute('data-stop'); writeUrl(); render(); });
    });
  }

  function buildMapRoutes(r, entry) {
    const routes = [];
    const comp = composerWinner(r);
    const rer = rerankWinner(r);

    if (state.winnerOverlayMode === 'OVERLAY_BOTH') {
      const compIds = new Set(comp.candidate.orderedStops.map(s => s.stgoId));
      const rerIds = new Set(rer.candidate.orderedStops.map(s => s.stgoId));
      routes.push({
        stops: comp.candidate.orderedStops,
        geoSegments: comp.geoSegments,
        roles: comp.positionRoles,
        kind: 'composer',
        dominant: false,
        label: 'Composer winner',
        shared: [...compIds].filter(id => rerIds.has(id)),
      });
      routes.push({
        stops: rer.candidate.orderedStops,
        geoSegments: rer.geoSegments,
        roles: rer.positionRoles,
        kind: 'rerank',
        dominant: true,
        label: 'Reranked winner',
      });
    } else if (state.winnerOverlayMode === 'COMPOSER') {
      routes.push({
        stops: comp.candidate.orderedStops,
        geoSegments: comp.geoSegments,
        roles: comp.positionRoles,
        kind: 'composer',
        dominant: true,
      });
    } else if (state.compareCandidates) {
      r.reranked.forEach((e, i) => {
        routes.push({
          stops: e.candidate.orderedStops,
          geoSegments: e.geoSegments,
          roles: e.positionRoles,
          kind: i === 0 ? 'rerank' : 'overlay',
          dominant: entry && e.routeId === entry.routeId,
          label: `Candidate #${e.rerankedRank}`,
        });
      });
    } else {
      routes.push({
        stops: entry.candidate.orderedStops,
        geoSegments: entry.geoSegments,
        roles: entry.positionRoles,
        kind: 'selected',
        dominant: true,
      });
    }
    return routes;
  }

  async function ensureMap() {
    if (!window.RouteLabMap) return false;
    if (state.mapReady) return state.mapboxOk;
    const res = await window.RouteLabMap.init('mapboxHost');
    state.mapReady = true;
    state.mapboxOk = res.ok;
    window.__ROUTE_LAB_ON_STOP__ = (stgoId) => { state.selectedStopStgoId = stgoId; writeUrl(); render(); };
    return state.mapboxOk;
  }

  async function renderMap(r, entry) {
    const routes = buildMapRoutes(r, entry);
    q('mapProviderBadge').textContent = state.mapboxOk ? 'Mapbox basemap' : 'Fallback SVG';

    const ok = await ensureMap();
    if (ok && window.RouteLabMap) {
      q('mapboxHost').style.display = 'block';
      q('mapHost').style.display = 'none';
      if (routes.length === 1) {
        window.RouteLabMap.renderRouteLayers(routes[0].stops, routes[0].geoSegments, DATA.coordinates, {
          roles: routes[0].roles,
          selectedStop: state.selectedStopStgoId,
          markerKind: routes[0].kind,
        });
      } else {
        window.RouteLabMap.renderOverlay(routes.map(rt => ({
          stops: rt.stops,
          geoSegments: rt.geoSegments,
          roles: rt.roles,
          selectedStop: state.selectedStopStgoId,
          kind: rt.dominant ? rt.kind : 'overlay',
        })), DATA.coordinates);
      }
    } else {
      renderFallbackMap(routes);
    }
  }

  function fitSelectedRoute() {
    const r = currentResult();
    const entry = currentReranked();
    if (!r || !entry) return;
    const routes = buildMapRoutes(r, entry);
    const primary = routes.find(rt => rt.dominant) || routes[0];
    if (state.mapboxOk && window.RouteLabMap) {
      window.RouteLabMap.fitRoute(primary.stops, DATA.coordinates, 56);
    }
  }

  function renderWinnerSequences(r) {
    const comp = r.composerWinnerSequence || composerWinner(r).stopSequence;
    const rer = r.rerankWinnerSequence || rerankWinner(r).stopSequence;
    let html = '';
    if (state.winnerOverlayMode === 'OVERLAY_BOTH' || state.winnerOverlayMode === 'COMPOSER') {
      html += `<div class="map-seq composer"><strong>Composer:</strong> ${esc(comp)}</div>`;
    }
    if (state.winnerOverlayMode === 'OVERLAY_BOTH' || state.winnerOverlayMode === 'RERANKED') {
      html += `<div class="map-seq rerank"><strong>Reranker:</strong> ${esc(rer)}</div>`;
    }
    if (state.winnerOverlayMode === 'OVERLAY_BOTH' && r.winnerChanged) {
      html += `<div class="warn-sm">Winner changed — compare shared vs composer-only vs reranker-only stops on map.</div>`;
    }
    q('winnerSequences').innerHTML = html;
  }

  function renderGeoDiagnostics(entry) {
    const g = entry.geoDiagnostics;
    if (!g) { q('geoDiagnostics').innerHTML = ''; return; }
    const trans = g.transitionDistancesM.map(t =>
      `<div>${esc(t.from)}→${esc(t.to)}: ${t.distanceM != null ? t.distanceM + 'm' : '—'} · ${t.durationMin}m</div>`
    ).join('');
    q('geoDiagnostics').innerHTML = `
      <div class="geo-section"><h4>Map QA indicators</h4>
        <div class="geo-grid">
          <div>Walk distance<br><strong>${g.totalWalkingDistanceM != null ? g.totalWalkingDistanceM + ' m' : '—'}</strong></div>
          <div>BBox extent<br><strong>${g.extentKm != null ? g.extentKm + ' km' : '—'}</strong></div>
          <div>Longest leg<br><strong>${g.longestTransitionM != null ? g.longestTransitionM + 'm' : '—'}</strong><br><span class="muted">${esc(g.longestTransitionLabel||'')}</span></div>
          <div>Geometric reversals<br><strong>${g.geometricReversalCount}</strong></div>
          <div>Revisited vicinity<br><strong>${g.revisitedVicinityCount}</strong></div>
        </div>
        <div style="margin-top:.35rem;font-size:.75rem">${trans}</div>
        ${(g.mapQaNotes||[]).map(n=>`<div class="warn-sm">${esc(n)}</div>`).join('')}
      </div>
      <div class="geo-section"><h4>Engine backtracking penalty</h4>
        <div><strong>${g.engineBacktrackingPenalty}</strong> <span class="muted">(ArcQuality — not a map metric)</span></div>
      </div>`;
  }

  function renderShapeAmbiguity(entry) {
    const amb = entry.shapeAmbiguity;
    if (!amb) { q('shapeAmbiguity').innerHTML = ''; return; }
    let html = '';
    if (amb.ambiguous) {
      html += `<div class="ambiguity">SHAPE CLASSIFICATION AMBIGUOUS — ${esc(amb.tags.join(', '))}</div>`;
    } else if (amb.tags.length) {
      html += `<div class="muted" style="margin-top:.35rem">Shape tags: ${esc(amb.tags.join(', '))}</div>`;
    }
    q('shapeAmbiguity').innerHTML = html;
  }

  function renderWatchPanel() {
    const fx = DATA.fixtures.find(f => f.id === state.fixtureId);
    const geo = fx?.geoWatch;
    if (!geo) { q('watchPanel').innerHTML = ''; return; }
    const r = currentResult();
    const actual = rerankWinner(r)?.stopSequence || '';
    const expected = geo.expectedReranked?.join(' → ') || '';
    q('watchPanel').innerHTML = `<div class="watch-panel">
      <strong>${esc(state.fixtureId)} geographic watch case</strong> — ${esc(geo.note || fx.watchNote || '')}
      <div class="map-seq rerank" style="margin-top:.35rem"><strong>Expected reranked:</strong> ${esc(expected)}</div>
      <div class="map-seq composer"><strong>Composer winner:</strong> ${esc(r?.composerWinnerSequence || '')}</div>
      <div class="map-seq rerank"><strong>Actual reranked:</strong> ${esc(actual)}</div>
      ${state.fixtureId === 'F8' ? `<div class="muted" style="margin-top:.35rem">Structural: 4 anchors · 0 pockets · 3 micros (evidence view)</div>` : ''}
    </div>`;
  }

  function renderHumanReview(entry) {
    const key = reviewKey(state.fixtureId, entry.candidate.routeId);
    const r = getReview(state.fixtureId, entry.candidate.routeId);
    const mkSelect = (field, label) => `<label>${label}<select data-field="${field}">${RATING_OPTS.map(o=>`<option value="${o}" ${r[field]===o?'selected':''}>${o||'—'}</option>`).join('')}</select></label>`;

    q('humanReviewPanel').innerHTML = `
      <div class="muted" style="margin-bottom:.35rem">Persisted locally · does not affect engine scoring</div>
      <div class="review-grid">
        ${mkSelect('geography','Geography')}
        ${mkSelect('sequence','Sequence')}
        ${mkSelect('travelerFit','Traveler fit')}
        ${mkSelect('narrativeShape','Narrative shape')}
        ${mkSelect('timeUse','Time use')}
        <label style="grid-column:1/-1">Founder note<textarea data-field="founderNote">${esc(r.founderNote)}</textarea></label>
      </div>`;

    q('humanReviewPanel').querySelectorAll('[data-field]').forEach(el => {
      el.addEventListener('change', () => {
        const store = loadReviewStore();
        const cur = getReview(state.fixtureId, entry.candidate.routeId);
        cur[el.dataset.field] = el.value;
        cur.fixtureId = state.fixtureId;
        cur.routeId = entry.candidate.routeId;
        cur.updatedAt = new Date().toISOString();
        store.reviews[key] = cur;
        saveReviewStore(store);
        if (state.showReviewMatrix) renderReviewMatrix();
      });
    });
  }

  function renderReviewMatrix() {
    const rows = REVIEW_MATRIX_FIXTURES.map(fid => {
      const res = DATA.results[fid];
      if (!res) return '';
      const comp = composerWinner(res);
      const rer = rerankWinner(res);
      const rev = getReview(fid, rer.candidate.routeId);
      const c = rer.candidate;
      const rating = (v) => v ? `<span class="rating-${v}">${esc(v)}</span>` : '—';
      return `<tr>
        <td>${esc(fid)}</td>
        <td>${esc(res.composerWinnerSequence || comp.stopSequence)}</td>
        <td>${esc(res.rerankWinnerSequence || rer.stopSequence)}</td>
        <td>${res.winnerChanged ? 'YES' : 'no'}</td>
        <td>${c.totalEstimatedMin}/${res.request.timeBudgetMin}m</td>
        <td>${c.anchorCount}/${c.thematicPocketCount}/${c.microRevealCount}</td>
        <td>${rating(rev.geography)}</td>
        <td>${rating(rev.sequence)}</td>
        <td>${rating(rev.travelerFit)}</td>
        <td>${rating(rev.narrativeShape)}</td>
        <td>${esc(rev.founderNote.slice(0,80))}${rev.founderNote.length>80?'…':''}</td>
      </tr>`;
    }).join('');
    q('reviewMatrix').innerHTML = `<thead><tr>
      <th>Fixture</th><th>Composer winner</th><th>Reranked winner</th><th>Winner changed?</th>
      <th>Time</th><th>A/P/M</th><th>Geography</th><th>Sequence</th><th>Traveler fit</th><th>Narrative</th><th>Notes</th>
    </tr></thead><tbody>${rows}</tbody>`;
  }

  function renderCandidates(r) {
    q('candidateCards').innerHTML = r.reranked.map(entry => {
      const c = entry.candidate;
      const win = entry.rerankedRank === 1;
      const sel = currentReranked()?.routeId === entry.routeId;
      const shared = (r.sharedStops?.shared || []).filter(id => c.orderedStops.some(s => s.stgoId === id)).length;
      return `<button type="button" class="cand-card ${win?'winner':''} ${sel?'selected':''}" data-route="${entry.routeId}">
        <div class="cand-head"><strong>#${entry.rerankedRank} reranked</strong> <span class="muted">composer #${entry.originalComposerRank}</span> ${win?'<span class="pill win">WINNER</span>':''}</div>
        <div class="cand-metrics">${entry.rankChange?`<span class="${entry.rankChange>0?'up':'down'}">${entry.rankChange>0?'+':''}${entry.rankChange} rank</span>`:''}
          ${c.stopCount} stops · ${c.totalEstimatedMin} min · Δ${c.budgetDeltaMin}m · shared ${shared}</div>
        <div class="cand-scores">Comp ${entry.composerProvisionalScore} · Arc ${entry.arcQualityScore} · Rerank ${entry.rerankedScore}</div>
        <div class="cand-meta">A/P/M ${c.anchorCount}/${c.thematicPocketCount}/${c.microRevealCount} · ${(c.dominantThemes||[]).join(', ')}</div>
        <div class="cand-tags">${(entry.shapeSummary.tags||[]).slice(0,4).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
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
          <div class="muted">seq ${i+1} · dwell ${s.estimatedDwellMin}m · move from prev ${s.transitionTimeMin}m · cum ${s.cumulativeTimeMin}m</div>
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
    const idx = entry.candidate.orderedStops.findIndex(x => x.stgoId === s.stgoId);
    const v02 = entry.v02ScoringByStop && entry.v02ScoringByStop[s.stgoId];
    const v02Html = v02 && v02.v02 ? `
      <div class="banner-win" style="background:#eff6ff;border-color:#93c5fd;color:#1e40af;font-size:.75rem">V0.2 PARALLEL SCORE — NOT USED FOR ROUTE SELECTION</div>
      <details open><summary>V0.2 parallel scores</summary>
        <div class="two-col">
          <div><strong>V0.1 NodeUtility</strong><br>${v02.v01NodeUtility ?? '—'}</div>
          <div><strong>V0.2 BaseNodeValue</strong><br>${v02.v02.baseNodeValue.score ?? 'UNAVAILABLE'}</div>
        </div>
        <div class="muted" style="margin-top:.35rem;font-size:.78rem">
          IW ${v02.v02.intrinsicWorth.raw ?? '—'} · TM ${v02.v02.travelerMatch.score ?? '—'} ·
          Role ${v02.v02.roleFit.primaryStructuralRole} (A${(v02.v02.roleFit.anchorFit??0).toFixed?.(2)||v02.v02.roleFit.anchorFit} P${(v02.v02.roleFit.pocketFit??0).toFixed?.(2)||v02.v02.roleFit.pocketFit} M${(v02.v02.roleFit.microRevealFit??0).toFixed?.(2)||v02.v02.roleFit.microRevealFit})
        </div>
        ${v02.v02.marginalRouteValue ? `<div class="muted" style="font-size:.78rem;margin-top:.25rem">MRV ${v02.v02.marginalRouteValue.score ?? '—'} · cov ${v02.v02.marginalRouteValue.coverage}</div>` : ''}
        ${v02.v02.transitionValue ? `<div class="muted" style="font-size:.78rem">TV ${v02.v02.transitionValue.score ?? v02.v02.transitionValue.status} · cov ${v02.v02.transitionValue.coverage}</div>` : ''}
        <p class="explain">${esc(v02.v02.baseNodeValue.explanation.plainLanguageExplanation)}</p>
      </details>` : '';
    q('stopInspector').innerHTML = `
      <h3>${esc(s.name)} <span class="muted">${esc(s.stgoId)}</span></h3>
      <p class="muted">Stop #${idx+1} · role ${esc(role?.role)} · dwell ${s.estimatedDwellMin}m · move ${s.transitionTimeMin}m</p>
      ${v02Html}
      <details open><summary>Identity</summary>
        <p>Commune: ${esc(sem?.commune || '—')} · Launch: ${sem?.launchCorpus ?? '—'}</p>
        <p><a href="/docs/engine/gate-2a1-founder-calibration-cockpit.html?stgoId=${encodeURIComponent(s.stgoId)}" target="_blank">Open in Curator ↗</a></p>
      </details>
      <details><summary>Route fit (V0.1)</summary>
        <p>Role: ${esc(role?.role)} — ${esc(role?.rationale || '')}</p>
        <p>NodeUtility ${s.nodeUtility}</p>
        <p>${esc(s.inclusionExplanation)}</p>
      </details>`;
  }

  function renderArc(entry) {
    const pos = entry.arcDisplay.filter(r => r.kind === 'positive');
    const pen = entry.arcDisplay.filter(r => r.kind === 'penalty' && r.value > 0.02);
    q('arcInspector').innerHTML = `
      <div class="arc-summary">ArcQuality <strong>${entry.arcQualityScore}</strong> · raw ${entry.arcQuality.normalizedScore}</div>
      <div class="two-col">
        <div><h4>Positive</h4>${pos.slice(0,8).map(r=>`<div class="arc-row"><span>${esc(r.key)}</span><span>${r.contribution}</span></div>`).join('')}</div>
        <div><h4>Penalties</h4>${pen.length?pen.map(r=>`<div class="arc-row warn"><span>${esc(r.key)}</span><span>${r.contribution}</span></div>`).join(''):'<p class="muted">No significant penalties</p>'}</div>
      </div>`;
  }

  function renderDiagnostics(entry) {
    q('diagPanel').innerHTML = entry.diagnostics.map(d => {
      const lab = d.severity==='SEVERE'||d.severity==='MODERATE'?'STRONG WARNING':d.severity==='MILD'?'WARNING':'INFO';
      return `<div class="diag ${lab.replace(' ','-')}"><strong>${esc(d.code)}</strong> <span class="pill">${lab}</span>
        <div>${esc(d.explanation)}</div></div>`;
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
      <strong>#${e.rerankedRank}</strong> composer #${e.originalComposerRank} (${e.rankChange>0?'+':''}${e.rankChange})
      · comp ${e.composerProvisionalScore} arc ${e.arcQualityScore} rerank ${e.rerankedScore}
      <div class="muted">${esc(e.stopSequence)}</div></div>`).join('');
  }

  function renderCompare(r) {
    q('comparePanel').innerHTML = r.comparison.map(p => `<div class="cmp"><strong>A↔B</strong> sim ${p.similarity.toFixed(2)} · stop ${p.stopOverlap.toFixed(2)} · time Δ${p.timeDiff}</div>`).join('') +
      `<div class="muted">Shared: ${(r.sharedStops.shared||[]).join(', ')||'—'}</div>`;
  }

  function renderRhythms(entry) {
    q('ribbonHost').innerHTML = `<div class="ribbon">${esc(entry.ribbon)}</div>
      <div class="muted">Longest runs — anchor ${entry.structuralRuns.anchor} · pocket ${entry.structuralRuns.pocket} · micro ${entry.structuralRuns.micro}</div>`;
    q('themeHost').innerHTML = entry.themeProgression.map((t,i)=>`<span class="chip">${i+1}:${esc(t)}</span>`).join(' → ');
    q('relationHost').innerHTML = entry.relationProgression.filter((_,i)=>i>0).map(r=>`<span class="chip">${esc(r.relation||'—')}</span>`).join(' → ');
  }

  function renderTimeBar(entry) {
    const t = entry.timeBreakdown;
    const total = t.timeBudgetMin;
    const usedPct = Math.min(100, (t.totalEstimatedMin / total) * 100);
    const movePct = (t.movementMin / total) * 100;
    const dwellPct = (t.dwellMin / total) * 100;
    q('timeBar').innerHTML = `<div class="tbar"><div class="t-move" style="width:${movePct}%"></div><div class="t-dwell" style="width:${dwellPct}%"></div><div class="t-unused" style="width:${Math.max(0,100-usedPct)}%"></div></div>
      <div class="muted">Move ${t.movementMin}m · Dwell ${t.dwellMin}m · Used ${t.totalEstimatedMin}/${total}m</div>`;
  }

  function renderControls() {
    const fx = DATA.fixtures.find(f => f.id === state.fixtureId) || DATA.fixtures[0];
    q('fixtureSelect').innerHTML = DATA.fixtures.map(f => `<option value="${f.id}" ${f.id===state.fixtureId?'selected':''}>${esc(f.label)}</option>`).join('');
    q('fixtureDesc').textContent = fx.description + (fx.watchNote ? ' · WATCH: ' + fx.watchNote : '');
    q('reqSummary').innerHTML = `<pre class="req-pre">${esc(JSON.stringify(currentResult()?.request||{}, null, 2))}</pre>`;
    q('chkCompareCandidates').checked = state.compareCandidates;
    q('winnerOverlayMode').value = state.winnerOverlayMode;
    q('reviewMatrixPanel').style.display = state.showReviewMatrix ? 'block' : 'none';
  }

  async function runLive() {
    try {
      const res = await fetch('/api/run', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ fixtureId: state.fixtureId }) });
      if (!res.ok) throw new Error('run failed');
      const json = await res.json();
      DATA.results[state.fixtureId] = json;
      state.candidateRouteId = null;
      render();
    } catch {
      alert('Live run requires npm run gate:2e:serve (embedded fixture data still available).');
    }
  }

  function exportSnapshot() {
    const entry = currentReranked();
    const rev = getReview(state.fixtureId, entry.candidate.routeId);
    const payload = {
      exportedAt: new Date().toISOString(),
      fixtureId: state.fixtureId,
      result: currentResult(),
      selected: entry,
      humanReview: {
        geography: rev.geography,
        sequence: rev.sequence,
        travelerFit: rev.travelerFit,
        narrativeShape: rev.narrativeShape,
        timeUse: rev.timeUse,
        founderNote: rev.founderNote,
      },
      humanReviewAffectsEngine: false,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `route-lab-${state.fixtureId}-${Date.now()}.json`;
    a.click();
  }

  async function render() {
    const r = currentResult();
    if (!r) return;
    if (!state.candidateRouteId && r.topRerankedRouteId) state.candidateRouteId = r.topRerankedRouteId;
    const entry = currentReranked();
    if (!entry) return;
    renderControls();
    renderWatchPanel();
    renderCandidates(r);
    await renderMap(r, entry);
    renderWinnerSequences(r);
    renderGeoDiagnostics(entry);
    renderTimeline(entry);
    renderStopInspector(entry);
    renderArc(entry);
    renderDiagnostics(entry);
    renderOmissions(entry);
    renderRerankCompare(r);
    renderCompare(r);
    renderRhythms(entry);
    renderShapeAmbiguity(entry);
    renderTimeBar(entry);
    renderHumanReview(entry);
    if (state.showReviewMatrix) renderReviewMatrix();
    writeUrl();
  }

  q('fixtureSelect').onchange = e => { state.fixtureId = e.target.value; state.candidateRouteId = null; state.selectedStopStgoId = null; render(); };
  q('btnRun').onclick = runLive;
  q('btnReset').onclick = () => { state.fixtureId = DATA.defaultFixtureId; state.candidateRouteId = null; state.selectedStopStgoId = null; render(); };
  q('btnExport').onclick = exportSnapshot;
  q('btnFitRoute').onclick = fitSelectedRoute;
  q('chkCompareCandidates').onchange = e => { state.compareCandidates = e.target.checked; render(); };
  q('winnerOverlayMode').onchange = e => { state.winnerOverlayMode = e.target.value; render(); };
  q('btnReviewMatrix').onclick = () => { state.showReviewMatrix = !state.showReviewMatrix; render(); };

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
