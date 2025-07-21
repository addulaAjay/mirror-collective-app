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
};

export type ScreenName = keyof RootStackParamList;