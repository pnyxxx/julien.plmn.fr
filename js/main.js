import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { createLaptop, createPhone } from './models.js';

/*
  Pour utiliser tes propres modèles 3D : dépose un fichier .glb dans assets/models/
  et renseigne son chemin ici. Laisse `null` pour garder le modèle intégré.
  `size` = hauteur souhaitée en unités de scène (le modèle est recentré et mis à l'échelle).
*/
const CUSTOM_MODELS = {
  laptop: { url: null, size: 2.6, rotation: [0, -0.42, 0] },
  phone: { url: null, size: 1.9, rotation: [0, 0, 0] },
};

gsap.registerPlugin(ScrollTrigger);

const isMobile = matchMedia('(max-width: 780px)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis = null;
if (!reduceMotion && typeof Lenis !== 'undefined') {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ============================================================
   Scroll progress + nav
   ============================================================ */
function initNav() {
  const navEl = document.getElementById('nav');

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => navEl.classList.toggle('scrolled', self.scroll() > 60),
  });

  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  const links = mobileMenu.querySelectorAll('.mobile-link');

  burger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    burger.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      gsap.fromTo(links, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, ease: 'power3.out', delay: 0.15 });
    }
  });
  links.forEach((l) =>
    l.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      burger.classList.remove('open');
      document.body.style.overflow = '';
    })
  );

  const navLinks = document.querySelectorAll('.nav-link, .mobile-link');
  const pill = document.getElementById('navPill');
  const indicator = document.getElementById('navIndicator');

  function moveIndicator(link, animated = true) {
    if (!link || !pill.contains(link)) return;
    const target = { left: link.offsetLeft, width: link.offsetWidth };
    gsap.to(indicator, {
      ...target,
      duration: animated ? 0.5 : 0,
      ease: 'power3.out',
      overwrite: true,
    });
  }

  const activeLink = () => pill.querySelector('.nav-link.active');
  requestAnimationFrame(() => moveIndicator(activeLink(), false));
  window.addEventListener('resize', () => moveIndicator(activeLink(), false));

  pill.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('mouseenter', () => moveIndicator(link));
  });
  pill.addEventListener('mouseleave', () => moveIndicator(activeLink()));

  document.querySelectorAll('section[id]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => {
        if (!self.isActive) return;
        navLinks.forEach((l) => l.classList.toggle('active', l.dataset.section === section.id));
        if (!pill.matches(':hover')) moveIndicator(activeLink());
      },
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -10, duration: 1.4 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* ============================================================
   Text splitting + reveals
   ============================================================ */
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  return words.map((word, i) => {
    const mask = document.createElement('span');
    mask.className = 'word-mask';
    const inner = document.createElement('span');
    inner.className = 'word';
    inner.textContent = word;
    mask.appendChild(inner);
    el.appendChild(mask);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    return inner;
  });
}

