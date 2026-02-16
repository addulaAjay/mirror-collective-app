

import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React from 'react';
import {Text, StyleSheet, TouchableOpacity} from 'react-native';

import {useSubscription} from '@/context/SubscriptionContext';

const TrialCountdown: React.FC = () => {
  const {isInTrial, trialDaysRemaining} = useSubscription();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  if (!isInTrial || trialDaysRemaining <= 0) {
    return null;
  }

  // Determine urgency level
  const getUrgencyLevel = () => {
    if (trialDaysRemaining <= 3) return 'high';
    if (trialDaysRemaining <= 7) return 'medium';
    return 'low';
  };

  const urgency = getUrgencyLevel();

  const handlePress = () => {
    navigation.navigate('StartFreeTrial' as never);
  };

  return (
    <TouchableOpacity
      style={[styles.container, styles[`urgency_${urgency}`]]}
      onPress={handlePress}
      activeOpacity={0.8}>
      <Text style={styles.text}>
        {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left in
        trial
      </Text>
      <Text style={styles.subtext}>Tap to subscribe</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 12,
    marginHorizontal: 16,
    borderWidth: 1,
  },
  urgency_low: {
    backgroundColor: 'rgba(242, 226, 177, 0.1)',
    borderColor: 'rgba(242, 226, 177, 0.3)',
  },
  urgency_medium: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderColor: 'rgba(255, 193, 7, 0.4)',
  },
  urgency_high: {
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
    borderColor: 'rgba(255, 87, 34, 0.5)',
  },
  text: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#F2E2B1',
    fontWeight: '600',
    marginBottom: 2,
  },
  subtext: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#A3B3CC',
    fontWeight: '400',
  },
});

export default TrialCountdown;
