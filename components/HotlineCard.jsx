// components/HotlineCard.jsx
// Emergency contact card with tap-to-call

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  Alert,
} from 'react-native';
import { colors, spacing, radius, shadow, typography } from '../constants/theme';
import { CATEGORIES } from '../constants/hotlines';

export default function HotlineCard({ hotline, language }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const catColor = CATEGORIES[hotline.category]?.color || colors.textSecondary;
  const name = language === 'twi' ? hotline.nameTwi : hotline.name;

  const handleCall = () => {
    Alert.alert(
      language === 'twi' ? `Frɛ ${name}?` : `Call ${name}?`,
      hotline.number,
      [
        { text: language === 'twi' ? 'Gyae' : 'Cancel', style: 'cancel' },
        {
          text: language === 'twi' ? 'Frɛ Seesei' : 'Call Now',
          onPress: () => Linking.openURL(`tel:${hotline.number}`),
        },
      ]
    );
  };

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={handleCall}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Left: icon + info */}
        <View style={styles.left}>
          <View style={[styles.iconWrap, { backgroundColor: catColor + '18' }]}>
            <Text style={styles.icon}>{hotline.icon}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.desc}>{hotline.description}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.catPill, { backgroundColor: catColor + '20' }]}>
                <Text style={[styles.catPillText, { color: catColor }]}>
                  {CATEGORIES[hotline.category]?.label}
                </Text>
              </View>
              <Text style={styles.availability}>⏰ {hotline.available}</Text>
            </View>
          </View>
        </View>

        {/* Right: call button */}
        <View style={[styles.callBtn, { backgroundColor: catColor }]}>
          <Text style={styles.callNumber}>{hotline.number}</Text>
          <Text style={styles.callLabel}>
            {language === 'twi' ? 'FRƐ' : 'CALL'}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.card,
  },

  left: {
    flexDirection: 'row',
    gap: spacing.sm,
    flex: 1,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: { fontSize: 26 },

  info: { flex: 1 },
  name: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  desc: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  catPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  catPillText: { fontSize: 11, fontWeight: '600' },
  availability: { fontSize: 11, color: colors.textMuted },

  callBtn: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minWidth: 72,
    marginLeft: spacing.sm,
    flexShrink: 0,
  },
  callNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  callLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.2,
    marginTop: 1,
  },
});
