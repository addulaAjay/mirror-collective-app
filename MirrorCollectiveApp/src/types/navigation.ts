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
  MirrorEcho: undefined;
  ReflectionRoom: undefined;
  ReflectionRoomQuiz: undefined;
  ReflectionRoomLoading: undefined;
  ReflectionRoomTodaysMotif: undefined;
  ReflectionRoomEchoSignature: undefined;
  ReflectionRoomEchoMap: undefined;
  ReflectionRoomMirrorMoment: undefined;
  ReflectionRoomCore: undefined;
  MirrorCodeLibrary: undefined;
  TheMirrorPledge: undefined;
  About: undefined;
  FAQ: undefined;
  Profile: undefined;
  MirrorAnimation: undefined;
  EnterMirror: undefined;
  EmailConfirmation: undefined;
  AppVideo: undefined;
  TalkToMirror: undefined;
  AppExplanation: undefined;
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
  // Echo Vault Screens
  MirrorEchoVaultHome: undefined;
  MirrorEchoVaultLibrary: undefined;
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
    title: string;
    category: string;
    mode: 'text' | 'audio' | 'video';
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

