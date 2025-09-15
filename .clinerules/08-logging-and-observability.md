# Logging and Observability

- **Request Context**
  - Include `X-Request-Id` in logs and responses; propagate across services.

- **Chat API Logs**
  - Request-level logs must include the model used and any tool-calling details.

- **Signals**
  - Log structured events; use consistent keys for correlation.
  - Prefer error boundaries and typed error responses over unstructured throws.
