# AGENTS.md — CINE ANIMATIONS

Guía de trabajo para cualquier agente (o humano) que continúe tareas en este
proyecto. Léelo completo antes de tocar código.

## Qué es

SPA premium interactiva de cine construida con **React (Vite 6) + React Three
Fiber + GSAP ScrollTrigger + Tailwind CSS + Zustand + framer-motion +
lucide-react + json-server**. Consume la API de **TMDB** (Bearer token) con
locale `es-ES`. Persistencia de favoritos en `json-server` (puerto 3001).

Referencias de diseño a emular (estética awwwards):
`eszterbial.com`, `landonorris.com`, `cosmos.so`, `koncep.to`,
`freefrontend.com/css-animations`.

## Stack / dependencias claves

Ver `package.json` para la lista exacta. Resumen:

- React 18, Vite 6 (`@vitejs/plugin-react`), Vite dev server en **5173**
- `three`/`@react-three/fiber`/`@react-three/drei` — escenas WebGL
- `gsap` + `ScrollTrigger` — animaciones scroll-driven
- `framer-motion` — microinteracciones/modales
- `zustand` — estado global (`src/store/useStore.js`)
- `tailwindcss` 3.4 con tokens de color y fuentes (`tailwind.config.js`)
- `json-server` 0.17 — API falsa de favoritos en **3001**
- `@playwright/test` 1.62 — E2E (browsers NO instalados aún)
- `gitmoji-cli` — commits convencionales con emoji

## Comandos esenciales (desde la raíz)

| Comando | Uso |
| --- | --- |
| `npm run dev` | Levanta Vite (5173) + json-server (3001) juntos |
| `npm run dev:vite` | Solo Vite |
| `npm run dev:api` | Solo json-server |
| `npm run build` | Build de producción — **debe pasar antes de terminar** |
| `npm run lint` | ESLint flat-config sobre `src` — **0 errores requerido** (warnings permitidos) |
| `npm run commit` | `gitmoji -c` para commits convencionales con emoji |
| `npm run test:e2e` | Playwright (requiere `npm run pw:install` primero) |
| `npm run pw:install` | Instala los browsers de Playwright |

**Verificación obligatoria al finalizar cualquier tarea:** `npm run lint`
(0 errores) y `npm run build` (pasa). Si ambos pasan, la tarea está completa.

## Arquitectura de carpetas (`src/`)

```
src/
  App.jsx                 # Shell de la app; orden de secciones home
  main.jsx                # Entry: importa index.css + styles/globals.css
  api/tmdb.js             # Wrapper TMDB (Bearer auth, es-ES, helpers imagen)
  store/useStore.js       # Zustand: secciones, favoritos, auth, modales
  hooks/                  # useMouse, useMovies, useSectionReveal
  lib/animations.js       # Primitivas GSAP: splitWords, scrambleText, counters, reveal
  utils/lerp.js           # Lerp para suavizado
  styles/globals.css      # Tema cinema + utilidades (noise, spotlight, aurora, etc.)
components/
  animations/index.jsx    # Reutilizables: Marquee, TextScramble, AnimatedCounter, Magnetic
  HeroSection.jsx         # Hero 500vh GSAP pinnado, 5 fases
  Preloader.jsx           # Loader cinemático GSAP con contador/wipe
  GlobalBackdrop.jsx      # Video de fondo fijo (trailer TMDB, muted/loop)
  CinematicBackdrop.jsx   # Video de fondo por película (usado en Synopsis)
  Embers.jsx              # Partículas (ember) CSS-driven
  ScrollProgress.jsx      # Barra de progreso scroll en top
  SectionReveal.jsx       # Wrapper de reveal por sección (hook useSectionReveal)
  SynopsisSection.jsx     # Banner rotatorio con video + TextScramble + AnimatedCounter
  TrendingSection.jsx     # Carrusel horizontal
  CastSection.jsx         # Grid de elenco
  VideoGallery.jsx        # "NOW PLAYING"
  MovieFrames.jsx         # Filas de frames (revertido a CSS original; NO romper)
  MovieCard3D.jsx         # Cartel 3D WebGL
  MovieDetail.jsx         # Detalle + PLAY abre trailer
  TrailerModal.jsx        # Modal de trailer
  AuthModal.jsx           # Login/registro (Scramble en título)
  Navigation.jsx, Footer.jsx, CustomCursor.jsx, FavoritesGrid.jsx
```

## Temas y tokens de diseño

- Acento `#c41230` (clase `cinema-accent`), dorado `#c9a84c` (`cinema-gold`),
  gris-azul `#8b9bb4` (`cinema-gray`), fondo `#0a0a0a` (`cinema-black`)
- Tipografías: display "Bebas Neue" (`font-display`), Inter, JetBrains Mono
- IDs de sección (store): `home`, `catalog`, `cast`, `collection`

## Env / secretos

- `.env` está gitignoreado; `.env.example` está commiteado. Usa
  `VITE_TMDB_TOKEN`, `VITE_TMDB_API_KEY`, `VITE_JSON_SERVER_URL`.
- **Nunca commitees tokens ni claves.** No loguees valores de `import.meta.env`.

## Reglas de estilo de código

- NO agregar comentarios salvo que el usuario lo pida.
- Seguir las convenciones existentes (componentes en `src/components/`, hooks
  en `src/hooks/`, primitivas GSAP reutilizables en `src/components/animations/`).
- Para nuevo efecto reutilizable: exponerlo desde `src/components/animations/`
  y la lógica de bajo nivel en `src/lib/animations.js`.
- Respetar los elementos revertidos (Hero timeline, MovieFrames, App section
  flow) — el usuario pidió "dejalo como estaba antes" para eso; NO re-romperlos
  introduciendo fondos fijos que tapen secciones.

## Git

- Repo git local (rama master). Requiere commits **convencionales + emoji**:
  usa `npm run commit` (gitmoji-cli).
- Hacer commit SOLO cuando el usuario lo pida explícitamente.
- Antes de commit: revisa `git status`, `git diff`, `git log --oneline -10`.

## Delegar trabajo a otro agente

1. Define una tarea específica y acotada (una sola unidad de trabajo).
2. Ejecuta `npm run lint` y `npm run build` antes y después.
3. Comunica el estado al usuario con archivo:línea cuando refieras código.
4. Si tocas fidedeps/estado, verifica que `store/useStore.js` siga coherente.
