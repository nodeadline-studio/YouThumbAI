#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const commits = [
  { hash: 'c79ed30', description: 'FIXED DOUBLE INPUT SCREEN ISSUE' },
  { hash: 'bf57030', description: 'BLANK CANVAS FIRST APPROACH' },
  { hash: '53db888', description: 'Remove double input screen - streamline user flow' }
];

let currentCommit = null;
let serverProcess = null;

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

function killExistingServers() {
  console.log('🔄 Stopping any existing servers...');
  execCommand('pkill -f "vite|npm.*dev" || true', { silent: true });
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

function startServer() {
  console.log('🚀 Starting development server...');
  
  return new Promise((resolve, reject) => {
    const server = spawn('npm', ['run', 'start:all'], {
      detached: false,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let startupTimeout = setTimeout(() => {
      server.kill();
      reject(new Error('Server startup timeout'));
    }, 30000);

    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('localhost:5173')) {
        clearTimeout(startupTimeout);
        setTimeout(() => resolve(server), 3000); // Give extra time for full startup
      }
    });

    server.on('error', (error) => {
      clearTimeout(startupTimeout);
      reject(error);
    });
    
    serverProcess = server;
  });
}

function waitForServer() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 20;
    
    function checkServer() {
      attempts++;
      try {
        execCommand('curl -s http://localhost:5173 > /dev/null', { silent: true });
        console.log('✅ Server is ready');
        resolve();
      } catch (error) {
        if (attempts >= maxAttempts) {
          reject(new Error('Server failed to start'));
        } else {
          console.log(`⏳ Waiting for server... (${attempts}/${maxAttempts})`);
          setTimeout(checkServer, 1000);
        }
      }
    }
    
    checkServer();
  });
}

async function switchToCommit(commit) {
  if (currentCommit === commit.hash) {
    console.log(`📌 Already on commit ${commit.hash}`);
    return true;
  }
  
  console.log(`\n🔄 Switching to commit ${commit.hash} - ${commit.description}`);
  
  killExistingServers();
  
  // Switch commit
  const switchResult = execCommand(`git checkout ${commit.hash}`, { silent: true });
  if (!switchResult.success) {
    console.error(`❌ Failed to switch to commit ${commit.hash}`);
    return false;
  }
  
  console.log('✅ Commit switched successfully');
  currentCommit = commit.hash;
  
  // Start server and wait
  try {
    await startServer();
    await waitForServer();
    return true;
  } catch (error) {
    console.error(`❌ Failed to start server for commit ${commit.hash}: ${error.message}`);
    return false;
  }
}

async function testCommitInterface(commit) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TESTING: ${commit.hash} - ${commit.description}`);
  console.log(`${'='.repeat(80)}`);
  
  const success = await switchToCommit(commit);
  if (!success) {
    return { commit: commit.hash, description: commit.description, score: 0, error: 'Failed to start server' };
  }
  
  // Run the interface test
  console.log('🔍 Running interface evaluation...');
  const testResult = execCommand('npx playwright test tests/manual-interface-evaluation.test.ts --reporter=line', { silent: false });
  
  if (!testResult.success) {
    console.log('❌ Test failed');
    return { commit: commit.hash, description: commit.description, score: 0, error: 'Test execution failed' };
  }
  
  // Extract score from test output
  const output = testResult.output || '';
  const scoreMatch = output.match(/Interface Score: (\d+)\/(\d+) \((\d+)%\)/);
  const score = scoreMatch ? parseInt(scoreMatch[3]) : 0;
  
  console.log(`📊 Score extracted: ${score}%`);
  
  return { 
    commit: commit.hash, 
    description: commit.description, 
    score: score,
    output: output
  };
}

async function main() {
  console.log('🎯 YOUTHUMAI INTERFACE COMPARISON TOOL');
  console.log('Testing 3 commits to find the most usable interface\n');
  
  // Ensure test results directory exists
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results');
  }
  
  const results = [];
  
  try {
    for (const commit of commits) {
      const result = await testCommitInterface(commit);
      results.push(result);
      
      // Save screenshot with commit info
      const screenshotSource = 'test-results/current-version-interface.png';
      const screenshotDest = `test-results/interface-${commit.hash}.png`;
      
      if (fs.existsSync(screenshotSource)) {
        fs.copyFileSync(screenshotSource, screenshotDest);
        console.log(`📸 Screenshot saved: ${screenshotDest}`);
      }
    }
    
    // Generate final report
    console.log('\n' + '='.repeat(100));
    console.log('🏆 FINAL INTERFACE COMPARISON REPORT');
    console.log('='.repeat(100));
    
    // Sort by score
    const sortedResults = results.sort((a, b) => b.score - a.score);
    
    console.log('\n📋 RANKING:');
    sortedResults.forEach((result, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      console.log(`${medal} #${index + 1}: ${result.commit} - ${result.description}`);
      console.log(`   Score: ${result.score}%`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });
    
    const winner = sortedResults[0];
    console.log('🎯 RECOMMENDATION:');
    console.log(`✨ Use commit ${winner.commit} - ${winner.description}`);
    console.log(`🏆 Score: ${winner.score}% usability`);
    
    if (winner.score >= 80) {
      console.log('🌟 This version has EXCELLENT usability!');
    } else if (winner.score >= 60) {
      console.log('👍 This version has GOOD usability with room for improvement');
    } else {
      console.log('⚠️  This version needs significant usability improvements');
    }
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      winner: winner,
      results: sortedResults,
      recommendation: `Use commit ${winner.commit} - ${winner.description} (${winner.score}% score)`
    };
    
    fs.writeFileSync('test-results/interface-comparison-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Detailed report saved: test-results/interface-comparison-report.json');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log(`1. Switch to the winning commit: git checkout ${winner.commit}`);
    console.log('2. Start the server: npm run start:all');
    console.log('3. Test manually at http://localhost:5173');
    console.log('4. Deploy to production when satisfied');
    
  } catch (error) {
    console.error('❌ Comparison failed:', error.message);
  } finally {
    killExistingServers();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Received interrupt signal. Cleaning up...');
  killExistingServers();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received terminate signal. Cleaning up...');
  killExistingServers();
  process.exit(0);
});

main().catch(console.error); 