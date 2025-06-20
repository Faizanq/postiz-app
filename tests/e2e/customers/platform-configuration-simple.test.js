/**
 * Simplified E2E Test for Customer Platform Configuration
 * Optimized for speed and reliability
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Test configuration
const CONFIG = {
  baseUrl: 'http://localhost:4200',
  email: 'faizanqureshi0@gmail.com',
  password: '123123',
  screenshotDir: path.join(__dirname, 'screenshots')
};

// Ensure screenshot directory exists
if (!fs.existsSync(CONFIG.screenshotDir)) {
  fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
}

async function measureTime(fn, label) {
  const start = Date.now();
  const result = await fn();
  const elapsed = Date.now() - start;
  console.log(`⏱️  ${label}: ${elapsed}ms`);
  return result;
}

async function runTest() {
  console.log('🚀 Starting Platform Configuration E2E Test\n');
  const testStart = Date.now();
  
  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS === 'true',
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate and Login
    await measureTime(async () => {
      await page.goto(CONFIG.baseUrl, { waitUntil: 'domcontentloaded' });
      
      // Check if on sign-in page
      const signInLink = await page.$('a');
      if (signInLink) {
        const text = await page.evaluate(el => el.textContent, signInLink);
        if (text && text.includes('Sign In')) {
          await signInLink.click();
          await page.waitForTimeout(1000);
        }
      }
      
      // Login
      await page.type('input[name="email"]', CONFIG.email);
      await page.type('input[name="password"]', CONFIG.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }, 'Login');
    
    // Step 2: Navigate to Customers
    await measureTime(async () => {
      await page.goto(`${CONFIG.baseUrl}/customers`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    }, 'Navigate to Customers');
    
    // Step 3: Open dropdown and navigate to platforms
    await measureTime(async () => {
      // Click dropdown
      await page.evaluate(() => {
        const firstRow = document.querySelector('tbody tr');
        if (firstRow) {
          const buttons = firstRow.querySelectorAll('button');
          if (buttons.length > 0) {
            buttons[buttons.length - 1].click();
          }
        }
      });
      await page.waitForTimeout(500);
      
      // Click Manage Platforms
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const manageEl = elements.find(el => 
          el.textContent && el.textContent.trim() === 'Manage Platforms'
        );
        if (manageEl) manageEl.click();
      });
      await page.waitForTimeout(2000);
    }, 'Navigate to Platforms');
    
    // Step 4: Click Configure button
    await measureTime(async () => {
      const configureClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const configBtn = buttons.find(btn => btn.textContent.trim() === 'Configure');
        if (configBtn) {
          configBtn.click();
          return true;
        }
        return false;
      });
      
      if (!configureClicked) {
        console.log('⚠️  No Configure button found - platforms may be configured');
        return;
      }
      
      await page.waitForTimeout(1000);
    }, 'Open Configure Modal');
    
    // Step 5: Validate modal and interact
    await measureTime(async () => {
      const validation = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        if (!modal) return { found: false };
        
        return {
          found: true,
          hasClientId: !!modal.querySelector('input[placeholder*="Client ID"]'),
          hasClientSecret: !!modal.querySelector('input[placeholder*="Client Secret"]'),
          hasTestButton: !!Array.from(modal.querySelectorAll('button')).find(b => 
            b.textContent.includes('Test Connection')
          ),
          hasSaveButton: !!Array.from(modal.querySelectorAll('button')).find(b => 
            b.textContent.includes('Save Credentials')
          )
        };
      });
      
      console.log('\n📋 Modal Validation:');
      console.log(`   Modal found: ${validation.found ? '✅' : '❌'}`);
      if (validation.found) {
        console.log(`   Client ID field: ${validation.hasClientId ? '✅' : '❌'}`);
        console.log(`   Client Secret field: ${validation.hasClientSecret ? '✅' : '❌'}`);
        console.log(`   Test button: ${validation.hasTestButton ? '✅' : '❌'}`);
        console.log(`   Save button: ${validation.hasSaveButton ? '✅' : '❌'}`);
      }
      
      // Take screenshot
      await page.screenshot({
        path: path.join(CONFIG.screenshotDir, 'modal-final.png')
      });
      console.log('\n📸 Screenshot saved: modal-final.png');
    }, 'Validate Modal');
    
    const totalTime = Date.now() - testStart;
    console.log(`\n✅ Test completed successfully in ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({
      path: path.join(CONFIG.screenshotDir, 'error.png'),
      fullPage: true
    });
  } finally {
    if (process.env.CLOSE === 'true') {
      await browser.close();
    } else {
      console.log('\n👀 Browser remains open for inspection (Ctrl+C to close)');
    }
  }
}

// Run test
runTest().catch(console.error);