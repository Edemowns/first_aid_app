import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getHistorySessionById, saveOrUpdateHistorySession } from '../../services/history';
import FollowUpScreen from '../../components/FollowUpScreen';
import { BASE_URL } from '../../services/api';

export default function HistoryDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const record = await getHistorySessionById(params.id);
      setSession(record);
      setLoading(false);
    };
    load();
  }, [params.id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color="#1A73E8" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>Session not found</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/history')}>
            <Text style={styles.primaryButtonText}>Back to History</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to History</Text>
        </TouchableOpacity>
      </View>
      <FollowUpScreen
        diagnosis={session}
        originalText={session.original_text}
        probingAnswers={[]}
        language={session.language || 'en'}
        sessionId={session.id}
        onFollowUpSubmit={async (message) => {
          try {
            const payload = {
              description: session.original_text || '',
              answers: [],
              previous_diagnosis: session,
              follow_up_message: message,
              language: session.language || 'en',
              image_base64: null,
              media_type: 'image/jpeg',
            };

            const resp = await fetch(`${BASE_URL}/follow-up`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            if (!resp.ok) {
              const text = await resp.text();
              throw new Error(`Server ${resp.status}: ${text}`);
            }

            return await resp.json();
          } catch (err) {
            console.error('history follow-up error:', err);
            throw err;
          }
        }}
        onSessionUpdate={async (update) => {
          try {
            await saveOrUpdateHistorySession({
              id: session.id,
              condition: session.condition,
              severity: session.severity,
              language: session.language,
              original_text: session.original_text,
              source: session.source,
              steps: update.steps || session.steps,
              warnings: update.warnings || session.warnings,
              call_immediately: update.call_immediately !== undefined ? update.call_immediate : session.call_immediately,
              chat_feed: update.chat_feed || session.chat_feed || [],
            });
          } catch (err) {
            console.error('save history update failed:', err);
          }
        }}
        onResetEmergency={() => router.replace('/history')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  backText: {
    color: '#1A73E8',
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  listItem: {
    marginBottom: 10,
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  warningTitle: {
    color: '#B71C1C',
  },
  warningText: {
    color: '#B71C1C',
  },
  chatBubbleUser: {
    backgroundColor: '#E0F2F1',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    alignSelf: 'flex-end',
  },
  chatBubbleAI: {
    backgroundColor: '#ECEFF1',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  chatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 4,
  },
  chatText: {
    fontSize: 14,
    color: '#263238',
    lineHeight: 20,
  },
});