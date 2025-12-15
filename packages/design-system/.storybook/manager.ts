import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// Use relative path for GitHub Pages compatibility
// './' works for both local dev and deployed environments
addons.setConfig({
  theme: create({
    base: 'dark',
    brandTitle: 'astrsk Design System',
    brandUrl: 'https://github.com/astrskai/astrsk',
    brandImage: './astrsk-logo.svg',
    brandTarget: '_blank',
  }),
});
