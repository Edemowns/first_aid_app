// components/FirstAidCard.jsx
// Individual first aid step card with expandable detail

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { colors, spacing, radius, shadow, typography } from '../constants/theme';

export default function FirstAidCard({ step, title, description, language, total }) {
  const [expanded, setExpanded] = useState(step === 1); // First step open by default
  const animHeight = useRef(new Animated.Value(step === 1 ? 1 : 0)).current;

  const toggle = () => {
    Animated.timing(animHeight, {
      toValue: expanded ? 0 : 1,
      duration: 220,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  // Progress color: red for first steps, orange mid, green for last
  const getStepColor = () => {
    const ratio = step / total;
    if (ratio <= 0.4) return colors.severityCritical;
    if (ratio <= 0.75) return colors.severityModerate;
    return colors.severityMild;
  };

  const stepColor = getStepColor();

  return (
    <TouchableOpacity
      style={[styles.card, expanded && styles.cardExpanded]}
      onPress={toggle}
      activeOpacity={0.85}
    >
      {/* Header row */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: stepColor }]}>
          <Text style={styles.badgeText}>{step}</Text>
        </View>
        <Text style={styles.title} numberOfLines={expanded ? undefined : 1}>
          {title}
        </Text>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {/* Expandable body */}
      <Animated.View
        style={{
          maxHeight: animHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 300],
          }),
          opacity: animHeight,
          overflow: 'hidden',
        }}
      >
        <View style={[styles.divider, { borderColor: stepColor + '40' }]} />
        <Text style={styles.description}>{description}</Text>

        {/* Step indicator */}
        <Text style={styles.stepIndicator}>
          {language === 'twi'
            ? `Ntease ${step} wɔ ${total} mu`
            : `Step ${step} of ${total}`}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    ...shadow.card,
  },
  cardExpanded: {
    borderLeftColor: colors.primary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  title: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: 10,
    color: colors.textMuted,
  },

  divider: {
    borderTopWidth: 1,
    marginVertical: spacing.sm,
  },
  description: {
    fontSize: typography.small,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  stepIndicator: {
    fontSize: typography.tiny,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'right',
  },
});
