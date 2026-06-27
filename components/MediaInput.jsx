// components/MediaInput.jsx
// Handles image (camera/gallery) and voice recording input with a professional, cohesive UI

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { transcribeAudio } from '../services/api';
import { useConnectivity } from '../services/connectivity';

export default function MediaInput({
  language,       // 'en' | 'twi'
  image,          // { uri, base64, mediaType } | null
  onImageChange,  // (image | null) => void
  onVoiceText,    // (transcribedText) => void
  onVoiceTranscribed, // (transcribedText) => void
  disabled,       // bool
}) {
  const { isOnline } = useConnectivity();
  const [isRecording,  setIsRecording]  = useState(false);
  const [recording,    setRecording]    = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState(language === 'twi' ? 'twi' : 'en');

  // Web media recorder references (persists across renders)
  const webMediaRecorderRef = React.useRef(null);
  const webAudioChunksRef = React.useRef([]);

  useEffect(() => {
    setVoiceLanguage(language === 'twi' ? 'twi' : 'en');
  }, [language]);

  // ── Image ────────────────────────────────────────────────────────────────
  const takePhoto = async () => {
    if (Platform.OS !== 'web') {
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
    if (Platform.OS !== 'web') {
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
    if (isOnline === false) {
      Alert.alert(
        language === 'twi' ? 'Nni Intanɛt (Offline)' : 'Internet Required',
        language === 'twi'
          ? 'Kamera anaa foto mmoa hwehwɛ intanɛt connection. Mesrɛ sɔ wo Wi-Fi anaa mobile data na wubetumi akɔ so.'
          : 'Photo input requires an active internet connection. Please turn on your Wi-Fi or mobile data to use this feature.'
      );
      return;
    }
    if (Platform.OS === 'web') {
      pickImage();
    } else {
      Alert.alert(
        language === 'twi' ? 'Fa Foto ka ho' : 'Add Photo / Image',
        language === 'twi' ? 'Paw nhyehyɛe bi firi ha' : 'Choose a photo source',
        [
          { text: language === 'twi' ? 'Twe Foto (Kamera)' : 'Take Photo (Camera)', onPress: takePhoto },
          { text: language === 'twi' ? 'Paw firi Galerie' : 'Choose from Gallery', onPress: pickImage },
          { text: language === 'twi' ? 'Gyae' : 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  // ── Voice ────────────────────────────────────────────────────────────────
  const startRecording = async () => {
    if (isOnline === false) {
      Alert.alert(
        language === 'twi' ? 'Nni Intanɛt (Offline)' : 'Internet Required',
        language === 'twi'
          ? 'Kasa mmoa hwehwɛ intanɛt connection. Mesrɛ sɔ wo Wi-Fi anaa mobile data na wubetumi akɔ so.'
          : 'Voice input and transcription require an active internet connection. Please turn on your Wi-Fi or mobile data to use this feature.'
      );
      return;
    }
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        webAudioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            webAudioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
        webMediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      } else {
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
      }
    } catch (err) {
      console.error('Start recording error:', err);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setTranscribing(true);

    try {
      let uri = '';
      
      if (Platform.OS === 'web') {
        if (!webMediaRecorderRef.current) return;
        
        const stopPromise = new Promise((resolve) => {
          webMediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(webAudioChunksRef.current, { type: 'audio/wav' });
            const blobUrl = URL.createObjectURL(audioBlob);
            webMediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            resolve({ blobUrl });
          };
        });

        webMediaRecorderRef.current.stop();
        const { blobUrl } = await stopPromise;
        uri = blobUrl;
      } else {
        if (!recording) return;
        await recording.stopAndUnloadAsync();
        uri = recording.getURI();
        setRecording(null);
      }

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
        language === 'twi' ? 'Wɔakora wo kasa' : 'Voice Recorded',
        language === 'twi'
          ? 'Wɔakora wo kasa. Transcription no aba fɛfɛɛfɛ.'
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
      {/* Header Area with Label & Voice Language toggle */}
      <View style={s.headerRow}>
        <View style={s.labelContainer}>
          <Text style={s.label}>
            {language === 'twi' ? 'Media Mmoa' : 'Additional Media'}
          </Text>
          <Text style={s.subLabel}>
            {language === 'twi' ? 'Fa foto anaa kasa mmoa ka ho' : 'Add photo or voice for better AI context'}
          </Text>
        </View>

        {/* Voice language toggle */}
        <View style={s.langButtons}>
          <TouchableOpacity
            style={[s.langBtn, voiceLanguage === 'en' && s.langBtnSelected]}
            onPress={() => setVoiceLanguage('en')}
            accessibilityRole="button"
            accessibilityLabel="Select English voice language"
          >
            <Text style={[s.langBtnText, voiceLanguage === 'en' && s.langBtnTextSelected]}>
              EN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.langBtn, voiceLanguage === 'twi' && s.langBtnSelected]}
            onPress={() => setVoiceLanguage('twi')}
            accessibilityRole="button"
            accessibilityLabel="Select Twi voice language"
          >
            <Text style={[s.langBtnText, voiceLanguage === 'twi' && s.langBtnTextSelected]}>
              TW
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Primary Buttons Layout */}
      <View style={s.btnRow}>
        {/* Photo button */}
        <TouchableOpacity
          style={[s.mediaBtn, image && s.mediaBtnActive]}
          onPress={showImageOptions}
          disabled={disabled}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={image ? "Change selected image" : "Add photo"}
        >
          <View style={[s.iconWrapper, image && s.iconWrapperActive]}>
            <MaterialCommunityIcons
              name={image ? "camera-check" : "camera-plus"}
              size={20}
              color={image ? "#1B5E20" : "#4B5563"}
            />
          </View>
          <View style={s.btnTextContainer}>
            <Text style={[s.mediaBtnTitle, image && s.mediaBtnTitleActive]}>
              {image
                ? (language === 'twi' ? 'Foto Wɔ Ho' : 'Photo Attached')
                : (language === 'twi' ? 'Twe Foto' : 'Take/Add Photo')}
            </Text>
            <Text style={s.mediaBtnSubtitle}>
              {image
                ? (language === 'twi' ? 'Sakra mfonini yi' : 'Tap to replace image')
                : (language === 'twi' ? 'Firi kamera/galerie' : 'Camera or gallery')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Voice button */}
        <TouchableOpacity
          style={[s.mediaBtn, isRecording && s.mediaBtnRecording]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={disabled || transcribing}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? "Stop voice recording" : "Record voice description"}
        >
          <View style={[
            s.iconWrapper, 
            isRecording && s.iconWrapperRecording,
            transcribing && s.iconWrapperTranscribing
          ]}>
            {transcribing ? (
              <ActivityIndicator size="small" color="#00796B" />
            ) : (
              <MaterialCommunityIcons
                name={isRecording ? "stop-circle" : "microphone"}
                size={22}
                color={isRecording ? "#C62828" : "#4B5563"}
              />
            )}
          </View>
          <View style={s.btnTextContainer}>
            <Text style={[
              s.mediaBtnTitle, 
              isRecording && s.mediaBtnTitleRecording,
              transcribing && s.mediaBtnTitleTranscribing
            ]}>
              {transcribing
                ? (language === 'twi' ? 'Yɛrekyerɛ...' : 'Processing...')
                : isRecording
                ? (language === 'twi' ? 'Gyae Kasa' : 'Stop Recording')
                : (language === 'twi' ? 'Kasa Kyerɛ' : 'Voice Input')
              }
            </Text>
            <Text style={s.mediaBtnSubtitle}>
              {transcribing
                ? (language === 'twi' ? 'Kasa rekɔ kyerɛwee mu' : 'Transcribing voice...')
                : isRecording
                ? (language === 'twi' ? 'Hwie gu mprempren' : 'Tap to stop')
                : (language === 'twi' ? 'Kasa wɔ Twi/English' : 'Speak description')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Recording status banner */}
      {isRecording && (
        <View style={s.recordingBar}>
          <View style={s.recordingIndicatorContainer}>
            <View style={s.recordingDot} />
            <View style={[s.recordingDotPulse, { transform: [{ scale: 1.3 }] }]} />
          </View>
          <Text style={s.recordingText}>
            {language === 'twi'
              ? 'Wɔrekɔrd kasa — kɔ so kasa na sɔ "Gyae Kasa" so'
              : 'Microphone active — describe the case clearly, then tap Stop'}
          </Text>
        </View>
      )}

      {/* Image preview with elegant floating overlays */}
      {image && (
        <View style={s.preview}>
          <Image source={{ uri: image.uri }} style={s.previewImg} />
          <View style={s.previewOverlay}>
            <View style={s.previewBadge}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#FFF" />
              <Text style={s.previewBadgeText}>
                {language === 'twi' ? 'AI bɛhunu mfonini yi' : 'AI will analyze photo'}
              </Text>
            </View>
            <TouchableOpacity 
              style={s.previewRemoveBtn}
              onPress={() => onImageChange(null)}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
            >
              <MaterialCommunityIcons name="close" size={16} color="#FFF" />
              <Text style={s.previewRemoveText}>
                {language === 'twi' ? 'Yi Fi Ho' : 'Remove'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: 4,
    gap: 1,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
  },

  labelContainer: {
    flex: 1,
    paddingRight: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.1,
  },

  subLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },

  langButtons: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },

  langBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  langBtnSelected: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  langBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
  },

  langBtnTextSelected: {
    color: '#00796B',
  },

  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },

  mediaBtn: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 0,
    borderColor: '#E5E7EB',
    padding: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: -5,
  },

  mediaBtnActive: {
    borderColor: '#81C784',
    backgroundColor: '#E8F5E9',
  },

  mediaBtnRecording: {
    borderColor: '#EF5350',
    backgroundColor: '#FFEBEE',
  },

  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconWrapperActive: {
    backgroundColor: '#C8E6C9',
  },

  iconWrapperRecording: {
    backgroundColor: '#FFCDD2',
  },

  iconWrapperTranscribing: {
    backgroundColor: '#B2DFDB',
  },

  btnTextContainer: {
    alignItems: 'flex-start',
    gap: 2,
  },

  mediaBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },

  mediaBtnTitleActive: {
    color: '#2E7D32',
  },

  mediaBtnTitleRecording: {
    color: '#C62828',
  },

  mediaBtnTitleTranscribing: {
    color: '#004D40',
  },

  mediaBtnSubtitle: {
    fontSize: 10,
    color: '#6B7280',
  },

  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },

  recordingIndicatorContainer: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  recordingDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D32F2F',
    zIndex: 2,
  },

  recordingDotPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(211, 47, 47, 0.4)',
  },

  recordingText: {
    flex: 1,
    fontSize: 11,
    color: '#C62828',
    fontWeight: '600',
    lineHeight: 15,
  },

  preview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginTop: 2,
  },

  previewImg: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },

  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  previewBadgeText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
  },

  previewRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },

  previewRemoveText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '700',
  },
});
