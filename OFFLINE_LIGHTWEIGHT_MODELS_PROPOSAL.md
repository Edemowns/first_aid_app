# Technical Proposal: Incorporating Lightweight Models for Offline First Aid Mode

This proposal outlines the strategic roadmap and technical approaches for incorporating on-device, lightweight machine learning models to enhance the offline mode of the AIDA First Aid Application.

---

## 1. Executive Summary
Currently, our app uses a **highly optimized rule-based keyword matching engine** for offline triage. While extremely fast (<10ms) and lightweight (2KB), incorporating on-device machine learning models can expand the app's understanding of complex, natural language descriptions without internet access.

We propose a **three-tiered architecture** to balance app download size, battery consumption, and execution performance, particularly tailored for devices running in low-resource environments like rural Ghana.

---

## 2. Recommended On-Device ML Technologies

To integrate lightweight models directly into our React Native app, we recommend three distinct pathways depending on the target feature.

### A. ONNX Runtime Web / Mobile (Recommended for Text Triage)
ONNX (Open Neural Network Exchange) Runtime provides an optimized engine for running quantized models on-device.

*   **Model Type:** Quantized DistilBERT or MobileBERT (for text classification).
*   **Size:** Compressed to **15MB - 25MB** through 8-bit integer quantization (INT8).
*   **Why it works:** It can run locally inside React Native using Web Assembly (Wasm) or native bindings, permitting high-accuracy classification of symptoms into first aid categories without network calls.
*   **Twi Support:** Fine-tune a multilingual model (like `mBERT` or `XLM-RoBERTa`) on a bilingual dataset to support Twi-to-English semantic classification locally.

### B. TensorFlow Lite (Recommended for Image/Injury Severity Detection)
TensorFlow Lite is the industry standard for on-device computer vision and simple sequence predictions.

*   **Model Type:** MobileNetV3 or EfficientNet-Lite (for injury classification from photos).
*   **Size:** **2MB - 5MB** (very small footprint).
*   **Why it works:** If a user is offline and takes a photo of a burn or cut, MobileNet can localy classify the injury severity (e.g., "Third-Degree Burn" vs. "Minor Burn") and recommend immediate local steps.

### C. Whisper.tflite (Recommended for Offline Voice Transcription)
Whisper is OpenAI's state-of-the-art automatic speech recognition (ASR) model.

*   **Model Type:** Whisper Tiny / Base quantized.
*   **Size:** **35MB - 75MB**.
*   **Why it works:** Permitting users to dictate their emergency completely offline. The model processes the audio locally and outputs text, which is then fed into our local rule engine or local ONNX model.

---

## 3. Implementation Roadmap & Steps

To incorporate these models successfully without degrading user experience (e.g., bloating app download size to 150MB+), we recommend a **"Lazy Loading / On-Demand Download"** approach.

```
                  ┌──────────────────────────────────────────────┐
                  │          App Store Download (40MB)           │
                  │   Includes default offline rule engine (2KB) │
                  └──────────────────────┬───────────────────────┘
                                         │
                         [User open app & goes online]
                                         │
                  ┌──────────────────────▼──────────────────────┐
                  │      Background Model Sync & Download        │
                  │   - ONNX Model (20MB) & Whisper (35MB)      │
                  └──────────────────────┬───────────────────────┘
                                         │
                            [User goes fully offline]
                                         │
                  ┌──────────────────────▼──────────────────────┐
                  │       On-Device ML Offline Diagnostics       │
                  │   - Fast local inferences with zero delay   │
                  └─────────────────────────────────────────────┘
```

### Step 1: Model Optimization & Quantization
1.  **Train/Fine-tune:** Train a small classification head on top of `MobileBERT` or `DistilBERT` using first-aid datasets (e.g., PubMed, Red Cross manuals).
2.  **Quantize:** Use INT8 quantization to shrink the model weight size by 4x and accelerate execution speed on CPUs.
3.  **Export:** Export the model to `.onnx` or `.tflite` formats.

### Step 2: Implement On-Demand Asset Delivery
Do **not** package the weights in the main app store build.
1.  Build an asset downloader service in the app using Expo FileSystem.
2.  When the app is opened on a Wi-Fi connection (or fast network), silently download the model weights file (`.onnx` or `.tflite`) in the background and cache it in the device's persistent memory.

### Step 3: Integrate Runtime in React Native
1.  Use `react-native-quick-tflite` or ONNX Runtime native wrappers.
2.  Create a service layer in JavaScript to load the model into memory upon startup if the user is offline.
3.  Execute inference on the user's description.

---

## 4. Architectural Comparison (How to Brief the Supervisor)

Use this table to show the supervisor how our current rule engine compares to on-device ML, and why a **hybrid system** is the safest and most robust solution.

| Metric | Current Rule Engine (Deployed) | ONNX Quantized Text Model | TensorFlow Lite Image Model |
| :--- | :--- | :--- | :--- |
| **Download Size** | **2 KB** | **18 MB** | **4 MB** |
| **RAM Usage** | **Negligible (<1MB)** | **40MB - 60MB** | **15MB - 25MB** |
| **Inference Time** | **< 2ms** | **50ms - 200ms** | **80ms - 300ms** |
| **Bilingual Support** | Fully supported (English & Twi) | High (requires multilingual training) | Language independent (vision-based) |
| **Handling Typos** | Moderate (with keyword fuzzy matches) | **Excellent** (handles semantics) | N/A |
| **Battery Impact** | **0%** | **Low (CPU Optimized)** | **Moderate (GPU/NPU Accelerated)** |
| **Device Reach** | **100% of devices** (even 2015 Androids) | ~85% of modern devices | ~90% of modern devices |

---

## 5. Conclusion & Recommendation

We recommend adopting a **Hybrid Tiered System**:
1.  **Tier 1 (Fallback / Instantly Deployed):** Our lightweight rule-based engine. It runs on 100% of devices, is ultra-fast, and guarantees immediate triage guidance.
2.  **Tier 2 (Smarter Text & Vision - Q3 2026):** Background-loaded Quantized ONNX for text semantic understanding and TensorFlow Lite for burn/cut image classification.

This ensures that the app remains incredibly accessible to anyone in Ghana regardless of device power, while gradually upgrading to local, state-of-the-art ML when resources permit.
