# YouThumbAI - Setup Guide

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ installed
- OpenAI API account (required)
- YouTube Data API key (required)
- Replicate account (optional - for face swap)

---

## 📋 **STEP 1: Get Your API Keys**

### 🔑 **OpenAI API Key (Required)**
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create account if needed
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-...`)
5. **Cost**: ~$0.04 per thumbnail

### 🔑 **YouTube Data API Key (Required)**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable **YouTube Data API v3**:
   - Go to APIs & Services → Library
   - Search "YouTube Data API v3"
   - Click Enable
4. Create credentials:
   - APIs & Services → Credentials
   - Create Credentials → API Key
   - Copy the key
5. **Cost**: Free (10,000 requests/day)

### 🔑 **Replicate API Token (Optional)**
1. Go to [Replicate](https://replicate.com/)
2. Sign up/login
3. Go to Account → API Tokens
4. Create new token
5. Copy token (starts with `r8_...`)
6. **Cost**: ~$0.003 per face swap

---

## 📋 **STEP 2: Install & Configure**

### **Clone & Install**
```bash
git clone https://github.com/nodeadline-studio/YouThumbAI.git
cd YouThumbAI
npm install
```

### **Environment Configuration**
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your API keys
nano .env
```

### **Add Your API Keys to .env:**
```bash
# Required - OpenAI for AI generation
VITE_OPENAI_API_KEY=sk-your-openai-key-here

# Required - YouTube for video analysis  
VITE_YOUTUBE_API_KEY=your-youtube-api-key-here

# Optional - Replicate for face swap
VITE_REPLICATE_API_TOKEN=r8_your-replicate-token-here

# Development settings
VITE_ENV=development
VITE_DEBUG=true
```

---

## 📋 **STEP 3: Launch Application**

### **Start Development Server**
```bash
npm run dev
```

### **Open in Browser**
- Visit: `http://localhost:5173`
- You should see the YouThumbAI landing page

---

## 🧪 **STEP 4: Test Everything**

### **Basic Test**
1. Paste any YouTube URL (example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
2. Click "Create Thumbnail"
3. Select a style template (Gaming, Tutorial, etc.)
4. Click "Generate"
5. Download result

### **Expected Results**
- ✅ Video analysis completes in 5-10 seconds
- ✅ AI generation takes 30-60 seconds
- ✅ Download delivers 1792x1024 HD thumbnail

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"Invalid YouTube URL"**
- ✅ Use full URL: `https://www.youtube.com/watch?v=VIDEO_ID`
- ✅ Ensure video is public
- ✅ Check YouTube API key is valid

#### **"OpenAI API Error"**
- ✅ Verify API key starts with `sk-`
- ✅ Check billing is enabled on OpenAI account
- ✅ Ensure sufficient credits ($5+ recommended)

#### **"Network Error"**
- ✅ Check internet connection
- ✅ Verify API keys are correctly set
- ✅ Try refreshing the page

#### **"Face Swap Not Working"**
- ✅ Face swap requires Replicate token
- ✅ Add `VITE_REPLICATE_API_TOKEN` to .env
- ✅ Feature is optional - thumbnail works without it

---

## 💰 **Cost Breakdown**

### **Per Thumbnail Generation:**
- **YouTube API**: Free (10,000 requests/day limit)
- **OpenAI DALL-E 3**: ~$0.04 per HD image
- **Replicate Face Swap**: ~$0.003 per operation (optional)
- **Total Cost**: ~$0.04-0.043 per thumbnail

### **Monthly Estimates:**
- **Light usage** (100 thumbnails): ~$4-5
- **Medium usage** (500 thumbnails): ~$20-25  
- **Heavy usage** (2000 thumbnails): ~$80-90

---

## 🎯 **Success Checklist**

- [ ] All API keys configured in .env
- [ ] Application starts without errors
- [ ] Can paste YouTube URL successfully
- [ ] Video analysis works (shows title, thumbnail)
- [ ] AI generation creates thumbnail
- [ ] Can download HD result
- [ ] Templates change generation style
- [ ] Face swap works (if Replicate configured)

---

## 🆘 **Support**

### **Getting Help**
- 📖 Check [Documentation](docs/)
- 🐛 Report issues on [GitHub](https://github.com/nodeadline-studio/YouThumbAI/issues)
- 💬 Questions? Create a discussion

### **API Documentation**
- [OpenAI API Docs](https://platform.openai.com/docs)
- [YouTube Data API Docs](https://developers.google.com/youtube/v3)
- [Replicate API Docs](https://replicate.com/docs)

---

## 🚀 **You're Ready!**

With everything configured, you can now:
- Generate professional thumbnails in 60 seconds
- Process any YouTube URL instantly
- Use 6 different style templates
- Export HD thumbnails ready for upload

**Start creating amazing thumbnails!** ✨ 