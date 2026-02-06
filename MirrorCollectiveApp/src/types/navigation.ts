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
  TermsAndConditions: undefined;
  StartFreeTrial: undefined;
  EchoVaultStorage: undefined;
  MirrorEcho: undefined;
  ReflectionRoom: undefined;
  MirrorCodeLibrary: undefined;
  TheMirrorPledge: undefined;
  About: undefined;
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
  VerifyEmail: { email?: string; fullName?: string } | undefined;
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
  };
  NewEchoAudioScreen: undefined;
  NewEchoVideoScreen: undefined;
  ManageGuardianScreen: undefined;
  ChooseGuardianScreen: undefined;
  ChooseRecipientScreen: undefined;
  AddNewProfileScreen: undefined;
  EchoDetailScreen: { echoId: string; title?: string; body?: string };
  EchoAudioPlaybackScreen: { echoId: string; title?: string; transcript?: string };
  EchoVideoPlaybackScreen: { echoId: string; title?: string };
};

export type ScreenName = keyof RootStackParamList;

