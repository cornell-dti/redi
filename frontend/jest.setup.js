// Mock React Native Firebase
jest.mock('@react-native-firebase/auth', () => {
  return () => ({
    currentUser: null,
  });
});

jest.mock('@react-native-firebase/firestore', () => {
  return () => ({});
});

// Mock fetch
global.fetch = jest.fn();

// Mock navigator.onLine
Object.defineProperty(global.navigator, 'onLine', {
  writable: true,
  value: true,
});

// Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
