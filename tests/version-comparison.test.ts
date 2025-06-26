import { test, expect, Page } from '@playwright/test';

interface VersionTestResult {
  commitHash: string;
  description: string;
  score: number;
  features: {
    youtubeUrlProcessing: boolean;
    contextFetching: boolean;
    elementTextBlending: boolean;
    russianSupport: boolean;
    fastCreation: boolean;
    blankCanvas: boolean;
    suggestions: boolean;
  };
  usabilityScore: number;
  performanceScore: number;
  bugs: string[];
  notes: string[];
}

const COMMITS_TO_TEST = [
  { hash: '451821f', description: 'ULTIMATE YOUTUBER DETECTION & ENHANCED INTERFACE' },
  { hash: 'f57ef17', description: 'v0.9a - Comprehensive QA Implementation' },
  { hash: '83635cf', description: 'AI-Powered QA Strategy 2025' },
  { hash: 'bf57030', description: 'BLANK CANVAS FIRST APPROACH' },
  { hash: 'c79ed30', description: 'FIXED DOUBLE INPUT SCREEN ISSUE' },
  { hash: 'daab289', description: 'major UI enhancements - landing page, style templates' }
];

class YouThumbAITester {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }

  async testYouTubeUrlProcessing(): Promise<boolean> {
    try {
      // Test with a real YouTube URL
      const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      
      // Look for URL input field
      const urlInput = this.page.locator('input[placeholder*="YouTube"]').or(
        this.page.locator('input[placeholder*="URL"]')
      ).or(
        this.page.locator('input[type="url"]')
      ).first();
      
      if (await urlInput.isVisible({ timeout: 2000 })) {
        await urlInput.fill(testUrl);
        
        // Look for process/analyze/generate button
        const processBtn = this.page.locator('button:has-text("Process")').or(
          this.page.locator('button:has-text("Analyze")').or(
            this.page.locator('button:has-text("Generate")').or(
              this.page.locator('button:has-text("Create")')
            )
          )
        ).first();
        
        if (await processBtn.isVisible({ timeout: 1000 })) {
          await processBtn.click();
          
          // Check if processing started (loading state or navigation)
          await this.page.waitForTimeout(1000);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  async testContextFetching(): Promise<boolean> {
    try {
      // Look for signs of context fetching: title, description, metadata display
      const contextElements = [
        'text*="Title"',
        'text*="Description"', 
        'text*="Channel"',
        'text*="Views"',
        'text*="Duration"',
        '[data-testid*="video-title"]',
        '[data-testid*="video-info"]'
      ];
      
      for (const selector of contextElements) {
        if (await this.page.locator(selector).first().isVisible({ timeout: 1000 })) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  async testElementTextBlending(): Promise<boolean> {
    try {
      // Look for text editing/blending capabilities
      const textElements = [
        'button:has-text("Text")',
        'button:has-text("Add Text")',
        '[data-testid*="text"]',
        'input[placeholder*="text"]',
        '.text-editor',
        '[contenteditable="true"]'
      ];
      
      for (const selector of textElements) {
        if (await this.page.locator(selector).first().isVisible({ timeout: 1000 })) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  async testRussianSupport(): Promise<boolean> {
    try {
      // Look for Russian language support
      const russianText = await this.page.textContent('body');
      if (russianText?.includes('русск') || russianText?.includes('Русск')) {
        return true;
      }
      
      // Check for language selector
      const langSelectors = [
        'select[name*="lang"]',
        'button:has-text("Language")',
        'button:has-text("Lang")',
        '[data-testid*="language"]'
      ];
      
      for (const selector of langSelectors) {
        if (await this.page.locator(selector).first().isVisible({ timeout: 1000 })) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  async testFastCreation(): Promise<boolean> {
    try {
      // Test if creation flow is simple and fast
      const quickActions = [
        'button:has-text("Quick")',
        'button:has-text("Fast")',
        'button:has-text("1-Click")',
        'button:has-text("Instant")',
        '.quick-action',
        '.fast-create'
      ];
      
      let actionCount = 0;
      for (const selector of quickActions) {
        if (await this.page.locator(selector).first().isVisible({ timeout: 500 })) {
          actionCount++;
        }
      }
      
      // Check if interface is not overly complex
      const allButtons = await this.page.locator('button').count();
      return allButtons < 15 || actionCount > 0; // Simple interface or explicit quick actions
    } catch {
      return false;
    }
  }

  async testBlankCanvas(): Promise<boolean> {
    try {
      // Look for blank canvas or template options
      const canvasElements = [
        'button:has-text("Blank")',
        'button:has-text("Canvas")',
        'button:has-text("Start Fresh")',
        'button:has-text("New")',
        '[data-testid*="blank"]',
        '[data-testid*="canvas"]'
      ];
      
      for (const selector of canvasElements) {
        if (await this.page.locator(selector).first().isVisible({ timeout: 1000 })) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  async testSuggestions(): Promise<boolean> {
    try {
      // Look for AI suggestions or recommendations
      const suggestionElements = [
        'text*="Suggest"',
        'text*="Recommend"', 
        'text*="AI"',
        '.suggestion',
        '.recommendation',
        '[data-testid*="suggest"]'
      ];
      
      for (const selector of suggestionElements) {
        if (await this.page.locator(selector).first().isVisible({ timeout: 1000 })) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  async measureUsability(): Promise<number> {
    try {
      let score = 0;
      
      // Check loading time
      const startTime = Date.now();
      await this.page.waitForLoadState('networkidle', { timeout: 5000 });
      const loadTime = Date.now() - startTime;
      if (loadTime < 2000) score += 2;
      else if (loadTime < 4000) score += 1;
      
      // Check for clear navigation
      const navElements = await this.page.locator('nav, .navigation, .menu').count();
      if (navElements > 0) score += 1;
      
      // Check for responsive design
      await this.page.setViewportSize({ width: 375, height: 667 }); // Mobile
      await this.page.waitForTimeout(500);
      const isMobileFriendly = await this.page.locator('body').evaluate((el) => {
        return window.getComputedStyle(el).getPropertyValue('overflow-x') !== 'scroll';
      });
      if (isMobileFriendly) score += 1;
      
      // Reset viewport
      await this.page.setViewportSize({ width: 1280, height: 720 });
      
      return Math.min(score, 5); // Max 5 points
    } catch {
      return 0;
    }
  }

  async checkForBugs(): Promise<string[]> {
    const bugs: string[] = [];
    
    try {
      // Listen for console errors
      const errors: string[] = [];
      this.page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Check for common UI issues
      const brokenImages = await this.page.locator('img[src=""], img:not([src])').count();
      if (brokenImages > 0) bugs.push(`${brokenImages} broken images`);
      
      const emptyButtons = await this.page.locator('button:empty').count();
      if (emptyButtons > 0) bugs.push(`${emptyButtons} empty buttons`);
      
      // Wait to collect errors
      await this.page.waitForTimeout(2000);
      
      if (errors.length > 0) {
        bugs.push(`Console errors: ${errors.slice(0, 3).join(', ')}`);
      }
      
    } catch (error) {
      bugs.push(`Testing error: ${error}`);
    }
    
    return bugs;
  }
}

test.describe('Version Comparison Tests', () => {
  test('Current Version Functionality Test', async ({ page }) => {
    const tester = new YouThumbAITester(page);
    
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    const result: VersionTestResult = {
      commitHash: 'current',
      description: 'Current running version',
      score: 0,
      features: {
        youtubeUrlProcessing: await tester.testYouTubeUrlProcessing(),
        contextFetching: await tester.testContextFetching(),
        elementTextBlending: await tester.testElementTextBlending(),
        russianSupport: await tester.testRussianSupport(),
        fastCreation: await tester.testFastCreation(),
        blankCanvas: await tester.testBlankCanvas(),
        suggestions: await tester.testSuggestions()
      },
      usabilityScore: await tester.measureUsability(),
      performanceScore: 0,
      bugs: await tester.checkForBugs(),
      notes: []
    };
    
    // Calculate total score
    const featureScore = Object.values(result.features).filter(Boolean).length;
    result.score = featureScore + result.usabilityScore - result.bugs.length;
    
    console.log('🔍 CURRENT VERSION TEST RESULTS:');
    console.log(`📊 Total Score: ${result.score}/12`);
    console.log(`✅ Features: ${JSON.stringify(result.features, null, 2)}`);
    console.log(`🎯 Usability: ${result.usabilityScore}/5`);
    console.log(`🐛 Bugs: ${result.bugs.length > 0 ? result.bugs.join(', ') : 'None detected'}`);
    
    // Key requirements check
    const hasEssentials = result.features.youtubeUrlProcessing && 
                         result.features.contextFetching && 
                         result.features.fastCreation;
    
    console.log(`\n🎯 ESSENTIAL FEATURES: ${hasEssentials ? '✅ PASSED' : '❌ MISSING'}`);
    
    if (hasEssentials) {
      console.log('✨ Current version meets core requirements!');
    } else {
      console.log('⚠️  Current version missing essential features. Need to check previous commits.');
    }
    
    expect(result.score).toBeGreaterThan(0);
  });
});

// Export for use in commit testing script
export { YouThumbAITester, COMMITS_TO_TEST };
export type { VersionTestResult }; 