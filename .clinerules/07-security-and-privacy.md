# Security and Privacy

- **Logging**
  - Do not log IP addresses.
  - Redact secrets and user identifiers from logs by default.

- **Auth**
  - Prefer not to gate LAN/mobile TOTP verification behind existing sessions; `/api/auth/verify` should remain unauthenticated wrapper.
  - Use rate limiting where appropriate via provided utilities.

- **Data Handling**
  - Encrypt sensitive data at rest and in transit per existing libs and tests.
  - Adhere to principle of least privilege across server utilities and API routes.
