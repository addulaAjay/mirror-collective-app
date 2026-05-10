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
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { echoApiService, type EchoResponse, type Recipient } from '@services/api/echo';

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
  const [menuVisible, setMenuVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [pendingRecipient, setPendingRecipient] = useState<Recipient | null>(null);
  const [busy, setBusy] = useState(false);

  // Only DRAFT echoes get the overflow menu.
  const visible = echo?.status === 'DRAFT';

  const refreshRecipients = useCallback(async () => {
    setLoadingRecipients(true);
    try {
      const res = await echoApiService.getRecipients();
      if (res.success && res.data) setRecipients(res.data);
    } catch (e) {
      // Fail soft: empty list, user can retry via close+reopen.
    } finally {
      setLoadingRecipients(false);
    }
  }, []);

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

  const handleAddRecipient = async () => {
    setMenuVisible(false);
    await refreshRecipients();
    setRecipientPickerOpen(true);
  };

  const handleRecipientPicked = (recipient: Recipient) => {
    setPendingRecipient(recipient);
    setRecipientPickerOpen(false);
    if (!echo) return;
    // Two follow-ups: send now or schedule for later.
    Alert.alert(
      `Send to ${recipient.name}?`,
      'Choose how you want this echo to be delivered.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setPendingRecipient(null) },
        {
          text: 'Schedule for later',
          onPress: () => {
            // Attach recipient first, then open date picker (no send yet).
            (async () => {
              const assignRes = await runWithBusy(() =>
                echoApiService.assignRecipient(echo.echo_id, recipient.recipient_id),
              );
              if (assignRes?.success) {
                await onChanged();
                setShowDatePicker(true);
              }
              setPendingRecipient(null);
            })();
          },
        },
        {
          text: 'Send now',
          style: 'destructive',
          onPress: () => {
            (async () => {
              const assignRes = await runWithBusy(() =>
                echoApiService.assignRecipient(echo.echo_id, recipient.recipient_id),
              );
              if (!assignRes?.success) {
                setPendingRecipient(null);
                return;
              }
              const sendRes = await runWithBusy(() => echoApiService.releaseEcho(echo.echo_id));
              setPendingRecipient(null);
              if (sendRes?.success) onSent?.();
            })();
          },
        },
      ],
    );
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

      {/* Recipient picker modal */}
      <Modal
        visible={recipientPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRecipientPickerOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.recipientCard}>
            <Text style={styles.recipientTitle}>Choose a recipient</Text>
            {loadingRecipients ? (
              <ActivityIndicator size="small" color={palette.gold.DEFAULT} style={styles.recipientLoader} />
            ) : recipients.length === 0 ? (
              <Text style={styles.recipientEmpty}>
                You haven't added any recipients yet. Add one from the Echo Vault first.
              </Text>
            ) : (
              <FlatList
                data={recipients}
                keyExtractor={r => r.recipient_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.recipientRow}
                    onPress={() => handleRecipientPicked(item)}
                    testID={`echo-recipient-${item.recipient_id}`}
                  >
                    <Text style={styles.recipientName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.recipientEmail} numberOfLines={1}>{item.email}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              onPress={() => setRecipientPickerOpen(false)}
              style={styles.recipientCancel}
              testID="echo-recipient-cancel"
            >
              <Text style={styles.recipientCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  recipientCard: {
    width: '100%',
    maxWidth: scale(360),
    maxHeight: '70%',
    backgroundColor: palette.navy.card,
    borderRadius: radius.m,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.medium,
    padding: scale(spacing.l),
  },
  recipientTitle: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.xl),
    fontWeight: fontWeight.regular,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    marginBottom: verticalScale(spacing.m),
  },
  recipientLoader: {
    marginVertical: verticalScale(spacing.l),
  },
  recipientEmpty: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    color: palette.gold.subtlest,
    textAlign: 'center',
    paddingVertical: verticalScale(spacing.l),
  },
  recipientRow: {
    paddingVertical: verticalScale(spacing.m),
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: palette.navy.medium,
  },
  recipientName: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.l),
    fontWeight: '500',
    color: palette.gold.subtlest,
  },
  recipientEmail: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    color: palette.navy.light,
    marginTop: verticalScale(2),
  },
  recipientCancel: {
    paddingVertical: verticalScale(spacing.m),
    marginTop: verticalScale(spacing.s),
    alignItems: 'center',
  },
  recipientCancelText: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.l),
    color: palette.gold.DEFAULT,
  },
});

export default EchoActionsHeader;
