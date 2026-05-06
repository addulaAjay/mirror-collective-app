// FAQScreen.tsx
import React from 'react';
import { palette, fontFamily } from '@theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import BackgroundWrapper from '../components/BackgroundWrapper';
import LogoHeader from '../components/LogoHeader';

const GOLD = palette.gold.warm;
const WHITE = palette.neutral.white;

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type QA = { q: string; a?: string };
type Section = { title: string; items: QA[]; initiallyOpen?: boolean };

const SECTIONS: Section[] = [
  {
    title: 'General',
    initiallyOpen: true,
    items: [
      {
        q: 'What is The Mirror Collective?',
        a: 'The Mirror is a self-awareness and emotional intelligence tool that helps you notice the patterns and habits driving your decisions in real time — so you can respond with clarity instead of autopilot. It fills the gap between thinking and reacting, helping you understand yourself more deeply, make better choices, and grow into the best version of yourself — so your actions have a positive impact on your life and the people around you.',
      },
      {
        q: 'Is this therapy?',
        a: 'No. The Mirror is reflective, not clinical. It doesn\'t diagnose or replace care — it helps you reflect on your circumstances, thoughts, environment and choose your next step accordingly.',
      },
      {
        q: 'Who is it for?',
        a: 'Anyone who wants better self-understanding: stress, relationships, habits, confidence, decisions, or growth.',
      },
      {
        q: 'What makes it different from other wellness apps?',
        a: 'Most apps track behavior. The Mirror reflects meaning — how emotions, language, and patterns show up over time so that you can make better choices to grow into the best version of yourself.',
      },
      {
        q: 'How do I start?',
        a: 'Choose what fits the moment:\n• Chat with MirrorGPT\n• Try a 2-minute Mirror Moment\n• Save something meaningful in Echo Vault to begin creating your story',
      },
      {
        q: 'Do I need to use it every day?',
        a: 'No. There\'s no streak to keep. Use it when something matters. Small moments of reflection add up to meaningful clarity over time — and clarity changes how you show up.',
      },
      {
        q: 'Is my data private?',
        a: 'Yes. Privacy is built in. You can pause, delete, or export anytime.',
      },
      {
        q: 'Will The Mirror judge me or tell me what to do?',
        a: 'No. There\'s no judgment here — just reflection, insight, and space to choose your next step.',
      },
      {
        q: 'Can I control what gets saved?',
        a: 'Always. You decide what stays or goes.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes (when enabled). Terms are always shown before confirming.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes. Manage or cancel in your App Store or Google Play settings.',
      },
      {
        q: 'Need help or want to share feedback?',
        a: 'Go to Settings → Support or Feedback.',
      },
    ],
  },
  {
    title: 'MirrorGPT',
    initiallyOpen: false,
    items: [
      {
        q: 'What is MirrorGPT?',
        a: 'MirrorGPT turns self-talk into self-awareness by helping you understand yourself in real time — why you feel stuck, repeat the same patterns, or react in ways you don\'t mean to. Instead of telling you what to do, it reflects what\'s actually happening beneath the surface so you can slow down, gain clarity, and respond with intention. People use it to think more clearly, regulate emotions, improve relationships, and become a more grounded version of themselves.',
      },
      {
        q: 'How does it work?',
        a: 'You talk. MirrorGPT listens for emotional patterns and recurring themes, then reflects them back so you can gain clarity and choose your next step with intention.',
      },
      {
        q: 'Is it reading my mind?',
        a: 'No. It only uses what you share.',
      },
      {
        q: 'What should I say?',
        a: 'Say what\'s real right now. Short is fine.',
      },
      {
        q: 'Can it help with decisions?',
        a: 'Yes. It helps separate facts from emotion.',
      },
      {
        q: 'Can I use it for relationships?',
        a: 'Yes. It helps you see patterns in how you react, so you can respond more thoughtfully and communicate with less tension.',
      },
      {
        q: 'Does it diagnose mental health conditions?',
        a: 'No. It\'s reflection-based, not clinical.',
      },
      {
        q: 'What if I\'m in a crisis?',
        a: 'If you\'re in immediate danger, contact local emergency services. In the US please dial 911 for emergency services or dial 988 for suicide or crisis help.',
      },
    ],
  },
  {
    title: 'Echo Vault',
    initiallyOpen: false,
    items: [
      {
        q: 'What is Echo Vault?',
        a: 'Echo Vault is where you become the architect of your own story — preserving what you\'ve learned, loved, and lived. A private time capsule you own, meant to last beyond the moment.',
      },
      {
        q: 'Is this a social feed?',
        a: 'No. It\'s personal memory. Your story, on your terms.',
      },
      {
        q: 'What can I save?',
        a: 'Reflections, messages to your future self, letters, voice notes, photos, videos, and milestones.',
      },
      {
        q: 'Can I organize entries?',
        a: 'Yes. By themes, emotions, chapters, or tags.',
      },
      {
        q: 'Can I send messages to the future?',
        a: 'Yes — to yourself or loved ones, on dates you choose.',
      },
      {
        q: 'What\'s a Legacy Capsule?',
        a: 'A collection meant to be opened later — preserving your voice and perspective.',
      },
      {
        q: 'Who can see my Echo Vault?',
        a: 'Only you — always. Nothing is shared unless you intentionally choose to share it.',
      },
      {
        q: 'Can I assign someone to receive my Vault if something happens to me?',
        a: 'Yes. You can designate a Guardian — someone you trust to receive selected memories if you pass away or at a time you choose.',
      },
      {
        q: 'What does a Guardian do?',
        a: 'A Guardian can view what you\'ve chosen to leave behind — your words, voice, lessons, and memories — exactly as you saved them. Nothing can be edited or changed.',
      },
      {
        q: 'When does a Guardian get access?',
        a: 'Only if a trigger you set occurs (such as passing, a future date, or long-term inactivity). Until then, your Vault remains fully private.',
      },
      {
        q: 'Can I change or remove my Guardian?',
        a: 'Yes. You\'re always in control. You can update or revoke Guardians at any time.',
      },
      {
        q: 'Can I delete entries or my Vault entirely?',
        a: 'Yes — anytime. Your story is yours to keep, revise, or erase.',
      },
    ],
  },
  {
    title: 'Reflection Room',
    initiallyOpen: false,
    items: [
      {
        q: 'What is the Reflection Room?',
        a: 'Where awareness becomes change — and growth becomes something you can actually feel. This is where you see yourself change over time. One moment of awareness brings another moment of insight. Repeated moments create real change. The Reflection Room turns short, guided check-ins into something lasting — helping you regulate, integrate what you notice, and watch your patterns evolve as you do.',
      },
      {
        q: 'How long does it take?',
        a: 'About two minutes — less time than your favorite coffee order, but enough to shift your state without disrupting your day.',
      },
      {
        q: 'What is a Mirror Moment?',
        a: 'A two-minute reset that helps you catch yourself before stress, fear, or emotion takes over — and choose a better response. Your life isn\'t shaped by big breakthroughs. It\'s shaped by tiny moments where you either react… or choose differently.',
      },
      {
        q: 'When should I use a Mirror Moment?',
        a: 'Before a hard conversation. When your thoughts are spiraling. When something feels tight, heavy, or stuck — and you want relief without numbing.',
      },
      {
        q: 'What is Echo Signature?',
        a: 'A moment of truth with yourself — showing what\'s really going on emotionally, before it leaks into your words, decisions, or relationships. Awareness doesn\'t come from thinking harder. It comes from seeing clearly.',
      },
      {
        q: 'Do I have to share my Echo Signature?',
        a: 'No. It\'s yours. Sharing is always optional.',
      },
      {
        q: 'What is Echo Map?',
        a: 'A mirror for your inner life over time — revealing the patterns you live inside and the ones you\'re learning to leave behind. If you can see the pattern, you can change it. If you can\'t, you repeat it.',
      },
      {
        q: 'Is Echo Map scoring me?',
        a: 'No. There are no grades, no judgment — just clarity.',
      },
    ],
  },
  {
    title: 'Code Library',
    initiallyOpen: false,
    items: [
      {
        q: 'What is the Code Library?',
        a: 'A living library of ideas, research, and real human insight — blending psychology, consciousness, and pattern science to help you understand yourself, the world, and how meaning actually forms. It includes short, readable entries, micro-practices, and community-shared reflections — so learning isn\'t abstract, it\'s lived.',
      },
      {
        q: 'How do I use it?',
        a: 'Search by how you feel, or browse by theme. Try one small practice.',
      },
      {
        q: 'Is everything long-form?',
        a: 'No. Most entries take minutes.',
      },
      {
        q: 'Can I contribute?',
        a: 'When enabled, yes. Shared reflections help others feel less alone.',
      },
    ],
  },
  {
    title: 'Mirror Pledge',
    initiallyOpen: false,
    items: [
      {
        q: 'What is the Mirror Pledge?',
        a: 'A simple belief in action: when people grow, the world changes. Each quarter, we donate 2% of net proceeds to community-selected causes — turning self-awareness into shared good.',
      },
      {
        q: 'Is it required?',
        a: 'No. Participation is always your choice.',
      },
      {
        q: 'How often is impact reported?',
        a: 'Quarterly.',
      },
      {
        q: 'Have a question, idea, or feedback?',
        a: 'We want to hear it. The Mirror is built with its community, not just for it.',
      },
      {
        q: 'How do I share feedback or ask a question?',
        a: 'Go to Settings → Feedback to send a question, idea, or suggestion directly to our team.',
      },
      {
        q: 'Does feedback actually get used?',
        a: 'Yes. Community insights actively shape what we build, refine, and release next.',
      },
    ],
  },
];

