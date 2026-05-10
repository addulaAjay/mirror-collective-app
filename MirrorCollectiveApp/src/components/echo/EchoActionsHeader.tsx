/**
 * EchoActionsHeader
 *
 * Header overflow menu (⋮) rendered on the detail / playback screens for
 * DRAFT echoes. Surfaces the send-later actions:
 *
 *   Saved (DRAFT, no recipient)
 *     → Send to recipient…   pick recipient → confirm → release
 *
 *   Scheduled (DRAFT + recipient + future release_date)
 *     → Send now             confirm → release
 *     → Edit release date    date picker → schedule
 *     → Cancel scheduled send  confirm → clearSchedule
 *
 * Hidden for sent (RELEASED) and guardian-locked (LOCKED) echoes.
 *
 * The component is self-contained: it manages its own modal state, calls
 * the API, then invokes `onChanged` so the parent screen can re-fetch the
 * echo (or pop back, in the case of an immediate send).
 */

import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  borderWidth,
  fontFamily,
  fontSize,
  fontWeight,
  moderateScale,
  palette,
  radius,
  scale,
  spacing,
  verticalScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { echoApiService, type EchoResponse } from '@services/api/echo';

interface Props {
  echo: EchoResponse | null;
  /**
   * Called after a successful action so the parent can refresh its state.
   * Send-now is a special case: the echo transitions to RELEASED and there's
   * nothing more for the creator to do here — `onSent` lets the parent pop
   * back to the vault instead of staying on the playback screen.
   */
  onChanged: () => void | Promise<void>;
  onSent?: () => void;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── Visual: 3-dot vertical overflow icon ─────────────────────────────────────
const OverflowIcon: React.FC = () => (
  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={5} r={2} fill={palette.gold.DEFAULT} />
    <Circle cx={12} cy={12} r={2} fill={palette.gold.DEFAULT} />
    <Circle cx={12} cy={19} r={2} fill={palette.gold.DEFAULT} />
  </Svg>
);

/** Returns the actions appropriate to the echo's current state. */
const deriveActions = (echo: EchoResponse): Array<'send-now' | 'edit-date' | 'cancel-schedule' | 'add-recipient'> => {
  // Saved → only entry-point is to attach a recipient and send.
  if (!echo.recipient?.recipient_id) {
    return ['add-recipient'];
  }
  // Has a recipient — both immediate and scheduled paths are valid.
  if (echo.release_date) {
    return ['send-now', 'edit-date', 'cancel-schedule'];
  }
  // Edge case: recipient assigned but no schedule (auto-release should have
  // fired on create; if we're here, give the user a manual fire button).
  return ['send-now'];
};

const ACTION_LABELS: Record<
  'send-now' | 'edit-date' | 'cancel-schedule' | 'add-recipient',
  string
> = {
  'send-now': 'Send now',
  'edit-date': 'Edit release date',
  'cancel-schedule': 'Cancel scheduled send',
  'add-recipient': 'Send to recipient…',
};

const EchoActionsHeader: React.FC<Props> = ({ echo, onChanged, onSent }) => {
  const navigation = useNavigation<Nav>();
  const [menuVisible, setMenuVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [busy, setBusy] = useState(false);

  // Only DRAFT echoes get the overflow menu.
  const visible = echo?.status === 'DRAFT';

  const runWithBusy = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setBusy(true);
    try {
      return await fn();
    } catch (err: any) {
      Alert.alert('Something went wrong', err?.message ?? 'Please try again.');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleSendNow = (recipientName?: string) => {
    if (!echo) return;
    setMenuVisible(false);
    Alert.alert(
      'Send echo now?',
      recipientName
        ? `This echo will be delivered to ${recipientName} immediately. You can't undo this.`
        : "This echo will be delivered to its recipient immediately. You can't undo this.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'destructive',
          onPress: async () => {
            const res = await runWithBusy(() => echoApiService.releaseEcho(echo.echo_id));
            if (res?.success) {
              onSent?.();
            }
          },
        },
      ],
    );
  };

  const handleCancelSchedule = () => {
    if (!echo) return;
    setMenuVisible(false);
    Alert.alert(
      'Cancel scheduled send?',
      "We'll keep the recipient attached, but the release date will be cleared. You can reschedule or send now anytime.",
      [
        { text: 'Keep schedule', style: 'cancel' },
        {
          text: 'Cancel send',
          style: 'destructive',
          onPress: async () => {
            const res = await runWithBusy(() => echoApiService.clearSchedule(echo.echo_id));
            if (res?.success) await onChanged();
          },
        },
      ],
    );
  };

  const handleEditDate = () => {
    setMenuVisible(false);
    setShowDatePicker(true);
  };

  const handleDateChange = async (_: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (Platform.OS === 'ios') setShowDatePicker(false);
    if (!date || !echo) return;
    const res = await runWithBusy(() =>
      echoApiService.scheduleEcho(echo.echo_id, date.toISOString()),
    );
    if (res?.success) await onChanged();
  };

  /**
   * Route the user to ChooseRecipientScreen in "send-later" mode so the
   * recipient + lock-date picker is identical to the create flow. That screen
   * handles the assignRecipient + (scheduleEcho | releaseEcho) calls itself
   * and pops back to the top of the stack on success — no callback wiring
   * needed here.
   */
  const handleAddRecipient = () => {
    if (!echo) return;
    setMenuVisible(false);
    navigation.navigate('ChooseRecipientScreen', {
      sendLaterFor: { echoId: echo.echo_id, echoTitle: echo.title },
    });
  };

  if (!visible || !echo) {
    // Render an empty equivalent-width placeholder so the title still
    // optically centers (mirrors the back-button width on the left side).
    return <View style={styles.placeholder} />;
  }

  const actions = deriveActions(echo);

  return (
    <>
      <TouchableOpacity
        onPress={() => setMenuVisible(true)}
        style={styles.trigger}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel="More actions"
        testID="echo-actions-trigger"
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator size="small" color={palette.gold.DEFAULT} />
        ) : (
          <OverflowIcon />
        )}
      </TouchableOpacity>

      {/* Action menu modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuCard}>
            {actions.map((action, idx) => {
              const isLast = idx === actions.length - 1;
              const onPress =
                action === 'send-now' ? () => handleSendNow(echo.recipient?.name)
                : action === 'edit-date' ? handleEditDate
                : action === 'cancel-schedule' ? handleCancelSchedule
                : handleAddRecipient;
              return (
                <TouchableOpacity
                  key={action}
                  onPress={onPress}
                  style={[styles.menuItem, !isLast && styles.menuItemBorder]}
                  testID={`echo-action-${action}`}
                >
                  <Text style={styles.menuItemText}>{ACTION_LABELS[action]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date picker — native modal on both platforms */}
      {showDatePicker && (
        <DateTimePicker
          value={echo.release_date ? new Date(echo.release_date) : new Date(Date.now() + 24 * 3600 * 1000)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    width: scale(44),
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: scale(44),
    height: scale(44),
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 28, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(spacing.xl),
  },
  menuCard: {
    width: '100%',
    maxWidth: scale(360),
    backgroundColor: palette.navy.card,
    borderRadius: radius.m,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.medium,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: verticalScale(spacing.m),
    paddingHorizontal: scale(spacing.l),
    alignItems: 'center',
  },
  menuItemBorder: {
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: palette.navy.medium,
  },
  menuItemText: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.l),
    fontWeight: fontWeight.regular,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
  },
});

export default EchoActionsHeader;
