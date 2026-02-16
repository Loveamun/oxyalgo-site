// ═══════════════════════════════════════════════
//  OXY ALGO — Dynamic Sections Renderer
//  Fetches JSON data and renders: Weekly Wins,
//  Community Spotlight, Blog Preview, Monthly Highlights
// ═══════════════════════════════════════════════

(function () {
  'use strict';

  const BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '' : '';

  // ─── UTILITIES ──────────────────────────────
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatPips(pips) {
    return (pips >= 0 ? '+' : '') + pips.toFixed(1);
  }

  function tierColor(tier) {
    const map = {
      'Free': { bg: 'rgba(16,185,129,0.1)', color: 'var(--green)', border: 'rgba(16,185,129,0.3)' },
      'Premium': { bg: 'rgba(0,212,255,0.1)', color: 'var(--accent)', border: 'rgba(0,212,255,0.3)' },
      'VIP': { bg: 'rgba(124,58,237,0.1)', color: 'var(--purple2)', border: 'rgba(124,58,237,0.3)' },
      'Elite': { bg: 'rgba(245,158,11,0.1)', color: 'var(--gold)', border: 'rgba(245,158,11,0.3)' }
    };
    return map[tier] || map['Free'];
  }

  function directionArrow(dir) {
    return dir === 'LONG' || dir === 'BUY'
      ? '<span style="color:var(--green);">\u25B2 LONG</span>'
      : '<span style="color:var(--red);">\u25BC SHORT</span>';
  }

  function gradeColor(grade) {
    if (grade.startsWith('A')) return 'var(--green)';
    if (grade.startsWith('B')) return 'var(--accent)';
    return 'var(--text2)';
  }

  function observeReveals(container) {
    if (!window.revealObserver) return;
    container.querySelectorAll('.reveal').forEach(function (el) {
      window.revealObserver.observe(el);
    });
  }

  async function fetchJSON(path) {
    var resp = await fetch(BASE + path + '?t=' + Math.floor(Date.now() / 300000));
    if (!resp.ok) throw new Error(resp.status);
    return resp.json();
  }

  // ═══════════════════════════════════════════════
  //  1. WEEKLY WINS
  // ═══════════════════════════════════════════════
  async function loadWeeklyWins() {
    var container = document.getElementById('weekly-wins-data');
    if (!container) return;

    try {
      var data = await fetchJSON('/data/weekly-wins.json');
      var s = data.summary;

      var html = '';

      // Summary bar
      html += '<div class="wins-summary-grid">';
      html += '<div class="wins-summary-card reveal"><div class="wins-summary-num">' + s.total_signals + '</div><div class="wins-summary-label">Signals Fired</div></div>';
      html += '<div class="wins-summary-card reveal reveal-delay-1"><div class="wins-summary-num wins-green">' + s.win_rate + '%</div><div class="wins-summary-label">Win Rate</div></div>';
      html += '<div class="wins-summary-card reveal reveal-delay-2"><div class="wins-summary-num wins-green">' + formatPips(s.net_pips) + '</div><div class="wins-summary-label">Net Pips</div></div>';
      html += '<div class="wins-summary-card reveal reveal-delay-3"><div class="wins-summary-num">' + s.best_trade.symbol + ' <span class="wins-small">' + formatPips(s.best_trade.pips) + ' pips</span></div><div class="wins-summary-label">Best Trade</div></div>';
      html += '</div>';

      // Trade cards
      html += '<div class="wins-trades-grid">';
      data.top_trades.forEach(function (trade, i) {
        html += '<div class="wins-trade-card reveal' + (i > 0 ? ' reveal-delay-' + Math.min(i, 4) : '') + '">';
        html += '<div class="wins-trade-header">';
        html += '<span class="wins-trade-symbol">' + trade.symbol + '</span>';
        html += '<span class="wins-trade-grade" style="color:' + gradeColor(trade.grade) + ';">' + trade.grade + '</span>';
        html += '</div>';
        html += '<div class="wins-trade-direction">' + directionArrow(trade.direction) + '</div>';
        html += '<div class="wins-trade-stats">';
        html += '<div class="wins-trade-stat"><span class="wins-trade-stat-label">Pips</span><span class="wins-trade-stat-value wins-green">' + formatPips(trade.pips) + '</span></div>';
        html += '<div class="wins-trade-stat"><span class="wins-trade-stat-label">R:R</span><span class="wins-trade-stat-value">' + trade.rr + '</span></div>';
        html += '<div class="wins-trade-stat"><span class="wins-trade-stat-label">Score</span><span class="wins-trade-stat-value">' + trade.score + '/100</span></div>';
        html += '</div>';
        html += '<div class="wins-trade-meta">' + trade.session + ' \u2022 ' + formatDate(trade.timestamp) + '</div>';
        html += '</div>';
      });
      html += '</div>';

      // Week label
      html += '<div class="wins-week-label">Week of ' + data.week_label + ' \u2022 Updated automatically every Friday</div>';

      container.innerHTML = html;
      observeReveals(container);

    } catch (e) {
      container.innerHTML = '<p style="color:var(--text3);text-align:center;font-size:0.9em;">Results loading\u2026</p>';
    }
  }

  // ═══════════════════════════════════════════════
  //  2. COMMUNITY SPOTLIGHT
  // ═══════════════════════════════════════════════
  async function loadShoutouts() {
    var container = document.getElementById('shoutouts-data');
    if (!container) return;

    try {
      var data = await fetchJSON('/data/shoutouts.json');

      var html = '<div class="shoutout-scroll">';
      data.shoutouts.forEach(function (s, i) {
        var tc = tierColor(s.tier);
        html += '<div class="shoutout-card reveal' + (i > 0 ? ' reveal-delay-' + Math.min(i, 4) : '') + '" style="border-left:3px solid ' + tc.border + ';">';
        html += '<div class="shoutout-header">';
        html += '<div class="shoutout-avatar" style="background:' + tc.border + ';">' + s.avatar_initials + '</div>';
        html += '<div class="shoutout-info">';
        html += '<div class="shoutout-name">' + s.username + '</div>';
        html += '<span class="shoutout-tier" style="background:' + tc.bg + ';color:' + tc.color + ';">' + s.tier + '</span>';
        html += '</div>';
        html += '</div>';
        html += '<p class="shoutout-quote">\u201C' + s.quote + '\u201D</p>';
        html += '<div class="shoutout-date">' + formatDate(s.date) + '</div>';
        html += '</div>';
      });
      html += '</div>';

      container.innerHTML = html;
      observeReveals(container);

    } catch (e) {
      container.innerHTML = '<p style="color:var(--text3);text-align:center;font-size:0.9em;">Community stories loading\u2026</p>';
    }
  }

  // ═══════════════════════════════════════════════
  //  3. BLOG PREVIEW
  // ═══════════════════════════════════════════════
  async function loadBlogPreview() {
    var container = document.getElementById('blog-preview-data');
    if (!container) return;

    try {
      var data = await fetchJSON('/data/blog-index.json');
      var posts = data.posts.slice(0, 3);

      var html = '<div class="blog-preview-grid">';
      posts.forEach(function (post, i) {
        html += '<a href="/blog/' + post.slug + '/" class="blog-preview-card reveal' + (i > 0 ? ' reveal-delay-' + i : '') + '">';
        html += '<div class="blog-preview-tag">' + post.category + '</div>';
        html += '<h3 class="blog-preview-title">' + post.title + '</h3>';
        html += '<p class="blog-preview-excerpt">' + post.excerpt + '</p>';
        html += '<div class="blog-preview-meta">';
        html += '<span>' + formatDate(post.date) + '</span>';
        html += '<span>' + post.read_time + ' read</span>';
        html += '</div>';
        html += '<div class="blog-preview-cta">Read More \u2192</div>';
        html += '</a>';
      });
      html += '</div>';

      html += '<div style="text-align:center;margin-top:40px;">';
      html += '<a href="/blog/" class="btn btn-secondary">View All Posts \u2192</a>';
      html += '</div>';

      container.innerHTML = html;
      observeReveals(container);

    } catch (e) {
      container.innerHTML = '<p style="color:var(--text3);text-align:center;font-size:0.9em;">Blog loading\u2026</p>';
    }
  }

  // ═══════════════════════════════════════════════
  //  4. MONTHLY HIGHLIGHTS
  // ═══════════════════════════════════════════════
  async function loadMonthlyHighlights() {
    var container = document.getElementById('monthly-data');
    if (!container) return;

    // Update the heading dynamically
    var heading = document.getElementById('monthly-heading');


    try {
      var data = await fetchJSON('/data/monthly-highlights.json');
      var st = data.stats;

      if (heading) heading.innerHTML = data.month_label + ' in Numbers.';

      function delta(current, prev, suffix) {
        suffix = suffix || '';
        var diff = current - prev;
        if (diff === 0) return '';
        var cls = diff > 0 ? 'monthly-delta-up' : 'monthly-delta-down';
        var arrow = diff > 0 ? '\u25B2' : '\u25BC';
        return '<span class="' + cls + '">' + arrow + ' ' + Math.abs(diff).toFixed(1) + suffix + ' vs prev</span>';
      }

      var html = '<div class="monthly-stats-grid">';

      html += '<div class="monthly-stat-card reveal">';
      html += '<div class="monthly-stat-num">' + st.total_signals + '</div>';
      html += '<div class="monthly-stat-label">Total Signals</div>';
      html += '</div>';

      html += '<div class="monthly-stat-card reveal reveal-delay-1">';
      html += '<div class="monthly-stat-num monthly-green">' + st.win_rate + '%</div>';
      html += '<div class="monthly-stat-label">Win Rate</div>';
      html += delta(st.win_rate, st.prev_win_rate, '%');
      html += '</div>';

      html += '<div class="monthly-stat-card reveal reveal-delay-2">';
      html += '<div class="monthly-stat-num monthly-green">+' + st.net_pips.toFixed(1) + '</div>';
      html += '<div class="monthly-stat-label">Net Pips</div>';
      html += delta(st.net_pips, st.prev_net_pips);
      html += '</div>';

      html += '<div class="monthly-stat-card reveal reveal-delay-3">';
      html += '<div class="monthly-stat-num">' + st.best_instrument + '</div>';
      html += '<div class="monthly-stat-label">Best Instrument (' + st.best_instrument_winrate + '% WR)</div>';
      html += '</div>';

      html += '<div class="monthly-stat-card reveal">';
      html += '<div class="monthly-stat-num">' + st.trades_executed + '</div>';
      html += '<div class="monthly-stat-label">Trades Executed</div>';
      html += delta(st.trades_executed, st.prev_trades_executed);
      html += '</div>';

      html += '<div class="monthly-stat-card reveal reveal-delay-1">';
      html += '<div class="monthly-stat-num">' + st.avg_rr + '</div>';
      html += '<div class="monthly-stat-label">Avg Risk:Reward</div>';
      html += '</div>';

      html += '</div>';

      // Highlights list
      if (data.highlights && data.highlights.length > 0) {
        html += '<div class="monthly-highlights-list reveal">';
        html += '<div class="monthly-highlights-title">Key Highlights</div>';
        data.highlights.forEach(function (h) {
          html += '<div class="monthly-highlight-item"><span class="monthly-highlight-dot"></span>' + h + '</div>';
        });
        html += '</div>';
      }

      container.innerHTML = html;
      observeReveals(container);

    } catch (e) {
      container.innerHTML = '<p style="color:var(--text3);text-align:center;font-size:0.9em;">Monthly data loading\u2026</p>';
    }
  }

  // ═══════════════════════════════════════════════
  //  INIT — Load all sections on DOM ready
  // ═══════════════════════════════════════════════
  function init() {
    loadWeeklyWins();
    loadShoutouts();
    loadBlogPreview();
    loadMonthlyHighlights();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
