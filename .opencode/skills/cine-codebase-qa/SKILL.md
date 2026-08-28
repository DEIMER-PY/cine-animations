---
name: cine-codebase-qa
description: >
  Use when continuing, delegating, reviewing or starting any task in the CINE
  ANIMATIONS project (React/Vite/TMDB/GSAP). Covers repo conventions, concrete
  verification commands (lint + build), quick reference to the animation
  primitives, TMDB wrapper, Zustand store, and design tokens so another agent
  can pick up work without re-exploring the codebase. Triggers on terms like
  "CINE", "cine", "TMDB", "delegar", "film SPA", or any task inside this repo.
---

# CINE ANIMATIONS — Codebase & QA Reference

Project-level skill. Read this to orient any agent quickly, and follow the
verification gate before calling a task "done".

## 1. Verification gate (ALWAYS, at the end)

Every task finishes only when BOTH pass, from the repo root:

- `npm run lint` → **0 errors** (warnings are OK)
- `npm run build` → succeeds (`vite build`)

If either fails, fix it before reporting completion. Reference any changed
code with `path/to/file:line`.

## 2. Repo / stack snapshot

- React 18 + Vite 6; Vite dev on **5173**, json-server favorites API on **3001**
  (`npm run dev` starts both via concurrently).
- WebGL: `three` + `@react-three/fiber` + `@react-three/drei`
- Animation: `gsap` + `ScrollTrigger`; micro-interactions with `framer-motion`
- State: `zustand` (`src/store/useStore.js`)
- Styling: `tailwindcss` 3.4; theme tokens in `tailwind.config.js` + `src/styles/globals.css`
- Movies: TMDB API via `src/api/tmdb.js` (Bearer `VITE_TMDB_TOKEN`, locale `es-ES`)
- E2E: Playwright (browsers NOT installed yet — run `npm run pw:install` first)

## 3. Where things live

```
src/
  App.jsx              # Shell; home section order
  api/tmdb.js          # TMDB wrapper + helpers de imagen (poster/backdrop)
  store/useStore.js    # Zustand: sections, favorites, auth, trailer modal
  lib/animations.js    # GSAP primitives: splitWords, scrambleText, animateCounter, revealElements
  hooks/useSectionReveal.js   # GSAP clip-path section reveal
  utils/lerp.js        # Suavizado
  styles/globals.css   # noise, scan-line, vignette, aurora, spotlight, embers, scroll-rail
components/
  animations/index.jsx # Reutilizables: Marquee, TextScramble, AnimatedCounter, Magnetic
  HeroSection.jsx      # Hero 500vh GSAP pinnado, 5 fases (REVERTED — no re-romper)
  Preloader.jsx        # Loader cinemático GSAP (contador + wipe)
  GlobalBackdrop.jsx   # Video de fondo fijo (tmdb trailer, muted/loop, z-0)
  CinematicBackdrop.jsx# Video de fondo por película (para Synopsis)
  Embers.jsx, ScrollProgress.jsx, SectionReveal.jsx
  SynopsisSection.jsx  # Banner rotatorio + Video + TextScramble + AnimatedCounter
  TrendingSection.jsx, CastSection.jsx, VideoGallery.jsx
  MovieFrames.jsx      # REVERTED a CSS original — no tocar su mecanismo
  MovieCard3D.jsx, MovieDetail.jsx, TrailerModal.jsx
  AuthModal.jsx, Navigation.jsx, Footer.jsx, CustomCursor.jsx, FavoritesGrid.jsx
```

## 4. Design tokens

- `cinema-accent` `#c41230` (rojo), `cinema-gold` `#c9a84c`, `cinema-gray`
  `#8b9bb4`, `cinema-black` `#0a0a0a`
- Display font: `font-display` (Bebas Neue); mono: JetBrains Mono (`font-mono`)
- Section store ids: `home`, `catalog`, `cast`, `collection`

## 5. Adding a reusable effect

- Low-level GSAP logic → `src/lib/animations.js`
- React component wrapper → `src/components/animations/` (re-exported from `index.jsx`)
- Wire it into sections by importing from `./animations` (e.g. `<TextScramble text={...}/>`)

## 6. Pitfalls (things that broke before)

- **Do not** add fixed background layers that cover sections; the user reverted
  the top-layer attempt ("dejalo como estaba antes"). If you add a backdrop, keep
  it `pointer-events-none`, `z-0`, and let content ride at `z-10` only where safe.
- **HeroSection timeline** and **MovieFrames** and **App section flow** are
  delicate/reverted code — preserve them, don't rewrite.
- Favorites persist to json-server; keep `useStore` favorites coherent if you
  touch state.
- Never commit `.env` or log `import.meta.env` values.

## 7. Commits (only when explicitly requested)

Use `npm run commit` (gitmoji -c) for conventional+emoji messages. Before
committing: `git status`, `git diff`, `git log --oneline -10`; stage only what
you intend.

## 8. Onboarding another agent

For any delegated unit of work:
1. Give ONE specific, bounded task.
2. State expected verification (`npm run lint` + `npm run build`).
3. Tell them to read `AGENTS.md` + this skill first.
4. Ask them to report changed files with `file:line`.
