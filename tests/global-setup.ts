import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting YouThumbAI QA Setup...');
  
  // Setup test environment
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Warm up the application
    console.log('🔥 Warming up application...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Pre-cache assets for faster tests
    console.log('💾 Pre-caching assets...');
    await page.addStyleTag({ content: 'body { display: block; }' });
    
    // Setup test data
    console.log('📊 Setting up test data...');
    await page.evaluate(() => {
      // Clear any existing data
      localStorage.clear();
      sessionStorage.clear();
      
      // Set test mode
      localStorage.setItem('test-mode', 'true');
      
      // Mock API responses for consistent testing
      window.testMockData = {
        sampleVideoData: {
          title: 'Test Video Title',
          channelTitle: 'Test Channel',
          duration: 600,
          viewCount: 10000
        }
      };
    });
    
    // Verify application is ready
    console.log('✅ Verifying application readiness...');
    const isReady = await page.evaluate(() => {
      return document.readyState === 'complete' && 
             window.React !== undefined;
    });
    
    if (!isReady) {
      throw new Error('Application not ready for testing');
    }
    
    console.log('🎉 QA Setup completed successfully!');
    
  } catch (error) {
    console.error('❌ QA Setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup; 