#!/bin/bash

# Customer Platform Configuration E2E Test Runner
# This script provides an easy way to run the platform configuration tests

echo "🧪 Customer Platform Configuration E2E Tests"
echo "=========================================="

# Check if app is running
if ! curl -s http://localhost:4200 > /dev/null; then
    echo "❌ Error: Application is not running on http://localhost:4200"
    echo "Please start the application first with: pnpm run dev"
    exit 1
fi

# Parse command line arguments
HEADLESS=false
CLOSE_BROWSER=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --headless) HEADLESS=true ;;
        --close) CLOSE_BROWSER=true ;;
        --help) 
            echo "Usage: ./run-tests.sh [options]"
            echo "Options:"
            echo "  --headless    Run tests in headless mode"
            echo "  --close       Close browser after tests complete"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Create screenshots directory if it doesn't exist
mkdir -p screenshots

# Run the test
echo ""
echo "Running tests..."
echo "Mode: $([ "$HEADLESS" = true ] && echo "Headless" || echo "Browser Visible")"
echo "Auto-close: $([ "$CLOSE_BROWSER" = true ] && echo "Yes" || echo "No")"
echo ""

HEADLESS=$HEADLESS CLOSE_BROWSER=$CLOSE_BROWSER node platform-configuration.test.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Tests completed successfully!"
    
    # List generated screenshots
    if [ -d "screenshots" ] && [ "$(ls -A screenshots)" ]; then
        echo ""
        echo "📸 Screenshots generated:"
        ls -la screenshots/*.png 2>/dev/null | awk '{print "   - " $9}'
    fi
else
    echo ""
    echo "❌ Tests failed! Check the error screenshot in screenshots/error-screenshot.png"
    exit 1
fi