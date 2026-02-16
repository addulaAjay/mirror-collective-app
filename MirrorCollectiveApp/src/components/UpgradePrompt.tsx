
import {useNavigation} from '@react-navigation/native';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  reason?: 'quota_exceeded' | 'quota_approaching' | 'trial_expired';
  quotaInfo?: {
    usage_gb: number;
    quota_gb: number;
  };
}

const {width} = Dimensions.get('window');

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  visible,
  onClose,
  reason = 'quota_exceeded',
  quotaInfo,
}) => {
  const navigation = useNavigation();

  const handleUpgrade = () => {
    onClose();
    navigation.navigate('StartFreeTrial' as never);
  };

  const getMessage = () => {
    switch (reason) {
      case 'quota_exceeded':
        return {
          title: 'Storage Limit Reached',
          message: `You've used ${quotaInfo?.usage_gb.toFixed(
            1,
          )} GB of your ${quotaInfo?.quota_gb} GB storage. Upgrade to add more space.`,
        };
      case 'quota_approaching':
        return {
          title: 'Running Low on Storage',
          message: `You've used ${(
            ((quotaInfo?.usage_gb || 0) / (quotaInfo?.quota_gb || 1)) *
            100
          ).toFixed(
            0,
          )}% of your storage. Consider adding more space.`,
        };
      case 'trial_expired':
        return {
          title: 'Trial Expired',
          message:
            'Your 14-day trial has ended. Subscribe to continue accessing your Echo Vault.',
        };
      default:
        return {
          title: 'Upgrade Your Plan',
          message: 'Get more features with Mirror Core.',
        };
    }
  };

  const {title, message} = getMessage();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={styles.upgradeButtonWrapper}
            onPress={handleUpgrade}
            activeOpacity={0.8}>
            <LinearGradient
              colors={[
                'rgba(253, 253, 249, 0.03)',
                'rgba(253, 253, 249, 0.20)',
              ]}
              start={{x: 0.5, y: 0}}
              end={{x: 0.5, y: 1}}
              style={styles.upgradeButton}>
              <Text style={styles.upgradeText}>UPGRADE NOW</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 28, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: width - 48,
    maxWidth: 360,
    backgroundColor: 'rgba(163, 179, 204, 0.05)',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#A3B3CC',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    color: '#F2E2B1',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#FDFDF9',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  upgradeButtonWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  upgradeButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#A3B3CC',
    alignItems: 'center',
  },
  upgradeText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: '#F2E2B1',
    fontWeight: '400',
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#A3B3CC',
  },
});

export default UpgradePrompt;
