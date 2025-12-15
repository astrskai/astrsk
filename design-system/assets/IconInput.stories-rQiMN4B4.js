import{r as ce,j as e}from"./iframe-DpOJYBjt.js";import{c as r}from"./utils-CF6QUdYH.js";import{i as ie}from"./input-styles-z0NdvNUJ.js";import{c as n}from"./createLucideIcon-gHw0okDa.js";import{L as K}from"./lock-yV83BfWz.js";import{U as le}from"./user-5Wq7UKTk.js";import"./preload-helper-CwRszBsw.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const de=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],pe=n("calendar",de);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const me=[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]],ue=n("credit-card",me);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const he=[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]],Q=n("mail",he);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe=[["path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",key:"foiqr5"}]],be=n("phone",xe);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ge=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]],g=n("search",ge),a=ce.forwardRef(({icon:c,iconPosition:i="left",onIconClick:y,iconAriaLabel:I,leftIcon:s,rightIcon:o,onRightIconClick:j,rightIconAriaLabel:X,className:Y,type:Z="text",...ee},ae)=>{const te=s||i==="left",re=o||i==="right",N=!!y,se=!!j,oe=()=>{const t=s||(i==="left"?c:null);if(!t)return null;const f=s?!1:N,v=s?void 0:y,k=s?void 0:I;return f?e.jsx("button",{type:"button",onClick:v,"aria-label":k,tabIndex:-1,className:r("absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]","[&_svg]:size-4","cursor-pointer transition-colors hover:text-[var(--fg-default)]"),children:t}):e.jsx("div",{className:r("pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]","[&_svg]:size-4"),children:t})},ne=()=>{const t=o||(i==="right"?c:null);if(!t)return null;const f=o?se:N,v=o?j:y,k=o?X:I;return f?e.jsx("button",{type:"button",onClick:v,"aria-label":k,tabIndex:-1,className:r("absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]","[&_svg]:size-4","cursor-pointer transition-colors hover:text-[var(--fg-default)]"),children:t}):e.jsx("div",{className:r("pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]","[&_svg]:size-4"),children:t})};return e.jsxs("div",{className:r("relative",Y),children:[oe(),ne(),e.jsx("input",{type:Z,ref:ae,"data-slot":"input",className:r(ie,te?"pl-9":"pl-3",re?"pr-9":"pr-3"),...ee})]})});a.displayName="IconInput";a.__docgenInfo={description:`IconInput Component

An Input component that displays an icon inside the input field.
Useful for search inputs, email inputs, password inputs, etc.

