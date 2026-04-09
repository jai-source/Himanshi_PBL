# Voice Control System - Quick Start Guide

## Installation & Setup

### Prerequisites
- Node.js 18+ installed
- Python 3.8+ with YOLO dependencies
- Browser with Web Speech API support (Chrome, Firefox, Edge)
- Microphone connected

### Step 1: Install Dependencies
```bash
# Frontend dependencies
pnpm install

# Python dependencies (if not already installed)
pip install ultralytics opencv-python torch numpy
```

### Step 2: Set Up Environment Variables
Create `.env.local` or set system environment variables:
```env
DETECTIFY_MODEL_DIR=C:\Users\mhima\OneDrive\Desktop\currencyd\Indian-Currency-Detection
DETECTIFY_MODEL_PYTHON=C:\path\to\python.exe
```

### Step 3: Verify Models
Ensure the following models are in your model directory:
- ✓ `yolov5s.pt` - Object detection model
- ✓ `best.pt` - Currency detection model

### Step 4: Start Development Server
```bash
# Start backend server
npm run dev:server

# In another terminal, start frontend
npm run dev:client
```

### Step 5: Access Voice Control
1. Navigate to `http://localhost:5173/` (or your dev port)
2. Create account or login
3. Go to `/voice` to access voice control page
4. Click "Start Listening" and test commands

---

## Voice Commands Quick Reference

### Command: "Open Detectify"
```
Effect: Starts real-time object detection
- Camera opens automatically
- Real-time bounding boxes with confidence %
- FPS counter displayed
- Speech output: "Detected [object] with [confidence]%"
```

### Command: "Detectify see the currency"  
```
Effect: Switches to currency detection mode
- Currency detection activates
- Checks frames every 2 seconds
- Identifies currency notes
- Speech output: "Detected [note] rupees with [confidence]%"
```

### Command: "Stop"
```
Effect: Closes current detection mode
- Returns to idle state
- Camera closes
- Ready for next command
```

---

## Troubleshooting

### Issue: "Speech Recognition not supported"
**Solution**: Use Chrome, Edge, or Firefox. Safari not supported.

### Issue: Microphone permission not requested
**Solution**: 
1. Check if browser has permission dialogopen
2. Allow microphone when prompted
3. Or go to browser settings → Permissions → Microphone → Allow

### Issue: No sound output
**Solution**:
1. Check system volume
2. Check browser isn't muted
3. Test with another browser
4. Try: `window.speechSynthesis.speak(new SpeechSynthesisUtterance("test"))`

### Issue: Detections very slow or not working
**Solution**:
1. Check backend server is running
2. Verify Python bridge can access models
3. Check browser console for errors (F12)
4. Ensure good lighting for currency detection
5. Try uploading a test image on dashboard first

### Issue: Camera not opening
**Solution**:
1. Verify camera is connected
2. Allow browser camera permission
3. No other app using camera
4. Try different browser
5. Restart computer if persists

---

## Testing the System

### Test 1: Voice Recognition
```javascript
// In browser console
navigator.mediaDevices.getUserMedia({audio: true})
.then(stream => {
  console.log("✓ Microphone access granted");
  stream.getTracks().forEach(t => t.stop());
})
.catch(err => console.log("✗ Microphone error:", err));
```

### Test 2: Speech Synthesis
```javascript
// In browser console
const utterance = new SpeechSynthesisUtterance("Hello, detectify is working");
window.speechSynthesis.speak(utterance);
```

### Test 3: Web Speech API
```javascript
// In browser console
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  console.log("✓ Web Speech API available");
} else {
  console.log("✗ Web Speech API not supported");
}
```

### Test 4: Camera & Canvas
```javascript
// In browser console
navigator.mediaDevices.getUserMedia({video: true})
.then(stream => {
  console.log("✓ Camera access granted");
  stream.getTracks().forEach(t => t.stop());
})
.catch(err => console.log("✗ Camera error:", err));
```

---

## Performance Optimization

### For Faster Detections
1. Use smaller YOLO model (nano/tiny)
2. Lower camera resolution
3. Run on GPU if available
4. Close unnecessary browser tabs
5. Use dedicated GPU machine

### For Better Accuracy
1. Improve lighting conditions
2. Ensure clear object view
3. Keep camera steady
4. Use larger YOLO model (medium/large)
5. Retrain model on specific objects

---

## Integration with Existing Dashboard

The voice control system is fully integrated:

### From Dashboard (`/dashboard`)
- Keep existing camera and detection features
- Users can now also access `/voice` for voice-controlled mode
- Both systems use same backend APIs
- History and results are separate

### Add Link to Navigation (Optional)
Update `client/components/Navbar.tsx` to include:
```typescript
{ label: "voice control", path: "/voice" }
```

---

## File Locations

```
Main Components:
- /client/components/VoiceController.tsx
- /client/components/RealtimeObjectDetector.tsx
- /client/components/CurrencyDetector.tsx

Hooks:
- /client/hooks/use-voice-recognition.ts
- /client/hooks/use-speech-synthesis.ts

Pages:
- /client/pages/VoiceDetection.tsx

Backend:
- /server/routes/currency.ts (handles both endpoints)
- /server/services/currencyBridge.ts (Python interface)

Python:
- /python/currency_bridge.py (model inference)

Documentation:
- VOICE_CONTROL_GUIDE.md (comprehensive guide)
- This file (quick start)
```

---

## Common Commands to Remember

```bash
# Start development
npm run dev

# Build for production  
npm run build

# Test backend only
npm run dev:server

# Test frontend only
npm run dev:client

# Check Python setup
python --version
pip list | grep -i yolo
```

---

## Next Steps

1. ✓ Installation complete
2. ✓ Test voice commands
3. ✓ Verify camera works with objects
4. ✓ Test currency detection
5. → Deploy to production when ready

---

## Support

Check `VOICE_CONTROL_GUIDE.md` for:
- Detailed feature explanations
- API documentation
- Browser compatibility matrix
- Advanced troubleshooting
- Future enhancement ideas

