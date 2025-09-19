import React from 'react';
import { IDockviewPanelHeaderProps } from 'dockview';

// Hidden tab component - renders nothing
const HiddenTab = React.memo(() => {
  return null;
});

HiddenTab.displayName = 'HiddenTab';

export default HiddenTab;