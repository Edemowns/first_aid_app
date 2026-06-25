import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getCurrentUserProfile, setCurrentUserProfile, clearCurrentUserProfile } from '../services/history';

export default function LoginScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

  const handleSaveProfile = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid Gmail address.');
      return;
    }

    const profile = await setCurrentUserProfile({ name: name.trim() || trimmedEmail, email: trimmedEmail });
    if (profile) {
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
      <View style={styles.container}>
        <Text style={styles.title}>Sign in with Gmail</Text>
        <Text style={styles.subtitle}>
          Use your Gmail account to save your first aid logs and access them later.
        </Text>
        <TextInput
          style={styles.input}
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@gmail.com"
          onChangeText={setEmail}
          placeholderTextColor="#9E9E9E"
        />
        <TextInput
          style={styles.input}
          value={name}
          placeholder="Your name"
          onChangeText={setName}
          placeholderTextColor="#9E9E9E"
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSaveProfile}>
          <Text style={styles.primaryButtonText}>Save Profile</Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </TouchableOpacity>
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
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#1A73E8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#424242',
    fontWeight: '700',
    fontSize: 15,
  },
});