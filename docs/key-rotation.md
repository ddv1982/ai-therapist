# Encryption Key Rotation Policy

This document describes the policy and procedure for encryption key rotation in the AI Therapist application.

## Purpose

To ensure sensitive data (therapy notes, chat logs, authentication secrets) remains secure, encryption keys must be rotated periodically. This reduces the risk of long-term key compromise.

## Policy

- **Rotation Frequency**: Keys must be rotated at least every 6 months, or immediately if a compromise is suspected.
- **Environment Separation**: Development, staging, and production must each use separate keys.
- **Secure Storage**: Keys must be stored in environment variables or a secure secret manager (e.g., AWS Secrets Manager, HashiCorp Vault).
- **No Version Control**: Keys must never be committed to Git or any version control system.

## Procedure

1. **Generate a New Key**
   ```bash
   node scripts/setup-encryption.js generate
   ```
   Save the generated key securely.

2. **Update Environment**
   - Update `.env.local` for development.
   - Update environment variables in staging/production secret manager.

3. **Deploy with Dual Key Support**
   - Update the application to support both the old and new keys temporarily.
   - Decrypt with the old key, re-encrypt with the new key.

4. **Re-encrypt Data**
   - Run a migration script to re-encrypt all sensitive fields in the database with the new key.

5. **Remove Old Key**
   - After successful migration and verification, remove the old key from all environments.

6. **Validate**
   - Run integration tests to confirm data can be decrypted with the new key.
   - Verify logs for any decryption errors.

## Emergency Rotation

If a key compromise is suspected:
- Immediately generate a new key.
- Invalidate the old key.
- Re-encrypt all sensitive data.
- Notify security stakeholders.

## References

- [scripts/setup-encryption.js](../scripts/setup-encryption.js)
- [prisma/schema.prisma](../prisma/schema.prisma)
- [src/lib/encryption/](../src/lib/encryption/)
