#!/bin/bash

echo "🔧 CBT Debug Browser Opener"
echo "=========================="
echo ""
echo "This will open a browser window and keep it open indefinitely"
echo "so you can manually test the CBT data display."
echo ""

# Check if dev server is running
if ! curl -s http://localhost:4000 > /dev/null; then
    echo "❌ Dev server not running on localhost:4000"
    echo "Please start it with: npm run dev"
    exit 1
fi

echo "✅ Dev server detected on localhost:4000"
echo ""
echo "🚀 Opening browser for manual testing..."
echo ""
echo "MANUAL TESTING STEPS:"
echo "1. Complete 2FA authentication in the browser"
echo "2. Navigate to the chat titled 'hi'"
echo "3. Look for memory/report buttons and click them"
echo "4. Look for the yellow 'CBT Data Diagnostic' box"
echo "5. Open browser dev tools (F12) and check console for [CBTDataDisplay] logs"
echo "6. Take note of what you see in tables vs. diagnostic info"
echo "7. Press Ctrl+C here when you're done testing"
echo ""
echo "⏳ Browser will stay open until you stop this script..."

# Run the test that keeps browser open
npm run test:e2e:headed -- __tests__/e2e/cbt-debug-simple.spec.ts --grep="open browser and wait"