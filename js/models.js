import * as THREE from 'three';

function roundedShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function slab(w, h, thickness, radius, bevel = 0.01) {
  const geo = new THREE.ExtrudeGeometry(roundedShape(w, h, radius), {
    depth: Math.max(thickness - bevel * 2, 0.001),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 16,
  });
  geo.center();
  return geo;
}

function planarUV(geo) {
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const w = max.x - min.x;
  const h = max.y - min.y;
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - min.x) / w;
    uv[i * 2 + 1] = (pos.getY(i) - min.y) / h;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

function canvasTexture(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const CODE = [
  "import { Router } from 'express';",
  "import { prisma } from '../lib/db';",
  '',
  'export const projects = Router();',
  '',
  "projects.get('/:slug', async (req, res) => {",
  '  const project = await prisma.project.findUnique({',
  '    where: { slug: req.params.slug },',
  '    include: { stack: true, metrics: true },',
  '  });',
  '',
  '  if (!project) {',
  "    return res.status(404).json({ error: 'not_found' });",
  '  }',
  '',
  '  res.json(serialize(project));',
  '});',
  '',
  '// deploy: docker build && fly deploy --remote-only',
];

const KEYWORDS = new Set(['import', 'from', 'export', 'const', 'let', 'async', 'await', 'return', 'if', 'new', 'true', 'false']);
const TYPES = new Set(['Router', 'prisma', 'req', 'res', 'project', 'serialize', 'projects']);

function drawCode(ctx, x0, y0, lineHeight, fontSize) {
  ctx.font = `${fontSize}px "JetBrains Mono", "SF Mono", monospace`;
  ctx.textBaseline = 'top';
  const token = /(\/\/[^\n]*)|('[^']*')|(\b\d+\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\s\w])/g;

  CODE.forEach((line, i) => {
    const y = y0 + i * lineHeight;
    ctx.fillStyle = '#3b4252';
    ctx.textAlign = 'right';
    ctx.fillText(String(i + 1), x0 - 28, y);
    ctx.textAlign = 'left';

    let x = x0;
    let m;
    token.lastIndex = 0;
    while ((m = token.exec(line))) {
      const [text, comment, str, num, word, space] = m;
      let color = '#c9d1d9';
      if (comment) color = '#4b5666';
      else if (str) color = '#7ee787';
      else if (num) color = '#f0883e';
      else if (word) color = KEYWORDS.has(word) ? '#c77dff' : TYPES.has(word) ? '#79c0ff' : '#c9d1d9';
      else if (!space) color = '#8b949e';
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      x += ctx.measureText(text).width;
    }
  });
}

function laptopScreenTexture() {
  return canvasTexture(1760, 1100, (ctx, w, h) => {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#010409';
    ctx.fillRect(0, 0, w, 54);
    const dots = ['#ff5f57', '#febc2e', '#28c840'];
    dots.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(34 + i * 30, 27, 9, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#6e7681';
    ctx.font = '20px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('api / routes / projects.ts', w / 2, 28);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#0b0f16';
    ctx.fillRect(0, 54, 300, h - 54);
    const files = [
      ['#79c0ff', 'src'],
      ['#7ee787', '  api'],
      ['#f0883e', '  projects.ts'],
      ['#79c0ff', '  lib'],
      ['#8b949e', '  db.ts'],
      ['#8b949e', '  components'],
      ['#8b949e', '  hooks'],
      ['#8b949e', 'prisma'],
      ['#8b949e', 'Dockerfile'],
      ['#8b949e', 'README.md'],
    ];
    ctx.font = '21px "Inter", sans-serif';
    files.forEach(([color, name], i) => {
      const y = 110 + i * 42;
      if (i === 2) {
        ctx.fillStyle = '#161b22';
        ctx.fillRect(0, y - 12, 300, 38);
        ctx.fillStyle = '#2f81f7';
        ctx.fillRect(0, y - 12, 3, 38);
      }
      ctx.fillStyle = color;
      ctx.fillText(name, 34, y);
    });

    drawCode(ctx, 380, 108, 44, 26);

    const termY = h - 260;
    ctx.fillStyle = '#010409';
    ctx.fillRect(300, termY, w - 300, h - termY - 36);
    ctx.fillStyle = '#30363d';
    ctx.fillRect(300, termY, w - 300, 2);
    ctx.font = '22px "JetBrains Mono", monospace';
    const term = [
      ['#7ee787', '➜ '],
      ['#c9d1d9', 'npm run dev'],
    ];
    let tx = 340;
    term.forEach(([c, t]) => {
      ctx.fillStyle = c;
      ctx.fillText(t, tx, termY + 40);
      tx += ctx.measureText(t).width;
    });
    ctx.fillStyle = '#8b949e';
    ctx.fillText('ready in 412 ms', 340, termY + 82);
    ctx.fillStyle = '#7ee787';
    ctx.fillText('✓ api listening on http://localhost:3000', 340, termY + 124);
    ctx.fillStyle = '#8b949e';
    ctx.fillText('✓ 24 tests passed', 340, termY + 166);

    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, h - 36, w, 36);
    ctx.fillStyle = '#2f81f7';
    ctx.fillRect(0, h - 36, 150, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px "Inter", sans-serif';
    ctx.fillText('main', 22, h - 24);
    ctx.fillStyle = '#8b949e';
    ctx.fillText('TypeScript   UTF-8   Ln 16, Col 24', 190, h - 24);
  });
}

function phoneScreenTexture() {
  return canvasTexture(840, 1820, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#12141c');
    grad.addColorStop(1, '#08090d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 30px "Inter", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('9:41', 58, 62);
    ctx.textAlign = 'right';
    ctx.fillText('▮▮▮ ⏻', w - 58, 62);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#8890a4';
    ctx.font = '26px "Inter", sans-serif';
    ctx.fillText('Bonjour,', 58, 190);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 46px "Space Grotesk", sans-serif';
    ctx.fillText('Tableau de bord', 58, 250);

    const cardGrad = ctx.createLinearGradient(58, 320, 58, 620);
    cardGrad.addColorStop(0, '#7c3aed');
    cardGrad.addColorStop(1, '#4c1d95');
    ctx.fillStyle = cardGrad;
    roundRect(ctx, 58, 320, w - 116, 300, 40);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.72)';
    ctx.font = '25px "Inter", sans-serif';
    ctx.fillText('Revenus du mois', 100, 384);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 62px "Space Grotesk", sans-serif';
    ctx.fillText('24 860 €', 100, 462);
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    const bars = [46, 78, 58, 96, 70, 118, 88];
    bars.forEach((bh, i) => {
      roundRect(ctx, 100 + i * 44, 566 - bh, 26, bh, 13);
      ctx.fill();
    });

    const rows = [
      ['Déploiements', '18', '#06b6d4'],
      ['Temps de réponse', '124 ms', '#7ee787'],
      ['Utilisateurs actifs', '3 402', '#ec4899'],
      ['Tickets ouverts', '2', '#f0883e'],
    ];
    rows.forEach(([label, value, color], i) => {
      const y = 690 + i * 132;
      ctx.fillStyle = 'rgba(255,255,255,.05)';
      roundRect(ctx, 58, y, w - 116, 108, 30);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(112, y + 54, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#eef0f6';
      ctx.font = '500 28px "Inter", sans-serif';
      ctx.fillText(label, 154, y + 54);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#9aa1b4';
      ctx.fillText(value, w - 100, y + 54);
      ctx.textAlign = 'left';
    });

    ctx.fillStyle = 'rgba(255,255,255,.06)';
    roundRect(ctx, 58, h - 210, w - 116, 130, 44);
    ctx.fill();
    const icons = ['◧', '◈', '◆', '☰'];
    icons.forEach((ic, i) => {
      ctx.fillStyle = i === 0 ? '#06b6d4' : '#5c637a';
      ctx.font = '38px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ic, 58 + (w - 116) * ((i + 0.5) / 4), h - 145);
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    roundRect(ctx, w / 2 - 90, h - 46, 180, 9, 5);
    ctx.fill();
  });
}

function aluminium(color = 0x35373d, roughness = 0.34) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.72,
    roughness,
    envMapIntensity: 0.55,
    clearcoat: 0.2,
    clearcoatRoughness: 0.4,
  });
}

function glassOverlay() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.06,
    transparent: true,
    opacity: 0.09,
    envMapIntensity: 2.4,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
  });
}

