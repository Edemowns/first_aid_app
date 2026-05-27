// services/api.js
// Backend API integration — FastAPI server
import { Platform } from 'react-native';


//export const BASE_URL = "http://172.20.10.12:8000";
export const BASE_URL ="https://first-aid-app-72im.onrender.com";



// ─────────────────────────────────────────────
// STAGE 1 — PROBE EMERGENCY
// ─────────────────────────────────────────────

export async function probeEmergency(
  description,
  language = 'en',
  imageBase64 = null,
  mediaType = 'image/jpeg'
) {

  console.log('Calling PROBE API');

  const controller = new AbortController();
  // Fast 4.5s timeout for emergency responsiveness (Ghana local connectivity fallback)
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {

    const payload = {
      description,
      language,
      image_base64: imageBase64,
      media_type: mediaType,
    };

    console.log('Probe payload:', {
      ...payload,
      image_base64: imageBase64 ? '[BASE64_IMAGE_PRESENT]' : null,
    });

    const response = await fetch(`${BASE_URL}/probe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    console.log('Probe response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Probe error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    console.log('Probe response:', data);

    return data;

  } catch (error) {

    console.error('probeEmergency error:', error.message);
    throw error;

  }
}


// ─────────────────────────────────────────────
// STAGE 2 — FINAL DIAGNOSIS
// ─────────────────────────────────────────────

export async function diagnoseEmergency(
  description,
  answers,
  language = 'en',
  imageBase64 = null,
  mediaType = 'image/jpeg'
) {

  console.log('Calling DIAGNOSIS API');

  try {

    const payload = {
      description,
      answers,
      language,
      image_base64: imageBase64,
      media_type: mediaType,
    };

    console.log('Diagnosis payload:', {
      ...payload,
      image_base64: imageBase64 ? '[BASE64_IMAGE_PRESENT]' : null,
    });

    const response = await fetch(`${BASE_URL}/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Diagnosis response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Diagnosis error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    console.log('Diagnosis response:', data);

    return data;

  } catch (error) {

    console.error('diagnoseEmergency error:', error.message);
    throw error;

  }
}


// ─────────────────────────────────────────────
// OLD ANALYZE FUNCTION (OPTIONAL)
// ─────────────────────────────────────────────

export async function analyzeEmergency(
  description,
  language = 'en'
) {

  console.log('Calling API:', `${BASE_URL}/analyze`);

  try {

    const response = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        language,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    return await response.json();

  } catch (error) {

    console.error('analyzeEmergency error:', error.message);
    throw error;

  }
}


// ─────────────────────────────────────────────
// VOICE TRANSCRIPTION
// ─────────────────────────────────────────────

function getAudioMimeType(uri) {

  const match = uri.match(/\.([a-zA-Z0-9]+)$/);
  const ext = match ? match[1].toLowerCase() : 'wav';

  switch (ext) {
    case 'm4a':
      return 'audio/m4a';

    case 'mp4':
      return 'audio/mp4';

    case 'aac':
      return 'audio/aac';

    case 'caf':
      return 'audio/x-caf';

    default:
      return 'audio/wav';
  }
}

export async function transcribeAudio(audioUri, language = 'en') {

  const formData = new FormData();

  if (Platform.OS === 'web') {
    // Web Flow: Fetch the local Blob from object URL and append it as a real File/Blob
    const blobResponse = await fetch(audioUri);
    const audioBlob = await blobResponse.blob();
    formData.append('audio', audioBlob, 'recording.wav');
  } else {
    // Native Flow: React Native specific multi-part file object
    const mimeType = getAudioMimeType(audioUri);
    const extension = mimeType.split('/').pop().replace('x-', '');

    formData.append('audio', {
      uri: audioUri,
      type: mimeType,
      name: `recording.${extension}`,
    });
  }

  const response = await fetch(
    `${BASE_URL}/transcribe?language=${language}`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ASR error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data?.transcript?.trim()) {
    const statusNote = data?.status ? ` (${data.status})` : '';
    throw new Error(`ASR returned empty transcript${statusNote}`);
  }

  return data.transcript;
}

export async function transcribeTwi(audioUri) {
  return transcribeAudio(audioUri, 'twi');
}


// ─────────────────────────────────────────────
// NEARBY FACILITIES
// ─────────────────────────────────────────────

export async function getNearbyFacilities(latitude, longitude) {

  try {

    const response = await fetch(
      `${BASE_URL}/nearby-facilities?lat=${latitude}&lng=${longitude}`
    );

    if (!response.ok) {
      throw new Error(`Location service error: ${response.status}`);
    }

    return await response.json();

  } catch (error) {

    console.error('getNearbyFacilities error:', error.message);
    throw error;

  }
}