import React from 'react';
import { DocsContainer } from '@storybook/addon-docs/blocks';
import { themes } from 'storybook/theming';
import { useIsDarkMode } from './hooks/useIsDarkMode';

const ThemedDocsContainer = ({ children, ...props }) => {
  const isDarkMode = useIsDarkMode();

  return (
    <DocsContainer
      theme={isDarkMode ? themes.dark : themes.light}
      context={props.context}
    >
      {children}
    </DocsContainer>
  );
};

export default ThemedDocsContainer;
