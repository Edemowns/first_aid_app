// app/nearby.jsx — Phase 4: Nearby Health Facilities
// Fixes: AsyncStorage caching, parallel fetching, better timeout handling

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Linking, Alert, ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentLocation, getAddressFromCoords } from '../services/location';
import { BASE_URL } from '../services/api';

const CACHE_KEY   = 'nearby_facilities_cache';
const CACHE_TTL   = 15 * 60 * 1000; // 15 minutes in ms
const FETCH_TIMEOUT = 20000;         // 20s — Ghana-bounded queries are much faster

// ── Fetch with manual timeout (AbortSignal.timeout not in RN) ─────────────────
async function fetchNearby(lat, lng) {
  const url = `${BASE_URL}/nearby-facilities?lat=${lat}&lng=${lng}&radius=3000&limit=8`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('timeout');
    throw err;
  }
}

// ── Cache helpers ─────────────────────────────────────────────────────────────
async function loadCache() {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp, lat, lng } = JSON.parse(raw);
    const age = Date.now() - timestamp;
    if (age > CACHE_TTL) return null;          // expired
    return { data, lat, lng, ageMs: age };
  } catch {
    return null;
  }
}

async function saveCache(lat, lng, data) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
      data, lat, lng, timestamp: Date.now(),
    }));
  } catch {}
}

async function clearCache() {
  try { await AsyncStorage.removeItem(CACHE_KEY); } catch {}
}

