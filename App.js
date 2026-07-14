import { useEffect } from 'react';
import { App as ExpoRouterApp } from 'expo-router/build/qualified-entry';

export default function App() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (!hash && window.location.pathname !== '/') {
        window.location.replace(`/#${window.location.pathname}${window.location.search}`);
      }
    }
  }, []);

  return <ExpoRouterApp />;
}
