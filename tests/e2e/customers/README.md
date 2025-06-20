# Customer Platform Configuration E2E Tests

This directory contains end-to-end tests for the customer platform configuration feature.

## Test Files

### platform-configuration.test.js
Tests the complete flow of configuring OAuth credentials for customer platforms:
- Login to application
- Navigate to customers page
- Access platform management for a customer
- Open configuration modal
- Validate modal elements
- Test form interactions

## Running Tests

### Prerequisites
1. Ensure the application is running locally:
   ```bash
   pnpm run dev
   ```

2. Install Puppeteer (if not already installed):
   ```bash
   npm install puppeteer --save-dev
   ```

### Run Tests

```bash
# Run the test with browser visible
node tests/e2e/customers/platform-configuration.test.js

# Run in headless mode
HEADLESS=true node tests/e2e/customers/platform-configuration.test.js

# Auto-close browser after test
CLOSE_BROWSER=true node tests/e2e/customers/platform-configuration.test.js
```

### Test Configuration
Edit the `TEST_CONFIG` object in the test file to adjust:
- Base URL
- Test credentials
- Viewport size
- Timeouts

## Screenshots
Screenshots are automatically saved to the `screenshots/` directory:
- `configure-modal.png` - Modal in initial state
- `configure-modal-filled.png` - Modal with filled form
- `error-screenshot.png` - Captured on test failure

## CI/CD Integration

To run in CI/CD pipelines:

```yaml
# Example GitHub Actions configuration
- name: Run Customer E2E Tests
  run: |
    HEADLESS=true CLOSE_BROWSER=true node tests/e2e/customers/platform-configuration.test.js
```

## Troubleshooting

### Common Issues

1. **Login fails**: Ensure test credentials are correct
2. **Elements not found**: Check if UI has changed
3. **Timeouts**: Increase timeout values in TEST_CONFIG
4. **No Configure button**: All platforms may already be configured

### Debug Mode

Add console logs or use Chrome DevTools:
```javascript
// Add to test file
await page.evaluate(() => {
  console.log('Current URL:', window.location.href);
  console.log('Page title:', document.title);
});
```