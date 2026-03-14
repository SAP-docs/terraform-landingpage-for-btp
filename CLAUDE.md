# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Docusaurus 3 static site — the central landing page for Terraform/OpenTofu on SAP BTP. It is deployed to GitHub Pages at `https://sap-docs.github.io/terraform-landingpage-for-btp/`.

## Commands

All commands must be run from the `content/` subdirectory (not the repo root).

```bash
cd content

npm install          # Install dependencies
npm run start        # Dev server with hot reload (localhost:3000)
npm run build        # Production build (outputs to content/build/)
npm run serve        # Serve the production build locally
npm run typecheck    # TypeScript type checking
npm run clear        # Clear Docusaurus cache (use when build behaves unexpectedly)
```

There are no test commands — this project has no automated test suite.

## Architecture

The repo root is mostly metadata (LICENSE, REUSE.toml, README.md). All application code lives under `content/`.

**`content/docusaurus.config.ts`** — Primary configuration: site metadata, navbar, footer, plugins, theme settings, and the `baseUrl` (`/terraform-landingpage-for-btp/`).

**`content/src/`** — React/TypeScript source:
- `pages/index.tsx` — The homepage; assembles section components
- `sections/` — Page sections (`HeroSection`, `Intro`, `Whats`) rendered on the homepage
- `components/HomepageFeatures/` — Feature cards component
- `theme/` — Swizzled Docusaurus theme components (`ColorModeToggle`, `SearchBar`)
- `plugins/init-ui5-theme/` — Custom Docusaurus plugin that initializes the SAP UI5 theme on page load
- `css/custom.css` — Global CSS variables and theme overrides (Infima + SAP 72Brand font)

**`content/docs/landing-page-content/`** — Markdown/MDX documentation pages (BTP Exporter, Terraform providers, samples, webinars, etc.). These are rendered under the `/docs` path.

**`content/static/img/`** — Static image assets (logos, favicons).

## Key Dependencies

- **Docusaurus 3** (`3.9.2`) with React 19
- **SAP UI5 Web Components** (`@ui5/webcomponents-react`, `@ui5/webcomponents-fiori`, `@ui5/webcomponents-icons`) for SAP-branded UI elements
- **@easyops-cn/docusaurus-search-local** for offline full-text search
- Node.js >=18 required

## Deployment

Deployment is automated via GitHub Actions:
- **`.github/workflows/deploy-to-gh-pages.yml`** — Triggers on push to the `pre-version` branch; builds and deploys to GitHub Pages.
- **`.github/workflows/periodic-link-watcher.yml`** — Runs lychee link checking periodically; broken links are reported against `.lycheeignore`.

## Licensing

The project uses REUSE/SPDX compliance. License metadata is in `REUSE.toml` (CC-BY-4.0). When adding new files, ensure they have an appropriate SPDX header or are listed in `REUSE.toml`.
