# Ziad Badea — Portfolio

[Open the live portfolio](https://zoz0011.github.io/ziad-badea-portfolio/)

A responsive English/Arabic portfolio presenting four web and mobile projects. The site uses a dark background with cyan and pink accents, a centered introduction, a single-column project list, and individual project pages.

Built with plain HTML, CSS, and JavaScript. No package installation or framework build is required for the portfolio.

## Features

- English/Arabic language switching with Arabic RTL layout.
- Four project detail pages with technology lists and available live-project links.
- Project filters for web and mobile applications.
- Four independent, interactive browser demos using illustrative local records.
- Responsive navigation, skills, about, and contact sections.
- Direct contact links and a form that opens a WhatsApp draft for the visitor to review and send.

The portfolio is published on [GitHub Pages](https://zoz0011.github.io/ziad-badea-portfolio/). The project applications are maintained in private repositories; this public showcase provides descriptions, images, live links, and separate browser demos.

## Run locally

Use a current Node.js installation. From the repository root:

```sh
node preview.mjs
```

Open [http://127.0.0.1:5187/](http://127.0.0.1:5187/).

The preview server serves `dist/`. Opening `dist/index.html` directly with a `file://` URL is insufficient because the app loads its link manifest and uses routes relative to the website root.

After changing the shared HTML shell, regenerate the project-page shells:

```sh
node generate-pages.mjs
```

Run the repository's structural and interaction checks:

```sh
npm run check
```

## Projects and demos

| Project | Original implementation | Existing hosted project | Portfolio browser demo |
| --- | --- | --- | --- |
| PharmaCore | React/Node.js pharmacy application with Prisma and SQLite. | [Open PharmaCore](https://pharmacy-system-ac68e.web.app/) | Arabic POS, medicine search, stock/unit conversion, checkout, and local sale history. |
| Safi Debt Ledger | Arabic JavaScript web application and Capacitor Android app with Supabase. | [Open Safi](https://safi-ledger-eg.pauper-93phylumbunni.chatgpt.site/) | Sample accounts, debt/payment entry, balances, search, and statement CSV export. |
| Prescripto | React/Node.js appointment platform with MongoDB. | [Open Prescripto](https://prescripto-frontend-50eh.onrender.com/) | Specialty browsing, doctor images, illustrative slots, local booking, and cancellation. |
| DiaCare Mom | Arabic Flutter/Dart prototype with encrypted on-device storage. | No web deployment is included. | HTML preview for local health logs, written insulin references, reported events, and care-plan text. |

Project detail routes are `/projects/pharmacore/`, `/projects/safi/`, `/projects/prescripto/`, and `/projects/diacare/`. Browser demos are available under the matching `/demos/<project>/` routes.

The browser demos are separate showcase implementations. They do not connect to production APIs, create real appointments, modify original accounts, or bypass sign-in and licensing. Their data is stored in the browser's local storage and can be reset from the demo interface. The DiaCare browser preview does not reproduce Flutter's encrypted storage, native notifications, or OCR, and does not calculate medication doses.

Demo interactions can run on the local preview server without a production backend. External live websites, contact actions, and hosted fonts require network access; font fallbacks are provided.

## Repository structure

```text
dist/
  index.html             Main portfolio shell
  app.js                 Portfolio content and interactions
  styles.css             Bilingual responsive theme
  project-links.json     Available live-project destinations
  assets/                Portfolio graphics and project logos
  projects/              Four project detail-page shells
  demos/                 Four isolated browser demos
generate-pages.mjs       Regenerates project-page shells
preview.mjs              Local static preview server
validate.mjs             Structural and interaction checks
```

Edit project content in `dist/app.js`, styling in `dist/styles.css`, and destinations in `dist/project-links.json`. Demo HTML, CSS, scripts, and assets remain inside their individual demo folders.

For static hosting, publish `dist/` at the domain root so absolute asset and route paths resolve correctly. The portfolio contact form opens an encoded WhatsApp draft; it has no server submission or automatic messaging.

## GitHub Pages distribution

`docs/` contains the standalone distribution prepared for a GitHub Pages project site. Its project details use hash routes such as `#project/safi`, and browser-demo links remain relative to the repository's project base. `.nojekyll` preserves the static files.

GitHub Pages serves the `main` branch's **`/docs`** directory at the live portfolio URL above. Keep this public showcase separate from the private application repositories.

`dist/` is the editable multi-page source version; `docs/` is a separately prepared release distribution. Changes to `dist/` do not refresh the standalone `docs/index.html` automatically. Refresh that distribution before publishing updated content. The validation workflow checks both versions and performs no deployment.

## Author

**Ziad Badea** — Full-Stack Web & Flutter Developer with practical project experience in pharmacy, finance, appointments, and personal health logging.

[LinkedIn](https://www.linkedin.com/in/ziad-badea-6272a7301/)
