# Orbita — komponentas svetainės viršui

Gyva 3D orbita: centre storos terakotos raidės, aplink tris švytinčius žiedus lėtai sukasi žodžiai.
Sukurta 2026-09-22. Veikimo pavyzdys — `projects\svetaine\pavyzdys.html`.

## Kas aplanke

| Failas | Kam |
|---|---|
| `orbita.js` | Pats komponentas `<elyte-orbita>`. |
| `gelasio-bold.typeface.json` | Šriftas 3D raidėms, su visomis lietuviškomis raidėmis. |
| `gelasio-OFL.txt` | Šrifto licencija (SIL OFL 1.1) — laikyti šalia šrifto, taip reikalauja licencija. |

## Kaip įdėti į puslapį — trys eilutės

1. Į `<head>`:

```html
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
} }
</script>
```

2. Ten, kur turi būti orbita (dažniausiai pirma `<body>` eilutė):

```html
<elyte-orbita zodis="SVEIKATA YRA TURTAS"
              zodziai="MITYBA,JOGA,KVĖPAVIMAS,RAMYBĖ,MIEGAS"></elyte-orbita>
```

3. Prieš `</body>`:

```html
<script type="module" src="komponentai/orbita/orbita.js"></script>
```

## Ką galima keisti

| Nustatymas | Numatyta | Pastaba |
|---|---|---|
| `zodis` | SVEIKATA YRA TURTAS | Kiekvienas žodis — atskira eilutė centre. |
| `zodziai` | MITYBA,JOGA,KVĖPAVIMAS,RAMYBĖ,MIEGAS | Iki 5, per kablelį. Ilgiausias gali būti ~11 raidžių. |
| `aukstis` | 100vh (visas ekranas) | Pvz. `aukstis="70vh"` arba `"600px"`. |
| `periodas` | 24 | Kiek sekundžių trunka vienas apsisukimas. |
| `fonas`, `raides`, `zodziu-spalva`, `ziedai` | iš `context\stilius.md` | Bet kuri CSS spalva, pvz. `fonas="#2F5C43"`. |
| `sriftas` | gelasio-bold.typeface.json | Kitas šriftas — konvertuoti su `projects\3d-vizualai\sriftas-i-threejs.py`. |

## Ką komponentas daro pats

- **Prisitaiko prie ekrano** — visa orbita telpa ir plačiame kompiuterio, ir siaurame telefono ekrane
  (patikrinta 1440×900 ir 390×844).
- **Sustoja, kai jos nesimato** (nuslinkus žemyn) — kad be reikalo nekaitintų telefono.
- **Nejuda, jei žmogus telefone nustatė „mažiau judesio“** — rodo sustingusį kadrą.
- **Jei 3D neveikia** (sena naršyklė), vietoje orbitos lieka paprastas tekstas.
- Ekrano skaitytuvams perskaito užrašą ir žodžius (neregintiems).

## Svarbu

- **Šriftas — Gelasio, ne Georgia.** Georgia priklauso Microsoft ir viešoje svetainėje jo kontūrų
  platinti negalima. Gelasio sukurtas kaip Georgia pakaitalas tų pačių matmenų, licencija leidžia
  naudoti viešai ir komerciškai.
- **Iš kompiuterio failo tiesiog atidarius neveiks** — naršyklė neleidžia įkelti šrifto iš `file://`.
  Peržiūrai paleisti vietinį serverį aplanke `projects\svetaine\`:
  `python -m http.server 8765` ir atidaryti `http://127.0.0.1:8765/pavyzdys.html`.
  Tikroje svetainėje tai nereikalinga.
- Three.js imamas iš CDN (jsdelivr, 0.170.0) — be interneto neveiks.
- **Ta pati orbita nuotraukoms ir video** — `projects\3d-vizualai\orbita-sablonas.html`. Keičiant žiedų
  dydžius ar pasvirimus — keisti abiejose vietose.
