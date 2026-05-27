// services/audio.js
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export const speak = (text) => {
  // Always stop current speech before starting new speech to prevent overlaps
  Speech.stop(); 
  
  Speech.speak(text, {
    // Android often performs better with a slightly slower rate for clarity
    rate: Platform.OS === 'android' ? 0.8 : 0.9,
    pitch: 1.0,
    // Note: 'en-US' is the safest cross-platform default
    language: 'en-US',
    onStart: () => console.log('Speech started'),
    onDone: () => console.log('Speech finished'),
    onError: (err) => console.error('Speech error:', err),
  });
};

export const stopSpeaking = () => {
  Speech.stop();
};