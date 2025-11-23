# Translation Validation

Automated tests to ensure translation consistency across all locales.

## What It Does

The validation tests (`__tests__/i18n/translation-validation.test.ts`) automatically check:

1. ✅ **All locales have matching keys** - No missing translations
2. ✅ **No orphaned keys** - No extra translations in non-baseline locales
3. ✅ **Same key count** - All locales have exact same structure
4. ✅ **Non-empty values** - All translations have actual content
5. ✅ **Coverage report** - Shows completion percentage per locale

## Running Validation

```bash
# Run just the validation tests
npm test translation-validation

# Run all tests (includes validation)
npm test
```

## Understanding Results

### ✅ All Tests Pass

```
📊 Translation Coverage Report:
   English (baseline): 533 keys
   Dutch: 533 keys (100% complete)

✓ Dutch locale has all English keys (no missing translations)
✓ Dutch locale has no extra keys (orphaned translations)
✓ both locales have the same number of keys
```

**Meaning:** All locales are perfectly in sync! 🎉

### ❌ Missing Translations

```
❌ Missing Dutch translations for:
   - cbt.newFeature.title
   - cbt.newFeature.description
   
Total missing: 2 keys

✕ Dutch locale has all English keys (no missing translations)
```

**How to fix:**
1. Open `src/i18n/messages/nl.json`
2. Add the missing keys:
```json
{
  "cbt": {
    "newFeature": {
      "title": "[Dutch translation]",
      "description": "[Dutch translation]"
    }
  }
}
```
3. Run `npm test translation-validation` again

### ⚠️ Extra Keys (Orphaned)

```
⚠️  Extra Dutch translations (not in English):
   - cbt.oldFeature.title
   
Total extra: 1 keys

✕ Dutch locale has no extra keys (orphaned translations)
```

**How to fix:**
1. Check if the key is still used in code
2. If **used:** Add to `en.json` 
3. If **not used:** Remove from `nl.json`

```bash
# Check if key is used in code
grep -r "oldFeature.title" src
```

## Workflow

### Adding New Translations

```bash
# 1. Add to English (baseline)
vim src/i18n/messages/en.json

# 2. Run validation - it will fail
npm test translation-validation
# ❌ Missing Dutch translations for: your.new.key

# 3. Add to other locales
vim src/i18n/messages/nl.json

# 4. Verify all pass
npm test translation-validation
# ✅ All tests pass

# 5. Regenerate types
npm run i18n:types
```

### Removing Translations

```bash
# 1. Remove from code
# 2. Remove from English
vim src/i18n/messages/en.json

# 3. Run validation - it will warn
npm test translation-validation
# ⚠️  Extra Dutch translations: your.old.key

# 4. Remove from other locales
vim src/i18n/messages/nl.json

# 5. Verify clean
npm test translation-validation
# ✅ All tests pass
```

## Integration with CI/CD

These tests run automatically with:

```bash
npm test        # Local testing
npm run qa:smoke   # Pre-commit
npm run qa:full    # CI/CD pipeline
```

### GitHub Actions Example

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test
      # Translation validation runs as part of test suite
      # Build will fail if translations are out of sync
```

## Coverage Report

The validation tests include a coverage report that shows:

```
📊 Translation Coverage Report:
   English (baseline): 533 keys
   Dutch: 533 keys (100% complete)
```

This runs automatically with every test and helps track:
- Total number of translation keys
- Completion percentage per locale
- Number of missing/extra keys

## Best Practices

1. **Always update English first** - It's the baseline locale
2. **Run validation before committing** - Catch issues early
3. **Keep locales in sync** - Update all locales together when possible
4. **Remove unused translations** - Keep JSON files clean
5. **Document why keys exist** - Add comments for unclear translations

## Troubleshooting

### False Positives

If validation fails but translations look correct:

1. **Check JSON syntax** - Must be valid JSON
2. **Check nesting** - Structure must match exactly
3. **Run type generation** - `npm run i18n:types`
4. **Check for typos** - Key names are case-sensitive

### Test Performance

Validation tests are fast (~200-300ms) because they:
- Load JSON once using `beforeAll`
- Use efficient Set operations for comparisons
- Don't make network requests
- Run in parallel with other tests

## Future Enhancements

Possible additions to validation:

- [ ] Warn about suspiciously short translations
- [ ] Check for HTML/formatting consistency
- [ ] Validate interpolation variables match
- [ ] Integration with translation services (Crowdin, Lokalise)
- [ ] Auto-fix orphaned keys
- [ ] Generate translation diff reports

## Example Output

### Clean Run
```bash
$ npm test translation-validation

PASS __tests__/i18n/translation-validation.test.ts
  Translation Validation
    Key Completeness
      ✓ has baseline English translations (1 ms)
      ✓ has Dutch translations
      ✓ Dutch locale has all English keys (no missing translations)
      ✓ Dutch locale has no extra keys (orphaned translations)
      ✓ both locales have the same number of keys
    Structure Validation
      ✓ English messages have proper nested structure
      ✓ Dutch messages have same top-level structure
      ✓ messages are non-empty strings (1 ms)
    Translation Coverage Report
      ✓ generates coverage summary (3 ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

### With Issues
```bash
$ npm test translation-validation

FAIL __tests__/i18n/translation-validation.test.ts
  Translation Validation
    Key Completeness
      ✓ has baseline English translations
      ✓ has Dutch translations
      ✕ Dutch locale has all English keys (no missing translations) (2 ms)
      
❌ Missing Dutch translations for:
   - auth.newField
   - chat.newFeature.title
   
Total missing: 2 keys

Test Suites: 1 failed, 1 total
Tests:       1 failed, 8 passed, 9 total
```

## Related Documentation

- [Type-Safe Translations](./i18n-type-safety.md)
- [Translation Workflow](./i18n-workflow.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
