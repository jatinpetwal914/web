Netlify deployment (SPA)

If you deploy the frontend as a Single Page Application (SPA) on Netlify, follow these recommendations:

- Netlify build command: `npm run build` (used for Vite or similar tool that outputs to `dist`).
- Netlify publish directory: `dist` (default for Vite builds).
- SPA redirect: create a `_redirects` file with the single line:

  /* /index.html 200

  Place that file in your `frontend/public/` directory (Vite copies `public/` to `dist/` during build).

- If you publish the static `frontend` folder directly (no build), you can place `_redirects` in `frontend/` instead.

- Ensure `index.html` and your `css/` and `js/` paths are relative (e.g. `css/style.css`, `js/main.js`) so assets load correctly once deployed.

Files added in this repository to help Netlify:

- `netlify.toml` (root) — sets `command = "npm run build"` and `publish = "dist"`.
- `frontend/public/_redirects` — SPA redirect rule copied into build output by Vite.
- `frontend/_redirects` — fallback if you publish the `frontend` folder directly.
