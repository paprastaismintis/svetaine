// <elyte-orbita> — 3D orbita svetainės viršui.
// Centre storos 3D raidės, aplink tris pasvirusius žiedus gyvai sukasi žodžiai.
//
// Naudojimas (pilnai — naudojimas.md):
//   <elyte-orbita zodis="SVEIKATA YRA TURTAS"
//                 zodziai="MITYBA,JOGA,KVĖPAVIMAS,RAMYBĖ,MIEGAS"></elyte-orbita>
//   <script type="module" src="komponentai/orbita/orbita.js"></script>
// Puslapio <head> reikia importmap su "three" (žr. naudojimas.md).
//
// Spalvos iš context/stilius.md. Šriftas Gelasio Bold (SIL OFL — galima naudoti viešai),
// Georgia pakaitalas tų pačių matmenų; su visomis lietuviškomis raidėmis.

import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const NUMATYTA = {
  zodis: "SVEIKATA YRA TURTAS",
  zodziai: "MITYBA,JOGA,KVĖPAVIMAS,RAMYBĖ,MIEGAS",
  fonas: "#2F5C43",    // Gili žalia
  raides: "#B7472A",   // Terakota
  zodziuSpalva: "#F5F3ED", // Grietinėlės
  ziedai: "#F9A620",   // Medetkų geltona — tik plonos linijos
  periodas: 24,        // sekundės vienam apsisukimui
};

const sriftai = new Map(); // tas pats šriftas kraunamas vieną kartą, kad ir kiek orbitų puslapyje
function krautiSrifta(url) {
  if (!sriftai.has(url)) {
    sriftai.set(url, fetch(url).then((r) => {
      if (!r.ok) throw new Error(`Nepavyko įkelti šrifto ${url}: ${r.status}`);
      return r.json();
    }).then((d) => new FontLoader().parse(d)));
  }
  return sriftai.get(url);
}

const ZIEDAI = [
  { r: 3.5, x: 1.05, z: 0.42, kryptis: 1, poslinkis: 0.3 },
  { r: 4.25, x: 2.35, z: 0.30, kryptis: -1, poslinkis: 2.0 },
  { r: 5.0, x: 1.28, z: -0.5, kryptis: 1, poslinkis: 4.1 },
];
const SKIRSTYMAS = [0, 1, 0, 1, 2]; // kuriame žiede kuris žodis: 2 + 2 + 1

class ElyteOrbita extends HTMLElement {
  static get observedAttributes() { return ["zodis", "zodziai", "periodas"]; }

