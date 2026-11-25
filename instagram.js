/* =====================================================================
   VANTTANE — posts do Instagram em cena
   Cards dos posts: leque → espalhados → monte → roda que gira.
   Anda com a rolagem (seção presa na tela), com inércia por card.
   ===================================================================== */
(function () {
  'use strict';
  const POSTS = [
    ['DG4DTM-vIMT', 'reel', 'A Bruxa Tá Solta', 'vanttane.prod'],
    ['DNWfkUApUxn', 'reel', 'SP Paris · 3 Anos', 'spparis.original'],
    ['C4k3X2RuWzp', 'reel', 'Meneguin · Perdão', 'eae_meneguin'],
    ['CyjewhKOLiS', 'reel', 'Pathy Muniz', 'pathymuniz'],
    ['C7UMEclOan-', 'reel', 'Grito Silencioso', 'nobru_cz'],
    ['C6PTxoMPmhK', 'reel', 'Mês do Hip Hop', 'vanttane.prod'],
    ['C5_ltdLP_V4', 'reel', 'Foak Wear', 'foakwear'],
    ['C5orHnUvM0o', 'reel', 'Marginal Magazine', 'marginalmagazine_'],
    ['C4EcpUoP5yu', 'reel', 'Marcha Transmasculina', 'vanttane.prod'],
    ['C72dfwXv-9T', 'reel', 'Educação em SP', 'vanttane.prod'],
    ['CyrCIO4veqq', 'reel', 'Batalha de Pirituba', 'vanttane.prod'],
    ['C0NQQJsPh6p', 'reel', 'Carro Chefe', 'vanttane.prod'],
  ];
  const N = POSTS.length;
  const sec = document.getElementById('instagram');
  const palco = document.getElementById('ig-palco');
  const caixa = document.getElementById('ig-cards');
  if (!sec || !palco || !caixa) return;
  const proc = document.getElementById('ig-proc');
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // cards
  const cards = POSTS.map(([id, tipo, titulo, conta], i) => {
    const a = document.createElement('a');
    a.className = 'ig-card';
    a.href = 'https://www.instagram.com/' + (tipo === 'reel' ? 'reel/' : 'p/') + id + '/';
    a.target = '_blank'; a.rel = 'noopener';
    a.setAttribute('aria-label', titulo + ' no Instagram');
    a.innerHTML = '<span class="ig-img" style="background-image:url(insta/' + id + '.jpg)"></span>'
      + '<span class="ig-play" aria-hidden="true"></span>'
      + '<span class="ig-leg"><b>' + titulo + '</b><small>@' + conta + '</small></span>';
    caixa.appendChild(a);
    return { el: a, i, pose: null, alvo: null };
  });

  // ---------------- medidas ----------------
  let W, H, mob, cw, alturaSec, topSec;
  function medir() {
    W = palco.clientWidth; H = palco.clientHeight; mob = W < 820 && W < H * 1.1;
    cw = mob ? Math.min(W * .30, H * .2) : Math.min(W / 1440, H / 780) * 218;
    caixa.style.setProperty('--cw', cw);
    alturaSec = innerHeight * 5.2;
    sec.style.height = alturaSec + 'px';
    topSec = sec.getBoundingClientRect().top + scrollY;
  }
  medir();
  addEventListener('resize', medir);

  const passo = R => 2 * Math.asin(Math.min(1, 1.05 * cw / (2 * R)));
  const graus = r => r * 180 / Math.PI;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const faixa = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const eInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  // cubic-bezier(.25,.75,.2,1) aproximada
  const eGlide = t => 1 - Math.pow(1 - t, 3.2);
  const mix = (a, b, t) => a.map((v, k) => v + (b[k] - v) * t);

  function fan(i) {
    if (i > 5) return [W * .5, H * 1.4, 0, 1, 0];
    const R = mob ? W * 1.35 : 1250 * W / 1440;
    const th = (i - 2.5) * passo(R);
    const cx = mob ? W * .5 : W * .55, cy = H * .8 + R;
    return [cx + R * Math.sin(th) - (mob ? 0 : W * .02), cy - R * Math.cos(th) + (mob ? cw * .2 : 0), graus(th), 1, 1];
  }
  const SC_D = [[.08, .5, -20], [.20, .86, -12], [.80, .84, 14], [.38, 1.04, -8], [.92, .46, 16], [.62, 1.04, 9]];
  const SC_M = [[.06, .62, -20], [.45, .7, 12], [.94, .62, 16], [.22, .93, -14], [.72, .96, 9], [.5, 1.3, 0]];
  function scatter(i) {
    if (i > 5) return [W * .5, H * 1.4, 0, 1, 0];
    const s = (mob ? SC_M : SC_D)[i];
    return [W * s[0], H * s[1], s[2], 1, 1];
  }
  function pile(i) {
    const sgn = i % 2 ? -1 : 1;
    return [W * .5 + ((i % 3) - 1) * cw * .08, H * .66 + (((i * 7) % 5) - 2) * cw * .04, sgn * (4 + i * 1.3), 1, 1];
  }
  function wheel(i, rot) {
    const R = mob ? W * 1.2 : 900 * W / 1440;
    let slot = (((i + rot) % N) + N) % N - (N - 1) / 2;
    const ang = slot * passo(R);
    const cx = W * .5, cy = (mob ? H * .74 : H * .73) + R;
    return [cx + R * Math.sin(ang), cy - R * Math.cos(ang), graus(ang), 1, Math.abs(graus(ang)) < 62 ? 1 : 0];
  }

  function alvoPara(i, p) {
    // leque → espalhados
    let pose = mix(fan(i), scatter(i), eInOut(faixa(p, .02, .16)));
    // espalhados → monte (cards 6–11 aparecem aqui)
    const tP = eInOut(faixa(p, .24, .36));
    if (tP > 0) { const pl = pile(i); pose = mix(pose, pl, tP); if (i > 5) { pose[0] = pl[0]; pose[1] = pl[1] + (1 - tP) * H * .6; pose[4] = tP; } }
    // monte → roda
    const tW = eGlide(faixa(p, .36, .48));
    if (tW > 0) {
      const rot = -(N / 2) * eInOut(faixa(p, .52, .9));
      pose = mix(pose, wheel(i, rot), tW);
      if (tW >= 1) pose = wheel(i, rot);
    }
    return pose;
  }

  // ---------------- entrada (tempo) e revelação do título ----------------
  let entrouEm = -1, procRevelado = false;
  const palavras = [...proc.querySelectorAll('.ig-w')];
  const extras = [...proc.querySelectorAll('.ig-sub, .ig-btn')];
  function revelarTitulo() {
    if (procRevelado) return; procRevelado = true;
    palavras.forEach((w, k) => { w.style.transitionDelay = (k * .11) + 's'; w.classList.add('on'); });
    extras.forEach((e, k) => { e.style.transitionDelay = (.7 + k * .15) + 's'; e.classList.add('on'); });
  }
  const ORDEM = [5, 2, 0, 1, 3, 4], ATRASO = [0, .07, .1, .17, .27, .33];
  const backOut = t => { const s = 1.15; t -= 1; return t * t * ((s + 1) * t + s) + 1; };

  // ---------------- laço ----------------
  let ativo = false, tAnt = performance.now();
  new IntersectionObserver(es => {
    ativo = es[0].isIntersecting;
    if (ativo) {
      if (entrouEm < 0) { entrouEm = performance.now(); revelarTitulo(); }
      tAnt = performance.now(); requestAnimationFrame(loop);
    }
  }, { threshold: .25 }).observe(palco);

  function loop(agora) {
    if (!ativo) return;
    const dt = Math.min(64, agora - tAnt); tAnt = agora;
    const p = clamp((scrollY - topSec) / (alturaSec - innerHeight), 0, 1);
    const te = (agora - entrouEm) / 1000;
    cards.forEach(c => {
      let alvo = alvoPara(c.i, p);
      // subida inicial dos cards do leque
      const ordem = ORDEM.indexOf(c.i);
      if (ordem >= 0 && !reduz) {
        const t = clamp((te - .15 - ATRASO[ordem]) / .7, 0, 1);
        if (t < 1) {
          const ini = [alvo[0], H + cw * 1.2, alvo[2] + 8, 1, alvo[4]];
          alvo = mix(ini, alvo, backOut(t));
          c.pose = alvo.slice();
        }
      }
      if (!c.pose || reduz) c.pose = alvo.slice();
      else {
        const w = .055 + (c.i % 4) * .008, k = 1 - Math.pow(1 - w, dt / 16.67);
        c.pose = c.pose.map((v, n) => v + (alvo[n] - v) * k);
      }
      const [x, y, r, s, o] = c.pose;
      c.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + r.toFixed(2) + 'deg) scale(' + s.toFixed(3) + ')';
      c.el.style.opacity = o.toFixed(3);
      c.el.style.pointerEvents = o > .5 ? '' : 'none';
      c.el.style.zIndex = Math.round(100 - Math.abs(r));
    });
    requestAnimationFrame(loop);
  }

  // pular a seção
  const pular = document.getElementById('ig-pular');
  if (pular) pular.addEventListener('click', () => {
    let prox = sec.nextElementSibling;
    while (prox && prox.tagName !== 'SECTION') prox = prox.nextElementSibling;
    if (prox && typeof window.irSecao === 'function' && prox.id) window.irSecao(prox.id);
    else if (prox) prox.scrollIntoView({ behavior: 'smooth' });
  });
})();
