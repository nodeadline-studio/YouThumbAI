import { test, expect, Page } from '@playwright/test';

// Test configuration
const testConfig = {
  baseURL: 'http://localhost:5173',
  timeout: 90000, // Extended timeout for AI generation
  screenshots: {
    mode: 'only-on-failure',
    fullPage: true
  }
};

// Test data
const sampleVideoUrls = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Multi-face content
  'https://www.youtube.com/watch?v=jNQXAC9IVRw', // Gaming content
  'https://www.youtube.com/watch?v=9bZkp7q19f0' // Educational content
];

const testLanguages = ['en', 'es', 'ru', 'ja', 'ar', 'hi'];
const testLoraStyles = ['cyberpunk80s', 'anime', 'watercolor', 'comic'];

// Enhanced Generation Test Suite
test.describe('Enhanced Generation Features', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Local Video Analysis', () => {
    
    test('should enable enhanced mode when video file uploaded', async ({ page }) => {
      // Create mock video file
      const mockVideoFile = await page.evaluateHandle(() => {
        const blob = new Blob(['mock video content'], { type: 'video/mp4' });
        return new File([blob], 'test-video.mp4', { type: 'video/mp4' });
      });

      // Upload video file
      await page.locator('input[type="file"][accept*="video"]').setInputFiles([
        {
          name: 'test-video.mp4',
          mimeType: 'video/mp4',
          buffer: Buffer.from('mock video content')
        }
      ]);

      // Check enhanced mode is enabled
      await expect(page.locator('[data-testid="enhanced-mode-toggle"]')).toBeChecked();
      await expect(page.locator('[data-testid="enhanced-options-panel"]')).toBeVisible();
    });

    test('should analyze video screenshots for faces', async ({ page }) => {
      // Upload test screenshots
      const mockScreenshots = Array.from({ length: 5 }, (_, i) => ({
        name: `screenshot-${i}.jpg`,
        mimeType: 'image/jpeg',
        buffer: Buffer.from(`mock image content ${i}`)
      }));

      await page.locator('input[type="file"][accept*="image"]').setInputFiles(mockScreenshots);

      // Wait for face analysis
      await page.locator('[data-testid="analyze-faces-btn"]').click();
      await page.waitForSelector('[data-testid="extracted-faces-list"]', { timeout: 30000 });

      // Verify faces detected
      const facesCount = await page.locator('[data-testid="face-item"]').count();
      expect(facesCount).toBeGreaterThan(0);
      expect(facesCount).toBeLessThanOrEqual(10);
    });

    test('should process screenshots without server upload', async ({ page }) => {
      // Monitor network requests
      const uploadRequests = [];
      page.on('request', req => {
        if (req.url().includes('upload') || req.method() === 'POST') {
          uploadRequests.push(req.url());
        }
      });

      // Upload screenshots
      await page.locator('input[type="file"][accept*="image"]').setInputFiles([
        {
          name: 'test-screenshot.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('mock image content')
        }
      ]);

      // Process locally
      await page.locator('[data-testid="process-local-btn"]').click();
      await page.waitForTimeout(5000);

      // Verify no upload requests made
      const videoUploadRequests = uploadRequests.filter(url => 
        url.includes('video') || url.includes('upload')
      );
      expect(videoUploadRequests).toHaveLength(0);
    });

    test('should extract color palette from screenshots', async ({ page }) => {
      await page.locator('input[type="file"][accept*="image"]').setInputFiles([
        {
          name: 'colorful-screenshot.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('mock colorful image')
        }
      ]);

      await page.locator('[data-testid="extract-colors-btn"]').click();
      await page.waitForSelector('[data-testid="color-palette"]');

      const colors = await page.locator('[data-testid="color-item"]').count();
      expect(colors).toBeGreaterThanOrEqual(3);
      expect(colors).toBeLessThanOrEqual(8);
    });

  });

  test.describe('Multi-Language Support', () => {
    
    test('should display available languages dynamically', async ({ page }) => {
      await page.locator('[data-testid="language-selector"]').click();
      await page.waitForSelector('[data-testid="language-options"]');

      // Check for dynamic language loading
      const languageCount = await page.locator('[data-testid="language-option"]').count();
      expect(languageCount).toBeGreaterThan(10); // Should support many languages
      
      // Verify key languages present
      for (const lang of testLanguages) {
        await expect(page.locator(`[data-testid="language-option-${lang}"]`)).toBeVisible();
      }
    });

    test('should support RTL languages', async ({ page }) => {
      // Select Arabic language
      await page.locator('[data-testid="language-selector"]').click();
      await page.locator('[data-testid="language-option-ar"]').click();

      // Check RTL text direction
      const textElement = page.locator('[data-testid="text-element-input"]').first();
      await expect(textElement).toHaveCSS('direction', 'rtl');
      
      // Verify Arabic font loading
      await expect(textElement).toHaveCSS('font-family', /Arabic|Noto|Cairo/);
    });

    test('should perform spell checking', async ({ page }) => {
      // Enable enhanced mode
      await page.locator('[data-testid="enhanced-mode-toggle"]').check();
      
      // Enter text with intentional spelling errors
      await page.locator('[data-testid="text-element-input"]').fill('Helo Wrold! This is a tset.');
      await page.locator('[data-testid="spell-check-btn"]').click();

      // Wait for spell check results
      await page.waitForSelector('[data-testid="spell-check-results"]', { timeout: 15000 });
      
      // Verify corrections suggested
      const corrections = await page.locator('[data-testid="spelling-correction"]').count();
      expect(corrections).toBeGreaterThan(0);
    });

    test('should generate multi-language thumbnails', async ({ page }) => {
      // Enable enhanced mode
      await page.locator('[data-testid="enhanced-mode-toggle"]').check();
      
      // Select multiple languages
      await page.locator('[data-testid="language-selector"]').click();
      await page.locator('[data-testid="language-option-en"]').click();
      await page.locator('[data-testid="language-option-es"]').click();
      await page.locator('[data-testid="language-option-ru"]').click();

      // Add text element
      await page.locator('[data-testid="add-text-btn"]').click();
      await page.locator('[data-testid="text-element-input"]').fill('Amazing Video Title');

      // Generate thumbnails
      await page.locator('[data-testid="generate-btn"]').click();
      await page.waitForSelector('[data-testid="thumbnail-variations"]', { timeout: 60000 });

      // Verify multiple language variations
      const variations = await page.locator('[data-testid="thumbnail-variation"]').count();
      expect(variations).toBeGreaterThanOrEqual(3); // At least one per language
      
      // Check language labels
      await expect(page.locator('[data-testid="variation-label"]').filter({ hasText: 'English' })).toBeVisible();
      await expect(page.locator('[data-testid="variation-label"]').filter({ hasText: 'Spanish' })).toBeVisible();
      await expect(page.locator('[data-testid="variation-label"]').filter({ hasText: 'Russian' })).toBeVisible();
    });

  });

  test.describe('Advanced Face Features', () => {
    
    test('should extract multiple faces from images', async ({ page }) => {
      // Upload image with multiple faces
      await page.locator('input[type="file"][accept*="image"]').setInputFiles([
        {
          name: 'group-photo.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('mock group photo with multiple faces')
        }
      ]);

      await page.locator('[data-testid="extract-faces-btn"]').click();
      await page.waitForSelector('[data-testid="extracted-faces-grid"]', { timeout: 30000 });

      // Verify multiple faces extracted
      const faces = await page.locator('[data-testid="face-item"]').count();
      expect(faces).toBeGreaterThan(1);
      expect(faces).toBeLessThanOrEqual(10);
      
      // Check face confidence scores
      const firstFace = page.locator('[data-testid="face-item"]').first();
      const confidence = await firstFace.locator('[data-testid="face-confidence"]').textContent();
      expect(parseFloat(confidence!)).toBeGreaterThan(0.5);
    });

    test('should support different face swap models', async ({ page }) => {
      // Enable face swap
      await page.locator('[data-testid="face-swap-toggle"]').check();
      
      // Test each face swap model
      const models = ['instantId', 'faceToMany', 'faceToSticker'];
      
      for (const model of models) {
        await page.locator('[data-testid="face-swap-model-selector"]').selectOption(model);
        
        // Generate with face swap
        await page.locator('[data-testid="generate-btn"]').click();
        await page.waitForSelector('[data-testid="thumbnail-variations"]', { timeout: 60000 });
        
        // Verify generation completed
        const variations = await page.locator('[data-testid="thumbnail-variation"]').count();
        expect(variations).toBeGreaterThan(0);
        
        // Check model indicator
        await expect(page.locator(`[data-testid="model-indicator-${model}"]`)).toBeVisible();
      }
    });

    test('should maintain face quality after swap', async ({ page }) => {
      // Upload source face
      await page.locator('[data-testid="source-face-upload"]').setInputFiles([
        {
          name: 'source-face.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('mock source face')
        }
      ]);

      // Enable face swap with quality metrics
      await page.locator('[data-testid="face-swap-toggle"]').check();
      await page.locator('[data-testid="quality-check-toggle"]').check();

      await page.locator('[data-testid="generate-btn"]').click();
      await page.waitForSelector('[data-testid="quality-metrics"]', { timeout: 90000 });

      // Check quality scores
      const faceQuality = await page.locator('[data-testid="face-quality-score"]').textContent();
      const overallQuality = await page.locator('[data-testid="overall-quality-score"]').textContent();
      
      expect(parseFloat(faceQuality!)).toBeGreaterThan(0.7);
      expect(parseFloat(overallQuality!)).toBeGreaterThan(0.75);
    });

  });

  test.describe('LoRA Style Models', () => {
    
    test('should load available LoRA styles', async ({ page }) => {
      await page.locator('[data-testid="style-selector"]').click();
      await page.waitForSelector('[data-testid="lora-styles-grid"]');

      // Verify style categories
      const styleCategories = await page.locator('[data-testid="style-category"]').count();
      expect(styleCategories).toBeGreaterThan(5);
      
      // Check for popular styles
      for (const style of testLoraStyles) {
        await expect(page.locator(`[data-testid="style-${style}"]`)).toBeVisible();
      }
    });

    test('should generate with different LoRA styles', async ({ page }) => {
      // Test each LoRA style
      for (const style of testLoraStyles) {
        await page.locator('[data-testid="style-selector"]').click();
        await page.locator(`[data-testid="style-${style}"]`).click();
        
        // Add some text for style context
        await page.locator('[data-testid="add-text-btn"]').click();
        await page.locator('[data-testid="text-element-input"]').fill(`${style} style test`);

        // Generate with LoRA
        await page.locator('[data-testid="generate-btn"]').click();
        await page.waitForSelector('[data-testid="thumbnail-variations"]', { timeout: 120000 });

        // Verify style applied
        const styleIndicator = page.locator(`[data-testid="applied-style-${style}"]`);
        await expect(styleIndicator).toBeVisible();
        
        // Check generation metadata
        const metadata = await page.locator('[data-testid="generation-metadata"]').textContent();
        expect(metadata).toContain(style);
      }
    });

    test('should handle LoRA model failures gracefully', async ({ page }) => {
      // Select a non-existent LoRA model
      await page.evaluate(() => {
        // Inject invalid LoRA model for testing
        window.testInvalidLora = true;
      });

      await page.locator('[data-testid="style-selector"]').click();
      await page.locator('[data-testid="style-invalid-test"]').click();

      // Attempt generation
      await page.locator('[data-testid="generate-btn"]').click();
      
      // Should fallback to standard generation
      await page.waitForSelector('[data-testid="fallback-message"]', { timeout: 30000 });
      await expect(page.locator('[data-testid="fallback-message"]')).toContainText('fallback');
      
      // Verify generation still completes
      await page.waitForSelector('[data-testid="thumbnail-variations"]');
      const variations = await page.locator('[data-testid="thumbnail-variation"]').count();
      expect(variations).toBeGreaterThan(0);
    });

  });

  test.describe('Cost Optimization', () => {
    
    test('should display cost estimates', async ({ page }) => {
      // Enable enhanced mode
      await page.locator('[data-testid="enhanced-mode-toggle"]').check();
      
      // Configure options that affect cost
      await page.locator('[data-testid="language-selector"]').click();
      await page.locator('[data-testid="language-option-en"]').click();
      await page.locator('[data-testid="language-option-es"]').click();
      
      await page.locator('[data-testid="face-swap-toggle"]').check();
      await page.locator('[data-testid="lora-style-toggle"]').check();

      // Check cost estimate updates
      await page.waitForSelector('[data-testid="cost-estimate"]');
      const costText = await page.locator('[data-testid="cost-estimate"]').textContent();
      
      expect(costText).toMatch(/\$0\.\d{2,3}/); // Should show cost in dollars
      
      const cost = parseFloat(costText!.replace('$', ''));
      expect(cost).toBeGreaterThan(0.04); // Base DALL-E cost
      expect(cost).toBeLessThan(0.20); // Reasonable upper limit
    });

    test('should respect cost optimization settings', async ({ page }) => {
      const optimizationModes = ['economy', 'standard', 'premium'];
      
      for (const mode of optimizationModes) {
        await page.locator('[data-testid="cost-optimization-selector"]').selectOption(mode);
        
        const estimate = await page.locator('[data-testid="cost-estimate"]').textContent();
        const cost = parseFloat(estimate!.replace('$', ''));
        
        // Economy should be cheapest, premium most expensive
        if (mode === 'economy') {
          expect(cost).toBeLessThan(0.08);
        } else if (mode === 'premium') {
          expect(cost).toBeGreaterThan(0.10);
        }
      }
    });

  });

  test.describe('Mobile-First UX', () => {
    
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Test enhanced features on mobile
      await page.locator('[data-testid="enhanced-mode-toggle"]').check();
      
      // Verify mobile-optimized controls
      await expect(page.locator('[data-testid="mobile-controls-panel"]')).toBeVisible();
      
      // Test touch interactions
      await page.locator('[data-testid="screenshot-upload-mobile"]').click();
      await expect(page.locator('[data-testid="upload-modal-mobile"]')).toBeVisible();
      
      // Test generation on mobile
      await page.locator('[data-testid="generate-btn-mobile"]').click();
      await page.waitForSelector('[data-testid="mobile-variations-carousel"]', { timeout: 60000 });
      
      // Verify swipe navigation works
      const carousel = page.locator('[data-testid="mobile-variations-carousel"]');
      await expect(carousel).toHaveAttribute('data-swipeable', 'true');
    });

    test('should optimize for one-handed operation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // All main actions should be in bottom 50% of screen
      const actionButtons = [
        '[data-testid="generate-btn-mobile"]',
        '[data-testid="add-text-btn-mobile"]',
        '[data-testid="face-extract-btn-mobile"]'
      ];
      
      for (const button of actionButtons) {
        const bbox = await page.locator(button).boundingBox();
        expect(bbox!.y).toBeGreaterThan(333); // Bottom half of 667px screen
      }
    });

  });

  test.describe('Performance & Quality', () => {
    
    test('should complete enhanced generation within timeout', async ({ page }) => {
      const startTime = Date.now();
      
      // Configure full enhanced generation
      await page.locator('[data-testid="enhanced-mode-toggle"]').check();
      await page.locator('[data-testid="language-option-en"]').click();
      await page.locator('[data-testid="face-swap-toggle"]').check();
      await page.locator('[data-testid="lora-style-cyberpunk80s"]').click();
      
      // Generate
      await page.locator('[data-testid="generate-btn"]').click();
      await page.waitForSelector('[data-testid="thumbnail-variations"]', { timeout: 120000 });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 2 minutes for enhanced generation
      expect(duration).toBeLessThan(120000);
    });

    test('should maintain quality across features', async ({ page }) => {
      // Generate with all enhanced features
      await page.locator('[data-testid="enhanced-mode-toggle"]').check();
      
      // Upload quality test data
      await page.locator('[data-testid="video-screenshot-upload"]').setInputFiles([
        {
          name: 'high-quality-screenshot.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('mock high quality image')
        }
      ]);
      
      await page.locator('[data-testid="generate-btn"]').click();
      await page.waitForSelector('[data-testid="quality-report"]', { timeout: 90000 });
      
      // Check quality metrics
      const qualityScore = await page.locator('[data-testid="overall-quality-score"]').textContent();
      expect(parseFloat(qualityScore!)).toBeGreaterThan(0.8);
      
      // Verify image resolution
      const firstThumbnail = page.locator('[data-testid="thumbnail-variation"]').first();
      const imgElement = firstThumbnail.locator('img');
      const naturalWidth = await imgElement.evaluate(img => (img as HTMLImageElement).naturalWidth);
      const naturalHeight = await imgElement.evaluate(img => (img as HTMLImageElement).naturalHeight);
      
      expect(naturalWidth).toBeGreaterThanOrEqual(1024);
      expect(naturalHeight).toBeGreaterThanOrEqual(576); // 16:9 aspect ratio minimum
    });

  });

  test.describe('Error Handling & Resilience', () => {
    
    test('should handle API failures gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('**/api.openai.com/**', route => {
        route.fulfill({ status: 429, body: 'Rate limit exceeded' });
      });
      
      await page.locator('[data-testid="generate-btn"]').click();
      
      // Should show user-friendly error
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 15000 });
      const errorText = await page.locator('[data-testid="error-message"]').textContent();
      
      expect(errorText).toContain('rate limit');
      expect(errorText).toContain('try again');
      
      // Should offer retry option
      await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
    });

    test('should validate file uploads', async ({ page }) => {
      // Test invalid file types
      const invalidFiles = [
        { name: 'test.txt', type: 'text/plain' },
        { name: 'test.pdf', type: 'application/pdf' },
        { name: 'test.exe', type: 'application/x-executable' }
      ];
      
      for (const file of invalidFiles) {
        await page.locator('[data-testid="video-upload"]').setInputFiles([
          {
            name: file.name,
            mimeType: file.type,
            buffer: Buffer.from('invalid file content')
          }
        ]);
        
        // Should show validation error
        await expect(page.locator('[data-testid="file-validation-error"]')).toBeVisible();
        
        const errorText = await page.locator('[data-testid="file-validation-error"]').textContent();
        expect(errorText).toContain('supported format');
      }
    });

    test('should handle network interruptions', async ({ page }) => {
      // Start generation
      await page.locator('[data-testid="generate-btn"]').click();
      
      // Simulate network interruption
      await page.setOffline(true);
      await page.waitForTimeout(5000);
      await page.setOffline(false);
      
      // Should recover and complete or show retry option
      const isCompleted = await page.locator('[data-testid="thumbnail-variations"]').isVisible({ timeout: 30000 });
      const hasRetry = await page.locator('[data-testid="retry-network-btn"]').isVisible();
      
      expect(isCompleted || hasRetry).toBeTruthy();
    });

  });

});

// Helper functions for test utilities
async function waitForEnhancedGeneration(page: Page, timeout = 120000) {
  await page.waitForSelector('[data-testid="generation-progress"]', { timeout: 5000 });
  await page.waitForSelector('[data-testid="thumbnail-variations"]', { timeout });
}

async function uploadTestScreenshots(page: Page, count = 3) {
  const screenshots = Array.from({ length: count }, (_, i) => ({
    name: `test-screenshot-${i}.jpg`,
    mimeType: 'image/jpeg',
    buffer: Buffer.from(`mock screenshot content ${i}`)
  }));
  
  await page.locator('[data-testid="screenshot-upload"]').setInputFiles(screenshots);
}

async function selectMultipleLanguages(page: Page, languages: string[]) {
  await page.locator('[data-testid="language-selector"]').click();
  
  for (const lang of languages) {
    await page.locator(`[data-testid="language-option-${lang}"]`).click();
  }
  
  await page.locator('[data-testid="language-selector"]').click(); // Close dropdown
} 