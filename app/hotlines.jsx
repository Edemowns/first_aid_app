// app/hotlines.jsx — Hotlines Screen converted from Figma Make to React Native

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, typography } from '../constants/theme';

const HOTLINES = [
  { id: 1, name: 'National Ambulance Service', nameTwi: 'Ayaresabea Kar',         description: 'Emergency medical response',    category: 'Medical',   phone: '193',           availability: '24/7', icon: '🚑', color: '#D32F2F' },
  { id: 2, name: 'Ghana Police Emergency',      nameTwi: 'Polisifo',               description: 'Police emergency response',     category: 'Police',    phone: '191',           availability: '24/7', icon: '🚔', color: '#1976D2' },
  { id: 3, name: 'Ghana Fire Service',          nameTwi: 'Ogyatɔfo',               description: 'Fire and rescue services',      category: 'Fire',      phone: '192',           availability: '24/7', icon: '🚒', color: '#F57C00' },
  { id: 4, name: 'Korle Bu Hospital',           nameTwi: 'Korle Bu Yadeɛhaw',      description: 'Major teaching hospital',       category: 'Hospital',  phone: '0302-674-191',  availability: '24/7', icon: '🏥', color: '#D32F2F' },
  { id: 5, name: '37 Military Hospital',        nameTwi: '37 Asrafohaw',           description: 'Emergency medical care',        category: 'Hospital',  phone: '0302-776-111',  availability: '24/7', icon: '🏥', color: '#D32F2F' },
  { id: 6, name: 'NADMO',                       nameTwi: 'Amanehunu Dwumadibea',   description: 'National Disaster Management',  category: 'Disaster',  phone: '0299-203-993',  availability: '24/7', icon: '⚠️', color: '#F57C00' },
  { id: 7, name: 'Ghana Red Cross',             nameTwi: 'Ghana Red Cross',        description: 'Humanitarian emergency aid',    category: 'Medical',   phone: '0302-662-877',  availability: '24/7', icon: '🏥', color: '#D32F2F' },
  { id: 8, name: 'Poison Control Center',       nameTwi: 'Dɛdɛw Tumi',            description: 'Poisoning emergencies',         category: 'Medical',   phone: '0302-665-401',  availability: '24/7', icon: '☠️', color: '#D32F2F' },
];

const CATEGORIES = ['All', 'Medical', 'Police', 'Fire', 'Hospital', 'Disaster'];

export default function HotlinesScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');
  const [language, setLanguage] = useState('en');

  const filtered = activeCategory === 'All' ? HOTLINES : HOTLINES.filter(h => h.category === activeCategory);

  const handleCall = (phone, name) => {
    Alert.alert(
      language === 'twi' ? `Frɛ ${name}?` : `Call ${name}?`,
      phone,
      [
        { text: language === 'twi' ? 'Gyae' : 'Cancel', style: 'cancel' },
        { text: language === 'twi' ? 'Frɛ Seesei' : 'Call Now', onPress: () => Linking.openURL(`tel:${phone}`) },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>

      
      
              

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {/* Back button row */}
              <View style={s.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                  <Text style={s.backButtonText}>← Back</Text>
                </TouchableOpacity>
              </View>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroFlagRow}>
            <View style={s.flag}>
              <View style={[s.stripe, { backgroundColor: '#006B3F' }]} />
              <View style={[s.stripe, { backgroundColor: '#FCD116' }]} />
              <View style={[s.stripe, { backgroundColor: '#CE1126' }]} />
            </View>
            <Text style={s.heroTitle}>{language === 'twi' ? 'Ghana Emergency Contacts' : 'Ghana Emergency Contacts'}</Text>
          </View>
          <Text style={s.heroSub}>{language === 'twi' ? 'Kari card biara sɛ wobɛfrɛ' : 'Tap any card to call immediately'}</Text>
        </View>

        {/* Language + filter row */}
        <View style={s.controlRow}>
          <View style={s.langToggle}>
            <TouchableOpacity style={[s.langOption, language === 'en' && s.langOptionActive]} onPress={() => setLanguage('en')}>
              <Text style={[s.langOptionText, language === 'en' && s.langOptionTextActive]}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.langOption, language === 'twi' && s.langOptionActive]} onPress={() => setLanguage('twi')}>
              <Text style={[s.langOptionText, language === 'twi' && s.langOptionTextActive]}>TWI</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.locationText}>📍 Ghana</Text>
        </View>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[s.chip, activeCategory === cat && s.chipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[s.chipText, activeCategory === cat && s.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Hotline cards */}
        {filtered.map(h => (
          <View key={h.id} style={s.card}>
            <View style={s.cardLeft}>
              <View style={[s.cardIconBox, { backgroundColor: h.color + '18' }]}>
                <Text style={{ fontSize: 22 }}>{h.icon}</Text>
              </View>
              <View style={s.cardInfo}>
                <Text style={s.cardName}>{language === 'twi' && h.nameTwi ? h.nameTwi : h.name}</Text>
                <Text style={s.cardDesc}>{h.description}</Text>
                <View style={s.cardMeta}>
                  <View style={[s.catBadge, { backgroundColor: h.color }]}>
                    <Text style={s.catBadgeText}>{h.category}</Text>
                  </View>
                  <Text style={s.availText}>• {h.availability}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[s.callBtn, { backgroundColor: h.color }]}
              onPress={() => handleCall(h.phone, language === 'twi' && h.nameTwi ? h.nameTwi : h.name)}
              activeOpacity={0.85}
            >
              <Text style={s.callBtnIcon}>📞</Text>
              <Text style={s.callBtnNumber}>{h.phone}</Text>
              <Text style={s.callBtnLabel}>{language === 'twi' ? 'FRƐ' : 'CALL'}</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { backgroundColor: '#FAFAFA', paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: typography.small,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 20, color: '#1A1A1A', fontWeight: '600' },
  headerIcon: { fontSize: 18 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  hero: { backgroundColor: '#D32F2F', borderRadius: 20, padding: 20, shadowColor: '#D32F2F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  heroFlagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  flag: { width: 32, height: 22, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  stripe: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  langToggle: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 3, borderWidth: 1, borderColor: '#E0E0E0' },
  langOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  langOptionActive: { backgroundColor: '#D32F2F' },
  langOptionText: { fontSize: 13, fontWeight: '700', color: '#555' },
  langOptionTextActive: { color: '#FFF' },
  locationText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chips: { gap: 8, paddingBottom: 2 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#E0E0E0' },
  chipActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#555' },
  chipTextActive: { color: '#FFF' },
  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E0E0E0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardLeft: { flexDirection: 'row', gap: 12, flex: 1, alignItems: 'flex-start' },
  cardIconBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  cardDesc: { fontSize: 13, color: '#555', marginBottom: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  availText: { fontSize: 11, color: '#9E9E9E', fontWeight: '500' },
  callBtn: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', minWidth: 80, marginLeft: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  callBtnIcon: { fontSize: 16, marginBottom: 2 },
  callBtnNumber: { fontSize: 14, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  callBtnLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: 1.2, fontWeight: '700', marginTop: 1 },
});