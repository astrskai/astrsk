import{j as n,M as t}from"./iframe-DAkvFKvn.js";import{useMDXComponents as i}from"./index-Df-a29jF.js";import"./preload-helper-CwRszBsw.js";function r(s){const e={code:"code",h1:"h1",h2:"h2",h3:"h3",hr:"hr",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...i(),...s.components};return n.jsxs(n.Fragment,{children:[n.jsx(t,{title:"Introduction"}),`
`,n.jsx(e.h1,{id:"astrsk-design-system",children:"Astrsk Design System"}),`
`,n.jsx(e.p,{children:"A modern React component library."}),`
`,n.jsx(e.hr,{}),`
`,n.jsx(e.h2,{id:"tech-stack",children:"Tech Stack"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"React 18/19"})," - Modern React with hooks"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"TypeScript"})," - Type-safe component development"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Tailwind CSS v4"})," - Utility-first CSS framework"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Storybook 10"})," - Component documentation"]}),`
`]}),`
`,n.jsx(e.hr,{}),`
`,n.jsx(e.h2,{id:"installation",children:"Installation"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-bash",children:`npm install @astrsk/design-system
# or
pnpm add @astrsk/design-system
`})}),`
`,n.jsx(e.hr,{}),`
`,n.jsx(e.h2,{id:"usage",children:"Usage"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-tsx",children:`// 1. Import styles once in your app's entry point
import '@astrsk/design-system/styles';

// 2. Import components and utilities
import { cn } from '@astrsk/design-system';
`})}),`
`,n.jsx(e.hr,{}),`
`,n.jsx(e.h2,{id:"documentation",children:"Documentation"}),`
`,n.jsx(e.p,{children:"Browse each section in the sidebar:"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Tokens/Colors"})," - Color palette and semantic tokens"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Tokens/Typography"})," - Fonts, sizes, weights"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Components"})," - UI components (coming soon)"]}),`
`]}),`
`,n.jsx(e.hr,{}),`
`,n.jsx(e.h2,{id:"design-principles",children:"Design Principles"}),`
`,n.jsx(e.h3,{id:"1-semantic-tokens",children:"1. Semantic Tokens"}),`
`,n.jsx(e.p,{children:"All colors are defined as semantic tokens with automatic dark/light theme support."}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-css",children:`/* Primitive (avoid direct use) */
var(--color-neutral-900)

/* Semantic (recommended) */
var(--bg-surface)
var(--fg-default)
var(--border-default)
`})}),`
`,n.jsx(e.h3,{id:"2-theme-support",children:"2. Theme Support"}),`
`,n.jsxs(e.p,{children:["Dark theme by default. Use ",n.jsx(e.code,{children:".light"})," class to switch to light theme:"]}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-html",children:`<html class="light">
  <!-- Light theme -->
</html>
`})}),`
`,n.jsx(e.h3,{id:"3-tailwind-integration",children:"3. Tailwind Integration"}),`
`,n.jsx(e.p,{children:"All tokens are also available as Tailwind utilities:"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-html",children:`<div class="bg-surface text-fg-default border-border-default">
  ...
</div>
`})}),`
`,n.jsx(e.hr,{}),`
`,n.jsx(e.h2,{id:"customization",children:"Customization"}),`
`,n.jsx(e.p,{children:"All components use CSS variables, making it easy to customize colors and styles for your project."}),`
`,n.jsx(e.h3,{id:"override-theme-variables",children:"Override Theme Variables"}),`
`,n.jsx(e.p,{children:"Simply redefine the CSS variables in your app:"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-css",children:`/* Your app's global CSS */
:root {
  /* Change input styles */
  --input-bg: #1e1e2e;
  --input-border: #45475a;

  /* Change button colors */
  --btn-primary-bg: #89b4fa;
  --btn-primary-fg: #1e1e2e;

  /* Change semantic colors */
  --bg-surface: #181825;
  --fg-default: #cdd6f4;
}
`})}),`
`,n.jsx(e.h3,{id:"brand-color",children:"Brand Color"}),`
`,n.jsx(e.p,{children:"Change the primary brand color across all components:"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-css",children:`:root {
  /* Your brand colors (e.g., purple theme) */
  --color-brand-700: #6b21a8;
  --color-brand-600: #7c3aed;
  --color-brand-500: #8b5cf6;
  --color-brand-400: #a78bfa;
  --color-brand-300: #c4b5fd;
}
`})}),`
`,n.jsx(e.p,{children:"This automatically updates buttons, focus rings, accents, and other branded elements."}),`
`,n.jsx(e.h3,{id:"darklight-theme-support",children:"Dark/Light Theme Support"}),`
`,n.jsx(e.pre,{children:n.jsx(e.code,{className:"language-css",children:`/* Dark theme (default) */
:root {
  --bg-canvas: #000000;
  --fg-default: #ffffff;
}

/* Light theme */
.light {
  --bg-canvas: #ffffff;
  --fg-default: #1a1a1a;
}
`})}),`
`,n.jsx(e.h3,{id:"available-token-categories",children:"Available Token Categories"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Background"}),": ",n.jsx(e.code,{children:"--bg-canvas"}),", ",n.jsx(e.code,{children:"--bg-surface"}),", ",n.jsx(e.code,{children:"--bg-elevated"})]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Foreground"}),": ",n.jsx(e.code,{children:"--fg-default"}),", ",n.jsx(e.code,{children:"--fg-muted"}),", ",n.jsx(e.code,{children:"--fg-subtle"})]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Border"}),": ",n.jsx(e.code,{children:"--border-default"}),", ",n.jsx(e.code,{children:"--border-focus"})]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Input"}),": ",n.jsx(e.code,{children:"--input-bg"}),", ",n.jsx(e.code,{children:"--input-border"})]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Button"}),": ",n.jsx(e.code,{children:"--btn-primary-bg"}),", ",n.jsx(e.code,{children:"--btn-primary-fg"})]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Status"}),": ",n.jsx(e.code,{children:"--color-status-error"}),", ",n.jsx(e.code,{children:"--color-status-success"})]}),`
`]}),`
`,n.jsxs(e.p,{children:["See the full list in ",n.jsx(e.strong,{children:"Tokens/Colors"})," section."]})]})}function d(s={}){const{wrapper:e}={...i(),...s.components};return e?n.jsx(e,{...s,children:n.jsx(r,{...s})}):r(s)}export{d as default};
