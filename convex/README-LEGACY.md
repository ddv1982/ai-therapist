# Legacy Migration Cleanup

This document records the removal of legacy migration infrastructure from the codebase.

## Removed Files

### `import.ts` (deleted 2025-11-19)
- **Purpose**: Data migration from previous system
- **Size**: 285 lines
- **Status**: DELETED - no legacy data exists in database
- **Note**: Available in git history if ever needed

## Schema Changes

As of 2025-11-19, the following fields were removed from the schema:
- `users.legacyId` (optional string)
- `sessions.legacyId` (optional string)
- `messages.legacyId` (optional string)
- `sessionReports.legacyId` (optional string)

Index removed:
- `users.by_legacyId` index

Functions removed:
- `users.getOrCreate` (legacy migration mutation)
- `users.getByLegacyId` (legacy migration query)

## If You Need to Re-enable Migrations

If you ever need to import legacy data in the future:

1. Add back `legacyId: v.optional(v.string())` to affected tables in `schema.ts`
2. Add back `by_legacyId` index to users table
3. Restore `convex/import.ts` from git history
4. Re-add migration functions to `users.ts` (getOrCreate, getByLegacyId)
5. Run Convex schema push: `npx convex dev`

## Database Audit Results

Last audit run: 2025-11-19

```
Users with legacyId:     0 / 2    (0%)
Sessions with legacyId:  0 / 4    (0%)
Messages with legacyId:  0 / 32   (0%)
Reports with legacyId:   0 / 1    (0%)
```

**Conclusion**: Safe to remove - no legacy data in production.
