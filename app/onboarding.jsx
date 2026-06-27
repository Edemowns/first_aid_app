// app/onboarding.jsx
// Onboarding / Language Select — converted from Figma Make

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlow} />
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>AI FIRST AID</Text>
            </View>

            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="medical-bag" size={34} color="#FFF" />
            </View>

            <Text style={styles.appName}>AIDA</Text>
            <Text style={styles.tagline}>
              Get calm, step-by-step support for emergencies in Ghana.
            </Text>

            <View style={styles.flagRow}>
              <View style={styles.flag}>
                <View style={[styles.flagStripe, { backgroundColor: '#006B3F' }]} />
                <View style={[styles.flagStripe, { backgroundColor: '#FCD116' }]} />
                <View style={[styles.flagStripe, { backgroundColor: '#CE1126' }]} />
              </View>
              <Text style={styles.flagLabel}>Ghana</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featurePill}>
              <MaterialCommunityIcons name="flash" size={18} color="#D32F2F" />
              <Text style={styles.featureText}>Fast guidance</Text>
            </View>
            <View style={styles.featurePill}>
              <MaterialCommunityIcons name="cellphone-link" size={18} color="#D32F2F" />
              <Text style={styles.featureText}>Emergency contacts</Text>
            </View>
            <View style={styles.featurePill}>
              <MaterialCommunityIcons name="wifi-off" size={18} color="#D32F2F" />
              <Text style={styles.featureText}>Offline ready</Text>
            </View>
          </View>

          <View style={styles.langSection}>
            <Text style={styles.chooseLangEn}>Choose your language</Text>
            <Text style={styles.chooseLangTwi}>Paw wo kasa</Text>

            <View style={styles.langCards}>
              <TouchableOpacity
                style={[styles.langCard, selectedLanguage === 'en' && styles.langCardActive]}
                onPress={() => setSelectedLanguage('en')}
                activeOpacity={0.9}
              >
                <View style={styles.cardTopRow}>
                  <View style={[styles.flagSmall, { borderColor: selectedLanguage === 'en' ? 'rgba(255,255,255,0.3)' : '#E0E0E0' }]}>
                    <View style={[styles.flagStripe, { backgroundColor: '#012169' }]} />
                    <View style={[styles.flagStripe, { backgroundColor: '#FFFFFF' }]} />
                    <View style={[styles.flagStripe, { backgroundColor: '#C8102E' }]} />
                  </View>
                  {selectedLanguage === 'en' ? (
                    <View style={styles.checkBadge}>
                      <MaterialCommunityIcons name="check" size={16} color="#FFF" />
                    </View>
                  ) : null}
                </View>
                <View>
                  <Text style={[styles.langCardTitle, selectedLanguage === 'en' && styles.langCardTitleActive]}>English</Text>
                  <Text style={[styles.langCardSub, selectedLanguage === 'en' && styles.langCardSubActive]}>Get guidance in English</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.langCard, selectedLanguage === 'twi' && styles.langCardActive]}
                onPress={() => setSelectedLanguage('twi')}
                activeOpacity={0.9}
              >
                <View style={styles.cardTopRow}>
                  <View style={[styles.flagSmall, { borderColor: selectedLanguage === 'twi' ? 'rgba(255,255,255,0.3)' : '#E0E0E0' }]}>
                    <View style={[styles.flagStripe, { backgroundColor: '#006B3F' }]} />
                    <View style={[styles.flagStripe, { backgroundColor: '#FCD116' }]} />
                    <View style={[styles.flagStripe, { backgroundColor: '#CE1126' }]} />
                  </View>
                  {selectedLanguage === 'twi' ? (
                    <View style={styles.checkBadge}>
                      <MaterialCommunityIcons name="check" size={16} color="#FFF" />
                    </View>
                  ) : null}
                </View>
                <View>
                  <Text style={[styles.langCardTitle, selectedLanguage === 'twi' && styles.langCardTitleActive]}>Twi</Text>
                  <Text style={[styles.langCardSub, selectedLanguage === 'twi' && styles.langCardSubActive]}>Nya mmoa wɔ Twi mu</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.ctaSection}>
            <TouchableOpacity style={styles.startBtn} onPress={handleGetStarted} activeOpacity={0.9}>
              <Text style={styles.startBtnText}>Get Started</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.changeLater}>You can change this later in settings</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F8' },
  scrollContent: { flexGrow: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32, justifyContent: 'center' },

  heroCard: {
    backgroundColor: '#D32F2F',
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  heroGlow: {
    position: 'absolute',
    top: -38,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  heroBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  logoBox: {
    width: 78,
    height: 78,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  appName: { fontSize: 34, fontWeight: '800', color: '#FFF', letterSpacing: -0.5, marginBottom: 6 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.92)', lineHeight: 22, maxWidth: 280, marginBottom: 14 },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flag: { width: 40, height: 28, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  flagStripe: { flex: 1 },
  flagLabel: { fontSize: 14, fontWeight: '600', color: '#FFF' },

  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  featureText: { fontSize: 12, fontWeight: '700', color: '#333' },

  langSection: { width: '100%', gap: 10, marginBottom: 24 },
  chooseLangEn: { fontSize: 13, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 1.1, textAlign: 'center' },
  chooseLangTwi: { fontSize: 12, color: '#8A8A8A', textAlign: 'center', marginTop: -2 },
  langCards: { flexDirection: 'row', gap: 12, marginTop: 6 },
  langCard: {
    flex: 1,
    minHeight: 140,
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  langCardActive: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
    shadowColor: '#1F2937',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flagSmall: { width: 40, height: 28, borderRadius: 3, overflow: 'hidden', borderWidth: 1 },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langCardTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginTop: 12 },
  langCardTitleActive: { color: '#FFFFFF' },
  langCardSub: { fontSize: 13, color: '#555', lineHeight: 18, marginTop: 4 },
  langCardSubActive: { color: 'rgba(255,255,255,0.8)' },

  ctaSection: { width: '100%', gap: 10, alignItems: 'center' },
  startBtn: {
    width: '100%',
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#D32F2F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
  startBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  changeLater: { fontSize: 12, color: '#8A8A8A', textAlign: 'center' },
});
