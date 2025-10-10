// =============================================================================
// NAVIGATION TYPES
// =============================================================================

export type RootStackParamList = {
  index: undefined;
  '(auth)': undefined;
};

export type AuthStackParamList = {
  '(tabs)': undefined;
  'create-profile': undefined;
  home: undefined;
};

export type TabsParamList = {
  index: undefined; // Matches screen
  chat: undefined;
  notifications: undefined;
  profile: undefined;
};

export type ScreensParamList = {
  'chat-detail': {
    userId: string;
    name: string;
  };
};
