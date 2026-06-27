// Displays diagnostic results, allows real-time follow-ups, and handles emergency state resets.

import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router'; // or 'expo-router/build/useFocusEffect'
import { speak, stopSpeaking } from '../services/audio';


export default function DiagnosisScreen({
  diagnosis,      // { condition, severity, steps, warnings, call_immediately }
  originalText,   // string - original emergency description
  probingAnswers, // [{ question, answer }]
  language,       // 'en' | 'twi'
  sessionId,
  onFollowUpSubmit, // async (message) => returns { message, updated_steps, updated_warnings, call_immediately }
  onSessionUpdate, // async ({ sessionId, steps, warnings, call_immediately, chat_feed })
  onResetEmergency, // () => void - Resets the app state for a new emergency
}) {
  const router = useRouter();
  const [followUpText, setFollowUpText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Dynamic states updated by follow-ups
  const [steps, setSteps] = useState(diagnosis.steps || []);
  const [warnings, setWarnings] = useState(diagnosis.warnings || []);
  const [callImmediately, setCallImmediately] = useState(diagnosis.call_immediately);

  const toggleAudio = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const textToRead = [
        `Emergency condition: ${diagnosis.condition}.`,
        `Steps: ${steps.join('. ')}`,
        `Warnings: ${warnings.join('. ')}`
      ].join(' ');
      
      speak(textToRead);
      setIsSpeaking(true);
    }
  };
  
  // Conversation feed to show historical follow-ups
  const [chatFeed, setChatFeed] = useState(diagnosis.chat_feed || []);
  const scrollViewRef = useRef();

  // If a saved session provides a chat_feed, populate it on first render only
  React.useEffect(() => {
    try {
      if ((diagnosis.chat_feed || []).length > 0 && chatFeed.length === 0) {
        setChatFeed(diagnosis.chat_feed);
      }
    } catch (err) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendFollowUp = async () => {
    if (!followUpText.trim() || loading) return;

    const userMsg = followUpText.trim();
    setFollowUpText('');
    setLoading(true);

    const initialFeed = [...chatFeed, { sender: 'user', text: userMsg }];
    setChatFeed(initialFeed);

    let newSteps = steps;
    let newWarnings = warnings;
    let newCallImmediately = callImmediately;
    let updatedFeed = initialFeed;

    try {
      // Call the API service
      const response = await onFollowUpSubmit(userMsg);
      
      if (response) {
        if (response.message) {
          updatedFeed = [...initialFeed, { sender: 'ai', text: response.message }];
          setChatFeed(updatedFeed);
        }
        
        if (response.updated_steps) {
          newSteps = response.updated_steps;
          setSteps(newSteps);
        }
        if (response.updated_warnings) {
          newWarnings = response.updated_warnings;
          setWarnings(newWarnings);
        }
        if (response.call_immediately !== undefined) {
          newCallImmediately = response.call_immediately;
          setCallImmediately(newCallImmediately);
        }
      }
    } catch (error) {
      updatedFeed = [
        ...initialFeed,
        {
          sender: 'ai',
          text: language === 'twi'
            ? 'Mmoa mfiri hɔ, yɛpɛ kwan bɔne bi mu. Sɔ hwɛ bio.'
            : 'Sorry, I ran into an issue. Please try asking again.',
        },
      ];
      setChatFeed(updatedFeed);
    } finally {
      if (typeof onSessionUpdate === 'function') {
        onSessionUpdate({
          sessionId,
          steps: newSteps,
          warnings: newWarnings,
          call_immediately: newCallImmediately,
          chat_feed: updatedFeed,
        });
      }
      setLoading(false);
      // Auto-scroll to the bottom of the feed
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // Stop audio automatically when user navigates away
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        stopSpeaking();
        setIsSpeaking(false);
      };
    }, [])
  );

  const playInstructions = () => {
    // Construct the guidance text
    const textToRead = [
      `Emergency condition: ${diagnosis.condition}.`,
      `Steps: ${steps.join('. ')}`,
      `Warnings: ${warnings.join('. ')}`
    ].join(' ');

    speak(textToRead);
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#D32F2F';
      case 'moderate': return '#ecc931';
      case 'mild': return '#388E3C';
      default: return '#757575';
    }
  };

  const normalizeWarning = (warning) => {
    const trimmed = warning.trim();
    // In Twi, do not apply English prefixes
    if (language === 'twi') {
      return trimmed;
    }
    // If it already starts with a warning/conditional prefix, keep it as is
    if (/^(If|When|Avoid|Do not|Don't|Never)\b/i.test(trimmed)) {
      return trimmed;
    }
    // Since the section is "What Not To Do", we should keep negative guidelines clean and as is
    return trimmed;
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={s.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Reset / New Emergency Top Button */}
        <TouchableOpacity style={s.resetButton} onPress={onResetEmergency}>
          <Ionicons name="add-circle-outline" size={18} color="#00796B" />
          <Text style={s.resetButtonText}>
            {language === 'twi' ? 'Kyerɛ asiane foforo' : 'Report New Emergency'}
          </Text>
        </TouchableOpacity>

        {/* Offline Banner */}
        {diagnosis.is_offline && (
          <View style={s.offlineBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="cloud-offline" size={20} color="#E65100" />
              <Text style={[s.offlineBannerText, { fontWeight: '700', color: '#E65100' }]}>
                {language === 'twi' ? 'Offline Mode (Local ML Model)' : 'Offline Mode (Local ML Model)'}
              </Text>
            </View>
            <Text style={s.offlineBannerText}>
              {diagnosis.source ? `Classifier: ${diagnosis.source}` : (language === 'twi' ? 'Mmoa nhyehyɛeɛ a yɛakora' : 'Using preloaded guidelines.')}
            </Text>
            {diagnosis.confidence !== undefined && (
              <Text style={[s.offlineBannerText, { fontStyle: 'italic', marginTop: 2, color: '#D84315' }]}>
                {language === 'twi' ? `Ahoɔden: ${Math.round(diagnosis.confidence * 100)}% koraa` : `On-Device Confidence: ${Math.round(diagnosis.confidence * 100)}%`}
              </Text>
            )}
          </View>
        )}

        {/* Condition Card */}
        <View style={s.card}>
          <Text style={s.label}>
            {language === 'twi' ? 'Sɛnea Ɛte Biara:' : 'Assessed Condition:'}
          </Text>
          <Text style={s.conditionText}>{diagnosis.condition}</Text>
          
          <View style={[s.badge, { backgroundColor: getSeverityColor(diagnosis.severity) + '15' }]}>
            <View style={[s.badgeDot, { backgroundColor: getSeverityColor(diagnosis.severity) }]} />
            <Text style={[s.badgeText, { color: getSeverityColor(diagnosis.severity) }]}>
              {diagnosis.severity?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Immediate Call Alert */}
        {callImmediately && (
          <View style={s.callAlert}>
            <Ionicons name="alert-circle" size={24} color="#FFF" />
            <View style={{ flex: 1 }}>
              <Text style={s.callAlertTitle}>
                {language === 'twi' ? 'Frɛ Ambulance Ntɛm!' : 'CALL EMERGENCY SERVICES NOW'}
              </Text>
              <Text style={s.callAlertSub}>
                {language === 'twi' 
                  ? 'Asiane yi hia ntɛm mmoa dodo.' 
                  : 'This is a critical emergency. Please secure professional help immediately.'}
              </Text>
            </View>
          </View>
        )}

        {/* Guidelines Steps */}
        <View style={s.section}>
          <View style={s.headerRow}>
            <Text style={s.sectionHeader}>
              {language === 'twi' ? 'Mmoa a wobɛyɛ ntɛm:' : 'What You Should Do:'}
            </Text>
            
            <TouchableOpacity style={s.audioBtn} onPress={toggleAudio}>
              <Ionicons 
                name={isSpeaking ? "stop-circle" : "volume-high"} 
                size={24} 
                color="#00796B" 
              />
            </TouchableOpacity>
          </View>
          
          {steps.map((step, idx) => (
            <View key={idx} style={s.stepRow}>
              <View style={s.stepNum}>
                <Text style={s.stepNumText}>{idx + 1}</Text>
              </View>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Warnings Section */}
        {warnings.length > 0 && (
          <View style={[s.section, s.warningSection]}>
            <Text style={[s.sectionHeader, s.warningHeader]}>
              {language === 'twi' ? 'Nsɛm a ɛho hia:' : 'What  Not To Do:'}
            </Text>
            
            {warnings.map((warning, idx) => (
              <View key={idx} style={s.warningRow}>
                <Ionicons name="alert-circle" size={18} color="#C62828" style={{ marginTop: 2 }} />
                <Text style={s.warningText}>{normalizeWarning(warning)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Emergency Call Action Buttons */}
        <View style={s.actionsContainer}>
          <TouchableOpacity
            style={s.callBtn}
            onPress={() => Linking.openURL('tel:193')}
          >
            <Ionicons name="call" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={s.callBtnText}>
              {language === 'twi' ? 'Frɛ Ambulance — 193' : 'Call Ambulance — 193'}
            </Text>
          </TouchableOpacity>

         
          <TouchableOpacity
            style={s.hotlinesBtn}
            onPress={() => router.push('/hotlines')}
          >
            <Ionicons name="list" size={18} color="#004D40" style={{ marginRight: 8 }} />
            <Text style={s.hotlinesBtnText}>
              {language === 'twi' ? 'Hwɛ Emergency Hotlines Nyinaa' : 'View All Emergency Hotlines'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conversational Follow-Up Thread */}
        {chatFeed.length > 0 && (
          <View style={s.chatContainer}>
            <Text style={s.chatTitle}>
              {language === 'twi' ? 'Nkɔmmɔfiri mu mmoa:' : 'Updates & Clarifications'}
            </Text>
            {chatFeed.map((chat, idx) => (
              <View 
                key={idx} 
                style={[
                  s.chatBubble, 
                  chat.sender === 'user' ? s.userBubble : s.aiBubble
                ]}
              >
                <Text style={chat.sender === 'user' ? s.userBubbleText : s.aiBubbleText}>
                  {chat.text}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Follow-Up Input Control Area */}
        <View style={s.inputWrapper}>
          <Text style={s.inputLabel}>
            {language === 'twi' 
              ? 'Nsɛm foforo bi asisi? Kakyerɛ me:' 
              : 'Have updates or questions? Ask below:'}
          </Text>
          {diagnosis.is_offline ? (
            <View style={s.offlineInputPlaceholder}>
              <Ionicons name="chatbox-outline" size={18} color="#E65100" style={{ marginRight: 6 }} />
              <Text style={s.offlineInputPlaceholderText}>
                {language === 'twi'
                  ? 'Nkɔmmɔfiri mu mmoa foforo hia internet nkabom.'
                  : 'Interactive conversational follow-up requires an internet connection.'}
              </Text>
            </View>
          ) : (
            <View style={s.inputRow}>
              <TextInput
                style={s.textInput}
                value={followUpText}
                onChangeText={setFollowUpText}
                placeholder={language === 'twi' ? 'Bisa asiane ho asɛm...' : 'Ask follow-up or report new symptom...'}
                placeholderTextColor="#9E9E9E"
                maxLength={150}
                returnKeyType="send"
                onSubmitEditing={handleSendFollowUp}
                disabled={loading}
              />
              <TouchableOpacity 
                style={[s.sendButton, !followUpText.trim() && s.sendButtonDisabled]} 
                onPress={handleSendFollowUp}
                disabled={!followUpText.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
    backgroundColor: '#F5F5F5',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#00796B',
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: '#E0F2F1',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
  resetButtonText: {
    color: '#00796B',
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  label: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
    marginBottom: 4,
  },
  conditionText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  callAlert: {
    backgroundColor: '#D32F2F',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  callAlertTitle: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  callAlertSub: {
    color: '#FFEBEE',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumText: {
    color: '#2E7D32',
    fontWeight: '800',
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  warningSection: {
    borderColor: '#FFCDD2',
    backgroundColor: '#FFF8F8',
  },
  warningHeader: {
    color: '#B71C1C',
  },
  warningSubText: {
    fontSize: 13,
    color: '#B71C1C',
    marginBottom: 8,
    lineHeight: 18,
  },
  warningRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#B71C1C',
    lineHeight: 20,
    fontWeight: '500',
  },
  chatContainer: {
    gap: 8,
    marginTop: 8,
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#616161',
    paddingLeft: 4,
  },
  chatBubble: {
    padding: 12,
    borderRadius: 14,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: '#E0F2F1',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  userBubbleText: {
    color: '#004D40',
    fontSize: 14,
  },
  aiBubble: {
    backgroundColor: '#ECEFF1',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
  },
  aiBubbleText: {
    color: '#263238',
    fontSize: 14,
    lineHeight: 18,
  },
  inputWrapper: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 12,
    color: '#616161',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    maxHeight: 80,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  actionsContainer: {
    gap: 10,
    marginTop: 8,
  },
  callBtn: {
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  callBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  policeBtn: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  policeBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  hotlinesBtn: {
    backgroundColor: '#E0F2F1',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00796B',
  },
  hotlinesBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00796B',
  },

  offlineBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  offlineBannerText: {
    color: '#E65100',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    lineHeight: 16,
  },
  offlineInputPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F8',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginTop: 4,
  },
  offlineInputPlaceholderText: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: '600',
    flex: 1,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  audioBtn: {
    padding: 4,
  },
});
