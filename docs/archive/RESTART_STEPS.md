# How to Apply CSP Fix

The fix is in the code, but you need to restart everything for it to take effect.

## ✅ Step-by-Step Instructions

### 1. Stop Dev Server
```bash
# Press Ctrl+C in the terminal running the dev server
```

### 2. Clear Next.js Cache
```bash
cd /Users/vriesd/projects/ai-therapist
rm -rf .next
```

### 3. Restart Dev Server
```bash
npm run dev
```

### 4. Hard Refresh Browser
**Chrome/Edge/Brave:**
- Mac: `Cmd + Shift + R`
- Windows/Linux: `Ctrl + Shift + R`

**Or clear cache:**
- Chrome DevTools → Network tab → Check "Disable cache"
- Or: Settings → Privacy → Clear browsing data → Cached images and files

---

## 🔍 Verify Fix Applied

After restarting, check the CSP header in DevTools:

1. **Open DevTools** (F12)
2. **Network tab**
3. **Reload page**
4. **Click on the first request** (usually the HTML document)
5. **Headers tab → Response Headers**
6. **Look for `Content-Security-Policy`**

Should contain: `https://clerk-telemetry.com`

---

## 🐛 If Still Seeing Errors

If you still see errors after following all steps:

### Check the actual CSP header
```bash
# In another terminal, while dev server is running:
curl -I http://localhost:4000 | grep -i "content-security"
```

### Verify file was saved
```bash
cat src/lib/security/csp-nonce.ts | grep "clerk-telemetry"
```

Should show line with `https://clerk-telemetry.com`

---

## 🎯 Quick Commands

Run these in order:
```bash
# 1. Kill dev server (Ctrl+C)

# 2. Clear cache
rm -rf .next

# 3. Restart
npm run dev

# 4. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
```

---

**After this, the console errors will be gone!** ✅
