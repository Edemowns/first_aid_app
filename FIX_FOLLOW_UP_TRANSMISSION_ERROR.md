// FIX FOR: Follow-up transmission failed error
// This guide helps fix the network error you reported

/**
 * PROBLEM YOU REPORTED:
 * 
 * LOG Diagnosis response status: 200
 * LOG Diagnosis response: {...diagnosis data...}
 * ERROR Follow-up transmission failed: [TypeError: Network request failed]
 * 
 * This happens in FollowUpScreen.jsx when trying to send follow-up messages
 */

/**
 * ROOT CAUSES:
 * 
 * 1. Network timeout (too short)
 * 2. Backend endpoint timing out
 * 3. Fetch abort without proper error handling
 * 4. No offline fallback for follow-ups
 */

/**
 * SOLUTION 1: Add offline follow-up support
 * 
 * Update app/results.jsx and FollowUpScreen.jsx to handle offline follow-ups
 */

// Add this function to services/api.js

export async function sendFollowUp(
  userMessage,
  previousDiagnosis,
  answers,
  language = 'en',
  imageBase64 = null,
  mediaType = 'image/jpeg'
) {
  console.log('Calling FOLLOW-UP API');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

  try {
    const payload = {
      description: previousDiagnosis?.description || '',
      answers: answers || [],
      previous_diagnosis: previousDiagnosis,
      follow_up_message: userMessage,
      language,
      image_base64: imageBase64,
      media_type: mediaType,
    };

    const response = await fetch(`${BASE_URL}/follow-up`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('Follow-up response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Follow-up error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Follow-up response:', data);
    return data;

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('sendFollowUp error:', error.message);
    throw error;
  }
}

// Add offline version

export async function sendFollowUpWithFallback(
  userMessage,
  previousDiagnosis,
  answers,
  language = 'en',
  imageBase64 = null,
  mediaType = 'image/jpeg'
) {
  const { isOnline } = getConnectivityState();

  // Offline mode: use local response
  if (isOnline === false) {
    console.log('📱 Offline mode: Follow-up limited');
    
    // Generate a simple offline follow-up response
    return {
      message: language === 'twi'
        ? 'Internet nkɔ. Wɔntumi mma wo pa ara asɛm. Please connect to internet.'
        : 'You are offline. Follow-ups require internet connection. Please reconnect.',
      updated_steps: previousDiagnosis?.steps || [],
      updated_warnings: previousDiagnosis?.warnings || [],
      call_immediately: previousDiagnosis?.call_immediately || false,
      offline_mode: true,
    };
  }

  // Try online follow-up
  try {
    return await sendFollowUp(
      userMessage,
      previousDiagnosis,
      answers,
      language,
      imageBase64,
      mediaType
    );
  } catch (error) {
    console.warn('⚠️ Follow-up failed, cannot fallback:', error.message);
    throw error; // Don't fallback for follow-ups, user needs internet
  }
}


/**
 * SOLUTION 2: Update FollowUpScreen.jsx to use the fallback function
 */

// In FollowUpScreen.jsx, update the handleSendFollowUp function:

// OLD:
/*
const response = await fetch(`${API_BASE_URL}/follow-up`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    description: ...,
    answers: ...,
    previous_diagnosis: ...,
    follow_up_message: userMsg,
    language,
    image_base64: selectedImage || null,
    media_type: 'image/jpeg',
  }),
});
*/

// NEW:
/*
import { sendFollowUpWithFallback } from '../services/api';
import { useConnectivity } from '../services/connectivity';

// In component:
const { isOnline } = useConnectivity();

// In handleSendFollowUp:
try {
  const response = await sendFollowUpWithFallback(
    userMsg,
    previousDiagnosis,
    answers,
    language,
    selectedImage || null,
    'image/jpeg'
  );
  
  if (response.offline_mode) {
    Alert.alert(
      language === 'twi' ? 'Offline Mode' : 'Offline Mode',
      response.message
    );
  }
  
  // Update diagnosis with response
  setDiagnosis(response);
  // ... rest of your code
} catch (error) {
  Alert.alert(
    'Follow-up Failed',
    isOnline 
      ? 'Network error. Please try again.'
      : 'You are offline. Please connect to internet for follow-ups.'
  );
}
*/


/**
 * SOLUTION 3: Increase timeouts for slow networks
 */

// In services/api.js, update the timeout for follow-up:

// Before:
// const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s too short

// After:
// const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s for follow-ups


/**
 * SOLUTION 4: Add error recovery for fetch failures
 */

// Add this helper function to services/api.js

export async function fetchWithRetry(
  url,
  options = {},
  maxRetries = 3,
  initialDelay = 1000
) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout || 20000
      );
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
      
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(`Fetch failed, retry ${attempt + 1}/${maxRetries} after ${delay}ms:`, error.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Use it:
// const response = await fetchWithRetry(`${BASE_URL}/follow-up`, {
//   method: 'POST',
//   body: JSON.stringify(payload),
//   timeout: 20000,
// });


/**
 * SOLUTION 5: Add logging to diagnose follow-up issues
 */

// Add this to FollowUpScreen.jsx to help debug:

const handleSendFollowUp = async () => {
  if (!followUpText.trim() || loading) return;

  const userMsg = followUpText.trim();
  setFollowUpText('');
  setLoading(true);

  try {
    console.group('📤 Follow-up Submission');
    console.log('Message:', userMsg);
    console.log('Diagnosis:', diagnosis);
    console.log('Timestamp:', new Date().toISOString());
    
    console.time('Follow-up API Call');
    const response = await sendFollowUpWithFallback(
      userMsg,
      diagnosis,
      answers,
      language,
      selectedImage || null,
      'image/jpeg'
    );
    console.timeEnd('Follow-up API Call');
    
    console.log('Response:', response);
    console.groupEnd();

    // Handle response
    if (response.offline_mode) {
      Alert.alert(
        language === 'twi' ? 'Offline Mode' : 'Offline Mode',
        response.message
      );
      setConversation([...conversation, { type: 'user', text: userMsg }]);
    } else {
      // Update diagnosis with AI response
      setDiagnosis({
        ...diagnosis,
        steps: response.updated_steps,
        warnings: response.updated_warnings,
        call_immediately: response.call_immediately,
      });
      
      // Add to conversation
      setConversation([
        ...conversation,
        { type: 'user', text: userMsg },
        { type: 'assistant', text: response.message || 'Diagnosis updated' },
      ]);
    }

  } catch (error) {
    console.error('❌ Follow-up error:', error);
    console.group('Error Details');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.groupEnd();
    
    Alert.alert(
      'Follow-up Failed',
      error.message || 'Could not send follow-up. Please try again.'
    );
    
    // Restore the text
    setFollowUpText(userMsg);
  } finally {
    setLoading(false);
  }
};


/**
 * TESTING THE FIX
 */

TEST 1: Normal online follow-up
✅ Complete initial diagnosis
✅ In follow-up screen, type a follow-up message
✅ Press send
✅ Should see updated diagnosis

TEST 2: Offline follow-up
✅ Enable Airplane Mode
✅ Try to send follow-up
✅ Should show "You are offline" message
✅ Conversation updates locally

TEST 3: Network failure recovery
✅ Kill backend server
✅ Send follow-up
✅ Should get error (not crash)
✅ User can retry


/**
 * IMPLEMENTATION CHECKLIST
 */

☐ Add sendFollowUp() function to services/api.js
☐ Add sendFollowUpWithFallback() function to services/api.js
☐ Update FollowUpScreen.jsx to use new function
☐ Add useConnectivity() hook to FollowUpScreen.jsx
☐ Add logging/debugging (optional)
☐ Increase timeout to 20s if still failing
☐ Test all scenarios (online, offline, network failure)
☐ Commit changes


/**
 * IF STILL FAILING
 */

1. Check backend logs:
   $ tail -f backend.log
   Look for errors on /follow-up endpoint

2. Check network throttling:
   iOS: Xcode → Device → Slow 3G
   Android: Chrome DevTools → Network → Slow 4G

3. Check request payload size:
   Follow-ups with large images might timeout
   Add: previousDiagnosis cleanup before sending

4. Check CORS headers (if web):
   Backend might not be sending correct CORS headers

5. Enable detailed logging:
   import { LogBox } from 'react-native';
   LogBox.ignoreLogs(['Network request failed']);
   // Then check console for more details
