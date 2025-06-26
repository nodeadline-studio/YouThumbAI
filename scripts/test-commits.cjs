#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const COMMITS_TO_TEST = [
  { hash: 'f57ef17', description: 'v0.9a - Comprehensive QA Implementation' },
  { hash: 'bf57030', description: 'BLANK CANVAS FIRST APPROACH' },
  { hash: 'c79ed30', description: 'FIXED DOUBLE INPUT SCREEN ISSUE' },
  { hash: 'daab289', description: 'major UI enhancements - landing page, style templates' },
  { hash: '83635cf', description: 'AI-Powered QA Strategy 2025' }
];

class CommitTester {
  constructor() {
    this.results = [];
    this.currentCommit = null;
    this.serverProcess = null;
  }

  async run() {
    console.log('🚀 Starting YouThumbAI Commit Testing Strategy');
    console.log('📋 Testing commits for optimal functionality...\n');

    // Save current commit
    this.currentCommit = execSync('git rev-parse HEAD').toString().trim();
    console.log(`💾 Current commit saved: ${this.currentCommit.substring(0, 7)}\n`);

    // Test current version first
    console.log('🔍 Testing current version...');
    await this.testCurrentVersion();

    // Test each historical commit
    for (const commit of COMMITS_TO_TEST) {
      console.log(`\n🔄 Switching to commit: ${commit.hash} - ${commit.description}`);
      
      try {
        await this.testCommit(commit);
      } catch (error) {
        console.error(`❌ Failed to test commit ${commit.hash}:`, error.message);
        this.results.push({
          ...commit,
          score: -1,
          error: error.message,
          features: null
        });
      }
    }

    // Restore original commit
    console.log(`\n🔄 Restoring original commit: ${this.currentCommit.substring(0, 7)}`);
    execSync(`git checkout ${this.currentCommit}`, { stdio: 'inherit' });

    // Generate report
    this.generateReport();
  }

  async testCurrentVersion() {
    try {
      console.log('Running Playwright test on current version...');
      const testOutput = execSync('npx playwright test tests/version-comparison.test.ts --reporter=json', {
        encoding: 'utf8',
        timeout: 30000
      });
      
      console.log('✅ Current version test completed');
    } catch (error) {
      console.log('⚠️  Current version test had issues:', error.message);
    }
  }

  async testCommit(commit) {
    // Switch to commit
    execSync(`git checkout ${commit.hash}`, { stdio: 'pipe' });
    
    // Check if package.json changed and reinstall if needed
    try {
      const packageChanged = execSync(`git diff HEAD~1 HEAD --name-only | grep package.json || echo ""`, { encoding: 'utf8' }).trim();
      if (packageChanged) {
        console.log('📦 Package.json changed, reinstalling dependencies...');
        execSync('npm install', { stdio: 'inherit', timeout: 60000 });
      }
    } catch (error) {
      console.log('⚠️  Dependency installation warning:', error.message);
    }

    // Try to build
    let buildSuccess = false;
    try {
      console.log('🔨 Building project...');
      execSync('npm run build', { stdio: 'pipe', timeout: 30000 });
      buildSuccess = true;
      console.log('✅ Build successful');
    } catch (error) {
      console.log('❌ Build failed:', error.message);
    }

    // Test basic functionality
    const testResult = await this.quickFunctionalityTest(commit);
    
    this.results.push({
      ...commit,
      buildSuccess,
      ...testResult
    });
  }

