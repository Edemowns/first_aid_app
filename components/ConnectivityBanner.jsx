// components/ConnectivityBanner.jsx
// Shows user's connectivity status and available features

import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useConnectivity } from '../services/connectivity';
import { colors, spacing, typography } from '../constants/theme';

export default function ConnectivityBanner({ language = 'en' }) {
  const { isOnline, connectionType, loading } = useConnectivity();

  if (loading) {
    return null; // Don't show banner while initializing
  }

  // Only show banner when offline
  if (isOnline) {
    return null;
  }

  const messages = {
    en: {
      title: 'Offline Mode',
      subtitle: 'Limited features available',
      details: 'AI diagnosis requires internet connection',
    },
    twi: {
      title: 'Internet Nkɔ',
      subtitle: 'Akwan kakrankakran no hɔ',
      details: 'AI amannekaboɔ sɛ internet',
    },
  };

  const msg = messages[language] || messages.en;

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="wifi-off"
            size={20}
            color="#EF4444"
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{msg.title}</Text>
          <Text style={styles.subtitle}>{msg.subtitle}</Text>
          <Text style={styles.details}>{msg.details}</Text>
        </View>
      </View>
      <View style={styles.badge}>
        <MaterialCommunityIcons
          name="alert-circle"
          size={16}
          color="#FCA5A5"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconContainer: {
    paddingTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#991B1B',
    marginBottom: 2,
  },
  details: {
    fontSize: 11,
    color: '#7F1D1D',
    fontStyle: 'italic',
  },
  badge: {
    paddingLeft: spacing.sm,
  },
});
