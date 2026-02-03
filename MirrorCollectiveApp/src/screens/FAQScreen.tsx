// FAQScreen.tsx
import React from 'react';
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
import LinearGradient from 'react-native-linear-gradient';

import BackgroundWrapper from '../components/BackgroundWrapper';
import LogoHeader from '../components/LogoHeader';

const GOLD = '#E5D6B0';
const WHITE = '#FFFFFF';

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
        q: 'What is Mirror Collective?',
        a: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      },
      {
        q: 'What is Mirror Collective?',
        a: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      },
      {
        q: 'What is Mirror Collective?',
        a: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      },
    ],
  },
  {
    title: 'Mirror Chat',
    initiallyOpen: true,
    items: [
      {
        q: 'How does it work?',
        a: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      },
      {
        q: 'What is Mirror Collective?',
        a: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      },
    ],
  },
];

export default function FAQScreen() {
  const [openSections, setOpenSections] = React.useState<
    Record<string, boolean>
  >(() => {
    const init: Record<string, boolean> = {};
    for (const s of SECTIONS) init[s.title] = !!s.initiallyOpen;
    return init;
  });

  const [openItemKey, setOpenItemKey] = React.useState<string | null>(
    'Mirror Chat::0',
  ); // expanded card like screenshot

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
      {/* Top row: hamburger + centered logo */}
      <View style={styles.topRow}>
        <View style={styles.logoCenter}>
          <LogoHeader />
        </View>

        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>FAQ</Text>

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
                          style={styles.card}
                          activeOpacity={0.9}
                          onPress={() => toggleItem(section.title, idx)}
                        >
                          {/* soft highlight */}
                          <LinearGradient
                            colors={[
                              'rgba(255,255,255,0.00)',
                              'rgba(255,255,255,0.08)',
                              'rgba(255,255,255,0.00)',
                            ]}
                            locations={[0, 0.5, 1]}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={StyleSheet.absoluteFillObject}
                          />

                          <View style={styles.cardTopRow}>
                            <Text style={styles.cardQuestion}>{item.q}</Text>
                            <Text style={styles.cardIcon}>
                              {expanded ? '–' : '+'}
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
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  topRow: {
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hamburgerBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburger: {
    fontSize: 34,
    color: GOLD,
    fontFamily: 'CormorantGaramond-SemiBold',
  },
  logoCenter: { flex: 1, alignItems: 'center' },

  content: {
    paddingHorizontal: 18,
    paddingTop: 80,
    paddingBottom: 26,
  },

  title: {
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 18,
    fontSize: 30,
    color: GOLD,
    fontFamily: 'CormorantGaramond-SemiBold',
    letterSpacing: 2,
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
    marginBottom: 16,
  },

  // matches pill + expanded card style in screenshot
  card: {
    borderRadius: 16,
    backgroundColor: 'rgba(10, 12, 18, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 5,
    paddingBottom: 5,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardQuestion: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.86)',
    fontFamily: 'CormorantGaramond-Italic',
    letterSpacing: 0.3,
    paddingRight: 12,
  },

  cardIcon: {
    fontSize: 34,
    color: 'rgba(255,255,255,0.92)',
    marginTop: -4,
  },

  cardAnswer: {
    marginTop: 12,
    fontSize: 20,
    lineHeight: 30,
    color: 'rgba(255,255,255,0.88)',
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'CormorantGaramond-Regular',
      default: undefined,
    }),
  },
});
