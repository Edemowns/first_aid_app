import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCurrentUserProfile, getUserHistory, clearCurrentUserProfile } from '../services/history';

export default function HistoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    const profile = await getCurrentUserProfile();
    setUser(profile);
    const sessions = await getUserHistory();
    setHistory(sessions);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSignOut = async () => {
    await clearCurrentUserProfile();
    router.replace('/login');
  };

  const renderSession = ({ item }) => (
    <TouchableOpacity
      style={styles.sessionTile}
      onPress={() => router.push({ pathname: '/history/[id]', params: { id: item.id } })}
    >
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionCondition}>{item.condition}</Text>
        <Text style={styles.sessionSeverity}>{item.severity?.toUpperCase()}</Text>
      </View>
      <Text style={styles.sessionSnippet} numberOfLines={2}>
        {item.original_text || 'No description provided.'}
      </Text>
      <Text style={styles.sessionTime}>{new Date(item.updated_at).toLocaleString()}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
              <MaterialCommunityIcons name="arrow-left" size={18} color="#1A1A1A" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Saved Emergency Logs</Text>
            <Text style={styles.subtitle}>
              {user ? `Signed in as ${user.name}` : 'Sign in to keep your history organized.'}
            </Text>
          </View>
          {user && (
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1A73E8" style={{ marginTop: 32 }} />
        ) : history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recorded emergencies yet.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/')}>Start a New Assessment</TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={renderSession}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#616161',
    marginTop: 4,
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  signOutText: {
    color: '#424242',
    fontWeight: '700',
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
    gap: 14,
  },
  emptyText: {
    fontSize: 16,
    color: '#616161',
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#1A73E8',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  sessionTile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionCondition: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 10,
  },
  sessionSeverity: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D32F2F',
  },
  sessionSnippet: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 10,
    lineHeight: 20,
  },
  sessionTime: {
    fontSize: 12,
    color: '#757575',
  },
  listContent: {
    paddingBottom: 32,
  },
});