function initTextReveals() {
  document.querySelectorAll('[data-words]').forEach((el) => {
    const words = splitWords(el);
    gsap.set(words, { yPercent: 115 });
    gsap.to(words, {
      yPercent: 0,
      duration: 1.05,
      ease: 'power4.out',
      stagger: 0.045,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });
}

function initReveals() {
  document.querySelectorAll('.reveal-up').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  gsap.utils.toArray('.card-3d').forEach((card, i) => {
    gsap.fromTo(
      card,
      { opacity: 0, y: 70, rotateX: -18, transformPerspective: 1200 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 1.1,
        ease: 'power3.out',
        delay: (i % 4) * 0.09,
        scrollTrigger: { trigger: card, start: 'top 90%' },
      }
    );
  });

  gsap.utils.toArray('[data-parallax]').forEach((el) => {
    gsap.to(el, {
      y: () => -parseFloat(el.dataset.parallax) * 100,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

/* ============================================================
   Marquee bands
   ============================================================ */
function initMarquee() {
  document.querySelectorAll('.marquee').forEach((marquee) => {
    const inner = marquee.querySelector('.marquee-inner');
    marquee.appendChild(inner.cloneNode(true));
    const dir = marquee.dataset.dir === 'right' ? 1 : -1;
    const tween = gsap.to(marquee.children, {
      xPercent: dir * -100,
      repeat: -1,
      duration: 26,
      ease: 'none',
    });
    if (dir === 1) gsap.set(marquee.children, { xPercent: -100 });

    ScrollTrigger.create({
      onUpdate: (self) => {
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 900, 4);
        gsap.to(tween, { timeScale: boost, duration: 0.3, overwrite: true });
      },
    });
  });
}

/* ============================================================
   Cards: hover tilt in 3D space
   ============================================================ */
function initTilt() {
  if (matchMedia('(pointer:coarse)').matches) return;
  document.querySelectorAll('.tilt').forEach((card) => {
    const inner = card.querySelector('.tilt-inner');
    if (!inner) return;
    const rotX = gsap.quickTo(inner, 'rotateX', { duration: 0.6, ease: 'power3' });
    const rotY = gsap.quickTo(inner, 'rotateY', { duration: 0.6, ease: 'power3' });
    const lift = gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'power3' });

    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      rotY(((e.clientX - r.left) / r.width - 0.5) * 13);
      rotX(-((e.clientY - r.top) / r.height - 0.5) * 13);
      lift(-8);
    });
    card.addEventListener('mouseleave', () => {
      rotX(0);
      rotY(0);
      lift(0);
    });
  });
}

/* ============================================================
   AI section — animated assistant demo + pipeline drawing
   ============================================================ */
const CHAT_SCENARIOS = [
  [
    { type: 'user', text: 'Combien de commandes sont en retard cette semaine ?' },
    { type: 'tool', text: '→ search_orders({ status: "late", range: "7d" })' },
    {
      type: 'ai',
      text: '12 commandes sont en retard, dont 5 chez le même transporteur. Le retard moyen est de 2,4 jours.',
      sources: ['orders.postgres', 'sla_transporteurs.pdf'],
    },
    { type: 'user', text: 'Relance les clients concernés.' },
    { type: 'tool', text: '→ send_emails({ template: "retard", count: 12 })' },
    { type: 'ai', text: '12 relances envoyées avec la date de livraison estimée. Le rapport est dans votre espace.' },
  ],
  [
    { type: 'user', text: 'Résume le contrat fournisseur signé hier.' },
    { type: 'tool', text: '→ read_document({ file: "contrat_metalix_2026.pdf" })' },
    {
      type: 'ai',
      text: 'Engagement de 24 mois, révision tarifaire annuelle plafonnée à 3 %, pénalités de retard à 0,5 % par jour et clause de sortie avec préavis de 3 mois.',
      sources: ['contrat_metalix_2026.pdf, p.4–7'],
    },
  ],
  [
    { type: 'user', text: 'Pourquoi le client #4821 a-t-il été facturé deux fois ?' },
    { type: 'tool', text: '→ query_invoices({ customer: 4821, month: "03" })' },
    {
      type: 'ai',
      text: 'Deux paiements ont été enregistrés le 12 mars : un via Stripe, un par virement. Je peux préparer un remboursement de 149 € et notifier le client.',
      sources: ['stripe.charges', 'bank_transfers.csv'],
    },
  ],
  [
    { type: 'user', text: 'Trie les tickets d\'hier par priorité.' },
    { type: 'tool', text: '→ classify_tickets({ date: "yesterday", labels: 4 })' },
    {
      type: 'ai',
      text: '187 tickets classés : 9 critiques (paiement bloqué), 41 importants, 102 courants et 35 doublons fusionnés. Les critiques sont assignés au support niveau 2.',
    },
  ],
  [
    { type: 'user', text: 'Extrais les données des factures de mars en JSON.' },
    { type: 'tool', text: '→ parse_invoices({ folder: "/factures/2026-03" })' },
    {
      type: 'ai',
      text: '40 factures traitées : { fournisseur, date, total_ht, tva, echeance }. 2 documents illisibles sont signalés pour vérification manuelle.',
      sources: ['ocr.pipeline', 'schema_facture.json'],
    },
  ],
  [
    { type: 'user', text: 'Trouve nos projets proches d\'une marketplace B2B.' },
    { type: 'tool', text: '→ vector_search({ query: "marketplace B2B", top_k: 3 })' },
    {
      type: 'ai',
      text: '3 projets correspondent : Atelier Store (catalogue multi-vendeurs), Flowbase (facturation inter-entreprises) et Nova Analytics (suivi des marges).',
      sources: ['projets.embeddings'],
    },
  ],
  [
    { type: 'user', text: 'Quel est le taux de désabonnement ce trimestre ?' },
    { type: 'tool', text: '→ run_query({ metric: "churn", period: "Q1" })' },
    {
      type: 'ai',
      text: '4,1 % ce trimestre, contre 5,6 % au précédent. La baisse suit l\'ajout de l\'onboarding guidé en février.',
      sources: ['subscriptions.postgres'],
    },
  ],
];

function initAiChat() {
  const body = document.getElementById('chatBody');
  const chat = document.getElementById('aiChat');
  if (!body || !chat) return;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const scrollToEnd = () =>
    gsap.to(body, { scrollTop: body.scrollHeight, duration: 0.45, ease: 'power2.out', overwrite: true });

  function prune() {
    while (body.children.length > 12) body.removeChild(body.firstElementChild);
  }

  function bubble(className, text) {
    const el = document.createElement('div');
    el.className = className;
    el.textContent = text;
    body.appendChild(el);
    prune();
    gsap.from(el, { opacity: 0, y: 14, duration: 0.5, ease: 'power3.out' });
    scrollToEnd();
    return el;
  }

  async function typeInto(el, text) {
    const caret = document.createElement('span');
    caret.className = 'caret';
    el.appendChild(caret);
    for (let i = 0; i < text.length; i++) {
      caret.before(document.createTextNode(text[i]));
      if (i % 8 === 0) scrollToEnd();
      if (text[i] !== ' ') await wait(13);
    }
    caret.remove();
    scrollToEnd();
  }

  let running = false;

  async function play() {
    running = true;
    let index = 0;
    while (true) {
      const scenario = CHAT_SCENARIOS[index % CHAT_SCENARIOS.length];
      index++;

      for (const step of scenario) {
        if (step.type === 'user') {
          bubble('bubble bubble-user', step.text);
          await wait(750);
        } else if (step.type === 'tool') {
          bubble('bubble-tool', step.text);
          await wait(680);
        } else {
          const el = bubble('bubble bubble-ai', '');
          await typeInto(el, step.text);
          if (step.sources) {
            const row = document.createElement('div');
            row.className = 'bubble-sources';
            step.sources.forEach((source) => {
              const chip = document.createElement('span');
              chip.textContent = source;
              row.appendChild(chip);
            });
            body.appendChild(row);
            prune();
            gsap.from(row, { opacity: 0, y: 10, duration: 0.4 });
            scrollToEnd();
          }
          await wait(1000);
        }
      }
      await wait(2400);
    }
  }

  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !running && !reduceMotion) play();
    },
    { threshold: 0.2 }
  ).observe(chat);
}

