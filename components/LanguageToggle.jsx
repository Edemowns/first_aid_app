// components/LanguageToggle.jsx
// English / Twi language switcher

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { colors, spacing, radius, typography } from '../constants/theme';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'twi', label: 'Twi', flag: '🇬🇭' },
];

export default function LanguageToggle({ language, onChange, compact = false }) {
  const slideAnim = useRef(new Animated.Value(language === 'en' ? 0 : 1)).current;

  const handleChange = (code) => {
    Animated.timing(slideAnim, {
      toValue: code === 'en' ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onChange(code);
  };

  const trackWidth = compact ? 160 : 200;
  const thumbWidth = trackWidth / 2 - 4;

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      {!compact && (
        <Text style={styles.label}>🌐 Language / Kasa</Text>
      )}

      <View style={[styles.track, { width: trackWidth }]}>
        {/* Sliding thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbWidth,
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [2, thumbWidth + 4],
                }),
              }],
            },
          ]}
        />

        {/* Buttons */}
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.option, { width: thumbWidth + 4 }]}
            onPress={() => handleChange(lang.code)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionFlag}>{lang.flag}</Text>
            <Text style={[
              styles.optionLabel,
              language === lang.code && styles.optionLabelActive,
            ]}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active language hint */}
      {!compact && (
        <Text style={styles.hint}>
          {language === 'twi'
            ? 'Wobɛnya mmoa wɔ Twi kasa mu'
            : 'You will receive guidance in English'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  wrapperCompact: {
    marginVertical: 0,
  },

  label: {
    fontSize: typography.small,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    padding: 2,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    zIndex: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    zIndex: 1,
    borderRadius: radius.full,
  },
  optionFlag: { fontSize: 14 },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionLabelActive: {
    color: colors.textOnPrimary,
  },

  hint: {
    fontSize: typography.tiny,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
