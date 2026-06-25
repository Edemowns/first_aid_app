import AsyncStorage from '@react-native-async-storage/async-storage';
import { OFFLINE_FIRST_AID, findOfflineFirstAid } from '../constants/firstaid';
import { classifySymptomsOnDevice } from './lightweightML';

export function diagnoseOffline(description, language = 'en') {
  let handbookEntry = findOfflineFirstAid(description);
  let modelSource = 'first_aid_handbook_rules';
  let modelConfidence = 1.0;

  if (!handbookEntry) {
    const mlResult = classifySymptomsOnDevice(description);
    if (mlResult.predictedClass && OFFLINE_FIRST_AID[mlResult.predictedClass]) {
      handbookEntry = OFFLINE_FIRST_AID[mlResult.predictedClass];
      modelSource = 'On-Device TF-IDF Cosine Similarity ML Model';
      modelConfidence = mlResult.confidence;
    }
  }

  if (handbookEntry) {
    return {
      condition: handbookEntry.condition,
      severity: handbookEntry.severity,
      call_immediately: handbookEntry.call_immediately,
      steps: handbookEntry.steps[language] || handbookEntry.steps['en'],
      warnings: handbookEntry.warnings[language] || handbookEntry.warnings['en'],
      offline_mode: true,
      source: modelSource,
      confidence: modelConfidence,
      message: language === 'twi'
        ? `Offline ML: ${handbookEntry.condition} (${Math.round(modelConfidence * 100)}% koraa)`
        : `Offline ML Model: Match found using on-device classifier (${Math.round(modelConfidence * 100)}% confidence)`,
    };
  }

  return {
    condition: language === 'twi' ? 'Mmoa a Ɛhia (General First Aid)' : 'General Symptom (First Aid)',
    severity: 'moderate',
    call_immediately: false,
    steps: language === 'twi' ? [
      'Frɛ ayaresabea anaa ambulance so ntɛm ara (193).',
      'Ma onipa no nyɛ komm na ɔda fam mmerɛw.',
      'Hwɛ sɛ ɔrehome anaa ɔnnhome.',
      'Sɛ ɔrehome a, dan no to ne nfe mu.'
    ] : [
      'Keep the injured person completely still and calm.',
      'Monitor their breathing and consciousness closely.',
      'If breathing but unresponsive, place them in the recovery position (on their side).',
      'Call emergency services (193) or contact a healthcare provider for professional support.'
    ],
    warnings: language === 'twi' ? [
      'Mnsoso onipa no gye sɛ asiane foforo bɛto no.'
    ] : [
      'Do not move the person unless they are in immediate danger.',
      'Do not give them water, food, or medication until they are fully conscious.'
    ],
    offline_mode: true,
    source: 'On-Device General First Aid Triage',
    message: language === 'twi'
      ? 'Offline: Yɛrekyerɛ wo mmoa nhyehyɛeɛ a yɛakora.'
      : 'Offline: Using preloaded medical emergency guidelines for general symptoms.',
  };
}

export async function getOfflineFirstAidTips(keyword) {
  try {
    const tips = await AsyncStorage.getItem('@first_aid_cache');
    if (!tips) return null;
    const tipsData = JSON.parse(tips);
    return tipsData[keyword] || null;
  } catch (error) {
    console.warn('Error retrieving offline first aid tips:', error);
    return null;
  }
}

export async function cacheFirstAidData(data) {
  try {
    await AsyncStorage.setItem('@first_aid_cache', JSON.stringify(data));
    console.log('✅ First-aid data cached for offline use');
  } catch (error) {
    console.error('Error caching first-aid data:', error);
  }
}

export function assessConfidence(description) {
  const wordCount = description.trim().split(/\s+/).length;
  if (wordCount < 3) return 0.3;
  if (wordCount < 10) return 0.6;
  return 0.8;
}

export function getOfflineFeaturesMessage(language = 'en') {
  const messages = {
    en: {
      title: 'Offline Mode Active',
      description: 'You are offline. You can still view standard first aid instructions, call emergency numbers, and find cached hospitals near you.',
      suggestion: 'Connect to the internet for advanced AI features.',
      available: [],
      unavailable: [],
    },
    twi: {
      title: 'Wunni Internet',
      description: 'Internet no nkɔ. Nanso wobɛtumi ahwɛ afotu mmoa ne nɔmba ahorow no.',
      suggestion: 'Sɛ wonya internet a, wobɛtumi anya advanced AI mmoa.',
      available: [],
      unavailable: [],
    },
  };

  return messages[language] || messages.en;
}
