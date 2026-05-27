// components/MediaInput.jsx
// Handles image (camera/gallery) and voice recording input

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { transcribeAudio } from '../services/api';

export default function MediaInput({
  language,       // 'en' | 'twi'
  image,          // { uri, base64, mediaType } | null
  onImageChange,  // (image | null) => void
  onVoiceText,    // (transcribedText) => void
  onVoiceTranscribed, // (transcribedText) => void
  disabled,       // bool
}) {
  const [isRecording,  setIsRecording]  = useState(false);
  const [recording,    setRecording]    = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState(language === 'twi' ? 'twi' : 'en');

  useEffect(() => {
    setVoiceLanguage(language === 'twi' ? 'twi' : 'en');
  }, [language]);

  // ── Image ────────────────────────────────────────────────────────────────
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        language === 'twi' ? 'Ahoban Hia' : 'Permission Needed',
        language === 'twi'
          ? 'Yehia kamera ahoban sɛ yɛtwe foto.'
          : 'Camera permission is required to take photos.'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true, quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      onImageChange({ uri: a.uri, base64: a.base64, mediaType: 'image/jpeg' });
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        language === 'twi' ? 'Ahoban Hia' : 'Permission Needed',
        language === 'twi'
          ? 'Yehia foto ahoban sɛ yɛpaw foto.'
          : 'Photo library permission is required.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true, quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      onImageChange({ uri: a.uri, base64: a.base64, mediaType: 'image/jpeg' });
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      language === 'twi' ? 'Fa Foto' : 'Add Photo',
      language === 'twi' ? 'Paw nhyehyɛe bi' : 'Choose an option',
      [
        { text: language === 'twi' ? 'Twe Foto' : 'Take Photo',          onPress: takePhoto },
        { text: language === 'twi' ? 'Paw firi Galerie' : 'From Gallery', onPress: pickImage },
        { text: language === 'twi' ? 'Gyae' : 'Cancel', style: 'cancel' },
      ]
    );
  };

  // ── Voice ────────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          language === 'twi' ? 'Ahoban Hia' : 'Permission Needed',
          language === 'twi'
            ? 'Yehia maikrofon ahoban sɛ wukasa.'
            : 'Microphone permission is required for voice input.'
        );
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
    } catch {
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    setTranscribing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      const transcript = await transcribeAudio(uri, voiceLanguage);
      const cleanedTranscript = transcript?.trim();

      if (!cleanedTranscript) {
        setTranscribing(false);
        Alert.alert(
          language === 'twi' ? 'Mfomso' : 'Error',
          language === 'twi'
            ? 'Ennteɛ kyerɛwee biara afi wo kasa mu. Mesrɛ kɔ so na kyerɛw mu.'
            : 'Could not understand your speech clearly. Please try again or type the description.'
        );
        return;
      }

      onVoiceText?.(cleanedTranscript);
      onVoiceTranscribed?.(cleanedTranscript);

      setTranscribing(false);
      Alert.alert(
        language === 'twi' ? 'Twi ASR' : 'Voice Recorded',
        language === 'twi'
          ? 'Wɔakora wo kasa. Transcription no aba.'
          : 'Voice recorded and transcribed successfully.'
      );
    } catch (error) {
      setTranscribing(false);
      console.error('Voice transcription error:', error);
      Alert.alert(
        language === 'twi' ? 'Mfomso' : 'Error',
        language === 'twi'
          ? 'Enntumi mfa wo kasa nhyɛ mu. Kyerɛw wo ho asɛm bio.'
          : 'Could not transcribe your voice. Please type your description instead.'
      );
    }
  };

  return (
    <View style={s.container}>

      {/* Label */}
      <Text style={s.label}>
        {language === 'twi' ? 'Fa media ka ho (optional):' : 'Add media (optional):'}
      </Text>

      {/* Voice language toggle */}
      <View style={s.languageRow}>
        <Text style={s.languageLabel}>
          {language === 'twi' ? 'Kasamu:' : 'Voice language:'}
        </Text>
        <View style={s.langButtons}>
          <TouchableOpacity
            style={[s.langBtn, voiceLanguage === 'en' && s.langBtnSelected]}
            onPress={() => setVoiceLanguage('en')}
          >
            <Text style={[s.langBtnText, voiceLanguage === 'en' && s.langBtnTextSelected]}>
              EN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.langBtn, voiceLanguage === 'twi' && s.langBtnSelected]}
            onPress={() => setVoiceLanguage('twi')}
          >
            <Text style={[s.langBtnText, voiceLanguage === 'twi' && s.langBtnTextSelected]}>
              TW
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Buttons row */}
      <View style={s.btnRow}>

        {/* Photo button */}
        <TouchableOpacity
          style={[s.mediaBtn, image && s.mediaBtnActive]}
          onPress={showImageOptions}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <Text style={s.mediaBtnIcon}>📷</Text>
          <Text style={[s.mediaBtnText, image && s.mediaBtnTextActive]}>
            {image
              ? (language === 'twi' ? 'Foto wɔ hɔ' : 'Photo added')
              : (language === 'twi' ? 'Fa Foto' : 'Add Photo')}
          </Text>
        </TouchableOpacity>

        {/* Voice button */}
        <TouchableOpacity
          style={[s.mediaBtn, isRecording && s.mediaBtnRecording]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={disabled || transcribing}
          activeOpacity={0.8}
        >
          {transcribing ? (
            <ActivityIndicator size="small" color="#D32F2F" />
          ) : (
            <Text style={s.mediaBtnIcon}>{isRecording ? '⏹' : '🎙'}</Text>
          )}
          <Text style={[s.mediaBtnText, isRecording && s.mediaBtnTextRecording]}>
            {transcribing
              ? (language === 'twi' ? 'Tietie...' : 'Processing...')
              : isRecording
              ? (language === 'twi' ? 'Gyae' : 'Stop')
              : (language === 'twi' ? 'Kasa (Twi)' : 'Speak')
            }
          </Text>
        </TouchableOpacity>

      </View>

      {/* Recording indicator */}
      {isRecording && (
        <View style={s.recordingBar}>
          <View style={s.recordingDot} />
          <Text style={s.recordingText}>
            {language === 'twi'
              ? 'Wɔrekɔrd — pɛ "Gyae" wɔ awieeɛ'
              : 'Recording — tap Stop when finished'}
          </Text>
        </View>
      )}

      {/* Image preview */}
      {image && (
        <View style={s.preview}>
          <Image source={{ uri: image.uri }} style={s.previewImg} />
          <View style={s.previewInfo}>
            <Text style={s.previewOk}>
              ✅ {language === 'twi' ? 'AI bɛhwɛ foto no' : 'AI will analyse this image'}
            </Text>
            <TouchableOpacity onPress={() => onImageChange(null)}>
              <Text style={s.previewRemove}>
                ✕ {language === 'twi' ? 'Yi foto' : 'Remove'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 8 },

  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  btnRow: { flexDirection: 'row', gap: 10 },

  mediaBtn: {
    flex: 1,
    minHeight: 52,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mediaBtnActive:    { borderColor: '#2E7D32', backgroundColor: '#E8F5E9' },
  mediaBtnRecording: { borderColor: '#D32F2F', backgroundColor: '#FFEBEE' },
  mediaBtnIcon: { fontSize: 18 },
  mediaBtnText: { fontSize: 13, fontWeight: '600', color: '#555' },
  mediaBtnTextActive:    { color: '#2E7D32' },
  mediaBtnTextRecording: { color: '#D32F2F' },

  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  languageLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  langButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  langBtn: {
    minWidth: 56,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtnSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#424242',
  },
  langBtnTextSelected: {
    color: '#FFF',
  },

  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 10,
  },
  recordingDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#D32F2F',
  },
  recordingText: { fontSize: 12, color: '#C62828', fontWeight: '500' },

  preview: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  previewImg:    { width: '100%', height: 150, resizeMode: 'cover' },
  previewInfo:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 },
  previewOk:     { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  previewRemove: { fontSize: 12, color: '#D32F2F', fontWeight: '600' },
});
