import type {
  QuizAnswers as RRQuizAnswers,
  RRApiErrorCode,
} from '@features/reflection-room/api/types';
import type {
  LoopId as RRLoopId,
  ToneState as RRToneState,
  PracticeSurface as RRPracticeSurface,
} from '@features/reflection-room/types/ids';

type ArchetypeRouteParams = {
  archetype: {
    name: string;
    title: string;
    description: string;
    image: any;
  };
  quizResult?: any;
};

export type RootStackParamList = {
  Splash: undefined;
  TermsAndConditions: {
    fullName: string;
    email: string;
    password: string;
    phoneNumber?: string;
  };
  StartFreeTrial: undefined;
  EchoVaultStorage: undefined;
  /**
   * Echo Vault Storage add-on upsell (Figma 4928-8944).
   * `onCompleteRoute` lets the caller specify where to navigate after
   * the user confirms (purchase succeeds) or chooses "Not now". When
   * omitted, the screen calls navigation.goBack().
   */
  EchoVaultUpsell:
    | {
        onCompleteRoute?: keyof RootStackParamList;
      }
    | undefined;
  /**
   * Read-only subscription management view (repurposes Figma
   * 4928-8699 / 4928-8823 visual treatment). Lists current plan,
   * billing period, next-renewal date, and offers deep links to the
   * platform's subscription-management UI for changes / cancellation.
   */
  YourSubscription: undefined;
  MirrorEcho: undefined;
  ReflectionRoom: undefined;
  ReflectionRoomCommingsoon: undefined;
  ReflectionRoomWelcome: undefined;
  ReflectionRoomQuizEntry: undefined;
  ReflectionRoomQuiz: undefined;
  ReflectionRoomLoading: { answers: RRQuizAnswers };
  ReflectionRoomTodaysMotif: { error?: boolean; errorCode?: RRApiErrorCode } | undefined;
  ReflectionRoomEchoSignature: undefined;
  ReflectionRoomEchoMap: undefined;
  ReflectionRoomMirrorMoment: undefined;
  ReflectionRoomCore: undefined;
  ReflectionRoomPracticeOverlay: {
    loopId: RRLoopId;
    toneState: RRToneState;
    surface: RRPracticeSurface;
  };
  ReflectionRoomPracticeComplete: { completionId: string } | undefined;
  MirrorCodeLibrary: undefined;
  TheMirrorPledge: undefined;
  About: undefined;
  FAQ: undefined;
  Profile: undefined;
  MirrorAnimation: undefined;
  EnterMirror: undefined;
  AppVideo: undefined;
  TalkToMirror: undefined;
  Login: undefined;
  MirrorChat: undefined;
  SignUp: undefined;
  VerifyEmail: { email?: string; fullName?: string; password?: string; termsAcceptedAt?: string } | undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  QuizWelcome: undefined;
  QuizTuning: ArchetypeRouteParams;
  QuizQuestions: undefined;
  Archetype: ArchetypeRouteParams;
  // Mirror Pledge Screens
  MirrorPledgeIntro: undefined;
  EchoLedger: undefined;
  ViewAllCauses: undefined;
  CausesCarousel: { initialCauseId?: string } | undefined;
  PledgeThankYou: undefined;
  // DEV-only: button visual QA + blur tuning. Wire-up in App.tsx is gated by __DEV__.
  ButtonShowcase: undefined;
  // Echo Vault Screens
  MirrorEchoVaultHome: undefined;
  MirrorEchoVaultLibrary: undefined;
  EchoInboxScreen: undefined;
  NewEchoVault: undefined;
  NewEchoScreen: undefined;
  NewEchoCompose: {
    title: string;
    category: string;
    mode: 'text' | 'audio' | 'video';
    recipient: any;
  };
  NewEchoComposeScreen: {
    mode?: 'text' | 'audio' | 'video';
    recipientName?: string;
    title?: string;
    category?: string;
    hasRecipient?: boolean;
    recipientId?: string;
    recipient?: any;
    guardianId?: string;
    guardianName?: string;
    lockDate?: string;
    unlockOnDeath?: boolean;
    /** Edit mode: pre-fill compose with existing echo and PATCH on save */
    editEchoId?: string;
    initialContent?: string;
    /**
     * Optional "Letter to Recipient" cover note, forwarded from the recipient
     * picker step. Sent as `letter_to_recipient` on the create / update PATCH
     * so it persists alongside the echo.
     */
    letterToRecipient?: string;
  };
  NewEchoAudioScreen: {
    recipientId?: string;
    recipientName?: string;
    title?: string;
    category?: string;
  };
  NewEchoVideoScreen: {
    recipientId?: string;
    recipientName?: string;
    title?: string;
    category?: string;
  };
  ManageGuardianScreen: undefined;
  ManageRecipientScreen: undefined;
  ChooseGuardianScreen: {
    title: string;
    category: string;
    mode: 'text' | 'audio' | 'video';
    recipientId: string;
    recipientName: string;
    lockDate?: string;
    unlockOnDeath?: boolean;
  };
  ChooseRecipientScreen: {
    // Create-flow fields (used when the screen is reached from the new-echo
    // wizard). Optional because the same screen is also reused as the first
    // step of the edit flow, where the title/category/mode come from the
    // existing echo (passed via prefill props).
    title?: string;
    category?: string;
    mode?: 'text' | 'audio' | 'video';
    /**
     * Edit-mode plumbing — when `editEchoId` is set the screen runs in
     * "edit existing echo" mode: it pre-populates the picker with the
     * echo's current recipient + lock date, and on Next it navigates to
     * NewEchoComposeScreen with `editEchoId` so the compose step PATCHes
     * the existing echo instead of creating a new one. The end-to-end
     * trip matches the create flow (Recipient → Compose → Save) which is
     * the consistency property the UX was designed around.
     */
    editEchoId?: string;
    prefillRecipient?: {
      recipient_id: string;
      name: string;
      email: string;
      motif?: string;
      profile_image_url?: string;
    };
    prefillLockDate?: string;       // ISO 8601
    /**
     * Existing echo body for text echoes. Forwarded to NewEchoComposeScreen
     * as `initialContent` so the compose step opens with the user's prior
     * text already in the editor — same prefill pattern the create flow uses
     * when bouncing the user back to make changes.
     */
    prefillContent?: string;
    /**
     * Existing "Letter to Recipient" cover note. Hydrates the notes field in
     * the picker on mount and is forwarded to compose so it persists on save.
     */
    prefillLetter?: string;
  };
  AddNewProfileScreen: { mode?: 'recipient' | 'guardian' } | undefined;
  EchoDetailScreen: { echoId: string; title?: string; body?: string };
  EchoAudioPlaybackScreen: { echoId: string; title?: string; transcript?: string };
  EchoVideoPlaybackScreen: { echoId: string; title?: string };
  Checkout: undefined;
};

import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type ScreenName = keyof RootStackParamList;

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
