const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    await page.goto('http://localhost:4200');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    // Login
    await page.type('input[name="email"]', 'faizanqureshi0@gmail.com');
    await page.type('input[name="password"]', '123123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✓ Logged in successfully');
    
    // Navigate to customers page
    await page.goto('http://localhost:4200/customers');
    await page.waitForSelector('table', { timeout: 10000 });
    console.log('✓ Customers page loaded');
    
    // Find the first customer row and click on the dropdown menu
    const firstCustomerRow = await page.$('tbody tr:first-child');
    if (firstCustomerRow) {
      // Click the 3-dot menu button
      await firstCustomerRow.click('button[aria-label="More actions"]');
      await page.waitForSelector('[role="menu"]', { timeout: 5000 });
      console.log('✓ Dropdown menu opened');
      
      // Click on Platforms option
      const platformsOption = await page.$x('//div[@role="menuitem"][contains(., "Platforms")]');
      if (platformsOption.length > 0) {
        await platformsOption[0].click();
        console.log('✓ Clicked on Platforms option');
        
        // Wait for platforms page to load
        await page.waitForSelector('h3:has-text("Available Platforms")', { timeout: 10000 });
        console.log('✓ Platforms page loaded');
        
        // Find a platform that is enabled but not connected
        const configurableCards = await page.$$eval('.grid > div', cards => {
          return cards.map((card, index) => {
            const isEnabled = card.classList.contains('border-green-600');
            const hasConfigureButton = card.querySelector('button:has-text("Configure")');
            return { index, isEnabled, hasConfigureButton: !!hasConfigureButton };
          }).filter(card => card.isEnabled && card.hasConfigureButton);
        });
        
        if (configurableCards.length > 0) {
          // Click the Configure button on the first configurable platform
          const cardSelector = `.grid > div:nth-child(${configurableCards[0].index + 1})`;
          await page.click(`${cardSelector} button:has-text("Configure")`);
          console.log('✓ Clicked Configure button');
          
          // Wait for modal to appear
          await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
          console.log('✓ Configure modal opened');
          
          // Check if modal contains the expected elements
          const hasClientIdField = await page.$('input[placeholder*="Client ID"]') !== null;
          const hasClientSecretField = await page.$('input[placeholder*="Client Secret"]') !== null;
          const hasTestButton = await page.$('button:has-text("Test Connection")') !== null;
          const hasSaveButton = await page.$('button:has-text("Save Credentials")') !== null;
          
          console.log('✓ Modal elements check:');
          console.log('  - Client ID field:', hasClientIdField ? '✓' : '✗');
          console.log('  - Client Secret field:', hasClientSecretField ? '✓' : '✗');
          console.log('  - Test Connection button:', hasTestButton ? '✓' : '✗');
          console.log('  - Save Credentials button:', hasSaveButton ? '✓' : '✗');
          
          // Take a screenshot of the modal
          await page.screenshot({ path: 'configure-modal-screenshot.png' });
          console.log('✓ Screenshot saved as configure-modal-screenshot.png');
          
        } else {
          console.log('⚠ No configurable platforms found (all platforms may already be connected)');
        }
        
      } else {
        console.log('✗ Could not find Platforms option in dropdown');
      }
    } else {
      console.log('✗ No customer rows found');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  }
  
  // Keep browser open for manual inspection
  console.log('\nTest completed. Browser will remain open for inspection.');
  console.log('Press Ctrl+C to close.');
})();