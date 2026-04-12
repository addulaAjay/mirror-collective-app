# Mobile-First Scaling Guide

## Overview

The design system uses a **mobile-first, runtime scaling approach** optimized for iOS and Android devices ranging from iPhone SE (320px) to iPhone Pro Max (428px).

**Key Principles:**
- Single token values scale proportionally at runtime
- Base design frame: iPhone 14 Pro (393×852)
- Responsive utilities adapt to device size dynamically
- No discrete breakpoints — truly fluid scaling

---

## Token Structure

### ✅ Current (Simplified Mobile-First)

```json
{
  "font.size.M": {
    "$value": 18,
    "$type": "number"
  }
}
```

All tokens are single values that scale at runtime via responsive utilities.

### ❌ Previous (Deprecated)

```json
{
  "font.size.M": {
    "$value": {
      "Mobile": 18,
      "Desktop": 18
    }
  }
}
```

Mobile/Desktop objects have been removed as unnecessary duplication.

---

## Device Coverage

| Device Category | Width (px) | Example Devices | Scaling Factor |
|----------------|------------|-----------------|----------------|
| **Tiny** | 320 | iPhone SE (1st gen) | 0.815× (−18.5%) |
| **Small** | 375 | iPhone 13 Mini | 0.954× (−4.6%) |
| **Standard** | 390 | iPhone 14 | 0.992× (−0.8%) |
| **Base** | 393 | iPhone 14 Pro | 1.0× (baseline) |
| **Large** | 414 | iPhone 11 Pro Max | 1.053× (+5.3%) |
| **XL** | 428 | iPhone 14 Pro Max | 1.089× (+8.9%) |

**Android equivalents:**
- Small: 360px (Samsung Galaxy S8, Pixel 3)
- Medium: 393px (Pixel 6)
- Large: 412px (Samsung Galaxy S21)
- XL: 428px (Samsung Galaxy S22 Ultra)

---

## Responsive Functions

Import from `@theme`:

```tsx
import { scale, moderateScale, scaleCap, scaleMin, useResponsive } from '@theme';
```

### 1. `scale(size)` — Proportional Width Scaling

Scales horizontally based on screen width.

**Use for:** Padding, margins, element widths

```tsx
// Static (in StyleSheet.create)
padding: scale(16)  // 16px on 393px screen, 13px on 320px, 17px on 428px

// Dynamic (in component)
const { scale } = useResponsive();
<View style={{ padding: scale(16) }} />
```

### 2. `moderateScale(size, factor)` — Dampened Scaling

Scales less aggressively. Default factor: 0.5 (50% dampening).

**Use for:** Typography (prevents oversized text on large screens)

```tsx
fontSize: moderateScale(18, 0.5)  // Scales by ~50% of full scaling
fontSize: moderateScale(18, 0.3)  // More subtle (30% scaling)
fontSize: moderateScale(18, 1.0)  // Full scaling (same as scale())
```

**Example:**
- iPhone SE (320px): `moderateScale(18, 0.5)` → ~16.5px
- iPhone 14 Pro (393px): `moderateScale(18, 0.5)` → 18px (base)
- iPhone Pro Max (428px): `moderateScale(18, 0.5)` → ~18.8px

### 3. `scaleCap(size, max)` — Maximum Ceiling

Scales up to a maximum value.

**Use for:** Card widths, image sizes, preventing oversized elements

```tsx
maxWidth: scaleCap(350, 400)  // Never exceeds 400px
width: scaleCap(300, 350)
```

### 4. `scaleMin(size, min)` — Minimum Floor

Scales down to a minimum value.

**Use for:** Touch targets (accessibility), button heights

```tsx
// iOS guideline: 44×44 minimum
minHeight: scaleMin(44, 44)

// Android guideline: 48×48 minimum
minHeight: scaleMin(48, 48)
```

### 5. `verticalScale(size)` — Vertical Scaling

Scales based on screen height (rare, use sparingly).

```tsx
height: verticalScale(200)
```

### 6. `useResponsive()` — Dynamic Hook

Recalculates on orientation change. Use in components with layout-sensitive values.

```tsx
const { scale, width, isSmallScreen, isLargeScreen } = useResponsive();

return (
  <View style={{ 
    padding: scale(16),
    // Adjust strategy for small screens
    flexDirection: isSmallScreen ? 'column' : 'row'
  }} />
);
```

---

## Best Practices by Use Case

### Typography

```tsx
// ✅ Use moderateScale with factor 0.4–0.6
fontSize: moderateScale(18, 0.5)
lineHeight: moderateScale(24, 0.5)

// ❌ Don't use full scale — text becomes too large
fontSize: scale(18)  // Too aggressive on Pro Max
```

