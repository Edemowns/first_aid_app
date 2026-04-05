// services/api.js
// Backend API integration — calls your FastAPI server

export const BASE_URL = "http://172.20.10.12:8000";

/**
 * Analyze an emergency situation using the AI backend.
 * @param {string} description - User's description of the emergency
 * @param {string} language - 'en' or 'twi'
 * @returns {object} AI diagnosis result
 */
export async function analyzeEmergency(description, language = 'en') {
  console.log('Calling API:', `${BASE_URL}/analyze`, { description, language });
  
  try {
    const response = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, language }),
    });
    
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('Fetch error:', error.message);
    throw error;
  }
}

/**
 * Send Twi audio to the ASR backend for transcription.
 * @param {string} audioUri - Local URI of the recorded audio file
 * @returns {string} Transcribed text in Twi
 */
export async function transcribeTwi(audioUri) {
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    type: 'audio/wav',
    name: 'recording.wav',
  });

  const response = await fetch(`${BASE_URL}/transcribe-twi`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`ASR error: ${response.status}`);
  }

  const data = await response.json();
  return data.transcript;
}

/**
 * Get nearby medical facilities based on GPS coordinates.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Array} List of nearby facilities
 */
export async function getNearbyFacilities(latitude, longitude) {
  const response = await fetch(
    `${BASE_URL}/nearby-facilities?lat=${latitude}&lng=${longitude}`
  );

  if (!response.ok) {
    throw new Error(`Location service error: ${response.status}`);
  }

  return response.json();
}