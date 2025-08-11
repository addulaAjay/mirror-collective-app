export type RootStackParamList = {
  Splash: undefined;
  MirrorAnimation: undefined;
  EnterMirror: undefined;
  AppExplanation: undefined;
  Login: undefined;
  MirrorChat: undefined;
  SignUp: undefined;
  VerifyEmail: { email: string; fullName: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  QuizWelcome: undefined;
  QuizTuning: undefined;
  QuizQuestions: undefined;
  Archetype: { 
    archetype: {
      name: string;
      title: string;
      description: string;
      image: any;
    };
  };
};

export type ScreenName = keyof RootStackParamList;