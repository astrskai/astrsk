import type { StorybookConfig } from '@storybook/react-vite';

import { createRequire } from 'module';
import { join, dirname } from 'path';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  const require = createRequire(import.meta.url);
  return dirname(require.resolve(join(value, 'package.json')));
}
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../public'],
  addons: [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-a11y'),
    // getAbsolutePath('@storybook/addon-vitest'), // Run tests
    getAbsolutePath('@vueless/storybook-dark-mode'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  viteFinal: async (config, { configType }) => {
    // Set base path for GitHub Pages deployment
    // configType is 'DEVELOPMENT' or 'PRODUCTION'
    if (configType === 'PRODUCTION') {
      config.base = '/astrsk/design-system/';
    }
    return config;
  },
};
export default config;
