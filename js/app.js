/* ============================================
   DESERVE — App (router + views)
   ============================================ */

(function () {
  const { state } = Store;
  const A = Store.actions;
  const H = Store.helpers;
  const $app = document.getElementById('app');

  /* ================= Utilidades ================= */

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const EMOJIS_TASK = ['🛏️', '🪥', '📚', '✏️', '🗑️', '🧹', '🍽️', '🐶', '🌱', '⚽', '🎹', '🧸', '👟', '🧺', '🚿', '🥗', '💧', '🎒'];
  const EMOJIS_KID = ['🦄', '🦖', '🐱', '🐼', '🦊', '🐸', '🦁', '🐧', '🐰', '🦋', '🐳', '🌟'];
  const EMOJIS_REWARD = ['💰', '🎮', '🍦', '🎡', '🎬', '🍕', '🛹', '📱', '🎨', '⚽', '🧸', '🎁'];
  const KID_COLORS = ['#ff5caa', '#46b6ff', '#8b5cf6', '#4ade80', '#fbbf24', '#ff7e5c'];
  const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const EVIDENCE_LABEL = { check: '✓ Check', photo: '📷 Foto', audio: '🎤 Áudio' };
  const REWARD_TYPE_LABEL = { mesada: '💵 Mesada', compra: '🛍️ Compra', desejo: '✨ Desejo' };
  const PERIODS = { manha: '☀️ Manhã', tarde: '🌤️ Tarde', noite: '🌙 Noite' };
  // rótulo curto de quando a missão deve ser feita (horário ou período)
  const PERIODS_BARE = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };
  const taskWhenLabel = (t, bare) => t.time
    ? (bare ? t.time : `🕘 ${t.time}`)
    : (t.period ? (bare ? PERIODS_BARE[t.period] : PERIODS[t.period]) : '');
  // valor p/ ordenar as missões do dia (mais cedo primeiro)
  const taskWhenSort = (t) => {
    if (t.time) { const [h, m] = t.time.split(':').map(Number); return h * 60 + m; }
    if (t.period) return { manha: 9 * 60, tarde: 14 * 60, noite: 20 * 60 }[t.period];
    return 24 * 60 + 1; // sem horário → por último
  };

  const childById = id => state.children.find(c => c.id === id);

  // Estilo de educação dos pais → guia as sugestões de pontos/custo
  const STYLES = {
    tranquilo:   { label: '😌 Tranquilo',   desc: 'pontos generosos, prêmios fáceis de alcançar', taskRec: 20, costMult: 0.8 },
    equilibrado: { label: '⚖️ Equilibrado', desc: 'meio-termo entre esforço e recompensa',        taskRec: 15, costMult: 1.0 },
    rigoroso:    { label: '💪 Rigoroso',     desc: 'pontos mais enxutos, prêmios mais conquistados', taskRec: 10, costMult: 1.3 },
  };
  // Resolve o estilo: se a missão/prêmio é de um único filho, usa o estilo dele;
  // caso contrário (vários filhos) usa o padrão da família.
  const styleKeyFor = (childIds) => {
    const ids = Array.isArray(childIds) ? childIds : (childIds ? [childIds] : []);
    if (ids.length === 1) {
      const c = childById(ids[0]);
      if (c && c.style && STYLES[c.style]) return c.style;
    }
    return state.settings?.parentStyle || 'equilibrado';
  };
  const parentStyle = (childIds) => STYLES[styleKeyFor(childIds)] || STYLES.equilibrado;
  const TASK_POINT_CHIPS = [5, 10, 15, 20, 30];
  const REWARD_COST_BY_TYPE = { mesada: 120, compra: 50, desejo: 80 };
  const recReward = (type, childIds) => Math.round((REWARD_COST_BY_TYPE[type] || 80) * parentStyle(childIds).costMult / 5) * 5;

  // ícones de linha (monocromáticos) para a tela de ajustes
  const ICONS = {
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    install: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;

  /* ================= Tema (dark / light / auto) + skins de personagem ================= */

  const THEME_LABEL = { auto: '🌗 Auto', light: '☀️ Claro', dark: '🌙 Escuro' };
  const systemLight = matchMedia('(prefers-color-scheme: light)');

  // skins de personagem (look & feel completo) — para crianças
  const SKINS = {
    default:  { label: 'Deserve', emoji: '✨', desc: 'o visual aurora original', bg: '#0b0b0f', accent: '#8b5cf6' },
    batman:   { label: 'Batman',  emoji: '🦇', desc: 'a noite de Gotham', bg: '#0a0a0d', accent: '#ffd84d' },
    superman: { label: 'Super-Homem', emoji: '🦸', desc: 'o herói de aço', bg: '#0a1430', accent: '#2e6bff' },
    spiderman: { label: 'Homem-Aranha', emoji: '🕷️', desc: 'o amigo da vizinhança', bg: '#120a1e', accent: '#e62429' },
    wonderwoman: { label: 'Mulher-Maravilha', emoji: '⚡', desc: 'a guerreira de Themyscira', bg: '#160a1c', accent: '#f0c040' },
    ladybug:  { label: 'Ladybug', emoji: '🐞', desc: 'a heroína de Paris', bg: '#190608', accent: '#e3262f' },
    barbie:   { label: 'Barbie',  emoji: '🎀', desc: 'brilho e diversão', bg: '#2c0f26', accent: '#ff4fa3' },
  };
  const skinBg = (s) => (SKINS[s] || SKINS.default).bg;
  // personagens só para filhos de 5 a 10 anos
  const skinAllowed = (child) => !!child && child.age >= 5 && child.age <= 10;

  // skin ativo = o do filho logado (se 5-10 anos); pais e filhos >10 usam o Deserve
  function activeSkin() {
    const sess = state.session;
    if (sess && sess.role === 'child') {
      const c = (state.children || []).find(x => x.id === sess.childId);
      if (skinAllowed(c) && c.skin && c.skin !== 'default') return c.skin;
    }
    return 'default';
  }

  function applyTheme() {
    const pref = state.settings?.theme || 'auto';
    let theme = pref === 'auto' ? (systemLight.matches ? 'light' : 'dark') : pref;
    const skin = activeSkin();
    if (skin === 'barbie') theme = 'light'; // Barbie combina com o tema claro
    document.documentElement.dataset.theme = theme;
    if (skin !== 'default') document.documentElement.dataset.skin = skin;
    else delete document.documentElement.dataset.skin;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = skin !== 'default' ? skinBg(skin) : (theme === 'light' ? '#f7f7f8' : '#0b0b0f');
  }

  systemLight.addEventListener('change', applyTheme);

  function avatarHtml(child, cls = 'avatar') {
    if (child.photo) {
      return `<div class="${cls} avatar-photo" style="border:1.5px solid ${child.color}88"><img data-avatar="${child.photo}" alt="${esc(child.name)}" /></div>`;
    }
    return `<div class="${cls}" style="background:${child.color}22;border:1.5px solid ${child.color}66">${child.emoji}</div>`;
  }

  // hidrata as fotos de avatar (carrega blobs do IndexedDB) — chamado após cada render
  const avatarUrlCache = {};
  function hydrateAvatars() {
    document.querySelectorAll('img[data-avatar]:not([src])').forEach(async img => {
      const key = img.dataset.avatar;
      if (avatarUrlCache[key]) { img.src = avatarUrlCache[key]; return; }
      const blob = await EvidenceDB.get(key);
      if (blob) { const url = URL.createObjectURL(blob); avatarUrlCache[key] = url; img.src = url; }
    });
  }

  /* ================= Toast ================= */

  function toast(msg, emoji = '✨') {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span>${emoji}</span><span>${esc(msg)}</span>`;
    root.appendChild(el);
    setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 320); }, 2600);
  }

  /* ================= Sheet (modal inferior) ================= */

  let sheetCleanup = null;
  function openSheet(html, onMount) {
    const root = document.getElementById('sheet-root');
    root.innerHTML = `
      <div class="sheet-backdrop"></div>
      <div class="sheet"><div class="sheet-handle"></div>${html}</div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('open')));
    root.querySelector('.sheet-backdrop').onclick = closeSheet;
    if (onMount) sheetCleanup = onMount(root.querySelector('.sheet')) || null;
  }

  function closeSheet() {
    const root = document.getElementById('sheet-root');
    if (sheetCleanup) { try { sheetCleanup(); } catch (e) {} sheetCleanup = null; }
    root.classList.remove('open');
    setTimeout(() => { root.innerHTML = ''; }, 400);
  }

  /* ================= Confetti ================= */

  function confetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    const colors = ['#ff5caa', '#46b6ff', '#8b5cf6', '#ff7e5c', '#4ade80', '#fbbf24'];
    const parts = Array.from({ length: 90 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.4,
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 16 * dpr,
      vy: (-8 - Math.random() * 10) * dpr,
      size: (4 + Math.random() * 5) * dpr,
      color: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
    }));
    let frame = 0;
    (function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.42 * dpr; p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (++frame < 130) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    })();
  }

  function celebrate(msg, emoji) {
    confetti();
    if (window.pulseOrbs) pulseOrbs();
    if (msg) toast(msg, emoji);
    if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
  }

  /* ================= Router ================= */

  function go(route) { location.hash = '#' + route; }

  window.addEventListener('hashchange', render);

  function currentRoute() {
    return (location.hash || '#').slice(1) || '';
  }

  let appUnlocked = false;

  function render() {
    closeSheet();
    applyTheme(); // skin segue o filho logado (gating por idade)
    const r = currentRoute();

    // ao sair do "Hoje", volta a visualização para o dia atual
    if (r !== 'c/home') childViewDate = null;
    if (r !== 'c/me') childHistDate = null;
    if (r !== 'c/rewards') childRewardsTab = 'resgatar';

    routeView(r);
    hydrateAvatars();
  }

  function routeView(r) {
    if (!state.onboarded) return viewOnboarding();
    if (state.settings?.appLock && state.parentPin && !appUnlocked) return viewLock();
    if (!state.session) {
      if (r === 'pin') return viewPin();
      return viewProfiles();
    }

    if (state.session.role === 'parent') {
      const views = {
        'p/home': viewParentHome,
        'p/tasks': viewParentTasks,
        'p/approvals': viewApprovals,
        'p/rewards': viewParentRewards,
        'p/analytics': viewAnalytics,
        'p/settings': viewSettings,
      };
      return (views[r] || viewParentHome)();
    }

    const child = childById(state.session.childId);
    if (!child) { A.logout(); return viewProfiles(); }
    const views = {
      'c/home': () => viewChildHome(child),
      'c/rewards': () => viewChildRewards(child),
      'c/me': () => viewChildMe(child),
      'c/settings': viewSettings,
    };
    return (views[r] || (() => viewChildHome(child)))();
  }

  /* ================= Navegação inferior ================= */

  const pendingSubs = () => state.submissions.filter(s => s.status === 'pending').length;
  const pendingReds = () => state.redemptions.filter(r => r.status === 'pending').length;
  function pendingCount() { return pendingSubs() + pendingReds(); }

  // A orbe é o centro de tudo: o dock fica no pé da tela e, ao tocar,
  // os menus se abrem em leque como orbes menores.
  const PARENT_ITEMS = [
    { route: 'p/home', icon: '🏠', label: 'Início' },
    { route: 'p/tasks', icon: '📋', label: 'Missões' },
    { route: 'p/approvals', icon: '✅', label: 'Aprovar', badge: () => pendingSubs() },
    { route: 'p/rewards', icon: '🎁', label: 'Prêmios', badge: () => pendingReds() },
    { route: 'p/analytics', icon: '📊', label: 'Análises' },
  ];
  const CHILD_ITEMS = [
    { route: 'c/home', icon: '⭐', label: 'Hoje' },
    { route: 'c/rewards', icon: '🎁', label: 'Prêmios' },
    { route: 'c/me', icon: '🏆', label: 'Eu', avatar: true },
  ];

  function orbNavHtml(active, items) {
    const n = pendingCount();
    const me = state.session?.role === 'child' ? childById(state.session.childId) : null;
    return `
    <nav class="orb-nav" id="orb-nav">
      <div class="orb-backdrop"></div>
      ${items.map((it, i) => {
        const b = it.badge ? it.badge() : 0;
        // o item "Eu" usa o avatar que a criança escolheu
        const useAvatar = it.avatar && me;
        const inner = useAvatar
          ? (me.photo
            ? `<span class="mini-orb mini-av has-photo" style="box-shadow:inset 0 0 0 2px ${me.color}"><img data-avatar="${me.photo}" alt="" /></span>`
            : `<span class="mini-orb mini-av" style="background:${me.color}33;box-shadow:inset 0 0 0 2px ${me.color}"></span>
               <span class="mini-emoji">${me.emoji}</span>`)
          : `<span class="mini-orb" data-mini></span>
             <span class="mini-emoji">${it.icon}</span>`;
        return `
        <button class="orb-item ${active === it.route ? 'active' : ''}" data-route="${it.route}">
          <span class="mini">
            ${inner}
            ${b ? `<span class="item-badge">${b}</span>` : ''}
          </span>
          <span class="label">${it.label}</span>
        </button>`;
      }).join('')}
      <button class="orb-dock-btn" data-dock aria-label="Menu">
        ${items === PARENT_ITEMS && n ? `<span class="dock-badge">${n}</span>` : ''}
      </button>
    </nav>`;
  }

  function parentNav(active) { return orbNavHtml(active, PARENT_ITEMS); }
  function childNav(active) { return orbNavHtml(active, CHILD_ITEMS); }

  function bindNav() {
    const nav = $app.querySelector('#orb-nav');
    if (!nav) return;
    const dock = nav.querySelector('[data-dock]');
    const dockOrb = mountOrb(dock, 64);
    const items = [...nav.querySelectorAll('.orb-item')];
    const N = items.length;

    items.forEach((el, i) => {
      mountOrb(el.querySelector('[data-mini]'), 56, { plain: true }); // só ícone, sem emblema de skin
      // leque acima do dock: de 165° (esq.) a 15° (dir.)
      const deg = 165 + (15 - 165) * (N === 1 ? 0.5 : i / (N - 1));
      const a = deg * Math.PI / 180;
      const rad = N > 4 ? 124 : 108;
      el.style.setProperty('--tx', `${Math.cos(a) * rad}px`);
      el.style.setProperty('--ty', `${-Math.sin(a) * rad - 30}px`);
      el.style.setProperty('--d', `${i * 0.04}s`);
      el.addEventListener('click', () => {
        nav.classList.remove('open');
        go(el.dataset.route);
      });
    });

    // esconde o relógio de lembrete enquanto o leque está aberto (evita
    // colidir com o item "Eu" e some junto no blur de foco)
    const rf = $app.querySelector('#reminder-fan');
    const syncReminder = (open) => {
      if (!rf) return;
      rf.classList.toggle('nav-hidden', open);
      if (open) rf.classList.remove('open');
    };

    dock.addEventListener('click', () => {
      const opening = !nav.classList.contains('open');
      nav.classList.toggle('open', opening);
      syncReminder(opening);
      if (opening) dockOrb.pulse();
    });
    nav.querySelector('.orb-backdrop').addEventListener('click', () => {
      nav.classList.remove('open');
      syncReminder(false);
    });
  }

  function headerHtml(title, opts = {}) {
    // header minimalista: sem orbe (a única orbe de navegação é a do dock) — só voltar / engrenagem
    return `
    <div class="header">
      <div class="title-wrap">
        ${opts.back ? `<button class="back-btn" data-back>←</button>` : ''}
      </div>
      ${opts.gear ? `<button class="back-btn" data-gear="${opts.gear}">⚙️</button>` : ''}
    </div>`;
  }

  function bindHeader(backRoute) {
    const orbEl = $app.querySelector('.header [data-orb]');
    if (orbEl) mountOrb(orbEl, 34);
    const back = $app.querySelector('[data-back]');
    if (back) back.onclick = () => go(backRoute || '');
    const gear = $app.querySelector('[data-gear]');
    if (gear) gear.onclick = () => go(gear.dataset.gear);
  }

  /* ================= Ajustes (tela cheia, minimalista) ================= */

  const THEME_VALUE = { auto: 'auto', light: 'claro', dark: 'escuro' };

  function viewSettings() {
    const role = state.session?.role;
    const back = role === 'parent' ? 'p/home' : 'c/me';
    const s = state.settings || {};
    const notify = !!s.notify;
    const lock = !!s.appLock;
    const canInstall = !!window.deferredInstall;

    // personagem é por filho (5-10 anos); pais e filhos >10 não têm seletor
    const meChild = role === 'child' ? childById(state.session.childId) : null;
    const showSkins = meChild && skinAllowed(meChild);
    const curSkin = meChild ? (meChild.skin || 'default') : 'default';
    const charSkins = Object.entries(SKINS).filter(([k]) => k !== 'default'); // 6 personagens
    $app.innerHTML = `
    <div class="screen no-nav settings-screen">
      <div class="settings-head">
        <button class="back-btn" data-back>←</button>
        <h1 class="settings-title">ajustes</h1>
      </div>

      ${showSkins ? `
      <div class="settings-block">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <p class="settings-label" style="margin:0">personagem</p>
          <button class="skin-reset ${curSkin === 'default' ? 'hidden' : ''}" id="skin-reset">↺ reset</button>
        </div>
        <div class="skin-grid" id="skin-grid" style="margin-top:10px">
          ${charSkins.map(([k, o]) => `
            <button class="skin-card ${k === curSkin ? 'active' : ''}" data-skin="${k}" style="--sk:${o.accent}">
              <span class="skin-emoji" style="background:${o.bg}">${o.emoji}</span>
              <span class="skin-name">${o.label}</span>
              <span class="skin-desc">${o.desc}</span>
            </button>`).join('')}
        </div>
      </div>` : (meChild ? `
      <div class="settings-block">
        <p class="settings-label">personagem</p>
        <p class="xsmall muted">Os personagens são para filhos de 5 a 10 anos. Peça aos seus pais para ajustar sua idade.</p>
      </div>` : '')}

      <div class="settings-group">
        <button class="settings-row" data-theme>
          <span class="ico">${icon('moon')}</span><span class="label">tema</span>
          <span class="val">${THEME_VALUE[s.theme || 'auto']}</span>
        </button>
        <button class="settings-row" data-notify>
          <span class="ico">${icon('bell')}</span><span class="label">notificações</span>
          <span class="toggle ${notify ? 'on' : ''}"><span class="knob"></span></span>
        </button>
        <button class="settings-row" data-lock>
          <span class="ico">${icon('lock')}</span><span class="label">bloquear com PIN</span>
          <span class="toggle ${lock ? 'on' : ''}"><span class="knob"></span></span>
        </button>
      </div>

      <div class="settings-group">
        <button class="settings-row" data-export>
          <span class="ico">${icon('download')}</span><span class="label">exportar dados</span>
          <span class="row-btn">${icon('download')}</span>
        </button>
        <button class="settings-row" data-feedback>
          <span class="ico">${icon('message')}</span><span class="label">enviar feedback</span><span class="chev">›</span>
        </button>
        <button class="settings-row danger" data-reset>
          <span class="ico">${icon('trash')}</span><span class="label">apagar todos os dados</span>
        </button>
      </div>

      ${role === 'parent' ? `
      <div class="settings-block" style="margin-top:18px">
        <p class="settings-label">estilo padrão da família</p>
        <div class="segmented" id="style-seg">
          ${Object.entries(STYLES).map(([v, o]) =>
            `<button data-s="${v}" class="${v === (s.parentStyle || 'equilibrado') ? 'active' : ''}">${o.label}</button>`).join('')}
        </div>
        <p class="xsmall muted" id="style-desc" style="margin-top:9px">💡 ${parentStyle().desc} — usado quando a missão é de vários filhos. Cada filho pode ter o seu próprio estilo no perfil.</p>
      </div>` : ''}

      <div class="settings-group">
        <button class="settings-row" data-terms><span class="ico">${icon('shield')}</span><span class="label">termos de uso</span><span class="chev">›</span></button>
        <button class="settings-row" data-privacy><span class="ico">${icon('doc')}</span><span class="label">política de privacidade</span><span class="chev">›</span></button>
      </div>

      <div class="settings-group">
        <button class="settings-row" data-switch><span class="ico">${icon('users')}</span><span class="label">trocar de perfil${role === 'child' ? ' 🔒' : ''}</span><span class="chev">›</span></button>
        ${canInstall ? `<button class="settings-row" data-install><span class="ico">${icon('install')}</span><span class="label">instalar o app</span><span class="chev">›</span></button>` : ''}
        <button class="settings-row" data-about><span class="ico">${icon('info')}</span><span class="label">sobre o deserve</span><span class="chev">›</span></button>
      </div>

      <p class="small muted" style="text-align:center;margin-top:26px">Deserve v1 · ${esc(state.family.name || 'sua família')}</p>
    </div>`;

    $app.querySelector('[data-back]').onclick = () => go(back);

    // personagem (skin) — troca o look & feel do app
    // personagem por filho + reset (volta ao Deserve)
    if (showSkins) {
      const setSkinUI = (sk) => {
        A.updateChild(meChild.id, { skin: sk });
        applyTheme();
        $app.querySelectorAll('#skin-grid .skin-card').forEach(x => x.classList.toggle('active', x.dataset.skin === sk));
        const reset = $app.querySelector('#skin-reset');
        if (reset) reset.classList.toggle('hidden', sk === 'default');
      };
      $app.querySelectorAll('#skin-grid .skin-card').forEach(b => b.onclick = () => {
        setSkinUI(b.dataset.skin);
        const o = SKINS[b.dataset.skin];
        toast(`${o.label} ativado!`, o.emoji);
      });
      const reset = $app.querySelector('#skin-reset');
      if (reset) reset.onclick = () => { setSkinUI('default'); toast('Voltou para o Deserve', '✨'); };
    }

    // estilo de educação (pais)
    $app.querySelectorAll('#style-seg button').forEach(b => b.onclick = () => {
      A.setParentStyle(b.dataset.s);
      $app.querySelectorAll('#style-seg button').forEach(x => x.classList.toggle('active', x === b));
      const desc = $app.querySelector('#style-desc');
      if (desc) desc.textContent = `💡 ${parentStyle().desc} — usamos isso para sugerir pontos e custos.`;
    });

    // tema — cicla auto → claro → escuro
    $app.querySelector('[data-theme]').onclick = (e) => {
      const order = ['auto', 'light', 'dark'];
      const next = order[(order.indexOf(state.settings?.theme || 'auto') + 1) % 3];
      A.setTheme(next); applyTheme();
      e.currentTarget.querySelector('.val').textContent = THEME_VALUE[next];
    };

    // notificações
    const nrow = $app.querySelector('[data-notify]');
    nrow.onclick = async () => {
      const tog = nrow.querySelector('.toggle');
      const turningOn = !tog.classList.contains('on');
      if (turningOn && 'Notification' in window && Notification.permission !== 'granted') {
        try { await Notification.requestPermission(); } catch (e) {}
      }
      const granted = !('Notification' in window) || Notification.permission === 'granted';
      const on = turningOn && granted;
      A.setNotify(on);
      tog.classList.toggle('on', on);
      if (turningOn && !granted) toast('Permita as notificações no navegador 🔔');
      else toast(on ? 'Notificações ativadas' : 'Notificações desativadas', on ? '🔔' : '🔕');
    };

    // bloquear com PIN
    const lrow = $app.querySelector('[data-lock]');
    lrow.onclick = () => {
      if (!state.parentPin) { toast('Defina um PIN dos pais primeiro', '🔒'); return; }
      const tog = lrow.querySelector('.toggle');
      const on = !tog.classList.contains('on');
      A.setAppLock(on);
      if (on) appUnlocked = true; // não bloqueia a sessão atual; vale no próximo acesso
      tog.classList.toggle('on', on);
      toast(on ? 'O app pedirá o PIN ao abrir' : 'Bloqueio desativado', on ? '🔒' : '🔓');
    };

    $app.querySelector('[data-export]').onclick = exportData;
    $app.querySelector('[data-feedback]').onclick = () => {
      location.href = 'mailto:oi@deserve.app?subject=' + encodeURIComponent('Feedback — Deserve');
    };
    $app.querySelector('[data-reset]').onclick = () => {
      if (confirm('Apagar tudo? Essa ação não pode ser desfeita.')) {
        A.resetAll(); appUnlocked = false; go(''); render();
      }
    };
    $app.querySelector('[data-terms]').onclick = () => openInfoSheet('termos de uso', TERMS_HTML);
    $app.querySelector('[data-privacy]').onclick = () => openInfoSheet('política de privacidade', PRIVACY_HTML);
    $app.querySelector('[data-switch]').onclick = () => {
      // filhos não trocam de perfil sozinhos — exige o PIN dos pais
      if (state.session?.role === 'child') {
        const pin = prompt('PIN dos pais para trocar de perfil:');
        if (pin === null) return;
        if (pin.trim() !== state.parentPin) { toast('PIN incorreto', '🔒'); return; }
      }
      A.logout(); go('');
    };
    const inst = $app.querySelector('[data-install]');
    if (inst) inst.onclick = () => window.deferredInstall.prompt();
    $app.querySelector('[data-about]').onclick = openAboutSheet;
  }

  function exportData() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `deserve-${H.todayStr()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Dados exportados (fotos/áudios ficam no aparelho)', '📤');
  }

  function openInfoSheet(title, html) {
    openSheet(`
      <h2 style="margin-bottom:12px;text-transform:lowercase">${title}</h2>
      <div class="small muted" style="line-height:1.75">${html}</div>
      <button class="btn btn-ghost" style="margin-top:16px" data-ok>entendi</button>
    `, sheet => { sheet.querySelector('[data-ok]').onclick = closeSheet; });
  }

  function openAboutSheet() {
    openSheet(`
      <div style="text-align:center;padding:6px 0 4px">
        <div data-about-orb style="margin:0 auto 14px"></div>
        <h2 class="gradient-text" style="font-size:30px">deserve</h2>
        <p class="small muted" style="margin-top:10px">conquiste o que você merece.<br/>tarefas viram pontos, pontos viram sonhos. ✨</p>
        <p class="xsmall muted" style="margin-top:16px">feito com 💜 para a sua família</p>
      </div>`, sheet => mountOrb(sheet.querySelector('[data-about-orb]'), 96));
  }

  const TERMS_HTML = `O Deserve é um app de tarefas e recompensas para famílias usarem juntas.
    Use com carinho e bom senso — as missões e os prêmios são combinados entre pais e filhos.
    O app é fornecido "como está", sem garantias. Você é responsável pelo uso que faz dele.`;

  const PRIVACY_HTML = `Sua privacidade vem primeiro: <b>todos os dados ficam só neste aparelho</b>.
    Tarefas, pontos e as evidências (fotos e áudios) são guardados localmente
    (localStorage e IndexedDB) e <b>nunca são enviados para servidores</b>.
    As evidências dos seus filhos não saem do dispositivo. Apagar os dados nos ajustes remove tudo.`;

  /* ================= Bloqueio do app (PIN) ================= */

  function viewLock() {
    let entered = '';
    $app.innerHTML = `
    <div class="screen no-nav onboarding" style="justify-content:center">
      <div class="orb-stage" data-orb style="width:96px;height:96px;margin-bottom:16px"></div>
      <h2 class="gradient-text" style="font-size:26px">deserve</h2>
      <p class="muted small">digite o PIN para desbloquear</p>
      <div class="pin-dots" id="pin-dots">${'<span></span>'.repeat(4)}</div>
      <div class="pin-pad">
        ${[1,2,3,4,5,6,7,8,9].map(n => `<button data-n="${n}">${n}</button>`).join('')}
        <button class="ghost"></button>
        <button data-n="0">0</button>
        <button class="ghost" data-del>⌫</button>
      </div>
    </div>`;
    const orb = mountOrb($app.querySelector('[data-orb]'), 96);
    const dots = $app.querySelector('#pin-dots');
    const refresh = () => [...dots.children].forEach((d, i) => d.classList.toggle('filled', i < entered.length));
    function check() {
      if (entered === state.parentPin) {
        appUnlocked = true; orb.pulse(); render();
      } else {
        dots.classList.add('shake');
        if (navigator.vibrate) navigator.vibrate(120);
        setTimeout(() => { dots.classList.remove('shake'); entered = ''; refresh(); }, 450);
      }
    }
    $app.querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
      if (entered.length >= 4) return;
      entered += b.dataset.n; refresh();
      if (entered.length === 4) setTimeout(check, 140);
    });
    $app.querySelector('[data-del]').onclick = () => { entered = entered.slice(0, -1); refresh(); };
  }

  /* ================= Onboarding ================= */

  const SLIDES = [
    { title: 'deserve', sub: 'Conquiste o que você merece. Tarefas viram pontos, pontos viram sonhos. ✨', cta: 'Começar' },
    { title: 'Missões em família', sub: 'Os pais criam as missões 📋, os filhos mostram que fizeram com foto, áudio ou check.', cta: 'Continuar' },
    { title: 'Recompensas reais', sub: 'Mesada, passeios e desejos combinados juntos. Aprovou, ganhou! 🎁', cta: 'Criar minha família' },
  ];

  function viewOnboarding(slideIdx = 0) {
    const s = SLIDES[slideIdx];
    $app.innerHTML = `
    <div class="screen no-nav onboarding">
      <div class="orb-stage" data-orb></div>
      <h1 class="${slideIdx === 0 ? 'gradient-text' : ''}">${s.title}</h1>
      <p>${s.sub}</p>
      <div class="dots">${SLIDES.map((_, i) => `<span class="${i === slideIdx ? 'active' : ''}"></span>`).join('')}</div>
      <div style="width:100%;max-width:320px;display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-aurora" data-next>${s.cta}</button>
        ${slideIdx === 0 ? `<button class="btn btn-ghost" data-demo>Explorar com dados de exemplo</button>` : ''}
      </div>
    </div>`;
    const orb = mountOrb($app.querySelector('[data-orb]'), 180);
    $app.querySelector('[data-next]').onclick = () => {
      orb.pulse();
      if (slideIdx < SLIDES.length - 1) viewOnboarding(slideIdx + 1);
      else viewSetup();
    };
    const demo = $app.querySelector('[data-demo]');
    if (demo) demo.onclick = () => {
      A.seedDemo();
      celebrate('Família demo criada! PIN dos pais: 1234', '🎉');
      go(''); render();
    };
  }

  /* ---------- Setup da família ---------- */

  function viewSetup() {
    let step = 1;
    let familyName = '';
    let pin = '';
    let kids = [];

    const bindDemo = () => {
      const d = $app.querySelector('#setup-demo');
      if (d) d.onclick = () => {
        A.seedDemo();
        celebrate('Família demo criada! PIN dos pais: 1234', '🎉');
        go(''); render();
      };
    };

    // Passo 1 — dados dos pais (nome da família + PIN)
    function renderStep1() {
      $app.innerHTML = `
      <div class="screen no-nav">
        <div class="header"><div class="title-wrap">
          <div class="header-orb" data-orb></div><h1 style="font-size:22px">Sua família</h1>
        </div></div>
        <div class="stagger">
          <p class="xsmall muted" style="margin-bottom:10px">Passo 1 de 2 · dados dos pais</p>
          <div class="field">
            <label>Nome da família</label>
            <input class="input" id="fam-name" placeholder="ex: Família Silva" maxlength="30" value="${esc(familyName)}" />
          </div>
          <div class="field">
            <label>PIN dos pais (4 dígitos)</label>
            <input class="input" id="fam-pin" placeholder="••••" inputmode="numeric" maxlength="4" type="password" value="${esc(pin)}" />
            <p class="xsmall muted" style="margin-top:5px">Protege a área dos pais — aprovações, tarefas e prêmios.</p>
          </div>
          <button class="btn btn-aurora" id="to-step2" style="margin-top:20px">Continuar →</button>
          <button class="btn btn-ghost" id="setup-demo" style="margin-top:10px">Explorar com dados de exemplo</button>
          <p class="xsmall muted" style="text-align:center;margin-top:6px">Cria uma família pronta (Theo e Mia) com missões para você testar.</p>
        </div>
      </div>`;
      mountOrb($app.querySelector('[data-orb]'), 34);
      bindDemo();
      $app.querySelector('#to-step2').onclick = () => {
        familyName = $app.querySelector('#fam-name').value.trim();
        pin = $app.querySelector('#fam-pin').value.trim();
        if (!/^\d{4}$/.test(pin)) { toast('O PIN precisa ter 4 números', '🔒'); return; }
        step = 2; renderStep2();
      };
    }

    // Passo 2 — filhos
    function renderStep2() {
      $app.innerHTML = `
      <div class="screen no-nav">
        <div class="header">
          <div class="title-wrap"><button class="back-btn" id="back-step1">←</button></div>
        </div>
        <div class="stagger">
          <h1 style="font-size:22px;margin-bottom:2px">Filhos</h1>
          <p class="xsmall muted" style="margin-bottom:14px">Passo 2 de 2 · adicione os filhos de ${esc(familyName || 'sua família')}</p>
          <div class="section-head"><h2>Filhos</h2>
            <button class="link-btn" id="add-kid">+ Adicionar</button>
          </div>
          <div id="kids-list">
            ${kids.length === 0 ? `<div class="empty-state"><div class="big-emoji">🧒</div>Adicione pelo menos um filho</div>` : ''}
            ${kids.map((k, i) => `
              <div class="task-row">
                <div class="avatar" style="background:${k.color}22;border:1.5px solid ${k.color}66">${k.emoji}</div>
                <div class="task-info"><div class="task-title">${esc(k.name)}</div></div>
                <button class="btn-sm btn btn-danger" data-rm="${i}">Remover</button>
              </div>`).join('')}
          </div>
          <button class="btn btn-aurora" id="finish" style="margin-top:20px" ${kids.length ? '' : 'disabled'}>Criar família ✨</button>
        </div>
      </div>`;
      mountOrb($app.querySelector('[data-orb]'), 34);
      $app.querySelector('#back-step1').onclick = () => { step = 1; renderStep1(); };
      $app.querySelector('#add-kid').onclick = () => openKidSheet(k => { kids.push(k); renderStep2(); });
      $app.querySelectorAll('[data-rm]').forEach(b =>
        b.onclick = () => { kids.splice(+b.dataset.rm, 1); renderStep2(); });
      $app.querySelector('#finish').onclick = () => {
        if (!kids.length) { toast('Adicione pelo menos um filho', '🧒'); return; }
        A.setupFamily({ familyName: familyName || 'Minha família', pin, children: kids });
        celebrate('Família criada! Bem-vindos ao Deserve', '🎉');
        go(''); render();
      };
    }

    renderStep1();
  }

  function openKidSheet(onSave, existing) {
    let emoji = existing?.emoji || EMOJIS_KID[0];
    let color = existing?.color || KID_COLORS[0];
    let age = existing?.age || '';
    let style = existing?.style || 'equilibrado';
    let photo = existing?.photo || null;      // chave no IndexedDB
    let photoBlob = null;                       // novo blob ainda não salvo
    openSheet(`
      <h2 style="margin-bottom:16px">${existing ? 'Editar' : 'Novo'} filho</h2>
      <div class="field"><label>Nome</label>
        <input class="input" id="kid-name" placeholder="ex: Ana" maxlength="20" value="${esc(existing?.name || '')}" />
      </div>
      <div class="field"><label>Idade</label>
        <input class="input" id="kid-age" inputmode="numeric" placeholder="ex: 7" maxlength="2" value="${existing?.age || ''}" />
        <p class="xsmall muted" style="margin-top:5px">Personagens (Batman, Barbie…) ficam disponíveis para 5–10 anos.</p>
      </div>
      <div class="field"><label>Estilo com este filho</label>
        <div class="segmented seg-style" id="kid-style">
          ${Object.entries(STYLES).map(([v, o]) => `<button data-st="${v}" class="${v === style ? 'active' : ''}">${o.label}</button>`).join('')}
        </div>
        <p class="xsmall muted" id="kid-style-desc" style="margin-top:6px">💡 ${STYLES[style].desc} — guia as sugestões de pontos e custos.</p>
      </div>
      <div class="field"><label>Foto do perfil</label>
        <div class="kid-photo-row">
          <div class="kid-photo-prev" id="kid-photo-prev"></div>
          <div style="display:flex;flex-direction:column;gap:8px;flex:1">
            <button class="btn btn-ghost btn-sm" id="kid-cam" style="width:100%">📸 Tirar foto</button>
            <button class="btn btn-ghost btn-sm" id="kid-gallery" style="width:100%">🖼️ Escolher do dispositivo</button>
            ${'' /* remover foto aparece só quando há foto */}
            <button class="btn btn-ghost btn-sm" id="kid-photo-clear" style="width:100%;display:none">✕ Remover foto</button>
          </div>
        </div>
        <input type="file" id="kid-file-cam" accept="image/*" capture="user" style="display:none" />
        <input type="file" id="kid-file-gal" accept="image/*" style="display:none" />
      </div>
      <div class="field" id="kid-avatar-fields"><label>Ou escolha um avatar</label>
        <div class="emoji-grid" id="kid-emojis">
          ${EMOJIS_KID.map(e => `<button data-e="${e}" class="${e === emoji ? 'active' : ''}">${e}</button>`).join('')}
        </div>
        <div class="chips" id="kid-colors" style="margin-top:12px">
          ${KID_COLORS.map(c => `<button class="chip ${c === color ? 'active' : ''}" data-c="${c}" style="width:42px;height:42px;border-radius:50%;background:${c};border:2.5px solid ${c === color ? '#fff' : 'transparent'}"></button>`).join('')}
        </div>
      </div>
      <button class="btn btn-aurora" id="kid-save">Salvar</button>
    `, sheet => {
      const prev = sheet.querySelector('#kid-photo-prev');
      const clearBtn = sheet.querySelector('#kid-photo-clear');
      const refreshPhoto = async () => {
        if (photoBlob) {
          prev.innerHTML = `<img src="${URL.createObjectURL(photoBlob)}" alt="" />`;
        } else if (photo) {
          const blob = await EvidenceDB.get(photo);
          prev.innerHTML = blob ? `<img src="${URL.createObjectURL(blob)}" alt="" />` : '';
        } else {
          prev.innerHTML = `<span style="font-size:26px">${emoji}</span>`;
        }
        clearBtn.style.display = (photoBlob || photo) ? 'flex' : 'none';
      };
      refreshPhoto();

      const handleFile = async (file) => {
        if (!file) return;
        photoBlob = await EvidenceDB.compressImage(file, 480, 0.78);
        photo = null; // será salvo no kid-save
        refreshPhoto();
      };
      const camFile = sheet.querySelector('#kid-file-cam');
      const galFile = sheet.querySelector('#kid-file-gal');
      sheet.querySelector('#kid-cam').onclick = () => camFile.click();
      sheet.querySelector('#kid-gallery').onclick = () => galFile.click();
      camFile.onchange = () => handleFile(camFile.files[0]);
      galFile.onchange = () => handleFile(galFile.files[0]);
      clearBtn.onclick = () => { photoBlob = null; photo = null; refreshPhoto(); };

      sheet.querySelectorAll('#kid-emojis button').forEach(b => b.onclick = () => {
        emoji = b.dataset.e;
        sheet.querySelectorAll('#kid-emojis button').forEach(x => x.classList.toggle('active', x === b));
        if (!photoBlob && !photo) refreshPhoto();
      });
      sheet.querySelectorAll('#kid-colors button').forEach(b => b.onclick = () => {
        color = b.dataset.c;
        sheet.querySelectorAll('#kid-colors button').forEach(x => {
          x.style.border = `2.5px solid ${x === b ? '#fff' : 'transparent'}`;
        });
      });
      sheet.querySelectorAll('#kid-style button').forEach(b => b.onclick = () => {
        style = b.dataset.st;
        sheet.querySelectorAll('#kid-style button').forEach(x => x.classList.toggle('active', x === b));
        const d = sheet.querySelector('#kid-style-desc');
        if (d) d.textContent = `💡 ${STYLES[style].desc} — guia as sugestões de pontos e custos.`;
      });
      sheet.querySelector('#kid-save').onclick = async () => {
        const name = sheet.querySelector('#kid-name').value.trim();
        const ageVal = parseInt(sheet.querySelector('#kid-age').value) || 0;
        if (!name) { toast('Dê um nome', '✏️'); return; }
        // salva a foto nova no IndexedDB
        if (photoBlob) { photo = 'av-' + H.uid(); await EvidenceDB.put(photo, photoBlob); }
        onSave({ name, emoji, color, age: ageVal, style, photo: photo || null });
        closeSheet();
      };
    });
  }

  /* ================= Perfis ================= */

  function viewProfiles() {
    $app.innerHTML = `
    <div class="screen no-nav onboarding" style="justify-content:center">
      <div class="orb-stage" data-orb style="width:110px;height:110px;margin-bottom:18px"></div>
      <h2 style="margin-bottom:4px">${esc(state.family.name || 'Deserve')}</h2>
      <p class="muted small" style="margin-bottom:26px">Quem está aí?</p>
      <div class="profiles-grid stagger">
        <button class="profile-card" data-parent>
          <div class="avatar avatar-lg" style="background:var(--aurora-soft);border:1.5px solid var(--border-strong)">👨‍👩‍👧</div>
          <span class="name">Pais</span>
          <span class="xsmall muted">🔒 com PIN</span>
        </button>
        ${state.children.map(c => `
          <button class="profile-card" data-child="${c.id}">
            ${avatarHtml(c, 'avatar avatar-lg')}
            <span class="name">${esc(c.name)}</span>
            <span class="points-pill">⭐ ${c.points}</span>
          </button>`).join('')}
        <button class="profile-card profile-add" data-add-kid>
          <div class="avatar avatar-lg add-circle">＋</div>
          <span class="name">Adicionar</span>
          <span class="xsmall muted">novo filho(a)</span>
        </button>
      </div>
    </div>`;
    mountOrb($app.querySelector('[data-orb]'), 110);
    $app.querySelector('[data-parent]').onclick = () => go('pin');
    $app.querySelectorAll('[data-child]').forEach(b => b.onclick = () => {
      A.login({ role: 'child', childId: b.dataset.child });
      go('c/home'); render();
    });
    $app.querySelector('[data-add-kid]').onclick = () => {
      openKidSheet(kid => {
        A.addChild(kid);
        celebrate(`${kid.name} entrou na família! 🎉`, '🧒');
        viewProfiles();
      });
    };
  }

  /* ================= PIN ================= */

  function viewPin() {
    let entered = '';
    $app.innerHTML = `
    <div class="screen no-nav onboarding" style="justify-content:center">
      <div class="orb-stage" data-orb style="width:90px;height:90px;margin-bottom:14px"></div>
      <h2>Área dos pais</h2>
      <p class="muted small">Digite o PIN de 4 dígitos</p>
      <div class="pin-dots" id="pin-dots">${'<span></span>'.repeat(4)}</div>
      <div class="pin-pad">
        ${[1,2,3,4,5,6,7,8,9].map(n => `<button data-n="${n}">${n}</button>`).join('')}
        <button class="ghost" data-cancel>✕</button>
        <button data-n="0">0</button>
        <button class="ghost" data-del>⌫</button>
      </div>
    </div>`;
    const orb = mountOrb($app.querySelector('[data-orb]'), 90);
    const dots = $app.querySelector('#pin-dots');

    function refresh() {
      [...dots.children].forEach((d, i) => d.classList.toggle('filled', i < entered.length));
    }
    function check() {
      if (entered === state.parentPin) {
        orb.pulse();
        A.login({ role: 'parent' });
        go('p/home'); render();
      } else {
        dots.classList.add('shake');
        if (navigator.vibrate) navigator.vibrate(120);
        setTimeout(() => { dots.classList.remove('shake'); entered = ''; refresh(); }, 450);
      }
    }
    $app.querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
      if (entered.length >= 4) return;
      entered += b.dataset.n;
      refresh();
      if (entered.length === 4) setTimeout(check, 140);
    });
    $app.querySelector('[data-del]').onclick = () => { entered = entered.slice(0, -1); refresh(); };
    $app.querySelector('[data-cancel]').onclick = () => go('');
  }

  /* ================= PAIS — Início ================= */

  function viewParentHome() {
    const today = H.todayStr();
    const n = pendingCount();
    $app.innerHTML = `
    <div class="screen">
      <div class="header">
        <div class="title-wrap"></div>
        <button class="back-btn" data-gear="p/settings">⚙️</button>
      </div>
      <div style="margin-bottom:6px">
        <h1 class="page-title" style="margin-bottom:2px">olá! 👋</h1>
        <p class="xsmall muted">${esc(state.family.name || 'Sua família')}</p>
      </div>
      <div class="stagger">
        ${n ? `
        <button class="card card-aurora tappable" data-go="p/approvals" style="width:100%;text-align:left;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-size:30px">🔔</div>
            <div style="flex:1">
              <h3>${n} ${n === 1 ? 'item esperando' : 'itens esperando'} sua aprovação</h3>
              <p class="small muted">Toque para revisar agora</p>
            </div>
            <span style="font-size:18px">→</span>
          </div>
        </button>` : `
        <div class="card" style="margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-size:30px">🌤️</div>
            <div><h3>Tudo em dia!</h3><p class="small muted">Nenhuma aprovação pendente.</p></div>
          </div>
        </div>`}

        <div class="section-head"><h2>Hoje, por filho</h2></div>
        ${state.children.map(c => {
          const due = H.tasksForChildOn(c.id, today)
            .sort((a, b) => taskWhenSort(a.task) - taskWhenSort(b.task));
          const done = due.filter(({ submission }) => submission && submission.status !== 'rejected').length;
          const pct = due.length ? Math.round(done / due.length * 100) : 0;
          const statusIcon = (s) => s === 'approved' ? '✅' : s === 'pending' ? '⏳' : s === 'rejected' ? '🔁' : '⬜';
          return `
          <div class="card tappable" data-kid-detail="${c.id}" style="margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
              ${avatarHtml(c)}
              <div style="flex:1">
                <h3>${esc(c.name)}</h3>
                <p class="xsmall muted">${done}/${due.length} missões de hoje · <span class="streak-flame">🔥 ${H.streakFor(c.id)}</span></p>
              </div>
              <span class="points-pill">⭐ ${c.points}</span>
            </div>
            <div class="progress-bar" style="margin-bottom:${due.length ? '12px' : '0'}"><div class="fill" style="width:${pct}%"></div></div>
            ${due.length ? `
            <div class="phome-missions">
              ${due.map(({ task, submission }) => `
                <div class="phome-mission ${submission && submission.status !== 'rejected' ? 'is-done' : ''}">
                  <span class="pm-emoji">${task.emoji}</span>
                  <span class="pm-title">${esc(task.title)}</span>
                  ${taskWhenLabel(task) ? `<span class="pm-when">${taskWhenLabel(task)}</span>` : ''}
                  <span class="pm-status">${statusIcon(submission && submission.status)}</span>
                </div>`).join('')}
            </div>` : `<p class="xsmall muted">Nenhuma missão para hoje 🎉</p>`}
          </div>`;
        }).join('')}

        <div class="section-head"><h2>Atalhos</h2></div>
        <div class="stat-grid">
          <button class="stat-card tappable card" data-go="p/tasks" style="text-align:left">
            <div style="font-size:24px;margin-bottom:6px">📋</div>
            <div style="font-weight:700;font-size:14px">Nova missão</div>
            <div class="xsmall muted">Criar tarefas e desafios</div>
          </button>
          <button class="stat-card tappable card" data-go="p/rewards" style="text-align:left">
            <div style="font-size:24px;margin-bottom:6px">🎁</div>
            <div style="font-weight:700;font-size:14px">Recompensas</div>
            <div class="xsmall muted">Mesada, compras, desejos</div>
          </button>
        </div>
      </div>
      ${parentNav('p/home')}
    </div>`;
    $app.querySelector('[data-gear]').onclick = (e) => go(e.currentTarget.dataset.gear);
    bindNav();
    $app.querySelectorAll('[data-go]').forEach(b =>
      b.addEventListener('click', () => go(b.dataset.go)));
    $app.querySelectorAll('[data-kid-detail]').forEach(b =>
      b.addEventListener('click', () => go('p/analytics')));
  }

  /* ================= PAIS — Tarefas ================= */

  function viewParentTasks() {
    $app.innerHTML = `
    <div class="screen">
      ${headerHtml('')}
      <h1 class="page-title">missões</h1>
      <div class="stagger">
        <button class="btn btn-aurora" id="new-task" style="margin:6px 0 18px">+ Criar missão</button>
        ${state.tasks.length === 0 ? `
          <div class="empty-state"><div class="big-emoji">🗺️</div>
            Nenhuma missão ainda.<br/>Crie a primeira para seus filhos!</div>` : ''}
        ${state.tasks.map(t => `
          <button class="task-row" data-edit="${t.id}" style="width:100%;text-align:left;${t.active ? '' : 'opacity:.45'}">
            <div class="task-emoji">${t.emoji}</div>
            <div class="task-info">
              <div class="task-title">${esc(t.title)}</div>
              <div class="task-meta">
                <span>${EVIDENCE_LABEL[t.evidence]}</span>
                <span>·</span>
                <span>${t.recurrence === 'daily' ? 'Todo dia' : t.recurrence === 'weekly' ? (t.days || []).map(d => WEEKDAYS[d]).join(', ') : 'Uma vez'}</span>
                ${taskWhenLabel(t) ? `<span>·</span><span>${taskWhenLabel(t)}</span>` : ''}
              </div>
              <div style="display:flex;gap:4px;margin-top:6px">
                ${t.childIds.map(id => { const c = childById(id); return c ? avatarHtml(c, 'avatar avatar-sm') : ''; }).join('')}
              </div>
            </div>
            <span class="points-pill">⭐ ${t.points}</span>
          </button>`).join('')}
      </div>
      ${parentNav('p/tasks')}
    </div>`;
    bindHeader(); bindNav();
    $app.querySelector('#new-task').onclick = () => openTaskSheet();
    $app.querySelectorAll('[data-edit]').forEach(b =>
      b.addEventListener('click', () => openTaskSheet(state.tasks.find(t => t.id === b.dataset.edit))));
  }

  function openTaskSheet(existing) {
    let emoji = existing?.emoji || EMOJIS_TASK[0];
    let evidence = existing?.evidence || 'check';
    let recurrence = existing?.recurrence || 'daily';
    let days = [...(existing?.days || [1, 2, 3, 4, 5])];
    let childIds = [...(existing?.childIds || state.children.map(c => c.id))];
    let whenMode = existing?.time ? 'time' : (existing?.period ? 'period' : 'none');
    let period = existing?.period || 'manha';
    let time = existing?.time || '08:00';

    openSheet(`
      <h2 style="margin-bottom:16px">${existing ? 'Editar' : 'Nova'} missão</h2>
      <div class="field"><label>Nome da missão</label>
        <input class="input" id="t-title" placeholder="ex: Arrumar a cama" maxlength="48" value="${esc(existing?.title || '')}" />
      </div>
      <div class="field"><label>Emoji</label>
        <div class="emoji-grid" id="t-emojis">
          ${EMOJIS_TASK.map(e => `<button data-e="${e}" class="${e === emoji ? 'active' : ''}">${e}</button>`).join('')}
        </div>
      </div>
      <div class="field"><label>Para quem?</label>
        <div class="chips" id="t-kids">
          ${state.children.map(c => `
            <button class="chip ${childIds.includes(c.id) ? 'active' : ''}" data-k="${c.id}">${c.emoji} ${esc(c.name)}</button>`).join('')}
        </div>
      </div>
      <div class="field"><label>Pontos ⭐</label>
        <input class="input" id="t-points" inputmode="numeric" value="${existing?.points ?? parentStyle(childIds).taskRec}" />
        <div class="chips" id="t-points-chips" style="margin-top:9px">
          ${TASK_POINT_CHIPS.map(p => `<button class="chip" data-p="${p}">${p}</button>`).join('')}
        </div>
        <p class="xsmall muted" id="t-style-hint" style="margin-top:8px"></p>
      </div>
      <div class="field"><label>Evidência exigida</label>
        <div class="segmented" id="t-evidence">
          ${['check', 'photo', 'audio'].map(e => `<button data-e="${e}" class="${e === evidence ? 'active' : ''}">${EVIDENCE_LABEL[e]}</button>`).join('')}
        </div>
      </div>
      <div class="field"><label>Frequência</label>
        <div class="segmented" id="t-rec">
          ${[['daily', 'Todo dia'], ['weekly', 'Dias da semana'], ['once', 'Uma vez']].map(([v, l]) =>
            `<button data-r="${v}" class="${v === recurrence ? 'active' : ''}">${l}</button>`).join('')}
        </div>
        <div class="chips" id="t-days" style="margin-top:10px;${recurrence === 'weekly' ? '' : 'display:none'}">
          ${WEEKDAYS.map((d, i) => `<button class="chip ${days.includes(i) ? 'active' : ''}" data-d="${i}">${d}</button>`).join('')}
        </div>
      </div>
      <div class="field"><label>Quando?</label>
        <div class="segmented" id="t-when">
          ${[['none', 'Qualquer hora'], ['period', 'Período'], ['time', 'Horário']].map(([v, l]) =>
            `<button data-w="${v}" class="${v === whenMode ? 'active' : ''}">${l}</button>`).join('')}
        </div>
        <div class="chips" id="t-period" style="margin-top:10px;${whenMode === 'period' ? '' : 'display:none'}">
          ${Object.entries(PERIODS).map(([v, l]) => `<button class="chip ${v === period ? 'active' : ''}" data-pd="${v}">${l}</button>`).join('')}
        </div>
        <div id="t-time-wrap" style="margin-top:10px;${whenMode === 'time' ? '' : 'display:none'}">
          <input class="input" type="time" id="t-time" value="${time}" />
        </div>
      </div>
      <button class="btn btn-aurora" id="t-save">${existing ? 'Salvar' : 'Criar missão ✨'}</button>
      ${existing ? `
        <div style="display:flex;gap:10px;margin-top:10px">
          <button class="btn btn-ghost" id="t-toggle">${existing.active ? '⏸️ Pausar' : '▶️ Reativar'}</button>
          <button class="btn btn-danger" id="t-del">🗑️ Excluir</button>
        </div>` : ''}
    `, sheet => {
      const pInput = sheet.querySelector('#t-points');
      const syncPChips = () => sheet.querySelectorAll('#t-points-chips .chip')
        .forEach(c => c.classList.toggle('active', +c.dataset.p === +pInput.value));
      sheet.querySelectorAll('#t-points-chips .chip').forEach(c => c.onclick = () => {
        pInput.value = c.dataset.p; syncPChips();
      });
      pInput.oninput = syncPChips; syncPChips();
      const styleHintEl = sheet.querySelector('#t-style-hint');
      const updateStyleHint = () => {
        const ps = parentStyle(childIds);
        const oneKid = childIds.length === 1;
        const c = oneKid ? childById(childIds[0]) : null;
        const who = c ? `de ${esc(c.name)}` : 'padrão da família';
        styleHintEl.innerHTML = `💡 estilo ${who} · ${ps.label}: simples ~${Math.max(5, ps.taskRec - 5)} pts · difíceis ~${ps.taskRec + 15} pts`;
      };
      updateStyleHint();
      sheet.querySelectorAll('#t-emojis button').forEach(b => b.onclick = () => {
        emoji = b.dataset.e;
        sheet.querySelectorAll('#t-emojis button').forEach(x => x.classList.toggle('active', x === b));
      });
      sheet.querySelectorAll('#t-kids .chip').forEach(b => b.onclick = () => {
        const id = b.dataset.k;
        childIds = childIds.includes(id) ? childIds.filter(x => x !== id) : [...childIds, id];
        b.classList.toggle('active');
        updateStyleHint();
      });
      sheet.querySelectorAll('#t-evidence button').forEach(b => b.onclick = () => {
        evidence = b.dataset.e;
        sheet.querySelectorAll('#t-evidence button').forEach(x => x.classList.toggle('active', x === b));
      });
      sheet.querySelectorAll('#t-rec button').forEach(b => b.onclick = () => {
        recurrence = b.dataset.r;
        sheet.querySelectorAll('#t-rec button').forEach(x => x.classList.toggle('active', x === b));
        sheet.querySelector('#t-days').style.display = recurrence === 'weekly' ? 'flex' : 'none';
      });
      sheet.querySelectorAll('#t-days .chip').forEach(b => b.onclick = () => {
        const d = +b.dataset.d;
        days = days.includes(d) ? days.filter(x => x !== d) : [...days, d];
        b.classList.toggle('active');
      });
      sheet.querySelectorAll('#t-when button').forEach(b => b.onclick = () => {
        whenMode = b.dataset.w;
        sheet.querySelectorAll('#t-when button').forEach(x => x.classList.toggle('active', x === b));
        sheet.querySelector('#t-period').style.display = whenMode === 'period' ? 'flex' : 'none';
        sheet.querySelector('#t-time-wrap').style.display = whenMode === 'time' ? 'block' : 'none';
      });
      sheet.querySelectorAll('#t-period .chip').forEach(b => b.onclick = () => {
        period = b.dataset.pd;
        sheet.querySelectorAll('#t-period .chip').forEach(x => x.classList.toggle('active', x === b));
      });
      sheet.querySelector('#t-save').onclick = () => {
        const title = sheet.querySelector('#t-title').value.trim();
        const points = Math.max(1, parseInt(sheet.querySelector('#t-points').value) || 10);
        if (!title) { toast('Dê um nome para a missão', '✏️'); return; }
        if (!childIds.length) { toast('Escolha pelo menos um filho', '🧒'); return; }
        if (recurrence === 'weekly' && !days.length) { toast('Escolha os dias da semana', '📅'); return; }
        const tv = sheet.querySelector('#t-time').value;
        const data = {
          title, emoji, points, childIds, evidence, recurrence, days,
          period: whenMode === 'period' ? period : null,
          time: whenMode === 'time' ? (tv || null) : null,
        };
        if (existing) { A.updateTask(existing.id, data); toast('Missão atualizada', '✅'); }
        else { A.addTask(data); celebrate('Missão criada!', '🚀'); }
        closeSheet(); render();
      };
      if (existing) {
        sheet.querySelector('#t-toggle').onclick = () => {
          A.updateTask(existing.id, { active: !existing.active });
          closeSheet(); render();
        };
        sheet.querySelector('#t-del').onclick = () => {
          if (confirm('Excluir esta missão?')) { A.deleteTask(existing.id); closeSheet(); render(); }
        };
      }
    });
  }

  /* ================= PAIS — Aprovações ================= */

  function viewApprovals(filter = 'today') {
    const today = H.todayStr();
    const weekAgo = H.dateOffset(-6);
    let subs = state.submissions.filter(s => s.status === 'pending');
    if (filter === 'today') subs = subs.filter(s => s.date === today);
    else subs = subs.filter(s => s.date >= weekAgo);
    subs.sort((a, b) => b.submittedAt - a.submittedAt);

    $app.innerHTML = `
    <div class="screen">
      ${headerHtml('')}
      <h1 class="page-title">aprovar</h1>
      <div class="segmented" id="filter" style="margin:6px 0 18px">
        <button data-f="today" class="${filter === 'today' ? 'active' : ''}">Hoje</button>
        <button data-f="week" class="${filter === 'week' ? 'active' : ''}">Últimos 7 dias</button>
      </div>
      <div class="stagger">
        ${subs.length === 0 ? `
          <div class="empty-state"><div class="big-emoji">🎈</div>Nada para aprovar por aqui!</div>` : ''}

        ${subs.map(s => {
          const c = childById(s.childId);
          return `
          <div class="card" style="margin-bottom:12px" data-sub="${s.id}">
            <div style="display:flex;align-items:center;gap:11px;margin-bottom:8px">
              ${c ? avatarHtml(c) : ''}
              <div style="flex:1;min-width:0">
                <h3>${s.taskEmoji} ${esc(s.taskTitle)}</h3>
                <p class="xsmall muted">${esc(c?.name || '?')} · ${s.date === today ? 'hoje' : s.date.split('-').reverse().slice(0, 2).join('/')} · ${EVIDENCE_LABEL[s.evidenceType]}</p>
              </div>
              <span class="points-pill">⭐ ${s.points}</span>
            </div>
            ${s.evidenceType === 'photo' && s.evidenceKey ? `
              <div class="evidence-preview"><img data-ev-img="${s.evidenceKey}" alt="evidência" /></div>` : ''}
            ${s.evidenceType === 'audio' && s.evidenceKey ? `
              <audio controls data-ev-audio="${s.evidenceKey}"></audio>` : ''}
            ${s.evidenceType === 'check' ? `
              <p class="small muted" style="margin-bottom:4px">✓ Confirmado pelo próprio filho</p>` : ''}
            <div style="display:flex;gap:10px;margin-top:12px">
              <button class="btn btn-success" data-approve="${s.id}">👍 Aprovar</button>
              <button class="btn btn-danger" data-reject="${s.id}">👎 Refazer</button>
            </div>
          </div>`;
        }).join('')}
      </div>
      ${parentNav('p/approvals')}
    </div>`;
    bindHeader(); bindNav();

    $app.querySelectorAll('#filter button').forEach(b =>
      b.onclick = () => viewApprovals(b.dataset.f));

    // hidrata evidências do IndexedDB
    $app.querySelectorAll('[data-ev-img]').forEach(async img => {
      const blob = await EvidenceDB.get(img.dataset.evImg);
      if (blob) img.src = URL.createObjectURL(blob);
    });
    $app.querySelectorAll('[data-ev-audio]').forEach(async au => {
      const blob = await EvidenceDB.get(au.dataset.evAudio);
      if (blob) au.src = URL.createObjectURL(blob);
    });

    $app.querySelectorAll('[data-approve]').forEach(b => b.onclick = () => {
      A.reviewSubmission(b.dataset.approve, true);
      celebrate('Aprovado! Pontos entregues ⭐', '👏');
      viewApprovals(filter);
    });
    $app.querySelectorAll('[data-reject]').forEach(b => b.onclick = () => {
      openSheet(`
        <h2 style="margin-bottom:6px">Pedir para refazer</h2>
        <p class="small muted" style="margin-bottom:14px">Deixe um recado carinhoso explicando o porquê 💬</p>
        <div class="field"><textarea class="input" id="rej-msg" rows="3" placeholder="ex: Faltou guardar os brinquedos…"></textarea></div>
        <button class="btn btn-danger" id="rej-ok">Enviar para refazer</button>
      `, sheet => {
        sheet.querySelector('#rej-ok').onclick = () => {
          A.reviewSubmission(b.dataset.reject, false, sheet.querySelector('#rej-msg').value.trim());
          toast('Enviado para refazer', '📨');
          closeSheet(); viewApprovals(filter);
        };
      });
    });
  }

  /* ================= PAIS — Recompensas ================= */

  function viewParentRewards() {
    const reqs = state.redemptions
      .filter(r => r.status === 'pending' || r.status === 'suggested')
      .sort((a, b) => b.requestedAt - a.requestedAt);

    $app.innerHTML = `
    <div class="screen">
      ${headerHtml('')}
      <h1 class="page-title">recompensas</h1>
      <div class="stagger">
        ${reqs.length ? `<div class="section-head"><h2>pedidos de resgate</h2></div>` : ''}
        ${reqs.map(r => {
          const c = childById(r.childId);
          const wanted = r.desiredDate ? `quer para <b>${dateLabel(r.desiredDate)}</b>` : 'quer <b>agora</b>';
          const sugg = r.status === 'suggested' ? ` · você sugeriu ${dateLabel(r.parentDate)} (aguardando)` : '';
          return `
          <div class="reward-entry">
            <div class="reward-top">
              <div class="reward-name">${r.emoji} ${esc(r.title)}</div>
              <div class="reward-cost-big">⭐<b>${r.cost}</b></div>
            </div>
            <div class="swipe-wrap">
              <div class="swipe-actions">
                <button class="swipe-act a-redeem" data-grant="${r.id}"><span>✅</span>conceder</button>
                <button class="swipe-act a-date" data-suggest="${r.id}"><span>📅</span>sugerir data</button>
              </div>
              <div class="swipe-card reward-block" style="background:${cardBg(c ? c.color : '#8b5cf6')}">
                <div class="reward-emoji">${c ? c.emoji : '🎁'}</div>
                <div class="reward-hint">${esc(c?.name || '?')} ${wanted}${sugg} · ← arraste</div>
              </div>
            </div>
          </div>`;
        }).join('')}

        <div class="section-head"><h2>catálogo</h2>
          <button class="link-btn" id="new-reward">+ criar</button>
        </div>
        ${state.rewards.length === 0 ? `
          <div class="empty-state"><div class="big-emoji">🎁</div>Nenhuma recompensa ainda.</div>` : ''}
        ${state.rewards.map(r => `
          <button class="task-row" data-edit="${r.id}" style="width:100%;text-align:left;${r.active ? '' : 'opacity:.45'}">
            <div class="task-emoji">${r.emoji}</div>
            <div class="task-info">
              <div class="task-title">${esc(r.title)}</div>
              <div class="task-meta"><span>${REWARD_TYPE_LABEL[r.type] || r.type}</span></div>
              <div style="display:flex;gap:4px;margin-top:6px">
                ${r.childIds.map(id => { const c = childById(id); return c ? avatarHtml(c, 'avatar avatar-sm') : ''; }).join('')}
              </div>
            </div>
            <span class="points-pill">⭐ ${r.cost}</span>
          </button>`).join('')}
      </div>
      ${parentNav('p/rewards')}
    </div>`;
    bindHeader(); bindNav(); bindSwipe($app);
    $app.querySelector('#new-reward').onclick = () => openRewardSheet();
    $app.querySelectorAll('[data-edit]').forEach(b =>
      b.addEventListener('click', () => openRewardSheet(state.rewards.find(r => r.id === b.dataset.edit))));
    $app.querySelectorAll('[data-grant]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      A.reviewRedemption(b.dataset.grant, true);
      celebrate('Prêmio concedido! 🎁', '🎉'); render();
    });
    $app.querySelectorAll('[data-suggest]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const red = state.redemptions.find(r => r.id === b.dataset.suggest);
      openDateSheet(`${red.emoji} ${esc(red.title)}`, (date) => {
        A.suggestRedemptionDate(red.id, date);
        toast(`Sugerido ${dateLabel(date)} — aguardando o filho`, '📅'); render();
      });
    });
  }

  function openRewardSheet(existing) {
    let emoji = existing?.emoji || EMOJIS_REWARD[0];
    let type = existing?.type || 'desejo';
    let childIds = [...(existing?.childIds || state.children.map(c => c.id))];

    openSheet(`
      <h2 style="margin-bottom:16px">${existing ? 'Editar' : 'Nova'} recompensa</h2>
      <div class="field"><label>O que é?</label>
        <input class="input" id="r-title" placeholder="ex: 1h de videogame extra" maxlength="60" value="${esc(existing?.title || '')}" />
      </div>
      <div class="field"><label>Emoji</label>
        <div class="emoji-grid" id="r-emojis">
          ${EMOJIS_REWARD.map(e => `<button data-e="${e}" class="${e === emoji ? 'active' : ''}">${e}</button>`).join('')}
        </div>
      </div>
      <div class="field"><label>Tipo</label>
        <div class="segmented" id="r-type">
          ${Object.entries(REWARD_TYPE_LABEL).map(([v, l]) => `<button data-t="${v}" class="${v === type ? 'active' : ''}">${l}</button>`).join('')}
        </div>
      </div>
      <div class="field"><label>Custo em pontos ⭐</label>
        <input class="input" id="r-cost" inputmode="numeric" value="${existing?.cost ?? recReward(type, childIds)}" />
        <div class="chips" id="r-cost-chips" style="margin-top:9px">
          ${[25, 50, 100, 150, 200].map(p => `<button class="chip" data-p="${p}">${p}</button>`).join('')}
        </div>
        <p class="xsmall muted" id="r-cost-hint" style="margin-top:8px"></p>
      </div>
      <div class="field"><label>Para quem?</label>
        <div class="chips" id="r-kids">
          ${state.children.map(c => `
            <button class="chip ${childIds.includes(c.id) ? 'active' : ''}" data-k="${c.id}">${c.emoji} ${esc(c.name)}</button>`).join('')}
        </div>
      </div>
      <button class="btn btn-aurora" id="r-save">${existing ? 'Salvar' : 'Criar recompensa ✨'}</button>
      ${existing ? `<button class="btn btn-danger" id="r-del" style="margin-top:10px">🗑️ Excluir</button>` : ''}
    `, sheet => {
      const cInput = sheet.querySelector('#r-cost');
      const cHint = sheet.querySelector('#r-cost-hint');
      const syncCost = () => {
        sheet.querySelectorAll('#r-cost-chips .chip').forEach(c => c.classList.toggle('active', +c.dataset.p === +cInput.value));
        const oneKid = childIds.length === 1;
        const c = oneKid ? childById(childIds[0]) : null;
        const who = c ? `de ${esc(c.name)}` : 'padrão da família';
        cHint.innerHTML = `💡 estilo ${who} · ${parentStyle(childIds).label}: ${REWARD_TYPE_LABEL[type]} costuma valer ~<b>${recReward(type, childIds)}</b> pts`;
      };
      sheet.querySelectorAll('#r-cost-chips .chip').forEach(c => c.onclick = () => { cInput.value = c.dataset.p; syncCost(); });
      cInput.oninput = syncCost; syncCost();
      sheet.querySelectorAll('#r-emojis button').forEach(b => b.onclick = () => {
        emoji = b.dataset.e;
        sheet.querySelectorAll('#r-emojis button').forEach(x => x.classList.toggle('active', x === b));
      });
      sheet.querySelectorAll('#r-type button').forEach(b => b.onclick = () => {
        type = b.dataset.t;
        sheet.querySelectorAll('#r-type button').forEach(x => x.classList.toggle('active', x === b));
        syncCost();
      });
      sheet.querySelectorAll('#r-kids .chip').forEach(b => b.onclick = () => {
        const id = b.dataset.k;
        childIds = childIds.includes(id) ? childIds.filter(x => x !== id) : [...childIds, id];
        b.classList.toggle('active');
        syncCost();
      });
      sheet.querySelector('#r-save').onclick = () => {
        const title = sheet.querySelector('#r-title').value.trim();
        const cost = Math.max(1, parseInt(sheet.querySelector('#r-cost').value) || 50);
        if (!title) { toast('Descreva a recompensa', '✏️'); return; }
        if (!childIds.length) { toast('Escolha pelo menos um filho', '🧒'); return; }
        const data = { title, emoji, cost, type, childIds };
        if (existing) { A.updateReward(existing.id, data); toast('Recompensa atualizada', '✅'); }
        else { A.addReward(data); celebrate('Recompensa criada!', '🎁'); }
        closeSheet(); render();
      };
      if (existing) sheet.querySelector('#r-del').onclick = () => {
        if (confirm('Excluir esta recompensa?')) { A.deleteReward(existing.id); closeSheet(); render(); }
      };
    });
  }

  /* ================= PAIS — Analytics ================= */

  let analyticsChild = null;
  let analyticsPeriod = 7;

  function viewAnalytics() {
    if (!analyticsChild || !childById(analyticsChild)) analyticsChild = state.children[0]?.id;
    const child = childById(analyticsChild);
    if (!child) {
      $app.innerHTML = `<div class="screen">${headerHtml('')}<h1 class="page-title">análises</h1><div class="empty-state"><div class="big-emoji">📊</div>Adicione filhos para ver análises.</div>${parentNav('p/analytics')}</div>`;
      bindHeader(); bindNav(); return;
    }
    const a = H.analyticsFor(child.id, analyticsPeriod);
    const series = a.series;

    const insight = a.rate >= 80
      ? `${child.name} está voando! 🚀 Taxa de ${a.rate}% — considere celebrar com um prêmio surpresa.`
      : a.rate >= 50
        ? `${child.name} está no caminho. 💪 Que tal revisar juntos as missões que ficaram para trás?`
        : a.dueTotal === 0
          ? `Sem missões no período. Crie desafios para ${child.name} começar a pontuar!`
          : `${child.name} precisa de um empurrãozinho. 🤗 Talvez missões menores ou recompensas mais próximas ajudem.`;

    $app.innerHTML = `
    <div class="screen">
      ${headerHtml('')}
      <h1 class="page-title">análises</h1>
      <div class="chips" style="margin:6px 0 14px" id="kid-chips">
        ${state.children.map(c => `
          <button class="chip ${c.id === analyticsChild ? 'active' : ''}" data-k="${c.id}">${c.emoji} ${esc(c.name)}</button>`).join('')}
      </div>
      <div class="segmented" id="period" style="margin-bottom:18px">
        <button data-p="7" class="${analyticsPeriod === 7 ? 'active' : ''}">7 dias</button>
        <button data-p="30" class="${analyticsPeriod === 30 ? 'active' : ''}">30 dias</button>
      </div>
      <div class="stagger">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-value gradient-text">${a.rate}%</div><div class="stat-label">Taxa de conclusão</div></div>
          <div class="stat-card"><div class="stat-value">⭐ ${a.pointsEarned}</div><div class="stat-label">Pontos ganhos</div></div>
          <div class="stat-card"><div class="stat-value">🔥 ${a.streak}</div><div class="stat-label">Dias seguidos</div></div>
          <div class="stat-card"><div class="stat-value">${a.doneTotal}/${a.dueTotal}</div><div class="stat-label">Missões concluídas</div></div>
        </div>

        <div class="card" style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">
            <h3>Saúde das missões</h3>
            <span class="xsmall muted">últimos ${analyticsPeriod} dias</span>
          </div>
          <div class="bar-chart ${analyticsPeriod > 7 ? 'bar-chart-dense' : ''}">
            ${series.map((d, i) => {
              const pct = d.due ? (d.done / d.due) : 0;
              const day = new Date(d.date + 'T12:00:00');
              const label = analyticsPeriod <= 7
                ? WEEKDAYS[day.getDay()]
                : (i % 5 === 0 || i === series.length - 1 ? day.getDate() : '');
              return `
              <div class="bar-col">
                <div class="bar ${d.due === 0 ? 'empty' : ''}" style="height:${Math.max(4, pct * 100)}%" title="${d.date}: ${d.done}/${d.due}"></div>
                <div class="bar-label">${label}</div>
              </div>`;
            }).join('')}
          </div>
          <p class="xsmall muted" style="margin-top:8px;text-align:center">${a.doneTotal} de ${a.dueTotal} missões conquistadas · ${a.rate}% no período</p>
        </div>

        <div class="card card-aurora" style="margin-bottom:14px">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div class="header-orb" data-orb style="flex-shrink:0"></div>
            <div>
              <h3 style="margin-bottom:4px">Insight do Deserve</h3>
              <p class="small" style="color:var(--text-2)">${insight}</p>
            </div>
          </div>
        </div>

        ${a.rejected ? `<p class="small muted" style="text-align:center">${a.rejected} ${a.rejected === 1 ? 'missão pedida' : 'missões pedidas'} para refazer no período</p>` : ''}
      </div>
      ${parentNav('p/analytics')}
    </div>`;
    bindHeader(); bindNav();
    const orbEl = $app.querySelector('.card-aurora [data-orb]');
    if (orbEl) mountOrb(orbEl, 34);
    $app.querySelectorAll('#kid-chips .chip').forEach(b =>
      b.onclick = () => { analyticsChild = b.dataset.k; viewAnalytics(); });
    $app.querySelectorAll('#period button').forEach(b =>
      b.onclick = () => { analyticsPeriod = +b.dataset.p; viewAnalytics(); });
  }

  /* ================= FILHO — Hoje (carrossel de missões) ================= */

  let childPagerIndex = 0;
  let childViewDate = null; // dia visualizado no carrossel (null = hoje)
  let childHistDate = null; // dia visualizado no histórico do "Eu" (null = hoje)
  let childRewardsTab = 'resgatar'; // 'resgatar' | 'resgates'
  const EVIDENCE_ICON = { photo: '📷', audio: '🎤', check: '✓' };
  const EVIDENCE_VERB = { photo: 'tirar foto', audio: 'gravar áudio', check: 'marcar feito' };

  function hexA(hex, a) {
    const h = hex.replace('#', '');
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
  }
  function cardBg(color) {
    const skin = document.documentElement.dataset.skin;
    if (skin === 'batman') {
      // Gotham: preto profundo com brilho dourado do bat-signal
      return `radial-gradient(120% 80% at 30% 8%, ${hexA('#ffd84d',0.14)}, transparent 52%),`
           + `radial-gradient(120% 90% at 82% 30%, ${hexA('#6b5a18',0.32)}, transparent 56%),`
           + `radial-gradient(150% 100% at 50% 112%, ${hexA('#caa12e',0.26)}, transparent 60%),`
           + `linear-gradient(180deg, #141209, #060607)`;
    }
    if (skin === 'superman') {
      return `radial-gradient(120% 75% at 28% 12%, ${hexA('#2e6bff',0.5)}, transparent 58%),`
           + `radial-gradient(110% 80% at 82% 26%, ${hexA('#e3262f',0.34)}, transparent 55%),`
           + `radial-gradient(150% 95% at 50% 110%, ${hexA('#1e4fd6',0.55)}, transparent 62%),`
           + `linear-gradient(180deg, #102046, #0a1430)`;
    }
    if (skin === 'spiderman') {
      return `radial-gradient(120% 78% at 28% 10%, ${hexA('#e62429',0.42)}, transparent 56%),`
           + `radial-gradient(115% 85% at 82% 30%, ${hexA('#2b4bd6',0.34)}, transparent 56%),`
           + `radial-gradient(150% 100% at 50% 112%, ${hexA('#b81620',0.45)}, transparent 60%),`
           + `linear-gradient(180deg, #1b1230, #0c0718)`;
    }
    if (skin === 'wonderwoman') {
      return `radial-gradient(120% 78% at 28% 10%, ${hexA('#f0c040',0.22)}, transparent 56%),`
           + `radial-gradient(115% 85% at 82% 28%, ${hexA('#e3262f',0.34)}, transparent 56%),`
           + `radial-gradient(150% 100% at 50% 112%, ${hexA('#2a4fb0',0.4)}, transparent 60%),`
           + `linear-gradient(180deg, #20122a, #120a18)`;
    }
    if (skin === 'ladybug') {
      return `radial-gradient(120% 78% at 28% 12%, ${hexA('#ff2e3e',0.5)}, transparent 56%),`
           + `radial-gradient(110% 80% at 82% 26%, ${hexA('#1a1a1a',0.5)}, transparent 52%),`
           + `radial-gradient(150% 100% at 50% 112%, ${hexA('#c2121f',0.5)}, transparent 60%),`
           + `linear-gradient(180deg, #2a1015, #160608)`;
    }
    if (skin === 'barbie') {
      return `radial-gradient(120% 75% at 28% 10%, ${hexA('#ff8ad0',0.4)}, transparent 56%),`
           + `radial-gradient(110% 80% at 82% 28%, ${hexA('#c06bff',0.34)}, transparent 56%),`
           + `radial-gradient(150% 100% at 50% 112%, ${hexA('#ff4fa3',0.5)}, transparent 60%),`
           + `linear-gradient(180deg, #321029, #1f081a)`;
    }
    return `radial-gradient(120% 75% at 28% 12%, ${hexA(color,0.5)}, transparent 58%),`
         + `radial-gradient(110% 80% at 82% 26%, ${hexA('#8b5cf6',0.36)}, transparent 55%),`
         + `radial-gradient(150% 95% at 50% 108%, ${hexA(color,0.55)}, transparent 62%),`
         + `linear-gradient(180deg, #15151b, #0b0b0f)`;
  }

  function weekDotsHtml(child, today, viewDate) {
    const L = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const start = new Date(today + 'T12:00:00');
    start.setDate(start.getDate() - start.getDay());
    let html = '';
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const ds = H.todayStr(d);
      const isToday = ds === today;
      const isSel = ds === viewDate;
      const future = ds > today;
      const dueD = H.tasksForChildOn(child.id, ds);
      const doneAll = dueD.length > 0 && dueD.every(x => x.submission && x.submission.status === 'approved');
      html += `<button class="wd ${doneAll ? 'done' : ''} ${isToday ? 'today' : ''} ${isSel ? 'sel' : ''}"
        ${future ? 'disabled' : ''} data-day="${ds}">${doneAll ? '★' : L[i]}</button>`;
    }
    return html;
  }

  function viewChildHome(child) {
    const today = H.todayStr();
    const viewDate = childViewDate || today;
    const isToday = viewDate === today;
    const due = H.tasksForChildOn(child.id, viewDate).sort((a, b) => taskWhenSort(a.task) - taskWhenSort(b.task));
    const streak = H.streakFor(child.id);
    const done = due.filter(({ submission }) => submission && submission.status === 'approved').length;
    const handled = due.filter(({ task, submission }) =>
      (submission && submission.status !== 'rejected') || H.skipFor(task.id, child.id, viewDate)).length;
    const allDone = isToday && due.length > 0 && handled === due.length;
    const remaining = due.length - handled;
    if (childPagerIndex > due.length) childPagerIndex = 0;

    // missões expiradas: horário/período já passou e ainda não foi feita (só hoje)
    const nowMin = (() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); })();
    const periodEnd = { manha: 720, tarde: 1080, noite: 1440 };
    const taskExpired = (task, st) => {
      if (!isToday || (st !== 'todo' && st !== 'rejected')) return false;
      if (task.time) { const [h, m] = task.time.split(':').map(Number); return nowMin > h * 60 + m; }
      if (task.period) return nowMin > periodEnd[task.period];
      return false;
    };
    const statusOf = ({ task, submission }) => {
      if (submission && submission.status === 'approved') return 'approved';
      if (submission && submission.status === 'pending') return 'pending';
      if (submission && submission.status === 'rejected') return 'rejected';
      if (H.skipFor(task.id, child.id, viewDate)) return 'declined';
      return 'todo';
    };
    let expiredCount = 0, firstExpiredIdx = -1;
    due.forEach((d, i) => { if (taskExpired(d.task, statusOf(d))) { expiredCount++; if (firstExpiredIdx < 0) firstExpiredIdx = i; } });

    const cards = due.map(({ task, submission }, i) => {
      const skip = H.skipFor(task.id, child.id, viewDate);
      let st = 'todo';
      if (submission && submission.status === 'approved') st = 'approved';
      else if (submission && submission.status === 'pending') st = 'pending';
      else if (submission && submission.status === 'rejected') st = 'rejected';
      else if (skip) st = 'declined';

      const expired = taskExpired(task, st);

      const center = st === 'pending' ? { icon: '⏳', label: 'aguardando', dis: true }
        : st === 'approved' ? { icon: '✅', label: 'aprovada', dis: true }
        : st === 'declined' ? { icon: '🚫', label: 'recusada', dis: true }
        : !isToday ? { icon: viewDate < today ? '—' : '🔒', label: viewDate < today ? 'não feita' : 'em breve', dis: true }
        : { icon: EVIDENCE_ICON[task.evidence], label: EVIDENCE_VERB[task.evidence], dis: false };

      const eyebrow = st === 'rejected'
          ? `💬 ${esc(submission.parentComment || 'pode caprichar mais?')} — tente de novo`
        : st === 'pending' ? 'enviada · aguardando os pais 👀'
        : st === 'approved' ? 'aprovada pelos pais! 🎉'
        : st === 'declined' ? 'você recusou esta missão'
        : expired ? `⌛ passou da hora — ainda dá pra fazer! 💪`
        : !isToday ? `missão ${i + 1} de ${due.length} · ${viewDate < today ? 'não enviada' : 'agendada'}`
        : `missão ${i + 1} de ${due.length} · registre sua evidência`;

      // ações de recusar/desfazer só no dia de hoje
      const refuse = !isToday ? null
        : st === 'declined' ? { icon: '↩️', label: 'desfazer', act: 'undo' }
        : (st === 'todo' || st === 'rejected') ? { icon: '✕', label: 'recusar', act: 'decline' }
        : null;

      return `
      <div class="mission-card" style="background:${cardBg(child.color)}">
        <div class="card-veil"></div>
        <div class="card-pill ${expired ? 'pill-expired' : ''}"><span class="pe">${task.emoji}</span> ${EVIDENCE_LABEL[task.evidence]}${taskWhenLabel(task) ? ` · ${expired ? `⌛ ${taskWhenLabel(task, true)}` : taskWhenLabel(task)}` : ''}</div>
        <div class="card-body">
          <p class="eyebrow">${eyebrow}</p>
          <h1 class="mission-title">${esc(task.title)}</h1>
          <div class="mission-actions">
            <div class="m-action points"><span class="circle">⭐</span><span>+${task.points}</span></div>
            <button class="m-action evidence" ${center.dis ? 'disabled' : ''} data-evi="${task.id}">
              <span class="circle">${center.icon}</span><span>${center.label}</span>
            </button>
            ${refuse
              ? `<button class="m-action refuse" data-refuse="${task.id}" data-act="${refuse.act}">
                   <span class="circle">${refuse.icon}</span><span>${refuse.label}</span></button>`
              : `<div class="m-action" style="visibility:hidden"><span class="circle"></span><span>·</span></div>`}
          </div>
        </div>
      </div>`;
    }).join('');

    const emptyCard = `
      <div class="mission-card summary" style="background:${cardBg('#46b6ff')}">
        <div class="card-veil"></div>
        <div class="card-body" style="display:flex;flex-direction:column;align-items:center">
          <div data-orb-summary style="margin-bottom:18px"></div>
          <h1 class="mission-title">dia livre! 🏖️</h1>
          <p class="eyebrow">nenhuma missão ${isToday ? 'para hoje' : 'nesse dia'}</p>
        </div>
      </div>`;

    const summaryCard = `
      <div class="mission-card summary ${allDone ? 'celebrate' : ''}" ${allDone ? 'data-celebrate="1"' : ''} style="background:${cardBg(allDone ? '#8b5cf6' : '#46b6ff')}">
        <div class="card-veil"></div>
        <div class="card-body" style="display:flex;flex-direction:column;align-items:center">
          <div data-orb-summary style="margin-bottom:18px"></div>
          <h1 class="mission-title">${allDone ? 'continue assim! 🎉' : (remaining === 1 ? 'falta 1 missão!' : `faltam ${remaining} missões`)}</h1>
          <p class="eyebrow">${done} de ${due.length} aprovadas · 🔥 ${streak} · ⭐ ${child.points}</p>
        </div>
      </div>`;

    const totalCards = due.length ? due.length + 1 : 1;

    $app.innerHTML = `
    <div class="child-today">
      <div class="today-topbar">
        <span class="streak-flame" style="font-size:16px">🔥 ${streak}</span>
        <div class="week-dots">${weekDotsHtml(child, today, viewDate)}</div>
      </div>
      <div class="mission-pager" id="mission-pager">
        ${due.length ? cards + summaryCard : emptyCard}
      </div>
      <div class="page-dots">${Array.from({ length: totalCards }, (_, i) =>
        `<span class="${i === childPagerIndex ? 'active' : ''}"></span>`).join('')}</div>
      ${due.length && isToday ? `
        <div class="reminder-fan" id="reminder-fan">
          <div class="reminder-backdrop"></div>
          <button class="rtoggle" aria-label="Lembrete">⏰</button>
          <button class="ropt" data-min="5" style="--d:0s"><span class="rlabel">5 min</span><span class="rbtn">5</span></button>
          <button class="ropt" data-min="15" style="--d:.04s"><span class="rlabel">15 min</span><span class="rbtn">15</span></button>
          <button class="ropt" data-min="30" style="--d:.08s"><span class="rlabel">30 min</span><span class="rbtn">30</span></button>
          <button class="ropt" data-min="60" style="--d:.12s"><span class="rlabel">1 hora</span><span class="rbtn">1h</span></button>
        </div>` : ''}
      ${due.length && isToday && expiredCount ? `
        <button class="expired-alert" id="expired-alert">⌛ ${expiredCount} ${expiredCount === 1 ? 'tarefa expirada' : 'tarefas expiradas'}</button>` : ''}
      ${childNav('c/home')}
    </div>`;

    let summaryOrb = null;
    $app.querySelectorAll('[data-orb-summary]').forEach(el => {
      const o = mountOrb(el, allDone && el.closest('[data-celebrate]') ? 140 : 120);
      if (el.closest('[data-celebrate]')) summaryOrb = o;
    });
    bindNav();

    // navegar entre os dias da semana (topo) — vê as missões daquele dia
    $app.querySelectorAll('.week-dots .wd').forEach(b => b.onclick = () => {
      const ds = b.dataset.day;
      childViewDate = (ds === today) ? null : ds;
      childPagerIndex = 0;
      viewChildHome(child);
    });

    // celebração: orbe em erupção + confete quando o card final (tudo feito) aparece
    let celebrated = false;
    const summaryIndex = due.length; // último card
    function celebrateAllDone() {
      if (celebrated || !allDone) return;
      celebrated = true;
      confetti();
      if (summaryOrb) { summaryOrb.erupt(); setTimeout(() => summaryOrb.erupt(), 650); }
      if (navigator.vibrate) navigator.vibrate([30, 40, 60, 40, 90]);
      toast('todas as missões de hoje! 🏆', '🎉');
    }

    // pager: swipe ↑↓ via scroll-snap; restaura a missão atual após re-render
    const pager = $app.querySelector('#mission-pager');
    const dots = [...$app.querySelectorAll('.page-dots span')];
    function setActive(idx) {
      childPagerIndex = idx;
      dots.forEach((s, i) => s.classList.toggle('active', i === idx));
      if (idx === summaryIndex) celebrateAllDone();
    }
    if (pager) {
      requestAnimationFrame(() => {
        pager.scrollTop = childPagerIndex * pager.clientHeight;
        if (childPagerIndex === summaryIndex) setTimeout(celebrateAllDone, 450);
      });
      pager.addEventListener('scroll', () => {
        const idx = Math.round(pager.scrollTop / pager.clientHeight);
        if (idx !== childPagerIndex) setActive(idx);
      }, { passive: true });
    }

    // alerta de expiradas: toca → rola até a primeira missão atrasada
    const expAlert = $app.querySelector('#expired-alert');
    if (expAlert && pager && firstExpiredIdx >= 0) {
      expAlert.onclick = () => {
        pager.scrollTo({ top: firstExpiredIdx * pager.clientHeight, behavior: 'smooth' });
      };
    }

    // evidência (centro / yap)
    $app.querySelectorAll('[data-evi]').forEach(b => b.onclick = () => {
      const task = state.tasks.find(t => t.id === b.dataset.evi);
      openEvidenceSheet(task, child);
    });
    // recusar / desfazer (direita / speak)
    $app.querySelectorAll('[data-refuse]').forEach(b => b.onclick = () => {
      const taskId = b.dataset.refuse;
      if (b.dataset.act === 'undo') { A.undoDecline({ taskId, childId: child.id }); }
      else { A.declineTask({ taskId, childId: child.id }); toast('Missão recusada por hoje', '🙅'); }
      render();
    });

    // lembrete (relógio + leque 5/15/30/1h)
    const fan = $app.querySelector('#reminder-fan');
    if (fan) {
      fan.querySelector('.rtoggle').onclick = () => fan.classList.toggle('open');
      fan.querySelector('.reminder-backdrop').onclick = () => fan.classList.remove('open');
      fan.querySelectorAll('[data-min]').forEach(b => b.onclick = () => {
        const min = +b.dataset.min;
        const entry = due[Math.min(childPagerIndex, due.length - 1)];
        fan.classList.remove('open');
        if (!entry) return;
        A.addReminder({ taskId: entry.task.id, childId: child.id, delayMin: min });
        scheduleReminders();
        toast(`Lembrete em ${min < 60 ? min + ' min' : '1 hora'}: ${entry.task.title}`, '⏰');
      });
    }
  }

  /* ---------- Evidência ---------- */

  function openEvidenceSheet(task, child) {
    const common = `
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:46px;margin-bottom:6px">${task.emoji}</div>
        <h2>${esc(task.title)}</h2>
        <p class="small muted">Vale <b style="color:var(--yellow)">⭐ ${task.points} pontos</b></p>
      </div>`;

    if (task.evidence === 'check') {
      openSheet(`${common}
        <p class="small muted" style="text-align:center;margin-bottom:18px">Você terminou essa missão? Confirme abaixo! 🤞</p>
        <button class="btn btn-aurora" id="ev-go">✓ Sim, eu fiz!</button>
      `, sheet => {
        sheet.querySelector('#ev-go').onclick = () => {
          A.submitTask({ taskId: task.id, childId: child.id, evidenceType: 'check' });
          closeSheet();
          celebrate('Missão enviada! Os pais vão conferir 👀', '🚀');
          render();
        };
      });
      return;
    }

    if (task.evidence === 'photo') {
      // câmera ao vivo dentro do app — a foto só pode ser tirada na hora,
      // sem opção de escolher da galeria
      openSheet(`${common}
        <p class="small muted" style="text-align:center;margin-bottom:14px">Tire uma foto agora mostrando a missão feita! 📸</p>
        <div class="camera-view" id="cam-wrap">
          <video id="cam-video" autoplay playsinline muted></video>
          <p class="small muted" id="cam-status" style="text-align:center;padding:22px 12px">Abrindo a câmera…</p>
        </div>
        <div id="ev-preview" style="display:none"></div>
        <button class="btn btn-ghost" id="cam-shot" style="margin-top:12px" disabled>📸 Capturar foto</button>
        <button class="btn btn-aurora" id="ev-go" style="margin-top:10px;display:none">Enviar missão 🚀</button>
      `, sheet => {
        let stream = null, blob = null;
        const video = sheet.querySelector('#cam-video');
        const status = sheet.querySelector('#cam-status');
        const shotBtn = sheet.querySelector('#cam-shot');
        const sendBtn = sheet.querySelector('#ev-go');
        const camWrap = sheet.querySelector('#cam-wrap');
        const preview = sheet.querySelector('#ev-preview');

        async function startCamera() {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment', width: { ideal: 1280 } },
              audio: false,
            });
            video.srcObject = stream;
            status.style.display = 'none';
            video.style.display = 'block';
            shotBtn.disabled = false;
          } catch (e) {
            status.textContent = 'Não foi possível abrir a câmera. Permita o acesso para continuar. 🎥';
            shotBtn.disabled = true;
          }
        }

        function stopCamera() {
          if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
        }

        shotBtn.onclick = async () => {
          if (blob) {
            // "tirar outra": volta para a câmera
            blob = null;
            preview.style.display = 'none';
            camWrap.style.display = 'block';
            sendBtn.style.display = 'none';
            shotBtn.textContent = '📸 Capturar foto';
            await startCamera();
            return;
          }
          if (!stream) return;
          const canvas = document.createElement('canvas');
          const w = video.videoWidth, h = video.videoHeight;
          const scale = Math.min(1, 900 / Math.max(w, h));
          canvas.width = Math.round(w * scale);
          canvas.height = Math.round(h * scale);
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
          blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.72));
          stopCamera();
          camWrap.style.display = 'none';
          preview.innerHTML = `<div class="evidence-preview"><img src="${URL.createObjectURL(blob)}" alt="prévia" /></div>`;
          preview.style.display = 'block';
          shotBtn.textContent = '🔁 Tirar outra';
          sendBtn.style.display = 'flex';
        };

        sendBtn.onclick = async () => {
          if (!blob) return;
          const key = 'ev-' + H.uid();
          await EvidenceDB.put(key, blob);
          A.submitTask({ taskId: task.id, childId: child.id, evidenceType: 'photo', evidenceKey: key });
          closeSheet();
          celebrate('Foto enviada! Os pais vão conferir 👀', '📸');
          render();
        };

        startCamera();
        return stopCamera; // garante que a câmera desliga ao fechar o sheet
      });
      return;
    }

    // audio
    openSheet(`${common}
      <p class="small muted" style="text-align:center">Grave um áudio contando como foi! 🎙️ (até 30s)</p>
      <button class="audio-rec-btn" id="rec-btn">🎤</button>
      <p class="small muted" style="text-align:center" id="rec-status">Toque para gravar</p>
      <div id="rec-preview"></div>
      <button class="btn btn-aurora" id="ev-go" style="margin-top:14px" disabled>Enviar missão 🚀</button>
    `, sheet => {
      let mediaRecorder = null, chunks = [], blob = null, stream = null, timer = null;
      const btn = sheet.querySelector('#rec-btn');
      const status = sheet.querySelector('#rec-status');

      btn.onclick = async () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') { mediaRecorder.stop(); return; }
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) { toast('Permita o microfone para gravar', '🎤'); return; }
        chunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          clearTimeout(timer);
          stream.getTracks().forEach(t => t.stop());
          blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
          btn.classList.remove('recording');
          btn.textContent = '🔁';
          status.textContent = 'Ouça abaixo — ou grave de novo';
          sheet.querySelector('#rec-preview').innerHTML =
            `<audio controls src="${URL.createObjectURL(blob)}"></audio>`;
          sheet.querySelector('#ev-go').disabled = false;
        };
        mediaRecorder.start();
        btn.classList.add('recording');
        btn.textContent = '⏹';
        status.textContent = 'Gravando… toque para parar';
        timer = setTimeout(() => { if (mediaRecorder.state === 'recording') mediaRecorder.stop(); }, 30000);
      };

      sheet.querySelector('#ev-go').onclick = async () => {
        if (!blob) return;
        const key = 'ev-' + H.uid();
        await EvidenceDB.put(key, blob);
        A.submitTask({ taskId: task.id, childId: child.id, evidenceType: 'audio', evidenceKey: key });
        closeSheet();
        celebrate('Áudio enviado! Os pais vão ouvir 👂', '🎤');
        render();
      };

      // cleanup ao fechar o sheet
      return () => {
        clearTimeout(timer);
        if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
        if (stream) stream.getTracks().forEach(t => t.stop());
      };
    });
  }

  /* ================= FILHO — Prêmios ================= */

  // ---- helpers de data e swipe (compartilhados) ----
  function dateLabel(ds) {
    if (!ds) return 'agora';
    if (ds === H.todayStr()) return 'hoje';
    if (ds === H.dateOffset(1)) return 'amanhã';
    const [y, m, d] = ds.split('-');
    return `${d}/${m}`;
  }
  function openDateSheet(titleHtml, onPick) {
    const min = H.todayStr();
    openSheet(`
      <h2 style="margin-bottom:6px">${titleHtml}</h2>
      <p class="small muted" style="margin-bottom:14px">escolha o dia que você quer o prêmio 📅</p>
      <div class="field"><input class="input" type="date" id="d-pick" min="${min}" value="${H.dateOffset(1)}" /></div>
      <button class="btn btn-aurora" id="d-ok">confirmar data</button>
    `, sheet => {
      sheet.querySelector('#d-ok').onclick = () => {
        const v = sheet.querySelector('#d-pick').value;
        if (!v) { toast('Escolha uma data', '📅'); return; }
        closeSheet(); onPick(v);
      };
    });
  }
  // arrasta o card pro lado pra revelar ações (estilo pillowtalk)
  function bindSwipe(root) {
    root.querySelectorAll('.swipe-wrap').forEach(wrap => {
      const card = wrap.querySelector('.swipe-card');
      const aw = wrap.querySelector('.swipe-actions').offsetWidth || 208;
      wrap.style.setProperty('--aw', aw + 'px');
      let startX = 0, dx = 0, dragging = false, moved = false;
      const onDown = (e) => {
        dragging = true; moved = false;
        startX = (e.touches ? e.touches[0].clientX : e.clientX);
        wrap.classList.add('dragging');
      };
      const onMove = (e) => {
        if (!dragging) return;
        const x = (e.touches ? e.touches[0].clientX : e.clientX);
        dx = x - startX;
        if (Math.abs(dx) > 5) moved = true;
        const base = wrap.classList.contains('open') ? -aw : 0;
        let tx = Math.max(-aw, Math.min(0, base + dx));
        card.style.transform = `translateX(${tx}px)`;
      };
      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        wrap.classList.remove('dragging');
        card.style.transform = '';
        const base = wrap.classList.contains('open') ? -aw : 0;
        const final = base + dx;
        wrap.classList.toggle('open', final < -aw / 2);
        dx = 0;
      };
      card.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      // toque simples no card também alterna a revelação
      card.addEventListener('click', () => { if (!moved) wrap.classList.toggle('open'); });
    });
  }

  function redemptionStatusHtml(r) {
    if (r.status === 'pending')
      return `<span class="status-pill status-pending">aguardando os pais 👀</span>${r.desiredDate ? ` <span class="xsmall muted">p/ ${dateLabel(r.desiredDate)}</span>` : ''}`;
    if (r.status === 'suggested')
      return `<span class="status-pill status-pending">pais sugeriram ${dateLabel(r.parentDate)}</span>`;
    if (r.status === 'approved')
      return `<span class="status-pill status-approved">concedido! 🎉</span>${r.scheduledDate ? ` <span class="xsmall muted">em ${dateLabel(r.scheduledDate)}</span>` : ''}`;
    return `<span class="status-pill status-rejected">devolvido</span>`;
  }

  function viewChildRewards(child) {
    const rewards = state.rewards.filter(r => r.active && r.childIds.includes(child.id));
    const myReds = state.redemptions.filter(r => r.childId === child.id).sort((a, b) => b.requestedAt - a.requestedAt).slice(0, 8);
    const pendingMine = state.redemptions.filter(r => r.childId === child.id && (r.status === 'pending' || r.status === 'suggested')).length;
    const tab = childRewardsTab;

    // META: liberar todos os prêmios — âncora visual de progresso
    const maxCost = rewards.length ? Math.max(...rewards.map(r => r.cost)) : 0;
    const unlocked = rewards.filter(r => child.points >= r.cost).length;
    const goalPct = maxCost ? Math.min(100, Math.round(child.points / maxCost * 100)) : 0;
    const missing = Math.max(0, maxCost - child.points);
    const goalMsg = missing === 0
      ? 'você já pode resgatar qualquer prêmio! 🎉'
      : missing <= maxCost * 0.25
        ? `falta pouco! só mais <b style="color:#fff">⭐ ${missing}</b> para liberar tudo 💪`
        : `faltam <b style="color:#fff">⭐ ${missing}</b> para liberar todos os prêmios`;

    const goalCard = rewards.length ? `
      <div class="card card-aurora goal-card">
        <div class="goal-head">
          <div><p class="xsmall muted">sua meta 🏆</p><h3>liberar todos os prêmios</h3></div>
          <div class="goal-frac"><b>${child.points}</b><span>/ ${maxCost}</span></div>
        </div>
        <div class="progress-bar" style="margin:12px 0 9px"><div class="fill" style="width:${goalPct}%"></div></div>
        <p class="small">${goalMsg} · ${unlocked}/${rewards.length} liberados</p>
      </div>` : '';

    const rewardCards = rewards.length === 0
      ? `<div class="empty-state"><div class="big-emoji">🎁</div>Peça aos seus pais para criarem prêmios com você!</div>`
      : rewards.map(r => {
          const can = child.points >= r.cost;
          const pct = Math.min(100, Math.round(child.points / r.cost * 100));
          return `
          <div class="reward-entry">
            <div class="reward-top"><div class="reward-name">${esc(r.title)}</div></div>
            ${can ? `
            <div class="swipe-wrap">
              <div class="swipe-actions">
                <button class="swipe-act a-redeem" data-redeem="${r.id}"><span>🎉</span>resgatar agora</button>
                <button class="swipe-act a-date" data-date="${r.id}"><span>📅</span>definir data</button>
              </div>
              <div class="swipe-card reward-block" style="background:${cardBg(child.color)}">
                <span class="reward-cost-badge">⭐ ${r.cost}</span>
                <div class="reward-emoji">${r.emoji}</div>
                <div class="reward-hint">← arraste para resgatar</div>
              </div>
            </div>` : `
            <div class="reward-block reward-block-locked">
              <span class="reward-cost-badge">⭐ ${r.cost}</span>
              <div class="reward-emoji" style="opacity:.5">${r.emoji}</div>
              <div class="progress-bar" style="margin:12px 22px 8px"><div class="fill" style="width:${pct}%"></div></div>
              <div class="reward-hint">faltam ⭐ ${r.cost - child.points} — continue nas missões! 💪</div>
            </div>`}
          </div>`;
        }).join('');

    const redemptionCards = myReds.length === 0
      ? `<div class="empty-state"><div class="big-emoji">🧾</div>Você ainda não fez nenhum resgate.</div>`
      : myReds.map(r => {
          const canAct = r.status === 'pending' || r.status === 'suggested';
          return `
          <div class="redemption-card">
            <div class="rc-top">
              <div class="task-emoji">${r.emoji}</div>
              <div class="task-info">
                <div class="task-title">${esc(r.title)}</div>
                <div class="task-meta">${redemptionStatusHtml(r)}</div>
              </div>
              <span class="points-pill">⭐ ${r.cost}</span>
            </div>
            ${canAct ? `
            <div class="rc-actions">
              ${r.status === 'suggested'
                ? `<button class="btn-sm btn btn-success" data-accept="${r.id}">aceitar ${dateLabel(r.parentDate)}</button>` : ''}
              <button class="btn-sm btn btn-ghost" data-cancel="${r.id}">cancelar pedido</button>
            </div>` : ''}
          </div>`;
        }).join('');

    $app.innerHTML = `
    <div class="screen">
      <div class="rewards-top">
        <h1 class="page-title" style="margin:0">prêmios</h1>
        <div class="rewards-total">
          <div class="reward-cost-big">⭐<b>${child.points}</b></div>
          <p class="xsmall muted">seu total</p>
        </div>
      </div>
      <div class="segmented" id="rw-tabs" style="margin:4px 0 16px">
        <button data-tab="resgatar" class="${tab === 'resgatar' ? 'active' : ''}">resgatar</button>
        <button data-tab="resgates" class="${tab === 'resgates' ? 'active' : ''}">meus resgates${pendingMine ? ` <span class="tab-badge">${pendingMine}</span>` : ''}</button>
      </div>
      <div class="stagger">
        ${tab === 'resgatar' ? goalCard + rewardCards : redemptionCards}
      </div>
      ${childNav('c/rewards')}
    </div>`;
    bindNav(); bindSwipe($app);

    $app.querySelectorAll('#rw-tabs button').forEach(b => b.onclick = () => {
      childRewardsTab = b.dataset.tab;
      viewChildRewards(child);
    });

    $app.querySelectorAll('[data-redeem]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const red = A.requestRedemption(b.dataset.redeem, child.id, null);
      if (red) { celebrate('Pedido enviado aos pais! 🤞', '🎁'); render(); }
      else toast('Pontos insuficientes', '😅');
    });
    $app.querySelectorAll('[data-date]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const reward = state.rewards.find(r => r.id === b.dataset.date);
      openDateSheet(`${reward.emoji} ${esc(reward.title)}`, (date) => {
        const red = A.requestRedemption(reward.id, child.id, date);
        if (red) { celebrate(`Pedido para ${dateLabel(date)} enviado! 🤞`, '🎁'); render(); }
        else toast('Pontos insuficientes', '😅');
      });
    });
    $app.querySelectorAll('[data-accept]').forEach(b => b.onclick = () => {
      A.acceptSuggestedDate(b.dataset.accept);
      celebrate('Combinado! 🎉', '🤝'); render();
    });
    $app.querySelectorAll('[data-cancel]').forEach(b => b.onclick = () => {
      A.cancelRedemption(b.dataset.cancel);
      toast('Pedido cancelado · pontos devolvidos', '↩️'); render();
    });
  }

  /* ================= FILHO — Eu ================= */

  function viewChildMe(child) {
    const today = H.todayStr();
    const a = H.analyticsFor(child.id, 7);

    // dias da semana com todas as missões em dia
    let daysHit = 0, daysWithMissions = 0;
    const wk = new Date(today + 'T12:00:00'); wk.setDate(wk.getDate() - wk.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(wk); d.setDate(wk.getDate() + i);
      const ds = H.todayStr(d);
      if (ds > today) continue;
      const dueD = H.tasksForChildOn(child.id, ds);
      if (dueD.length) { daysWithMissions++; if (dueD.every(x => x.submission && x.submission.status === 'approved')) daysHit++; }
    }
    // recusadas: missões refeitas (rejeitadas pelos pais) + recusadas pelo filho
    const recusadas = state.submissions.filter(s => s.childId === child.id && s.status === 'rejected').length
                    + state.skips.filter(s => s.childId === child.id).length;
    const totalResgates = state.redemptions.filter(r => r.childId === child.id).length;
    const dueToday = H.tasksForChildOn(child.id, today);
    const doneToday = dueToday.filter(x => x.submission && x.submission.status === 'approved').length;

    // histórico: timeline navegável (orbe = balizador, hoje no meio)
    // limite p/ trás = data do primeiro registro do filho
    const logDates = [
      ...state.submissions.filter(s => s.childId === child.id).map(s => s.date),
      ...state.skips.filter(s => s.childId === child.id).map(s => s.date),
    ];
    const firstLog = logDates.length ? logDates.reduce((a, b) => a < b ? a : b) : today;
    const dLabel = (ds) => ds === today ? 'hoje'
      : ds === H.dateOffset(-1) ? 'ontem'
      : ds.split('-').reverse().slice(0, 2).join('/');
    const histStatus = (task, submission, ds) => {
      const skip = H.skipFor(task.id, child.id, ds);
      if (submission && submission.status === 'approved') return `<span class="status-pill status-approved">aprovada</span>`;
      if (submission && submission.status === 'pending') return `<span class="status-pill status-pending">aguardando</span>`;
      if (submission && submission.status === 'rejected') return `<span class="status-pill status-rejected">refazer</span>`;
      if (skip) return `<span class="status-pill status-rejected">recusada</span>`;
      return `<span class="status-pill" style="background:var(--card-hover);color:var(--text-3)">${ds < today ? 'não feita' : 'pendente'}</span>`;
    };
    const histListHtml = (ds) => {
      const due = H.tasksForChildOn(child.id, ds);
      if (!due.length) return `<div class="empty-state" style="padding:28px 20px"><div class="big-emoji">🗓️</div>nenhuma missão nesse dia</div>`;
      return due.map(({ task, submission }) => `
        <div class="task-row">
          <div class="task-emoji">${task.emoji}</div>
          <div class="task-info">
            <div class="task-title">${esc(task.title)}</div>
            <div class="task-meta">${histStatus(task, submission, ds)}</div>
          </div>
          <span class="points-pill">⭐ ${task.points}</span>
        </div>`).join('');
    };
    const WD = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const stripHtml = (ds) => {
      const c = new Date(ds + 'T12:00:00');
      let html = '';
      for (let off = -4; off <= 4; off++) {
        const d = new Date(c); d.setDate(c.getDate() + off);
        const dstr = H.todayStr(d);
        const locked = dstr < firstLog || dstr > today;
        html += `<div class="tl-day ${off === 0 ? 'sel' : ''} ${locked ? 'disabled' : ''}">
          <span class="d-wd">${WD[d.getDay()]}</span><span class="d-num">${d.getDate()}</span></div>`;
      }
      return html;
    };
    const histDate = childHistDate || today;

    const stat = (value, label, cls = '') =>
      `<div class="stat-card"><div class="stat-value ${cls}">${value}</div><div class="stat-label">${label}</div></div>`;

    $app.innerHTML = `
    <div class="screen">
      ${headerHtml('', { gear: 'c/settings' })}
      <div class="profile-hero">
        <button class="profile-avatar" data-edit-profile aria-label="trocar foto">
          ${avatarHtml(child, 'avatar avatar-lg')}
          <span class="edit-badge">✏️</span>
        </button>
        <h2 style="margin-top:12px">${esc(child.name)}</h2>
        <div style="display:flex;gap:10px;margin-top:8px">
          <span class="points-pill">⭐ ${child.points}</span>
          <span class="streak-flame">🔥 ${a.streak} dias</span>
        </div>
      </div>
      <div class="stagger" style="margin-top:20px">
        <div class="stat-grid">
          ${stat(`${a.rate}%`, 'semana concluída', 'gradient-text')}
          ${stat(`${doneToday}/${dueToday.length}`, 'missões de hoje')}
          ${stat(`${daysHit}/${daysWithMissions || 7}`, 'dias em dia')}
          ${stat(`⭐ ${a.pointsEarned}`, 'pontos na semana')}
          ${stat(`🙅 ${recusadas}`, 'recusadas')}
          ${stat(`🎁 ${totalResgates}`, 'pedidos de resgate')}
        </div>
        <div class="section-head"><h2>histórico</h2></div>
        <div class="timeline">
          <div class="tl-head">
            <button class="hist-arrow" data-tl="-1" aria-label="dia anterior">‹</button>
            <div class="tl-label" id="tl-label">${dLabel(histDate)}</div>
            <button class="hist-arrow" data-tl="1" aria-label="próximo dia">›</button>
          </div>
          <div class="tl-track">
            <div class="tl-days" id="tl-strip">${stripHtml(histDate)}</div>
            <div class="tl-playhead"></div>
            <div class="tl-marker" data-tl-orb><span class="tl-grip"></span></div>
          </div>
          <p class="xsmall muted" style="text-align:center;margin-top:10px">arraste ↔ na linha do tempo</p>
        </div>
        <div class="hist-list" id="hist-list">${histListHtml(histDate)}</div>
      </div>
      ${childNav('c/me')}
    </div>`;
    bindHeader(); bindNav();
    $app.querySelector('[data-edit-profile]').onclick = () =>
      openKidSheet(patch => { A.updateChild(child.id, patch); render(); }, child);

    /* ---- Timeline: orbe balizadora com arraste por velocidade ----
       arrasta p/ esquerda = dias anteriores (mais longe = mais rápido)
       p/ direita = avança até hoje · limite p/ trás = primeiro registro */
    let cur = histDate;
    const lblEl = $app.querySelector('#tl-label');
    const stripEl = $app.querySelector('#tl-strip');
    const listEl = $app.querySelector('#hist-list');
    const arrPrev = $app.querySelector('[data-tl="-1"]');
    const arrNext = $app.querySelector('[data-tl="1"]');
    const syncArrows = () => {
      arrPrev.disabled = cur <= firstLog;
      arrNext.disabled = cur >= today;
    };
    syncArrows();
    const setCur = (ds) => {
      if (ds < firstLog) ds = firstLog;
      if (ds > today) ds = today;
      if (ds === cur) return false;
      cur = ds;
      childHistDate = (ds === today) ? null : ds;
      lblEl.textContent = dLabel(ds);
      stripEl.innerHTML = stripHtml(ds);
      listEl.innerHTML = histListHtml(ds);
      syncArrows();
      return true;
    };
    const shift = (dir) => {
      const d = new Date(cur + 'T12:00:00');
      d.setDate(d.getDate() + dir);
      return setCur(H.todayStr(d));
    };
    arrPrev.onclick = () => shift(-1);
    arrNext.onclick = () => shift(1);

    const orbEl = $app.querySelector('[data-tl-orb]');
    const STEP_MS = 55; // resolução do loop de velocidade (setInterval roda mesmo sem rAF)
    let sx = 0, dx = 0, dragging = false, timer = null, acc = 0, stepped = false;
    const stopLoop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const startLoop = () => {
      if (timer) return;
      acc = 0;
      timer = setInterval(() => {
        const adx = Math.abs(dx);
        if (adx > 14) {
          acc += STEP_MS;
          const interval = Math.max(80, 620 - (adx - 14) * 7); // arrasta pouco = devagar · muito = rápido
          if (acc >= interval) {
            acc = 0;
            const moved = shift(dx < 0 ? -1 : 1);
            if (moved) { stepped = true; if (navigator.vibrate) navigator.vibrate(8); }
          }
        } else acc = 0;
      }, STEP_MS);
    };
    const down = (e) => {
      dragging = true; dx = 0; stepped = false;
      sx = (e.touches ? e.touches[0].clientX : e.clientX);
      orbEl.classList.add('grabbing');
      startLoop();
    };
    const move = (e) => {
      if (!dragging) return;
      dx = (e.touches ? e.touches[0].clientX : e.clientX) - sx;
      const cl = Math.max(-64, Math.min(64, dx));
      orbEl.style.transform = `translate(calc(-50% + ${cl}px), -50%)`;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      stopLoop();
      if (!stepped && Math.abs(dx) >= 30) shift(dx < 0 ? -1 : 1);   // flick → um dia
      else if (!stepped && Math.abs(dx) < 8) setCur(today);          // toque no meio → volta p/ hoje
      dx = 0;
      orbEl.style.transform = ''; orbEl.classList.remove('grabbing');
    };
    orbEl.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  /* ================= PWA install ================= */

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    window.deferredInstall = e;
  });

  /* ================= Splash ================= */

  function showSplash() {
    const s = document.createElement('div');
    s.className = 'splash';
    s.innerHTML = `
      <div data-splash-orb></div>
      <div class="wordmark gradient-text">deserve</div>
      <p class="tagline">conquiste o que você merece</p>`;
    document.body.appendChild(s);
    const orb = mountOrb(s.querySelector('[data-splash-orb]'), 150);
    setTimeout(() => orb && orb.pulse(), 500);
    setTimeout(() => {
      s.classList.add('leaving');
      setTimeout(() => { orb && orb.destroy(); s.remove(); }, 700);
    }, 1600);
  }

  /* ================= Lembretes ================= */

  let reminderTimers = [];
  function scheduleReminders() {
    reminderTimers.forEach(clearTimeout);
    reminderTimers = [];
    const now = Date.now();
    state.reminders.slice().forEach(r => {
      const delay = r.fireAt - now;
      if (delay <= 0) { A.removeReminder(r.id); return; } // perdido enquanto fechado
      reminderTimers.push(setTimeout(() => {
        showReminderPopup(r);
        A.removeReminder(r.id);
      }, Math.min(delay, 2 ** 31 - 1)));
    });
  }

  function showReminderPopup(r) {
    const el = document.createElement('div');
    el.className = 'reminder-pop';
    el.innerHTML = `
      <div class="rp-emoji">${r.taskEmoji || '⏰'}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700">Hora de: ${esc(r.taskTitle)}</div>
        <div class="xsmall muted">lembrete que você marcou ⏰</div>
      </div>
      <button class="btn btn-sm btn-aurora" data-do style="width:auto">fazer</button>
      <button class="back-btn" data-close style="width:34px;height:34px;font-size:14px">✕</button>`;
    document.body.appendChild(el);
    if (window.pulseOrbs) pulseOrbs();
    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification('Deserve', { body: `Hora de: ${r.taskTitle}`, silent: false }); } catch (e) {}
    }
    const close = () => { el.classList.add('leaving'); setTimeout(() => el.remove(), 300); };
    el.querySelector('[data-close]').onclick = close;
    el.querySelector('[data-do]').onclick = () => {
      close();
      if (state.session && state.session.role === 'child') { go('c/home'); }
    };
    setTimeout(close, 12000);
  }

  /* ================= Boot ================= */
  applyTheme();
  showSplash();
  render();
  scheduleReminders();
  if (window.mountBatsFx) mountBatsFx();
})();
