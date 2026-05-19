// components/ProbingScreen.jsx
// Shows follow-up questions from the AI before giving first aid guidance

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Common answer options for different question types
const ANSWER_OPTIONS = {
  yes_no: [
    { label: 'Yes', value: 'Yes', name: 'checkmark-circle' },
    { label: 'No', value: 'No', name: 'close-circle' },
  ],
  conscious: [
    { label: 'Conscious & Alert', value: 'Conscious and alert', name: 'eye' },
    { label: 'Unconscious', value: 'Unconscious', name: 'moon' },
    { label: 'Semi-conscious', value: 'Semi-conscious', name: 'help-circle' },
  ],
  breathing: [
    { label: 'Normal breathing', value: 'Normal breathing', name: 'heart' },
    { label: 'Difficulty breathing', value: 'Difficulty breathing', name: 'alert-circle' },
    { label: 'Not breathing', value: 'Not breathing', name: 'heart-dislike' },
  ],
  bleeding: [
    { label: 'No bleeding', value: 'No bleeding', name: 'checkmark-circle' },
    { label: 'Light bleeding', value: 'Light bleeding', name: 'water' },
    { label: 'Heavy bleeding', value: 'Heavy bleeding', name: 'water-outline' },
    { label: 'Arterial spurting', value: 'Arterial spurting', name: 'flash' },
  ],
  vomit_blood: [
    { label: 'No blood in vomit', value: 'No blood in vomit', name: 'checkmark-circle' },
    { label: 'Small amount of blood', value: 'Small amount of blood', name: 'water' },
    { label: 'Significant blood', value: 'Significant blood', name: 'water-outline' },
    { label: 'Mostly blood', value: 'Mostly blood', name: 'alert-circle' },
  ],
  trigger_vs_constant: [
    { label: 'Only during a specific action', value: 'Only during a specific action', name: 'pulse' },
    { label: 'Constant regardless of activity', value: 'Constant regardless of activity', name: 'pulse' },
    { label: 'Sometimes or not sure', value: 'Sometimes or not sure', name: 'help-circle' },
  ],
  pain_type: [
    { label: 'Sharp or stabbing', value: 'Sharp or stabbing', name: 'flash' },
    { label: 'Aching or dull', value: 'Aching or dull', name: 'ellipse' },
    { label: 'Burning', value: 'Burning', name: 'flame' },
    { label: 'Throbbing', value: 'Throbbing', name: 'pulse' },
  ],
  location: [
    { label: 'Upper body', value: 'Upper body', name: 'arrow-up' },
    { label: 'Lower body', value: 'Lower body', name: 'arrow-down' },
    { label: 'Left side', value: 'Left side', name: 'arrow-back' },
    { label: 'Right side', value: 'Right side', name: 'arrow-forward' },
  ],
  frequency: [
    { label: 'Once or twice', value: 'Once or twice', name: 'checkmark-circle' },
    { label: 'Several times', value: 'Several times', name: 'alert-circle' },
    { label: 'Continuous', value: 'Continuous', name: 'flash' },
  ],
  time: [
    { label: 'Just now', value: 'Just now', name: 'flash' },
    { label: '< 5 minutes', value: 'Less than 5 minutes', name: 'time' },
    { label: '5-15 minutes', value: '5-15 minutes', name: 'time-outline' },
    { label: '> 15 minutes', value: 'More than 15 minutes', name: 'hourglass' },
  ],
  pain: [
    { label: 'No pain', value: 'No pain', name: 'happy' },
    { label: 'Mild pain', value: 'Mild pain', name: 'sad' },
    { label: 'Severe pain', value: 'Severe pain', name: 'medical' },
    { label: 'Unbearable pain', value: 'Unbearable pain', name: 'alert-circle' },
  ],
  movement: [
    { label: 'Can move normally', value: 'Can move normally', name: 'walk' },
    { label: 'Limited movement', value: 'Limited movement', name: 'hand-left' },
    { label: 'Cannot move', value: 'Cannot move', name: 'ban' },
  ],
  severity: [
    { label: 'Mild symptoms', value: 'Mild symptoms', name: 'happy' },
    { label: 'Moderate symptoms', value: 'Moderate symptoms', name: 'alert-circle' },
    { label: 'Severe symptoms', value: 'Severe symptoms', name: 'medical' },
  ],
  poison_type: [
    { label: 'Unknown substance', value: 'Unknown substance', name: 'help-circle' },
    { label: 'Chemical/Cleaner', value: 'Chemical or cleaning product', name: 'alert-circle' },
    { label: 'Food poisoning', value: 'Food poisoning', name: 'water' },
    { label: 'Medication overdose', value: 'Medication overdose', name: 'medical' },
  ],
};

