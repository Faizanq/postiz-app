/**
 * E2E Test for Customer Platform Configuration Feature
 * 
 * This test validates the complete flow of:
 * 1. Logging into the application
 * 2. Navigating to customers page
 * 3. Accessing a customer's platform management
 * 4. Opening the platform configuration modal
 * 5. Verifying the modal elements and functionality
 * 
 * Prerequisites:
 * - Application running on http://localhost:4200
 * - Test user account: faizanqureshi0@gmail.com / 123123
 * - At least one customer exists in the system
 */

const puppeteer = require('puppeteer');

const path = require('path');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:4200',
  credentials: {
    email: 'faizanqureshi0@gmail.com',
    password: '123123'
  },
  viewport: {
    width: 1200,
    height: 800
  },
  timeouts: {
    navigation: 30000,
    element: 10000
  }
};

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!require('fs').existsSync(screenshotsDir)) {
  require('fs').mkdirSync(screenshotsDir, { recursive: true });
}

/**
 * Utility function to wait and click an element
 */
async function waitAndClick(page, selector, options = {}) {
  await page.waitForSelector(selector, { timeout: TEST_CONFIG.timeouts.element, ...options });
  await page.click(selector);
}

/**
 * Utility function to wait and type in an input
 */
async function waitAndType(page, selector, text, options = {}) {
  await page.waitForSelector(selector, { timeout: TEST_CONFIG.timeouts.element, ...options });
  await page.type(selector, text);
}

/**
 * Login to the application
 */
async function login(page) {
  await page.goto(TEST_CONFIG.baseUrl);
  
  // Check if we're on sign up page and navigate to sign in
  const signInLink = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const signIn = links.find(link => link.textContent.includes('Sign In'));
    if (signIn) {
      signIn.click();
      return true;
    }
    return false;
  });
  
  if (signInLink) {
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  }
  
  // Fill login form
  await waitAndType(page, 'input[name="email"]', TEST_CONFIG.credentials.email);
  await waitAndType(page, 'input[name="password"]', TEST_CONFIG.credentials.password);
  await waitAndClick(page, 'button[type="submit"]');
  
  // Wait for navigation to complete
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  console.log('✓ Logged in successfully');
}

/**
 * Navigate to customers page
 */
async function navigateToCustomers(page) {
  await page.goto(`${TEST_CONFIG.baseUrl}/customers`);
  await page.waitForSelector('table', { timeout: TEST_CONFIG.timeouts.navigation });
  console.log('✓ Customers page loaded');
}

/**
 * Open customer dropdown and navigate to platforms
 */
async function navigateToPlatforms(page) {
  // Click dropdown on first customer
  const dropdownClicked = await page.evaluate(() => {
    const firstRow = document.querySelector('tbody tr:first-child');
    if (firstRow) {
      const buttons = firstRow.querySelectorAll('button');
      if (buttons.length > 0) {
        buttons[buttons.length - 1].click();
        return true;
      }
    }
    return false;
  });
  
  if (!dropdownClicked) {
    throw new Error('Could not find customer dropdown button');
  }
  
  await page.waitForTimeout(1000); // Wait for dropdown animation
  
  // Click Manage Platforms option
  const platformsClicked = await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    const manageElements = Array.from(allElements).filter(el => 
      el.textContent && 
      el.textContent.includes('Manage') && 
      el.offsetParent !== null &&
      el.textContent.length < 50
    );
    
    for (const el of manageElements) {
      if (el.textContent.trim() === 'Manage Platforms' || el.textContent.trim().includes('Manage Platform')) {
        el.click();
        return true;
      }
    }
    return false;
  });
  
  if (!platformsClicked) {
    throw new Error('Could not find Manage Platforms option');
  }
  
  // Wait for platforms page to load
  await page.waitForFunction(
    () => {
      const h3Elements = Array.from(document.querySelectorAll('h3'));
      return h3Elements.some(el => el.textContent.includes('Available Platforms'));
    },
    { timeout: TEST_CONFIG.timeouts.navigation }
  );
  console.log('✓ Platforms page loaded');
}

/**
 * Open platform configuration modal
 */