  connectedCallback() {
    if (!this.style.display) this.style.display = "block";
    if (!this.style.height && !this.hasAttribute("aukstis")) this.style.height = "100vh";
    if (this.hasAttribute("aukstis")) this.style.height = this.getAttribute("aukstis");
    this.style.position = this.style.position || "relative";
    this.style.overflow = "hidden";
    this.setAttribute("role", "img");
    this.setAttribute("aria-label", this.#tekstas());
    this.#paleisti().catch((e) => {
      console.error("elyte-orbita:", e);
      this.textContent = this.#tekstas(); // jei 3D neveikia — lieka bent tekstas
    });
  }

  disconnectedCallback() { this.#sunaikinti(); }

  attributeChangedCallback() {
    if (this.#renderer) { this.#sunaikinti(); this.connectedCallback(); }
  }

  #renderer = null;
  #stebetojai = [];
  #kadras = 0;

  #tekstas() {
    const z = this.getAttribute("zodis") || NUMATYTA.zodis;
    const zz = this.getAttribute("zodziai") || NUMATYTA.zodziai;
    return `${z}: ${zz.split(",").join(", ")}`;
  }

  async #paleisti() {
    const sriftoUrl = new URL(this.getAttribute("sriftas") || "gelasio-bold.typeface.json", import.meta.url).href;
    const font = await krautiSrifta(sriftoUrl);
    if (!this.isConnected) return;

    const spalva = (a, n) => new THREE.Color(this.getAttribute(a) || n);
    const FONAS = spalva("fonas", NUMATYTA.fonas);
    const RAIDES = spalva("raides", NUMATYTA.raides);
    const SVIESA = spalva("zodziu-spalva", NUMATYTA.zodziuSpalva);
    const ZIEDAS = spalva("ziedai", NUMATYTA.ziedai);
    const periodas = Number(this.getAttribute("periodas") || NUMATYTA.periodas);
    const centras = (this.getAttribute("zodis") || NUMATYTA.zodis).split(" ");
    const zodziai = (this.getAttribute("zodziai") || NUMATYTA.zodziai).split(",").map((s) => s.trim()).slice(0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    this.#renderer = renderer;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.NoToneMapping;
    Object.assign(renderer.domElement.style, { display: "block", width: "100%", height: "100%" });
    this.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = FONAS;

    const tekstoGeometrija = (t, dydis, gylis, nuozulnus) => {
      const g = new TextGeometry(t, {
        font, size: dydis, depth: gylis, curveSegments: 12,
        bevelEnabled: true, bevelThickness: nuozulnus, bevelSize: nuozulnus * 0.5, bevelSegments: 6,
      });
      g.computeBoundingBox();
      const b = g.boundingBox;
      g.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, -(b.min.z + b.max.z) / 2);
      return g;
    };

    // Centrinis užrašas — kiekvienas žodis atskira eilute
    const raidziuMedziaga = new THREE.MeshPhysicalMaterial({
      color: RAIDES, roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.35,
    });
    centras.forEach((t, i) => {
      const m = new THREE.Mesh(tekstoGeometrija(t, 0.62, 0.36, 0.05), raidziuMedziaga);
      m.position.y = ((centras.length - 1) / 2 - i) * 0.8;
      scene.add(m);
    });

    // Minkštas švytėjimas centre
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g2 = c.getContext("2d");
    const gr = g2.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, "rgba(245,243,237,0.42)");
    gr.addColorStop(0.4, "rgba(245,243,237,0.15)");
    gr.addColorStop(1, "rgba(245,243,237,0)");
    g2.fillStyle = gr; g2.fillRect(0, 0, 256, 256);
    const svytejimas = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
    }));
    svytejimas.scale.set(7.5, 7.5, 1);
    scene.add(svytejimas);

    // Trys pasvirę žiedai — plona švytinti linija
    const ziedai = ZIEDAI.map((z) => {
      const g = new THREE.Group();
      g.rotation.set(z.x, 0, z.z);
      g.add(new THREE.Mesh(new THREE.TorusGeometry(z.r, 0.012, 8, 400), new THREE.MeshBasicMaterial({ color: ZIEDAS })));
      for (const [storis, sk] of [[0.04, 0.22], [0.09, 0.08]]) {
        g.add(new THREE.Mesh(new THREE.TorusGeometry(z.r, storis, 8, 400),
          new THREE.MeshBasicMaterial({ color: ZIEDAS, transparent: true, opacity: sk,
            blending: THREE.AdditiveBlending, depthWrite: false })));
      }
      scene.add(g);
      return g;
    });

    // Orbitos žodžiai
    const zodzioMedziaga = new THREE.MeshStandardMaterial({
      color: SVIESA, roughness: 0.5, emissive: SVIESA, emissiveIntensity: 0.18,
    });
    const vienameZiede = [0, 0, 0];
    zodziai.forEach((_, i) => vienameZiede[SKIRSTYMAS[i]]++);
    const kiek = [0, 0, 0];
    const planetos = zodziai.map((t, i) => {
      const z = SKIRSTYMAS[i];
      const m = new THREE.Mesh(tekstoGeometrija(t, 0.36, 0.08, 0.018), zodzioMedziaga);
      scene.add(m);
      return { m, z, pradzia: (kiek[z]++ / vienameZiede[z]) * Math.PI * 2 + ZIEDAI[z].poslinkis };
    });

    scene.add(new THREE.HemisphereLight(SVIESA, FONAS, 1.0));
    const sonine = new THREE.DirectionalLight(0xfff4e6, 2.4);
    sonine.position.set(-6, 5, 6);
    scene.add(sonine);
    const galine = new THREE.DirectionalLight(ZIEDAS, 0.8);
    galine.position.set(5, 3, -5);
    scene.add(galine);

    // Kamera šiek tiek iš viršaus; visa orbita telpa ir plačiame, ir siaurame ekrane
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    const kadruoti = () => {
      const w = this.clientWidth || 1, h = this.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const puse = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const plotis = (ZIEDAI[2].r * 2 + 2.6) / 0.97;
      const aukstis = (ZIEDAI[2].r * 2 * 0.72 + 1.2) / 0.9;
      const d = Math.max(plotis / (2 * puse * camera.aspect), aukstis / (2 * puse));
      const kampas = THREE.MathUtils.degToRad(20);
      camera.position.set(0, d * Math.sin(kampas), d * Math.cos(kampas));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      svytejimas.position.copy(camera.position).normalize().multiplyScalar(-1.5);
    };
    kadruoti();

    const v = new THREE.Vector3();
    const piesti = (faze) => {
      scene.updateMatrixWorld();
      for (const p of planetos) {
        const zd = ZIEDAI[p.z];
        const a = p.pradzia + zd.kryptis * faze * Math.PI * 2;
        v.set(zd.r * Math.cos(a), zd.r * Math.sin(a), 0).applyMatrix4(ziedai[p.z].matrixWorld);
        p.m.position.copy(v);
        p.m.quaternion.copy(camera.quaternion);
      }
      renderer.render(scene, camera);
    };

    // Animacija: sustoja, kai orbitos nesimato, ir negyva tiems, kas nustatė „mažiau judesio“
    const maziauJudesio = matchMedia("(prefers-reduced-motion: reduce)");
    let matoma = true, faze = 0.3, paskutinis = performance.now();
    const ciklas = (t) => {
      this.#kadras = requestAnimationFrame(ciklas);
      const dt = Math.min((t - paskutinis) / 1000, 0.1);
      paskutinis = t;
      if (!matoma || maziauJudesio.matches) return;
      faze = (faze + dt / periodas) % 1;
      piesti(faze);
    };
    piesti(faze);
    this.#kadras = requestAnimationFrame(ciklas);

    const ro = new ResizeObserver(() => { kadruoti(); piesti(faze); });
    ro.observe(this);
    const io = new IntersectionObserver(([e]) => { matoma = e.isIntersecting; });
    io.observe(this);
    this.#stebetojai = [ro, io];
    this.dataset.paruosta = "1";
    this.dispatchEvent(new CustomEvent("paruosta"));
  }

  #sunaikinti() {
    cancelAnimationFrame(this.#kadras);
    this.#stebetojai.forEach((s) => s.disconnect());
    this.#stebetojai = [];
    if (this.#renderer) {
      this.#renderer.dispose();
      this.#renderer.domElement.remove();
      this.#renderer = null;
    }
    delete this.dataset.paruosta;
  }
}

if (!customElements.get("elyte-orbita")) customElements.define("elyte-orbita", ElyteOrbita);
