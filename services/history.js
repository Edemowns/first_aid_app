import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_PROFILE_KEY = '@aida_user_profile';
const HISTORY_PREFIX = '@aida_history_';

const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return 'anonymous';
  return email.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
};

const getHistoryKey = (email) => `${HISTORY_PREFIX}${normalizeEmail(email || 'anonymous')}`;

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

export async function getCurrentUserProfile() {
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('getCurrentUserProfile error:', error);
    return null;
  }
}

export async function setCurrentUserProfile(profile) {
  try {
    const normalized = {
      provider: 'gmail',
      name: profile?.name || profile?.email || 'Anonymous',
      email: profile?.email?.trim().toLowerCase() || null,
      lastLogin: Date.now(),
    };
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch (error) {
    console.error('setCurrentUserProfile error:', error);
    return null;
  }
}

export async function clearCurrentUserProfile() {
  try {
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
  } catch (error) {
    console.error('clearCurrentUserProfile error:', error);
  }
}

export async function getUserHistory() {
  try {
    const user = await getCurrentUserProfile();
    const key = getHistoryKey(user?.email);
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('getUserHistory error:', error);
    return [];
  }
}

export async function getHistorySessionById(id) {
  try {
    const sessions = await getUserHistory();
    return sessions.find((item) => item.id === id) || null;
  } catch (error) {
    console.error('getHistorySessionById error:', error);
    return null;
  }
}

export async function saveOrUpdateHistorySession(session) {
  try {
    const user = await getCurrentUserProfile();
    const key = getHistoryKey(user?.email);
    const current = await getUserHistory();
    const normalizedSession = {
      id: session.id || generateSessionId(),
      created_at: session.created_at || Date.now(),
      updated_at: Date.now(),
      condition: session.condition || 'Unknown condition',
      severity: session.severity || 'unknown',
      language: session.language || 'en',
      original_text: session.original_text || '',
      source: session.source || 'unknown',
      steps: session.steps || [],
      warnings: session.warnings || [],
      call_immediately: session.call_immediately || false,
      chat_feed: session.chat_feed || [],
      notes: session.notes || '',
    };

    const existingIndex = current.findIndex((item) => item.id === normalizedSession.id);
    if (existingIndex > -1) {
      current[existingIndex] = normalizedSession;
    } else {
      current.unshift(normalizedSession);
    }

    // Keep the latest 30 records only to avoid local storage bloat
    const trimmed = current.slice(0, 30);
    await AsyncStorage.setItem(key, JSON.stringify(trimmed));
    return normalizedSession;
  } catch (error) {
    console.error('saveOrUpdateHistorySession error:', error);
    return null;
  }
}

export async function clearUserHistory() {
  try {
    const user = await getCurrentUserProfile();
    const key = getHistoryKey(user?.email);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('clearUserHistory error:', error);
  }
}
