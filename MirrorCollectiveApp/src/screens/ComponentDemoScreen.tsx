import { palette } from '@theme';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

// Import actual Figma-generated components
import BinaryCheckbox from '../../design/figma-components/generated/BinaryCheckbox';
import CapsuleButton from '../../design/figma-components/generated/CapsuleButton';
import ProgressIndicator from '../../design/figma-components/generated/ProgressIndicator';
import RoundedButton from '../../design/figma-components/generated/RoundedButton';
import StandardCheckbox from '../../design/figma-components/generated/StandardCheckbox';
import TextField from '../../design/figma-components/generated/TextField';
import ToggleSwitch from '../../design/figma-components/generated/ToggleSwitch';
import TriStateCheckbox from '../../design/figma-components/generated/TriStateCheckbox';

const ComponentDemoScreen: React.FC = () => {
  // State for interactive demos
  const [binaryChecked, setBinaryChecked] = useState<'Yes' | 'No'>('No');
  const [binaryState, setBinaryState] = useState<'Inactive' | 'Normal' | 'Active' | 'Highlight'>('Normal');
  
  const [triStateChecked, setTriStateChecked] = useState<'Unchecked' | 'Indetermined' | 'Checked'>('Unchecked');
  const [triStateState, setTriStateState] = useState<'Inactive' | 'Normal' | 'Active' | 'Highlight'>('Normal');
  
  const [standardChecked, setStandardChecked] = useState<'Unchecked' | 'Checked'>('Unchecked');
  const [standardState, setStandardState] = useState<'Inactive' | 'Normal' | 'Active' | 'Highlight'>('Normal');
  
  const [progress, setProgress] = useState<'0%' | '10%' | '20%' | '30%' | '40%' | '50%' | '60%' | '70%' | '80%' | '90%' | '100%'>('50%');
  
  const [textFieldSize, setTextFieldSize] = useState<'L' | 'S'>('L');
  const [textFieldState, setTextFieldState] = useState<'Active' | 'Inactive'>('Inactive');
  const [textFieldHelper, setTextFieldHelper] = useState<'Default' | 'No' | 'Yes'>('No');
  
  const [toggleState, setToggleState] = useState<'Off' | 'On'>('Off');
  
  const [capsuleSize, setCapsuleSize] = useState<'S' | 'M' | 'L'>('M');
  const [capsuleStyle, setCapsuleStyle] = useState<'Primary' | 'Secondary' | 'Tertiary'>('Primary');
  
  const [roundedSize, setRoundedSize] = useState<'L' | 'S'>('L');
  const [roundedStyle, setRoundedStyle] = useState<'Primary' | 'Secondary' | 'Link'>('Primary');

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>Figma Component Showcase</Text>
          <Text style={styles.subtitle}>Auto-generated components from Figma design system</Text>

          {/* BinaryCheckbox Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>BinaryCheckbox</Text>
            <Text style={styles.description}>Simple yes/no checkbox with state variants</Text>
            
            <View style={styles.demoContainer}>
              <BinaryCheckbox 
                checked={binaryChecked}
                state={binaryState}
                style={styles.component}
              />
              
              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Checked:</Text>
                <View style={styles.toggleGroup}>
                  {(['Yes', 'No'] as const).map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.toggleOption,
                        binaryChecked === value && styles.toggleOptionActive,
                      ]}
                      onPress={() => setBinaryChecked(value)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          binaryChecked === value && styles.toggleOptionTextActive,
                        ]}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>State:</Text>
                <View style={styles.toggleGroup}>
                  {(['Normal', 'Active', 'Highlight', 'Inactive'] as const).map((state) => (
                    <TouchableOpacity
                      key={state}
                      style={[
                        styles.toggleOption,
                        binaryState === state && styles.toggleOptionActive,
                      ]}
                      onPress={() => setBinaryState(state)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          binaryState === state && styles.toggleOptionTextActive,
                        ]}
                      >
                        {state}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* TriStateCheckbox Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TriStateCheckbox</Text>
            <Text style={styles.description}>Three-state checkbox: Unchecked/Indetermined/Checked</Text>
            
            <View style={styles.demoContainer}>
              <TriStateCheckbox 
                checked={triStateChecked}
                state={triStateState}
                style={styles.component}
              />
              
              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Checked:</Text>
                <View style={styles.toggleGroup}>
                  {(['Unchecked', 'Indetermined', 'Checked'] as const).map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.toggleOption,
                        triStateChecked === value && styles.toggleOptionActive,
                      ]}
                      onPress={() => setTriStateChecked(value)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          triStateChecked === value && styles.toggleOptionTextActive,
                        ]}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>State:</Text>
                <View style={styles.toggleGroup}>
                  {(['Normal', 'Active', 'Highlight', 'Inactive'] as const).map((state) => (
                    <TouchableOpacity
                      key={state}
                      style={[
                        styles.toggleOption,
                        triStateState === state && styles.toggleOptionActive,
                      ]}
                      onPress={() => setTriStateState(state)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          triStateState === state && styles.toggleOptionTextActive,
                        ]}
                      >
                        {state}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* StandardCheckbox Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>StandardCheckbox</Text>
            <Text style={styles.description}>Standard two-state checkbox</Text>
            
            <View style={styles.demoContainer}>
              <StandardCheckbox 
                checked={standardChecked}
                state={standardState}
                style={styles.component}
              />
              
              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Checked:</Text>
                <View style={styles.toggleGroup}>
                  {(['Unchecked', 'Checked'] as const).map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.toggleOption,
                        standardChecked === value && styles.toggleOptionActive,
                      ]}
                      onPress={() => setStandardChecked(value)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          standardChecked === value && styles.toggleOptionTextActive,
                        ]}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>State:</Text>
                <View style={styles.toggleGroup}>
                  {(['Normal', 'Active', 'Highlight', 'Inactive'] as const).map((state) => (
                    <TouchableOpacity
                      key={state}
                      style={[
                        styles.toggleOption,
                        standardState === state && styles.toggleOptionActive,
                      ]}
                      onPress={() => setStandardState(state)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          standardState === state && styles.toggleOptionTextActive,
                        ]}
                      >
                        {state}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* ProgressIndicator Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ProgressIndicator</Text>
            <Text style={styles.description}>Visual progress from 0% to 100%</Text>
            
            <View style={styles.demoContainer}>
              <ProgressIndicator 
                property1={progress}
                style={styles.component}
              />
              
              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Progress: {progress}</Text>
                <View style={styles.toggleGroup}>
                  {(['0%', '20%', '40%', '60%', '80%', '100%'] as const).map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.toggleOption,
                        progress === value && styles.toggleOptionActive,
                      ]}
                      onPress={() => setProgress(value)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          progress === value && styles.toggleOptionTextActive,
                        ]}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* TextField Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TextField</Text>
            <Text style={styles.description}>Text input field with size and state variants</Text>
            
            <View style={styles.demoContainer}>
              <TextField 
                fieldSize={textFieldSize}
                state={textFieldState}
                helperText={textFieldHelper}
                style={styles.component}
              />
              
              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Size:</Text>
                <View style={styles.toggleGroup}>
                  {(['L', 'S'] as const).map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.toggleOption,
                        textFieldSize === size && styles.toggleOptionActive,
                      ]}
                      onPress={() => setTextFieldSize(size)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          textFieldSize === size && styles.toggleOptionTextActive,
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>State:</Text>
                <View style={styles.toggleGroup}>
                  {(['Active', 'Inactive'] as const).map((state) => (
                    <TouchableOpacity
                      key={state}
                      style={[
                        styles.toggleOption,
                        textFieldState === state && styles.toggleOptionActive,
                      ]}
                      onPress={() => setTextFieldState(state)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          textFieldState === state && styles.toggleOptionTextActive,
                        ]}
                      >
                        {state}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Helper Text:</Text>
                <View style={styles.toggleGroup}>
                  {(['No', 'Yes', 'Default'] as const).map((helper) => (
                    <TouchableOpacity
                      key={helper}
                      style={[
                        styles.toggleOption,
                        textFieldHelper === helper && styles.toggleOptionActive,
                      ]}
                      onPress={() => setTextFieldHelper(helper)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          textFieldHelper === helper && styles.toggleOptionTextActive,
                        ]}
                      >
                        {helper}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* ToggleSwitch Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ToggleSwitch</Text>
            <Text style={styles.description}>Binary toggle control with Off/On states</Text>
            
            <View style={styles.demoContainer}>
              <ToggleSwitch 
                state={toggleState} 
                style={styles.component}
              />
              
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setToggleState(toggleState === 'Off' ? 'On' : 'Off')}
              >
                <Text style={styles.controlButtonText}>
                  Toggle: {toggleState}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CapsuleButton Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CapsuleButton</Text>
            <Text style={styles.description}>Full-width button with rounded corners (borderRadius: 24)</Text>
            
            <View style={styles.demoContainer}>
              <CapsuleButton 
                size={capsuleSize}
                styleVariant={capsuleStyle}
                state="Inactive"
                style={styles.component}
              />
              
              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Size:</Text>
                <View style={styles.toggleGroup}>
                  {(['S', 'M', 'L'] as const).map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.toggleOption,
                        capsuleSize === size && styles.toggleOptionActive,
                      ]}
                      onPress={() => setCapsuleSize(size)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          capsuleSize === size && styles.toggleOptionTextActive,
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Style:</Text>
                <View style={styles.toggleGroup}>
                  {(['Primary', 'Secondary', 'Tertiary'] as const).map((style) => (
                    <TouchableOpacity
                      key={style}
                      style={[
                        styles.toggleOption,
                        capsuleStyle === style && styles.toggleOptionActive,
                      ]}
                      onPress={() => setCapsuleStyle(style)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          capsuleStyle === style && styles.toggleOptionTextActive,
                        ]}
                      >
                        {style}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* RoundedButton Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RoundedButton</Text>
            <Text style={styles.description}>Inline button with rounded corners (borderRadius: 16)</Text>
            
            <View style={styles.demoContainer}>
              <RoundedButton 
                size={roundedSize}
                styleVariant={roundedStyle}
                state="Inactive"
                style={styles.component}
              />
              
              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Size:</Text>
                <View style={styles.toggleGroup}>
                  {(['L', 'S'] as const).map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.toggleOption,
                        roundedSize === size && styles.toggleOptionActive,
                      ]}
                      onPress={() => setRoundedSize(size)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          roundedSize === size && styles.toggleOptionTextActive,
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Style:</Text>
                <View style={styles.toggleGroup}>
                  {(['Primary', 'Secondary', 'Link'] as const).map((style) => (
                    <TouchableOpacity
                      key={style}
                      style={[
                        styles.toggleOption,
                        roundedStyle === style && styles.toggleOptionActive,
                      ]}
                      onPress={() => setRoundedStyle(style)}
                    >
                      <Text
                        style={[
                          styles.toggleOptionText,
                          roundedStyle === style && styles.toggleOptionTextActive,
                        ]}
                      >
                        {style}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Summary Section */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>✅ Figma Design System Integration</Text>
            <Text style={styles.summaryText}>
              All components directly generated from Figma with zero manual styling:
            </Text>
            <Text style={styles.summaryItem}>• BinaryCheckbox - Yes/No states</Text>
            <Text style={styles.summaryItem}>• TriStateCheckbox - Unchecked/Indetermined/Checked</Text>
            <Text style={styles.summaryItem}>• StandardCheckbox - Traditional checkbox</Text>
            <Text style={styles.summaryItem}>• ProgressIndicator - 0-100% visual progress</Text>
            <Text style={styles.summaryItem}>• TextField - Multi-variant input field</Text>
            <Text style={styles.summaryItem}>• ToggleSwitch - Off/On binary toggle</Text>
            <Text style={styles.summaryItem}>• CapsuleButton - Full-width styled button</Text>
            <Text style={styles.summaryItem}>• RoundedButton - Inline styled button</Text>
            <Text style={[styles.summaryText, { marginTop: 12 }]}>
              Generated: {new Date().toLocaleDateString()}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ComponentDemoScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  bgImage: {
    opacity: 0.2,
  },
  safe: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: palette.gold.DEFAULT,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: palette.navy.light,
    marginBottom: 32,
    textAlign: 'center',
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.gold.DEFAULT,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: palette.navy.light,
    marginBottom: 16,
    lineHeight: 20,
  },
  demoContainer: {
    backgroundColor: palette.navy.deep,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.navy.border,
  },
  component: {
    marginBottom: 16,
  },
  controlButton: {
    backgroundColor: palette.navy.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.gold.DEFAULT,
  },
  controlGroup: {
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 12,
    color: palette.navy.light,
    marginBottom: 8,
    fontWeight: '600',
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: palette.navy.DEFAULT,
    borderWidth: 1,
    borderColor: palette.navy.border,
    alignItems: 'center',
  },
  toggleOptionActive: {
    backgroundColor: palette.gold.DEFAULT,
    borderColor: palette.gold.DEFAULT,
  },
  toggleOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.navy.light,
  },
  toggleOptionTextActive: {
    color: palette.navy.deep,
  },
  summarySection: {
    backgroundColor: palette.navy.deep,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: palette.gold.DEFAULT,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.gold.DEFAULT,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: palette.navy.light,
    marginBottom: 12,
    lineHeight: 20,
  },
  summaryItem: {
    fontSize: 14,
    color: palette.navy.light,
    marginLeft: 8,
    lineHeight: 22,
  },
});
