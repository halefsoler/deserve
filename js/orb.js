/* ============================================
   DESERVE ORB — logo viva.
   Coroa de partículas: anel de pontos luminosos
   com raios radiais, centro oco e escuro, gradiente
   azul→roxo→magenta. Respira (inala/exala) devagar.
   ============================================ */

(function () {
  const instances = new Set();
  let rafId = null;
  const EMBLEM_SKINS = { batman: 1, superman: 1, spiderman: 1, wonderwoman: 1, ladybug: 1, barbie: 1 };

  // Gradiente ao redor do anel: esquerda magenta → topo ciano → direita azul.
  function ringColor(tx, a) {
    // tx: 0 = esquerda (magenta/rosa) .. 1 = direita (azul)
    let r, g, b;
    if (tx < 0.5) {
      const k = tx / 0.5;            // rosa → roxo
      r = 255 + (139 - 255) * k;
      g = 92 + (92 - 92) * k;
      b = 170 + (246 - 170) * k;
    } else {
      const k = (tx - 0.5) / 0.5;    // roxo → azul
      r = 139 + (70 - 139) * k;
      g = 92 + (182 - 92) * k;
      b = 246 + (255 - 246) * k;
    }
    // toque de ciano no topo (sin(a) < 0 = topo)
    const top = Math.max(0, -Math.sin(a)) * 0.45;
    r = r * (1 - top) + 120 * top;
    g = g * (1 - top) + 225 * top;
    b = b * (1 - top) + 255 * top;
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }

  function drawCorona(ctx, t, cx, cy, R, energy) {
    // respiro: oscilação lenta (~5.7s) + impulso de interação (energy)
    const breathOsc = Math.sin(t * 0.0011);
    const breath = 1 + 0.075 * breathOsc + (energy - 0.5) * 0.20;
    const glow = 0.82 + 0.18 * breathOsc + (energy - 0.5) * 0.5;

    const innerR = R * 0.50 * breath;
    const maxLen = R * 0.48;
    const NA = Math.max(54, Math.min(150, Math.round(R * 1.6)));
    const ND = Math.max(5, Math.min(18, Math.round(R / 8)));
    const dotBase = Math.max(0.55, R * 0.020);
    const bandW = R * 0.07;

    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < NA; i++) {
      const a = (i / NA) * Math.PI * 2 - Math.PI / 2; // começa no topo
      // comprimento do raio: cintilação suave + raios mais longos embaixo
      const wave = 0.5 + 0.5 * Math.sin(a * 3 + t * 0.0016)
                       * Math.sin(a * 2 - t * 0.0011 + 1.3);
      const bottomBias = 0.5 + 0.5 * Math.sin(a);     // sin(a)≈1 embaixo
      const len = maxLen * (0.16 + 0.84 * wave) * (0.45 + 0.55 * bottomBias) * breath;

      const tx = (Math.cos(a) + 1) / 2;
      const col = ringColor(tx, a);
      const ca = Math.cos(a), sa = Math.sin(a);

      for (let j = 0; j <= ND; j++) {
        const tt = j / ND;
        const r = innerR + tt * len;
        const x = cx + ca * r;
        const y = cy + sa * r;
        const ringBand = Math.exp(-(((r - innerR) / bandW) ** 2));
        const fade = (1 - tt) ** 1.6;
        const alpha = Math.min(0.92, 0.05 + ringBand * 0.5 + fade * 0.2) * glow;
        const size = dotBase * (0.45 + (1 - tt) * 0.8 + ringBand * 0.55);
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // ---- silhueta de morcego (Batman) — asas largas horizontais, festões p/ baixo ----
  function batPath(ctx, cx, cy, s) {
    // s = meia-largura. Coordenadas normalizadas (origem no centro, y p/ baixo)
    const P = (x, y) => [cx + x * s, cy + y * s];
    const L = (x, y) => { const p = P(x, y); ctx.lineTo(p[0], p[1]); };
    const Q = (cxn, cyn, x, y) => { const c = P(cxn, cyn), p = P(x, y); ctx.quadraticCurveTo(c[0], c[1], p[0], p[1]); };
    let p = P(0, -0.02); ctx.beginPath(); ctx.moveTo(p[0], p[1]); // centro, entre as orelhas

    // --- lado direito ---
    L(0.10, -0.30);                 // ponta da orelha (afiada)
    L(0.18, -0.05);                 // base da orelha
    Q(0.25, 0.01, 0.32, -0.06);     // ombro
    Q(0.64, -0.24, 0.99, -0.12);    // borda de cima da asa → ponta (larga, quase horizontal)
    Q(0.92, 0.05, 0.76, 0.20);      // 1º dedo (aponta p/ baixo)
    Q(0.66, 0.05, 0.60, 0.06);      // entalhe (sobe)
    Q(0.52, 0.18, 0.44, 0.30);      // 2º dedo (p/ baixo)
    Q(0.34, 0.12, 0.26, 0.14);      // entalhe → corpo
    Q(0.14, 0.20, 0, 0.52);         // desce até a cauda central (ponta)

    // --- lado esquerdo (espelhado) ---
    Q(-0.14, 0.20, -0.26, 0.14);
    Q(-0.34, 0.12, -0.44, 0.30);
    Q(-0.52, 0.18, -0.60, 0.06);
    Q(-0.66, 0.05, -0.76, 0.20);
    Q(-0.92, 0.05, -0.99, -0.12);
    Q(-0.64, -0.24, -0.32, -0.06);
    Q(-0.25, 0.01, -0.18, -0.05);
    L(-0.10, -0.30);
    L(0, -0.02);
    ctx.closePath();
  }

  // ---- aranha (Homem-Aranha) ----
  function drawSpider(ctx, cx, cy, s) {
    ctx.save();
    ctx.strokeStyle = '#0c0c0c'; ctx.fillStyle = '#0c0c0c';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = s * 0.078;
    const legs = [
      [0.10, -0.16, 0.55, -0.58, 0.98, -0.74],
      [0.12, -0.05, 0.66, -0.22, 1.10, -0.28],
      [0.12, 0.07, 0.66, 0.18, 1.10, 0.30],
      [0.10, 0.20, 0.52, 0.46, 0.88, 0.70],
    ];
    for (const sgn of [-1, 1]) {
      for (const [bx, by, kx, ky, tx, ty] of legs) {
        ctx.beginPath();
        ctx.moveTo(cx + sgn * bx * s, cy + by * s);
        ctx.lineTo(cx + sgn * kx * s, cy + ky * s);
        ctx.lineTo(cx + sgn * tx * s, cy + ty * s);
        ctx.stroke();
      }
    }
    ctx.beginPath(); ctx.ellipse(cx, cy - 0.05 * s, 0.15 * s, 0.2 * s, 0, 0, Math.PI * 2); ctx.fill(); // cefalotórax
    ctx.beginPath(); ctx.ellipse(cx, cy + 0.36 * s, 0.21 * s, 0.34 * s, 0, 0, Math.PI * 2); ctx.fill(); // abdômen
    ctx.restore();
  }

  // ---- emblema águia/WW (Mulher-Maravilha) ----
  function wwPath(ctx, cx, cy, s) {
    const L = (x, y) => { ctx.lineTo(cx + x * s, cy + y * s); };
    ctx.beginPath(); ctx.moveTo(cx + 0 * s, cy - 0.08 * s);
    L(0.22, -0.34); L(1.0, -0.42); L(0.45, 0.04);          // asa direita (p/ cima e fora)
    L(0.60, 0.16); L(0.30, 0.54); L(0.14, 0.16); L(0, 0.42); // "W" — vale dir. e pico central
    L(-0.14, 0.16); L(-0.30, 0.54); L(-0.60, 0.16);          // espelho esquerdo
    L(-0.45, 0.04); L(-1.0, -0.42); L(-0.22, -0.34); L(0, -0.08);
    ctx.closePath();
  }

  // ---- laço/bow (Barbie) ----
  function drawBow(ctx, cx, cy, s) {
    // fitas (atrás)
    const tail = (sgn) => {
      ctx.beginPath();
      ctx.moveTo(cx + sgn * 0.06 * s, cy + 0.04 * s);
      ctx.quadraticCurveTo(cx + sgn * 0.52 * s, cy + 0.5 * s, cx + sgn * 0.44 * s, cy + 0.98 * s);
      ctx.lineTo(cx + sgn * 0.22 * s, cy + 0.78 * s);   // entalhe em V
      ctx.lineTo(cx + sgn * 0.04 * s, cy + 0.94 * s);
      ctx.closePath(); ctx.fill();
    };
    tail(-1); tail(1);
    // laçadas
    const loop = (sgn) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 0.06 * s);
      ctx.quadraticCurveTo(cx + sgn * 0.58 * s, cy - 0.64 * s, cx + sgn * 1.0 * s, cy - 0.30 * s);
      ctx.quadraticCurveTo(cx + sgn * 1.14 * s, cy, cx + sgn * 1.0 * s, cy + 0.30 * s);
      ctx.quadraticCurveTo(cx + sgn * 0.58 * s, cy + 0.64 * s, cx, cy + 0.06 * s);
      ctx.closePath(); ctx.fill();
    };
    loop(-1); loop(1);
    // nó central
    ctx.beginPath(); ctx.ellipse(cx, cy, 0.17 * s, 0.32 * s, 0, 0, Math.PI * 2); ctx.fill();
  }

  // ---- estrelinha de brilho (4 pontas) ----
  function sparkle(ctx, x, y, r, a = 1) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const ang = i * Math.PI / 2;
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(ang - 0.4) * r * 0.32, y + Math.sin(ang - 0.4) * r * 0.32, x + Math.cos(ang) * r, y + Math.sin(ang) * r);
      ctx.quadraticCurveTo(x + Math.cos(ang + 0.4) * r * 0.32, y + Math.sin(ang + 0.4) * r * 0.32, x, y);
    }
    ctx.fill();
    ctx.restore();
  }

  function drawEmblem(ctx, t, cx, cy, R, energy, kind) {
    const breathOsc = Math.sin(t * 0.0011);
    const breath = 1 + 0.05 * breathOsc + (energy - 0.5) * 0.16;
    const glowI = 0.55 + 0.2 * breathOsc + (energy - 0.5) * 0.6;

    if (kind === 'batman') {
      // halo bat-signal
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, `rgba(255,216,77,${Math.max(0, 0.5 * glowI)})`);
      g.addColorStop(0.55, `rgba(255,200,40,${Math.max(0, 0.22 * glowI)})`);
      g.addColorStop(1, 'rgba(255,200,40,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      // morcego dourado luminoso
      const s = R * 0.92 * breath;
      ctx.save();
      ctx.shadowColor = 'rgba(255,216,77,0.9)';
      ctx.shadowBlur = R * 0.22;
      const grad = ctx.createLinearGradient(cx, cy - s * 0.5, cx, cy + s * 0.6);
      grad.addColorStop(0, '#fff1b8');
      grad.addColorStop(0.5, '#ffd84d');
      grad.addColorStop(1, '#e0a91e');
      ctx.fillStyle = grad;
      batPath(ctx, cx, cy - R * 0.05, s);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (kind === 'superman') {
      // escudo (pentágono) com S — azul/vermelho/amarelo
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, `rgba(46,107,255,${Math.max(0, 0.5 * glowI)})`);
      g.addColorStop(1, 'rgba(46,107,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      const s = R * 0.92 * breath;
      const P = (x, y) => [cx + x * s, cy + y * s];
      const shield = (sc) => {
        let p = P(0, -0.62 * sc); ctx.beginPath(); ctx.moveTo(p[0], p[1]);
        p = P(0.66 * sc, -0.34 * sc); ctx.lineTo(p[0], p[1]);
        p = P(0.34 * sc, 0.66 * sc); let c = P(0.62 * sc, 0.28 * sc); ctx.quadraticCurveTo(c[0], c[1], p[0], p[1]);
        p = P(0, 0.82 * sc); c = P(0.16 * sc, 0.78 * sc); ctx.quadraticCurveTo(c[0], c[1], p[0], p[1]);
        p = P(-0.34 * sc, 0.66 * sc); c = P(-0.16 * sc, 0.78 * sc); ctx.quadraticCurveTo(c[0], c[1], p[0], p[1]);
        p = P(-0.66 * sc, -0.34 * sc); c = P(-0.62 * sc, 0.28 * sc); ctx.quadraticCurveTo(c[0], c[1], p[0], p[1]);
        ctx.closePath();
      };
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = R * 0.12;
      shield(1); ctx.fillStyle = '#ffd000'; ctx.fill();      // contorno amarelo
      ctx.shadowBlur = 0;
      shield(0.82); ctx.fillStyle = '#e3262f'; ctx.fill();   // interior vermelho
      ctx.restore();
      // S amarelo
      ctx.fillStyle = '#ffd000';
      ctx.font = `800 ${R * 0.82 * breath}px ${getComputedStyle(document.body).fontFamily || 'Inter, sans-serif'}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('S', cx, cy + R * 0.06);
      return;
    }

    if (kind === 'spiderman') {
      const s = R * 0.9 * breath;
      // halo vermelho
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, `rgba(230,36,41,${Math.max(0, 0.5 * glowI)})`);
      g.addColorStop(1, 'rgba(230,36,41,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      // teia sutil de fundo
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = R * 0.012;
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92); ctx.stroke();
      }
      for (let r = 1; r <= 3; r++) {
        const rad = R * 0.92 * r / 3; ctx.beginPath();
        for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI * 2; const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.restore();
      // aranha preta
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = R * 0.12;
      drawSpider(ctx, cx, cy - R * 0.02, s * 0.82);
      ctx.restore();
      return;
    }

    if (kind === 'wonderwoman') {
      // emblema dourado da águia/WW
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, `rgba(240,192,64,${Math.max(0, 0.5 * glowI)})`);
      g.addColorStop(1, 'rgba(240,192,64,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      const s = R * 0.9 * breath;
      ctx.save();
      ctx.shadowColor = 'rgba(240,192,64,0.9)'; ctx.shadowBlur = R * 0.2;
      const grad = ctx.createLinearGradient(cx, cy - s * 0.5, cx, cy + s * 0.6);
      grad.addColorStop(0, '#fff0c0'); grad.addColorStop(0.5, '#f0c040'); grad.addColorStop(1, '#caa020');
      ctx.fillStyle = grad;
      wwPath(ctx, cx, cy - R * 0.02, s);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (kind === 'ladybug') {
      const s = R * 0.86 * breath;
      // halo vermelho
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, `rgba(255,46,62,${Math.max(0, 0.45 * glowI)})`);
      g.addColorStop(1, 'rgba(255,46,62,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      // antenas
      ctx.strokeStyle = '#111'; ctx.lineWidth = R * 0.04; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - s * 0.18, cy - s * 0.7); ctx.lineTo(cx - s * 0.32, cy - s * 0.98); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + s * 0.18, cy - s * 0.7); ctx.lineTo(cx + s * 0.32, cy - s * 0.98); ctx.stroke();
      // corpo vermelho
      ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = R * 0.1;
      const body = ctx.createRadialGradient(cx - s * 0.25, cy - s * 0.3, 0, cx, cy, s);
      body.addColorStop(0, '#ff5a66'); body.addColorStop(0.6, '#ee2030'); body.addColorStop(1, '#c2121f');
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.92, s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // cabeça preta
      ctx.fillStyle = '#0d0d0d';
      ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.74, s * 0.42, s * 0.30, 0, 0, Math.PI * 2); ctx.fill();
      // costura central
      ctx.strokeStyle = '#0d0d0d'; ctx.lineWidth = s * 0.07;
      ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.5); ctx.lineTo(cx, cy + s * 0.95); ctx.stroke();
      // pintinhas
      ctx.fillStyle = '#0d0d0d';
      [[-0.42, -0.18], [0.42, -0.18], [-0.5, 0.34], [0.5, 0.34], [-0.2, 0.62], [0.2, 0.62]].forEach(([px, py]) => {
        ctx.beginPath(); ctx.arc(cx + px * s, cy + py * s, s * 0.14, 0, Math.PI * 2); ctx.fill();
      });
      // brilho
      ctx.fillStyle = 'rgba(255,255,255,0.30)';
      ctx.beginPath(); ctx.ellipse(cx - s * 0.32, cy - s * 0.1, s * 0.2, s * 0.32, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }

    if (kind === 'barbie') {
      const s = R * 0.86 * breath;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, `rgba(255,79,163,${Math.max(0, 0.5 * glowI)})`);
      g.addColorStop(1, 'rgba(255,79,163,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.shadowColor = 'rgba(255,79,163,0.9)'; ctx.shadowBlur = R * 0.2;
      const grad = ctx.createLinearGradient(cx, cy - s * 0.7, cx, cy + s * 0.7);
      grad.addColorStop(0, '#ff9ed5'); grad.addColorStop(0.5, '#ff4fa3'); grad.addColorStop(1, '#e0318a');
      ctx.fillStyle = grad;
      drawBow(ctx, cx, cy - R * 0.06, s * 0.82);
      ctx.shadowBlur = 0;
      // brilho nas laçadas
      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.beginPath(); ctx.ellipse(cx - s * 0.6, cy - R * 0.06 - s * 0.12, s * 0.18, s * 0.1, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + s * 0.6, cy - R * 0.06 - s * 0.12, s * 0.18, s * 0.1, 0.3, 0, Math.PI * 2); ctx.fill();
      // estrelinhas de glitter
      ctx.fillStyle = '#fff';
      [[0.75, -0.55, 0.12], [-0.78, 0.5, 0.1], [0.55, 0.7, 0.08]].forEach(([px, py, sz]) => {
        sparkle(ctx, cx + px * s, cy + py * s, s * sz, (0.5 + 0.5 * Math.sin(t * 0.005 + px * 10)));
      });
      ctx.restore();
      return;
    }
  }

  function drawOrb(inst, t) {
    const { ctx, size } = inst;
    const dpr = inst.dpr;
    const S = size * dpr;
    const cx = S / 2, cy = S / 2;
    const R = S / 2 - 1.5 * dpr;

    ctx.clearRect(0, 0, S, S);
    const skin = inst.plain ? null : document.documentElement.dataset.skin;
    if (skin && skin !== 'default' && EMBLEM_SKINS[skin]) drawEmblem(ctx, t, cx, cy, R, inst.energy, skin);
    else drawCorona(ctx, t, cx, cy, R, inst.energy);
  }

  function loop(t) {
    instances.forEach(inst => {
      if (!inst.canvas.isConnected) { instances.delete(inst); return; }
      inst.energy += (inst.targetEnergy - inst.energy) * 0.04;
      if (inst.targetEnergy > 0.5 && Math.abs(inst.targetEnergy - inst.energy) < 0.05) {
        inst.targetEnergy = 0.5; // volta ao respiro de repouso
      }
      drawOrb(inst, t);
    });
    rafId = instances.size ? requestAnimationFrame(loop) : null;
  }

  /**
   * Monta uma orb animada dentro do elemento alvo.
   * @param {HTMLElement|string} target — elemento ou selector
   * @param {number} size — tamanho em px CSS
   */
  window.mountOrb = function (target, size = 120, opts = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement('canvas');
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    el.appendChild(canvas);

    const inst = {
      canvas, size, dpr,
      ctx: canvas.getContext('2d'),
      energy: 0.5,
      targetEnergy: 0.5,
      plain: !!opts.plain, // ignora o emblema de skin → sempre a corona aurora
    };
    instances.add(inst);
    if (!rafId) rafId = requestAnimationFrame(loop);

    return {
      pulse() { inst.targetEnergy = 1.0; },     // ex: celebração
      calm() { inst.targetEnergy = 0.25; },
      // erupção: estouro instantâneo de energia que decai sozinho (vulcão de luz)
      erupt() { inst.energy = 2.2; inst.targetEnergy = 0.5; },
      destroy() { instances.delete(inst); canvas.remove(); },
    };
  };

  /** Pulsa todas as orbs visíveis (usado em conquistas). */
  window.pulseOrbs = function () {
    instances.forEach(i => { i.targetEnergy = 1.0; });
  };

  /** Renderiza um frame estático em um canvas (geração de ícones). */
  window.renderOrbFrame = function (size, t = 1600) {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const inst = { canvas, size, dpr: 1, ctx: canvas.getContext('2d'), energy: 0.85, targetEnergy: 0.85 };
    drawOrb(inst, t);
    return canvas;
  };

  /** Desenha uma silhueta de morcego preenchida (reutilizável). */
  window.drawBat = function (ctx, cx, cy, s, color = '#ffd84d') {
    ctx.fillStyle = color;
    batPath(ctx, cx, cy, s);
    ctx.fill();
  };

  /* ============================================
     FX de skin (camada de primeiro plano):
     Batman → morcegos voando · Superman → soco que
     racha a tela + laser dos olhos. Fora de "missões"
     os morcegos ficam só na faixa do header.
     ============================================ */
  function rand(a, b) { return a + Math.random() * (b - a); }

  window.mountBatsFx = function () {
    if (document.getElementById('bg-bats')) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'bg-bats';
    document.body.appendChild(canvas); // no body: sobrevive aos render()
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const resize = () => {
      W = Math.min(window.innerWidth, 480);
      H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    };
    resize();
    window.addEventListener('resize', resize);

    const onMissions = () => location.hash.slice(1) === 'c/home';
    const headerBand = () => { // faixa do topo (header) quando fora das missões
      const top = (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0);
      return { top, bottom: top + 66 };
    };

    /* ---------- Criaturas voando (Batman→morcego · Ladybug→joaninha) ---------- */
    const bats = [];
    let nextBat = 0;
    function spawnBat(skin) {
      const full = onMissions();
      const band = full ? { top: H * 0.08, bottom: H * 0.7 } : headerBand();
      const dir = Math.random() < 0.5 ? 1 : -1;
      bats.push({
        dir,
        x: dir > 0 ? -50 : W + 50,
        y: rand(band.top, band.bottom),
        vx: dir * rand(42, 94),
        vy: rand(-1, 1) * (full ? 14 : 4),
        s: full ? rand(13, 31) : rand(8, 13),
        flap: Math.random() * 6,
        flapSpeed: rand(8, 14),
        op: skin === 'ladybug' ? rand(0.3, 0.55) : rand(0.16, 0.32),
      });
    }
    function miniLadybug(ctx, s) {
      ctx.fillStyle = '#ee2433';
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.92, s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0d0d0d';
      ctx.beginPath(); ctx.ellipse(0, -s * 0.72, s * 0.42, s * 0.3, 0, 0, Math.PI * 2); ctx.fill(); // cabeça
      ctx.lineWidth = s * 0.08; ctx.strokeStyle = '#0d0d0d';
      ctx.beginPath(); ctx.moveTo(0, -s * 0.4); ctx.lineTo(0, s * 0.92); ctx.stroke();           // costura
      [[-0.42, 0], [0.42, 0], [-0.28, 0.5], [0.28, 0.5]].forEach(([px, py]) => {
        ctx.beginPath(); ctx.arc(px * s, py * s, s * 0.15, 0, Math.PI * 2); ctx.fill();
      });
    }
    function drawBats(t, dt, skin) {
      if (t > nextBat) {
        nextBat = t + rand(2600, 6800);
        spawnBat(skin);
        if (onMissions() && Math.random() < 0.4) setTimeout(() => spawnBat(skin), 450);
      }
      let clip = onMissions() ? null : headerBand();
      ctx.save();
      ctx.scale(dpr, dpr);
      if (clip) { ctx.beginPath(); ctx.rect(0, clip.top, W, clip.bottom - clip.top); ctx.clip(); }
      for (let i = bats.length - 1; i >= 0; i--) {
        const b = bats[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt + Math.sin(t * 0.002 + b.flap) * 0.25;
        b.flap += b.flapSpeed * dt;
        if ((b.dir > 0 && b.x > W + 60) || (b.dir < 0 && b.x < -60)) { bats.splice(i, 1); continue; }
        const flapX = 0.45 + 0.55 * Math.abs(Math.sin(b.flap));
        ctx.save();
        ctx.translate(b.x, b.y); ctx.scale(flapX, 1);
        ctx.globalAlpha = b.op;
        if (skin === 'ladybug') miniLadybug(ctx, b.s);
        else { ctx.fillStyle = '#ffd84d'; batPath(ctx, 0, 0, b.s); ctx.fill(); }
        ctx.restore();
      }
      ctx.restore();
    }

    /* ---------- Super-Homem: soco que racha + laser ---------- */
    let seq = null, nextSeq = 0;
    function genCracks(ix, iy) {
      const cracks = [];
      const main = 7 + (Math.random() * 3 | 0);
      for (let i = 0; i < main; i++) {
        const ang = (i / main) * Math.PI * 2 + rand(-0.2, 0.2);
        const len = rand(0.5, 1) * Math.max(W, H) * 0.7;
        const pts = [[ix, iy]];
        let x = ix, y = iy, a = ang, seg = 5 + (Math.random() * 4 | 0);
        for (let s = 0; s < seg; s++) {
          a += rand(-0.35, 0.35);
          const step = len / seg;
          x += Math.cos(a) * step; y += Math.sin(a) * step;
          pts.push([x, y]);
        }
        cracks.push(pts);
      }
      // alguns "estilhaços" conectando
      for (let i = 0; i < main; i++) {
        const c = cracks[i], n = cracks[(i + 1) % main];
        const k = 1 + (Math.random() * (c.length - 2) | 0);
        if (c[k] && n[k]) cracks.push([c[k], n[k]]);
      }
      return cracks;
    }
    function startSeq(t, kind) {
      if (kind === 'spiderman') {
        // teia lançada (thwip!) de um canto + teia se formando no alvo
        const corners = [[0, 0], [W, 0], [0, H], [W, H]];
        const origin = corners[Math.floor(Math.random() * 4)];
        const target = [W * rand(0.3, 0.7), H * rand(0.4, 0.72)];
        seq = { kind, t0: t, origin, target, spokes: 9 + (Math.random() * 3 | 0), maxR: Math.min(W, H) * rand(0.28, 0.42), angOff: rand(0, Math.PI), rings: 4 };
        return;
      }
      if (kind === 'wonderwoman') {
        // Laço da Verdade estalando 2 ou 3 vezes (chicote dourado)
        const n = 2 + (Math.random() < 0.5 ? 1 : 0);
        const ox = W * rand(0.32, 0.68), oy = H * 0.20;
        const cracks = [];
        for (let i = 0; i < n; i++) {
          const tx = W * rand(0.1, 0.9), ty = H * rand(0.46, 0.86);
          const mx = (ox + tx) / 2 + rand(-1, 1) * W * 0.28;
          const my = Math.min(oy, ty) - rand(0.12, 0.4) * H; // controle p/ cima → arco de chicote
          cracks.push({ delay: i * 0.42, tip: [tx, ty], ctrl: [mx, my] });
        }
        seq = { kind, t0: t, origin: [ox, oy], cracks, n };
        return;
      }
      if (kind === 'barbie') {
        // "Hora de brilhar": estrelas/diamantes estourando em sequência (lens-flare glam)
        const cols = ['#ffffff', '#ff8ad0', '#ffd84d', '#ff4fa3'];
        const pops = Array.from({ length: 11 }, (_, i) => ({
          x: W * rand(0.12, 0.88), y: H * rand(0.12, 0.84),
          delay: rand(0, 1.6), size: rand(20, 50),
          color: cols[i % cols.length], spin: rand(-0.4, 0.4),
        }));
        seq = { kind, t0: t, pops };
        return;
      }
      // superman (padrão): laser em 1 de 3 colunas, de cima p/ baixo
      const cols = [0.22, 0.5, 0.78];
      const cx = W * cols[Math.floor(Math.random() * 3)];
      const ix = cx, iy = H * rand(0.26, 0.40);
      seq = {
        kind: 'superman', t0: t, impact: [ix, iy], cracks: genCracks(ix, iy),
        eyes: [[cx - W * 0.05, H * 0.14], [cx + W * 0.05, H * 0.14]],
        target: [cx, H * rand(0.78, 0.92)],
      };
    }
    function drawSeq(t) {
      if (seq && seq.kind === 'wonderwoman') return drawWW(t);
      if (seq && seq.kind === 'barbie') return drawBarbie(t);
      if (seq && seq.kind === 'spiderman') return drawSpiderFx(t);
      if (!seq) return;
      const el = (t - seq.t0) / 1000; // segundos desde o início
      ctx.save();
      ctx.scale(dpr, dpr);

      // FASE 1 — soco/rachadura (0 .. 1.8s)
      if (el < 1.8) {
        const [ix, iy] = seq.impact;
        // flash de impacto
        if (el < 0.5) {
          const fa = 1 - el / 0.5;
          const g = ctx.createRadialGradient(ix, iy, 0, ix, iy, Math.max(W, H) * 0.5);
          g.addColorStop(0, `rgba(255,255,255,${0.5 * fa})`);
          g.addColorStop(0.3, `rgba(120,180,255,${0.25 * fa})`);
          g.addColorStop(1, 'rgba(120,180,255,0)');
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        }
        // rachaduras crescendo e depois sumindo
        const grow = Math.min(1, el / 0.45);
        const fade = el < 1.2 ? 1 : Math.max(0, 1 - (el - 1.2) / 0.6);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        seq.cracks.forEach((pts, ci) => {
          ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
          const upto = 1 + Math.floor((pts.length - 1) * grow);
          for (let i = 1; i < upto; i++) ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.strokeStyle = `rgba(220,235,255,${0.85 * fade})`;
          ctx.lineWidth = ci < 10 ? 2.4 : 1.2;
          ctx.shadowColor = 'rgba(120,180,255,0.8)'; ctx.shadowBlur = 8;
          ctx.stroke();
        });
        ctx.shadowBlur = 0;
      }

      // FASE 2 — laser dos olhos (1.4s .. 2.6s)
      if (el >= 1.4 && el < 2.6) {
        const le = (el - 1.4) / 1.2;            // 0..1
        const flick = 0.7 + 0.3 * Math.sin(t * 0.06);
        seq.eyes.forEach((eye, k) => {
          const tx = seq.target[0] + (k === 0 ? -10 : 10);
          const ty = seq.target[1];
          // feixe
          const grad = ctx.createLinearGradient(eye[0], eye[1], tx, ty);
          grad.addColorStop(0, `rgba(255,255,255,${0.95 * flick})`);
          grad.addColorStop(0.15, `rgba(255,80,60,${0.9 * flick})`);
          grad.addColorStop(1, `rgba(227,38,47,0)`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = (le < 0.85 ? 5 : 5 * (1 - (le - 0.85) / 0.15)) * (0.8 + 0.4 * flick);
          ctx.shadowColor = 'rgba(255,40,40,0.9)'; ctx.shadowBlur = 14;
          ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(eye[0], eye[1]); ctx.lineTo(tx, ty); ctx.stroke();
          // olho aceso
          ctx.beginPath(); ctx.fillStyle = `rgba(255,235,235,${flick})`;
          ctx.arc(eye[0], eye[1], 3.5, 0, Math.PI * 2); ctx.fill();
        });
        ctx.shadowBlur = 0;
        // ponto de impacto do laser (faísca)
        if (le > 0.1) {
          const sg = ctx.createRadialGradient(seq.target[0], seq.target[1], 0, seq.target[0], seq.target[1], 26 * flick);
          sg.addColorStop(0, `rgba(255,240,200,${0.9 * flick})`);
          sg.addColorStop(0.4, `rgba(255,90,60,${0.5 * flick})`);
          sg.addColorStop(1, 'rgba(255,90,60,0)');
          ctx.fillStyle = sg;
          ctx.beginPath(); ctx.arc(seq.target[0], seq.target[1], 26 * flick, 0, Math.PI * 2); ctx.fill();
        }
      }

      ctx.restore();
      if (el > 2.7) seq = null;
    }

    /* ---------- Homem-Aranha: teia lançada (thwip) + teia se formando ---------- */
    function drawSpiderFx(t) {
      const el = (t - seq.t0) / 1000;
      const [ox, oy] = seq.origin, [tx, ty] = seq.target;
      ctx.save(); ctx.scale(dpr, dpr);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      // thwip: a teia dispara do canto até o alvo
      if (el < 0.55) {
        const ext = Math.min(1, el / 0.26);
        const ex = ox + (tx - ox) * ext, ey = oy + (ty - oy) * ext;
        const fade = el < 0.4 ? 1 : Math.max(0, 1 - (el - 0.4) / 0.15);
        ctx.strokeStyle = `rgba(255,255,255,${0.92 * fade})`;
        ctx.lineWidth = 3; ctx.shadowColor = 'rgba(255,255,255,0.6)'; ctx.shadowBlur = 7;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.shadowBlur = 0;
      }
      // teia se formando no alvo
      if (el >= 0.24) {
        const we = el - 0.24;
        const grow = Math.min(1, we / 0.7);
        const fade = el < 2.0 ? 1 : Math.max(0, 1 - (el - 2.0) / 0.6);
        const N = seq.spokes, maxR = seq.maxR * grow, off = seq.angOff;
        ctx.strokeStyle = `rgba(235,242,255,${0.55 * fade})`; ctx.lineWidth = 1.4;
        ctx.shadowColor = 'rgba(255,255,255,0.4)'; ctx.shadowBlur = 4;
        // raios
        for (let i = 0; i < N; i++) {
          const a = off + i / N * Math.PI * 2;
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(a) * maxR, ty + Math.sin(a) * maxR); ctx.stroke();
        }
        // fios concêntricos (côncavos entre os raios)
        for (let r = 1; r <= seq.rings; r++) {
          const rad = maxR * r / seq.rings;
          ctx.beginPath();
          for (let i = 0; i <= N; i++) {
            const a0 = off + i / N * Math.PI * 2;
            const x = tx + Math.cos(a0) * rad, y = ty + Math.sin(a0) * rad;
            if (i === 0) { ctx.moveTo(x, y); continue; }
            const a1 = off + (i - 0.5) / N * Math.PI * 2;
            const mr = rad * 0.86; // puxa o meio p/ dentro (côncavo)
            ctx.quadraticCurveTo(tx + Math.cos(a1) * mr, ty + Math.sin(a1) * mr, x, y);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
      ctx.restore();
      if (el > 2.5) seq = null;
    }

    /* ---------- Mulher-Maravilha: Laço da Verdade estalando 2-3x ---------- */
    function drawWW(t) {
      const el = (t - seq.t0) / 1000;
      const [ox, oy] = seq.origin;
      ctx.save(); ctx.scale(dpr, dpr);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      seq.cracks.forEach(c => {
        const ce = el - c.delay;               // tempo local desse estalo
        if (ce < 0 || ce > 0.78) return;
        const ext = Math.min(1, ce / 0.28);    // o chicote se estende
        const fade = ce < 0.5 ? 1 : Math.max(0, 1 - (ce - 0.5) / 0.28);
        // corda dourada (bézier origem → controle → ponta), desenhada até "ext"
        const N = 20, lim = Math.max(1, Math.round(N * ext));
        const ptAt = (u) => [
          (1 - u) * (1 - u) * ox + 2 * (1 - u) * u * c.ctrl[0] + u * u * c.tip[0],
          (1 - u) * (1 - u) * oy + 2 * (1 - u) * u * c.ctrl[1] + u * u * c.tip[1],
        ];
        ctx.shadowColor = 'rgba(255,235,150,0.9)'; ctx.shadowBlur = 14;
        ctx.strokeStyle = `rgba(240,200,90,${0.92 * fade})`; ctx.lineWidth = 4.5;
        ctx.beginPath();
        for (let k = 0; k <= lim; k++) { const p = ptAt(k / N); k === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); }
        ctx.stroke();
        // núcleo claro
        ctx.shadowBlur = 0; ctx.strokeStyle = `rgba(255,250,225,${0.85 * fade})`; ctx.lineWidth = 1.6; ctx.stroke();
        // estalo na ponta quando totalmente estendido
        if (ce >= 0.25 && ce < 0.52) {
          const sf = 1 - (ce - 0.25) / 0.27;
          const [tx, ty] = c.tip;
          const gg = ctx.createRadialGradient(tx, ty, 0, tx, ty, 38 * sf + 6);
          gg.addColorStop(0, `rgba(255,255,255,${0.95 * sf})`);
          gg.addColorStop(0.4, `rgba(255,220,120,${0.6 * sf})`);
          gg.addColorStop(1, 'rgba(255,220,120,0)');
          ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(tx, ty, 38 * sf + 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; sparkle(ctx, tx, ty, 20 * sf + 5, sf);
        }
      });

      // brilho do laço na mão (origem)
      const total = seq.n * 0.42 + 0.6;
      if (el < total) {
        const og = ctx.createRadialGradient(ox, oy, 0, ox, oy, 22);
        og.addColorStop(0, 'rgba(255,235,150,0.55)'); og.addColorStop(1, 'rgba(255,235,150,0)');
        ctx.fillStyle = og; ctx.beginPath(); ctx.arc(ox, oy, 22, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      if (el > total + 0.2) seq = null;
    }

    /* ---------- Barbie: "Hora de brilhar" (estrelas glam estourando) ---------- */
    function glamSparkle(x, y, r, a, color) {
      ctx.save();
      ctx.globalAlpha = a;
      // halo
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.5);
      g.addColorStop(0, 'rgba(255,255,255,0.9)');
      g.addColorStop(0.35, color);
      g.addColorStop(1, 'rgba(255,138,208,0)');
      ctx.globalAlpha = a * 0.55; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r * 1.5, 0, Math.PI * 2); ctx.fill();
      // reflexo de lente (cruz fina e longa)
      ctx.globalAlpha = a * 0.9;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.4;
      ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - r * 2.1, y); ctx.lineTo(x + r * 2.1, y);
      ctx.moveTo(x, y - r * 2.1); ctx.lineTo(x, y + r * 2.1);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // estrela de 4 pontas (branca + cor)
      ctx.fillStyle = '#fff'; sparkle(ctx, x, y, r, a);
      ctx.fillStyle = color; sparkle(ctx, x, y, r * 0.62, a * 0.85);
      ctx.restore();
    }
    function drawBarbie(t) {
      const el = (t - seq.t0) / 1000;
      ctx.save(); ctx.scale(dpr, dpr);
      seq.pops.forEach(p => {
        const pe = el - p.delay;
        if (pe < 0 || pe > 0.62) return;
        const prog = pe / 0.62;
        const sc = Math.sin(prog * Math.PI);          // 0→1→0 (estoura e some)
        glamSparkle(p.x, p.y, p.size * (0.3 + 0.7 * sc), sc, p.color);
      });
      ctx.restore();
      if (el > 2.5) seq = null;
    }

    /* ---------- Loop ---------- */
    const FLYING = { batman: 1, ladybug: 1 };
    const SEQ = { superman: 1, spiderman: 1, wonderwoman: 1, barbie: 1 };
    let last = 0;
    function frame(t) {
      requestAnimationFrame(frame);
      const skin = document.documentElement.dataset.skin;
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (FLYING[skin]) {
        seq = null;
        drawBats(t, dt, skin);
      } else if (SEQ[skin]) {
        bats.length = 0;
        if (onMissions()) {
          if (!seq && t > nextSeq) { nextSeq = t + rand(6000, 11000); startSeq(t, skin); }
          drawSeq(t);
        } else { seq = null; }
      } else {
        bats.length = 0; seq = null;
      }
    }
    requestAnimationFrame(frame);

    // dispara o efeito do skin imediatamente (teste / eventos)
    window.skinFxBurst = function () {
      const skin = document.documentElement.dataset.skin;
      if (FLYING[skin]) { for (let i = 0; i < 4; i++) setTimeout(() => spawnBat(skin), i * 250); }
      else if (SEQ[skin]) startSeq(performance.now(), skin);
    };
  };
})();
