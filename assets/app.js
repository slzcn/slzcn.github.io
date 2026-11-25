const USER = 'slzcn';
const PROFILE_REPO = `${USER}.github.io`;

const state = {
  repos: [],
  filter: 'all',
  query: '',
  sort: 'pushed',
};

const LANG_COLORS = {
  JavaScript: '#f1e05a',
  HTML: '#e34c26',
  CSS: '#563d7c',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  Go: '#00add8',
  Java: '#b07219',
  Shell: '#89e051',
};

const grid = document.getElementById('grid');
const stateBox = document.getElementById('state');
const search = document.getElementById('search');
const sortSel = document.getElementById('sort');
const chips = document.getElementById('chips');
const statSummary = document.getElementById('stat-summary');

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function relTime(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

function isWebRepo(r) {
  if (r.homepage && r.homepage.trim()) return true;
  return ['HTML', 'JavaScript'].includes(r.language);
}

function matches(r) {
  if (r.name === PROFILE_REPO) return false;
  if (state.filter === 'web' && !isWebRepo(r)) return false;
  if (state.filter === 'tool' && isWebRepo(r)) return false;
  const q = state.query.trim().toLowerCase();
  if (q) {
    const hay = [r.name, r.description, (r.topics || []).join(' ')].join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sorted() {
  const list = state.repos.filter(matches);
  if (state.sort === 'stars') list.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
  else if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  else list.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
  return list;
}

function render() {
  const list = sorted();
  if (!list.length) {
    grid.innerHTML = '';
    showState('没有匹配的项目。换个关键词或分类试试。', false);
    return;
  }
  stateBox.classList.add('hidden');
  grid.innerHTML = list.map((r) => {
    const langColor = LANG_COLORS[r.language] || '#8b949e';
    const topics = (r.topics || []).slice(0, 6)
      .map((t) => `<span class="topic">${escapeHtml(t)}</span>`).join('');
    const demo = r.homepage && r.homepage.trim()
      ? `<a class="demo" href="${escapeHtml(r.homepage)}" target="_blank" rel="noopener">在线预览</a>` : '';
    return `
      <article class="card">
        <div class="card-top">
          <a class="card-name" href="${escapeHtml(r.html_url)}" target="_blank" rel="noopener">${escapeHtml(r.name)}</a>
          <span class="lang"><span class="dot" style="background:${langColor}"></span>${escapeHtml(r.language || '—')}</span>
        </div>
        <p class="card-desc">${escapeHtml(r.description || '暂无简介')}</p>
        ${topics ? `<div class="topics">${topics}</div>` : ''}
        <div class="meta">
          <span>⭐ <b>${r.stargazers_count || 0}</b></span>
          <span>🍴 <b>${r.forks_count || 0}</b></span>
          <span>更新于 ${relTime(r.pushed_at)}</span>
        </div>
        <div class="card-actions">
          <a href="${escapeHtml(r.html_url)}" target="_blank" rel="noopener">仓库</a>
          ${demo}
        </div>
      </article>`;
  }).join('');

  const stars = state.repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  statSummary.textContent = `${state.repos.length} 个项目 · ${stars} Stars`;
}

function showSkeleton() {
  grid.innerHTML = Array.from({ length: 6 }, () => `
    <div class="skeleton">
      <div class="line" style="width:40%"></div>
      <div class="line"></div>
      <div class="line" style="width:70%"></div>
    </div>`).join('');
}

function showState(msg, retry) {
  stateBox.classList.remove('hidden');
  stateBox.innerHTML = escapeHtml(msg) + (retry ? `<br><button class="retry" id="retry">重试</button>` : '');
  const btn = document.getElementById('retry');
  if (btn) btn.addEventListener('click', loadData);
}

async function loadCached() {
  try {
    const r = await fetch(`data/repos.json?ts=${Date.now()}`);
    if (r.ok) return await r.json();
  } catch (_) { /* 无缓存时直接走在线接口 */ }
  return null;
}

async function loadLive() {
  const r = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed&direction=desc`);
  if (!r.ok) throw new Error(`GitHub 接口返回 ${r.status}`);
  return r.json();
}

async function loadData() {
  const cached = await loadCached();
  if (cached && cached.length) {
    state.repos = cached;
    render();
  } else {
    showSkeleton();
  }
  try {
    const live = await loadLive();
    state.repos = Array.isArray(live) ? live : [];
    render();
  } catch (e) {
    if (!(cached && cached.length)) showState(e.message || '加载失败，请稍后重试。', true);
  }
}

chips.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  chips.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
  btn.classList.add('active');
  state.filter = btn.dataset.filter;
  render();
});

search.addEventListener('input', () => { state.query = search.value; render(); });
sortSel.addEventListener('change', () => { state.sort = sortSel.value; render(); });

loadData();
