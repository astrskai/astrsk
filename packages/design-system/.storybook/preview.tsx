import React from 'react';
import type { Preview } from '@storybook/react-vite';
import { themes } from 'storybook/theming';
import ThemedDocsContainer from './DocsContainer';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      container: ThemedDocsContainer,
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },

    darkMode: {
      // Set the initial theme
      current: 'dark',
      // Override the default dark theme
      dark: { ...themes.dark, appBg: '#111111', appContentBg: '#1b1b1b' },
      // Override the default light theme
      light: { ...themes.normal, appBg: '#ffffff', appContentBg: '#f5f5f5' },
      // Class names to apply
      darkClass: 'dark',
      lightClass: 'light',
      // Apply class to preview iframe body
      stylePreview: true,
    },
  },
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'var(--font-family-sans)' }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