function initPipeline() {
  const svg = document.getElementById('pipelineSvg');
  if (!svg) return;

  const paths = svg.querySelectorAll('.pipe-links path');
  const nodes = svg.querySelectorAll('.pipe-node');

  paths.forEach((path) => {
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
  });
  gsap.set(nodes, { opacity: 0, y: 18 });

  const links = svg.querySelector('.pipe-links');
  gsap.set(links, { opacity: 0 });

  const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 82%' } });
  tl.to(nodes, { opacity: 1, y: 0, duration: 0.7, stagger: 0.11, ease: 'power3.out' })
    .to(links, { opacity: 1, duration: 0.2 }, '-=0.6')
    .to(paths, { strokeDashoffset: 0, duration: 0.9, stagger: 0.12, ease: 'power2.inOut' }, '<');
}

/* ============================================================
   Counters / timeline / form
   ============================================================ */
function initCounters() {
  document.querySelectorAll('.stat-num').forEach((num) => {
    const target = parseFloat(num.dataset.count);
    ScrollTrigger.create({
      trigger: num,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        const state = { v: 0 };
        gsap.to(state, {
          v: target,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => { num.textContent = Math.round(state.v); },
        });
      },
    });
  });
}

function initTimeline() {
  const fill = document.getElementById('timelineFill');
  ScrollTrigger.create({
    trigger: '.timeline',
    start: 'top 65%',
    end: 'bottom 55%',
    scrub: 0.4,
    onUpdate: (self) => { fill.style.height = self.progress * 100 + '%'; },
  });

  gsap.utils.toArray('.timeline-item').forEach((item) => {
    gsap.fromTo(
      item,
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 88%' } }
    );
  });
}

/* ============================================================
   Hero entrance
   ============================================================ */
