// components/VoiceInput.jsx
// Professional voice recording and transcription input for emergency descriptions

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function VoiceInput({
  language,     // 'en' | 'twi'
  onTranscription, // (text: string) => void
  disabled,     // bool
}) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
        language === 'twi' ? 'Ahoban Hia' : 'Permission Required',
        language === 'twi' 
          ? 'Yɛhia maikrofon ahoban kwan kyerɛ anim.'
          : 'Microphone permission is required for voice input.'
      );
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
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
        language === 'twi' ? 'Enntumi nnyɛ recording' : 'Could not start recording.'
      );
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      setRecording(null);

      // Placeholder transcription for demo/fallback
      setTimeout(() => {
        setIsProcessing(false);
        Alert.alert(
          language === 'twi' ? 'Wɔakora Kasa' : 'Voice Recorded',
          language === 'twi' 
            ? 'Wɔde kasa no asoma — yɛrekyerɛ aseɛ ntɛm ara'
            : 'Voice recorded — transcription is ready.'
        );

        const placeholderText = language === 'twi' 
          ? 'Merebɔ wo yiye — me hu amaneɛ'
          : 'I need help — someone is injured';

        onTranscription?.(placeholderText);
      }, 1000);

    } catch (error) {
      setIsProcessing(false);
      console.error('Recording stop error:', error);
      Alert.alert(
        language === 'twi' ? 'Mfomso' : 'Error',
        language === 'twi' ? 'Recording no ennwie yiye' : 'Recording finalization failed.'
      );
    }
  };

  if (!permissionGranted) {
    return (
      <TouchableOpacity 
        style={[s.voiceBtn, s.voiceBtnDisabled]}
        disabled={true}
      >
        <MaterialCommunityIcons name="microphone-off" size={20} color="#FFF" />
        <Text style={s.voiceText}>
          {language === 'twi' ? 'Maikrofon kwan nni hɔ' : 'No Microphone Access'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        s.voiceBtn, 
        disabled && s.voiceBtnDisabled, 
        isRecording && s.voiceBtnRecording,
        isProcessing && s.voiceBtnProcessing
      ]}
      onPress={isRecording ? stopRecording : startRecording}
      disabled={disabled || isProcessing}
      activeOpacity={0.8}
    >
      {isProcessing ? (
        <ActivityIndicator size="small" color="#FFF" />
      ) : (
        <MaterialCommunityIcons 
          name={isRecording ? "stop-circle" : "microphone"} 
          size={20} 
          color="#FFF" 
        />
      )}
      <Text style={[s.voiceText, isRecording && s.voiceTextRecording]}>
        {isProcessing
          ? (language === 'twi' ? 'Yɛreyɛ...' : 'Processing...')
          : isRecording 
          ? (language === 'twi' ? 'Gyae Kasa...' : 'Stop Recording...')
          : (language === 'twi' ? 'Kasa Kyerɛ (Voice)' : 'Speak Description')
        }
      </Text>
      {isRecording && (
        <View style={s.indicatorContainer}>
          <View style={s.indicatorDot} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  voiceBtn: {
    backgroundColor: '#00796B',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  voiceBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  voiceBtnRecording: {
    backgroundColor: '#D32F2F',
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  voiceBtnProcessing: {
    backgroundColor: '#004D40',
  },
  voiceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  voiceTextRecording: {
    color: '#FFF',
  },
  indicatorContainer: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D32F2F',
  },
});