### Spacing & Padding

```tsx
// ✅ Use scale for consistent spacing
padding: scale(16)
marginVertical: scale(12)
gap: scale(8)

// ✅ Use token references when possible
padding: theme.spacing.m  // Already scaled internally if needed
```

### Touch Targets (Buttons, Inputs)

```tsx
// ✅ Ensure minimum accessibility sizes
minHeight: scaleMin(44, 44)  // iOS guideline
minWidth: scaleMin(44, 44)

// Android guideline
minHeight: scaleMin(48, 48)
minWidth: scaleMin(48, 48)
```

### Card/Container Widths

```tsx
// ✅ Cap maximum width for readability
maxWidth: scaleCap(350, 400)

// ✅ Percentage-based with max cap
width: '90%',
maxWidth: scaleCap(380, 420)
```

### Border Widths, Shadows

```tsx
// ✅ Keep static — these are optical sizes
borderWidth: 1  // Always hairline
shadowRadius: 8  // Consistent depth
elevation: 4     // Android elevation
```

### Icons

```tsx
// ✅ Use moderate scaling for icons
width: moderateScale(24, 0.4)
height: moderateScale(24, 0.4)

// Or fixed sizes for small icons
width: 20  // Don't scale tiny icons
```

---

## Common Patterns

### Responsive Card

```tsx
import { scale, moderateScale, scaleCap, useTheme } from '@theme';

const styles = StyleSheet.create({
  card: {
    padding: scale(16),
    borderRadius: scale(12),
    maxWidth: scaleCap(350, 400),
    alignSelf: 'center',
  },
  title: {
    fontSize: moderateScale(20, 0.5),
    lineHeight: moderateScale(28, 0.5),
    marginBottom: scale(8),
  },
  button: {
    minHeight: scaleMin(44, 44),
    paddingHorizontal: scale(24),
    borderRadius: scale(8),
  },
});
```

### Device-Specific Adjustments

```tsx
const { isSmallScreen } = useResponsive();

const styles = StyleSheet.create({
  container: {
    padding: isSmallScreen ? scale(12) : scale(16),
    gap: isSmallScreen ? scale(8) : scale(12),
  },
});
```

### Dynamic Scaling in Components

```tsx
const MyComponent = () => {
  const { scale, moderateScale, isSmallScreen } = useResponsive();
  
  return (
    <View style={{ 
      padding: scale(16),
      gap: isSmallScreen ? scale(8) : scale(12)
    }}>
      <Text style={{ 
        fontSize: moderateScale(18, 0.5),
        lineHeight: moderateScale(24, 0.5)
      }}>
        Responsive Text
      </Text>
    </View>
  );
};
```

---

## Testing Checklist

### Visual Testing

Test on these device sizes (simulator or physical):

- [ ] iPhone SE (320×568) — smallest modern iPhone
- [ ] iPhone 13 Mini (375×812) — small form factor
- [ ] iPhone 14 (390×844) — most common size
- [ ] iPhone 14 Pro (393×852) — design baseline
- [ ] iPhone 14 Pro Max (428×926) — largest iPhone

**Android equivalents:**
- [ ] 360×640 (budget devices)
- [ ] 393×851 (Pixel 6)
- [ ] 412×915 (Galaxy S21)
- [ ] 428×926 (large flagship)

### Validation Criteria

- [ ] Typography is readable at all sizes (minimum 12px body text)
- [ ] Touch targets meet platform minimums (44×44 iOS, 48×48 Android)
- [ ] Spacing feels consistent, not cramped or excessive
- [ ] No text overflow or layout breaks
- [ ] Images/icons scale appropriately
- [ ] No jarring visual differences between devices

### Orientation Testing

- [ ] Landscape mode works correctly
- [ ] `useResponsive()` recalculates on rotation
- [ ] No layout breaks when rotating
- [ ] Maintains 60fps during rotation animation

### Accessibility

- [ ] Text meets WCAG AA contrast ratios at all sizes
- [ ] Touch targets accessible with large text enabled
- [ ] VoiceOver/TalkBack navigation works correctly
- [ ] System font size adjustments respected

---

## Performance Considerations

### Static vs. Dynamic Scaling

```tsx
// ✅ FAST: Static scaling (computed once at module load)
const styles = StyleSheet.create({
  container: {
    padding: scale(16),  // Computed once
  },
});

// ⚠️ SLOWER: Dynamic scaling (recomputes on re-render)
const MyComponent = () => {
  const { scale } = useResponsive();
  return <View style={{ padding: scale(16) }} />;  // Recomputes
};
```

