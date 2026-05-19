// components/EmergencyTimer.jsx
// Shows countdown timer for critical emergency situations

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function EmergencyTimer({
  severity,     // 'critical' | 'moderate' | 'mild'
  language,     // 'en' | 'twi'
  onTimeout,    // () => void - called when timer reaches 0
}) {
  const [timeLeft, setTimeLeft] = useState(getInitialTime(severity));
  const [isRunning, setIsRunning] = useState(true);

  function getInitialTime(severity) {
    switch (severity) {
      case 'critical': return 120; // 2 minutes
      case 'moderate': return 300; // 5 minutes
      default: return 600; // 10 minutes for mild
    }
  }

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onTimeout]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUrgencyColor = () => {
    if (timeLeft <= 30) return '#D32F2F'; // Red - very urgent
    if (timeLeft <= 60) return '#FF6F00'; // Orange - urgent
    return '#2E7D32'; // Green - normal
  };

  const getUrgencyIcon = () => {
    if (timeLeft <= 30) return '🚨';
    if (timeLeft <= 60) return '⚠️';
    return '⏱️';
  };

  if (!isRunning || timeLeft <= 0) return null;

  return (
    <View style={[s.container, { borderLeftColor: getUrgencyColor() }]}>
      <Text style={s.icon}>{getUrgencyIcon()}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>
          {language === 'twi' ? 'Emergency Timer' : 'Emergency Timer'}
        </Text>
        <Text style={s.message}>
          {severity === 'critical' 
            ? (language === 'twi' 
                ? 'Frɛ ambulance ansa na bere yi awiei!' 
                : 'Call ambulance before timer ends!')
            : (language === 'twi'
                ? 'Hwɛ yiye na woanya mmoa ntɛm'
                : 'Monitor closely and seek help if needed')
          }
        </Text>
        <Text style={[s.timer, { color: getUrgencyColor() }]}>
          {formatTime(timeLeft)}
        </Text>
      </View>
      <TouchableOpacity 
        style={s.stopBtn}
        onPress={() => setIsRunning(false)}
      >
        <Text style={s.stopText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3E0',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderLeftWidth: 4,
    marginBottom: 10,
  },
  icon: { fontSize: 24 },
  title: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#E65100',
    marginBottom: 4 
  },
  message: { 
    fontSize: 13, 
    color: '#BF360C', 
    lineHeight: 18,
    marginBottom: 6 
  },
  timer: { 
    fontSize: 20, 
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  stopBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopText: { 
    fontSize: 16, 
    color: '#666',
    fontWeight: 'bold' 
  },
});