// app/results.jsx
// Results Screen — AI Diagnosis + First Aid Steps

// Results Screen — Orchestrates initial diagnosis and coordinates dynamic follow-ups

import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import FollowUpScreen from '../components/FollowUpScreen';
import { BASE_URL } from '../services/api';
import { saveOrUpdateHistorySession } from '../services/history';

// Use BASE_URL from services/api to keep backend host IP in sync
const API_BASE_URL = BASE_URL; 

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Safely parse initial data from Expo navigation params
  let initialDiagnosis = null;
  try {
    initialDiagnosis = params.data ? JSON.parse(params.data) : null;
  } catch (error) {
    console.error("Error parsing diagnosis data:", error);
  }

  // Safely parse probing answers array
  let initialAnswers = [];
  try {
    initialAnswers = params.probingAnswers ? JSON.parse(params.probingAnswers) : [];
  } catch (error) {
    // If empty or missing, keep as an empty list
    initialAnswers = [];
  }

  const originalText = params.originalText || '';
  const language = params.language || 'en';
  const [sessionId] = useState(params.sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);

  // Fallback structural schema if navigation data is corrupted
  if (!initialDiagnosis) {
    initialDiagnosis = {
      condition: 'Medical Emergency',
      severity: 'critical',
      steps: [
        'Call emergency services immediately.',
        'Keep the person calm, still, and reassured.',
        'Monitor vital signs (breathing and consciousness).'
      ],
      warnings: ['Do not move the person unless in immediate danger.'],
      call_immediately: true,
    };
  }

  // Manage current state of diagnosis internally, letting follow-ups update steps/warnings
  const [currentDiagnosis, setCurrentDiagnosis] = useState(initialDiagnosis);

  const saveSession = async (updates = {}) => {
    try {
      await saveOrUpdateHistorySession({
        id: sessionId,
        condition: currentDiagnosis.condition,
        severity: currentDiagnosis.severity,
        language,
        original_text: originalText,
        source: currentDiagnosis.source || 'online',
        steps: currentDiagnosis.steps,
        warnings: currentDiagnosis.warnings,
        call_immediately: currentDiagnosis.call_immediately,
        chat_feed: updates.chat_feed || [],
        ...updates,
      });
    } catch (error) {
      console.error('saveSession error:', error);
    }
  };

  React.useEffect(() => {
    saveSession();
  }, []);

  const handleFollowUpSubmit = async (message) => {
    try {
      const payload = {
        description: originalText,
        answers: initialAnswers,
        previous_diagnosis: currentDiagnosis,
        follow_up_message: message,
        language: language,
        image_base64: null,
        media_type: "image/jpeg"
      };

      console.log("Sending payload:", JSON.stringify(payload)); // Check this in Metro console

      const response = await fetch(`${API_BASE_URL}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // This will print the actual reason (e.g., 422 Unprocessable Entity)
        const errorText = await response.text();
        console.error("SERVER REJECTED REQUEST:", response.status, errorText);
        throw new Error(`Server Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("DEBUG FETCH ERROR:", error);
      throw error;
    }
  };

  const handleSessionUpdate = async (update) => {
    const updatedDiagnosis = {
      ...currentDiagnosis,
      steps: update.steps || currentDiagnosis.steps,
      warnings: update.warnings || currentDiagnosis.warnings,
      call_immediately: update.call_immediately !== undefined ? update.call_immediately : currentDiagnosis.call_immediately,
    };
    setCurrentDiagnosis(updatedDiagnosis);
    await saveOrUpdateHistorySession({
      id: sessionId,
      condition: updatedDiagnosis.condition,
      severity: updatedDiagnosis.severity,
      language,
      original_text: originalText,
      source: updatedDiagnosis.source || 'online',
      steps: updatedDiagnosis.steps,
      warnings: updatedDiagnosis.warnings,
      call_immediately: updatedDiagnosis.call_immediately,
      chat_feed: update.chat_feed || [],
    });
  };

  const handleResetEmergency = () => {
    // Reset back to Home screen to start a new assessment
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'top']}>
      <FollowUpScreen
        diagnosis={currentDiagnosis}
        originalText={originalText}
        probingAnswers={initialAnswers}
        language={language}
        sessionId={sessionId}
        onFollowUpSubmit={handleFollowUpSubmit}
        onSessionUpdate={handleSessionUpdate}
        onResetEmergency={handleResetEmergency}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background || '#F5F5F5',
  },
});

