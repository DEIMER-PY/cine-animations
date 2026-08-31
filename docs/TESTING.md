# Verificación de la experiencia

[← README](../README.md) · [Arquitectura](ARCHITECTURE.md)

## Entorno y resultados

Ejecución local del 31 de agosto de 2026 con Node.js 24.18, Windows y servidor Vite en 5173. Catálogo TMDB real disponible; Supabase no configurado. Resultados obtenidos ejecutando los comandos, no inferidos del build.

| Comprobación | Resultado |
|---|---|
| `npm run lint` | Correcto, sin errores ni advertencias |
| `npm test` | 15 pruebas, 5 archivos, correctas |
| Regresión nueva scroll/cursor | 9/9 correctas, tres dispositivos |
| Suite Playwright completa | **78/78 correctas**, 6,5 minutos, dos workers, tres dispositivos |
| `npm run build` | Correcto; 2330 módulos, sin imports rotos tras retirar el reproductor |
| Medios | 10/10 cabeceras WebP válidas, 1.195.088 bytes en total; cinco títulos en 960/1600 px y manifiesto ligado a ID/backdrop |
| Documentación | 111 referencias locales, 33 SVG válidos y 14 capturas comprobados con `node scripts/check-docs.mjs` |

## Matriz de cobertura

| Área | Verificación automatizada | Límites |
|---|---|---|
| Scroll y cursor | Rueda sobre resumen desplaza documento; no cursor artificial; CTAs accesibles; viewport 1024×580 | No medición de ergonomía con usuarios reales |
| Responsive | Chromium desktop, tablet 820×1180, Pixel 7, movimiento reducido y teclado | Firefox/WebKit configurados pero no ejecutados en esta iteración |
| Descubrimiento | Navegación, búsqueda, géneros únicos, titulares, series, personas y watchlist anónima | Catálogo estable interceptado por Playwright |
| Motion | Spotlight por clic/teclado, scroll libre, marquee avanza durante hover | No se certifican 60 FPS |
| Portada | Fotografía decodificada, selección manual, rotación a ocho segundos, pausa fuera de vista y movimiento reducido | Las pruebas usan imágenes controladas; capturas con catálogo real |
| Trailers | Portal, enlace del título confirmado, alternativa en la misma pestaña, foco/Escape, ausencia de iframe/SDK/Cosmos, búsqueda honesta sin candidato | Se verifica navegación al enlace real, no reproducción ni disponibilidad permanente en YouTube |
| Colecciones | Favoritos y listas de películas/series: agregar, persistir al recargar, abrir desde cuenta y quitar; rollback al fallar guardado | Almacenamiento local E2E; errores remotos controlados en unitarias |
| Acceso | Login, retorno, persistencia demo, logout, registro con confirmación y recuperación sin envío ficticio | No se envían correos ni se autentica una cuenta Supabase real |
| Filtros | Año + idioma combinados, búsqueda sin tildes, puntuación, formato y limpieza | Catálogo controlado con fechas, idiomas y puntuaciones diferentes |
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

El [manifiesto](images/capture-manifest.json) registra catorce capturas, rutas, viewports y fecha. `screening-trailer.png` muestra el portal actual con enlace externo; no representa reproducción incrustada. Las capturas son evidencia visual, no golden snapshots con comparación de píxeles.

La revisión visual incluyó portada de escritorio, Pixel 7 y portal de trailer. El enlace de continuación en la misma pestaña se probó con un candidato real de TMDB y navegó a su URL de YouTube. No se extrajo ni descargó vídeo. El generador WebP usa únicamente imágenes de TMDB y no expone el token privado.

## Pendiente antes de producción

- Desplegar y verificar proxy TMDB y migración de series en el entorno remoto.
- Probar RLS y concurrencia de dos usuarios sobre un asiento real de prueba en Postgres.
- Verificar correos de registro/recuperación y expiración de sesión con cuentas de prueba.
- Ejecutar Firefox/WebKit y una auditoría formal de accesibilidad/rendimiento si son criterios de entrega.

No se da por certificado el cumplimiento remoto de RF-15 usando los locks del modo demo. No se descargan trailers de YouTube ni se consumen créditos de generación.
