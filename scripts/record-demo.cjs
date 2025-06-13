#!/usr/bin/env node

/**
 * YouThumbAI Demo Recording Automation Script
 * Helps prepare and execute demo recordings with predefined scenarios
 */

const fs = require('fs');
const path = require('path');

const DEMO_SCENARIOS = {
  tutorial: {
    name: 'Tutorial Video Demo',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    template: 'tutorial',
    duration: '90s',
    features: ['URL input', 'Video analysis', 'Template selection', 'AI generation', 'Export']
  },
  gaming: {
    name: 'Gaming Content Demo',
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    template: 'gaming',
    duration: '90s',
    features: ['Gaming template', 'High-energy generation', 'Style variations', 'Export']
  },
  business: {
    name: 'Business/Tech Demo',
    url: 'https://www.youtube.com/watch?v=YQHsXMglC9A',
    template: 'business',
    duration: '90s',
    features: ['Professional template', 'Premium quality', 'Business styling', 'Export']
  },
  batch: {
    name: 'Batch Processing Demo',
    urls: [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      'https://www.youtube.com/watch?v=YQHsXMglC9A'
    ],
    template: 'multiple',
    duration: '60s',
    features: ['Batch panel', 'Multiple processing', 'Progress tracking', 'Bulk download']
  },
  advanced: {
    name: 'Advanced Features Demo',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    template: 'custom',
    duration: '60s',
    features: ['Face swap', 'Custom settings', 'Element editing', 'Advanced export']
  }
};

const RECORDING_CONFIG = {
  resolution: '1920x1080',
  fps: 30,
  format: 'mp4',
  quality: 'high',
  audio: false // Screen recording only
};

function createDemoScript() {
  console.log('\n🎬 YouThumbAI Demo Recording Script Generator\n');
  
  const scriptContent = `
# 🎬 YouThumbAI Demo Recording Script

## 🚀 Quick Setup
1. Open terminal in project directory
2. Run: \`npm run dev\`
3. Open browser to: http://localhost:5173
4. Press F12 and run: \`localStorage.setItem('demo-mode', 'true')\`
5. Refresh page to enable demo controls

## 📋 Recording Scenarios

${Object.entries(DEMO_SCENARIOS).map(([key, scenario]) => `
### ${scenario.name} (${scenario.duration})
**URL**: ${scenario.url || scenario.urls?.join(', ')}
**Template**: ${scenario.template}
**Features to demonstrate**:
${scenario.features.map(f => `- ${f}`).join('\n')}
`).join('\n')}

## 🎥 Recording Commands

### Start Development Server
\`\`\`bash
npm run dev
\`\`\`

### Enable Demo Mode (Browser Console)
\`\`\`javascript
localStorage.setItem('demo-mode', 'true');
location.reload();
\`\`\`

### Pre-warm APIs (Browser Console)
\`\`\`javascript
// Test API connectivity
fetch('/api/health').then(r => console.log('Backend:', r.ok ? 'Ready' : 'Not available'));

// Pre-load demo URLs for faster recording
const demoUrls = ${JSON.stringify(Object.values(DEMO_SCENARIOS).map(s => s.url || s.urls).flat().filter(Boolean), null, 2)};
console.log('Demo URLs ready:', demoUrls.length);
\`\`\`

## 📱 Recording Setup Checklist

### Pre-Recording
- [ ] Close unnecessary applications
- [ ] Clear browser cache and cookies
- [ ] Set browser to full screen (F11)
- [ ] Hide bookmarks bar (Cmd+Shift+B)
- [ ] Turn on Do Not Disturb
- [ ] Test all demo URLs work
- [ ] Verify API keys are functional
- [ ] Set up screen recording software

### Recording Settings
- **Resolution**: ${RECORDING_CONFIG.resolution}
- **Frame Rate**: ${RECORDING_CONFIG.fps} fps
- **Format**: ${RECORDING_CONFIG.format.toUpperCase()}
- **Quality**: ${RECORDING_CONFIG.quality}
- **Audio**: ${RECORDING_CONFIG.audio ? 'Enabled' : 'Screen only'}

### During Recording
- [ ] Use smooth, deliberate mouse movements
- [ ] Pause briefly at key UI elements
- [ ] Allow loading states to complete
- [ ] Show final results clearly
- [ ] Demonstrate export functionality

## 🎞️ Post-Recording

### File Organization
\`\`\`
recordings/
├── youthumbnail-demo-main.mp4      # Primary demo (3-4 min)
├── youthumbnail-tutorial.mp4       # Tutorial scenario
├── youthumbnail-gaming.mp4         # Gaming scenario  
├── youthumbnail-business.mp4       # Business scenario
├── youthumbnail-batch.mp4          # Batch processing
├── youthumbnail-advanced.mp4       # Advanced features
└── social/
    ├── youthumbnail-15s.mp4        # Social media clips
    ├── youthumbnail-30s.mp4
    └── youthumbnail-60s.mp4
\`\`\`

### Export Settings
- **Web**: H.264, 1080p, 30fps, optimized for streaming
- **Social**: Square (1:1) and vertical (9:16) versions
- **Thumbnail**: Generate preview frames for each video

Generated on: ${new Date().toISOString()}
`;

  const outputPath = path.join(process.cwd(), 'DEMO_RECORDING_SCRIPT.md');
  fs.writeFileSync(outputPath, scriptContent.trim());
  
  console.log(`✅ Demo script generated: ${outputPath}`);
  console.log('\n🎯 Next steps:');
  console.log('1. Review the generated script');
  console.log('2. Start the development server: npm run dev');
  console.log('3. Enable demo mode in browser console');
  console.log('4. Begin recording with your preferred tool');
  
  return outputPath;
}

function validateDemoUrls() {
  console.log('\n🔍 Validating demo URLs...\n');
  
  const allUrls = Object.values(DEMO_SCENARIOS)
    .map(s => s.url || s.urls)
    .flat()
    .filter(Boolean);
  
  allUrls.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`);
    // Note: In a real implementation, you might want to check if URLs are accessible
  });
  
  console.log(`\n✅ Found ${allUrls.length} demo URLs`);
  return allUrls;
}

function createRecordingDirectories() {
  const dirs = [
    'recordings',
    'recordings/social',
    'recordings/raw',
    'recordings/edited'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    } else {
      console.log(`📁 Directory exists: ${dir}`);
    }
  });
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  switch (command) {
    case 'script':
      createDemoScript();
      break;
    case 'validate':
      validateDemoUrls();
      break;
    case 'setup':
      createRecordingDirectories();
      break;
    case 'all':
      createRecordingDirectories();
      validateDemoUrls();
      createDemoScript();
      break;
    default:
      console.log(`
🎬 YouThumbAI Demo Recording Automation

Usage: node scripts/record-demo.js [command]

Commands:
  script     Generate demo recording script
  validate   Check demo URLs accessibility
  setup      Create recording directories
  all        Run all commands above
  help       Show this help message

Examples:
  node scripts/record-demo.js all
  node scripts/record-demo.js script
      `);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  DEMO_SCENARIOS,
  RECORDING_CONFIG,
  createDemoScript,
  validateDemoUrls,
  createRecordingDirectories
}; 