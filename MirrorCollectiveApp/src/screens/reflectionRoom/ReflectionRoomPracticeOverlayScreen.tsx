/**
 * Reflection Room — Practice Overlay screen.
 *
 * Hosts the reusable <PracticeOverlay> component and owns the
 * POST /practice/complete call. On 200, refreshes the cached snapshot
 * with the inline payload and replaces nav with the Practice Complete
 * screen.
 *
 * Source: 03_UI_DEVELOPER_HANDOFF.md §4.2 + §6 + §12.10.
 */

import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { palette } from '@theme';
import type { RootStackParamList } from '@types';

import { getReflectionRoomClient } from '@features/reflection-room/api';
import PracticeOverlay from '@features/reflection-room/components/PracticeOverlay';
import { useJourney } from '@features/reflection-room/state/JourneyContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = NativeStackScreenProps<
  RootStackParamList,
  'ReflectionRoomPracticeOverlay'
>;

const ReflectionRoomPracticeOverlayScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps['route']>();
  const journey = useJourney();
  const { loopId, toneState, surface } = route.params;

  if (!journey.sessionId) {
    // Defensive — without a session the recommend call will fail anyway.
    navigation.replace('ReflectionRoom');
    return null;
  }

  const handleDone: React.ComponentProps<typeof PracticeOverlay>['onDone'] =
    async ({ practice, ruleId }) => {
      const result = await getReflectionRoomClient().completePractice({
        session_id: journey.sessionId!,
        loop_id: loopId,
        tone_state: toneState,
        practice_id: practice.id,
        rule_id: ruleId,
        helpful: null,
      });
      journey.setSnapshot(result.snapshot);
      navigation.replace('ReflectionRoomPracticeComplete', {
        completionId: result.completion_id,
      });
    };

  const handleDismiss = () => {
    navigation.goBack();
  };

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <PracticeOverlay
          sessionId={journey.sessionId}
          loopId={loopId}
          toneState={toneState}
          surface={surface}
          onDone={handleDone}
          onDismiss={handleDismiss}
        />
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomPracticeOverlayScreen;

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: palette.navy.deep },
  safe: { flex: 1 },
});
