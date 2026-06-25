import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

let globalConnectivityState = {
  isOnline: null,
  isInternetReachable: null,
  connectionType: null,
  lastChecked: null,
  listeners: [],
};

export async function initializeConnectivity() {
  try {
    const state = await NetInfo.fetch();
    updateConnectivityState(state);

    NetInfo.addEventListener((state) => {
      console.log('📡 Connectivity changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
      updateConnectivityState(state);
    });

    console.log('✅ Connectivity monitoring initialized');
  } catch (error) {
    console.error('❌ Failed to initialize connectivity:', error);
  }
}

function updateConnectivityState(state) {
  globalConnectivityState = {
    isOnline: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    connectionType: state.type,
    lastChecked: Date.now(),
    listeners: globalConnectivityState.listeners,
  };

  AsyncStorage.setItem(
    '@connectivity_state',
    JSON.stringify({
      isOnline: state.isConnected,
      lastChecked: Date.now(),
    })
  ).catch((err) => console.error('Failed to save connectivity state:', err));

  globalConnectivityState.listeners.forEach((callback) => {
    try {
      callback(globalConnectivityState);
    } catch (error) {
      console.error('Error in connectivity listener:', error);
    }
  });
}

export function useConnectivity() {
  const [connectivity, setConnectivity] = useState(() => ({
    isOnline: globalConnectivityState.isOnline,
    isInternetReachable: globalConnectivityState.isInternetReachable,
    connectionType: globalConnectivityState.connectionType,
    loading: globalConnectivityState.isOnline === null,
  }));

  useEffect(() => {
    if (globalConnectivityState.isOnline !== null) {
      setConnectivity({
        isOnline: globalConnectivityState.isOnline,
        isInternetReachable: globalConnectivityState.isInternetReachable,
        connectionType: globalConnectivityState.connectionType,
        loading: false,
      });
    }

    const listener = (state) => {
      setConnectivity({
        isOnline: state.isOnline,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.connectionType,
        loading: false,
      });
    };

    globalConnectivityState.listeners.push(listener);

    return () => {
      globalConnectivityState.listeners = globalConnectivityState.listeners.filter(
        (l) => l !== listener
      );
    };
  }, []);

  return connectivity;
}

export function getConnectivityState() {
  return {
    isOnline: globalConnectivityState.isOnline,
    isInternetReachable: globalConnectivityState.isInternetReachable,
    connectionType: globalConnectivityState.connectionType,
    lastChecked: globalConnectivityState.lastChecked,
  };
}

export async function checkConnectivity() {
  try {
    const state = await NetInfo.fetch();
    updateConnectivityState(state);
    return state.isConnected;
  } catch (error) {
    console.error('Error checking connectivity:', error);
    return false;
  }
}

export async function isApiReachable(apiUrl) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('API not reachable:', error.message);
    return false;
  }
}
