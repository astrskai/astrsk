import{j as n,M as r}from"./iframe-D-dWrFNZ.js";import{useMDXComponents as i}from"./index-0Urqw4pG.js";import"./preload-helper-CwRszBsw.js";function t(s){const e={code:"code",h1:"h1",h2:"h2",h3:"h3",hr:"hr",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...i(),...s.components};return n.jsxs(n.Fragment,{children:[n.jsx(r,{title:"Introduction"}),`
`,n.jsx(e.h1,{id:"astrsk-design-system",children:"Astrsk Design System"}),`
`,n.jsx(e.p,{children:"A modern React component library."}),`
`,n.jsx(e.hr,{}),`
`,n.jsx(e.h2,{id:"tech-stack",children:"Tech Stack"}),`
`,n.jsxs(e.ul,{children:[`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"React 18/19"})," - Modern React with hooks"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"TypeScript"})," - Type-safe component development"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Tailwind CSS v4"})," - Utility-first CSS framework"]}),`
`,n.jsxs(e.li,{children:[n.jsx(e.strong,{children:"Storybook 9"})," - Component documentation"]}),`
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
`})})]})}function a(s={}){const{wrapper:e}={...i(),...s.components};return e?n.jsx(e,{...s,children:n.jsx(t,{...s})}):t(s)}export{a as default};
