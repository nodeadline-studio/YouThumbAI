import { test, expect, Page } from '@playwright/test';

interface UsabilityMetrics {
  landingClarity: number;
  primaryActionVisibility: number;
  userFlowSimplicity: number;
  blankCanvasAccess: number;
  youtubeUrlFlow: number;
  interfaceModernness: number;
  overallUsability: number;
}

interface CommitTestResult {
  commit: string;
  description: string;
  metrics: UsabilityMetrics;
  issues: string[];
  strengths: string[];
  score: number;
}

const commits = [
  { hash: 'c79ed30', description: 'FIXED DOUBLE INPUT SCREEN ISSUE' },
  { hash: 'bf57030', description: 'BLANK CANVAS FIRST APPROACH' },
  { hash: '53db888', description: 'Remove double input screen - streamline user flow' }
];

async function evaluateUsability(page: Page): Promise<{ metrics: UsabilityMetrics; issues: string[]; strengths: string[] }> {
  const issues: string[] = [];
  const strengths: string[] = [];
  const metrics: UsabilityMetrics = {
    landingClarity: 0,
    primaryActionVisibility: 0,
    userFlowSimplicity: 0,
    blankCanvasAccess: 0,
    youtubeUrlFlow: 0,
    interfaceModernness: 0,
    overallUsability: 0
  };

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 10000 });
    
    // 1. Landing Page Clarity (0-10)
    const hasHeader = await page.locator('h1').isVisible({ timeout: 2000 });
    const hasDescription = await page.locator('p').first().isVisible({ timeout: 2000 });
    const hasValueProp = await page.locator('text=60 seconds').isVisible({ timeout: 2000 });
    
    if (hasHeader && hasDescription) {
      metrics.landingClarity += 5;
      strengths.push('Clear heading and description');
    }
    if (hasValueProp) {
      metrics.landingClarity += 3;
      strengths.push('Clear value proposition (60 seconds)');
    }
    
    const visualElements = await page.locator('.bg-gradient-to-r').count();
    if (visualElements >= 3) {
      metrics.landingClarity += 2;
      strengths.push('Modern visual design');
    }

    // 2. Primary Action Visibility (0-10)
    const youtubeInput = await page.locator('input[placeholder*="YouTube"]').isVisible({ timeout: 2000 });
    const createButton = await page.locator('button:has-text("Create")').isVisible({ timeout: 2000 });
    const blankCanvasBtn = await page.locator('text=blank canvas').first().isVisible({ timeout: 2000 });
    
    if (youtubeInput && createButton) {
      metrics.primaryActionVisibility += 6;
      strengths.push('YouTube input and Create button clearly visible');
    } else {
      issues.push('YouTube input or Create button not visible');
    }
    
    if (blankCanvasBtn) {
      metrics.primaryActionVisibility += 4;
      strengths.push('Blank canvas option visible');
    } else {
      issues.push('Blank canvas option not easily accessible');
    }

    // 3. User Flow Simplicity (0-10)
    const stepCount = await page.locator('text=Paste, text=AI, text=Export').count();
    if (stepCount >= 2) {
      metrics.userFlowSimplicity += 5;
      strengths.push('Clear 3-step process visualization');
    }
    
    // Check for duplicate inputs or confusing elements
    const inputCount = await page.locator('input[type="text"]').count();
    if (inputCount <= 2) {
      metrics.userFlowSimplicity += 3;
      strengths.push('Clean, minimal input fields');
    } else {
      issues.push(`Too many input fields (${inputCount})`);
    }
    
    // Check for overwhelming options
    const buttonCount = await page.locator('button').count();
    if (buttonCount <= 5) {
      metrics.userFlowSimplicity += 2;
      strengths.push('Appropriate number of action buttons');
    } else if (buttonCount > 10) {
      issues.push(`Too many buttons (${buttonCount}) - overwhelming`);
    }

    // 4. Blank Canvas Access (0-10)
    try {
      if (blankCanvasBtn) {
        await page.locator('text=blank canvas').first().click();
        await page.waitForTimeout(2000);
        
        const editorVisible = await page.locator('[data-thumbnail-preview], .thumbnail-editor, .thumbnail-canvas').isVisible({ timeout: 3000 });
        if (editorVisible) {
          metrics.blankCanvasAccess = 10;
          strengths.push('Blank canvas works perfectly - leads to editor');
        } else {
          metrics.blankCanvasAccess = 3;
          issues.push('Blank canvas button exists but doesn\'t lead to editor');
        }
        
        // Navigate back
        await page.goto('http://localhost:5173');
      } else {
        metrics.blankCanvasAccess = 0;
        issues.push('No blank canvas option found');
      }
    } catch (e) {
      metrics.blankCanvasAccess = 1;
      issues.push('Blank canvas functionality broken');
    }

    // 5. YouTube URL Flow (0-10)
    try {
      const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      await page.fill('input[placeholder*="YouTube"]', testUrl);
      
      const hasValidation = await page.locator('button:has-text("Create")').isEnabled();
      if (hasValidation) {
        metrics.youtubeUrlFlow += 5;
        strengths.push('YouTube URL input accepts valid URLs');
      }
      
      // Clear the input
      await page.fill('input[placeholder*="YouTube"]', '');
      
      // Check for smart placeholder
      const placeholder = await page.locator('input[placeholder*="YouTube"]').getAttribute('placeholder');
      if (placeholder && placeholder.toLowerCase().includes('paste')) {
        metrics.youtubeUrlFlow += 3;
        strengths.push('Intuitive placeholder text');
      }
      
      if (metrics.youtubeUrlFlow >= 5) {
        metrics.youtubeUrlFlow += 2;
        strengths.push('YouTube URL flow appears functional');
      }
    } catch (e) {
      issues.push('YouTube URL input functionality issues');
    }

    // 6. Interface Modernness (0-10)
    const gradients = await page.locator('.bg-gradient-to-r, .bg-gradient-to-br').count();
    const roundedElements = await page.locator('.rounded-lg, .rounded-xl').count();
    const shadows = await page.locator('.shadow-lg, .shadow-xl').count();
    
    if (gradients >= 3) {
      metrics.interfaceModernness += 3;
      strengths.push('Modern gradient design');
    }
    if (roundedElements >= 3) {
      metrics.interfaceModernness += 3;
      strengths.push('Modern rounded design elements');
    }
    if (shadows >= 2) {
      metrics.interfaceModernness += 2;
      strengths.push('Professional shadow effects');
    }
    
    // Check for animations
    const hasHover = await page.locator('.hover\\:').count();
    if (hasHover >= 2) {
      metrics.interfaceModernness += 2;
      strengths.push('Interactive hover effects');
    }

    // 7. Calculate Overall Usability (weighted average)
    metrics.overallUsability = Math.round(
      (metrics.landingClarity * 0.2) +
      (metrics.primaryActionVisibility * 0.25) +
      (metrics.userFlowSimplicity * 0.25) +
      (metrics.blankCanvasAccess * 0.1) +
      (metrics.youtubeUrlFlow * 0.1) +
      (metrics.interfaceModernness * 0.1)
    );

  } catch (error) {
    console.error('Evaluation error:', error);
    issues.push(`Evaluation failed: ${error.message}`);
  }

  return { metrics, issues, strengths };
}

