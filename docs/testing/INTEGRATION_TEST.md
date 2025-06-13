# Face Swap Integration Test

## 🧪 Testing the New Face Swap Feature

### Prerequisites
1. Get API keys:
   - OpenAI API key (required)
   - YouTube API key (required) 
   - Replicate API token (for face swap)

2. Create `.env` file:
```bash
VITE_OPENAI_API_KEY=your_openai_key_here
VITE_YOUTUBE_API_KEY=your_youtube_key_here
VITE_REPLICATE_API_TOKEN=your_replicate_token_here
```

### Test Steps

#### Step 1: Test Basic Generation (Without Face Swap)
1. Start the app: `npm run dev`
2. Enter a YouTube URL with a clear person in thumbnail
3. Verify metadata extraction works
4. Generate thumbnail WITHOUT face swap enabled
5. ✅ Should work with current DALL-E integration

#### Step 2: Test Face Swap Interface
1. With video loaded, check if Face Swap section appears
2. If Replicate not configured: Should show "Face Swap (Disabled)" section
3. If Replicate configured: Should show Face Swap toggle with thumbnail preview
4. Toggle face swap ON
5. ✅ UI should update to show "Face swap will be applied" message

#### Step 3: Test Face Swap Generation
1. With face swap enabled, click "Generate Thumbnails"
2. Should see extended loading time (~30-60 seconds total)
3. Console should show:
   - "Detecting faces in thumbnail: [url]"
   - "Found X faces, performing face swap" 
   - "Face swap completed for [variation]"
4. Generated images should show: "Original Style (with face swap)"
5. ✅ Face from original thumbnail should appear in new AI scene

#### Step 4: Test Fallback Behavior
1. Test with thumbnail that has no detectable faces
2. Should fall back to regular AI generation
3. Test with invalid Replicate API token
4. Should gracefully degrade to DALL-E only
5. ✅ No errors should break the generation flow

### Expected Results

#### Working Correctly:
- ✅ YouTube API extracts video metadata
- ✅ DALL-E generates background scenes
- ✅ Face detection identifies faces in thumbnails
- ✅ Face swap integrates faces into new scenes
- ✅ UI shows clear feedback for each step
- ✅ Fallback works when face swap fails

#### Success Metrics:
- Generation time: 30-60 seconds (including face swap)
- Face swap success rate: >70% on thumbnails with clear faces
- User experience: Clear feedback throughout process
- Cost: ~$0.07 per generation ($0.04 DALL-E + $0.03 Replicate)

### Troubleshooting

#### Common Issues:
1. **"Replicate API token not configured"**
   - Add VITE_REPLICATE_API_TOKEN to .env file

2. **Face swap takes too long**
   - Increase timeout in replicateService.ts
   - Check Replicate API status

3. **No faces detected**
   - Use thumbnails with clear, front-facing people
   - Check face detection confidence threshold

4. **Face swap fails**
   - Should gracefully fall back to AI-only generation
   - Check console for error messages

### Performance Benchmarks

#### Target Performance:
- YouTube metadata: <2 seconds
- DALL-E generation: 10-20 seconds  
- Face detection: 3-5 seconds
- Face swap: 15-30 seconds
- **Total: 30-60 seconds end-to-end**

#### Cost per Generation:
- YouTube API: FREE
- DALL-E 3 HD: $0.04
- Face detection: $0.01
- Face swap: $0.02
- **Total: ~$0.07**

### Ready for Production When:
- [ ] All test steps pass consistently
- [ ] Error handling works for all edge cases
- [ ] Performance meets target benchmarks
- [ ] UI provides clear feedback throughout
- [ ] Cost per generation is predictable

**This approach is much better than video processing because:**
1. **10x faster** (no video download)
2. **100x cheaper** (no storage costs)
3. **More reliable** (fewer failure points)
4. **Better UX** (immediate feedback)
5. **Scalable** (can process hundreds quickly) 