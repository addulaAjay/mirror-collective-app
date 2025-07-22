export const SHADOWS = {
  LIGHT: {
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  MEDIUM: {
    shadowColor: 'rgba(0, 0, 0, 0.21)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 12,
  },
  HEAVY: {
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 19,
    elevation: 19,
  },
  CONTAINER: {
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: -1, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 26,
  },
  GLOW: {
    shadowColor: '#e5d6b0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
} as const;