export function createLaptop() {
  const group = new THREE.Group();

  const W = 3.1;
  const D = 2.14;
  const baseH = 0.078;

  const baseGeo = slab(W, D, baseH, 0.085, 0.007);
  baseGeo.rotateX(-Math.PI / 2);
  const base = new THREE.Mesh(baseGeo, aluminium(0x34363b, 0.33));
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const deckGeo = slab(W - 0.14, D - 0.12, 0.004, 0.06, 0.002);
  deckGeo.rotateX(-Math.PI / 2);
  const deck = new THREE.Mesh(deckGeo, aluminium(0x3a3c42, 0.4));
  deck.position.y = baseH / 2 + 0.001;
  deck.receiveShadow = true;
  group.add(deck);

  const keyWell = new THREE.Mesh(
    slab(2.46, 0.92, 0.012, 0.03, 0.004),
    new THREE.MeshPhysicalMaterial({ color: 0x0b0c0f, metalness: 0.5, roughness: 0.75 })
  );
  keyWell.geometry.rotateX(-Math.PI / 2);
  keyWell.position.set(0, baseH / 2 + 0.004, -0.42);
  keyWell.receiveShadow = true;
  group.add(keyWell);

  const keyMat = new THREE.MeshPhysicalMaterial({ color: 0x17181c, metalness: 0.35, roughness: 0.62 });
  const keyGeo = slab(0.145, 0.145, 0.016, 0.022, 0.003);
  keyGeo.rotateX(-Math.PI / 2);

  const rows = [
    { count: 13, y: -0.79, size: 0.145, height: 0.09 },
    { count: 14, y: -0.61, size: 0.145 },
    { count: 14, y: -0.44, size: 0.145 },
    { count: 14, y: -0.27, size: 0.145 },
    { count: 13, y: -0.1, size: 0.145 },
  ];
  const keys = [];
  rows.forEach((row) => {
    const gap = 0.022;
    const total = row.count * row.size + (row.count - 1) * gap;
    for (let i = 0; i < row.count; i++) {
      const x = -total / 2 + row.size / 2 + i * (row.size + gap);
      keys.push({ x, z: row.y, sy: row.height ? 0.6 : 1 });
    }
  });

  const keyMesh = new THREE.InstancedMesh(keyGeo, keyMat, keys.length);
  const dummy = new THREE.Object3D();
  keys.forEach((k, i) => {
    dummy.position.set(k.x, baseH / 2 + 0.011, k.z);
    dummy.scale.set(1, 1, k.sy);
    dummy.updateMatrix();
    keyMesh.setMatrixAt(i, dummy.matrix);
  });
  keyMesh.instanceMatrix.needsUpdate = true;
  keyMesh.castShadow = true;
  group.add(keyMesh);

  const spaceGeo = slab(0.86, 0.145, 0.016, 0.022, 0.003);
  spaceGeo.rotateX(-Math.PI / 2);
  const space = new THREE.Mesh(spaceGeo, keyMat);
  space.position.set(0, baseH / 2 + 0.011, 0.07);
  group.add(space);

  [-0.72, 0.72].forEach((x) => {
    const modGeo = slab(0.42, 0.145, 0.016, 0.022, 0.003);
    modGeo.rotateX(-Math.PI / 2);
    const mod = new THREE.Mesh(modGeo, keyMat);
    mod.position.set(x, baseH / 2 + 0.011, 0.07);
    group.add(mod);
  });

  const trackBorder = new THREE.Mesh(
    slab(1.28, 0.88, 0.006, 0.05, 0.002),
    new THREE.MeshPhysicalMaterial({ color: 0x63666b, metalness: 1, roughness: 0.5 })
  );
  trackBorder.geometry.rotateX(-Math.PI / 2);
  trackBorder.position.set(0, baseH / 2 + 0.002, 0.6);
  group.add(trackBorder);

  const trackpad = new THREE.Mesh(
    slab(1.24, 0.84, 0.006, 0.048, 0.002),
    new THREE.MeshPhysicalMaterial({ color: 0x9ea1a7, metalness: 0.9, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 })
  );
  trackpad.geometry.rotateX(-Math.PI / 2);
  trackpad.position.set(0, baseH / 2 + 0.005, 0.6);
  group.add(trackpad);

  const footGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.008, 20);
  const footMat = new THREE.MeshPhysicalMaterial({ color: 0x101114, metalness: 0.1, roughness: 0.9 });
  [[-1.32, -0.86], [1.32, -0.86], [-1.32, 0.86], [1.32, 0.86]].forEach(([x, z]) => {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.set(x, -baseH / 2 - 0.003, z);
    group.add(foot);
  });

  const hingeMat = aluminium(0x35373c, 0.45);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 2.5, 24), hingeMat);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, baseH / 2 - 0.01, -D / 2 + 0.05);
  group.add(hinge);

  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, baseH / 2 - 0.01, -D / 2 + 0.05);
  group.add(lidPivot);

  const lidH = 2.02;
  const lidGeo = slab(W, lidH, 0.031, 0.085, 0.006);
  const lid = new THREE.Mesh(lidGeo, aluminium(0x33353a, 0.3));
  lid.position.set(0, lidH / 2, -0.02);
  lid.castShadow = true;
  lidPivot.add(lid);

  const bezel = new THREE.Mesh(
    slab(W - 0.05, lidH - 0.05, 0.006, 0.075, 0.002),
    new THREE.MeshPhysicalMaterial({ color: 0x08090b, metalness: 0.2, roughness: 0.55 })
  );
  bezel.position.set(0, lidH / 2, 0.0015);
  lidPivot.add(bezel);

  const screenGeo = planarUV(new THREE.PlaneGeometry(W - 0.2, lidH - 0.22));
  const screen = new THREE.Mesh(
    screenGeo,
    new THREE.MeshBasicMaterial({ map: laptopScreenTexture(), toneMapped: false })
  );
  screen.position.set(0, lidH / 2 + 0.015, 0.0055);
  lidPivot.add(screen);

  const screenGlass = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.06, lidH - 0.06), glassOverlay());
  screenGlass.position.set(0, lidH / 2, 0.0072);
  lidPivot.add(screenGlass);

  const notch = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.055),
    new THREE.MeshBasicMaterial({ color: 0x050506 })
  );
  notch.position.set(0, lidH - 0.075, 0.0065);
  lidPivot.add(notch);

  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.34),
    new THREE.MeshBasicMaterial({
      map: canvasTexture(256, 256, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#d7d9de';
        ctx.font = '700 120px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('JP', w / 2, h / 2);
      }),
      transparent: true,
      opacity: 0.55,
    })
  );
  badge.position.set(0, lidH / 2, -0.038);
  badge.rotation.y = Math.PI;
  lidPivot.add(badge);

  group.userData.lid = lidPivot;
  return group;
}

