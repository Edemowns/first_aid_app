import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProbingScreen({
  questions,    // [{ id, text, textTwi, question, options }]
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
      question: q.text || q.question || '',
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
      {}
      {questions.map((q, i) => {
        const questionText = q.text || q.question || '';
        const options = q.options || [];

        return (
          <View key={q.id} style={s.questionBox}>
            <View style={s.qNumBox}>
              <Text style={s.qNum}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.qText}>
                {language === 'twi' 
                  ? (q.textTwi || questionText) 
                  : questionText}
              </Text>

              {/* Answer Buttons */}
              <View style={s.optionsGrid}>
                {options.map((option, idx) => {
                  const isSelected = answers[q.id] === option.label;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[s.optionBtn, isSelected && s.optionBtnSelected]}
                      onPress={() => handleAnswerSelect(q.id, option.label)}
                      activeOpacity={0.7}
                    >
                      {/* Dynamic radio style indicator replacing strict static icon map */}
                      <Ionicons 
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'} 
                        size={20} 
                        color={isSelected ? '#FFFFFF' : '#424242'} 
                      />
                      
                      <View style={{ flex: 1 }}>
                        <Text style={[s.optionText, isSelected && s.optionTextSelected]}>
                          {option.label}
                        </Text>

                        {/* Display option descriptions when present */}
                        {!!option.description && (
                          <Text
                            style={{
                              fontSize: 12,
                              color: isSelected ? '#FFEBEE' : '#757575',
                              marginTop: 2,
                            }}
                          >
                            {option.description}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        );
      })}

      {/* Submit */}
      {}
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