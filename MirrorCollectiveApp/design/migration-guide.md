# Design System Migration Guide

## Migrating a component to use useTheme()

### Before (static import — still works, but deprecated pattern)
```tsx
import { theme } from '@theme';

const MyComponent = () => (
  <Text style={{ color: theme.colors.text.primary }}>Hello</Text>
);
```

### After (useTheme hook — preferred)
```tsx
import { useTheme } from '@theme';

const MyComponent = () => {
  const theme = useTheme();
  return <Text style={{ color: theme.colors.text.primary }}>Hello</Text>;
};
```

---

## Migrating from deprecated constants

### Colors
```tsx
// Before
import { COLORS } from '@constants';
color: COLORS.TEXT.PRIMARY

// After
import { useTheme } from '@theme';
const theme = useTheme();
color: theme.colors.text.inverse   // #1a2238 — was COLORS.TEXT.PRIMARY
```

### Spacing
```tsx
// Before
import { SPACING } from '@constants';
padding: SPACING.MD

// After
import { useTheme } from '@theme';
const theme = useTheme();
padding: theme.spacing.m   // 16
```

### Border Radius
```tsx
// Before
import { BORDER_RADIUS } from '@constants';
borderRadius: BORDER_RADIUS.MD

// After
import { useTheme } from '@theme';
const theme = useTheme();
borderRadius: theme.borderRadius.s   // 12
```

### Shadows
```tsx
// Before
import { SHADOWS } from '@constants';
...SHADOWS.MEDIUM

// After
import { useTheme } from '@theme';
const theme = useTheme();
...theme.shadows.MEDIUM
```

---

## Constants → Theme key mapping

### SPACING
| Old | New | Value |
|-----|-----|-------|
| `SPACING.XS` | `theme.spacing.xxs` | 4 |
| `SPACING.SM` | `theme.spacing.xs` | 8 |
| `SPACING.MD` | `theme.spacing.s` | 12 |
| `SPACING.LG` | `theme.spacing.m` | 16 |
| `SPACING.XL` | `theme.spacing.l` | 20 |
| `SPACING.XXL` | `theme.spacing.xl` | 24 |
| `SPACING.XXXL` | `theme.spacing.xxl` | 32 |
| `SPACING.LARGE` | `theme.spacing.xxxl` | 40 |

### BORDER_RADIUS
| Old | New | Value |
|-----|-----|-------|
| `BORDER_RADIUS.SM` | `theme.borderRadius.xs` | 8 |
| `BORDER_RADIUS.MD` | `theme.borderRadius.s` | 12 |
| `BORDER_RADIUS.LG` | `theme.borderRadius.m` | 16 |
| `BORDER_RADIUS.XL` | `theme.borderRadius.l` | 20 |
| `BORDER_RADIUS.FULL` | `theme.borderRadius.full` | 100 |

### COLORS
| Old | New |
|-----|-----|
| `COLORS.PRIMARY.GOLD` | `theme.colors.text.accent` |
| `COLORS.BACKGROUND.CHAT_CONTAINER` | `theme.colors.background.chatContainer` |
| `COLORS.BACKGROUND.USER_BUBBLE` | `theme.colors.background.userBubble` |
| `COLORS.TEXT.WHITE` | `palette.neutral.white` |
| `COLORS.STATUS.SUCCESS` | `theme.colors.status.success` |
| `COLORS.STATUS.ERROR` | `theme.colors.status.error` |

---

## Testing with a custom theme

```tsx
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@theme';

const mockTheme = { ...theme, colors: { ...theme.colors, text: { ...theme.colors.text, primary: 'red' } } };

render(
  <ThemeProvider value={mockTheme}>
    <MyComponent />
  </ThemeProvider>
);
```
