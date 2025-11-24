# 🔍 Performance Profiling Guide

**Goal**: Find exactly what's taking 5 seconds

---

## 🎯 Step-by-Step Profiling

### 1. Restart with Profiling Enabled

```bash
# Stop server (Ctrl+C)
rm -rf .next && npm run dev
```

### 2. Open Browser DevTools

**Chrome/Edge/Brave**: Press `F12` or `Cmd+Option+I` (Mac)

### 3. Open Performance Tab

1. Click **"Performance"** tab in DevTools
2. Click the **record button** (circle icon)
3. **Reload page** (`Cmd+R` or `F5`)
4. Click **stop button** after page loads
5. Look at the waterfall

---

## 📊 What to Look For

### A. Network Tab Analysis

1. Go to **Network** tab
2. Reload page
3. Look for:
   - **Red or orange bars** = slow requests
   - **Long "Waiting (TTFB)" time** = server problem
   - **Large file sizes** = need compression

**Key Metrics**:
```
Document (the HTML): Should be < 200ms
JS bundles: Should be < 500ms each
Total: Should be < 2s
```

### B. Console Output (Server-Side)

I've added profiling logs. After page load, check **terminal** (where `npm run dev` is running):

```bash
[Layout Profile] cookies(): 50.25ms
[Layout Profile] getLocale(): 120.30ms
[Layout Profile] getMessages(): 180.45ms
[Layout Profile] 🎯 TOTAL LAYOUT TIME: 350.00ms
```

**What's normal?**:
- cookies(): < 50ms ✅
- getLocale(): < 100ms ✅
- getMessages(): < 200ms ✅
- **TOTAL LAYOUT**: < 500ms ✅

**If any > 500ms**: That's your bottleneck! 🎯

### C. React DevTools Profiler

1. Install **React Developer Tools** extension
2. Open DevTools → **Profiler** tab
3. Click **record button**
4. Reload page
5. Click **stop button**
6. Look at **flame graph**

**Look for**:
- **Tall bars** = slow components
- **Red/orange** = very slow
- **Render times > 500ms** = problem

---

## 🐛 Common Bottlenecks

### 1. Clerk Initialization (Most Likely)

**Symptom**: 2-3 second delay before anything renders

**Check in Network tab**:
- Look for requests to `clerk.accounts.dev`
- If TTFB > 2s, Clerk is slow

**Fix**:
```typescript
// Add to providers.tsx
<ClerkProvider 
  publishableKey={pk}
  telemetry={{ disabled: true }}  // Disable telemetry
  appearance={{ /* ... */ }}
>
```

### 2. Convex Connection

**Symptom**: Long wait for WebSocket connection

**Check in Network tab**:
- Look for `ws://` or `wss://` connection to Convex
- Check "Timing" → "Waiting" time

**Fix**: Lazy load Convex provider

### 3. I18n Messages Loading

**Symptom**: Terminal shows `getMessages() > 500ms`

**Fix**: Cache messages or reduce bundle size

### 4. Too Many Contexts

**Symptom**: React Profiler shows many context providers re-rendering

**Fix**: Combine or lazy load contexts

---

## 📈 Profiling Checklist

Run through this checklist and note the times:

### Terminal Output (Server-Side)
```bash
[ ] cookies(): _____ms (should be < 50ms)
[ ] getLocale(): _____ms (should be < 100ms)  
[ ] getMessages(): _____ms (should be < 200ms)
[ ] TOTAL LAYOUT: _____ms (should be < 500ms)
```

### Network Tab (Client-Side)
```bash
[ ] Document (HTML): _____ms (should be < 200ms)
[ ] Clerk requests: _____ms (should be < 1000ms)
[ ] Convex WS: _____ms (should be < 500ms)
[ ] Total JS loaded: _____KB (should be < 2MB)
```

### Performance Tab
```bash
[ ] First Paint: _____ms (should be < 1000ms)
[ ] First Contentful Paint: _____ms (should be < 1800ms)
[ ] Largest Contentful Paint: _____ms (should be < 2500ms)
```

---

## 🎯 What to Report

After profiling, copy these results:

```
=== SERVER TIMINGS (from terminal) ===
cookies(): _____ms
getLocale(): _____ms
getMessages(): _____ms
TOTAL LAYOUT: _____ms

=== NETWORK TIMINGS (from DevTools) ===
Document: _____ms
First JS bundle: _____ms
Clerk requests: _____ms
Convex WebSocket: _____ms

=== WEB VITALS (from console) ===
TTFB: _____ms
FCP: _____ms
LCP: _____ms

=== SLOWEST ITEM ===
[What's taking the most time?]
```

---

## 🚀 Quick Profiling Commands

**Profile server-side** (already enabled in code):
```bash
npm run dev
# Watch terminal output
```

**Profile with Next.js built-in**:
```bash
# In .env.local
NEXT_PROFILE=true npm run dev
```

**Profile production build**:
```bash
npm run build
npm start
# Then check performance
```

---

## 🔍 Advanced: Add Custom Timings

If you want to measure specific code:

```typescript
// Measure any async operation
const start = performance.now();
await someSlowFunction();
console.log(`someSlowFunction took: ${performance.now() - start}ms`);
```

```typescript
// In React component
useEffect(() => {
  console.time('Component mounted');
  // ... initialization
  console.timeEnd('Component mounted');
}, []);
```

---

## ✅ Next Steps

1. **Run profiling** (steps above)
2. **Copy the results** (timings from terminal + DevTools)
3. **Share with me** so I can see exact bottleneck
4. **I'll create targeted fix** based on data

---

**Ready to profile!** 

Restart dev server and check both:
1. **Terminal** (server-side timings)
2. **DevTools Network tab** (client-side timings)

Then share the numbers! 🎯
