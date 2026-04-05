// components/EmergencyInput.jsx
// Text + Voice input component with Twi ASR support

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { colors, spacing, radius, shadow, typography } from '../constants/theme';
import { transcribeTwi, analyze } from '../services/api';

export default function EmergencyInput({ value, onChangeText, language, onSubmit, loading }) {
  const [recording, setRecording] = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation while recording
  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Microphone Permission',
          'Please allow microphone access in your device settings to use voice input.'
        );
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      startPulse();
    } catch (err) {
      Alert.alert('Recording Error', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    stopPulse();
    setTranscribing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // Send to Twi ASR endpoint
      const transcript = await transcribeTwi(uri);
      onChangeText(transcript);
    } catch (err) {
      Alert.alert(
        'Transcription Failed',
        'Could not transcribe audio. Please type your description instead.'
      );
    } finally {
      setTranscribing(false);
    }
  };

  const isRecording = !!recording;

  return (
    <View style={styles.container}>
      {/* Text input */}
      <TextInput
        style={styles.input}
        placeholder={
          language === 'twi'
            ? 'Kyerɛ deɛ asi ho...\ne.g. "Ɔbarima no wɔ mogya pii n\'afono mu"'
            : 'Describe the emergency...\ne.g. "Person is bleeding heavily from the arm"'
        }
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={4}
        value={value}
        onChangeText={onChangeText}
        textAlignVertical="top"
        editable={!loading}
      />

      {/* Action row */}
      <View style={styles.actionRow}>

        {/* Voice button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.voiceBtn, isRecording && styles.voiceBtnActive]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={loading || transcribing}
          >
            {transcribing ? (
              <ActivityIndicator color={colors.textOnPrimary} size="small" />
            ) : (
              <Text style={styles.voiceIcon}>{isRecording ? '⏹' : '🎙'}</Text>
            )}
            <Text style={styles.voiceBtnText}>
              {transcribing
                ? (language === 'twi' ? 'Tietie...' : 'Transcribing...')
                : isRecording
                ? (language === 'twi' ? 'Gyae' : 'Stop')
                : (language === 'twi' ? 'Kasa' : 'Speak')}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitBtn, (!value?.trim() || loading) && styles.submitBtnDisabled]}
          onPress={onSubmit}
          disabled={!value?.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} size="small" />
          ) : (
            <Text style={styles.submitBtnText}>
              {language === 'twi' ? '🔍  Hwɛ & Boa' : '🔍  Analyze'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Recording hint */}
      {isRecording && (
        <Text style={styles.recordingHint}>
          🔴 {language === 'twi' ? 'Wɔrекɔrdɩng... pɛ "Gyae" wɔ awieeɛ' : 'Recording... tap Stop when done'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.body,
    color: colors.textPrimary,
    minHeight: 110,
    marginBottom: spacing.sm,
    ...shadow.card,
  },

  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },

  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  voiceBtnActive: {
    backgroundColor: colors.severityCritical,
  },
  voiceIcon: { fontSize: 16 },
  voiceBtnText: {
    color: colors.textOnPrimary,
    fontWeight: '600',
    fontSize: typography.small,
  },

  submitBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.strong,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: {
    fontSize: typography.body,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },

  recordingHint: {
    fontSize: typography.tiny,
    color: colors.severityCritical,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