function playHeroEntrance() {
  const root = document.documentElement;
  if (root.dataset.entered) return;
  root.dataset.entered = '1';

  const lines = [];
  document.querySelectorAll('[data-split]').forEach((line) => {
    const text = line.textContent;
    line.textContent = '';
    const inner = document.createElement('span');
    inner.className = 'line-inner';
    inner.textContent = text;
    line.appendChild(inner);
    lines.push(inner);
  });

  gsap.set(['.nav', '.hero-eyebrow', '.hero-title', '.hero-sub', '.hero-actions .btn', '.hero-meta-item', '.scroll-cue'], { opacity: 0 });
  gsap.set(['.hero-actions', '.hero-meta'], { opacity: 1 });
  gsap.set(lines, { yPercent: 115 });
  gsap.set('.nav', { y: -18 });
  root.classList.remove('js-entrance');

  const tl = gsap.timeline();
  tl.to('.nav', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
    .to('.hero-eyebrow', { opacity: 1, duration: 0.9, ease: 'power2.out' }, '-=0.6')
    .set('.hero-title', { opacity: 1 })
    .to(lines, { yPercent: 0, duration: 1.15, ease: 'power4.out', stagger: 0.1 }, '-=0.5')
    .to('.hero-sub', { opacity: 1, duration: 1.1, ease: 'power2.out' }, '-=0.5')
    .to('.hero-actions .btn', { opacity: 1, duration: 0.9, ease: 'power2.out', stagger: 0.14 }, '-=0.85')
    .to('.hero-meta-item', { opacity: 1, duration: 0.9, ease: 'power2.out', stagger: 0.11 }, '-=0.7')
    .to('.scroll-cue', { opacity: 1, duration: 0.7, ease: 'power2.out' }, '-=0.5');

  window.dispatchEvent(new CustomEvent('hero:enter'));
}

function startEntrance() {
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  const cap = new Promise((resolve) => setTimeout(resolve, 900));
  Promise.race([fonts, cap]).then(playHeroEntrance);
}

/* ============================================================
   Shared 3D setup
   ============================================================ */
function makeRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

function studioEnvironment(renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
}

function collectMaterials(root) {
  const entries = [];
  root.traverse((child) => {
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (!entries.some((entry) => entry.material === material)) {
        entries.push({ material, baseOpacity: material.opacity, alwaysTransparent: material.transparent });
      }
    });
  });
  return entries;
}

function setModelOpacity(entries, factor) {
  entries.forEach(({ material, baseOpacity, alwaysTransparent }) => {
    material.opacity = baseOpacity * factor;
    material.transparent = alwaysTransparent || factor < 1;
  });
}

let gltfLoader = null;
function loadCustomModel({ url, size, rotation }) {
  if (!url) return Promise.resolve(null);
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
    gltfLoader.setDRACOLoader(draco);
  }

  return gltfLoader.loadAsync(url).then((gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const dimensions = box.getSize(new THREE.Vector3());
    model.scale.setScalar(size / Math.max(dimensions.x, dimensions.y, dimensions.z));

    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(model.scale.x);
    model.position.sub(center);

    const wrapper = new THREE.Group();
    wrapper.add(model);
    wrapper.rotation.set(...rotation);
    wrapper.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return wrapper;
  });
}

function accentLights(scene, intensity = 1) {
  const key = new THREE.DirectionalLight(0xffffff, 3.2 * intensity);
  key.position.set(3.5, 6, 5);
  scene.add(key);

  const violet = new THREE.PointLight(0x7c3aed, 13 * intensity, 22);
  violet.position.set(-4, 1.4, 3);
  scene.add(violet);

  const cyan = new THREE.PointLight(0x06b6d4, 11 * intensity, 22);
  cyan.position.set(4.5, -1.4, 2.4);
  scene.add(cyan);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  return { key };
}

/* ============================================================
   Hero scene — laptop
   ============================================================ */
