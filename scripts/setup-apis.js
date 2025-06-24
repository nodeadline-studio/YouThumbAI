#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  colorLog('cyan', '🚀 YouThumbAI Setup - Enhanced Generation Configuration\n');
  
  colorLog('blue', 'This script will help you configure API keys for:');
  console.log('  • OpenAI (DALL-E 3) - Required for thumbnail generation');
  console.log('  • YouTube API - Required for video analysis');
  console.log('  • Replicate API - Required for face swap and LoRA models');
  console.log('  • Hugging Face - Optional for additional LoRA models\n');

  // Check if .env already exists
  const envPath = path.join(process.cwd(), '.env');
  let envContent = {};
  
  if (fs.existsSync(envPath)) {
    colorLog('yellow', '⚠️  .env file already exists. Current values will be preserved unless you choose to update them.\n');
    
    // Parse existing .env file
    const existingEnv = fs.readFileSync(envPath, 'utf8');
    existingEnv.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envContent[key.trim()] = value.trim();
      }
    });
  }

  colorLog('green', '📋 API Key Configuration\n');

  // OpenAI API Key
  const openaiKey = await configureApiKey(
    'OpenAI API Key',
    'VITE_OPENAI_API_KEY',
    envContent['VITE_OPENAI_API_KEY'],
    'Required for DALL-E 3 thumbnail generation',
    'Get your key at: https://platform.openai.com/api-keys',
    'sk-'
  );

  // YouTube API Key
  const youtubeKey = await configureApiKey(
    'YouTube API Key',
    'VITE_YOUTUBE_API_KEY',
    envContent['VITE_YOUTUBE_API_KEY'],
    'Required for video metadata and thumbnails',
    'Get your key at: https://console.developers.google.com/apis/credentials',
    'AIza'
  );

  // Replicate API Token
  const replicateToken = await configureApiKey(
    'Replicate API Token',
    'VITE_REPLICATE_API_TOKEN',
    envContent['VITE_REPLICATE_API_TOKEN'],
    'Required for face swap and LoRA models',
    'Get your token at: https://replicate.com/account/api-tokens',
    'r8_'
  );

  // Hugging Face Token
  const hfToken = await configureApiKey(
    'Hugging Face Token',
    'VITE_HUGGINGFACE_API_TOKEN',
    envContent['VITE_HUGGINGFACE_API_TOKEN'],
    'Optional for additional LoRA model access',
    'Get your token at: https://huggingface.co/settings/tokens',
    'hf_',
    true
  );

  // Update environment variables
  envContent['VITE_OPENAI_API_KEY'] = openaiKey;
  envContent['VITE_YOUTUBE_API_KEY'] = youtubeKey;
  envContent['VITE_REPLICATE_API_TOKEN'] = replicateToken;
  envContent['VITE_HUGGINGFACE_API_TOKEN'] = hfToken;
  
  // Add development configuration
  envContent['NODE_ENV'] = envContent['NODE_ENV'] || 'development';
  envContent['VITE_API_BASE_URL'] = envContent['VITE_API_BASE_URL'] || 'http://localhost:3001';
  envContent['VITE_ENV'] = envContent['VITE_ENV'] || 'development';
  envContent['VITE_DEBUG'] = envContent['VITE_DEBUG'] || 'true';
  envContent['CORS_PORT'] = envContent['CORS_PORT'] || '3001';

  // Write .env file
  const envFileContent = Object.entries(envContent)
    .filter(([key, value]) => value) // Remove empty values
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(envPath, envFileContent);
  colorLog('green', '✅ .env file created/updated successfully!\n');

  // Test API connections
  colorLog('blue', '🔍 Testing API Connections...\n');
  
  await testApiConnection('OpenAI', openaiKey, testOpenAI);
  await testApiConnection('YouTube', youtubeKey, testYouTube);
  await testApiConnection('Replicate', replicateToken, testReplicate);
  
  if (hfToken) {
    await testApiConnection('Hugging Face', hfToken, testHuggingFace);
  }

  colorLog('green', '\n🎉 Setup Complete!');
  colorLog('blue', '\nNext steps:');
  console.log('  1. Run: npm run start:all');
  console.log('  2. Open: http://localhost:5173');
  console.log('  3. Try generating your first thumbnail!\n');
  
  colorLog('yellow', '💡 Pro Tips:');
  console.log('  • Use "Enhanced Mode" for local video analysis');
  console.log('  • Upload video screenshots for better face extraction');
  console.log('  • Try different LoRA models for unique styles');
  console.log('  • Enable multi-language support for global content\n');

  rl.close();
}

async function configureApiKey(name, envKey, currentValue, description, getInstructions, prefix = '', optional = false) {
  colorLog('magenta', `🔑 ${name}`);
  console.log(`   ${description}`);
  console.log(`   ${getInstructions}\n`);
  
  if (currentValue && currentValue !== 'your_api_key_here' && currentValue.startsWith(prefix)) {
    console.log(`   Current: ${currentValue.substring(0, 10)}...\n`);
    const keep = await question(`   Keep existing ${name}? (y/n): `);
    if (keep.toLowerCase() === 'y') {
      return currentValue;
    }
  }
  
  const optionalText = optional ? ' (Press Enter to skip)' : '';
  const key = await question(`   Enter ${name}${optionalText}: `);
  
  if (optional && !key) {
    return '';
  }
  
  if (!optional && (!key || !key.startsWith(prefix))) {
    colorLog('red', `   ❌ Invalid ${name}. Must start with "${prefix}"`);
    return await configureApiKey(name, envKey, currentValue, description, getInstructions, prefix, optional);
  }
  
  return key;
}

async function testApiConnection(name, key, testFunction) {
  if (!key) {
    colorLog('yellow', `⏭️  Skipping ${name} test (no key provided)`);
    return;
  }
  
  try {
    process.stdout.write(`   Testing ${name}... `);
    await testFunction(key);
    colorLog('green', '✅ Connected');
  } catch (error) {
    colorLog('red', '❌ Failed');
    console.log(`     Error: ${error.message}`);
  }
}

async function testOpenAI(apiKey) {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data.data || !Array.isArray(data.data)) {
    throw new Error('Invalid response format');
  }
}

async function testYouTube(apiKey) {
  // Test with a simple quota-friendly request
  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&key=${apiKey}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }
}

async function testReplicate(token) {
  const response = await fetch('https://api.replicate.com/v1/models', {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}

async function testHuggingFace(token) {
  const response = await fetch('https://huggingface.co/api/whoami', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}

// Handle fetch for Node.js environments
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

main().catch(error => {
  colorLog('red', `\n❌ Setup failed: ${error.message}`);
  process.exit(1);
}); 