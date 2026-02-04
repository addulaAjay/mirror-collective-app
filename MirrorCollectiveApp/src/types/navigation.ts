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
  VerifyEmail: { email: string; fullName: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  QuizWelcome: undefined;
  QuizTuning: ArchetypeRouteParams;
  QuizQuestions: undefined;
  Archetype: ArchetypeRouteParams;
};

export type ScreenName = keyof RootStackParamList;
