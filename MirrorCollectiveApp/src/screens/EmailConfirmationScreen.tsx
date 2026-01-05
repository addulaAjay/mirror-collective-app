import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import type { RootStackParamList } from '@types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EmailConfirmation'>;
}

const EmailConfirmationScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  
  const handleResend = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'EnterMirror' }],
    });
  };

  return (
    <BackgroundWrapper style={styles.container}>
      <LogoHeader />

      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.emailConfirmation.title')}</Text>
        <Text style={styles.bodyText}>
          {t('auth.emailConfirmation.body')}
        </Text>
        <Text style={styles.helperText}>{t('auth.emailConfirmation.helper')}</Text>

        <TouchableOpacity testID="resend-button" style={styles.button} onPress={handleResend} activeOpacity={0.85}>
          <Text style={styles.buttonText}>{t('auth.emailConfirmation.resendButton')}</Text>
        </TouchableOpacity>
      </View>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 40,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 353,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    lineHeight: 32,
    color: '#F2E2B1',
    textAlign: 'center',
  },
  bodyText: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '300',
    lineHeight: 24,
    color: '#FDFDF9',
    textAlign: 'center',
  },
  helperText: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '300',
    lineHeight: 20,
    color: '#FDFDF9',
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A3B3CC',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(253, 253, 249, 0.05)',
  },
  buttonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 22,
    lineHeight: 28,
    color: '#F2E2B1',
  },
});

export default EmailConfirmationScreen;
