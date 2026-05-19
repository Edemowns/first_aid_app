// components/VoiceInput.jsx
// Voice recording and transcription for emergency descriptions

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';

export default function VoiceInput({
  language,     // 'en' | 'twi'
  onTranscription, // (text: string) => void
  disabled,     // bool
}) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    // Request audio recording permissions
    const requestPermissions = async () => {
      try {
        const { granted } = await Audio.requestPermissionsAsync();
        setPermissionGranted(granted);
      } catch (error) {
        console.error('Permission error:', error);
      }
    };

    requestPermissions();
  }, []);

  const startRecording = async () => {
    if (!permissionGranted) {
      Alert.alert(
        language === 'twi' ? 'Permission' : 'Permission Required',
        language === 'twi' 
          ? 'Yɛhia permission sɛ wo bɛtumi afono'
          : 'Microphone permission is required for voice input'
      );
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Recording start error:', error);
      Alert.alert(
        language === 'twi' ? 'Mfomso' : 'Error',
        language === 'twi' ? 'Enntumi nnyɛ recording' : 'Could not start recording'
      );
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      setRecording(null);

      // TODO: Send audio file to backend for transcription
      // For now, just show a placeholder message
      Alert.alert(
        language === 'twi' ? 'Voice Recorded' : 'Voice Recorded',
        language === 'twi' 
          ? 'Wɔde voice no asoma — transcription bɛba ntɛm ara'
          : 'Voice recorded — transcription will be available soon'
      );

      // Placeholder transcription for demo
      const placeholderText = language === 'twi' 
        ? 'Merebɔ wo yiye — me hu amaneɛ'
        : 'I need help — someone is injured';

      onTranscription?.(placeholderText);

    } catch (error) {
      console.error('Recording stop error:', error);
      Alert.alert(
        language === 'twi' ? 'Mfomso' : 'Error',
        language === 'twi' ? 'Recording no ennwie' : 'Recording failed'
      );
    }
  };

  if (!permissionGranted) {
    return (
      <TouchableOpacity 
        style={[s.voiceBtn, s.voiceBtnDisabled]}
        disabled={true}
      >
        <Text style={s.voiceIcon}>🎤</Text>
        <Text style={s.voiceText}>
          {language === 'twi' ? 'Permission nni hɔ' : 'No Microphone Access'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[s.voiceBtn, disabled && s.voiceBtnDisabled, isRecording && s.voiceBtnRecording]}
      onPress={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={s.voiceIcon}>
        {isRecording ? '⏹️' : '🎤'}
      </Text>
      <Text style={[s.voiceText, isRecording && s.voiceTextRecording]}>
        {isRecording 
          ? (language === 'twi' ? 'Gyae...' : 'Stop Recording...')
          : (language === 'twi' ? 'Fono kyerɛ' : 'Voice Input')
        }
      </Text>
      {isRecording && <Text style={s.recordingDot}>●</Text>}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  voiceBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  voiceBtnDisabled: {
    backgroundColor: '#BDBDBD',
  },
  voiceBtnRecording: {
    backgroundColor: '#D32F2F',
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  voiceIcon: { fontSize: 18 },
  voiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
  },
  voiceTextRecording: {
    color: '#FFF',
  },
  recordingDot: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
});