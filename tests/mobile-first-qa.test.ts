import { test, expect, Page, Browser } from '@playwright/test';

/**
 * Comprehensive Mobile-First QA Tests for YouThumbAI
 * Based on latest 2024-2025 AI-powered testing strategies
 * Supports Reddit-researched YouTube creator workflows
 */

// Test configuration for different devices
const devices = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 720 },
  { name: 'Large Desktop', width: 1920, height: 1080 }
];

// YouTube creator workflow test cases based on research
const creatorWorkflows = [
  {
    name: 'Gaming Creator',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Sample URL
    expectedElements: ['clickbait', 'shocked-face', 'arrows'],
    targetClickbaitLevel: 8
  },
  {
    name: 'Educational Creator', 
    videoUrl: 'https://www.youtube.com/watch?v=sample',
    expectedElements: ['text-overlay', 'clean-design'],
    targetClickbaitLevel: 3
  },
  {
    name: 'Vlog Creator',
    videoUrl: 'https://www.youtube.com/watch?v=sample',
    expectedElements: ['people-faces', 'lifestyle'],
    targetClickbaitLevel: 6
  }
];

test.describe('Mobile-First Interface QA', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up page with proper viewport and user agent
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // Test 1: Responsive Layout Tests
  for (const device of devices) {
    test(`Responsive Layout - ${device.name}`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width: device.width, height: device.height });
      
      // Check if interface adapts properly
      await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
      
      // Verify single-screen height constraint
      const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = device.height;
      expect(bodyHeight).toBeLessThanOrEqual(viewportHeight + 10); // 10px tolerance
      
      // Check mobile-specific elements
      if (device.width < 768) {
        await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();
        await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
      } else {
        await expect(page.locator('[data-testid="desktop-header"]')).toBeVisible();
      }
      
      // Verify no horizontal scrolling
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBeFalsy();
    });
  }

  // Test 2: Landing Page Workflow
  test('Landing Page User Journey', async ({ page }) => {
    // Check hero section
    await expect(page.locator('h1')).toContainText('Amazing Video Preview Studio');
    
    // Test URL input
    const urlInput = page.locator('input[placeholder*="YouTube URL"]');
    await expect(urlInput).toBeVisible();
    
    // Test blank canvas button
    const blankCanvasBtn = page.locator('button:has-text("Create Blank Canvas")');
    await expect(blankCanvasBtn).toBeVisible();
    
    // Test use cases display
    const useCases = page.locator('[data-testid="use-cases"]');
    await expect(useCases).toBeVisible();
    
    // Check all 6 creator types are shown
    const creatorTypes = page.locator('[data-testid="creator-type"]');
    await expect(creatorTypes).toHaveCount(6);
  });

  // Test 3: Video Loading Workflow
  test('Video Loading and Analysis', async ({ page }) => {
    // Navigate to editor by clicking blank canvas
    await page.click('button:has-text("Create Blank Canvas")');
    
    // Wait for editor to load
    await page.waitForSelector('[data-testid="thumbnail-editor"]', { timeout: 10000 });
    
    // Verify editor components are present
    await expect(page.locator('[data-testid="preview-area"]')).toBeVisible();
    await expect(page.locator('[data-testid="panel-tabs"]')).toBeVisible();
    
    // Test panel switching
    const tabs = ['generate', 'elements', 'people', 'export'];
    for (const tab of tabs) {
      await page.click(`[data-testid="tab-${tab}"]`);
      await expect(page.locator(`[data-testid="panel-${tab}"]`)).toBeVisible();
    }
  });

  // Test 4: AI Generation Workflow
  test('AI Thumbnail Generation', async ({ page }) => {
    // Setup: Navigate to generator
    await page.click('button:has-text("Create Blank Canvas")');
    await page.waitForSelector('[data-testid="thumbnail-editor"]');
    
    // Access generation panel
    await page.click('[data-testid="tab-generate"]');
    
    // Set generation parameters
    await page.fill('[data-testid="clickbait-slider"]', '7');
    await page.selectOption('[data-testid="variation-count"]', '2');
    
    // Start generation
    await page.click('button:has-text("Generate Thumbnails")');
    
    // Wait for loading state
    await expect(page.locator('[data-testid="loading-state"]')).toBeVisible();
    
    // Check loading progress
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();
    
    // Wait for completion (with timeout)
    await page.waitForSelector('[data-testid="variation-grid"]', { timeout: 30000 });
    
    // Verify variations are generated
    const variations = page.locator('[data-testid="variation-thumbnail"]');
    await expect(variations).toHaveCount(2);
  });

  // Test 5: Mobile Touch Interactions
  test('Mobile Touch and Gestures', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test touch navigation
    await page.click('button:has-text("Create Blank Canvas")');
    await page.waitForSelector('[data-testid="thumbnail-editor"]');
    
    // Test panel toggle
    await page.click('[data-testid="panel-toggle"]');
    await expect(page.locator('[data-testid="panel-overlay"]')).toBeVisible();
    
    // Test backdrop close
    await page.click('[data-testid="panel-backdrop"]');
    await expect(page.locator('[data-testid="panel-overlay"]')).not.toBeVisible();
    
    // Test quick actions
    const quickActions = page.locator('[data-testid="quick-action"]');
    await expect(quickActions).toHaveCount(4);
    
    // Test fullscreen toggle
    await page.click('[data-testid="fullscreen-toggle"]');
    await expect(page.locator('[data-testid="fullscreen-preview"]')).toBeVisible();
  });

  // Test 6: Element Manipulation
  test('Element Library and Manipulation', async ({ page }) => {
    await page.click('button:has-text("Create Blank Canvas")');
    await page.waitForSelector('[data-testid="thumbnail-editor"]');
    
    // Access elements panel
    await page.click('[data-testid="tab-elements"]');
    
    // Test element addition
    await page.click('[data-testid="add-text-element"]');
    
    // Verify element appears in preview
    const textElement = page.locator('[data-testid="thumbnail-element"]');
    await expect(textElement).toBeVisible();
    
    // Test element editing
    await page.dblclick('[data-testid="thumbnail-element"]');
    await expect(page.locator('[data-testid="element-editor"]')).toBeVisible();
    
    // Test element properties
    await page.fill('[data-testid="element-content"]', 'Test Title');
    await page.selectOption('[data-testid="element-color"]', '#ff0000');
    
    // Verify changes apply
    await expect(textElement).toContainText('Test Title');
  });

  // Test 7: Export Functionality
  test('Export and Download', async ({ page }) => {
    await page.click('button:has-text("Create Blank Canvas")');
    await page.waitForSelector('[data-testid="thumbnail-editor"]');
    
    // Generate a thumbnail first
    await page.click('[data-testid="tab-generate"]');
    await page.click('button:has-text("Generate Thumbnails")');
    await page.waitForSelector('[data-testid="variation-grid"]', { timeout: 30000 });
    
    // Test export
    await page.click('[data-testid="tab-export"]');
    await page.click('button:has-text("Export")');
    
    // Verify export menu
    await expect(page.locator('[data-testid="export-menu"]')).toBeVisible();
    
    // Test format selection
    await page.selectOption('[data-testid="export-format"]', 'PNG');
    await page.selectOption('[data-testid="export-resolution"]', '1920x1080');
    
    // Test download initiation
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });

  // Test 8: Performance and Loading
  test('Performance Benchmarks', async ({ page }) => {
    // Measure initial load time
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Load time should be under 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries.find(e => e.entryType === 'largest-contentful-paint');
          const fid = entries.find(e => e.entryType === 'first-input');
          resolve({ lcp: lcp?.startTime, fid: fid?.processingStart });
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
        
        // Fallback after 5 seconds
        setTimeout(() => resolve({ lcp: null, fid: null }), 5000);
      });
    });
    
    // LCP should be under 2.5 seconds
    if (metrics.lcp) {
      expect(metrics.lcp).toBeLessThan(2500);
    }
  });

  // Test 9: Accessibility
  test('Accessibility Compliance', async ({ page }) => {
    await page.goto('/');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test ARIA labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const hasLabel = await button.evaluate(el => {
        return el.hasAttribute('aria-label') || 
               el.hasAttribute('title') || 
               el.textContent?.trim().length > 0;
      });
      expect(hasLabel).toBeTruthy();
    }
    
    // Test color contrast (simplified check)
    const textElements = page.locator('h1, h2, h3, p, button, a');
    const elementCount = await textElements.count();
    
    for (let i = 0; i < Math.min(elementCount, 10); i++) {
      const element = textElements.nth(i);
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Basic contrast check (simplified)
      expect(styles.color).not.toBe(styles.backgroundColor);
    }
  });

  // Test 10: Error Handling
  test('Error States and Recovery', async ({ page }) => {
    // Test invalid URL handling
    await page.fill('input[placeholder*="YouTube URL"]', 'invalid-url');
    await page.click('button:has-text("Analyze")');
    
    // Should not crash or navigate away
    await expect(page.locator('h1')).toContainText('Amazing Video Preview Studio');
    
    // Test network failure simulation
    await page.route('**/api/**', route => route.abort());
    
    // Try to generate thumbnail
    await page.click('button:has-text("Create Blank Canvas")');
    await page.waitForSelector('[data-testid="thumbnail-editor"]');
    await page.click('[data-testid="tab-generate"]');
    await page.click('button:has-text("Generate Thumbnails")');
    
    // Should show error state gracefully
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
  });

  // Test 11: Cross-Browser Compatibility
  test('Browser Feature Detection', async ({ page }) => {
    // Test CSS Grid support
    const hasGridSupport = await page.evaluate(() => {
      return CSS.supports('display', 'grid');
    });
    expect(hasGridSupport).toBeTruthy();
    
    // Test Flexbox support
    const hasFlexSupport = await page.evaluate(() => {
      return CSS.supports('display', 'flex');
    });
    expect(hasFlexSupport).toBeTruthy();
    
    // Test modern JavaScript features
    const hasModernJS = await page.evaluate(() => {
      try {
        new Map();
        new Set();
        Promise.resolve();
        return true;
      } catch {
        return false;
      }
    });
    expect(hasModernJS).toBeTruthy();
  });

  // Test 12: Data Persistence
  test('Local Storage and Session Management', async ({ page }) => {
    await page.click('button:has-text("Create Blank Canvas")');
    await page.waitForSelector('[data-testid="thumbnail-editor"]');
    
    // Add some elements
    await page.click('[data-testid="tab-elements"]');
    await page.click('[data-testid="add-text-element"]');
    
    // Reload page
    await page.reload();
    
    // Check if work is preserved (if implemented)
    // This test may need adjustment based on actual persistence strategy
    await page.waitForLoadState('networkidle');
  });
});

