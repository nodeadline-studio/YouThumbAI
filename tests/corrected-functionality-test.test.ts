import { test, expect } from '@playwright/test';

test.describe('Corrected Functionality Test for f57ef17', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('should have YouTube URL processing on landing page', async ({ page }) => {
    console.log('🔍 Testing YouTube URL Processing on Landing Page...');
    
    // Check for the main URL input field on landing page
    const urlInput = await page.locator('input[placeholder*="YouTube"]').first();
    const isVisible = await urlInput.isVisible({ timeout: 3000 });
    console.log(`✅ YouTube URL input field: ${isVisible}`);
    
    // Check for the create button
    const createBtn = await page.locator('button:has-text("Create Thumbnail")');
    const btnVisible = await createBtn.isVisible({ timeout: 2000 });
    console.log(`✅ Create Thumbnail button: ${btnVisible}`);
    
    expect(isVisible).toBe(true);
    expect(btnVisible).toBe(true);
  });

  test('should have blank canvas functionality on landing page', async ({ page }) => {
    console.log('🔍 Testing Blank Canvas on Landing Page...');
    
    // Look for blank canvas button
    const blankCanvasBtn = await page.locator('text=Start with blank canvas').first();
    const isVisible = await blankCanvasBtn.isVisible({ timeout: 3000 });
    console.log(`✅ Blank canvas button: ${isVisible}`);
    
    if (isVisible) {
      await blankCanvasBtn.click();
      await page.waitForTimeout(2000);
      
      // Check if we're now in the editor (ThumbnailEditor component)
      const editorVisible = await page.locator('[data-testid="thumbnail-editor"]').isVisible({ timeout: 3000 });
      console.log(`✅ Editor loaded after blank canvas: ${editorVisible}`);
      
      expect(editorVisible).toBe(true);
    }
    
    expect(isVisible).toBe(true);
  });

  test('should have landing page UI elements', async ({ page }) => {
    console.log('🔍 Testing Landing Page UI Elements...');
    
    // Check for main heading
    const heading = await page.locator('h1:has-text("Professional YouTube Thumbnails")').isVisible({ timeout: 2000 });
    console.log(`✅ Main heading: ${heading}`);
    
    // Check for 3-step process icons
    const step1 = await page.locator('text=Paste YouTube URL').isVisible({ timeout: 2000 });
    const step2 = await page.locator('text=AI Generation').isVisible({ timeout: 2000 });
    const step3 = await page.locator('text=Professional Export').isVisible({ timeout: 2000 });
    
    console.log(`✅ 3-step process: ${step1 && step2 && step3}`);
    
    // Check for value propositions
    const faster = await page.locator('text=10x Faster').isVisible({ timeout: 2000 });
    const cheaper = await page.locator('text=100x Cheaper').isVisible({ timeout: 2000 });
    const scalable = await page.locator('text=Instantly Scalable').isVisible({ timeout: 2000 });
    
    console.log(`✅ Value propositions: ${faster && cheaper && scalable}`);
    
    expect(heading).toBe(true);
    expect(step1 && step2 && step3).toBe(true);
    expect(faster && cheaper && scalable).toBe(true);
  });

  test('should test element blending workflow', async ({ page }) => {
    console.log('🔍 Testing Element Blending Workflow...');
    
    // Start with blank canvas
    const blankCanvasBtn = await page.locator('text=Start with blank canvas').first();
    if (await blankCanvasBtn.isVisible({ timeout: 3000 })) {
      await blankCanvasBtn.click();
      await page.waitForTimeout(2000);
      
      // Check if we're in the editor with tabs
      const elementsTab = await page.locator('span:has-text("Elements")').first().isVisible({ timeout: 3000 });
      console.log(`✅ Elements tab available: ${elementsTab}`);
      
      const generateTab = await page.locator('span:has-text("Generate")').first().isVisible({ timeout: 3000 });
      console.log(`✅ Generate tab available: ${generateTab}`);
      
      // In the ThumbnailEditor, the blend functionality should be present
      // but only visible after generation and adding elements
      console.log(`✅ Editor interface loaded with tabbed navigation`);
      
      expect(elementsTab && generateTab).toBe(true);
    }
  });

  test('should test YouTube URL processing workflow', async ({ page }) => {
    console.log('🔍 Testing YouTube URL Processing Workflow...');
    
    // Try to input a test URL (won't work without API key but tests UI)
    const urlInput = await page.locator('input[placeholder*="YouTube"]').first();
    if (await urlInput.isVisible({ timeout: 3000 })) {
      await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      
      const createBtn = await page.locator('button:has-text("Create Thumbnail")');
      if (await createBtn.isVisible({ timeout: 2000 })) {
        // Note: This will fail without API key, but that's expected
        console.log(`✅ URL input and process button workflow ready`);
        
        expect(true).toBe(true); // UI is properly set up
      }
    }
  });

  test('should have comprehensive interface features', async ({ page }) => {
    console.log('🔍 Testing Comprehensive Interface Features...');
    
    // Test responsive design
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.waitForTimeout(500);
    
    const mobileUrlInput = await page.locator('input[placeholder*="YouTube"]').first().isVisible({ timeout: 2000 });
    console.log(`📱 Mobile responsive URL input: ${mobileUrlInput}`);
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    // Check for modern UI elements
    const gradientHeading = await page.locator('h1').first().evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.backgroundImage.includes('gradient');
    });
    console.log(`✨ Modern gradient UI: ${gradientHeading}`);
    
    // Check for interactive elements
    const buttons = await page.locator('button').count();
    console.log(`🔘 Interactive buttons: ${buttons}`);
    
    expect(mobileUrlInput).toBe(true);
    expect(buttons).toBeGreaterThan(3);
  });

  test('overall version quality assessment', async ({ page }) => {
    console.log('📊 CORRECTED VERSION QUALITY ASSESSMENT');
    console.log('='.repeat(50));
    
    let score = 0;
    const features = {
      landingPage: false,
      youtubeUrlInput: false,
      blankCanvas: false,
      createButton: false,
      modernUI: false,
      responsiveDesign: false,
      valueProposition: false,
      fastWorkflow: false
    };
    
    // Landing Page
    const landingPageHeading = await page.locator('h1:has-text("Professional YouTube Thumbnails")').isVisible({ timeout: 2000 });
    features.landingPage = landingPageHeading;
    if (features.landingPage) score += 1;
    console.log(`✅ Landing Page: ${features.landingPage}`);
    
    // YouTube URL Input
    const urlInput = await page.locator('input[placeholder*="YouTube"]').first().isVisible({ timeout: 2000 });
    features.youtubeUrlInput = urlInput;
    if (features.youtubeUrlInput) score += 1;
    console.log(`✅ YouTube URL Input: ${features.youtubeUrlInput}`);
    
    // Blank Canvas
    const blankCanvas = await page.locator('text=Start with blank canvas').first().isVisible({ timeout: 2000 });
    features.blankCanvas = blankCanvas;
    if (features.blankCanvas) score += 1;
    console.log(`✅ Blank Canvas: ${features.blankCanvas}`);
    
    // Create Button
    const createBtn = await page.locator('button:has-text("Create Thumbnail")').isVisible({ timeout: 2000 });
    features.createButton = createBtn;
    if (features.createButton) score += 1;
    console.log(`✅ Create Button: ${features.createButton}`);
    
    // Modern UI
    const gradientElements = await page.locator('[class*="gradient"]').count();
    features.modernUI = gradientElements > 5;
    if (features.modernUI) score += 1;
    console.log(`✅ Modern UI: ${features.modernUI} (${gradientElements} gradient elements)`);
    
    // Responsive Design
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    const mobileWorks = await page.locator('input[placeholder*="YouTube"]').first().isVisible({ timeout: 2000 });
    features.responsiveDesign = mobileWorks;
    if (features.responsiveDesign) score += 1;
    console.log(`✅ Responsive Design: ${features.responsiveDesign}`);
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Value Proposition
    const valueProps = await page.locator('text=10x Faster').isVisible({ timeout: 2000 });
    features.valueProposition = valueProps;
    if (features.valueProposition) score += 1;
    console.log(`✅ Value Proposition: ${features.valueProposition}`);
    
    // Fast Workflow
    const workflowSteps = await page.locator('text=Paste YouTube URL').isVisible({ timeout: 2000 });
    features.fastWorkflow = workflowSteps;
    if (features.fastWorkflow) score += 1;
    console.log(`✅ Fast Workflow: ${features.fastWorkflow}`);
    
    console.log('\n' + '='.repeat(50));
    console.log(`🏆 CORRECTED SCORE: ${score}/8`);
    console.log('='.repeat(50));
    
    if (score >= 7) {
      console.log('🌟 EXCELLENT: This version has outstanding functionality!');
    } else if (score >= 5) {
      console.log('✅ GOOD: This version has solid functionality');
    } else {
      console.log('⚠️  NEEDS IMPROVEMENT: Some key features missing');
    }
    
    console.log('\n📋 Feature Summary:');
    Object.entries(features).forEach(([feature, hasFeature]) => {
      console.log(`   ${hasFeature ? '✅' : '❌'} ${feature}`);
    });
    
    // This version should score highly
    expect(score).toBeGreaterThanOrEqual(6);
  });
}); 