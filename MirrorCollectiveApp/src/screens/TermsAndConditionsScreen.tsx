import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';
import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Image,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TermsAndConditions'>;

// Use window (usable viewport) instead of screen (includes status/nav bars)
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DESIGN_WIDTH = 393;
const DESIGN_HEIGHT = 852;

const outerContainerPaddingHorizontal = Math.max(24, (24 * screenWidth) / DESIGN_WIDTH);
const outerContainerPaddingBottom = Math.max(53, (53 * screenHeight) / DESIGN_HEIGHT);

// Reserve vertical space for the absolutely-positioned LogoHeader
const contentStartY = Math.max(120, (120 * screenHeight) / DESIGN_HEIGHT);

const outerBoxWidth = (345 * screenWidth) / DESIGN_WIDTH;
const outerBoxGap = (40 * screenHeight) / DESIGN_HEIGHT;
const innerBoxGap = (24 * screenHeight) / DESIGN_HEIGHT;

const titleLineHeight = Math.min(screenWidth * 0.094, 36);
const titleHeight = titleLineHeight * 2;
const checkboxRowHeight = 24;
const continueButtonHeight = 12 * 2 + 22;

const cardMaxWidth = 313;
const cardWidth = Math.min(cardMaxWidth, outerBoxWidth);
const innerBoxSidePadding = Math.max(0, (outerBoxWidth - cardWidth) / 2);

const TermsAndConditionsScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const [agreed, setAgreed] = useState(false);

    const cardGradient = useMemo(
        () => ['rgba(255, 255, 255, 0.05)', 'rgba(153, 153, 153, 0.05)'],
        [],
    );

    return (
        <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
            <SafeAreaView style={styles.safe}>
                <View style={styles.outerBoxContainer}>
                    <LogoHeader />

                    <View style={styles.outerBox}>
                        <View style={styles.headerRow}>
                            <TouchableOpacity
                                accessibilityRole="button"
                                onPress={() => navigation.goBack()}
                                style={styles.backButton}
                            >
                                <Image
                                    source={require('../assets/back-arrow.png')}
                                    style={styles.backArrow}
                                    accessibilityIgnoresInvertColors
                                />
                            </TouchableOpacity>

                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>TERMS AND{`\n`}CONDITIONS</Text>
                            </View>
                        </View>

                        <View style={styles.innerBox}>
                            <View style={styles.cardWrapper}>
                                <LinearGradient
                                    colors={cardGradient}
                                    start={{ x: 0.5, y: 0 }}
                                    end={{ x: 0.5, y: 1 }}
                                    style={styles.cardGradient}
                                    pointerEvents="none"
                                />

                                <ScrollView
                                    style={styles.cardScroll}
                                    contentContainerStyle={styles.cardContent}
                                    showsVerticalScrollIndicator={false}
                                >
                                    <Text style={styles.cardHeading}>Before You Begin</Text>

                                    <Text style={styles.cardEmphasis}>Welcome to Mirror.</Text>
                                    <Text style={styles.cardBody}>
                                        Mirror is designed for reflection, self-inquiry, and personal insight. Before
                                        continuing, please read the following carefully.
                                    </Text>

                                    <Text style={styles.cardHeading}>What Mirror Is</Text>
                                    <Text style={styles.cardBody}>
                                        Mirror uses artificial intelligence to generate symbolic, reflective responses based on
                                        the language you share. These reflections are intended to support self-awareness and
                                        contemplation.
                                    </Text>
                                    <Text style={styles.cardBody}>
                                        Mirror does not provide medical, mental health, legal, or other professional advice and
                                        should not be used as a substitute for professional care or guidance.
                                    </Text>

                                    <Text style={styles.cardHeading}>Important Boundaries</Text>
                                    <Text style={styles.cardBody}>• Mirror is not a doctor, therapist, counselor, clergy member, or authority.</Text>
                                    <Text style={styles.cardBody}>• Mirror does not diagnose, treat, or prevent any condition.</Text>
                                    <Text style={styles.cardBody}>
                                        • Mirror does not speak for God, Source, or any higher power. Symbolic or poetic language is
                                        metaphorical.
                                    </Text>
                                    <Text style={styles.cardBody}>
                                        • Responses are generated by AI systems and are not conscious, sentient, or aware.
                                    </Text>
                                    <Text style={styles.cardBody}>
                                        • You are responsible for how you interpret and act on any reflections.
                                    </Text>

                                    <Text style={styles.cardHeading}>Safety &amp; Support</Text>
                                    <Text style={styles.cardBody}>Mirror is not intended for use in emergency situations.</Text>
                                    <Text style={styles.cardBody}>
                                        If you believe you may be in danger, experiencing a mental health crisis, or thinking about
                                        harming yourself or others, please seek immediate help by contacting:
                                    </Text>
                                    <Text style={styles.cardBody}>• Local emergency services, or</Text>
                                    <Text style={styles.cardBody}>• A qualified mental health professional, or</Text>
                                    <Text style={styles.cardBody}>• A trusted person in your life</Text>
                                    <Text style={styles.cardBody}>Mirror cannot provide crisis support.</Text>

                                    <Text style={styles.cardHeading}>Data &amp; Privacy</Text>
                                    <Text style={styles.cardBody}>
                                        Your interactions may be processed to generate reflections and improve the experience. You
                                        remain in control of your data and can manage or delete it at any time in Settings.
                                    </Text>
                                    <Text style={styles.cardBody}>You can review our full policies here:</Text>
                                    <Text style={styles.cardBody}>• Terms of Service</Text>
                                    <Text style={styles.cardBody}>• Privacy Policy</Text>
                                    <Text style={styles.cardBody}>• AI Transparency &amp; Use Policy</Text>

                                    <Text style={styles.cardHeading}>Consent</Text>
                                    <Text style={styles.cardBody}>By continuing, you confirm that:</Text>
                                    <Text style={styles.cardBody}>• You understand the purpose and limitations of Mirror</Text>
                                    <Text style={styles.cardBody}>• You agree to use Mirror for reflective purposes only</Text>
                                    <Text style={styles.cardBody}>• You accept our Terms of Service and Privacy Policy</Text>

                                </ScrollView>
                            </View>

                            <TouchableOpacity
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: agreed }}
                                onPress={() => setAgreed(prev => !prev)}
                                style={styles.checkboxRow}
                                activeOpacity={0.85}
                            >
                                <View style={[styles.checkboxBox, agreed && styles.checkboxBoxChecked]}>
                                    {agreed ? <Text style={styles.checkboxCheck}>✓</Text> : null}
                                </View>
                                <Text style={styles.checkboxLabel}>I understand and agree to continue</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                accessibilityRole="button"
                                disabled={!agreed}
                                onPress={() => {
                                    if (!agreed) {
                                        return;
                                    }
                                    navigation.navigate('VerifyEmail');
                                }}
                                activeOpacity={0.85}
                                style={!agreed ? styles.continueButtonDisabled : undefined}
                            >
                                <LinearGradient
                                    colors={['rgba(253, 253, 249, 0.03)', 'rgba(253, 253, 249, 0.20)']}
                                    start={{ x: 0.5, y: 0 }}
                                    end={{ x: 0.5, y: 1 }}
                                    style={styles.continueButton}
                                >
                                    <Text style={styles.continueButtonText}>CONTINUE</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </BackgroundWrapper>
    );
};

export default TermsAndConditionsScreen;

