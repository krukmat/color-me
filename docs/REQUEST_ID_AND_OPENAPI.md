# Request ID & OpenAPI Roadmap

## Objective
- Garantizar trazabilidad (`request_id`) y contratos claros (OpenAPI/DTOs) antes de tocar la lógica de recolor o ui para que BFF y ML API compartan headers y formatos.

## Request ID Strategy
- BFF genera `request_id` si el cliente no lo envía, lo ata a la respuesta y lo propaga al ML API como header `x-request-id`.
- ML API devuelve el mismo `request_id` dentro del envelope (`code`, `message`, `request_id`, `details?`) y lo incluye en las respuestas HTTP.
- Todos los logs (BFF + ML) deben registrar `request_id` para correlacionar errores.
- Paths propuestos:
  - `services/bff/src/middleware/requestId.ts` (Express middleware).
  - `services/ml-api/app/middleware/request_id.py` (FastAPI dependency).
- Tests:
  - Unit: middleware añade header y respeta header entrante.
  - Integration: BFF → ML API call mantiene el mismo `request_id`.

## OpenAPI + DTOs
- ML API publica OpenAPI mínimo para `POST /try-on`.
- Especificar request/response (see `docs/PAYLOAD_FORMAT.md`). Incluir `color`, `intensity`, `selfie`, `processing_ms`, `color`, `request_id`.
- BFF importa/types TypeScript que reflejan OpenAPI contract y normaliza errores (usando zod/yup validations).
- Document where DTOs live (`services/bff/src/types/tryon.ts`, `services/ml-api/app/schemas/tryon.py`).
- Tests:
  - FastAPI: `pytest` validating schema enforcement + response shape.
  - BFF: zod schema tests + integration hitting ML API stub.

## Next Steps
1. When los servicios existan, crea los archivos anteriores con `request_id` middleware y OpenAPI spec.
2. Añade el header `x-request-id` a las respuestas a Mobile y loguealo.
3. Usa `scripts/verify.sh` para validar nuevos paquetes (añadir `pyproject`/`package.json`).

Mantén esta hoja actualizada conforme avance la implementación real.
