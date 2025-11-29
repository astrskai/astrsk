import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    base: 'dark',
    brandTitle: 'astrsk Design System',
    brandUrl: 'https://github.com/astrskai/astrsk',
    brandImage: '/astrsk-logo.svg',
    brandTarget: '_blank',
  }),
});
