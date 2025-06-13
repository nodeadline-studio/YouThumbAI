# 🎬 YouThumbAI Demo Recording Script

## 🚀 Quick Setup
1. Open terminal in project directory
2. Run: `npm run dev`
3. Open browser to: http://localhost:5173
4. Press F12 and run: `localStorage.setItem('demo-mode', 'true')`
5. Refresh page to enable demo controls

## 📋 Recording Scenarios


### Tutorial Video Demo (90s)
**URL**: https://www.youtube.com/watch?v=dQw4w9WgXcQ
**Template**: tutorial
**Features to demonstrate**:
- URL input
- Video analysis
- Template selection
- AI generation
- Export


### Gaming Content Demo (90s)
**URL**: https://www.youtube.com/watch?v=jNQXAC9IVRw
**Template**: gaming
**Features to demonstrate**:
- Gaming template
- High-energy generation
- Style variations
- Export


### Business/Tech Demo (90s)
**URL**: https://www.youtube.com/watch?v=YQHsXMglC9A
**Template**: business
**Features to demonstrate**:
- Professional template
- Premium quality
- Business styling
- Export


### Batch Processing Demo (60s)
**URL**: https://www.youtube.com/watch?v=dQw4w9WgXcQ, https://www.youtube.com/watch?v=jNQXAC9IVRw, https://www.youtube.com/watch?v=YQHsXMglC9A
**Template**: multiple
**Features to demonstrate**:
- Batch panel
- Multiple processing
- Progress tracking
- Bulk download


### Advanced Features Demo (60s)
**URL**: https://www.youtube.com/watch?v=dQw4w9WgXcQ
**Template**: custom
**Features to demonstrate**:
- Face swap
- Custom settings
- Element editing
- Advanced export


## 🎥 Recording Commands

### Start Development Server
```bash
npm run dev
```

### Enable Demo Mode (Browser Console)
```javascript
localStorage.setItem('demo-mode', 'true');
location.reload();
```

### Pre-warm APIs (Browser Console)
```javascript
// Test API connectivity
fetch('/api/health').then(r => console.log('Backend:', r.ok ? 'Ready' : 'Not available'));

// Pre-load demo URLs for faster recording
const demoUrls = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  "https://www.youtube.com/watch?v=YQHsXMglC9A",
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  "https://www.youtube.com/watch?v=YQHsXMglC9A",
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
];
console.log('Demo URLs ready:', demoUrls.length);
```

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
- **Resolution**: 1920x1080
- **Frame Rate**: 30 fps
- **Format**: MP4
- **Quality**: high
- **Audio**: Screen only

### During Recording
- [ ] Use smooth, deliberate mouse movements
- [ ] Pause briefly at key UI elements
- [ ] Allow loading states to complete
- [ ] Show final results clearly
- [ ] Demonstrate export functionality

## 🎞️ Post-Recording

### File Organization
```
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
```

### Export Settings
- **Web**: H.264, 1080p, 30fps, optimized for streaming
- **Social**: Square (1:1) and vertical (9:16) versions
- **Thumbnail**: Generate preview frames for each video

Generated on: 2025-06-13T16:05:08.208Z