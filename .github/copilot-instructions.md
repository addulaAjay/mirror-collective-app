# GitHub Copilot Instructions for Mirror Collective App

## Project Overview

This is a React Native application for Mirror Collective. When providing code suggestions and implementations, please follow these standards and guidelines.

## Technology Stack

- **Framework**: React Native with React Native Web
- **Language**: TypeScript
- **Platform**: iOS, Android, and Web
- **Package Manager**: npm
- **Build Tool**: Metro Bundler (mobile), Webpack (web)
- **Testing**: Jest
- **Web Integration**: React Native Web for cross-platform compatibility

## Code Standards & Implementation Guidelines

### 1. TypeScript Standards

- Always use TypeScript with strict type checking
- Define proper interfaces and types for all data structures
- Use meaningful type names with PascalCase (e.g., `UserProfile`, `ApiResponse`)
- Avoid `any` type - use proper typing or `unknown` when necessary
- Export types and interfaces from dedicated type files

### 2. Component Structure

- Use functional components with React Hooks
- Follow the component file structure:
  ```
  ComponentName/
    ├── index.ts          // Re-export
    ├── ComponentName.tsx // Main component
    ├── types.ts         // Component-specific types
    └── styles.ts        // StyleSheet definitions
  ```
- Use PascalCase for component names
- Use camelCase for props and state variables

### 3. React Native & Web Best Practices

- Use StyleSheet.create() for styling instead of inline styles
- Implement responsive design using Dimensions API, flexbox, or CSS-in-JS for web
- Use appropriate React Native components (View, Text, TouchableOpacity, etc.)
- Handle platform differences with Platform.OS when necessary (iOS, Android, Web)
- Use React Native Web compatible components and APIs
- Avoid platform-specific libraries when possible; use cross-platform alternatives
- Test web compatibility regularly during development
- Optimize performance with React.memo, useMemo, and useCallback when appropriate
- Use web-safe navigation patterns for React Native Web

### 4. State Management

- Use React Hooks (useState, useEffect, useContext) for local state
- Implement custom hooks for reusable logic
- Use useReducer for complex state logic
- Consider React Context for global state that doesn't require external libraries

### 5. File and Folder Organization

```
src/
├── components/        # Reusable UI components
├── screens/          # Screen components
├── navigation/       # Navigation configuration
├── services/         # API calls and external services
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── types/           # Global TypeScript types
├── constants/       # App constants
└── assets/          # Images, fonts, etc.
```

### 6. Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Functions**: camelCase (e.g., `handleUserLogin`, `validateEmail`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`, `DEFAULT_TIMEOUT`)
- **Interfaces**: PascalCase with descriptive names (e.g., `UserData`, `ApiResponse`)

### 7. Error Handling

- Always implement proper error boundaries
- Use try-catch blocks for async operations
- Provide meaningful error messages to users
- Log errors appropriately for debugging
- Handle network failures gracefully

### 8. Performance Guidelines

- Use FlatList for large lists instead of ScrollView
- Implement lazy loading for images
- Minimize re-renders with proper dependency arrays
- Use React Native's built-in optimization tools
- Profile performance using Flipper or React DevTools

### 9. Testing Standards

- Write unit tests for utility functions
- Test component rendering and user interactions
- Mock external dependencies and API calls
- Aim for meaningful test coverage, not just high percentages
- Use descriptive test names that explain the expected behavior

### 10. Clean Code Standards & Code Quality

- **SOLID Principles**: Follow Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles
- **DRY (Don't Repeat Yourself)**: Extract common functionality into reusable utilities and components
- **KISS (Keep It Simple, Stupid)**: Write simple, understandable code over clever solutions
- **YAGNI (You Aren't Gonna Need It)**: Don't add functionality until it's actually needed
- **Meaningful Names**: Use descriptive names for variables, functions, and components
- **Function Size**: Keep functions small (ideally under 20 lines) and focused on single responsibilities
- **Code Comments**: Write comments that explain WHY, not WHAT the code does
- **Consistent Indentation**: Use 2 spaces for indentation consistently
- **Remove Dead Code**: Delete unused imports, variables, and functions
- **Use ESLint and Prettier** for consistent code formatting and catching potential issues
- **Refactor Regularly**: Continuously improve code structure and readability
- **Avoid Deep Nesting**: Use early returns and guard clauses to reduce nesting levels
- **Separate Concerns**: Keep business logic separate from UI components
- **Pure Functions**: Prefer pure functions that don't have side effects when possible

### 11. Security Best Practices

- Never commit sensitive data (API keys, secrets) to version control
- Use environment variables for configuration
- Validate all user inputs
- Implement proper authentication and authorization
- Use HTTPS for all network requests

### 12. Accessibility

- Add accessibility labels and hints to interactive elements
- Ensure proper color contrast for text
- Support screen readers and assistive technologies
- Test with accessibility tools

## When Implementing Features

1. **Always consider mobile-first design principles**
2. **Test on both iOS and Android platforms**
3. **Ensure web compatibility with React Native Web**
4. **Implement proper loading states and error handling**
5. **Follow the existing code patterns in the project**
6. **Write clean, readable, and maintainable code**
7. **Consider performance implications of your implementation**
8. **Add appropriate logging and debugging information**
9. **Apply clean code principles (SOLID, DRY, KISS, YAGNI)**
10. **Write self-documenting code with clear naming conventions**

## API Integration Guidelines

- Use async/await pattern for API calls
- Implement proper error handling for network requests
- Use TypeScript interfaces for API response types
- Cache data when appropriate to improve performance
- Handle offline scenarios gracefully

## Documentation Requirements

- Document complex business logic
- Provide clear README updates for new features
- Include setup instructions for new dependencies
- Document environment variables and configuration

## React Native Web Setup

For web platform support, ensure the following packages are installed:

- `react-native-web`: Core web compatibility layer
- `react-dom`: Required for web rendering
- `webpack`: Web bundler for production builds
- `babel-loader`: Transpilation for web builds

Web-specific considerations:

- Use `Platform.OS === 'web'` for web-specific code
- Test responsive design across different screen sizes
- Ensure accessibility standards are met for web
- Optimize bundle size for web performance
- Use web-safe fonts and assets

---

**Note**: These instructions should be followed for all code suggestions and implementations within this React Native Mirror Collective App workspace. When in doubt, prioritize code clarity, maintainability, and React Native best practices.
