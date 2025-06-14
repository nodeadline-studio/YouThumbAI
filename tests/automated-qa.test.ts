import { test, expect } from '@playwright/test';

// Automated QA Tests for YouThumbAI
// These tests run after each update to catch regressions

test.describe('YouThumbAI - Automated QA Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Long Title Handling', () => {
    
    test('should detect and offer AI optimization for long titles', async ({ page }) => {
      // Test with a long Russian title (like the one in screenshots)
      const longRussianTitle = 'Удар по Тель-Авиву, Утечка радиации в Иране, Иран выходит из сделки? Смагин, Мил-Ман, Филиппенко';
      
      // Enter a long title
      await page.fill('[data-testid="url-input"], input[placeholder*="YouTub"]', 'https://youtube.com/watch?v=test');
      
      // Mock video data with long title
      await page.evaluate((title) => {
        window.mockVideoData = {
          title: title,
          description: 'Test description',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          language: { code: 'ru', name: 'Russian', direction: 'ltr' },
          typography: { direction: 'ltr', fontFamily: 'Arial' }
        };
      }, longRussianTitle);
      
      // Wait for AI optimization section to appear
      await expect(page.locator('[data-testid="ai-title-optimization"]')).toBeVisible({ timeout: 10000 });
      
      // Check that optimization is offered for long titles
      await expect(page.locator('text=AI Title Optimization')).toBeVisible();
      await expect(page.locator('text=characters. AI can shorten')).toBeVisible();
      
      // Test AI optimization button
      await page.click('button:has-text("Optimize")');
      
      // Wait for optimization results
      await expect(page.locator('text=Optimized Title')).toBeVisible({ timeout: 15000 });
      
      // Verify shortened title is present
      const optimizedTitle = await page.locator('[data-testid="optimized-title"]').textContent();
      expect(optimizedTitle?.length).toBeLessThan(longRussianTitle.length);
    });

    test('should generate multiple title alternatives', async ({ page }) => {
      // Similar setup but focus on alternatives
      const longTitle = 'This is a very long title that should trigger AI optimization and generate multiple alternatives for better thumbnail display';
      
      await page.evaluate((title) => {
        window.mockVideoData = { title, language: { code: 'en' } };
      }, longTitle);
      
      await page.click('button:has-text("Optimize")');
      
      // Check for alternative versions
      await expect(page.locator('text=Alternative Versions')).toBeVisible({ timeout: 15000 });
      
      // Should have at least 3 alternatives
      const alternatives = await page.locator('[data-testid="title-alternative"]').count();
      expect(alternatives).toBeGreaterThanOrEqual(3);
    });

    test('should auto-generate elements from title suggestions', async ({ page }) => {
      const titleWithElements = 'TOP 5 SECRETS: How to Master YouTube in 2024! NEW Method Revealed';
      
      await page.evaluate((title) => {
        window.mockVideoData = { title, language: { code: 'en' } };
      }, titleWithElements);
      
      await page.click('button:has-text("Optimize")');
      await page.waitForSelector('text=Optimized Title', { timeout: 15000 });
      
      // Click "Add to Canvas" button
      await page.click('button:has-text("Add to Canvas")');
      
      // Verify elements were added to canvas
      await expect(page.locator('[data-testid="thumbnail-element"]')).toHaveCount({ min: 2 });
      
      // Check for specific element types
      await expect(page.locator('text=TOP 5')).toBeVisible(); // Number element
      await expect(page.locator('text=NEW')).toBeVisible(); // Accent element
    });
  });

  test.describe('Enhanced Text Editing', () => {
    
    test('should show sticky bounding box when editing text', async ({ page }) => {
      // Add a text element first
      await page.dragAndDrop('[data-testid="text-element"]', '[data-testid="thumbnail-canvas"]');
      
      // Double-click to edit
      await page.dblclick('[data-testid="thumbnail-element"]:first-child');
      
      // Check for sticky bounding box
      await expect(page.locator('.border-purple-400.bg-purple-900\\/20')).toBeVisible();
      
      // Check for enhanced textarea
      await expect(page.locator('textarea.min-w-\\[200px\\]')).toBeVisible();
      
      // Verify text controls are shown
      await expect(page.locator('text=chars')).toBeVisible();
      await expect(page.locator('text=Ctrl+Enter to save')).toBeVisible();
    });

    test('should handle long text with proper word wrapping', async ({ page }) => {
      const longText = 'This is a very long text that should wrap properly and show word highlighting when hovered over each individual word in the text element';
      
      // Add text element and edit it
      await page.dragAndDrop('[data-testid="text-element"]', '[data-testid="thumbnail-canvas"]');
      await page.dblclick('[data-testid="thumbnail-element"]:first-child');
      
      // Enter long text
      await page.fill('textarea', longText);
      await page.keyboard.press('Control+Enter');
      
      // Check word highlighting
      const words = longText.split(' ');
      for (let i = 0; i < Math.min(3, words.length); i++) {
        await page.hover(`text=${words[i]}`);
        await expect(page.locator(`text=${words[i]}`)).toHaveClass(/hover:bg-purple-500\/20/);
      }
    });

    test('should show enhanced controls for selected text elements', async ({ page }) => {
      // Add and select text element
      await page.dragAndDrop('[data-testid="text-element"]', '[data-testid="thumbnail-canvas"]');
      await page.click('[data-testid="thumbnail-element"]:first-child');
      
      // Check for enhanced control buttons
      await expect(page.locator('button[title="Duplicate (Ctrl+D)"]')).toBeVisible();
      await expect(page.locator('button[title="Edit Text (F2)"]')).toBeVisible();
      await expect(page.locator('button[title="Delete (Del)"]')).toBeVisible();
      
      // Check for text info badge
      await expect(page.locator('text=chars')).toBeVisible();
      await expect(page.locator('text=px')).toBeVisible();
      
      // Test edit button
      await page.click('button[title="Edit Text (F2)"]');
      await expect(page.locator('textarea')).toBeVisible();
    });

    test('should support keyboard shortcuts for text editing', async ({ page }) => {
      // Add text element
      await page.dragAndDrop('[data-testid="text-element"]', '[data-testid="thumbnail-canvas"]');
      await page.click('[data-testid="thumbnail-element"]:first-child');
      
      // Test F2 to edit
      await page.keyboard.press('F2');
      await expect(page.locator('textarea')).toBeVisible();
      
      // Test Escape to cancel
      await page.keyboard.press('Escape');
      await expect(page.locator('textarea')).not.toBeVisible();
      
      // Test Ctrl+D to duplicate
      await page.keyboard.press('Control+d');
      await expect(page.locator('[data-testid="thumbnail-element"]')).toHaveCount(2);
      
      // Test Delete key
      await page.keyboard.press('Delete');
      await expect(page.locator('[data-testid="thumbnail-element"]')).toHaveCount(1);
    });
  });

  test.describe('Russian Text Support', () => {
    
    test('should handle Cyrillic text properly', async ({ page }) => {
      const russianText = 'Привет мир! Это тест русского текста для проверки поддержки кириллицы.';
      
      await page.dragAndDrop('[data-testid="text-element"]', '[data-testid="thumbnail-canvas"]');
      await page.dblclick('[data-testid="thumbnail-element"]:first-child');
      
      await page.fill('textarea', russianText);
      await page.keyboard.press('Control+Enter');
      
      // Verify Russian text is displayed correctly
      await expect(page.locator(`text=${russianText}`)).toBeVisible();
      
      // Check font family includes Cyrillic support
      const element = page.locator('[data-testid="thumbnail-element"]:first-child');
      const fontFamily = await element.evaluate(el => getComputedStyle(el).fontFamily);
      expect(fontFamily).toContain('system-ui');
    });

    test('should optimize Russian titles correctly', async ({ page }) => {
      const longRussianTitle = 'Удар по Тель-Авиву, Утечка радиации в Иране, Иран выходит из сделки? Смагин, Мил-Ман, Филиппенко';
      
      await page.evaluate((title) => {
        window.mockVideoData = { 
          title, 
          language: { code: 'ru', name: 'Russian', direction: 'ltr' } 
        };
      }, longRussianTitle);
      
      await page.click('button:has-text("Optimize")');
      
      // Wait for Russian-optimized results
      await expect(page.locator('text=Optimized Title')).toBeVisible({ timeout: 15000 });
      
      // Check that optimization considers Cyrillic character width
      const optimizedTitle = await page.locator('[data-testid="optimized-title"]').textContent();
      expect(optimizedTitle).toBeTruthy();
      expect(optimizedTitle!.length).toBeLessThan(longRussianTitle.length);
      expect(optimizedTitle).toMatch(/[а-яё]/i); // Contains Cyrillic characters
    });
  });

  test.describe('Performance & Responsiveness', () => {
    
    test('should load and respond quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:5174');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
      
      // Test responsiveness
      await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
      await expect(page.locator('[data-testid="thumbnail-canvas"]')).toBeVisible();
      
      await page.setViewportSize({ width: 375, height: 667 }); // Mobile
      await expect(page.locator('[data-testid="thumbnail-canvas"]')).toBeVisible();
    });

    test('should handle multiple text elements without performance issues', async ({ page }) => {
      const startTime = Date.now();
      
      // Add 10 text elements
      for (let i = 0; i < 10; i++) {
        await page.dragAndDrop('[data-testid="text-element"]', '[data-testid="thumbnail-canvas"]');
        await page.waitForTimeout(100); // Small delay to prevent overwhelming
      }
      
      const addTime = Date.now() - startTime;
      expect(addTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Verify all elements are present
      await expect(page.locator('[data-testid="thumbnail-element"]')).toHaveCount(10);
      
      // Test selecting and editing performance
      const editStartTime = Date.now();
      await page.click('[data-testid="thumbnail-element"]:first-child');
      await page.keyboard.press('F2');
      await page.fill('textarea', 'Performance test text');
      await page.keyboard.press('Control+Enter');
      
      const editTime = Date.now() - editStartTime;
      expect(editTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  test.describe('Error Handling', () => {
    
    test('should handle AI service failures gracefully', async ({ page }) => {
      // Mock AI service failure
      await page.route('**/api/openai/**', route => {
        route.fulfill({ status: 500, body: 'Service unavailable' });
      });
      
      const longTitle = 'This is a long title that should trigger AI optimization';
      await page.evaluate((title) => {
        window.mockVideoData = { title, language: { code: 'en' } };
      }, longTitle);
      
      await page.click('button:has-text("Optimize")');
      
      // Should show fallback behavior
      await expect(page.locator('text=Optimized Title')).toBeVisible({ timeout: 10000 });
      
      // Should still provide basic truncation
      const fallbackTitle = await page.locator('[data-testid="optimized-title"]').textContent();
      expect(fallbackTitle?.length).toBeLessThan(longTitle.length);
    });

    test('should validate text input properly', async ({ page }) => {
      await page.dragAndDrop('[data-testid="text-element"]', '[data-testid="thumbnail-canvas"]');
      await page.dblclick('[data-testid="thumbnail-element"]:first-child');
      
      // Test empty text
      await page.fill('textarea', '');
      await page.keyboard.press('Control+Enter');
      
      // Should maintain placeholder or minimum content
      const element = page.locator('[data-testid="thumbnail-element"]:first-child');
      await expect(element).toBeVisible();
      
      // Test extremely long text
      const veryLongText = 'A'.repeat(1000);
      await page.dblclick('[data-testid="thumbnail-element"]:first-child');
      await page.fill('textarea', veryLongText);
      await page.keyboard.press('Control+Enter');
      
      // Should handle gracefully without breaking layout
      await expect(element).toBeVisible();
    });
  });
});

// Helper function to run QA after each update
export async function runAutomatedQA() {
  console.log('🤖 Running Automated QA Tests...');
  
  try {
    // This would integrate with your CI/CD pipeline
    const { execSync } = require('child_process');
    
    // Run the tests
    execSync('npx playwright test tests/automated-qa.test.ts', { 
      stdio: 'inherit',
      timeout: 300000 // 5 minutes timeout
    });
    
    console.log('✅ All QA tests passed!');
    return true;
  } catch (error) {
    console.error('❌ QA tests failed:', error);
    return false;
  }
} 