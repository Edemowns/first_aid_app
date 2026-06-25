// app/index.jsx — Home Screen converted from Figma Make to React Native

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Keyboard, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { probeEmergency, diagnoseEmergency, getNearbyFacilities } from '../services/api';
import ProbingScreen from '../components/ProbingScreen';
import MediaInput from '../components/MediaInput';
import { getCurrentLocation } from '../services/location';
import VoiceInput from '../components/VoiceInput';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { findOfflineFirstAid } from '../constants/firstaid';
import { diagnoseOffline } from '../services/offlineModels';
import ConnectivityBanner from '../components/ConnectivityBanner';
import { useConnectivity, checkConnectivity, getConnectivityState } from '../services/connectivity';

let useSpeechRecognition;
try {
  const SpeechModule = require('expo-speech-recognition');
  useSpeechRecognition = SpeechModule.useSpeechRecognition || (() => ({
    isRecognitionAvailable: false,
    start: async () => {},
    stop: async () => {},
    transcript: '',
    reset: () => {},
  }));
} catch (err) {
  useSpeechRecognition = () => ({
    isRecognitionAvailable: false,
    start: async () => {},
    stop: async () => {},
    transcript: '',
    reset: () => {},
  });
}

let globalHasShownOfflineAlert = false;

const SCENARIOS = [
  
  {
    label: 'Drowning',
    labelTwi: 'Nsuo',
    icon: 'swim', // swimmer drowning context
    color: '#0284C7',
  },
  {
    label: 'Bleeding',
    labelTwi: 'Mogya',
    icon: 'water-alert', // fluid loss / emergency fluid
    color: '#DC2626',
  },
  {
    label: 'Burns',
    labelTwi: 'Ogya',
    icon: 'fire', // strong burn representation
    color: '#EA580C',
  },
  {
    label: 'Broken Bone',
    labelTwi: 'Dompe',
    icon: 'bone', // very accurate medical icon
    color: '#6B7280',
  },
  
  {
    label: 'Choking',
    labelTwi: 'Ɔhome',
    icon: 'lungs', // airway obstruction gesture
    color: '#F59E0B',
  },
  {
    label: 'Seizure',
    labelTwi: 'Ahohow',
    icon: 'brain', // neurological symbol
    color: '#7C3AED',
  },
  {
    label: 'Heart Attack',
    labelTwi: 'Akoma',
    icon: 'heart-pulse', // ECG heart icon
    color: '#E11D48',
  },
  {
    label: 'Snake Bite',
    labelTwi: 'Ɔwɔ Ka',
    icon: 'snake', // very clear emergency symbol
    color: '#059669',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { isOnline, loading: isConnectivityLoading } = useConnectivity();

  const [inputText, setInputText]   = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [language, setLanguage]     = useState('en');
  const [image,     setImage]     = useState(null);   // { uri, base64, mediaType }
  const [loading,   setLoading]   = useState(false);
  const [stage,     setStage]     = useState('input'); // 'input' | 'probing'
  const [probeData, setProbeData] = useState(null);    // { questions, summary }
  const [pressedScenario, setPressedScenario] = useState(null);
  const { isRecognitionAvailable, start, stop, transcript, reset } = useSpeechRecognition();
  const [isRecording, setIsRecording] = useState(false);

  // Setup periodic connectivity checks every 5 seconds to know offline status frequently
  useEffect(() => {
    const interval = setInterval(async () => {
      await checkConnectivity();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Show immediate alert to offline users upon startup or going offline
  useEffect(() => {
    if (!isConnectivityLoading && isOnline === false && !globalHasShownOfflineAlert) {
      globalHasShownOfflineAlert = true;
      Alert.alert(
        language === 'twi' ? 'Wunni Internet (Offline)' : 'No Internet Connection',
        language === 'twi'
          ? 'Wunni internet mprempren. Afã horow te sɛ "voice input", "photo input" anaa "online AI diagnosis" hwehwɛ internet pɛpɛɛpɛ.\n\nMesrɛ sɔ wo data anaa Wi-Fi hwɛ bio anaa paw "Offline Mode" kɔ so nya mmoa.'
          : 'You are currently offline. Online features like voice/speech input, photo/camera input, and AI-powered real-time diagnosis require internet access.\n\nPlease turn on your mobile data or Wi-Fi, or proceed with preloaded offline first-aid features.',
        [
          {
            text: language === 'twi' ? 'Sɔ Hwɛ Bio' : 'Retry Connection',
            onPress: async () => {
              globalHasShownOfflineAlert = false; // allow alert again if still offline
              await checkConnectivity();
            }
          },
          {
            text: language === 'twi' ? 'Kɔ So Offline' : 'Use Offline Mode',
            style: 'cancel'
          }
        ],
        { cancelable: true }
      );
    } else if (isOnline === true) {
      globalHasShownOfflineAlert = false;
    }
  }, [isOnline, isConnectivityLoading, language]);

  useEffect(() => {
    AsyncStorage.getItem('onboarded').then(v => { if (!v) router.replace('/onboarding'); });
    AsyncStorage.getItem('language').then(l => { if (l) setLanguage(l); });
  }, []);

  useEffect(() => {
    // Recommendation 4 & Eager Loading: Background pre-fetching of nearby hospitals
    const prefetchNearbyHospitals = async () => {
      try {
        const connectivity = getConnectivityState();
        if (connectivity.isOnline === false) {
          console.log('[Background Prefetch] Skipping nearby fetch because offline');
          return;
        }

        console.log('[Background Prefetch] Starting location prefetch...');
        const loc = await getCurrentLocation();
        if (!loc) {
          console.log('[Background Prefetch] Location not available for prefetch');
          return;
        }
        
        console.log('[Background Prefetch] Fetching nearby facilities in background...');
        const data = await getNearbyFacilities(loc.latitude, loc.longitude);
        if (data && data.facilities) {
          // Save in identical format as nearby.jsx cache
          await AsyncStorage.setItem('nearby_facilities_cache', JSON.stringify({
            data,
            lat: loc.latitude,
            lng: loc.longitude,
            timestamp: Date.now(),
          }));
          console.log('[Background Prefetch] Successfully pre-cached nearby hospitals.');
        }
      } catch (err) {
        console.log('[Background Prefetch] Silent error during prefetch:', err.message);
      }
    };

    // Run 1.5 seconds after home screen mounts to ensure completely smooth initial UI render
    const timer = setTimeout(prefetchNearbyHospitals, 1500);
    return () => clearTimeout(timer);
  }, []);

  const toggleLanguage = async () => {
    const next = language === 'en' ? 'twi' : 'en';
    setLanguage(next);
    await AsyncStorage.setItem('language', next);
  };

  const handleScenario = (s) => setInputText(language === 'twi' ? s.labelTwi : s.label);

  const toggleVoiceRecording = async () => {
    if (isRecording) {
      await stop();
      setIsRecording(false);
      // After stopping, if we have a transcript, trigger analysis
      if (transcript) {
        const fullText = inputText.trim() ? `${inputText.trim()} ${transcript}` : transcript;
        setInputText(fullText);
        handleDescribe(fullText);
      }
    } else {
      reset(); // Clear old transcripts
      await start({ lang: 'en-US' }); // Or 'tw-GH' if supported
      setIsRecording(true);
    }
  };

  // ── Stage 1: send description → get probing questions ───────────────────
  const handleDescribe = async (overrideText) => {
    const query = (overrideText || inputText).trim();

    // ✅ Allow either text OR image
    const hasText = query.length > 0;
    const hasImage = !!image?.base64;

    // ❌ Neither text nor image provided
    if (!hasText && !hasImage) {
      Alert.alert(
        language === 'twi' ? 'Kyerɛ deɛ asi ho' : 'Describe the emergency',
        language === 'twi'
          ? 'Kyerɛ asɛm no anaa fa foto ka ho.'
          : 'Type what happened or upload a photo.'
      );
      return;
    }

    setLoading(true);

    // Immediate offline execution to bypass network delay/alert completely
    if (isOnline === false) {
      console.log('[Frontend] Device is offline, using offline models directly.');
      const offlineResult = diagnoseOffline(query, language);
      const formattedResult = {
        ...offlineResult,
        is_offline: true,
      };

      router.push({
        pathname: '/results',
        params: {
          data: JSON.stringify(formattedResult),
          language,
          originalText: query,
        },
      });
      setLoading(false);
      return;
    }

    try {
      // ✅ Send text + image to backend
      const result = await probeEmergency(
        hasText ? query : '',
        language,
        image?.base64 || null,
        image?.mediaType || 'image/jpeg'
      );

      console.log('[Frontend API Response]:', JSON.stringify(result, null, 2));

      // ✅ AI wants follow-up probing questions
      if (result && result.stage === 'probing' && result.questions && result.questions.length > 0) {
        console.log('[Frontend] Entering probing stage with', result.questions.length, 'questions');
        
        const transformedQuestions = result.questions.map((q, i) => ({
          id: q.id || `q${i + 1}`,
          text: q.text || q.question || '',
          type: q.type || 'single_choice',
          options: q.options || [],
        }));

        setProbeData({
          questions: transformedQuestions,
          summary: result.summary,
        });

        setStage('probing');
        console.log('[Frontend] Stage state set to probing successfully.');

      } else {
        console.log('[Frontend] Direct diagnosis result returned.');

        // ✅ Direct diagnosis / result
        router.push({
          pathname: '/results',
          params: {
            data: JSON.stringify(result),
            language,
          },
        });

      }

    } catch (err) {
      console.error('handleDescribe error (falling back offline):', err);
      
      const offlineResult = diagnoseOffline(query, language);
      const formattedResult = {
        ...offlineResult,
        is_offline: true,
      };

      router.push({
        pathname: '/results',
        params: {
          data: JSON.stringify(formattedResult),
          language,
          originalText: query,
        },
      });

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

        {/* Top header — Login & History */}
        <View style={s.homeHeader}>
          <View style={s.welcomeBlock}>
      
          </View>
          <View style={s.headerButtons}>
            <TouchableOpacity style={s.topAction} onPress={() => router.push('/history')}>
              <Text style={s.topActionText}>{language === 'twi' ? 'History' : 'History'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.topAction} onPress={() => router.push('/login')}>
              <Text style={s.topActionText}>{language === 'twi' ? 'Login' : 'Login'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connection banner */}
        <ConnectivityBanner language={language} />

        {/* Hero */}
        <View style={s.hero}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={s.heroIcon}><Text style={s.heroIconText}>🚨</Text></View>
              <Text style={s.homeTitle}>{language === 'twi' ? 'AIDA' : 'AIDA'}</Text>
            </View>
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
              activeOpacity={0.85}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={language === 'twi' ? `${sc.labelTwi} scenario` : `${sc.label} scenario`}
            >
              <View style={[s.scenarioIcon, { backgroundColor: `${sc.color}20` }]}><MaterialCommunityIcons name={sc.icon} size={26} color={sc.color}/></View>
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
            placeholder={language === 'twi' ? 'Kyerɛ deɛ asi ho' : 'Describe the emergency                                                                 e.g. Person is bleeding from the arm'}
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

        <MediaInput
          language={language}
          image={image}
          onImageChange={setImage}
          // Pass the speech tools as props
          speechTools={{
            isRecording,
            startRecording: () => { reset(); start({ lang: 'en-US' }); setIsRecording(true); },
            stopRecording: async () => { 
                await stop(); 
                setIsRecording(false); 
                // Logic to process the transcript after stop
                if (transcript) handleDescribe(transcript);
            },
            transcript
          }}
          onVoiceTranscribed={(text) => {
            const fullText = inputText.trim() ? `${inputText.trim()} ${text}` : text;
            setInputText(fullText);
            handleDescribe(fullText);
          }}
          disabled={loading}
        />

        {/* Analyze button */}
        <TouchableOpacity
          style={[
            s.analyzeBtn,
            ((!inputText.trim() && !image) || loading || isConnectivityLoading) && s.analyzeBtnOff
          ]}
          onPress={() => {
            if (isConnectivityLoading) {
              Alert.alert(
                language === 'twi' ? 'Yɛrehwɛ internet' : 'Checking Connection',
                language === 'twi'
                  ? 'Mesrɛ twɛn ma yɛnhwɛ sɛ wo wɔ internet anaa.'
                  : 'Please wait while we check your internet status.'
              );
              return;
            }
            handleDescribe();
          }}
          disabled={(!inputText.trim() && !image) || loading || isConnectivityLoading}
          activeOpacity={0.85}
        >
          {isConnectivityLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={s.analyzeBtnText}>
                {language === 'twi' ? 'Yɛrehwɛ internet...' : 'Checking connection...'}
              </Text>
            </View>
          ) : loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={s.analyzeBtnText}>
                {language === 'twi' ? 'Hwɛ...' : 'Analysing...'}
              </Text>
            </View>
          ) : (
            <Text style={s.analyzeBtnText}>
              {language === 'twi' ? '🔍 Hwɛ & Boa Me' : '🔍 Analyse & Get Help'}
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
  scenarioBtn: { width: '22%', minHeight: 84, backgroundColor: '#FFF', borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 6, gap: 6, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, transform: [{ scale: 1 }], },
  scenarioBtnActive: { backgroundColor: '#F9FAFB', borderColor: '#D1D5DB' },
  scenarioIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8, backgroundColor: '#F3F4F6' },
  scenarioText: { fontSize: 11, color: '#111827', fontWeight: '600', textAlign: 'center', lineHeight: 13 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },
  inputBox: { position: 'relative' },
  input: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 2, borderColor: '#E0E0E0', padding: 14, paddingRight: 40, fontSize: 16, color: '#1A1A1A', minHeight: 100 },
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
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  welcomeBlock: { flex: 1 },
  homeTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 4,  },
  homeSubtitle: { fontSize: 13, color: '#616161', lineHeight: 18 },
  headerButtons: { flexDirection: 'row', gap: 10 },
  topAction: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#E0F2F1' },
  topActionText: { color: '#00796B', fontWeight: '700', fontSize: 13 },
  probeNotice:     { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: '#1565C0' },
  probeNoticeText: { fontSize: 12, color: '#0D47A1', lineHeight: 18 },
});