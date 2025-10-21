import React from 'react';
import { DocsContainer } from '@storybook/addon-docs/blocks';
import { useIsDarkMode } from './hooks/useIsDarkMode';
import { themes } from 'storybook/theming';

function ThemedDocsContainer(props) {
  const isDarkMode = useIsDarkMode();

  return (
    <DocsContainer
      theme={isDarkMode ? themes.dark : themes.light}
      context={props.context}
    >
      {props.children}
    </DocsContainer>
  );
}

export const parameters = {
  docs: {
    container: ThemedDocsContainer,
  },
};
