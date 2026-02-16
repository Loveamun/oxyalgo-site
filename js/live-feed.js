// ═══════════════════════════════════════════════
//  OXY ALGO — Live Signal Feed
//  Fetches recent signals from VPS API
//  Auto-refreshes every 5 minutes
//  Falls back to localStorage cache if VPS unreachable
// ═══════════════════════════════════════════════

(function () {
  'use strict';

  var API_URL = 'https://server.oxyalgo.com/api/live-signals';
  var CACHE_KEY = 'oxy-cached-signals';
  var REFRESH_MS = 300000; // 5 minutes
  var TIMEOUT_MS = 5000;
  var refreshTimer = null;

  // ─── SAMPLE DATA (used when API is not yet deployed) ───
  var SAMPLE_SIGNALS = [
    { symbol: 'XAUUSD', direction: 'LONG', score: 87, grade: 'A+', session: 'London', outcome: 'WIN', pips: 45.3, timestamp: new Date(Date.now() - 3600000).toISOString() },
    { symbol: 'GBPUSD', direction: 'LONG', score: 82, grade: 'A', session: 'NY', outcome: 'WIN', pips: 58.0, timestamp: new Date(Date.now() - 7200000).toISOString() },
    { symbol: 'BTCUSD', direction: 'SHORT', score: 79, grade: 'A', session: '24/7', outcome: 'WIN', pips: 117.0, timestamp: new Date(Date.now() - 14400000).toISOString() },
    { symbol: 'NAS100', direction: 'LONG', score: 91, grade: 'A+', session: 'NY', outcome: 'PENDING', pips: null, timestamp: new Date(Date.now() - 1800000).toISOString() },
    { symbol: 'EURJPY', direction: 'SHORT', score: 84, grade: 'A', session: 'London', outcome: 'WIN', pips: 63.0, timestamp: new Date(Date.now() - 21600000).toISOString() },
    { symbol: 'GBPJPY', direction: 'LONG', score: 76, grade: 'B+', session: 'London', outcome: 'LOSS', pips: -22.0, timestamp: new Date(Date.now() - 28800000).toISOString() },
    { symbol: 'SOLUSD', direction: 'LONG', score: 71, grade: 'B', session: '24/7', outcome: 'WIN', pips: 34.5, timestamp: new Date(Date.now() - 36000000).toISOString() },
    { symbol: 'EURUSD', direction: 'SHORT', score: 88, grade: 'A+', session: 'London', outcome: 'PENDING', pips: null, timestamp: new Date(Date.now() - 900000).toISOString() }
  ];

  function formatTime(ts) {
    var d = new Date(ts);
    var now = new Date();
    var diffMs = now - d;
    var diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return diffMin + 'm ago';
    var diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return diffHr + 'h ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function outcomeHTML(outcome, pips) {
    if (outcome === 'WIN') {
      return '<span class="feed-outcome feed-win">\u2713 WIN' + (pips ? ' +' + pips.toFixed(1) + 'p' : '') + '</span>';
    }
    if (outcome === 'LOSS') {
      return '<span class="feed-outcome feed-loss">\u2717 LOSS' + (pips ? ' ' + pips.toFixed(1) + 'p' : '') + '</span>';
    }
    return '<span class="feed-outcome feed-pending">\u25CB PENDING</span>';
  }

  function directionHTML(dir) {
    if (dir === 'LONG' || dir === 'BUY') {
      return '<span class="feed-dir feed-long">\u25B2</span>';
    }
    return '<span class="feed-dir feed-short">\u25BC</span>';
  }

  function gradeHTML(grade) {
    var color = 'var(--text3)';
    if (grade.startsWith('A')) color = 'var(--green)';
    else if (grade.startsWith('B')) color = 'var(--accent)';
    return '<span class="feed-grade" style="color:' + color + ';">' + grade + '</span>';
  }

  function renderSignals(container, signals, status) {
    var html = '';

    // Terminal header
    html += '<div class="feed-terminal">';
    html += '<div class="feed-terminal-bar">';
    html += '<div class="terminal-dot red"></div>';
    html += '<div class="terminal-dot yellow"></div>';
    html += '<div class="terminal-dot green"></div>';
    html += '<div class="feed-terminal-title">SIGNAL FEED \u2014 Last 24 Hours</div>';
    html += '<div class="feed-status-dot"></div>';
    html += '</div>';
    html += '<div class="feed-terminal-body">';

    // Column headers
    html += '<div class="feed-row feed-header-row">';
    html += '<span class="feed-col-time">TIME</span>';
    html += '<span class="feed-col-symbol">SYMBOL</span>';
    html += '<span class="feed-col-dir"></span>';
    html += '<span class="feed-col-score">SCORE</span>';
    html += '<span class="feed-col-grade">GRADE</span>';
    html += '<span class="feed-col-session">SESSION</span>';
    html += '<span class="feed-col-outcome">OUTCOME</span>';
    html += '</div>';

    signals.forEach(function (sig) {
      html += '<div class="feed-row">';
      html += '<span class="feed-col-time">' + formatTime(sig.timestamp) + '</span>';
      html += '<span class="feed-col-symbol">' + sig.symbol + '</span>';
      html += '<span class="feed-col-dir">' + directionHTML(sig.direction) + '</span>';
      html += '<span class="feed-col-score">' + sig.score + '</span>';
      html += '<span class="feed-col-grade">' + gradeHTML(sig.grade) + '</span>';
      html += '<span class="feed-col-session">' + sig.session + '</span>';
      html += '<span class="feed-col-outcome">' + outcomeHTML(sig.outcome, sig.pips) + '</span>';
      html += '</div>';
    });

    html += '</div>';

    // Footer
    html += '<div class="feed-terminal-footer">';
    if (status) {
      html += '<span class="feed-footer-status">' + status + '</span>';
    } else {
      html += '<span class="feed-footer-status">Auto-refreshes every 5 min</span>';
    }
    html += '<span class="feed-footer-count">' + signals.length + ' signals</span>';
    html += '</div>';

    html += '</div>';

    container.innerHTML = html;
  }

  async function loadLiveSignals() {
    var container = document.getElementById('live-signal-feed');
    if (!container) return;

    try {
      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

      var resp = await fetch(API_URL, { signal: controller.signal });
      clearTimeout(timeout);

      if (!resp.ok) throw new Error('API ' + resp.status);

      var data = await resp.json();
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      renderSignals(container, data.signals || data, null);

    } catch (e) {
      // Try cache first
      var cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          var cData = JSON.parse(cached);
          renderSignals(container, cData.signals || cData, 'Showing cached data');
          return;
        } catch (_) {}
      }
      // Fall back to sample data
      renderSignals(container, SAMPLE_SIGNALS, 'Sample data \u2014 live feed connecting\u2026');
    }
  }

  function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(loadLiveSignals, REFRESH_MS);
  }

  function init() {
    loadLiveSignals();
    startAutoRefresh();

    // Pause refresh when tab is hidden
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (refreshTimer) clearInterval(refreshTimer);
        refreshTimer = null;
      } else {
        loadLiveSignals();
        startAutoRefresh();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