@example
\`\`\`tsx
import { Search, Mail, Lock } from 'lucide-react';

<IconInput icon={<Search className="size-4" />} placeholder="Search..." />
<IconInput icon={<Mail className="size-4" />} type="email" placeholder="Email" />
<IconInput icon={<Lock className="size-4" />} iconPosition="right" type="password" />
<IconInput icon={<Eye className="size-4" />} iconPosition="right" onIconClick={() => {}} />
\`\`\``,methods:[],displayName:"IconInput",props:{icon:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Icon to display inside the input (required)"},iconPosition:{required:!1,tsType:{name:"union",raw:"'left' | 'right'",elements:[{name:"literal",value:"'left'"},{name:"literal",value:"'right'"}]},description:"Position of the icon",defaultValue:{value:"'left'",computed:!1}},onIconClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Callback when icon is clicked (makes icon clickable)"},iconAriaLabel:{required:!1,tsType:{name:"string"},description:"Accessible label for the clickable icon button"},leftIcon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Icon to display on the left side (additional to main icon)"},rightIcon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Icon to display on the right side (additional to main icon)"},onRightIconClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Callback when right icon is clicked"},rightIconAriaLabel:{required:!1,tsType:{name:"string"},description:"Accessible label for the right icon button"},type:{defaultValue:{value:"'text'",computed:!1},required:!1}}};const Se={title:"Form Inputs/IconInput",component:a,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{icon:{control:!1,description:"Icon to display inside the input"},iconPosition:{control:"radio",options:["left","right"],description:"Position of the icon",table:{defaultValue:{summary:"left"}}},placeholder:{control:"text",description:"Placeholder text"},disabled:{control:"boolean",description:"Whether the input is disabled"},type:{control:"select",options:["text","email","password","search","tel","url"],description:"Input type"}},decorators:[c=>e.jsx("div",{style:{width:"320px"},children:e.jsx(c,{})})]},l={name:"Search",args:{icon:e.jsx(g,{}),placeholder:"Search...",type:"search"}},d={args:{icon:e.jsx(Q,{}),placeholder:"Enter your email",type:"email"}},p={args:{icon:e.jsx(K,{}),iconPosition:"right",placeholder:"Enter password",type:"password"}},m={args:{icon:e.jsx(le,{}),placeholder:"Username"}},u={args:{icon:e.jsx(be,{}),placeholder:"Phone number",type:"tel"}},h={args:{icon:e.jsx(g,{}),placeholder:"Disabled input",disabled:!0}},x={args:{placeholder:"Regular input without icon"}},b={args:{icon:e.jsx(g,{}),placeholder:"Search..."},decorators:[()=>e.jsxs("div",{className:"flex flex-col gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Search"}),e.jsx(a,{icon:e.jsx(g,{}),placeholder:"Search..."})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Email"}),e.jsx(a,{icon:e.jsx(Q,{}),type:"email",placeholder:"email@example.com"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Password (icon right)"}),e.jsx(a,{icon:e.jsx(K,{}),iconPosition:"right",type:"password",placeholder:"Password"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Credit Card"}),e.jsx(a,{icon:e.jsx(ue,{}),placeholder:"Card number"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Date"}),e.jsx(a,{icon:e.jsx(pe,{}),placeholder:"Select date"})]})]})]};var S,w,C;l.parameters={...l.parameters,docs:{...(S=l.parameters)==null?void 0:S.docs,source:{originalSource:`{
  name: 'Search',
  args: {
    icon: <Search />,
    placeholder: 'Search...',
    type: 'search'
  }
}`,...(C=(w=l.parameters)==null?void 0:w.docs)==null?void 0:C.source}}};var R,z,P;d.parameters={...d.parameters,docs:{...(R=d.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    icon: <Mail />,
    placeholder: 'Enter your email',
    type: 'email'
  }
}`,...(P=(z=d.parameters)==null?void 0:z.docs)==null?void 0:P.source}}};var _,L,q;p.parameters={...p.parameters,docs:{...(_=p.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    icon: <Lock />,
    iconPosition: 'right',
    placeholder: 'Enter password',
    type: 'password'
  }
}`,...(q=(L=p.parameters)==null?void 0:L.docs)==null?void 0:q.source}}};var E,T,M;m.parameters={...m.parameters,docs:{...(E=m.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    icon: <User />,
    placeholder: 'Username'
  }
}`,...(M=(T=m.parameters)==null?void 0:T.docs)==null?void 0:M.source}}};var A,U,D;u.parameters={...u.parameters,docs:{...(A=u.parameters)==null?void 0:A.docs,source:{originalSource:`{
  args: {
    icon: <Phone />,
    placeholder: 'Phone number',
    type: 'tel'
  }
}`,...(D=(U=u.parameters)==null?void 0:U.docs)==null?void 0:D.source}}};var V,$,W;h.parameters={...h.parameters,docs:{...(V=h.parameters)==null?void 0:V.docs,source:{originalSource:`{
  args: {
    icon: <Search />,
    placeholder: 'Disabled input',
    disabled: true
  }
}`,...(W=($=h.parameters)==null?void 0:$.docs)==null?void 0:W.source}}};var H,B,F;x.parameters={...x.parameters,docs:{...(H=x.parameters)==null?void 0:H.docs,source:{originalSource:`{
  args: {
    placeholder: 'Regular input without icon'
  }
}`,...(F=(B=x.parameters)==null?void 0:B.docs)==null?void 0:F.source}}};var O,G,J;b.parameters={...b.parameters,docs:{...(O=b.parameters)==null?void 0:O.docs,source:{originalSource:`{
  args: {
    icon: <Search />,
    placeholder: 'Search...'
  },
  decorators: [() => <div className="flex flex-col gap-4">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Search</label>
          <IconInput icon={<Search />} placeholder="Search..." />
        </div>
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Email</label>
          <IconInput icon={<Mail />} type="email" placeholder="email@example.com" />
        </div>
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Password (icon right)</label>
          <IconInput icon={<Lock />} iconPosition="right" type="password" placeholder="Password" />
        </div>
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Credit Card</label>
          <IconInput icon={<CreditCard />} placeholder="Card number" />
        </div>
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Date</label>
          <IconInput icon={<Calendar />} placeholder="Select date" />
        </div>
      </div>]
}`,...(J=(G=b.parameters)==null?void 0:G.docs)==null?void 0:J.source}}};const we=["Search_","Email","Password","Username","PhoneNumber","Disabled","WithoutIcon","AllVariants"];export{b as AllVariants,h as Disabled,d as Email,p as Password,u as PhoneNumber,l as Search_,m as Username,x as WithoutIcon,we as __namedExportsOrder,Se as default};
