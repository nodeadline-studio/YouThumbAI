import { test, expect } from '@playwright/test';

test.describe('Manual Interface Evaluation', () => {
  test('Current version (53db888) - Visual interface check', async ({ page }) => {
    console.log('\n🔍 EVALUATING CURRENT VERSION: 53db888 - Remove double input screen');
    console.log('=' .repeat(80));
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Take screenshot for manual review
    await page.screenshot({ path: 'test-results/current-version-interface.png', fullPage: true });
    
    console.log('\n📸 Screenshot saved to: test-results/current-version-interface.png');
    
    // Basic checks
    console.log('\n🔍 INTERFACE ANALYSIS:');
    
    // Check for main title
    const mainTitle = await page.locator('h1:has-text("Professional YouTube")').isVisible({ timeout: 3000 });
    console.log(`├─ Main title visible: ${mainTitle ? '✅' : '❌'}`);
    
    // Check for YouTube input
    const youtubeInput = await page.locator('input[placeholder*="YouTube"]').count();
    console.log(`├─ YouTube input fields: ${youtubeInput}`);
    
    // Check for primary buttons
    const createButton = await page.locator('button:has-text("Create")').count();
    console.log(`├─ Create buttons: ${createButton}`);
    
    // Check for blank canvas option
    const blankCanvas = await page.locator('text=blank canvas').count();
    console.log(`├─ Blank canvas mentions: ${blankCanvas}`);
    
    // Check for gradients (modern design)
    const gradients = await page.locator('.bg-gradient-to-r, .bg-gradient-to-br').count();
    console.log(`├─ Gradient elements: ${gradients}`);
    
    // Check for overall layout
    const containers = await page.locator('.container, .max-w-').count();
    console.log(`├─ Layout containers: ${containers}`);
    
    console.log('\n📝 PAGE CONTENT ANALYSIS:');
    
    // Get page text content for analysis
    const pageText = await page.textContent('body') || '';
    const hasValueProp = pageText.includes('60 seconds');
    const hasSteps = pageText.includes('Paste') && pageText.includes('AI') && pageText.includes('Export');
    const hasFeatures = pageText.includes('AI-powered') || pageText.includes('Professional');
    
    console.log(`├─ Value proposition (60 seconds): ${hasValueProp ? '✅' : '❌'}`);
    console.log(`├─ 3-step process: ${hasSteps ? '✅' : '❌'}`);
    console.log(`├─ Feature highlights: ${hasFeatures ? '✅' : '❌'}`);
    
    // Test blank canvas functionality
    console.log('\n🖼️  TESTING BLANK CANVAS FLOW:');
    try {
      const blankCanvasButton = page.locator('text=blank canvas').first();
      const isBlankCanvasVisible = await blankCanvasButton.isVisible({ timeout: 3000 });
      
      if (isBlankCanvasVisible) {
        console.log('├─ Blank canvas button found ✅');
        await blankCanvasButton.click();
        await page.waitForTimeout(3000);
        
        // Check if we're in the editor
        const editorElements = await page.locator('[data-thumbnail-preview], .thumbnail-editor, .editor').count();
        const hasTabsOrControls = await page.locator('.tab, button:has-text("Generate"), button:has-text("Elements")').count();
        
        console.log(`├─ Editor elements after click: ${editorElements}`);
        console.log(`├─ Controls/tabs after click: ${hasTabsOrControls}`);
        
        if (editorElements > 0 || hasTabsOrControls > 0) {
          console.log('└─ Blank canvas flow: ✅ WORKING');
        } else {
          console.log('└─ Blank canvas flow: ❌ NOT WORKING');
        }
      } else {
        console.log('└─ Blank canvas button: ❌ NOT FOUND');
      }
    } catch (error) {
      console.log(`└─ Blank canvas test failed: ${error.message}`);
    }
    
    // Navigate back to landing
    await page.goto('http://localhost:5173');
    
    // Test YouTube URL flow
    console.log('\n🎬 TESTING YOUTUBE URL FLOW:');
    try {
      const urlInput = page.locator('input[placeholder*="YouTube"]').first();
      const isInputVisible = await urlInput.isVisible({ timeout: 3000 });
      
      if (isInputVisible) {
        console.log('├─ YouTube input found ✅');
        
        // Test placeholder and input
        const placeholder = await urlInput.getAttribute('placeholder');
        console.log(`├─ Placeholder text: "${placeholder}"`);
        
        // Test button association
        const createBtn = page.locator('button:has-text("Create")').first();
        const isBtnVisible = await createBtn.isVisible({ timeout: 2000 });
        console.log(`├─ Create button found: ${isBtnVisible ? '✅' : '❌'}`);
        
        if (isBtnVisible) {
          console.log('└─ YouTube URL flow: ✅ INTERFACE READY');
        } else {
          console.log('└─ YouTube URL flow: ⚠️  INPUT ONLY');
        }
      } else {
        console.log('└─ YouTube URL flow: ❌ NOT FOUND');
      }
    } catch (error) {
      console.log(`└─ YouTube URL test failed: ${error.message}`);
    }
    
    console.log('\n🎯 OVERALL ASSESSMENT:');
    
    // Calculate simple scores
    let score = 0;
    let maxScore = 8;
    
    if (mainTitle) score += 1;
    if (youtubeInput > 0) score += 1;
    if (createButton > 0) score += 1;
    if (blankCanvas > 0) score += 1;
    if (gradients >= 3) score += 1;
    if (hasValueProp) score += 1;
    if (hasSteps) score += 1;
    if (hasFeatures) score += 1;
    
    const percentage = Math.round((score / maxScore) * 100);
    
    console.log(`├─ Interface Score: ${score}/${maxScore} (${percentage}%)`);
    
    if (percentage >= 80) {
      console.log('└─ Rating: 🌟 EXCELLENT - Great usability!');
    } else if (percentage >= 60) {
      console.log('└─ Rating: 👍 GOOD - Decent interface');
    } else if (percentage >= 40) {
      console.log('└─ Rating: ⚠️  FAIR - Needs improvement');
    } else {
      console.log('└─ Rating: 🚫 POOR - Major issues');
    }
    
    console.log('\n📋 SUMMARY:');
    console.log(`Version: 53db888 - Remove double input screen - streamline user flow`);
    console.log(`Score: ${score}/${maxScore} (${percentage}%)`);
    console.log(`Screenshot: test-results/current-version-interface.png`);
  });
}); 