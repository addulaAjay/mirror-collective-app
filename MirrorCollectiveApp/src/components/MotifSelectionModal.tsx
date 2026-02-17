
import { BlurView } from '@react-native-community/blur';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { SvgXml } from 'react-native-svg';

import { CLOSE_ICON_XML, MOTIF_ICONS } from '../assets/motifs/MotifAssets';

interface MotifSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (motifId: string) => void;
}

const LIGHT_GOLD = '#f2e2b1';
const BLUE_GREY = '#a3b3cc';

const MotifSelectionModal: React.FC<MotifSelectionModalProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const renderItem = ({ item }: { item: { id: string; xml: string } }) => (
    <TouchableOpacity
      style={styles.motifItem}
      onPress={() => onSelect(item.id)}
    >
      <View style={styles.motifInner}>
        <SvgXml xml={item.xml} width="100%" height="100%" />
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={10}
          reducedTransparencyFallbackColor="rgba(7,9,14,0.3)"
        />
        
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <View style={styles.closeIcon}>
              <SvgXml xml={CLOSE_ICON_XML} width="12" height="12" />
            </View>
          </TouchableOpacity>

          <Text style={styles.title}>
            Choose an icon to represent your recipient
          </Text>

          <FlatList
            data={MOTIF_ICONS}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
          />

          <Text style={styles.footerText}>
            This icon will be displayed in your Echo Library along with your Echo.
            One will be automatically assigned to them if you do not choose.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(7,9,14,0.3)', 
  },
  content: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: 'rgba(253,253,249,0.05)',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: BLUE_GREY,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#e5d6b0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  closeIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: LIGHT_GOLD,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    lineHeight: 32,
  },
  grid: {
    width: '100%',
    paddingVertical: 10,
  },
  row: {
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  motifItem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(197,158,95,0.05)',
    borderWidth: 0.75,
    borderColor: LIGHT_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  motifInner: {
    width: 48,
    height: 48,
  },
  footerText: {
    marginTop: 24,
    fontSize: 14,
    color: '#fdfdf9', // Offwhite
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: 'System', 
      android: 'sans-serif',
    }),
  },
});

export default MotifSelectionModal;
