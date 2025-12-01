import{r as O,j as e}from"./iframe-VINGRqCx.js";import{c as b}from"./utils-DuMXYCiK.js";import{I as g}from"./Input-CMCJi3Hu.js";import{c as r}from"./createLucideIcon-CxqYMi1z.js";import"./preload-helper-CwRszBsw.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],G=r("calendar",B);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J=[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]],K=r("credit-card",J);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],F=r("lock",Q);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const X=[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]],H=r("mail",X);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Y=[["path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",key:"foiqr5"}]],Z=r("phone",Y);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]],m=r("search",ee);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ae=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]],re=r("user",ae),a=O.forwardRef(({icon:o,iconPosition:h="left",className:u,...x},y)=>o?e.jsxs("div",{className:"relative",children:[e.jsx("div",{className:b("pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]","[&_svg]:size-4",h==="left"?"left-3":"right-3"),children:o}),e.jsx(g,{ref:y,className:b(h==="left"&&"pl-9",h==="right"&&"pr-9",u),...x})]}):e.jsx(g,{ref:y,className:u,...x}));a.displayName="IconInput";a.__docgenInfo={description:`IconInput Component

An Input wrapper that displays an icon inside the input field.
Useful for search inputs, email inputs, password inputs, etc.

@example
\`\`\`tsx
import { Search, Mail, Lock } from 'lucide-react';

<IconInput icon={<Search className="size-4" />} placeholder="Search..." />
<IconInput icon={<Mail className="size-4" />} type="email" placeholder="Email" />
<IconInput icon={<Lock className="size-4" />} iconPosition="right" type="password" />
\`\`\``,methods:[],displayName:"IconInput",props:{icon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Icon to display inside the input"},iconPosition:{required:!1,tsType:{name:"union",raw:"'left' | 'right'",elements:[{name:"literal",value:"'left'"},{name:"literal",value:"'right'"}]},description:"Position of the icon",defaultValue:{value:"'left'",computed:!1}}}};const ie={title:"Form Inputs/IconInput",component:a,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{icon:{control:!1,description:"Icon to display inside the input"},iconPosition:{control:"radio",options:["left","right"],description:"Position of the icon",table:{defaultValue:{summary:"left"}}},placeholder:{control:"text",description:"Placeholder text"},disabled:{control:"boolean",description:"Whether the input is disabled"},type:{control:"select",options:["text","email","password","search","tel","url"],description:"Input type"}},decorators:[o=>e.jsx("div",{style:{width:"320px"},children:e.jsx(o,{})})]},s={name:"Search",args:{icon:e.jsx(m,{}),placeholder:"Search...",type:"search"}},t={args:{icon:e.jsx(H,{}),placeholder:"Enter your email",type:"email"}},c={args:{icon:e.jsx(F,{}),iconPosition:"right",placeholder:"Enter password",type:"password"}},n={args:{icon:e.jsx(re,{}),placeholder:"Username"}},i={args:{icon:e.jsx(Z,{}),placeholder:"Phone number",type:"tel"}},l={args:{icon:e.jsx(m,{}),placeholder:"Disabled input",disabled:!0}},d={args:{placeholder:"Regular input without icon"}},p={args:{icon:e.jsx(m,{}),placeholder:"Search..."},decorators:[()=>e.jsxs("div",{className:"flex flex-col gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Search"}),e.jsx(a,{icon:e.jsx(m,{}),placeholder:"Search..."})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Email"}),e.jsx(a,{icon:e.jsx(H,{}),type:"email",placeholder:"email@example.com"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Password (icon right)"}),e.jsx(a,{icon:e.jsx(F,{}),iconPosition:"right",type:"password",placeholder:"Password"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Credit Card"}),e.jsx(a,{icon:e.jsx(K,{}),placeholder:"Card number"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Date"}),e.jsx(a,{icon:e.jsx(G,{}),placeholder:"Select date"})]})]})]};var j,v,I;s.parameters={...s.parameters,docs:{...(j=s.parameters)==null?void 0:j.docs,source:{originalSource:`{
  name: 'Search',
  args: {
    icon: <Search />,
    placeholder: 'Search...',
    type: 'search'
  }
}`,...(I=(v=s.parameters)==null?void 0:v.docs)==null?void 0:I.source}}};var f,k,N;t.parameters={...t.parameters,docs:{...(f=t.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    icon: <Mail />,
    placeholder: 'Enter your email',
    type: 'email'
  }
}`,...(N=(k=t.parameters)==null?void 0:k.docs)==null?void 0:N.source}}};var S,w,_;c.parameters={...c.parameters,docs:{...(S=c.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    icon: <Lock />,
    iconPosition: 'right',
    placeholder: 'Enter password',
    type: 'password'
  }
}`,...(_=(w=c.parameters)==null?void 0:w.docs)==null?void 0:_.source}}};var P,z,C;n.parameters={...n.parameters,docs:{...(P=n.parameters)==null?void 0:P.docs,source:{originalSource:`{
  args: {
    icon: <User />,
    placeholder: 'Username'
  }
}`,...(C=(z=n.parameters)==null?void 0:z.docs)==null?void 0:C.source}}};var E,M,L;i.parameters={...i.parameters,docs:{...(E=i.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    icon: <Phone />,
    placeholder: 'Phone number',
    type: 'tel'
  }
}`,...(L=(M=i.parameters)==null?void 0:M.docs)==null?void 0:L.source}}};var R,U,D;l.parameters={...l.parameters,docs:{...(R=l.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    icon: <Search />,
    placeholder: 'Disabled input',
    disabled: true
  }
}`,...(D=(U=l.parameters)==null?void 0:U.docs)==null?void 0:D.source}}};var $,q,A;d.parameters={...d.parameters,docs:{...($=d.parameters)==null?void 0:$.docs,source:{originalSource:`{
  args: {
    placeholder: 'Regular input without icon'
  }
}`,...(A=(q=d.parameters)==null?void 0:q.docs)==null?void 0:A.source}}};var V,T,W;p.parameters={...p.parameters,docs:{...(V=p.parameters)==null?void 0:V.docs,source:{originalSource:`{
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
}`,...(W=(T=p.parameters)==null?void 0:T.docs)==null?void 0:W.source}}};const le=["Search_","Email","Password","Username","PhoneNumber","Disabled","WithoutIcon","AllVariants"];export{p as AllVariants,l as Disabled,t as Email,c as Password,i as PhoneNumber,s as Search_,n as Username,d as WithoutIcon,le as __namedExportsOrder,ie as default};
