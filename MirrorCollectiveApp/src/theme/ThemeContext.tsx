import React, { createContext, useContext, type ReactNode } from 'react';

import { theme } from './index';
import type { Theme } from './index';

const ThemeContext = createContext<Theme>(theme);

interface ThemeProviderProps {
  children: ReactNode;
  value?: Theme;
}

/**
 * ThemeProvider — wrap the app root to make the theme available via useTheme().
 * Defaults to the standard theme. Pass a custom `value` to override (e.g. in tests).
 */
export const ThemeProvider = ({ children, value = theme }: ThemeProviderProps) => (
  <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
);

/**
 * useTheme — access the current theme in any component.
 *
 * @example
 * const theme = useTheme();
 * <Text style={{ color: theme.colors.text.primary }} />
 */
export const useTheme = (): Theme => useContext(ThemeContext);
