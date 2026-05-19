// app/index.jsx — Home Screen converted from Figma Make to React Native

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Keyboard, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { probeEmergency, diagnoseEmergency } from '../services/api';
import ProbingScreen from '../components/ProbingScreen';
import MediaInput from '../components/MediaInput';
import { getCurrentLocation } from '../services/location';
import VoiceInput from '../components/VoiceInput';



const SCENARIOS = [
  { label: 'Choking',      labelTwi: 'Ɔhome',    icon: '😲', color: '#c7c0c0' },
  { label: 'Bleeding',     labelTwi: 'Mogya',    icon: '🩸', color: '#c7c0c0' },
  { label: 'Burns',        labelTwi: 'Ogya',     icon: '🔥', color: '#c7c0c0' },
  { label: 'Broken Bone',  labelTwi: 'Dompe',    icon: '🦴', color: '#c7c0c0' },
  { label: 'Drowning',     labelTwi: 'Nsuo',     icon: '🌊', color: '#c7c0c0' },
  { label: 'Seizure',      labelTwi: 'Ahohow',   icon: '⚡', color: '#c7c0c0' },
  { label: 'Heart Attack', labelTwi: 'Akoma',    icon: '❤️', color: '#c7c0c0' },
  { label: 'Snake Bite',   labelTwi: 'Ɔwɔ Ka',   icon: '🐍', color: '#c7c0c0' },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  


  const [inputText, setInputText]   = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [language, setLanguage]     = useState('en');
  const [image,     setImage]     = useState(null);   // { uri, base64, mediaType }
  const [loading,   setLoading]   = useState(false);
  const [stage,     setStage]     = useState('input'); // 'input' | 'probing'
  const [probeData, setProbeData] = useState(null);    // { questions, summary }
  const [pressedScenario, setPressedScenario] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarded').then(v => { if (!v) router.replace('/onboarding'); });
    AsyncStorage.getItem('language').then(l => { if (l) setLanguage(l); });
  }, []);

  const toggleLanguage = async () => {
    const next = language === 'en' ? 'twi' : 'en';
    setLanguage(next);
    await AsyncStorage.setItem('language', next);
  };

  const handleScenario = (s) => setInputText(language === 'twi' ? s.labelTwi : s.label);

  // ── Stage 1: send description → get probing questions ───────────────────
    const handleDescribe = async (overrideText) => {
      const query = (overrideText || inputText).trim();
      if (!query) {
        Alert.alert(
          language === 'twi' ? 'Kyerɛ deɛ asi ho' : 'Describe the emergency',
          language === 'twi'
            ? 'Kyerɛ anaasɛ paw scenario bi'
            : 'Type what happened or select a scenario above.'
        );
        return;
      }

  setLoading(true);
      try {
        const result = await probeEmergency(query, language);
  
        if (result.stage === 'probing' && result.questions?.length > 0) {
          // AI wants to ask follow-up questions — transform format
          const transformedQuestions = result.questions.map((q, i) => ({
            id: `q${i + 1}`,
            text: q,
            textTwi: q, // TODO: Add translation service if needed
          }));
          setProbeData({ 
            questions: transformedQuestions, 
            summary: result.summary 
          });
          setStage('probing');
        } else if (result.stage === 'direct') {
          // AI skipped probing — go straight to results
          router.push({
            pathname: '/results',
            params: { data: JSON.stringify(result), language },
          });
        } else {
          // Fallback — treat as direct result
          router.push({
            pathname: '/results',
            params: { data: JSON.stringify(result), language },
          });
        }
      } catch (err) {
        Alert.alert(
          language === 'twi' ? 'Mfomso' : 'Error',
          err.message || 'Could not reach AI service. Check your connection.'
        );
      } finally {
        setLoading(false);
      }
    };


    const handleProbeSubmit = async (answers) => {
        setLoading(true);
        try {
          const result = await diagnoseEmergency(
            inputText,
            answers,
            language
          );
          router.push({
            pathname: '/results',
            params: { data: JSON.stringify(result), language },
          });
        } catch (err) {
          Alert.alert(
            language === 'twi' ? 'Mfomso' : 'Error',
            err.message || 'Could not reach AI service.'
          );
        } finally {
          setLoading(false);
        }
      };
    
      const handleBack = () => {
        setStage('input');
        setProbeData(null);
      };
    
      // ── Probing stage ────────────────────────────────────────────────────────
      if (stage === 'probing' && probeData) {
        return (
          <SafeAreaView style={s.safe} edges={['top','bottom']}>
            <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
              <ProbingScreen
                questions={probeData.questions}
                summary={probeData.summary}
                language={language}
                onSubmit={handleProbeSubmit}
                onBack={handleBack}
                loading={loading}
              />
            </ScrollView>
          </SafeAreaView>
        );
      }

  return (
    <SafeAreaView style={s.safe} edges={['top','bottom']}>

    

      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        

        {/* Hero */}
        <View style={s.hero}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View style={s.heroIcon}><Text style={s.heroIconText}>🚨</Text></View>
            <View style={s.headerRight}>
              <View style={s.flag}>
                <View style={[s.stripe, { backgroundColor: '#CE1126' }]} />
                <View style={[s.stripe, { backgroundColor: '#FCD116' }]} />
                <View style={[s.stripe, { backgroundColor: '#006B3F' }]} />
                
                
              </View>
              <TouchableOpacity style={s.langBtn} onPress={toggleLanguage}>
                <Text style={s.langBtnText}>{language === 'en' ? '🌐 EN' : '🌐 TWI'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={s.heroTitle}>{language === 'twi' ? 'Ayareɛ Mmoa' : 'Emergency First Aid'}</Text>
          <Text style={s.heroSub}>
            {language === 'twi'
              ? 'Kyerɛ deɛ asi ho na nya mmoa ntɛm'
              : 'Describe the situation and get instant AI-powered medical guidance'}
          </Text>
        </View>

        {/* Quick select */}
        <View>
          <View style={s.sectionHead}>
            <Text style={s.sectionLabel}>{language === 'twi' ? 'PAW SCENARIO' : 'QUICK SELECT'}</Text>
            <View style={s.sectionLine} />
          </View>
          <View style={s.grid}>
            {SCENARIOS.map((sc) => (
            <TouchableOpacity
              key={sc.label}
              style={[
                s.scenarioBtn,
                pressedScenario === sc.label && s.scenarioBtnActive,
              ]}
              onPress={() => handleScenario(sc)}
              onPressIn={() => setPressedScenario(sc.label)}
              onPressOut={() => setPressedScenario(null)}
              disabled={isAnalyzing}
              activeOpacity={0.75}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={language === 'twi' ? `${sc.labelTwi} scenario` : `${sc.label} scenario`}
            >
              <View style={[s.scenarioIcon, { backgroundColor: `${sc.color}20` }]}>
                <Text style={s.scenarioIconText}>{sc.icon}</Text>
                </View>
                <Text style={s.scenarioText} numberOfLines={2}>{language === 'twi' ? sc.labelTwi : sc.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Divider */}
        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>{language === 'twi' ? 'anaasɛ kyerɛ' : 'or describe the emergency'}</Text>
          <View style={s.dividerLine} />
        </View>

        {/* Input */}
        <View style={s.inputBox}>
          <TextInput
            style={s.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={language === 'twi' ? 'Kyerɛ deɛ asi ho...' : 'Describe the emergency                                                                 e.g. Person is bleeding from the arm'}
            placeholderTextColor="#9E9E9E"
            multiline numberOfLines={4}
            textAlignVertical="top"
            editable={!isAnalyzing}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={() => {}}
          />
          {!!inputText && (
            <TouchableOpacity style={s.clearBtn} onPress={() => setInputText('')}>
              <Text style={s.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Media input (image + voice) */}
        <MediaInput
          language={language}
          image={image}
          onImageChange={setImage}
          onVoiceText={(text) => setInputText(prev => prev + (prev ? ' ' : '') + text)}
          onVoiceTranscribed={(text) => {
            const fullText = inputText.trim() ? `${inputText.trim()} ${text}` : text;
            setInputText(fullText);
            handleDescribe(fullText);
          }}
          disabled={loading}
        />

        {/* Analyze button */}
        <TouchableOpacity
          style={[s.analyzeBtn, (!inputText.trim() || loading) && s.analyzeBtnOff]}
          onPress={() => handleDescribe()}
          disabled={!inputText.trim() || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={s.analyzeBtnText}>
                {language === 'twi' ? '  Hwɛ...' : '  Analysing...'}
              </Text>
            </>
          ) : (
            <Text style={s.analyzeBtnText}>
              🔍  {language === 'twi' ? 'Hwɛ & Boa Me' : 'Analyse & Get Help'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Hotlines */}
        <TouchableOpacity style={s.hotlinesBtn} onPress={() => router.push('/hotlines')} activeOpacity={0.8}>
          <Text style={s.hotlinesBtnText}>📞 {language === 'twi' ? 'Hwɛ Emergency Hotlines' : 'View Emergency Hotlines'}</Text>
        </TouchableOpacity>

        {/* Nearby Facilities */}
        <TouchableOpacity style={s.nearbyBtn} onPress={() => router.push('/nearby')} activeOpacity={0.8}>
         <Text style={s.nearbyBtnText}>🏥 {language === 'twi' ? 'Hwɛ Yadeɛhaw a Wɔbɛn' : 'Find Nearby Hospitals'}</Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}><Text style={{ fontWeight: '700' }}>Important: </Text>This app provides first aid guidance only. Always call emergency services for serious injuries.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { backgroundColor: '#D32F2F', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flag: { width: 32, height: 22, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  stripe: { flex: 1 },
  langBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  langBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 48 },
  hero: { backgroundColor: '#D32F2F', borderRadius: 20, padding: 24, shadowColor: '#D32F2F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  heroIcon: { width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroIconText: { fontSize: 26 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  heroSub: { fontSize: 14, fontFamily: 'InterSemiBold', color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  scenarioBtn: { width: '22%', minHeight: 84, backgroundColor: '#FFF', borderRadius: 10, alignItems: 'center', justifyContent: 'center', padding: 8, gap: 6, borderWidth: 1, borderColor: '#E0E0E0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  scenarioBtnActive: { backgroundColor: '#F7F7F7', borderColor: '#BDBDBD' },
  scenarioIcon: { width: 60, height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  scenarioText: { fontSize: 10, color: '#1A1A1A', fontWeight: '600', textAlign: 'center', lineHeight: 13 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },
  inputBox: { position: 'relative' },
  input: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 2, borderColor: '#E0E0E0', padding: 14, paddingRight: 40, fontSize: 16, color: '#1A1A1A', minHeight: 120 },
  clearBtn: { position: 'absolute', top: 12, right: 12, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(158,158,158,0.15)', alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { fontSize: 13, color: '#9E9E9E' },
  actionRow: { flexDirection: 'row', gap: 10 },
  speakBtn: { flex: 1, minHeight: 52, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 2, borderColor: '#00796B', alignItems: 'center', justifyContent: 'center' },
  speakBtnText: { fontSize: 14, fontWeight: '700', color: '#00796B' },
  analyzeBtn: { flex: 1.5, minHeight: 52, backgroundColor: '#D32F2F', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, shadowColor: '#D32F2F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  analyzeBtnOff: { backgroundColor: '#9E9E9E', shadowOpacity: 0 },
  analyzeBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  hotlinesBtn: { minHeight: 56, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 2, borderColor: '#00796B', alignItems: 'center', justifyContent: 'center' },
  hotlinesBtnText: { fontSize: 16, fontWeight: '700', color: '#00796B' },
  disclaimer: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E0E0E0', padding: 14 },
  disclaimerText: { fontSize: 12, color: '#555', textAlign: 'center', lineHeight: 18 },
  nearbyBtn: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  nearbyBtnText: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  probeNotice:     { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: '#1565C0' },
  probeNoticeText: { fontSize: 12, color: '#0D47A1', lineHeight: 18 },
});