export function createPhone() {
  const group = new THREE.Group();

  const W = 0.86;
  const H = 1.76;

  const bodyGeo = slab(W, H, 0.11, 0.16, 0.018);
  const body = new THREE.Mesh(bodyGeo, aluminium(0x3c3f45, 0.3));
  body.castShadow = true;
  group.add(body);

  const rim = new THREE.Mesh(
    slab(W - 0.02, H - 0.02, 0.104, 0.152, 0.01),
    new THREE.MeshPhysicalMaterial({ color: 0x0a0b0d, metalness: 0.6, roughness: 0.5 })
  );
  group.add(rim);

  const screenGeo = planarUV(new THREE.ShapeGeometry(roundedShape(W - 0.075, H - 0.075, 0.125), 24));
  const screen = new THREE.Mesh(
    screenGeo,
    new THREE.MeshBasicMaterial({ map: phoneScreenTexture(), toneMapped: false })
  );
  screen.position.z = 0.0565;
  group.add(screen);

  const glass = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedShape(W - 0.05, H - 0.05, 0.14), 24),
    glassOverlay()
  );
  glass.position.z = 0.0585;
  group.add(glass);

  const island = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedShape(0.26, 0.075, 0.0375), 16),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  island.position.set(0, H / 2 - 0.135, 0.0575);
  group.add(island);

  const camPlate = new THREE.Mesh(
    slab(0.36, 0.36, 0.03, 0.1, 0.008),
    aluminium(0x35383e, 0.28)
  );
  camPlate.position.set(-W / 2 + 0.26, H / 2 - 0.26, -0.062);
  group.add(camPlate);

  const lensRing = new THREE.MeshPhysicalMaterial({ color: 0x55585e, metalness: 1, roughness: 0.25 });
  const lensGlass = new THREE.MeshPhysicalMaterial({
    color: 0x05070c,
    metalness: 0.4,
    roughness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 2.5,
  });
  [[-0.075, 0.075], [0.075, 0.075], [0, -0.08]].forEach(([lx, ly]) => {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.022, 28), lensRing);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(camPlate.position.x + lx, camPlate.position.y + ly, -0.084);
    group.add(ring);

    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.024, 28), lensGlass);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(camPlate.position.x + lx, camPlate.position.y + ly, -0.088);
    group.add(lens);
  });

  const btnMat = aluminium(0x3c3f45, 0.32);
  [[0.28, 0.2], [0.08, 0.12], [-0.1, 0.12]].forEach(([y, len], i) => {
    const btn = new THREE.Mesh(new THREE.BoxGeometry(0.016, len, 0.05), btnMat);
    btn.position.set(i === 0 ? W / 2 + 0.004 : -W / 2 - 0.004, y, 0);
    group.add(btn);
  });

  return group;
}