const styles = StyleSheet.create<{
    bg: ViewStyle;
    bgImage: ImageStyle;
    safe: ViewStyle;
    outerBoxContainer: ViewStyle;
    headerRow: ViewStyle;
    backButton: ViewStyle;
    backArrow: ImageStyle;
    outerBox: ViewStyle;
    innerBox: ViewStyle;
    titleContainer: ViewStyle;
    title: TextStyle;
    cardWrapper: ViewStyle;
    cardGradient: ViewStyle;
    cardScroll: ViewStyle;
    cardContent: ViewStyle;
    cardHeading: TextStyle;
    cardEmphasis: TextStyle;
    cardBody: TextStyle;
    checkboxRow: ViewStyle;
    checkboxBox: ViewStyle;
    checkboxBoxChecked: ViewStyle;
    checkboxCheck: TextStyle;
    checkboxLabel: TextStyle;
    continueButton: ViewStyle;
    continueButtonDisabled: ViewStyle;
    continueButtonText: TextStyle;
}>({
    bg: {
        flex: 1,
        backgroundColor: '#0B0F1C',
    },
    bgImage: {
        resizeMode: 'cover',
    },
    safe: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    outerBoxContainer: {
        flex: 1,
        paddingHorizontal: outerContainerPaddingHorizontal,
        paddingTop: 20,
        paddingBottom: outerContainerPaddingBottom,
        alignItems: 'center',
    },
    headerRow: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backArrow: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
        tintColor: '#E5D6B0',
    },
    outerBox: {
        width: outerBoxWidth,
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        gap: outerBoxGap,
        marginTop: 20,
    },
    innerBox: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: innerBoxGap,
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: 0,
        alignSelf: 'stretch',
        paddingHorizontal: innerBoxSidePadding,
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        fontFamily: 'CormorantGaramond-Light',
        fontSize: Math.min(screenWidth * 0.082, 32),
        fontWeight: '300',
        lineHeight: titleLineHeight,
        color: '#E5D6B0',
        textAlign: 'center',
        textShadowColor: '#E5D6B0',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    cardWrapper: {
        // Match QuizWelcomeScreen glass card styling
        width: cardWidth,
        alignSelf: 'center',
        flex: 1,
        padding: 20,
        borderRadius: 13,
        borderWidth: 0.25,
        borderColor: '#9BAAC2',
        backgroundColor: 'transparent',
        shadowColor: '#E5D6B0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        // boxShadow: '0 0 15px 0 rgba(229, 214, 176, 0.30)', // Not supported in RN, using shadow props
    },
    cardGradient: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 13,
    },
    cardScroll: {
        flex: 1,
        width: '100%',
    },
    cardContent: {
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        gap: 16,
        paddingBottom: 8,
    },
    cardHeading: {
        fontFamily: 'CormorantGaramond-Regular',
        fontSize: 24,
        fontWeight: '400',
        lineHeight: 31.2,
        color: '#FDFDF9',
        textAlign: 'center',
    },
    cardEmphasis: {
        fontFamily: 'Inter',
        fontSize: 18,
        fontStyle: 'italic',
        fontWeight: '600',
        lineHeight: 27,
        color: '#FDFDF9',
        textAlign: 'center',
    },
    cardBody: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '300',
        lineHeight: 24,
        color: '#FDFDF9',
        textAlign: 'center',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginTop: 10,
    },
    checkboxBox: {
        width: 20,
        height: 20,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: 'rgba(229, 214, 176, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    checkboxBoxChecked: {
        backgroundColor: 'rgba(229, 214, 176, 0.25)',
    },
    checkboxCheck: {
        fontSize: 16,
        lineHeight: 16,
        color: '#E5D6B0',
    },
    checkboxLabel: {
        flexShrink: 1,
        fontFamily: 'Inter',
        fontSize: 16,
        fontStyle: 'normal',
        fontWeight: '400',
        lineHeight: 24,
        color: '#F2E2B1',
    },
    continueButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#A3B3CC',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 10,
    },
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonText: {
        fontFamily: 'CormorantGaramond-Regular',
        fontSize: 18,
        lineHeight: 22,
        color: '#E5D6B0',
        textAlign: 'center',
    },
});