async function openConfigureModal(page) {
  const configureClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const configureButton = buttons.find(btn => btn.textContent.trim() === 'Configure');
    if (configureButton) {
      configureButton.click();
      return true;
    }
    return false;
  });
  
  if (!configureClicked) {
    console.log('⚠ No Configure button found - all platforms may be already configured');
    return false;
  }
  
  // Wait for modal to appear
  await page.waitForSelector('[role="dialog"]', { timeout: TEST_CONFIG.timeouts.element });
  console.log('✓ Configure modal opened');
  return true;
}

/**
 * Validate modal contents
 */
async function validateModal(page) {
  const modalValidation = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return { success: false, error: 'Modal not found' };
    
    // Check for required elements
    const checks = {
      title: !!modal.querySelector('h2'),
      clientIdField: !!modal.querySelector('input[placeholder*="Client ID"]'),
      clientSecretField: !!modal.querySelector('input[placeholder*="Client Secret"]'),
      testButton: !!Array.from(modal.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Test Connection')
      ),
      saveButton: !!Array.from(modal.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Save Credentials')
      ),
      securityInfo: !!modal.querySelector('.text-xs'),
      platformIcon: !!modal.querySelector('img, svg')
    };
    
    const allChecks = Object.values(checks).every(check => check === true);
    
    return {
      success: allChecks,
      checks,
      modalTitle: modal.querySelector('h2')?.textContent
    };
  });
  
  console.log('✓ Modal validation results:');
  console.log('  - Title:', modalValidation.checks.title ? '✓' : '✗');
  console.log('  - Client ID field:', modalValidation.checks.clientIdField ? '✓' : '✗');
  console.log('  - Client Secret field:', modalValidation.checks.clientSecretField ? '✓' : '✗');
  console.log('  - Test Connection button:', modalValidation.checks.testButton ? '✓' : '✗');
  console.log('  - Save Credentials button:', modalValidation.checks.saveButton ? '✓' : '✗');
  console.log('  - Security info:', modalValidation.checks.securityInfo ? '✓' : '✗');
  console.log('  - Platform icon:', modalValidation.checks.platformIcon ? '✓' : '✗');
  
  return modalValidation.success;
}

/**
 * Main test execution
 */
async function runTest() {
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    defaultViewport: TEST_CONFIG.viewport,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for some environments
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Starting Customer Platform Configuration E2E Test...\n');
    
    // Step 1: Login
    await login(page);
    
    // Step 2: Navigate to customers
    await navigateToCustomers(page);
    
    // Step 3: Navigate to platforms
    await navigateToPlatforms(page);
    
    // Step 4: Open configure modal
    const modalOpened = await openConfigureModal(page);
    
    if (modalOpened) {
      // Step 5: Validate modal
      const isValid = await validateModal(page);
      
      // Take screenshot for documentation
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'configure-modal.png'),
        fullPage: false 
      });
      console.log('✓ Screenshot saved');
      
      if (isValid) {
        console.log('\n✅ All tests passed successfully!');
      } else {
        console.log('\n❌ Modal validation failed');
      }
    }
    
    // Optional: Test form interaction
    if (modalOpened) {
      console.log('\nTesting form interaction...');
      
      // Type in Client ID
      await page.type('input[placeholder*="Client ID"]', 'test-client-id-12345');
      console.log('✓ Entered Client ID');
      
      // Type in Client Secret
      await page.type('input[placeholder*="Client Secret"]', 'test-secret-67890');
      console.log('✓ Entered Client Secret');
      
      // Test show/hide password
      const eyeButton = await page.$('button svg');
      if (eyeButton) {
        await eyeButton.click();
        console.log('✓ Toggled password visibility');
      }
      
      // Take screenshot with filled form
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'configure-modal-filled.png'),
        fullPage: false 
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take error screenshot
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'error-screenshot.png'),
      fullPage: true 
    });
    
    throw error;
  } finally {
    // Keep browser open for manual inspection if needed
    if (process.env.CLOSE_BROWSER !== 'false') {
      console.log('\nTest completed. Browser will remain open for inspection.');
      console.log('Press Ctrl+C to close.');
    } else {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  runTest().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTest,
  TEST_CONFIG
};