// backend/index.js
// Minimal Express backend for YouThumbAI pipeline

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// POST /api/download-video
app.post('/api/download-video', async (req, res) => {
  const { url } = req.body;
  // TODO: Download YouTube video using ytdl-core or similar
  // Save to disk, return file path or ID
  // For now, mock response
  res.json({ videoPath: '/tmp/mock_video.mp4' });
});

// POST /api/extract-frames
app.post('/api/extract-frames', async (req, res) => {
  const { videoPath } = req.body;
  // TODO: Use ffmpeg to extract frames from videoPath
  // Return array of frame image paths
  // For now, mock response
  res.json({ framePaths: ['/tmp/frame1.jpg', '/tmp/frame2.jpg'] });
});

// POST /api/detect-faces
app.post('/api/detect-faces', async (req, res) => {
  const { framePaths } = req.body;
  // TODO: Call Replicate API for face detection on each frame
  // Return array of detected faces with metadata
  // For now, mock response
  res.json({ faces: [
    { frame: '/tmp/frame1.jpg', faces: [{ bbox: [10,10,100,100], id: 1 }] },
    { frame: '/tmp/frame2.jpg', faces: [{ bbox: [20,20,120,120], id: 1 }] }
  ] });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  // Server ready for requests
});