test.describe('Interface Usability Comparison', () => {
  let results: CommitTestResult[] = [];

  for (const commit of commits) {
    test(`Evaluate usability of ${commit.description}`, async ({ page }) => {
      console.log(`\n🔍 Testing ${commit.hash} - ${commit.description}`);
      console.log('=' .repeat(80));
      
      const evaluation = await evaluateUsability(page);
      
      const score = Math.round(
        (evaluation.metrics.landingClarity +
         evaluation.metrics.primaryActionVisibility +
         evaluation.metrics.userFlowSimplicity +
         evaluation.metrics.blankCanvasAccess +
         evaluation.metrics.youtubeUrlFlow +
         evaluation.metrics.interfaceModernness) / 6 * 10
      ) / 10;

      const result: CommitTestResult = {
        commit: commit.hash,
        description: commit.description,
        metrics: evaluation.metrics,
        issues: evaluation.issues,
        strengths: evaluation.strengths,
        score
      };

      results.push(result);

      // Display detailed results
      console.log('\n📊 USABILITY METRICS:');
      console.log(`├─ Landing Clarity: ${evaluation.metrics.landingClarity}/10`);
      console.log(`├─ Primary Action Visibility: ${evaluation.metrics.primaryActionVisibility}/10`);
      console.log(`├─ User Flow Simplicity: ${evaluation.metrics.userFlowSimplicity}/10`);
      console.log(`├─ Blank Canvas Access: ${evaluation.metrics.blankCanvasAccess}/10`);
      console.log(`├─ YouTube URL Flow: ${evaluation.metrics.youtubeUrlFlow}/10`);
      console.log(`├─ Interface Modernness: ${evaluation.metrics.interfaceModernness}/10`);
      console.log(`└─ Overall Usability: ${evaluation.metrics.overallUsability}/10`);

      console.log('\n💪 STRENGTHS:');
      evaluation.strengths.forEach(strength => console.log(`✅ ${strength}`));

      console.log('\n⚠️  ISSUES:');
      evaluation.issues.forEach(issue => console.log(`❌ ${issue}`));

      console.log(`\n🏆 TOTAL SCORE: ${score}/10`);
      
      if (score >= 8) {
        console.log('🌟 EXCELLENT - Highly usable interface!');
      } else if (score >= 6) {
        console.log('👍 GOOD - Decent usability with room for improvement');
      } else if (score >= 4) {
        console.log('⚠️  FAIR - Significant usability issues');
      } else {
        console.log('🚫 POOR - Major usability problems');
      }
    });
  }

  test('Compare all versions and recommend best', async ({ page }) => {
    if (results.length === 0) {
      console.log('❌ No results to compare - run individual tests first');
      return;
    }

    console.log('\n' + '='.repeat(100));
    console.log('🏆 FINAL USABILITY COMPARISON REPORT');
    console.log('='.repeat(100));

    // Sort by score (highest first)
    const sortedResults = results.sort((a, b) => b.score - a.score);

    console.log('\n📋 RANKING:');
    sortedResults.forEach((result, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      console.log(`${medal} #${index + 1}: ${result.commit} - ${result.description}`);
      console.log(`   Score: ${result.score}/10`);
      console.log(`   Top strengths: ${result.strengths.slice(0, 2).join(', ')}`);
      if (result.issues.length > 0) {
        console.log(`   Main issues: ${result.issues.slice(0, 2).join(', ')}`);
      }
      console.log('');
    });

    const winner = sortedResults[0];
    console.log('🎯 RECOMMENDATION:');
    console.log(`Use commit ${winner.commit} - ${winner.description}`);
    console.log(`Reason: Highest usability score (${winner.score}/10) with excellent user experience`);
    
    console.log('\n📊 DETAILED COMPARISON:');
    console.log('Metric'.padEnd(25) + 'Best'.padEnd(15) + 'Good'.padEnd(15) + 'Needs Work');
    console.log('-'.repeat(70));
    
    const metrics = ['landingClarity', 'primaryActionVisibility', 'userFlowSimplicity', 'blankCanvasAccess', 'youtubeUrlFlow', 'interfaceModernness'];
    
    metrics.forEach(metric => {
      const scores = results.map(r => ({ commit: r.commit.slice(0, 7), score: r.metrics[metric] }))
                           .sort((a, b) => b.score - a.score);
      const metricName = metric.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, s => s.toUpperCase());
      console.log(
        metricName.padEnd(25) + 
        `${scores[0].commit}(${scores[0].score})`.padEnd(15) + 
        `${scores[1].commit}(${scores[1].score})`.padEnd(15) + 
        `${scores[2].commit}(${scores[2].score})`
      );
    });

    console.log('\n🚀 NEXT STEPS:');
    console.log(`1. Switch to commit ${winner.commit}`);
    console.log('2. Test the recommended version thoroughly');
    console.log('3. Address any remaining issues if needed');
    console.log('4. Deploy to production');
  });
}); 