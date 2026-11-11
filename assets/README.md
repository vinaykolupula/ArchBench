# ArchBench Assets

Drop logos, icons, screenshots, and architecture diagrams into this folder (either directly at the root of `assets/` or inside the organized subfolders below).

```text
assets/
├── branding/      # Logos, wordmarks, social preview cards, favicons
├── diagrams/      # Architecture diagrams & explanatory graphics
└── screenshots/   # Studio UI, canvas, simulator, and CLI screenshots
```

---

## Using Assets in Project Documentation (Markdown)

From root documents (`README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`):

```markdown
![ArchBench Logo](./assets/branding/logo.png)
```

From nested guides inside `docs/`:

```markdown
![Topology Overview](../assets/screenshots/topology.png)
```

---

## Using Assets in the Web Frontend (`apps/web`)

Files placed in `assets/` are automatically exposed to **ArchBench Studio** in two ways:

1. **Direct Public URL (`/assets/...`)** — works immediately during `vite dev`, `archbench ui`, and production builds:

   ```tsx
   <img src="/assets/branding/logo.png" alt="ArchBench Logo" />
   ```

   Or in [`apps/web/index.html`](../apps/web/index.html) for your favicon/app icon:

   ```html
   <link rel="icon" type="image/png" href="/assets/branding/favicon.png" />
   ```

2. **Bundled TypeScript Import (`@assets/...`)** — asset-hashed and inlined/bundled by Vite:

   ```tsx
   import logoUrl from "@assets/branding/logo.png";

   <img src={logoUrl} alt="ArchBench Logo" />
   ```