  async quickFunctionalityTest(commit) {
    return new Promise((resolve) => {
      console.log('🧪 Quick functionality test...');
      
      // Start dev server
      const serverProcess = spawn('npm', ['run', 'dev'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      let serverOutput = '';
      let serverReady = false;
      
      const timeout = setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          serverProcess.kill('SIGTERM');
        }
        resolve({
          score: 0,
          error: 'Server startup timeout',
          features: null,
          serverStarted: false
        });
      }, 15000);

      serverProcess.stdout.on('data', (data) => {
        serverOutput += data.toString();
        
        // Check if server is ready
        if ((serverOutput.includes('Local:') || serverOutput.includes('localhost')) && !serverReady) {
          serverReady = true;
          clearTimeout(timeout);
          
          // Give server a moment to stabilize
          setTimeout(async () => {
            const result = await this.testServerResponse();
            
            // Kill server
            if (serverProcess && !serverProcess.killed) {
              serverProcess.kill('SIGTERM');
            }
            
            resolve({
              ...result,
              serverStarted: true
            });
          }, 2000);
        }
      });

      serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('Error') || error.includes('Failed')) {
          clearTimeout(timeout);
          if (serverProcess && !serverProcess.killed) {
            serverProcess.kill('SIGTERM');
          }
          resolve({
            score: 0,
            error: `Server error: ${error.substring(0, 100)}`,
            features: null,
            serverStarted: false
          });
        }
      });
    });
  }

  async testServerResponse() {
    const { execSync } = require('child_process');
    
    try {
      // Test if server responds
      const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 || echo "000"', {
        encoding: 'utf8',
        timeout: 3000
      }).trim();
      
      if (response === '200') {
        // Test page content
        const pageContent = execSync('curl -s http://localhost:5173', {
          encoding: 'utf8',
          timeout: 3000
        });
        
        let score = 1; // Basic response
        const features = {};
        
        // Check for key features
        features.hasTitle = pageContent.includes('<title>');
        features.hasYouTubeInput = pageContent.includes('YouTube') || pageContent.includes('URL');
        features.hasCanvas = pageContent.includes('canvas') || pageContent.includes('Canvas');
        features.hasGenerate = pageContent.includes('Generate') || pageContent.includes('Create');
        features.hasText = pageContent.includes('Text') || pageContent.includes('text');
        features.hasAI = pageContent.includes('AI') || pageContent.includes('ai');
        features.russianSupport = pageContent.includes('русск') || pageContent.includes('Русск');
        
        // Calculate score based on features
        score = Object.values(features).filter(Boolean).length;
        
        return {
          score,
          features,
          pageSize: pageContent.length,
          responsive: pageContent.includes('responsive') || pageContent.includes('mobile')
        };
      } else {
        return {
          score: 0,
          error: `HTTP ${response}`,
          features: null
        };
      }
    } catch (error) {
      return {
        score: 0,
        error: error.message,
        features: null
      };
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMMIT TESTING RESULTS REPORT');
    console.log('='.repeat(80));

    // Sort by score
    const sortedResults = this.results
      .filter(r => r.score >= 0)
      .sort((a, b) => b.score - a.score);

    console.log('\n🏆 TOP PERFORMING COMMITS:');
    console.log('-'.repeat(50));

    sortedResults.slice(0, 3).forEach((result, index) => {
      const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      console.log(`\n${emoji} #${index + 1}: ${result.hash.substring(0, 7)} - Score: ${result.score}`);
      console.log(`   📝 ${result.description}`);
      console.log(`   🔨 Build: ${result.buildSuccess ? '✅' : '❌'}`);
      console.log(`   🖥️  Server: ${result.serverStarted ? '✅' : '❌'}`);
      
      if (result.features) {
        const featureList = Object.entries(result.features)
          .filter(([_, value]) => value)
          .map(([key, _]) => key)
          .join(', ');
        console.log(`   ✨ Features: ${featureList || 'None detected'}`);
      }
      
      if (result.error) {
        console.log(`   ⚠️  Issue: ${result.error}`);
      }
    });

    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('-'.repeat(30));

    if (sortedResults.length > 0) {
      const best = sortedResults[0];
      console.log(`\n✨ BEST COMMIT: ${best.hash.substring(0, 7)}`);
      console.log(`📄 Description: ${best.description}`);
      console.log(`📊 Score: ${best.score}`);
      
      if (best.features) {
        console.log('\n🔍 Key Features Found:');
        Object.entries(best.features).forEach(([feature, hasFeature]) => {
          if (hasFeature) {
            console.log(`   ✅ ${feature}`);
          }
        });
      }

      console.log(`\n🚀 TO USE THIS VERSION:`);
      console.log(`   git checkout ${best.hash}`);
      console.log(`   npm install`);
      console.log(`   npm run start:all`);
    } else {
      console.log('❌ No working commits found. Current version may be the best option.');
    }

    // Failed commits
    const failedResults = this.results.filter(r => r.score < 0);
    if (failedResults.length > 0) {
      console.log('\n❌ FAILED COMMITS:');
      console.log('-'.repeat(30));
      failedResults.forEach(result => {
        console.log(`   ${result.hash.substring(0, 7)}: ${result.error}`);
      });
    }

    // Save detailed results to file
    const reportFile = 'commit-test-report.json';
    fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);
    
    console.log('\n' + '='.repeat(80));
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new CommitTester();
  tester.run().catch(console.error);
}

module.exports = CommitTester; 