import type { Preview } from '@storybook/react-vite'
import '../src/app/styles/global.css'
import React from 'react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'surface-1',
      values: [
        {
          name: 'surface-0',
          value: '#111111',
        },
        {
          name: 'surface-1',
          value: '#1b1b1b',
        },
        {
          name: 'surface-2',
          value: '#272727',
        },
        {
          name: 'surface-3',
          value: '#313131',
        },
        {
          name: 'surface-4',
          value: '#414141',
        },
        {
          name: 'surface-5',
          value: '#757575',
        },
        {
          name: 'surface-light',
          value: '#e9f6fe',
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
};

export default preview;