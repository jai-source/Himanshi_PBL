# Detectify Voice Control System - Implementation Guide

## Overview

The Detectify application now includes a comprehensive **voice-controlled real-time detection system** that allows users to:

1. **Open Detectify** - Start real-time object detection with live camera feed
2. **Detectify see the currency** - Switch to currency detection mode for identifying notes with confidence scores
3. **Stop** - Close current detection mode

All detection results are announced using **text-to-speech**, and the system includes real-time bounding box visualization with confidence percentages.

---

## Features Implemented

### 1. Voice Recognition Hook (`client/hooks/use-voice-recognition.ts`)
- Uses Web Speech API for continuous voice input
- Supports interim results for real-time feedback
- Handles language selection (default: en-US)
- Error handling and browser compatibility detection
- Provides methods: `startListening()`, `stopListening()`, `resetTranscript()`

### 2. Speech Synthesis Hook (`client/hooks/use-speech-synthesis.ts`)
- Text-to-speech output using Speech Synthesis API
- Configurable rate, pitch, and volume
- Play, pause, resume, and stop controls
- Error handling for unsupported browsers

### 3. Voice Controller Component (`client/components/VoiceController.tsx`)
- Central control interface for voice commands
- Displays listening status and current mode
- Command history tracking
- Available commands:
  - "Open Detectify" / "Start Detectify" → Object Detection
  - "See the Currency" / "Detect Currency" → Currency Detection
  - "Stop" / "Close" → Exit current mode

### 4. Real-time Object Detector (`client/components/RealtimeObjectDetector.tsx`)
- Live webcam feed processing
- Continuous YOLO object detection (~1-2 FPS)
- Real-time bounding box visualization
- Confidence percentage display
- FPS counter and frame statistics
- Automatic verbal announcement of detected objects (> 50% confidence)

### 5. Currency Detector (`client/components/CurrencyDetector.tsx`)
- Currency-specific detection mode
- Real-time camera feed
- Detection every 2 seconds for currency notes
- Verbal announcement of detected currency and confidence
- Status display for detection results

### 6. Voice Detection Page (`client/pages/VoiceDetection.tsx`)
- Dedicated page at `/voice` (protected route)
- Clean interface for voice-controlled detection
- Easy access through routing system

---

## How It Works End-to-End

### Flow Diagram

```
User says "Open Detectify"
    ↓
Voice Recognition captures speech
    ↓
VoiceController processes command
    ↓
Matches "open detectify" pattern
    ↓
Text-to-speech announces "Opening real-time object detection"
    ↓
RealtimeObjectDetector component loads
    ↓
Camera permission requested
    ↓
Continuous frame capture (video canvas)
    ↓
Frames sent to /api/detect/objects
    ↓
Backend processes with YOLOv5 model
    ↓
Returns detections with bounding boxes
    ↓
Front-end renders bounding boxes on canvas
    ↓
Announcements made for high-confidence detections
    ↓
Display FPS, detection count, confidence percentages
```

### Currency Detection Flow

```
User says "Detectify see the currency"
    ↓
VoiceController matches command
    ↓
Switches to currency detection mode
    ↓
CurrencyDetector component loads
    ↓
Camera starts, captures every 2 seconds
    ↓
Sends frame to /api/detect/currency
    ↓
Backend processes with currency detection model
    ↓
Returns detected note, confidence, status
    ↓
Text-to-speech announces result
    ↓
Display result card with confidence %
```

---

## API Endpoints Used

### Object Detection
- **Endpoint**: `POST /api/detect/objects`
- **Input**: `{ imageData: string }` (base64 encoded image)
- **Output**: `{ detections: [{label, confidence, box: [x1,y1,x2,y2]}] }`
- **Backend**: Uses YOLOv5s model

### Currency Detection
- **Endpoint**: `POST /api/detect/currency`
- **Input**: `{ imageData: string }` (base64 encoded image)
- **Output**: `{ note, confidence, status, matchedTemplate, goodMatches }`
- **Backend**: Uses best.pt (currency detection) model

---

## Browser Requirements

✅ **Supported Browsers:**
- Chrome/Chromium (full support)
- Edge (full support)
- Firefox (full support) with flag enabled
- Safari (limited - Speech Recognition requires specific setup)

❌ **Required Features:**
- Web Speech API (for voice recognition)
- Speech Synthesis API (for text-to-speech)
- MediaStream API (for camera access)
- Canvas API (for image processing)

---

## Usage Instructions

### Starting Voice Control

1. Navigate to `/voice` (auto-protected, requires login)
2. Click "Start Listening" button
3. Your browser will request microphone permission
4. Say one of the available commands

### Available Voice Commands

| Command | Action | Result |
|---------|--------|--------|
| "Open Detectify" | Start object detection | Real-time camera feed with bounding boxes |
| "Start Detectify" | Start object detection | Real-time camera feed with bounding boxes |
| "See the currency" | Start currency detection | Currency detection mode active |
| "Detect currency" | Start currency detection | Currency detection mode active |
| "Stop" | Stop current detection | Closes detection, returns to idle |
| "Close" | Stop current detection | Closes detection, returns to idle |

### Visual Feedback