**Recommendation:** Use static `scale()` in `StyleSheet.create()` blocks when possible. Use `useResponsive()` only when values need to update on orientation change.

### Memoization

```tsx
// ✅ Memoize expensive scale calculations
const scaledStyles = useMemo(() => ({
  container: {
    padding: scale(16),
    gap: scale(12),
  },
}), []);  // Only calculate once
```

---

## Migration from Old System

### Before (Mobile/Desktop tokens)

```tsx
// Old token structure
{
  "font.size.M": {
    "$value": { "Mobile": 18, "Desktop": 18 }
  }
}

// Old config had mc/mobile-value transform
```

### After (Simplified)

```tsx
// New token structure
{
  "font.size.M": {
    "$value": 18
  }
}

// Transform removed, values used directly
```

**No code changes required** — components continue working as-is. The generated tokens file now contains clean single values instead of extracting Mobile values.

---

## Troubleshooting

### Text too large on Pro Max

```tsx
// ❌ Problem
fontSize: scale(18)  // Scales fully → 19.6px on Pro Max

// ✅ Solution
fontSize: moderateScale(18, 0.5)  // Dampened → ~18.8px
```

### Touch targets too small on SE

```tsx
// ❌ Problem
height: scale(44)  // Scales down → 36px on SE (fails accessibility)

// ✅ Solution
minHeight: scaleMin(44, 44)  // Never below 44px
```

### Container too wide on Pro Max

```tsx
// ❌ Problem
width: scale(350)  // Scales to 381px on Pro Max

// ✅ Solution
maxWidth: scaleCap(350, 380)  // Caps at 380px
```

### Inconsistent spacing

```tsx
// ❌ Problem
padding: 16  // Fixed, doesn't scale

// ✅ Solution
padding: scale(16)  // Scales proportionally
// OR use theme tokens
padding: theme.spacing.m
```

---

## Token Reference

### Spacing Scale
```
XXS:  4px   (tight spacing, icon gaps)
XS:   8px   (small gaps, compact layouts)
S:    12px  (input padding, small margins)
M:    16px  (standard padding, card spacing)
L:    20px  (section spacing)
XL:   24px  (large gaps, header margins)
XXL:  32px  (section dividers)
XXXL: 40px  (screen margins, major divisions)
```

### Font Size Scale
```
XXS:  12px  (captions, footnotes)
XS:   14px  (small labels)
S:    16px  (body text standard)
M:    18px  (body emphasis)
L:    20px  (subheadings)
XL:   24px  (headings)
2XL:  28px  (large headings)
3XL:  32px  (display text)
4XL:  36px  (hero text)
5XL:  48px  (major display)
```

### Radius Scale
```
none: 0px   (sharp corners)
XXS:  4px   (subtle rounding)
XS:   8px   (buttons, inputs)
S:    12px  (cards, containers)
M:    16px  (prominent cards)
L:    20px  (large elements)
XL:   24px  (hero elements)
XXL:  100px (fully rounded, pills)
```

---

## When to Use Each Function

| Use Case | Function | Example |
|----------|----------|---------|
| Typography | `moderateScale(size, 0.4–0.6)` | `fontSize: moderateScale(18, 0.5)` |
| Spacing/Padding | `scale(size)` | `padding: scale(16)` |
| Touch Targets | `scaleMin(size, min)` | `minHeight: scaleMin(44, 44)` |
| Max Widths | `scaleCap(size, max)` | `maxWidth: scaleCap(350, 400)` |
| Border/Shadow | Static value | `borderWidth: 1` |
| Icons (small) | Static or moderate | `width: 20` or `moderateScale(24, 0.4)` |
| Orientation-aware | `useResponsive()` | `const { scale } = useResponsive()` |

---

## Related Documentation

- [design/README.md](./README.md) — Design system overview
- [design/DESIGN_SYSTEM_PLAN.md](./DESIGN_SYSTEM_PLAN.md) — Implementation roadmap
- [design/migration-guide.md](./migration-guide.md) — Component migration examples
- [src/theme/responsive.ts](../src/theme/responsive.ts) — Responsive utility implementation
- [src/theme/tokens.ts](../src/theme/tokens.ts) — Primitive token definitions

---

## Support

For questions or issues with responsive scaling:
1. Check this guide first
2. Review `src/theme/responsive.ts` implementation
3. Test on multiple device sizes in simulator
4. Validate touch target sizes meet platform guidelines
