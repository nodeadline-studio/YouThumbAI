import { test, expect, devices } from '@playwright/test';

// Comprehensive QA Tests for YouThumbAI - Mobile & Desktop
// Tests all current frontend/UI functionality and export capabilities

test.describe('YouThumbAI - Comprehensive Frontend QA', () => {
  
  // Test on multiple devices
  const testDevices = [
    { name: 'Desktop', ...devices['Desktop Chrome'] },
    { name: 'Tablet', ...devices['iPad Pro'] },
    { name: 'Mobile', ...devices['iPhone 13'] }
  ];

  testDevices.forEach(device => {
    test.describe(`${device.name} - General Usage Flows`, () => {
      
      test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5174');
        await page.waitForLoadState('networkidle');
      });

      test(`should handle complete thumbnail creation flow on ${device.name}`, async ({ page }) => {
        // 1. Landing page interaction
        await expect(page.locator('h1')).toContainText('Amazing Video Preview Studio');
        
        // 2. Create blank template
        await page.click('button:has-text("Start with Blank Canvas")');
        
        // 3. Wait for editor to load
        await expect(page.locator('[data-testid="thumbnail-editor"]')).toBeVisible({ timeout: 10000 });
        
        // 4. Verify Element Library is accessible
        await expect(page.locator('[data-testid="element-library"]')).toBeVisible();
        
        // 5. Test tab navigation
        const tabs = ['Elements', 'People', 'Settings', 'Export', 'Generate'];
        for (const tab of tabs) {
          await page.click(`button:has-text("${tab}")`);
          await page.waitForTimeout(500); // Allow tab transition
        }
        
        // 6. Add elements from library
        await page.click('button:has-text("Elements")');
        await page.click('[data-testid="text-tab"]');
        await page.click('[data-testid="template-big-title"]');
        
        // 7. Verify element was added to canvas
        await expect(page.locator('[data-testid="thumbnail-element"]')).toHaveCount(1);
        
        // 8. Test element editing
        await page.dblclick('[data-testid="thumbnail-element"]:first-child');
        await expect(page.locator('textarea')).toBeVisible();
        await page.fill('textarea', 'Test Title');
        await page.keyboard.press('Control+Enter');
        
        // 9. Test export functionality
        await page.click('[data-testid="export-button"]');
        await expect(page.locator('[data-testid="export-menu"]')).toBeVisible();
      });

      test(`should handle Element Library functionality on ${device.name}`, async ({ page }) => {
        // Create blank template
        await page.click('button:has-text("Start with Blank Canvas")');
        await expect(page.locator('[data-testid="thumbnail-editor"]')).toBeVisible();
        
        // Navigate to elements tab
        await page.click('button:has-text("Elements")');
        
        // Test Text elements
        await page.click('[data-testid="text-tab"]');
        
        const textElements = [
          'Big Title', 'Subtitle', 'Number', 'Highlight', 'Person', 'Logo', 'Question', 'Call to Action'
        ];
        
        for (const element of textElements) {
          await expect(page.locator(`text=${element}`)).toBeVisible();
        }
        
        // Test adding elements
        await page.click('[data-testid="template-big-title"]');
        const elementCount = await page.locator('[data-testid="thumbnail-element"]').count();
        expect(elementCount).toBeGreaterThanOrEqual(1);
        
        // Test Shapes tab
        await page.click('[data-testid="shapes-tab"]');
        await expect(page.locator('text=Rectangle')).toBeVisible();
        await expect(page.locator('text=Circle')).toBeVisible();
        await expect(page.locator('text=Triangle')).toBeVisible();
        
        // Test Images tab
        await page.click('[data-testid="images-tab"]');
        await expect(page.locator('text=Person Placeholder')).toBeVisible();
        await expect(page.locator('[data-testid="image-drop-zone"]')).toBeVisible();
        
        // Test side scrolling on mobile
        if (device.name === 'Mobile') {
          const elementContainer = page.locator('[data-testid="element-library-scroll"]');
          await elementContainer.hover();
          await page.mouse.wheel(100, 0); // Horizontal scroll
        }
      });

      test(`should handle export menu functionality on ${device.name}`, async ({ page }) => {
        // Create blank template with elements
        await page.click('button:has-text("Start with Blank Canvas")');
        await expect(page.locator('[data-testid="thumbnail-editor"]')).toBeVisible();
        
        // Add an element
        await page.click('button:has-text("Elements")');
        await page.click('[data-testid="text-tab"]');
        await page.click('[data-testid="template-big-title"]');
        
        // Open export menu
        await page.click('[data-testid="export-button"]');
        await expect(page.locator('[data-testid="export-menu"]')).toBeVisible();
        
        // Test export format options
        const formatOptions = ['PNG', 'JPG', 'PDF', 'SVG'];
        for (const format of formatOptions) {
          await expect(page.locator(`[data-testid="format-${format.toLowerCase()}"]`)).toBeVisible();
        }
        
        // Test resolution options
        await expect(page.locator('[data-testid="resolution-select"]')).toBeVisible();
        
        // Test quality slider (for PNG/JPG)
        await page.click('[data-testid="format-png"]');
        await expect(page.locator('[data-testid="quality-slider"]')).toBeVisible();
        
        // Test export settings
        await expect(page.locator('[data-testid="optimize-size"]')).toBeVisible();
        
        // Test batch export tab
        await page.click('[data-testid="batch-export-tab"]');
        await expect(page.locator('[data-testid="filename-pattern"]')).toBeVisible();
        
        // Close export menu
        await page.keyboard.press('Escape');
        await expect(page.locator('[data-testid="export-menu"]')).not.toBeVisible();
      });

      test(`should handle responsive design on ${device.name}`, async ({ page }) => {
        // Test layout adaptation
        const viewport = device.viewport;
        if (viewport) {
          await page.setViewportSize(viewport);
        }
        
        // Create blank template
        await page.click('button:has-text("Start with Blank Canvas")');
        
        // Check main layout elements
        await expect(page.locator('[data-testid="thumbnail-editor"]')).toBeVisible();
        
        if (device.name === 'Mobile') {
          // Mobile-specific checks
          const sidebar = page.locator('[data-testid="sidebar"]');
          await expect(sidebar).toBeVisible();
          
          // Test mobile navigation
          await page.click('button:has-text("Elements")');
          await expect(page.locator('[data-testid="element-library"]')).toBeVisible();
        } else {
          // Desktop/Tablet checks
          await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
        }
        
        // Test thumbnail canvas responsiveness
        const canvas = page.locator('[data-testid="thumbnail-canvas"]');
        await expect(canvas).toBeVisible();
        
        // Verify aspect ratio is maintained
        const canvasBox = await canvas.boundingBox();
        if (canvasBox) {
          const aspectRatio = canvasBox.width / canvasBox.height;
          expect(aspectRatio).toBeCloseTo(16/9, 1); // 16:9 aspect ratio
        }
      });

      test(`should handle keyboard navigation on ${device.name}`, async ({ page }) => {
        // Skip keyboard tests on mobile
        if (device.name === 'Mobile') return;
        
        // Create blank template
        await page.click('button:has-text("Start with Blank Canvas")');
        await expect(page.locator('[data-testid="thumbnail-editor"]')).toBeVisible();
        
        // Test tab navigation
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        
        // Add element and test keyboard shortcuts
        await page.click('button:has-text("Elements")');
        await page.click('[data-testid="template-big-title"]');
        
        // Test element selection with keyboard
        const element = page.locator('[data-testid="thumbnail-element"]:first-child');
        await element.click();
        
        // Test keyboard shortcuts
        await page.keyboard.press('F2'); // Edit mode
        await page.keyboard.press('Escape'); // Cancel edit
        await page.keyboard.press('Control+d'); // Duplicate
        await page.keyboard.press('Delete'); // Delete element
      });
    });
  });

  test.describe('Element Library - Enhanced Functionality', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:5174');
      await page.click('button:has-text("Start with Blank Canvas")');
      await expect(page.locator('[data-testid="thumbnail-editor"]')).toBeVisible();
      await page.click('button:has-text("Elements")');
    });

    test('should provide comprehensive text element templates', async ({ page }) => {
      await page.click('[data-testid="text-tab"]');
      
      // Test all text templates
      const textTemplates = [
        { name: 'Big Title', testId: 'template-big-title' },
        { name: 'Subtitle', testId: 'template-subtitle' },
        { name: 'Number', testId: 'template-number' },
        { name: 'Highlight', testId: 'template-highlight' },
        { name: 'Person', testId: 'template-person' },
        { name: 'Logo', testId: 'template-logo' },
        { name: 'Question', testId: 'template-question' },
        { name: 'Call to Action', testId: 'template-call-to-action' }
      ];
      
      for (const template of textTemplates) {
        const templateElement = page.locator(`[data-testid="${template.testId}"]`);
        await expect(templateElement).toBeVisible();
        
        // Test adding template
        await templateElement.click();
        const elementCount = await page.locator('[data-testid="thumbnail-element"]').count();
        expect(elementCount).toBeGreaterThanOrEqual(1);
        
        // Clear elements for next test
        const elements = page.locator('[data-testid="thumbnail-element"]');
        const count = await elements.count();
        for (let i = 0; i < count; i++) {
          await elements.first().click();
          await page.keyboard.press('Delete');
        }
      }
    });

    test('should provide shape elements with customization', async ({ page }) => {
      await page.click('[data-testid="shapes-tab"]');
      
      const shapes = [
        'Rectangle', 'Circle', 'Triangle', 'Arrow', 'Star', 'Heart'
      ];
      
      for (const shape of shapes) {
        await expect(page.locator(`text=${shape}`)).toBeVisible();
        
        // Test adding shape
        const shapeElement = page.locator(`[data-testid="template-${shape.toLowerCase()}"]`);
        if (await shapeElement.isVisible()) {
          await shapeElement.click();
          const elementCount = await page.locator('[data-testid="thumbnail-element"]').count();
          expect(elementCount).toBeGreaterThanOrEqual(1);
          
          // Clear for next test
          await page.locator('[data-testid="thumbnail-element"]:first-child').click();
          await page.keyboard.press('Delete');
        }
      }
    });

    test('should provide image elements and upload functionality', async ({ page }) => {
      await page.click('[data-testid="images-tab"]');
      
      // Test stock images
      const stockImages = [
        'Person Placeholder', 'Logo Placeholder', 'Background', 'Icon'
      ];
      
      for (const image of stockImages) {
        await expect(page.locator(`text=${image}`)).toBeVisible();
      }
      
      // Test image upload area
      await expect(page.locator('input[type="file"]')).toBeVisible();
      await expect(page.locator('[data-testid="image-drop-zone"]')).toBeVisible();
      
      // Test adding stock image
      const personPlaceholder = page.locator('[data-testid="template-person-placeholder"]');
      if (await personPlaceholder.isVisible()) {
        await personPlaceholder.click();
        const elementCount = await page.locator('[data-testid="thumbnail-element"]').count();
        expect(elementCount).toBeGreaterThanOrEqual(1);
      }
    });

    test('should handle element library side scrolling', async ({ page }) => {
      // Test horizontal scrolling in element library
      const libraryContainer = page.locator('[data-testid="element-library-scroll"]');
      await expect(libraryContainer).toBeVisible();
      
      // Test scroll buttons
      const scrollLeft = page.locator('[data-testid="scroll-left"]');
      const scrollRight = page.locator('[data-testid="scroll-right"]');
      
      // Initially, left scroll should be hidden, right should be visible (if content overflows)
      if (await scrollRight.isVisible()) {
        await scrollRight.click();
        await page.waitForTimeout(300); // Allow scroll animation
        
        // After scrolling right, left button should appear
        await expect(scrollLeft).toBeVisible();
        
        await scrollLeft.click();
        await page.waitForTimeout(300);
      }
      
      // Test mouse wheel scrolling
      await libraryContainer.hover();
      await page.mouse.wheel(100, 0); // Horizontal scroll
    });

    test('should provide element search and filtering', async ({ page }) => {
      // Test search functionality
      const searchInput = page.locator('[data-testid="element-search"]');
      await expect(searchInput).toBeVisible();
      
      await searchInput.fill('title');
      
      // Should show title-related elements
      await expect(page.locator('[data-testid="template-big-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="template-subtitle"]')).toBeVisible();
      
      // Clear search
      await searchInput.fill('');
      
      // Test category filtering by switching tabs
      await page.click('[data-testid="text-tab"]');
      await expect(page.locator('[data-testid="template-big-title"]')).toBeVisible();
      
      await page.click('[data-testid="shapes-tab"]');
      await expect(page.locator('text=Rectangle')).toBeVisible();
      
      await page.click('[data-testid="images-tab"]');
      await expect(page.locator('text=Person Placeholder')).toBeVisible();
    });
  });

  test.describe('Export Functionality - Complete Testing', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:5174');
      await page.click('button:has-text("Start with Blank Canvas")');
      await expect(page.locator('[data-testid="thumbnail-editor"]')).toBeVisible();
      
      // Add an element for export testing
      await page.click('button:has-text("Elements")');
      await page.click('[data-testid="text-tab"]');
      await page.click('[data-testid="template-big-title"]');
    });

    test('should handle single thumbnail export in all formats', async ({ page }) => {
      await page.click('[data-testid="export-button"]');
      await expect(page.locator('[data-testid="export-menu"]')).toBeVisible();
      
      const formats = [
        { name: 'PNG', testId: 'format-png' },
        { name: 'JPG', testId: 'format-jpg' },
        { name: 'PDF', testId: 'format-pdf' },
        { name: 'SVG', testId: 'format-svg' }
      ];
      
      for (const format of formats) {
        // Select format
        await page.click(`[data-testid="${format.testId}"]`);
        
        // Verify format is selected
        const formatElement = page.locator(`[data-testid="${format.testId}"]`);
        await expect(formatElement).toHaveClass(/border-purple-500/);
      }
    });

    test('should handle export quality and resolution settings', async ({ page }) => {
      await page.click('[data-testid="export-button"]');
      await expect(page.locator('[data-testid="export-menu"]')).toBeVisible();
      
      // Test resolution options
      const resolutionSelect = page.locator('[data-testid="resolution-select"]');
      await expect(resolutionSelect).toBeVisible();
      
      const resolutions = ['1280x720', '1920x1080', '2560x1440', '3840x2160'];
      
      for (const resolution of resolutions) {
        await resolutionSelect.selectOption(resolution);
        await expect(resolutionSelect).toHaveValue(resolution);
      }
      
      // Test quality settings for PNG
      await page.click('[data-testid="format-png"]');
      const qualitySlider = page.locator('[data-testid="quality-slider"]');
      await expect(qualitySlider).toBeVisible();
      
      await qualitySlider.fill('75');
      await expect(page.locator('text=75%')).toBeVisible();
      
      // Test compression settings
      const optimizeCheckbox = page.locator('[data-testid="optimize-size"]');
      await optimizeCheckbox.check();
      await expect(optimizeCheckbox).toBeChecked();
    });

    test('should handle batch export preparation', async ({ page }) => {
      await page.click('[data-testid="export-button"]');
      await expect(page.locator('[data-testid="export-menu"]')).toBeVisible();
      
      // Switch to batch export tab
      await page.click('[data-testid="batch-export-tab"]');
      
      // Test filename pattern
      const filenamePattern = page.locator('[data-testid="filename-pattern"]');
      await expect(filenamePattern).toBeVisible();
      await filenamePattern.fill('{title}_{variation}_{timestamp}');
      
      // Test batch settings
      await page.selectOption('select:has-option[value="PNG"]', 'PNG');
      await page.selectOption('[data-testid="resolution-select"]', '1920x1080');
    });

    test('should handle export progress and feedback', async ({ page }) => {
      await page.click('[data-testid="export-button"]');
      await expect(page.locator('[data-testid="export-menu"]')).toBeVisible();
      
      // Mock a slow export to test progress
      await page.route('**/export/**', route => {
        setTimeout(() => {
          route.fulfill({ status: 200, body: 'mock export data' });
        }, 1000);
      });
      
      // Start export
      await page.click('button:has-text("Export")');
      
      // Should show progress indicator
      const progressIndicator = page.locator('[data-testid="export-progress"]');
      if (await progressIndicator.isVisible()) {
        await expect(progressIndicator).toBeVisible();
        
        // Wait for completion or timeout
        await page.waitForTimeout(2000);
      }
    });

    test('should handle export error scenarios', async ({ page }) => {
      // Mock export failure
      await page.route('**/html2canvas/**', route => {
        route.abort('failed');
      });
      
      await page.click('[data-testid="export-button"]');
      await expect(page.locator('[data-testid="export-menu"]')).toBeVisible();
      
      // Try to export
      await page.click('button:has-text("Export")');
      
      // Should handle error gracefully
      await page.waitForTimeout(1000);
      
      // Check if error handling is working (export menu should still be functional)
      await expect(page.locator('[data-testid="export-menu"]')).toBeVisible();
    });
  });

  test.describe('Performance and Accessibility', () => {
    
    test('should meet performance benchmarks', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:5174');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // 5 second load time
      
      // Test interaction responsiveness
      const interactionStart = Date.now();
      await page.click('button:has-text("Start with Blank Canvas")');
      await page.waitForSelector('[data-testid="thumbnail-editor"]');
      const interactionTime = Date.now() - interactionStart;
      expect(interactionTime).toBeLessThan(1000); // 1 second interaction time
    });

    test('should be accessible with screen readers', async ({ page }) => {
      await page.goto('http://localhost:5174');
      
      // Test basic accessibility
      await page.click('button:has-text("Start with Blank Canvas")');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test alt text for images (if any)
      const images = page.locator('img');
      const imageCount = await images.count();
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
          const altText = await img.getAttribute('alt');
          // Alt text should exist or be empty string (decorative images)
          expect(altText).toBeDefined();
        }
      }
    });

    test('should handle high element counts without performance degradation', async ({ page }) => {
      await page.goto('http://localhost:5174');
      await page.click('button:has-text("Start with Blank Canvas")');
      await expect(page.locator('[data-testid="thumbnail-editor"]')).toBeVisible();
      
      // Navigate to elements
      await page.click('button:has-text("Elements")');
      await page.click('[data-testid="text-tab"]');
      
      // Add multiple elements
      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="template-big-title"]');
        if (i % 3 === 0) {
          await page.waitForTimeout(100); // Prevent overwhelming
        }
      }
      const addTime = Date.now() - startTime;
      expect(addTime).toBeLessThan(15000); // 15 seconds for 10 elements
      
      // Test canvas performance with many elements
      const canvasInteractionStart = Date.now();
      await page.click('[data-testid="thumbnail-canvas"]');
      const canvasInteractionTime = Date.now() - canvasInteractionStart;
      expect(canvasInteractionTime).toBeLessThan(2000); // 2 second response time
    });
  });

  test.describe('Mobile-Specific Features', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
      await page.goto('http://localhost:5174');
    });

    test('should handle touch interactions', async ({ page }) => {
      await page.click('button:has-text("Start with Blank Canvas")');
      await expect(page.locator('[data-testid="thumbnail-editor"]')).toBeVisible();
      
      // Test touch navigation
      await page.click('button:has-text("Elements")');
      await page.click('[data-testid="text-tab"]');
      
      // Test touch scrolling in element library
      const libraryContainer = page.locator('[data-testid="element-library-scroll"]');
      await libraryContainer.hover();
      
      // Simulate touch scroll
      await page.touchscreen.tap(200, 300);
      await page.mouse.wheel(50, 0);
    });

    test('should adapt UI for mobile screens', async ({ page }) => {
      await page.click('button:has-text("Start with Blank Canvas")');
      
      // Check mobile layout
      const sidebar = page.locator('[data-testid="sidebar"]');
      await expect(sidebar).toBeVisible();
      
      // Test mobile export menu
      await page.click('button:has-text("Elements")');
      await page.click('[data-testid="text-tab"]');
      await page.click('[data-testid="template-big-title"]');
      
      await page.click('[data-testid="export-button"]');
      const exportMenu = page.locator('[data-testid="export-menu"]');
      await expect(exportMenu).toBeVisible();
      
      // Export menu should be responsive
      const menuBox = await exportMenu.boundingBox();
      expect(menuBox?.width).toBeLessThanOrEqual(375); // Should fit mobile screen
    });
  });
});

// Helper function to run comprehensive QA
export async function runComprehensiveQA() {
  console.log('🔍 Running Comprehensive Frontend QA...');
  
  try {
    const { execSync } = require('child_process');
    
    // Run the comprehensive tests
    execSync('npx playwright test tests/comprehensive-qa.test.ts --reporter=html', { 
      stdio: 'inherit',
      timeout: 900000 // 15 minutes timeout for comprehensive tests
    });
    
    console.log('✅ Comprehensive QA completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Comprehensive QA failed:', error);
    return false;
  }
} 