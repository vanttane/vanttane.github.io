/* =====================================================================
   VANTTANE — carrossel de fotos em WebGL
   Faixa curva ("sorriso"), revelação em blocos, título que embaralha
   enquanto a faixa anda e borda de vidro com luzes RGB nas laterais.
   Anda com a rolagem da página (a seção fica presa na tela).
   ===================================================================== */
(function () {
  'use strict';

  // ---------------- fotos escolhidas ----------------
  const PROJ = {
    AF: { nome: 'AUTONOMIA FACIAL', cliente: 'SP Paris x Thart',
      desc: 'Fashion film e ensaio da SP Paris x Thart. Balaclavas de crochê, luz de estúdio e grafite: moda de rua tratada como cinema.' },
    BOP: { nome: 'BLOCO OS PIORES', cliente: 'Carnaval com Vibe',
      desc: 'Carnaval de rua com o Bloco Os Piores e a ativação da Vibe: multidão, palco e gente de verdade na frente da câmera.' },
  };
  // [arquivo do carrossel, foto grande, projeto, largura, altura]
  const FOTOS = [
    ['c01', '01', 'AF', 563, 1000], ['c02', 'bloco-01', 'BOP', 774, 1000], ['c03', '03', 'AF', 563, 1000],
    ['c04', 'bloco-02', 'BOP', 1000, 774], ['c05', '07', 'AF', 563, 1000], ['c06', '08', 'AF', 563, 1000],
    ['c07', 'bloco-05', 'BOP', 889, 1000], ['c08', '09', 'AF', 563, 1000], ['c09', '10', 'AF', 666, 1000],
    ['c10', 'bloco-08', 'BOP', 754, 1000], ['c11', '13', 'AF', 718, 1000], ['c12', '14', 'AF', 666, 1000],
    ['c13', 'bloco-11', 'BOP', 715, 1000], ['c14', '16', 'AF', 666, 1000], ['c15', '20', 'AF', 750, 1000],
    ['c16', 'bloco-16', 'BOP', 830, 1000], ['c17', '21', 'AF', 750, 1000], ['c18', 'bloco-19', 'BOP', 666, 1000],
    ['c19', '23', 'AF', 792, 1000], ['c20', 'bloco-20', 'BOP', 874, 1000],
  ];
  const N = FOTOS.length;
  const cont = {}; // numeração por projeto: AF 01, AF 02…
  const CARDS = FOTOS.map(([c, g, p, w, h]) => { cont[p] = (cont[p] || 0) + 1; return { thumb: 'fotos/carrossel/' + c + '.jpg', grande: 'fotos/' + g + '.jpg', proj: p, cod: p + ' ' + String(cont[p]).padStart(2, '0'), aspecto: w / h }; });

  const sec = document.getElementById('fotos');
  const palco = document.getElementById('fx-palco');
  if (!sec || !palco) return;
  const canvas = document.getElementById('fx-canvas');
  const labelsEl = document.getElementById('fx-labels');
  const tituloEl = document.getElementById('fx-titulo');
  const tickEl = document.getElementById('fx-tick');
  const contEl = document.getElementById('fx-cont');
  const modoBtn = document.getElementById('fx-modo');
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = n => String(n).padStart(2, '0');

  // ---------------- tamanho da seção (rolagem) ----------------
  let SEGF = 0, secTop = 0;
  function medirSecao() {
    SEGF = Math.max(140, innerHeight * .26);
    sec.style.height = (innerHeight + (N - 1) * SEGF) + 'px';
    secTop = sec.getBoundingClientRect().top + scrollY;
  }
  medirSecao();
  addEventListener('resize', medirSecao);
  const progressoAlvo = () => Math.max(0, Math.min(N - 1, (scrollY - secTop) / SEGF));

  // ---------------- detalhe (foto grande) ----------------
  const det = document.getElementById('fx-detalhe');
  const detImg = document.getElementById('fx-det-img');
  const detBlocos = document.getElementById('fx-det-blocos');
  let detAtual = -1;
  function abrirDetalhe(i) {
    detAtual = (i + N) % N;
    const c = CARDS[detAtual], p = PROJ[c.proj];
    detImg.src = c.grande;
    document.getElementById('fx-det-num').textContent = 'FOTO ' + pad(detAtual + 1) + ' / ' + pad(N) + ' · ' + c.cod;
    document.getElementById('fx-det-tit').textContent = p.nome;
    document.getElementById('fx-det-cli').textContent = p.cliente;
    document.getElementById('fx-det-desc').textContent = p.desc;
    detBlocos.innerHTML = '';
    for (let k = 0; k < 35; k++) {
      const b = document.createElement('i');
      b.style.transitionDelay = (reduz ? 0 : 300 + Math.random() * 700) + 'ms';
      detBlocos.appendChild(b);
    }
    det.classList.add('aberto'); det.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => requestAnimationFrame(() => detBlocos.classList.add('some')));
  }
  function fecharDetalhe() { det.classList.remove('aberto'); det.setAttribute('aria-hidden', 'true'); detBlocos.classList.remove('some'); }
  document.getElementById('fx-det-fechar').addEventListener('click', fecharDetalhe);
  document.getElementById('fx-det-ant').addEventListener('click', () => { detBlocos.classList.remove('some'); abrirDetalhe(detAtual - 1); });
  document.getElementById('fx-det-prox').addEventListener('click', () => { detBlocos.classList.remove('some'); abrirDetalhe(detAtual + 1); });
  addEventListener('keydown', e => {
    if (!det.classList.contains('aberto')) return;
    if (e.key === 'Escape') fecharDetalhe();
    if (e.key === 'ArrowRight') { detBlocos.classList.remove('some'); abrirDetalhe(detAtual + 1); }
    if (e.key === 'ArrowLeft') { detBlocos.classList.remove('some'); abrirDetalhe(detAtual - 1); }
  });

  // ---------------- sem WebGL ou aberto direto do computador: faixa simples ----------------
  function modoSimples() {
    palco.classList.add('fx-simples');
    sec.style.height = '';
    const faixa = document.createElement('div');
    faixa.className = 'fx-faixa';
    faixa.innerHTML = CARDS.map((c, i) => '<button data-i="' + i + '"><span class="mono">' + c.cod + '</span><img loading="lazy" src="' + c.thumb + '" alt="' + PROJ[c.proj].nome + '"></button>').join('');
    faixa.addEventListener('click', e => { const b = e.target.closest('button'); if (b) abrirDetalhe(+b.dataset.i); });
    palco.appendChild(faixa);
    tituloEl.textContent = 'FOTOGRAFIA';
  }
  const temWebGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { return false; } })();
  if (location.protocol === 'file:' || !temWebGL) { modoSimples(); return; }

  // ---------------- carrega o three.js só quando a seção chega perto ----------------
  let iniciado = false;
  new IntersectionObserver((es, o) => {
    if (es[0].isIntersecting && !iniciado) {
      iniciado = true; o.disconnect();
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload = () => { try { iniciar(); } catch (err) { console.error(err); modoSimples(); } };
      s.onerror = modoSimples;
      document.head.appendChild(s);
    }
  }, { rootMargin: '150% 0px' }).observe(sec);

  function iniciar() {
    const T = window.THREE;
    let W = palco.clientWidth, H = palco.clientHeight, mob = W < 760;
    const PR = Math.min(1.5, devicePixelRatio || 1);
    const renderer = new T.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(PR);
    renderer.setSize(W, H, false);
    renderer.autoClear = false;
    let rt = new T.WebGLRenderTarget(W * PR, H * PR, { minFilter: T.LinearFilter, magFilter: T.LinearFilter });

    const cena = new T.Scene();
    const cam = new T.OrthographicCamera(0, W, 0, -H, -10, 10);
    const geoTela = new T.PlaneGeometry(2, 2);
    const vertTela = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';

    // fundo: cor da Vanttane com leve brilho no centro e granulado
    const fundoMat = new T.ShaderMaterial({
      uniforms: { uBase: { value: new T.Vector3(.039, .039, .043) }, uT: { value: 0 } },
      vertexShader: vertTela,
      fragmentShader: `uniform vec3 uBase; uniform float uT; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){ float r = length(vUv - .5) * 1.41; vec3 c = uBase * (1. + .25 * (1. - r));
          c += (h(vUv * 900. + fract(uT)) - .5) * .012; gl_FragColor = vec4(c, 1.); }`,
      depthTest: false, depthWrite: false,
    });
    const fundo = new T.Mesh(geoTela, fundoMat); fundo.renderOrder = -1; fundo.frustumCulled = false;
    cena.add(fundo);

    // cards
    const vertCard = `uniform float uX, uS, uGrid, uMob, uCW; uniform vec2 uRes; uniform vec4 uGR;
      varying vec2 vUv; varying vec2 vSize;
      void main(){
        float W = uRes.x, H = uRes.y; float u = position.x + .5, v = position.y + .5;
        float f = uMob > .5 ? 1.6 : 1.; float tb = uMob > .5 ? .26 : .217; float bb = uMob > .5 ? .60 : .659;
        float cw = uCW * W; float cx = W * .5 + uX * W;
        float x = cx + (u - .5) * cw * uS;
        float dxn = (x - W * .5) / W * f;
        float topY = H * (tb - .03 * smoothstep(.30, .45, abs(dxn)));
        float topC = H * (tb - .03 * smoothstep(.30, .45, abs(uX) * f));
        float botY = H * (bb - .135 * smoothstep(.12, .39, abs(uX) * f));
        float cy = (topC + botY) * .5;
        float y = cy + (mix(botY, topY, v) - cy) * uS;
        float gx = uGR.x + u * uGR.z, gy = uGR.y + (1. - v) * uGR.w;
        x = mix(x, gx, uGrid); y = mix(y, gy, uGrid);
        vUv = vec2(u, v);
        vSize = mix(vec2(cw * uS, (botY - topC) * uS), uGR.zw, uGrid);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(x, -y, 0., 1.);
      }`;
    const fragCard = `uniform sampler2D uTex; uniform float uHas, uRev, uSeed, uImgA, uHover;
      varying vec2 vUv; varying vec2 vSize;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float sdRB(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
      vec2 cobrir(vec2 uv, float ca){ if (ca > uImgA) uv.y = (uv.y - .5) * (uImgA / ca) + .5; else uv.x = (uv.x - .5) * (ca / uImgA) + .5; return uv; }
      void main(){
        vec2 p = (vUv - .5) * vSize; float d = sdRB(p, vSize * .5, .048 * vSize.x);
        float a = 1. - smoothstep(-.8, .8, d); if (a <= 0.) discard;
        float ca = vSize.x / max(vSize.y, 1.);
        vec3 col = vec3(.05);
        if (uHas > .5) {
          vec2 cells = vec2(5., 7.); vec2 cell = floor(vUv * cells);
          float r = hash(cell + uSeed) * .92 + .04;
          vec3 img = texture2D(uTex, cobrir(vUv, ca)).rgb;
          if (r > uRev) img = vec3(.043, .043, .058);
          else if (r > uRev - .12) img = mix(img, texture2D(uTex, cobrir((cell + .5) / cells, ca)).rgb * .8, .85);
          col = img * (1. + .08 * uHover);
        }
        gl_FragColor = vec4(col, a);
      }`;
    const geoCard = new T.PlaneGeometry(1, 1, 48, 1);
    const loader = new T.TextureLoader(); loader.setCrossOrigin('anonymous');
    const COPIAS = 2, TOTAL = N * COPIAS;
    const texturas = CARDS.map(c => {
      const u = { v: null, ok: false };
      u.v = loader.load(c.thumb, t => { t.minFilter = T.LinearFilter; t.generateMipmaps = false; u.ok = true; });
      return u;
    });
    const malhas = [];
    for (let k = 0; k < TOTAL; k++) {
      const i = k % N;
      const mat = new T.ShaderMaterial({
        uniforms: {
          uTex: { value: texturas[i].v }, uHas: { value: 0 }, uRev: { value: 0 }, uSeed: { value: Math.random() * 100 },
          uImgA: { value: CARDS[i].aspecto }, uHover: { value: 0 }, uX: { value: 0 }, uS: { value: 1 }, uGrid: { value: 0 },
          uMob: { value: 0 }, uCW: { value: .174 }, uRes: { value: new T.Vector2(W, H) }, uGR: { value: new T.Vector4(0, 0, 1, 1) },
        },
        vertexShader: vertCard, fragmentShader: fragCard, transparent: true, depthTest: false, depthWrite: false,
      });
      const m = new T.Mesh(geoCard, mat); m.frustumCulled = false;
      cena.add(m);
      const lab = document.createElement('span'); lab.className = 'fx-lab mono'; lab.textContent = CARDS[i].cod; labelsEl.appendChild(lab);
      malhas.push({ m, i, k, lab, x: 0, vis: false, revT0: -1, s: 1, hover: 0 });
    }

    // vidro nas bordas + luzes RGB
    const vidroMat = new T.ShaderMaterial({
      uniforms: { uScene: { value: rt.texture }, uRes: { value: new T.Vector2(W, H) }, uT: { value: 0 } },
      vertexShader: vertTela,
      fragmentShader: `uniform sampler2D uScene; uniform vec2 uRes; uniform float uT; varying vec2 vUv;
        float sdRB(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
        float dentro(vec2 px){ vec2 c = uRes * .5; return -sdRB(px - c, c, .22 * min(uRes.x, uRes.y)); }
        vec3 amostra(vec2 px){ return texture2D(uScene, clamp(px / uRes, .001, .999)).rgb; }
        void main(){
          vec2 px = vUv * uRes; float m = min(uRes.x, uRes.y);
          float d = dentro(px);
          float rim = .17 * m * (1. + .3 * smoothstep(.25, 0., vUv.y));
          float t = clamp(1. - d / rim, 0., 1.);
          vec2 g = vec2(dentro(px + vec2(1., 0.)) - dentro(px - vec2(1., 0.)), dentro(px + vec2(0., 1.)) - dentro(px - vec2(0., 1.)));
          vec2 n = -normalize(g + 1e-5);
          vec2 off = n * t * t * rim * .46;
          vec2 tg = vec2(-n.y, n.x); float sp = t * t * t * .003 * m;
          vec3 col = vec3(0.);
          for (int k = -2; k <= 2; k++) {
            vec2 o = tg * float(k) * sp;
            col.r += amostra(px - off * 1.06 + o).r;
            col.g += amostra(px - off + o).g;
            col.b += amostra(px - off * .94 + o).b;
          }
          col /= 5.;
          float ang = atan((px.y - uRes.y * .5) / uRes.y, (px.x - uRes.x * .5) / uRes.x);
          float T = uT;
          float lr = .5 + .5 * (.62 * sin(2. * ang + .55 * T) + .38 * sin(3. * ang - .41 * T + 1.7));
          float lg = .5 + .5 * (.62 * sin(2. * ang - .47 * T + 2.3) + .38 * sin(ang - .33 * T + 4.1));
          float lb = .5 + .5 * (.62 * sin(ang + .38 * T + 4.6) + .38 * sin(3. * ang + .52 * T + .9));
          vec3 L = vec3(smoothstep(.32, .9, lr), smoothstep(.32, .9, lg), smoothstep(.32, .9, lb));
          L.g *= 1. - .65 * L.r;
          float xE = min(px.x, uRes.x - px.x);
          float k = clamp(min(min(xE / (.12 * uRes.x), px.y / (.19 * uRes.y)), (uRes.y - px.y) / (.09 * uRes.y)), 0., 1.);
          float mask = pow(1. - k, 1.7);
          vec3 luz = L + vec3(.16, .15, .34);
          luz = mix(luz, vec3(dot(luz, vec3(.299, .587, .114))), .12);
          col += luz * mask * .34;
          gl_FragColor = vec4(col, 1.);
        }`,
      depthTest: false, depthWrite: false,
    });
    const telaCena = new T.Scene();
    const telaQuad = new T.Mesh(geoTela, vidroMat); telaQuad.frustumCulled = false; telaCena.add(telaQuad);

    // ---------------- medidas ----------------
    let CW, PITCH, gridRects = [];
    function medidas() {
      W = palco.clientWidth; H = palco.clientHeight; mob = W < 760;
      CW = mob ? .44 : .174; PITCH = mob ? .47 : .1786;
      renderer.setSize(W, H, false);
      rt.setSize(W * PR, H * PR);
      cam.right = W; cam.bottom = -H; cam.updateProjectionMatrix();
      vidroMat.uniforms.uRes.value.set(W, H);
      // grade 5 x 4 centralizada
      const cols = mob ? 4 : 5, rows = Math.ceil(N / cols), gap = W * .01;
      let gw = mob ? W * .2 : W * .13; let gh = gw / .68;
      const maxH = H * .62; if (rows * gh + (rows - 1) * gap > maxH) { gh = (maxH - (rows - 1) * gap) / rows; gw = gh * .68; }
      const tw = cols * gw + (cols - 1) * gap, th = rows * gh + (rows - 1) * gap;
      const x0 = (W - tw) / 2, y0 = (H - th) / 2 - H * .01;
      gridRects = CARDS.map((_, i) => [x0 + (i % cols) * (gw + gap), y0 + Math.floor(i / cols) * (gh + gap), gw, gh]);
      malhas.forEach(o => { const u = o.m.material.uniforms; u.uRes.value.set(W, H); u.uMob.value = mob ? 1 : 0; u.uCW.value = CW; const g = gridRects[o.i]; u.uGR.value.set(g[0], g[1], g[2], g[3]); });
    }
    medidas();
    addEventListener('resize', () => { medirSecao(); medidas(); });

    // espelho na CPU da conta do vertex shader (para etiquetas e clique)
    const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    function ponto(uX, s, u, v) {
      const f = mob ? 1.6 : 1, tb = mob ? .26 : .217, bb = mob ? .60 : .659, cw = CW * W, cx = W * .5 + uX * W;
      const x = cx + (u - .5) * cw * s;
      const topY = H * (tb - .03 * ss(.30, .45, Math.abs((x - W * .5) / W * f)));
      const topC = H * (tb - .03 * ss(.30, .45, Math.abs(uX) * f));
      const botY = H * (bb - .135 * ss(.12, .39, Math.abs(uX) * f));
      const cy = (topC + botY) * .5;
      return [x, cy + ((botY + (topY - botY) * v) - cy) * s];
    }

    // ---------------- interação ----------------
    let pos = progressoAlvo(), alvo = pos, grade = 0, gradeAlvo = 0, centro = -1, quadro = 0, tAnt = performance.now(), t0 = performance.now();
    let mouse = null, arr = null, ativo = false, introFeita = false;
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const rnd = n => Array.from({ length: n }, () => CHARS[Math.random() * CHARS.length | 0]).join('');

    modoBtn.addEventListener('click', () => {
      gradeAlvo = gradeAlvo ? 0 : 1;
      palco.classList.toggle('fx-em-grade', !!gradeAlvo);
      modoBtn.textContent = gradeAlvo ? 'Faixa' : 'Grade';
      const agora = performance.now();
      malhas.forEach(o => { o.revT0 = agora + Math.random() * 400; o.m.material.uniforms.uRev.value = 0; });
    });
    palco.addEventListener('pointermove', e => { const r = palco.getBoundingClientRect(); mouse = [e.clientX - r.left, e.clientY - r.top]; });
    palco.addEventListener('pointerleave', () => { mouse = null; });
    palco.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('button,a')) return;
      arr = { x: e.clientX, y: e.clientY, p0: (scrollY - secTop) / SEGF, mov: false, id: e.pointerId };
    });
    addEventListener('pointermove', e => {
      if (!arr || e.pointerId !== arr.id || gradeAlvo) return;
      const dx = e.clientX - arr.x;
      if (!arr.mov) { if (Math.abs(dx) < 6) return; if (Math.abs(e.clientY - arr.y) > Math.abs(dx)) { arr = null; return; } arr.mov = true; }
      const p = Math.max(0, Math.min(N - 1, arr.p0 - (dx / W * 1.1) / PITCH));
      scrollTo(0, secTop + p * SEGF);
    });
    addEventListener('pointerup', e => {
      if (!arr || e.pointerId !== arr.id) return;
      const a = arr; arr = null;
      if (a.mov) return;
      const r = palco.getBoundingClientRect(); const mx = e.clientX - r.left, my = e.clientY - r.top;
      const alvoCard = cardEm(mx, my);
      if (alvoCard) abrirDetalhe(alvoCard.i);
    });
    function cardEm(mx, my) {
      let melhor = null;
      malhas.forEach(o => {
        if (!o.vis && grade < .5) return;
        let x0, y0, x1, y1;
        if (grade > .5) { const g = gridRects[o.i]; if (o.k >= N) return; [x0, y0, x1, y1] = [g[0], g[1], g[0] + g[2], g[1] + g[3]]; }
        else { const a = ponto(o.x, o.s, 0, 1), b = ponto(o.x, o.s, 1, 0); [x0, y0, x1, y1] = [a[0], a[1], b[0], b[1]]; }
        if (mx >= x0 && mx <= x1 && my >= y0 && my <= y1) { if (!melhor || Math.abs(o.x) < Math.abs(melhor.x)) melhor = o; }
      });
      return melhor;
    }
    addEventListener('keydown', e => {
      if (!ativo || det.classList.contains('aberto') || gradeAlvo) return;
      const idx = Math.round(progressoAlvo());
      if (e.key === 'ArrowRight' && idx < N - 1) { e.preventDefault(); scrollTo({ top: secTop + (idx + 1) * SEGF, behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft' && idx > 0) { e.preventDefault(); scrollTo({ top: secTop + (idx - 1) * SEGF, behavior: 'smooth' }); }
    });
    new IntersectionObserver(es => { ativo = es[0].isIntersecting; if (ativo) { tAnt = performance.now(); requestAnimationFrame(quadroLoop); } }, { threshold: 0 }).observe(palco);

    const span = TOTAL * PITCH;
    const wrap = v => { v = ((v % span) + span) % span; return v > span / 2 ? v - span : v; };

    function quadroLoop(agora) {
      if (!ativo) return;
      const dt = Math.min(.05, (agora - tAnt) / 1000); tAnt = agora; quadro++;
      const T = (agora - t0) / 1000;
      alvo = progressoAlvo();
      const k = reduz ? 1 : 1 - Math.pow(1 - .12, dt * 30);
      pos += (alvo - pos) * k;
      grade += (gradeAlvo - grade) * (1 - Math.pow(.88, dt * 60));
      if (Math.abs(gradeAlvo - grade) < .001) grade = gradeAlvo;

      // intro: cards aparecem a partir do centro
      if (!introFeita) { introFeita = true; malhas.forEach(o => { o.revT0 = agora + 200 + Math.abs(wrap(o.i * PITCH - pos * PITCH)) * 800; }); }

      let melhor = null;
      malhas.forEach(o => {
        const u = o.m.material.uniforms;
        o.x = wrap(o.k * PITCH - pos * PITCH);
        const vis = Math.abs(o.x) < .62;
        if (vis && !o.vis && o.revT0 < agora - 800) { o.revT0 = agora + Math.random() * 120; u.uRev.value = 0; }
        o.vis = vis;
        const naGrade = o.k < N;
        o.m.visible = (vis || (grade > .02 && naGrade)) && !(grade > .98 && !naGrade);
        if (o.revT0 >= 0) { const p = Math.max(0, Math.min(1, (agora - o.revT0) / 750)); u.uRev.value = reduz ? 1 : p; }
        u.uHas.value = texturas[o.i].ok ? 1 : 0;
        u.uX.value = o.x;
        u.uGrid.value = naGrade ? grade : 0;
        // hover
        const sob = mouse && !arr && cardEm(mouse[0], mouse[1]) === o;
        o.hover += ((sob ? 1 : 0) - o.hover) * .18;
        o.s = 1 + .015 * o.hover; u.uS.value = o.s; u.uHover.value = o.hover;
        if (vis && (!melhor || Math.abs(o.x) < Math.abs(melhor.x))) melhor = o;
        // etiqueta
        if (vis && grade < .5) {
          const a = ponto(o.x, o.s, 0, 1), b = ponto(o.x, o.s, 1, 1);
          const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
          o.lab.style.transform = 'translate(' + (a[0] + 2).toFixed(1) + 'px,' + (a[1] - H * .006).toFixed(1) + 'px) rotate(' + ang.toFixed(4) + 'rad) translateY(-100%)';
          o.lab.style.opacity = (1 - grade * 2).toFixed(2);
        } else if (grade >= .5 && naGrade) {
          const g = gridRects[o.i];
          o.lab.style.transform = 'translate(' + (g[0] + 2) + 'px,' + (g[1] - 4) + 'px) translateY(-100%)';
          o.lab.style.opacity = ((grade - .5) * 2).toFixed(2);
        } else o.lab.style.opacity = 0;
      });
      palco.style.cursor = mouse && cardEm(mouse[0], mouse[1]) ? 'pointer' : '';

      // centro, régua e título
      if (melhor && melhor.i !== centro) {
        centro = melhor.i;
        tickEl.style.left = (centro / (N - 1) * 100) + '%';
        contEl.textContent = pad(centro + 1) + ' / ' + pad(N);
      }
      if (Math.abs(alvo - pos) > .02 && !reduz) {
        if (quadro % 3 === 0) tituloEl.textContent = rnd(2 + (Math.random() * 2 | 0)) + ' ' + rnd(3 + (Math.random() * 2 | 0));
      } else if (centro >= 0) {
        const nome = PROJ[CARDS[centro].proj].nome;
        if (tituloEl.textContent !== nome) tituloEl.textContent = nome;
      }

      fundoMat.uniforms.uT.value = T;
      vidroMat.uniforms.uT.value = T;
      renderer.setRenderTarget(rt); renderer.clear(); renderer.render(cena, cam);
      renderer.setRenderTarget(null); renderer.clear(); renderer.render(telaCena, cam);
      requestAnimationFrame(quadroLoop);
    }
  }
})();