// Function to determine answer type based on question content
const getAnswerType = (question) => {
  const q = question.toLowerCase();

  // Consciousness - variations
  if (q.includes('conscious') || q.includes('awake') || q.includes('alert') || q.includes('responsive')) {
    return 'conscious';
  }

  // Breathing - variations
  if (q.includes('breathing') || q.includes('breathe') || q.includes('respiratory') || q.includes('shortness of breath')) {
    return 'breathing';
  }

  // Vomit with blood - specific to vomiting incidents
  if ((q.includes('vomit') || q.includes('vomiting')) && (q.includes('blood') || q.includes('bleeding'))) {
    return 'vomit_blood';
  }

  // Questions about pain or symptoms that happen only during an action versus constantly
  if (
    q.includes('only when') ||
    q.includes('constant') ||
    q.includes('always') ||
    (q.includes('or') && q.includes('only') && q.includes('when')) ||
    q.includes('worse when')
  ) {
    return 'trigger_vs_constant';
  }

  // Urination-specific questions use a more accurate answer set too
  if (q.includes('urinate') || q.includes('urination')) {
    return 'trigger_vs_constant';
  }

  // Pain quality or type
  if (q.includes('type of pain') || q.includes('what kind of pain') || q.includes('sharp') || q.includes('aching') || q.includes('burning') || q.includes('throbbing')) {
    return 'pain_type';
  }

  // Pain or symptom location
  if (q.includes('where') && (q.includes('pain') || q.includes('hurt') || q.includes('injury') || q.includes('bleeding'))) {
    return 'location';
  }

  // General bleeding (injuries, wounds)
  if ((q.includes('bleeding') || q.includes('blood')) && !q.includes('vomit')) {
    return 'bleeding';
  }

  // Frequency (vomiting frequency, seizure frequency, etc)
  if (q.includes('how many') || q.includes('how often') || q.includes('frequency') || q.includes('times')) {
    return 'frequency';
  }

  // Time duration
  if (
    q.includes('how long') ||
    q.includes('duration') ||
    q.includes('minutes') ||
    q.includes('hours') ||
    q.includes('seconds') ||
    q.includes('when did') ||
    q.includes('did it last') ||
    q.includes('how much time')
  ) {
    return 'time';
  }

  // Pain level
  if (q.includes('pain') || q.includes('hurt') || q.includes('ache') || q.includes('sore')) {
    return 'pain';
  }

  // Movement/mobility
  if (q.includes('move') || q.includes('movement') || q.includes('mobile') || q.includes('walk')) {
    return 'movement';
  }

  // Severity
  if (q.includes('severe') || q.includes('mild') || q.includes('moderate') || q.includes('serious')) {
    return 'severity';
  }

  // Poison type
  if (q.includes('poison') || q.includes('toxic') || q.includes('ingested') || q.includes('swallowed') || q.includes('substance')) {
    return 'poison_type';
  }

  // Default to yes/no for anything else
  return 'yes_no';
};

export default function ProbingScreen({
  questions,    // [{ id, text, textTwi }]
  summary,      // string — what the AI understood
  language,     // 'en' | 'twi'
  onSubmit,     // (answers: [{question, answer}]) => void
  onBack,       // () => void
  loading,      // bool
}) {
  const [answers, setAnswers] = useState({});

  const allAnswered = questions.every(q => answers[q.id]);

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    const answerList = questions.map(q => ({
      question: q.text,
      answer: answers[q.id],
    }));
    onSubmit(answerList);
  };

  return (
    <View style={s.container}>

      {/* What the AI understood */}
      <View style={s.summaryBox}>
        <Ionicons name="medkit" size={22} color="#1B5E20" />
        <Text style={s.summaryText}>{summary}</Text>
      </View>

      {/* Instruction */}
      <Text style={s.heading}>
        {language === 'twi'
          ? 'Paw nsɛm yi mu na boa me mmoa wo yiye:'
          : 'Tap the best answer for each question:'}
      </Text>

      {/* Questions */}
      {questions.map((q, i) => {
        const answerType = getAnswerType(q.text);
        const options = ANSWER_OPTIONS[answerType] || ANSWER_OPTIONS.yes_no;

        return (
          <View key={q.id} style={s.questionBox}>
            <View style={s.qNumBox}>
              <Text style={s.qNum}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.qText}>
                {language === 'twi' && q.textTwi ? q.textTwi : q.text}
              </Text>

              {/* Answer Buttons */}
              <View style={s.optionsGrid}>
                {options.map((option, idx) => {
                  const isSelected = answers[q.id] === option.value;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[s.optionBtn, isSelected && s.optionBtnSelected]}
                      onPress={() => handleAnswerSelect(q.id, option.value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={option.name} size={20} color={isSelected ? '#FFFFFF' : '#424242'} />
                      <Text style={[s.optionText, isSelected && s.optionTextSelected]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        );
      })}

      {/* Submit */}
      <TouchableOpacity
        style={[s.submitBtn, (!allAnswered || loading) && s.submitBtnOff]}
        onPress={handleSubmit}
        disabled={!allAnswered || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <>
            <ActivityIndicator size="small" color="#FFF" />
            <Text style={s.submitBtnText}>
              {language === 'twi' ? '  Hwɛ...' : '  Analysing...'}
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="search" size={16} color="#FFF" />
            <Text style={s.submitBtnText}>
              {language === 'twi' ? 'Hwɛ & Boa Me' : 'Get First Aid Guidance'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Back */}
      <TouchableOpacity style={s.backBtn} onPress={onBack}>
        <Text style={s.backBtnText}>
          {language === 'twi' ? '← San kɔ' : '← Back to description'}
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 14 },

  summaryBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderLeftWidth: 3,
    borderLeftColor: '#2E7D32',
  },
  summaryText: { flex: 1, fontSize: 14, color: '#1B5E20', lineHeight: 20 },

  heading: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },

  questionBox: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  qNumBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  qNum: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  qText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8, lineHeight: 20 },

  optionsGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  optionBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionBtnSelected: {
    backgroundColor: '#D32F2F',
    borderColor: '#B71C1C',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    flex: 1,
  },
  optionTextSelected: { color: '#FFFFFF' },

  submitBtn: {
    minHeight: 54,
    backgroundColor: '#D32F2F',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnOff:  { backgroundColor: '#9E9E9E', shadowOpacity: 0 },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },

  backBtn:     { alignItems: 'center', paddingVertical: 6 },
  backBtnText: { fontSize: 14, color: '#00796B', fontWeight: '600' },
});