// distance between two coords in km
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, d2r = Math.PI / 180;
  const dlat = (lat2 - lat1) * d2r, dlng = (lng2 - lng1) * d2r;
  const a = Math.sin(dlat/2)**2 + Math.cos(lat1*d2r)*Math.cos(lat2*d2r)*Math.sin(dlng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const distLabel = (km) => km == null ? '' : km < 1 ? `${Math.round(km*1000)}m` : `${km.toFixed(1)}km`;
const freshnessLabel = (ms, lang) => {
  if (ms < 60000)        return lang === 'twi' ? 'Yɛyɛ no seesei ara' : 'Results are up to date';
  if (ms < 5 * 60000)   return lang === 'twi' ? 'Yɛkaa so kakra' : 'Showing recent results';
  if (ms < 15 * 60000)  return lang === 'twi' ? 'Twe fam na yɛsan hwɛ' : 'Pull down to find newer facilities';
  return lang === 'twi' ? 'Twe fam na yɛsan hwɛ' : 'Pull down to search again';
};

const TYPE_CONFIG = {
  'Hospital':       { color: '#D32F2F', bg: '#FFEBEE', icon: '🏥' },
  'Clinic':         { color: '#1565C0', bg: '#E3F2FD', icon: '🏨' },
  'Health Centre':  { color: '#2E7D32', bg: '#E8F5E9', icon: '🏪' },
  'Doctor / GP':    { color: '#6A1B9A', bg: '#F3E5F5', icon: '👨‍⚕️' },
  'Health Facility':{ color: '#00695C', bg: '#E0F2F1', icon: '➕' },
};
const typeConf = (t) => TYPE_CONFIG[t] || TYPE_CONFIG['Health Facility'];

// ── Facility Card ─────────────────────────────────────────────────────────────
function FacilityCard({ facility, language, rank }) {
  const tc       = typeConf(facility.type);
  const hasPhone = facility.phone && facility.phone !== '—';

  const call = () => {
    if (!hasPhone) {
      Alert.alert('No phone number', 'No number on OpenStreetMap. Use Directions to navigate.');
      return;
    }
    Alert.alert(
      `Call ${facility.name}?`, facility.phone,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => Linking.openURL(`tel:${facility.phone}`) },
      ]
    );
  };

  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.rankBox}><Text style={s.rankTxt}>{rank}</Text></View>
        <View style={[s.badge, { backgroundColor: tc.bg }]}>
          <Text style={[s.badgeTxt, { color: tc.color }]}>📍 {distLabel(facility.distance_km)}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: tc.bg }]}>
          <Text style={[s.badgeTxt, { color: tc.color }]}>{tc.icon} {facility.type}</Text>
        </View>
      </View>

      <Text style={s.cardName} numberOfLines={2}>{facility.name}</Text>
      {facility.address && facility.address !== 'Ghana' && (
        <Text style={s.cardAddr} numberOfLines={1}>📌 {facility.address}</Text>
      )}
      {hasPhone
        ? <Text style={s.cardPhone}>📞 {facility.phone}</Text>
        : <Text style={s.cardNoPhone}>No phone on record — use Directions</Text>
      }

      <View style={s.cardActions}>
        <TouchableOpacity style={[s.callBtn, !hasPhone && s.callBtnOff]} onPress={call} activeOpacity={0.85}>
          <Text style={s.callBtnTxt}>📞 {language === 'twi' ? 'Frɛ' : 'Call'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.dirBtn}
          onPress={() => Linking.openURL(facility.maps_url)}
          activeOpacity={0.85}
        >
          <Text style={s.dirBtnTxt}>🗺️ {language === 'twi' ? 'Kwan' : 'Directions'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function NearbyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [language,     setLanguage]   = useState('en');
  const [status,       setStatus]     = useState('loading'); // loading|denied|done|error
  const [bgFetching,   setBgFetching] = useState(false);    // background refresh
  const [refreshing,   setRefreshing] = useState(false);
  const [coords,       setCoords]     = useState(null);
  const [address,      setAddress]    = useState('Locating...');
  const [facilities,   setFacilities] = useState([]);
  const [meta,         setMeta]       = useState(null);
  const [cacheAge,     setCacheAge]   = useState(null);

  // ── Load: cache-first, then background refresh ──────────────────────────────
  const load = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
      await clearCache();
    }

    try {
      // 1. Get GPS (required)
      const loc = await getCurrentLocation();
      if (!loc) { setStatus('denied'); setRefreshing(false); return; }
      setCoords(loc);

      // 2. Reverse geocode — non-blocking, update whenever it's ready
      getAddressFromCoords(loc.latitude, loc.longitude).then(setAddress);

      // 3. Check cache
      if (!forceRefresh) {
        const cached = await loadCache();
        if (cached) {
          const moved = haversine(cached.lat, cached.lng, loc.latitude, loc.longitude);
          // Use cache if user hasn't moved more than 500m
          if (moved < 0.5) {
            setFacilities(cached.data.facilities || []);
            setMeta(cached.data);
            setCacheAge(cached.ageMs);
            setStatus('done');
            setRefreshing(false);

            // Silently refresh in background if cache is older than 5 min
            if (cached.ageMs > 5 * 60 * 1000) {
              setBgFetching(true);
              fetchNearby(loc.latitude, loc.longitude)
                .then(async (data) => {
                  await saveCache(loc.latitude, loc.longitude, data);
                  setFacilities(data.facilities || []);
                  setMeta(data);
                  setCacheAge(0);
                })
                .catch(() => {}) // silent fail — cache is still valid
                .finally(() => setBgFetching(false));
            }
            return;
          }
        }
      }

      // 4. Fresh fetch from backend
      setStatus('loading');
      const data = await fetchNearby(loc.latitude, loc.longitude);
      await saveCache(loc.latitude, loc.longitude, data);
      setFacilities(data.facilities || []);
      setMeta(data);
      setCacheAge(0);
      setStatus('done');

    } catch (err) {
      console.error('[Nearby]', err.message);
      // If we have cache, show it even on error
      const cached = await loadCache();
      if (cached) {
        setFacilities(cached.data.facilities || []);
        setMeta(cached.data);
        setCacheAge(cached.ageMs);
        setStatus('done');
      } else {
        setStatus(err.message === 'timeout' ? 'timeout' : 'error');
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  // ── Shared header ─────────────────────────────────────────────────────────
  const Header = () => (
    <View style={[s.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
        <Text style={s.backTxt}>←</Text>
      </TouchableOpacity>
      <Text style={s.headerTitle}>
        {language === 'twi' ? 'Yadeɛhaw a Wɔbɛn' : 'Nearby Health Facilities'}
      </Text>
      <View style={s.langRow}>
        <TouchableOpacity style={[s.lBtn, language==='en' && s.lBtnOn]} onPress={() => setLanguage('en')}>
          <Text style={[s.lTxt, language==='en' && s.lTxtOn]}>EN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.lBtn, language==='twi' && s.lBtnOn]} onPress={() => setLanguage('twi')}>
          <Text style={[s.lTxt, language==='twi' && s.lTxtOn]}>TWI</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Status screens ────────────────────────────────────────────────────────
  if (status === 'loading') return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#D32F2F" />
      <Header />
      <View style={[s.body, s.center]}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={s.stateTitle}>Finding health facilities near you...</Text>
        <Text style={s.stateSub}>Searching OpenStreetMap — please wait </Text>
      </View>
    </View>
  );

  if (status === 'denied') return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#D32F2F" />
      <Header />
      <View style={[s.body, s.center]}>
        <Text style={s.stateEmoji}>📍</Text>
        <Text style={s.stateTitle}>Location Access Needed</Text>
        <Text style={s.stateSub}>Allow location access so AIDA can find hospitals near you.</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => load()}>
          <Text style={s.primaryBtnTxt}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => Linking.openSettings()}>
          <Text style={s.secondaryBtnTxt}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (status === 'timeout' || status === 'error') return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#D32F2F" />
      <Header />
      <View style={[s.body, s.center]}>
        <Text style={s.stateEmoji}>{status === 'timeout' ? '⏱️' : '⚠️'}</Text>
        <Text style={s.stateTitle}>
          {status === 'timeout' ? 'OpenStreetMap is slow' : 'Could not load facilities'}
        </Text>
        <Text style={s.stateSub}>
          {status === 'timeout'
            ? 'The map server took too long. Your internet may be slow. Try again.'
            : `Ensure backend is running at:\n${BASE_URL}`
          }
        </Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => load(true)}>
          <Text style={s.primaryBtnTxt}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Results ───────────────────────────────────────────────────────────────
  const isLive = meta?.source === 'openstreetmap';

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#D32F2F" />
      <Header />

      <View style={s.body}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)}
              colors={['#D32F2F']} tintColor="#D32F2F" />
          }
        >
          {/* Location card */}
          <View style={s.locCard}>
            <View style={s.locRow}>
              <Text style={{ fontSize: 20 }}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.locLabel}>
                  {language === 'twi' ? 'Wo beaeɛ seesei' : 'Your current location'}
                </Text>
                <Text style={s.locVal} numberOfLines={2}>{address}</Text>
                {coords && (
                  <Text style={s.locCoords}>
                    {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => load(true)} style={s.reloadBtn}>
                <Text style={s.reloadIcon}>↻</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Source / cache banner */}
          <View style={isLive ? s.liveBanner : s.staticBanner}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={isLive ? s.liveTxt : s.staticTxt} numberOfLines={2}>
                {isLive
                  ? language === 'twi' ? 'Yɛhuu yadeɛhaw a wɔbɛn wo ho' : 'Showing health facilities near your location'
                  : language === 'twi' ? 'Yɛreyɛ adwuma — yadeɛhaw titiriw bi na yɛkyerɛ' : 'Showing major hospitals — tap refresh for local results'
                }
              </Text>
              {bgFetching && (
                <Text style={s.bgFetchTxt}>🔄 Checking for closer facilities...</Text>
              )}
            </View>
            {cacheAge !== null && cacheAge > 0 && (
              <Text style={s.cacheAgeTxt}>
                {freshnessLabel(cacheAge, language)}
              </Text>
            )}
          </View>

          {/* Count */}
          <Text style={s.countTxt}>
            {facilities.length === 0
              ? 'No facilities found'
              : `${facilities.length} health facilit${facilities.length !== 1 ? 'ies' : 'y'} found near you`
            }
          </Text>

          {/* Empty */}
          {facilities.length === 0 && (
            <View style={s.emptyBox}>
              <Text style={s.stateEmoji}>🏥</Text>
              <Text style={s.stateTitle}>No facilities found</Text>
              <Text style={s.stateSub}>
                OpenStreetMap may not have coverage here yet.{'\n'}
                Use Hotlines for emergency numbers.
              </Text>
              <TouchableOpacity style={s.primaryBtn} onPress={() => router.push('/hotlines')}>
                <Text style={s.primaryBtnTxt}>📞 Emergency Hotlines</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cards */}
          {facilities.map((f, i) => (
            <FacilityCard key={`${f.name}-${i}`} facility={f} language={language} rank={i+1} />
          ))}

          {/* Ambulance reminder */}
          {facilities.length > 0 && (
            <View style={s.emergBox}>
              <Text style={s.emergTxt}>
                🚑 Life-threatening emergency? Call{' '}
                <Text style={s.emergNum} onPress={() => Linking.openURL('tel:193')}>193</Text>
                {' '}(Ambulance) immediately
              </Text>
            </View>
          )}

        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#D32F2F' },
  body:   { flex: 1, backgroundColor: '#FAFAFA' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  scroll: { padding: 14, gap: 12 },

  header:   { backgroundColor: '#D32F2F', paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backTxt:  { fontSize: 22, color: '#FFF', fontWeight: '700', marginRight: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#FFF' },
  langRow:  { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 999, padding: 3 },
  lBtn:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  lBtnOn:   { backgroundColor: '#FFF' },
  lTxt:     { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  lTxtOn:   { color: '#D32F2F' },

  locCard:   { backgroundColor: '#FFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E0E0E0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  locRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  locLabel:  { fontSize: 11, color: '#9E9E9E', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  locVal:    { fontSize: 14, color: '#1A1A1A', fontWeight: '600', marginTop: 2 },
  locCoords: { fontSize: 11, color: '#9E9E9E', marginTop: 3 },
  reloadBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  reloadIcon:{ fontSize: 20, color: '#555' },

  liveBanner:   { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 10, borderLeftWidth: 3, borderLeftColor: '#2E7D32' },
  liveTxt:      { fontSize: 12, color: '#1B5E20', fontWeight: '500', flex: 1 },
  staticBanner: { backgroundColor: '#FFF3E0', borderRadius: 12, padding: 10, borderLeftWidth: 3, borderLeftColor: '#F57C00' },
  staticTxt:    { fontSize: 12, color: '#E65100', flex: 1 },
  cacheAgeTxt:  { fontSize: 11, color: '#555', marginTop: 4 },
  bgFetchTxt:   { fontSize: 11, color: '#1B5E20', marginTop: 4, fontStyle: 'italic' },

  countTxt: { fontSize: 13, fontWeight: '600', color: '#555', paddingHorizontal: 2 },
  emptyBox: { alignItems: 'center', padding: 24, gap: 12 },

  card:     { backgroundColor: '#FFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E0E0E0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, gap: 8 },
  cardTop:  { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rankBox:  { width: 28, height: 28, borderRadius: 8, backgroundColor: '#D32F2F', alignItems: 'center', justifyContent: 'center' },
  rankTxt:  { fontSize: 13, fontWeight: '800', color: '#FFF' },
  badge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeTxt: { fontSize: 11, fontWeight: '600' },

  cardName:    { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  cardAddr:    { fontSize: 12, color: '#555' },
  cardPhone:   { fontSize: 13, color: '#1565C0', fontWeight: '600' },
  cardNoPhone: { fontSize: 12, color: '#9E9E9E', fontStyle: 'italic' },

  cardActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  callBtn:     { flex: 1, minHeight: 44, backgroundColor: '#D32F2F', borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#D32F2F', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  callBtnOff:  { backgroundColor: '#BDBDBD', shadowOpacity: 0 },
  callBtnTxt:  { fontSize: 14, fontWeight: '700', color: '#FFF' },
  dirBtn:      { flex: 1, minHeight: 44, backgroundColor: '#FFF', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#00796B' },
  dirBtnTxt:   { fontSize: 14, fontWeight: '700', color: '#00796B' },

  stateEmoji:     { fontSize: 48 },
  stateTitle:     { fontSize: 18, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  stateSub:       { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 20 },
  primaryBtn:     { backgroundColor: '#D32F2F', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, marginTop: 4 },
  primaryBtnTxt:  { fontSize: 15, fontWeight: '700', color: '#FFF' },
  secondaryBtn:   { backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, borderWidth: 2, borderColor: '#9E9E9E' },
  secondaryBtnTxt:{ fontSize: 15, fontWeight: '700', color: '#555' },

  emergBox: { backgroundColor: '#FFEBEE', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FFCDD2' },
  emergTxt: { fontSize: 13, color: '#C62828', textAlign: 'center', lineHeight: 20 },
  emergNum: { fontWeight: '800', textDecorationLine: 'underline' },
});