// INTEGRATION GUIDE - How to use offline features in your app

/**
 * STEP 1: In your main screen (app/index.jsx), import the new functions:
 */

// At the top of app/index.jsx, add:
// import { diagnoseEmergencyWithFallback, probeEmergencyWithFallback } from '../services/api';
// import { useConnectivity } from '../services/connectivity';
// import ConnectivityBanner from '../components/ConnectivityBanner';


/**
 * STEP 2: Use the connectivity hook in your component:
 */

// Inside your component function:
// const { isOnline, loading: connectivityLoading } = useConnectivity();

// Now you can conditionally render UI:
// {!isOnline && <ConnectivityBanner language={language} />}


/**
 * STEP 3: Update your diagnosis flow to use fallback functions:
 */

// BEFORE (original):
// const result = await probeEmergency(description, language, imageBase64);

// AFTER (with offline fallback):
// const result = await probeEmergencyWithFallback(description, language, imageBase64);
// 
// This automatically:
// - Checks if offline first
// - Uses local diagnosis if offline
// - Falls back to local if API fails
// - Returns structured result in both cases


/**
 * STEP 4: Handle offline diagnosis results
 */

// The offline engine returns:
// {
//   condition: "near-drowning",           // Matched condition
//   severity: "critical",                 // critical/high/medium/low
//   call_immediately: true,               // boolean
//   steps: [...],                         // Array of action steps
//   warnings: [...],                      // Array of warnings
//   offline_mode: true,                   // Flag: THIS WAS LOCAL DIAGNOSIS
//   confidence: 2,                        // Keyword matches found
//   message: "Offline mode: Limited..."   // User message
// }

// In your results screen, check this flag:
// if (result.offline_mode) {
//   showBanner("Using offline diagnosis. Connect to internet for more accuracy.");
// }


/**
 * STEP 5: Show appropriate messaging
 */

// import { getOfflineFeaturesMessage } from '../services/offlineModels';

// When user is offline:
// const offlineInfo = getOfflineFeaturesMessage(language);
// Alert.alert(offlineInfo.title, offlineInfo.description);
// 
// This returns:
// {
//   title: "📱 Offline Mode Activated",
//   description: "You are currently offline. The following features are available:",
//   available: ["✅ Local first-aid recommendations", ...],
//   unavailable: ["❌ AI-powered diagnosis (requires internet)", ...],
//   suggestion: "Connect to the internet for more accurate diagnosis..."
// }


/**
 * COMPLETE EXAMPLE: Modified diagnosis flow
 */

async function handleAnalyzePress() {
  if (!description.trim()) {
    Alert.alert("Required", "Please describe the emergency");
    return;
  }

  setLoading(true);
  try {
    // This function handles both online and offline scenarios
    const probeResult = await probeEmergencyWithFallback(
      description,
      language,
      selectedImage || null
    );

    // Check if this was offline diagnosis
    if (probeResult.offline_mode) {
      Alert.alert(
        language === 'twi' ? 'Offline Mode' : 'Offline Mode',
        probeResult.message
      );
    }

    // Navigate to results with the diagnosis
    router.push({
      pathname: '/results',
      params: {
        probeData: JSON.stringify(probeResult),
        userDescription: description,
        language: language,
      },
    });

  } catch (error) {
    console.error("Diagnosis failed:", error);
    Alert.alert(
      "Error",
      "Could not analyze emergency. Please try again."
    );
  } finally {
    setLoading(false);
  }
}


/**
 * TESTING: How to test offline functionality
 */

// 1. Enable Airplane mode on your device
// 2. The app should:
//    - Show ConnectivityBanner at top
//    - Disable analyze button briefly
//    - Show "offline mode" dialog when you press analyze
// 3. Enter a symptom like "drowning"
// 4. You should get instant local diagnosis (no API call)
// 5. Result should have offline_mode: true

// 6. Turn off Airplane mode
// 7. The app should:
//    - Hide ConnectivityBanner
//    - Re-enable full features
//    - Use online diagnosis again

// 8. Kill the backend server
// 9. Try to analyze - should fallback to offline automatically
