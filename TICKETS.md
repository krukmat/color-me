# Ticket List — Proyecto Color Me MVP/V1

Cada ticket corresponde a una subtarea del plan de `PROJECT_PLAN.md`. Priorizar en orden (fase 0 → fase 6), manteniendo commits pequeños y tests asociados.

## Fase 0 — Alineación de producto
1. **Definir paleta y UX** – Documentar los 10 colores finales con nombres/hex/HSV y especificar cómo funciona el slider de intensidad junto al before/after toggle.
2. **Establecer formato de resultados** – Acordar payload de respuesta del ML API (`image_url` o buffer + `processing_ms`) y cómo se muestra en mobile.
3. **Mensajes UX por estado** – Enumerar mensajes de loading, retry, errores (network/fallo ML) y sus triggers en la app.

## Fase 1 — Fundaciones técnicas
4. **Skeleton de paquetes y comandos** – Verificar `make dev/lint/test`, actualizar `README` si hace falta, documentar cómo iniciar cada servicio (`AGENTS.md` ya refleja).
5. **Middleware de request_id** – Implementar trazabilidad en BFF y ML API, asegurar que siempre se incluye y se propaga `x-request-id`.
6. **OpenAPI y DTOs iniciales** – Crear contrato en ML API y los types que usará el BFF (input/output para try-on).

## Fase 2 — Pipeline ML API
7. **Validación + parsing** – Validar imagen + color/intensidad; rechazar payloads grandes.
8. **Segmentación + recolor** – Pipeline puro, cache de modelo en proceso, calcular `processing_ms`.
9. **Tests ML** – Unit (recolor, máscara) y integration (endpoint con fixture real).

## Fase 3 — Gateway BFF
10. **Validación y rate limit** – Validar input (zod/yup), aplicar límites de payload y rate limit/helmet/CORS.
11. **Cliente HTTP y error envelope** – Llamar a ML API con headers/timeouts y mapear errores al envelope (`code`, `message`, `request_id`, `details`).
12. **Tests BFF** – Unit (validación, mapping) y integration (Supertest con ML API cuando sea posible).

## Fase 4 — Mobile RN
13. **Captura + preview + picker** – Selfie o picker, previsualización, compresión/redimensión.
14. **Paleta + slider + before/after** – Implementar UI + state management para color/intensidad/comparación.
15. **Share + CTA de reserva** – Share nativo y botón/CTA que abra WhatsApp o URL.
16. **UX states y mensajes** – Loading, retry, errores amigables en cada request.
17. **Tests móviles** – Unit tests para lógica pura (helpers/paleta/state).

## Fase 5 — Hardening y Release
18. **Performance y QA** – Ajustar compresión, testear en dispositivo, validar tiempos.
19. **Checklist privacidad/logs** – Asegurar que no hay logging sensible (no base64), selfies no persistidos.

## Fase 6 — V1 Prótesis capilar
20. **Catálogo de overlays** – Modelar fuente de PNG alpha y lista de elementos en la app.
21. **Editor de overlays** – Move/scale/rotate + reset/export/share de la composición.
22. **Integración V1** – Validaciones en BFF/ML (si cambia el backend) y tests asociados.

## Riesgos y seguimiento
- Cada ticket debe incluir su plan de tests unitarios/integración (ver `PROJECT_PLAN.md:18-74`, `CLAUDE.md`).
- Mantener la cadena de `request_id` y el envelope de errores completo.
- Evitar scope creep (V2 solo con aprobación).
