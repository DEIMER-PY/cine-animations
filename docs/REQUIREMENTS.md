# Requerimientos funcionales

[← README](../README.md) · [Arquitectura](ARCHITECTURE.md) · [Evidencia de pruebas](TESTING.md)

## Cómo leer esta matriz

Describe el código disponible en el repositorio. «Implementado» no equivale a «desplegado y certificado»: la UI y el adaptador demo fueron probados localmente; Auth, RLS, Realtime y concurrencia entre usuarios reales requieren una instancia Supabase configurada.

| RF | Estado | Implementación |
|---:|:---:|---|
| RF-01 | Implementado | Cartelera TMDB/Supabase con fallback local normalizado |
| RF-02 | Implementado | Búsqueda por título y género; filtros adicionales por año e idioma |
| RF-03 | Implementado | Ficha con sinopsis, géneros, duración, estreno, dirección, protagonistas, reparto, trailer, puntuación y funciones |
| RF-04 | Implementado | Fecha, hora, sala, formato, precio COP y disponibilidad exacta |
| RF-05 | Implementado | Selección de una función identificable y navegable |
| RF-06 | Implementado | Mapa dinámico con seis estados visuales y semánticos |
| RF-07 | Implementado | Selección explícita por fila y número |
| RF-08 | Implementado | Ubicación frontal/media/posterior e izquierda/centro/derecha |
| RF-09 | Implementado | Selección múltiple y cantidad sincronizada; máximo ocho |
| RF-10 | Implementado | Nombre, correo, película, función, cantidad, asientos y revalidación |
| RF-11 | Implementado | Persistencia demo local o transaccional en Supabase |
| RF-12 | Implementado | Precio unitario, cantidad y total en COP |
| RF-13 | Implementado | Validaciones de sesión, términos, expiración, cantidad y conflicto |
| RF-14 | Implementado | Reserva marca `reserved`; compra marca `sold` |
| RF-15 | Implementado en SQL; validación remota pendiente | Bloqueo de filas en RPC: dos usuarios no obtienen el mismo asiento |


## Límites de aceptación

- No hay cobros ni reproducción de películas o capítulos completos.
- El acceso local es una simulación; no envía correos ni valida identidades reales.
- Las pruebas E2E controlan el catálogo y usan persistencia demo. No prueban las RPC desplegadas.
- RF-11, RF-13, RF-14 y especialmente RF-15 necesitan pruebas de integración remotas antes de una entrega productiva.
