import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../../context/AuthContext';

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <NavigationContainer>
      <AuthProvider>
        {children}
      </AuthProvider>
    </NavigationContainer>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react-native';

// Override render method
export { customRender as render };

// Mock navigation helper
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => false),
  isFocused: jest.fn(() => true),
  push: jest.fn(),
  replace: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  setOptions: jest.fn(),
  getParent: jest.fn(),
  getId: jest.fn(),
  getState: jest.fn(),
};

// Mock API responses
export const mockApiResponses = {
  chatSuccess: {
    success: true,
    data: { reply: 'Test response from API' },
  },
  chatError: {
    success: false,
    error: 'API Error',
  },
  authSuccess: {
    success: true,
    data: {
      user: { id: '1', email: 'test@example.com', fullName: 'Test User' },
      tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
    },
  },
};