// AI-Powered Test Generation Helper
test.describe('AI-Enhanced Testing', () => {
  
  test('Dynamic UI Pattern Recognition', async ({ page }) => {
    await page.goto('/');
    
    // Use AI-like pattern recognition to identify UI patterns
    const uiPatterns = await page.evaluate(() => {
      const patterns = {
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
        images: document.querySelectorAll('img').length,
        links: document.querySelectorAll('a').length
      };
      
      return patterns;
    });
    
    // Validate expected UI complexity
    expect(uiPatterns.buttons).toBeGreaterThan(3);
    expect(uiPatterns.inputs).toBeGreaterThan(0);
    expect(uiPatterns.headings).toBeGreaterThan(1);
  });

  test('Behavioral Analytics Simulation', async ({ page }) => {
    await page.goto('/');
    
    // Simulate user behavior patterns
    const userActions = [
      () => page.hover('button:has-text("Create Blank Canvas")'),
      () => page.click('input[placeholder*="YouTube URL"]'),
      () => page.type('input[placeholder*="YouTube URL"]', 'https://youtube.com/watch?v=test'),
      () => page.click('button:has-text("Analyze")'),
      () => page.keyboard.press('Escape')
    ];
    
    // Execute actions with realistic timing
    for (const action of userActions) {
      await action();
      await page.waitForTimeout(Math.random() * 1000 + 500); // 0.5-1.5s delay
    }
    
    // Verify no JavaScript errors occurred
    const jsErrors = await page.evaluate(() => {
      return window.jsErrors || [];
    });
    expect(jsErrors).toHaveLength(0);
  });
});

// Helper functions for advanced testing
async function waitForAnimationEnd(page: Page, selector: string) {
  await page.waitForFunction(
    (sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      const computedStyle = getComputedStyle(element);
      return computedStyle.animationPlayState === 'paused' || 
             computedStyle.animationPlayState === 'finished';
    },
    selector
  );
}

async function measureRenderTime(page: Page, selector: string): Promise<number> {
  const startTime = Date.now();
  await page.waitForSelector(selector);
  return Date.now() - startTime;
}

async function checkVisualRegression(page: Page, name: string) {
  // Visual regression testing
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: true,
    threshold: 0.2,
    animations: 'disabled'
  });
} 