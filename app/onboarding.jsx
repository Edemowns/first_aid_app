// app/onboarding.jsx
// Onboarding / Language Select — converted from Figma Make

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const router = useRouter();

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('language', selectedLanguage);
    await AsyncStorage.setItem('onboarded', 'true');
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoRing2} />
          <View style={styles.logoRing1} />
          <View style={styles.logoBox}>
            <Text style={styles.logoPlus}>+</Text>
          </View>

          {/* App name */}
          <Text style={styles.appName}>AIDA</Text>
          <Text style={styles.tagline}>Your AI First Aid Assistant for Ghana</Text>

          {/* Ghana flag */}
          <View style={styles.flagRow}>
            <View style={styles.flag}>
              <View style={[styles.flagStripe, { backgroundColor: '#006B3F' }]} />
              <View style={[styles.flagStripe, { backgroundColor: '#FCD116' }]} />
              <View style={[styles.flagStripe, { backgroundColor: '#CE1126' }]} />
            </View>
            <Text style={styles.flagLabel}>Ghana</Text>
          </View>
        </View>

        {/* Language selection */}
        <View style={styles.langSection}>
          <Text style={styles.chooseLangEn}>Choose your language</Text>
          <Text style={styles.chooseLangTwi}>Paw wo kasa</Text>

          <View style={styles.langCards}>
            {/* English card */}
            <TouchableOpacity
              style={[styles.langCard, selectedLanguage === 'en' && styles.langCardActive]}
              onPress={() => setSelectedLanguage('en')}
              activeOpacity={0.85}
            >
              <View style={[styles.flagSmall, { borderColor: selectedLanguage === 'en' ? 'rgba(255,255,255,0.3)' : '#E0E0E0' }]}>
                <View style={[styles.flagStripe, { backgroundColor: '#012169' }]} />
                <View style={[styles.flagStripe, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.flagStripe, { backgroundColor: '#C8102E' }]} />
              </View>
              <Text style={[styles.langCardTitle, selectedLanguage === 'en' && styles.langCardTitleActive]}>
                English
              </Text>
              <Text style={[styles.langCardSub, selectedLanguage === 'en' && styles.langCardSubActive]}>
                Get guidance in English
              </Text>
            </TouchableOpacity>

            {/* Twi card */}
            <TouchableOpacity
              style={[styles.langCard, selectedLanguage === 'twi' && styles.langCardActive]}
              onPress={() => setSelectedLanguage('twi')}
              activeOpacity={0.85}
            >
              <View style={[styles.flagSmall, { borderColor: selectedLanguage === 'twi' ? 'rgba(255,255,255,0.3)' : '#E0E0E0' }]}>
                <View style={[styles.flagStripe, { backgroundColor: '#006B3F' }]} />
                <View style={[styles.flagStripe, { backgroundColor: '#FCD116' }]} />
                <View style={[styles.flagStripe, { backgroundColor: '#CE1126' }]} />
              </View>
              <Text style={[styles.langCardTitle, selectedLanguage === 'twi' && styles.langCardTitleActive]}>
                Twi
              </Text>
              <Text style={[styles.langCardSub, selectedLanguage === 'twi' && styles.langCardSubActive]}>
                Nya mmoa wɔ Twi mu
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.startBtn} onPress={handleGetStarted} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>Get Started  →</Text>
          </TouchableOpacity>
          <Text style={styles.changeLater}>You can change this anytime in settings</Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: 32 },

  // Logo
  logoSection: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logoBox: {
    width: 112, height: 112, borderRadius: 28,
    backgroundColor: '#D32F2F',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#D32F2F', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  logoRing1: {
    position: 'absolute', width: 136, height: 136, borderRadius: 34,
    borderWidth: 2, borderColor: 'rgba(211,47,47,0.2)',
    top: '50%', marginTop: -68,
  },
  logoRing2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 40,
    borderWidth: 1, borderColor: 'rgba(211,47,47,0.1)',
    top: '50%', marginTop: -80,
  },
  logoPlus: { fontSize: 64, color: '#FFFFFF', fontWeight: '300', lineHeight: 72, marginTop: -4 },
  appName: { fontSize: 36, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5, marginTop: 8 },
  tagline: { fontSize: 16, color: '#555555', textAlign: 'center', maxWidth: 240, lineHeight: 22 },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  flag: { width: 40, height: 28, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(158,158,158,0.2)' },
  flagStripe: { flex: 1 },
  flagLabel: { fontSize: 14, fontWeight: '500', color: '#555555' },

  // Language
  langSection: { width: '100%', gap: 12, marginBottom: 32 },
  chooseLangEn: { fontSize: 13, fontWeight: '600', color: '#555555', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  chooseLangTwi: { fontSize: 12, color: '#9E9E9E', textAlign: 'center', marginTop: -4 },
  langCards: { flexDirection: 'row', gap: 16, marginTop: 8 },
  langCard: {
    flex: 1, minHeight: 140, borderRadius: 20, padding: 20,
    backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E0E0E0',
    justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  langCardActive: {
    backgroundColor: '#D32F2F', borderColor: '#D32F2F',
    shadowColor: '#D32F2F', shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  flagSmall: { width: 40, height: 28, borderRadius: 3, overflow: 'hidden', borderWidth: 1 },
  langCardTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginTop: 12 },
  langCardTitleActive: { color: '#FFFFFF' },
  langCardSub: { fontSize: 13, color: '#555555', lineHeight: 18 },
  langCardSubActive: { color: 'rgba(255,255,255,0.8)' },

  // CTA
  ctaSection: { width: '100%', gap: 12 },
  startBtn: {
    width: '100%', minHeight: 56, borderRadius: 20,
    backgroundColor: '#D32F2F', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#D32F2F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  startBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  changeLater: { fontSize: 12, color: '#9E9E9E', textAlign: 'center' },
});
