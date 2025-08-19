#!/bin/bash

echo "🧪 CBT Data Display Test Runner"
echo "================================"
echo ""
echo "This will:"
echo "1. Start the development server (if not running)"
echo "2. Open a browser window"
echo "3. Wait for you to complete authentication"
echo "4. Run the CBT data analysis"
echo ""

# Check if dev server is running
echo "🔍 Checking if dev server is running on localhost:4000..."
if curl -s http://localhost:4000 > /dev/null; then
    echo "✅ Dev server is already running"
else
    echo "❌ Dev server not detected"
    echo "⚠️  Please start the dev server first with: npm run dev"
    echo "   Then run this script again"
    exit 1
fi

echo ""
echo "🚀 Starting Playwright test with manual authentication..."
echo "📱 A browser window will open"
echo "🔐 Complete the 2FA authentication when prompted"
echo "⏳ The test will wait up to 5 minutes for you to authenticate"
echo ""

# Run the specific test with headed mode
npm run test:e2e:headed -- __tests__/e2e/cbt-data-display-with-auth.spec.ts --grep="should wait for manual auth"

echo ""
echo "📊 Test completed!"
echo "📸 Check the screenshot at: __tests__/e2e/screenshots/cbt-data-after-auth.png"
echo "📝 Look at the console output above for CBT data analysis results"