function initHeroScene() {
  const canvas = document.getElementById('heroCanvas');
  const renderer = makeRenderer(canvas);
  renderer.shadowMap.enabled = !isMobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  studioEnvironment(renderer, scene);
  const { key } = accentLights(scene);
  if (!isMobile) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 20;
    key.shadow.bias = -0.0015;
  }

  const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 60);
  camera.position.set(0, 0.4, 9);
  camera.lookAt(0, -0.1, 0);

  let subject = createLaptop();
  let lid = subject.userData.lid;
  lid.rotation.x = Math.PI / 2 - 0.04;

  const rig = new THREE.Group();
  rig.add(subject);
  scene.add(rig);

  function layout() {
    const portrait = innerWidth < 900;
    if (portrait) {
      rig.position.set(0, -1.35, 0.6);
      rig.scale.setScalar(innerWidth < 520 ? 0.72 : 0.85);
    } else {
      rig.position.set(2.05, -0.8, 0);
      rig.scale.setScalar(innerWidth < 1250 ? 0.78 : 0.88);
    }
    subject.rotation.set(0.06, portrait ? -0.15 : -0.42, 0);
  }
  layout();

  let materials = collectMaterials(subject);
  let entryFade = 0;
  let scrollFade = 1;

  function applyOpacity() {
    const value = entryFade * scrollFade;
    setModelOpacity(materials, value);
    rig.visible = value > 0.01;
  }
  applyOpacity();

  loadCustomModel(CUSTOM_MODELS.laptop).then((custom) => {
    if (!custom) return;
    rig.remove(subject);
    subject = custom;
    lid = null;
    rig.add(subject);
    materials = collectMaterials(subject);
    applyOpacity();
    layout();
  });

  let entered = false;
  window.addEventListener('hero:enter', () => {
    if (entered) return;
    entered = true;
    if (lid) gsap.to(lid.rotation, { x: -0.24, duration: 2.2, ease: 'power3.inOut' });
    gsap.from(rig.position, { y: rig.position.y - 1.2, duration: 2, ease: 'power3.out' });
    gsap.from(subject.rotation, { y: subject.rotation.y - 0.5, duration: 2.4, ease: 'power3.out' });
  });

  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 0.6,
    onUpdate: (self) => {
      const p = self.progress;
      subject.rotation.y = (innerWidth < 900 ? -0.15 : -0.42) + p * 1.1;
      subject.rotation.x = 0.06 + p * 0.25;
      rig.position.y = (innerWidth < 900 ? -1.35 : -0.8) + p * 1.1;
      rig.position.z = p * -3;
      scrollFade = gsap.utils.clamp(0, 1, 1 - (p - 0.32) / 0.45);
      applyOpacity();
    },
  });

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    layout();
  }
  window.addEventListener('resize', resize);

  let visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  const clock = new THREE.Clock();
  let firstFrame = true;
  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    const t = clock.getElapsedTime();
    if (!reduceMotion && entered) {
      subject.position.y = Math.sin(t * 0.7) * 0.045;
      subject.rotation.z = Math.sin(t * 0.45) * 0.012;
    }
    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      window.dispatchEvent(new CustomEvent('hero:ready'));
      gsap.to({ v: 0 }, {
        v: 1,
        duration: 1.2,
        ease: 'power2.out',
        onUpdate() {
          entryFade = this.targets()[0].v;
          applyOpacity();
        },
      });
    }
  }
  animate();
}

/* ============================================================
   About scene — phone
   ============================================================ */
function initPhoneScene() {
  const container = document.getElementById('phoneStage');
  const canvas = document.getElementById('phoneCanvas');
  const renderer = makeRenderer(canvas);

  const scene = new THREE.Scene();
  studioEnvironment(renderer, scene);
  accentLights(scene, 0.85);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
  camera.position.set(0, 0, 4.3);

  let phone = createPhone();
  const rig = new THREE.Group();
  rig.add(phone);
  scene.add(rig);

  loadCustomModel(CUSTOM_MODELS.phone).then((custom) => {
    if (!custom) return;
    rig.remove(phone);
    phone = custom;
    rig.add(phone);
  });

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  ScrollTrigger.create({
    trigger: container,
    start: 'top bottom',
    end: 'bottom top',
    scrub: 0.8,
    onUpdate: (self) => {
      rig.rotation.y = -0.42 + self.progress * 0.84;
      rig.rotation.x = 0.1 - self.progress * 0.2;
    },
  });

  let running = false;
  new IntersectionObserver(([entry]) => { running = entry.isIntersecting; }, { threshold: 0.05 }).observe(container);

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    if (!running) return;
    const t = clock.getElapsedTime();
    if (!reduceMotion) phone.position.y = Math.sin(t * 0.8) * 0.06;
    renderer.render(scene, camera);
  }
  animate();
}

/* ============================================================
   Init
   ============================================================ */
document.getElementById('year').textContent = new Date().getFullYear();

initNav();
initTextReveals();
initReveals();
initMarquee();
initTilt();
initCounters();
initTimeline();
initAiChat();
initPipeline();
initHeroScene();
initPhoneScene();
startEntrance();
