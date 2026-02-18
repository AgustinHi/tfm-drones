import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup después de cada test
afterEach(() => {
  cleanup();
});

// Mock de i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, { defaultValue }) => defaultValue || key,
    i18n: {
      resolvedLanguage: 'es',
      language: 'es',
    },
  }),
}));

// Mock de react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  BrowserRouter: ({ children }) => children,
}));