- **Listening Status**: 🔴 Red indicator when actively listening
- **Object Detection Mode**: 🟢 Green indicator + real-time bounding boxes
- **Currency Detection Mode**: 🟡 Yellow indicator + result cards
- **Detection Confidence**: Displayed as percentage on each detected item

---

## Performance Considerations

### Real-time Object Detection
- **Frame Rate**: ~1-2 FPS (depends on model and hardware)
- **Latency**: ~500-1000ms per frame
- **Camera Resolution**: 1280x720 (adjustable)
- **Model**: YOLOv5s (small, fast)

### Currency Detection
- **Sampling Rate**: Every 2 seconds
- **Model**: best.pt (trained for Indian currency)
- **Confidence Threshold**: Displays all detections, highlights > 50%

### Optimization Tips
- Use modern browser (Chrome recommended)
- Ensure good lighting for currency detection
- Keep camera steady for consistent detections
- Close unnecessary browser tabs for better performance

---

## File Structure

```
client/
├── components/
│   ├── VoiceController.tsx      // Main voice control UI
│   ├── RealtimeObjectDetector.tsx  // Object detection view
│   ├── CurrencyDetector.tsx     // Currency detection view
│   └── ui/button.tsx            // Existing button component
├── hooks/
│   ├── use-voice-recognition.ts // Voice input hook
│   └── use-speech-synthesis.ts   // Text-to-speech hook
└── pages/
    └── VoiceDetection.tsx        // Voice detection page
```

---

## Error Handling

### Browser or Feature Not Supported
- Displays warning banner in voice panel
- Clear message about required browser features
- Suggests alternative approaches

### Microphone Permission Denied
- Voice recognition gracefully disabled
- User can still use traditional image upload on dashboard
- Option to retry permission later

### API Detection Errors
- Timeout protection (30 seconds)
- Graceful error messages
- Automatic retry capability
- Fallback to manual detection

### Camera Not Available
- Camera access permission request shown
- User-friendly error message
- Option to switch to file upload mode

---

## Backend Integration

### Python Bridge (`python/currency_bridge.py`)
The system uses the existing Python bridge to:
- Load YOLO models (YOLOv5 for objects, best.pt for currency)
- Process frames
- Return detections in JSON format

### Environment Variables
```env
DETECTIFY_MODEL_DIR=C:\Users\mhima\OneDrive\Desktop\currencyd\Indian-Currency-Detection
DETECTIFY_MODEL_PYTHON=<path-to-python-executable>
```

### Model Requirements
- ✅ YOLOv5s.pt (for object detection) - included
- ✅ best.pt (for currency detection) - must be placed in model directory
- Both models should output with confidence scores

---

## Accessibility Features

The voice control system provides several accessibility benefits:

✓ **Screen Reader Compatible**: Command history displayed as text
✓ **Voice Input**: No need to type commands
✓ **Voice Output**: All results are spoken aloud
✓ **Visual Indicators**: Clear status displays
✓ **Large Text**: Configurable font sizes
✓ **Confidence Scores**: Makes detection results understandable

---

## Future Enhancements

Possible improvements for future versions:

1. **Custom Wake Words**: Detect "Detectify" as wake phrase
2. **Multi-language Support**: Add support for Hindi, other languages
3. **Offline Speech Recognition**: Local processing for privacy
4. **Advanced Statistics**: Detection history and trends
5. **Batch Processing**: Process multiple frames in parallel
6. **Edge Deployment**: Run models locally on device
7. **Mobile Optimization**: Better mobile camera handling
8. **Gesture Recognition**: Combine voice with hand gestures
9. **Model Switching**: Allow user to select different YOLO models (nano, small, medium, etc.)
10. **Recording Capability**: Save detections with audio

---

## Troubleshooting

### No Sound Output
- Check browser speaker volume
- Check system mute status
- Allow browser to play audio
- Try different browser
- Check if Text-to-Speech is supported

### Microphone Not Detected
- Check with `navigator.mediaDevices.enumerateDevices()`
- Verify microphone is connected
- Check browser permissions
- Restart browser
- Try different browser

### Slow Detection
- Close background apps
- Use smaller camera resolution
- Consider using smaller YOLO model (nano/tiny)
- Check GPU availability
- Monitor CPU/Memory usage

### Inaccurate Detections
- Improve lighting conditions
- Keep objects within frame
- Adjust camera angle
- Verify model is loaded correctly
- Check if model needs retraining

---

## Testing Checklist

- [ ] Voice recognition works (browser shows permission request)
- [ ] "Open Detectify" command triggers object detection
- [ ] Camera feed displays in real-time
- [ ] Bounding boxes appear with confidence percentages
- [ ] Text-to-speech announces detections
- [ ] FPS counter updates
- [ ] "Currency" command switches modes
- [ ] Currency detection result displays
- [ ] Confidence scores are accurate
- [ ] "Stop" command exits detection mode
- [ ] Command history logs commands
- [ ] Works in Chrome, Firefox, and Edge
- [ ] Mobile compatibility (if applicable)
- [ ] Error messages display correctly
- [ ] App recovers from permission denials

---

## Support & Contact

For issues or questions about the voice control system:
1. Check browser console for errors (F12)
2. Verify browser compatibility
3. Test with sample images on dashboard first
4. Check backend logs for Python bridge errors
5. Report issues with:
   - Browser version
   - Operating system
   - Error message
   - Steps to reproduce

