# Verificación de la experiencia

[← README](../README.md) · [Arquitectura](ARCHITECTURE.md)

## Entorno y resultados

Ejecución local del 30 de agosto de 2026 con Node.js 24.18, Windows y servidor Vite en 5173. Resultados obtenidos ejecutando los comandos, no inferidos del build.

| Comprobación | Resultado |
|---|---|
| `npm run lint` | Correcto, sin errores ni advertencias |
| `npm test` | 14 pruebas, 4 archivos, correctas |
| Regresión nueva scroll/cursor | 9/9 correctas, tres dispositivos |
| Suite Playwright completa | **63/63 correctas**, 5,6 minutos, tres dispositivos |
| `npm run build` | Correcto; 2330 módulos, bundle principal 189,02 kB (62,80 kB gzip) |

## Matriz de cobertura

| Área | Verificación automatizada | Límites |
|---|---|---|
| Scroll y cursor | Rueda sobre resumen desplaza documento; no cursor artificial; CTAs accesibles; viewport 1024×580 | No medición de ergonomía con usuarios reales |
| Responsive | Chromium desktop, tablet 820×1180, Pixel 7, movimiento reducido y teclado | Firefox/WebKit configurados pero no ejecutados en esta iteración |
| Descubrimiento | Navegación, búsqueda, géneros únicos, titulares, series, personas y watchlist anónima | Catálogo estable interceptado por Playwright |
| Motion | Spotlight por clic/teclado, scroll libre, marquee avanza durante hover | No se certifican 60 FPS |
| Trailers | Portal antes del iframe, foco/Escape, reproductor único, ocho segundos efectivos, pausa, autoplay bloqueado, ausente o restringido | Adaptador YouTube simulado; no SLA de vídeos externos |
| Compra | Asientos, escaleras decorativas, ticket previo, confirmación y entrada en cuenta | Identidad y persistencia demo, sin pagos reales |
| Unidad | Precios, estados, temporizador, límite, normalización, prioridad de trailers, colección aislada | No prueba concurrente contra Postgres remoto |

## Reproducir

```bash
npm run lint
npm test
npm run build
npx playwright test --project=chromium --project=tablet --project=mobile-chrome --workers=1 --reporter=line
```

Solo la regresión nueva:

```bash
npx playwright test tests/scroll-navigation.spec.js --project=chromium --project=tablet --project=mobile-chrome --workers=1
```

Playwright inicia Vite si no está activo. Si 5173 pertenece a otro proyecto, detén únicamente ese servidor con permiso o arranca CINE ANIMATIONS en un puerto libre y ajusta `baseURL`/`webServer`. No se debe reutilizar accidentalmente el servidor ajeno.

## Capturas para el repositorio

```bash
npm run dev:vite
# En otra terminal:
node scripts/capture-readme.mjs
```

`CAPTURE_URL` permite cambiar el origen. El script usa contextos aislados, espera contenido e imágenes con un límite temporal, respeta movimiento reducido y cierra el navegador. El catálogo procede de las APIs configuradas; las imágenes cambian cuando cambia la cartelera. Las pantallas de checkout y ticket bloquean REST/Auth de Supabase y usan datos demo locales. No modifican reservas ni cuentas remotas.

El [manifiesto](images/capture-manifest.json) registra archivos, rutas, viewports y fecha. `screening-trailer.png` procede de la comprobación anterior del reproductor real; no se regenera ni se presenta como prueba nueva de reproducción. Las capturas son evidencia visual, no golden snapshots con comparación de píxeles.

## Pendiente antes de producción

- Desplegar y verificar proxy TMDB y migración de series en el entorno remoto.
- Probar RLS y concurrencia de dos usuarios sobre un asiento real de prueba en Postgres.
- Verificar correos de registro/recuperación y expiración de sesión con cuentas de prueba.
- Ejecutar Firefox/WebKit y una auditoría formal de accesibilidad/rendimiento si son criterios de entrega.

No se da por certificado el cumplimiento remoto de RF-15 usando los locks del modo demo. No se descargan trailers de YouTube ni se consumen créditos de generación.
