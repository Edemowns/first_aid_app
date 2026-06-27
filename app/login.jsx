import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCurrentUserProfile, setCurrentUserProfile, clearCurrentUserProfile } from '../services/history';

export default function LoginScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUserProfile().then((profile) => {
      if (profile) {
        setUser(profile);
        setName(profile.name || '');
        setEmail(profile.email || '');
      }
    });
  }, []);

  const handleAuthenticate = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!trimmedPassword || trimmedPassword.length < 6) {
      Alert.alert('Weak Password', 'Please enter a password with at least 6 characters.');
      return;
    }

    const existingProfile = await getCurrentUserProfile();
    const isExistingUser = existingProfile?.email?.toLowerCase() === trimmedEmail;

    if (isExistingUser && existingProfile.password !== trimmedPassword) {
      Alert.alert('Incorrect Password', 'The password you entered does not match this account.');
      return;
    }

    const profile = await setCurrentUserProfile({
      name: name.trim() || trimmedEmail,
      email: trimmedEmail,
      password: trimmedPassword,
    });

    if (profile) {
      setUser(profile);
      Alert.alert(isExistingUser ? 'Signed In' : 'Account Created', 'You are now signed in.');
      router.replace('/');
    }
  };

  const handleLogout = async () => {
    await clearCurrentUserProfile();
    setUser(null);
    setName('');
    setEmail('');
    Alert.alert('Signed out', 'You are now signed out of the current profile.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
            <MaterialCommunityIcons name="arrow-left" size={18} color="#1A1A1A" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>SECURE ACCESS</Text>
            </View>
            <View style={styles.heroIconBox}>
              <MaterialCommunityIcons name="account-lock" size={30} color="#FFF" />
            </View>
            <Text style={styles.title}>Sign in or create an account</Text>
            <Text style={styles.subtitle}>
              Use your email and a password to save your first aid logs and access them later.
            </Text>
          </View>

          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              value={name}
              placeholder="Your name"
              onChangeText={setName}
              placeholderTextColor="#9E9E9E"
            />
            <TextInput
              style={styles.input}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
              onChangeText={setEmail}
              placeholderTextColor="#9E9E9E"
            />
            <TextInput
              style={styles.input}
              value={password}
              secureTextEntry
              placeholder="Password"
              onChangeText={setPassword}
              placeholderTextColor="#9E9E9E"
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleAuthenticate}>
              <Text style={styles.primaryButtonText}>{user ? 'Sign In' : 'Continue'}</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
            </TouchableOpacity>

            {user && (
              <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
                <Text style={styles.secondaryButtonText}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  heroCard: {
    backgroundColor: '#D32F2F',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 8,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  heroBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  heroIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#ECECEC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: '#D32F2F',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#424242',
    fontWeight: '700',
    fontSize: 15,
  },
});