export default function FAQScreen() {
  const navigation = useNavigation();
  const [openSections, setOpenSections] = React.useState<
    Record<string, boolean>
  >(() => {
    const init: Record<string, boolean> = {};
    for (const s of SECTIONS) init[s.title] = !!s.initiallyOpen;
    return init;
  });

  const [openItemKey, setOpenItemKey] = React.useState<string | null>(null);

  const toggleSection = (title: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSections(p => ({ ...p, [title]: !p[title] }));
  };

  const toggleItem = (sectionTitle: string, idx: number) => {
    const key = `${sectionTitle}::${idx}`;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenItemKey(prev => (prev === key ? null : key));
  };

  return (
    <BackgroundWrapper>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Row */}
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>FAQ</Text>
            <View style={{ width: 30 }} />
          </View>

          {SECTIONS.map(section => {
            const isSectionOpen = !!openSections[section.title];
            return (
              <View key={section.title} style={styles.section}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection(section.title)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionChevron}>
                    {isSectionOpen ? '▴' : '▾'}
                  </Text>
                </TouchableOpacity>

                {isSectionOpen ? (
                  <View>
                    {section.items.map((item, idx) => {
                      const key = `${section.title}::${idx}`;
                      const expanded = openItemKey === key && !!item.a;

                      return (
                        <View key={key} style={styles.cardWrap}>
                          <TouchableOpacity
                            style={[styles.card, expanded && styles.cardExpanded]}
                            activeOpacity={0.9}
                            onPress={() => toggleItem(section.title, idx)}
                          >
                            <View style={styles.cardTopRow}>
                              <Text style={styles.cardQuestion}>{item.q}</Text>
                              <Text style={styles.cardIcon}>
                                {expanded ? '−' : '+'}
                              </Text>
                            </View>

                            {expanded ? (
                              <Text style={styles.cardAnswer}>{item.a}</Text>
                            ) : null}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
  topRow: {
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 26,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 0,
    marginTop: 30, // Consistent with AboutScreen
    marginBottom: 18,
  },
  backBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: GOLD,
    fontWeight: '300',
  },
  title: {
    fontSize: 30,
    color: GOLD,
    fontFamily: 'CormorantGaramond-SemiBold',
    letterSpacing: 2,
    textAlign: 'center',
  },

  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 25,
    color: GOLD,
    fontFamily: 'CormorantGaramond-Regular',
    letterSpacing: 0.4,
  },
  sectionChevron: {
    fontSize: 50,
    color: WHITE,
    opacity: 0.95,
  },

  cardWrap: {
    marginBottom: 10,
  },

  card: {
    borderRadius: 12,
    backgroundColor: 'rgba(163, 179, 204, 0.05)',
    borderWidth: 0.25,
    borderColor: '#808fb2',
    padding: 8,
    paddingHorizontal: 12,
  },

  cardExpanded: {
    gap: 8,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },

  cardQuestion: {
    flex: 1,
    fontSize: 20,
    lineHeight: 24,
    color: '#fdfdf9',
    fontFamily: 'CormorantGaramond-Italic',
  },

  cardIcon: {
    fontSize: 22,
    lineHeight: 24,
    color: '#fdfdf9',
    marginLeft: 8,
    marginTop: 1,
  },

  cardAnswer: {
    fontSize: 16,
    lineHeight: 24,
    color: '#fdfdf9',
    fontFamily: fontFamily.body,
    paddingBottom: 4,
  },
});
