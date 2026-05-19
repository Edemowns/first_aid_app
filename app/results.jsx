// app/results.jsx
// Results Screen — AI Diagnosis + First Aid Steps

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow, typography } from '../constants/theme';

const SEVERITY_CONFIG = {
  critical: { label: 'CRITICAL — Call emergency services NOW', color: '#D32F2F', bg: '#FFEBEE', icon: '🚨' },
  moderate: { label: 'MODERATE — Seek medical attention soon',  color: '#F57C00', bg: '#FFF3E0', icon: '⚠️' },
  mild:     { label: 'MILD — Can treat at home with care',      color: '#388E3C', bg: '#E8F5E9', icon: '✅' },
};

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets   = useSafeAreaInsets();

  // Parse AI response data
  let rawData = null;
  try {
    rawData = params.data ? JSON.parse(params.data) : null;
  } catch {
    rawData = null;
  }

  // Transform the data to the format expected by the UI
  const transformData = (input) => {
    if (!input) return null;
    
    let formattedSteps = [];
    if (input.steps && Array.isArray(input.steps)) {
      formattedSteps = input.steps.map((step, index) => ({
        step: index + 1,
        title: `Step ${index + 1}`,
        description: step
      }));
    }
    
    let doNotList = [];
    if (input.warnings && Array.isArray(input.warnings)) {
      doNotList = input.warnings;
    }
    
    return {
      condition: input.condition || 'Medical Emergency',
      severity: input.severity || 'critical',
      steps: formattedSteps,
      doNot: doNotList,
      callNow: input.call_immediately || false,
    };
  };

  const data = transformData(rawData);

  // Fallback mock data if no data
  if (!data || data.steps.length === 0) {
    data.condition = 'Medical Emergency';
    data.severity = 'critical';
    data.steps = [
      { step: 1, title: 'Call Emergency Services', description: 'Dial 193 for ambulance immediately' },
      { step: 2, title: 'Stay Calm', description: 'Keep the person calm and still' },
      { step: 3, title: 'Monitor Vital Signs', description: 'Check breathing and consciousness' },
    ];
    data.doNot = ['Do not move the person unless in immediate danger'];
    data.callNow = true;
  }

  const severity = SEVERITY_CONFIG[data.severity] || SEVERITY_CONFIG.critical;

  // Share first aid instructions
  const shareInstructions = async () => {
    const stepsText = data.steps.map(s => `${s.step}. ${s.description}`).join('\n');
    const warningsText = data.doNot.map(w => `• ${w}`).join('\n');
    const message = `🚑 FIRST AID: ${data.condition}\n\nSTEPS:\n${stepsText}\n\n⚠️ DO NOT:\n${warningsText}\n\nFrom AIDA First Aid App`;
    
    try {
      await Share.share({ message });
    } catch (error) {
      Alert.alert('Error', 'Could not share instructions');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

        {/* Back button row */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={shareInstructions} style={styles.shareButton}>
            <Text style={styles.shareButtonText}>📤 Share</Text>
          </TouchableOpacity>
        </View>

        {/* Severity banner */}
        <View style={[styles.severityBanner, { backgroundColor: severity.bg, borderColor: severity.color }]}>
          <Text style={styles.severityIcon}>{severity.icon}</Text>
          <Text style={[styles.severityText, { color: severity.color }]}>{severity.label}</Text>
        </View>

        {/* Condition title */}
        <View style={styles.conditionCard}>
          <Text style={styles.conditionLabel}>Identified condition</Text>
          <Text style={styles.conditionTitle}>{data.condition}</Text>
          <Text style={styles.summary}>
            Based on your description, follow these first aid steps immediately.
          </Text>
        </View>

        {/* First aid steps */}
        <Text style={styles.sectionHeader}>📋 First Aid Steps</Text>
        {data.steps.map((s, index) => (
          <View key={index} style={styles.stepCard}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{s.step}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.description}</Text>
            </View>
          </View>
        ))}

        {/* Do NOT section */}
        {data.doNot && data.doNot.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>🚫 Do NOT</Text>
            <View style={styles.doNotCard}>
              {data.doNot.map((item, index) => (
                <Text key={index} style={styles.doNotItem}>• {item}</Text>
              ))}
            </View>
          </>
        )}

        {/* Emergency call CTA */}
        {data.callNow && (
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL('tel:193')}
          >
            <Text style={styles.callBtnText}>📞  Call Ambulance — 193</Text>
          </TouchableOpacity>
        )}

        {/* Police call button */}
        <TouchableOpacity
          style={styles.policeBtn}
          onPress={() => Linking.openURL('tel:191')}
        >
          <Text style={styles.policeBtnText}>👮  Call Police — 191</Text>
        </TouchableOpacity>

        {/* Hotlines button */}
        <TouchableOpacity
          style={styles.hotlinesBtn}
          onPress={() => router.push('/hotlines')}
        >
          <Text style={styles.hotlinesBtnText}>View All Emergency Hotlines →</Text>
        </TouchableOpacity>

        {/* New emergency button */}
        <TouchableOpacity
          style={styles.newEmergencyBtn}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.newEmergencyBtnText}>🔄  New Emergency</Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          This guidance is AI-generated for informational purposes only. It is not a substitute for professional medical advice. Always contact emergency services for serious situations.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
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
  shareButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareButtonText: {
    fontSize: typography.small,
    color: colors.textPrimary,
    fontWeight: '500',
  },

  severityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  severityIcon: { fontSize: 22 },
  severityText: { fontSize: 13, fontWeight: '700', flex: 1 },

  conditionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  conditionLabel: {
    fontSize: typography.tiny,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  conditionTitle: {
    fontSize: typography.h2,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  summary: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  sectionHeader: {
    fontSize: typography.h3,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },

  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    gap: spacing.md,
    ...shadow.card,
  },
  stepNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumText: { color: colors.textOnPrimary, fontWeight: 'bold', fontSize: 16 },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: typography.body, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  stepDesc: { fontSize: typography.small, color: colors.textSecondary, lineHeight: 20 },

  doNotCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#F57C00',
    marginBottom: spacing.md,
  },
  doNotItem: {
    fontSize: typography.small,
    color: '#5D3200',
    lineHeight: 22,
    marginBottom: 2,
  },

  callBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadow.strong,
  },
  callBtnText: { fontSize: typography.body, fontWeight: 'bold', color: colors.textOnPrimary },

  policeBtn: {
    backgroundColor: '#1565C0',
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadow.strong,
  },
  policeBtnText: { fontSize: typography.body, fontWeight: 'bold', color: colors.textOnPrimary },

  hotlinesBtn: {
    backgroundColor: colors.secondaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  hotlinesBtnText: { fontSize: typography.body, fontWeight: '600', color: colors.secondary },

  newEmergencyBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  newEmergencyBtnText: { fontSize: typography.body, fontWeight: '600', color: colors.textPrimary },

  disclaimer: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});