import{r as m,j as t}from"./iframe-hUBzdzut.js";import{c as n}from"./utils-DuMXYCiK.js";import{i as f}from"./input-styles-6Rn9HMys.js";const c=m.forwardRef(({icon:e,iconPosition:a="left",onIconClick:s,iconAriaLabel:p,className:u,type:i="text",...l},o)=>{const r=n(f,e&&a==="left"?"pl-9 pr-3":"",e&&a==="right"?"pl-3 pr-9":"",!e&&"px-3",u);if(!e)return t.jsx("input",{type:i,ref:o,"data-slot":"input",className:r,...l});const d=!!s;return t.jsxs("div",{className:"relative",children:[d?t.jsx("button",{type:"button",onClick:s,"aria-label":p,className:n("absolute top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]","[&_svg]:size-4",a==="left"?"left-3":"right-3","cursor-pointer hover:text-[var(--fg-default)] transition-colors"),children:e}):t.jsx("div",{className:n("pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]","[&_svg]:size-4",a==="left"?"left-3":"right-3"),children:e}),t.jsx("input",{type:i,ref:o,"data-slot":"input",className:r,...l})]})});c.displayName="IconInput";c.__docgenInfo={description:`IconInput Component

An Input component that displays an icon inside the input field.
Useful for search inputs, email inputs, password inputs, etc.

@example
\`\`\`tsx
import { Search, Mail, Lock } from 'lucide-react';

<IconInput icon={<Search className="size-4" />} placeholder="Search..." />
<IconInput icon={<Mail className="size-4" />} type="email" placeholder="Email" />
<IconInput icon={<Lock className="size-4" />} iconPosition="right" type="password" />
<IconInput icon={<Eye className="size-4" />} iconPosition="right" onIconClick={() => {}} />
\`\`\``,methods:[],displayName:"IconInput",props:{icon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Icon to display inside the input"},iconPosition:{required:!1,tsType:{name:"union",raw:"'left' | 'right'",elements:[{name:"literal",value:"'left'"},{name:"literal",value:"'right'"}]},description:"Position of the icon",defaultValue:{value:"'left'",computed:!1}},onIconClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Callback when icon is clicked (makes icon clickable)"},iconAriaLabel:{required:!1,tsType:{name:"string"},description:"Accessible label for the clickable icon button"},type:{defaultValue:{value:"'text'",computed:!1},required:!1}}};export{c as I};
