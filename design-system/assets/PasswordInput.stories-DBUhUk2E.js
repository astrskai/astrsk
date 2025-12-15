import{r as N,j as e}from"./iframe-DpOJYBjt.js";import{c as s}from"./utils-CF6QUdYH.js";import{i as qe}from"./input-styles-z0NdvNUJ.js";import{c as be}from"./createLucideIcon-gHw0okDa.js";import{L as Ne}from"./Label-DksQQhos.js";import{L}from"./lock-yV83BfWz.js";import"./preload-helper-CwRszBsw.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Se=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],We=be("eye-off",Se);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ke=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],Re=be("eye",ke),o=N.forwardRef(({leftIcon:y,label:a,hint:n,error:r,labelPosition:l="top",required:j,className:xe,id:ge,...ve},Pe)=>{const[q,Ee]=N.useState(!1),Ie=N.useId(),t=ge||Ie,S=n?`${t}-hint`:void 0,W=r?`${t}-error`:void 0,d=l==="inner"?void 0:y,Le=()=>{Ee(je=>!je)},i=e.jsxs("div",{className:s("relative",xe),children:[d&&e.jsx("div",{className:s("pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]","[&_svg]:size-4"),children:d}),e.jsx("input",{...ve,ref:Pe,id:t,required:j,"aria-invalid":r?"true":void 0,"aria-describedby":[W,S].filter(Boolean).join(" ")||void 0,type:q?"text":"password","data-slot":"input",className:s(qe,d?"pl-9":"pl-3","pr-9")}),e.jsx("button",{type:"button",onClick:Le,"aria-label":q?"Hide password":"Show password",tabIndex:-1,className:s("absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]","[&_svg]:size-4","cursor-pointer transition-colors hover:text-[var(--fg-default)]"),children:q?e.jsx(We,{"aria-hidden":"true"}):e.jsx(Re,{"aria-hidden":"true"})})]}),k=a&&e.jsx(Ne,{htmlFor:t,required:j,error:!!r,className:s(l==="left"&&"min-w-[100px]"),children:a}),c=(r||n)&&e.jsxs("div",{className:"flex flex-col gap-1",children:[r&&e.jsx("p",{id:W,className:"text-xs text-[var(--color-status-error)]",children:r}),n&&!r&&e.jsx("p",{id:S,className:"text-xs text-[var(--fg-subtle)]",children:n})]}),ye=a&&e.jsxs("label",{htmlFor:t,className:s("pointer-events-none absolute left-3 top-0 -translate-y-1/2 rounded-sm px-1 text-xs font-medium","bg-[var(--input-bg)]",r?"text-[var(--color-status-error)]":"text-[var(--fg-muted)]",d&&"left-9"),children:[a,j&&e.jsx("span",{className:"ml-0.5 text-[var(--color-status-error)]",children:"*"})]});return l==="inner"?e.jsxs("div",{className:"relative",children:[i,ye,c]}):l==="left"?e.jsxs("div",{className:"flex items-start gap-3",children:[k,e.jsxs("div",{className:"flex flex-1 flex-col gap-1.5",children:[i,c]})]}):a?e.jsxs("div",{className:"flex flex-col gap-1.5",children:[k,i,c]}):e.jsxs("div",{className:"flex flex-col gap-1.5",children:[i,c]})});o.displayName="PasswordInput";o.__docgenInfo={description:`PasswordInput Component

A specialized input for password fields with built-in show/hide toggle.
Supports label, hint, error, and left icon for consistency with other inputs.

@example
\`\`\`tsx
<PasswordInput placeholder="Enter password" />
<PasswordInput label="Password" required />
<PasswordInput label="Password" leftIcon={<Lock />} error="Required" />
\`\`\``,methods:[],displayName:"PasswordInput",props:{leftIcon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Icon to display on the left side"},label:{required:!1,tsType:{name:"string"},description:"Label text"},hint:{required:!1,tsType:{name:"string"},description:"Helper text shown below input"},error:{required:!1,tsType:{name:"string"},description:"Error message (also sets aria-invalid)"},labelPosition:{required:!1,tsType:{name:"union",raw:"'top' | 'left' | 'inner'",elements:[{name:"literal",value:"'top'"},{name:"literal",value:"'left'"},{name:"literal",value:"'inner'"}]},description:"Label position: top (above), left (inline), inner (floating on border)\nNote: `inner` label position cannot be used with `leftIcon`",defaultValue:{value:"'top'",computed:!1}},required:{required:!1,tsType:{name:"boolean"},description:"Required field indicator"}},composes:["Omit"]};const Fe={title:"Form Inputs/PasswordInput",component:o,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{placeholder:{control:"text",description:"Placeholder text"},disabled:{control:"boolean",description:"Whether the input is disabled"},label:{control:"text",description:"Label text"},labelPosition:{control:"select",options:["top","left","inner"],description:"Label position"},hint:{control:"text",description:"Hint text below the input"},error:{control:"text",description:"Error message"},required:{control:"boolean",description:"Required field indicator"}},decorators:[y=>e.jsx("div",{style:{width:"320px"},children:e.jsx(y,{})})]},p={args:{placeholder:"Enter password"}},u={args:{placeholder:"Enter password",defaultValue:"mysecretpassword"}},m={args:{placeholder:"Disabled password",disabled:!0}},h={args:{placeholder:"Enter password","aria-invalid":!0,defaultValue:"123"}},f={args:{label:"Password",placeholder:"Enter password"}},w={args:{label:"Password",placeholder:"Enter password",required:!0}},b={args:{label:"Password",placeholder:"Enter password",hint:"Must be at least 8 characters"}},x={args:{label:"Password",placeholder:"Enter password",error:"Password is required",required:!0}},g={args:{label:"Password",labelPosition:"left",placeholder:"Enter password"}},v={args:{label:"Password",labelPosition:"inner",placeholder:"Enter password"}},P={args:{leftIcon:e.jsx(L,{}),placeholder:"Enter password"}},E={args:{leftIcon:e.jsx(L,{}),label:"Password",placeholder:"Enter password",required:!0}},I={render:()=>e.jsxs("div",{className:"flex flex-col gap-4",children:[e.jsx(o,{label:"Password",placeholder:"Enter password",leftIcon:e.jsx(L,{}),required:!0,hint:"Must be at least 8 characters"}),e.jsx(o,{label:"Confirm Password",placeholder:"Confirm password",leftIcon:e.jsx(L,{}),required:!0})]})};var R,_,M;p.parameters={...p.parameters,docs:{...(R=p.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter password'
  }
}`,...(M=(_=p.parameters)==null?void 0:_.docs)==null?void 0:M.source}}};var V,A,T;u.parameters={...u.parameters,docs:{...(V=u.parameters)==null?void 0:V.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter password',
    defaultValue: 'mysecretpassword'
  }
}`,...(T=(A=u.parameters)==null?void 0:A.docs)==null?void 0:T.source}}};var C,D,F;m.parameters={...m.parameters,docs:{...(C=m.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    placeholder: 'Disabled password',
    disabled: true
  }
}`,...(F=(D=m.parameters)==null?void 0:D.docs)==null?void 0:F.source}}};var H,z,O;h.parameters={...h.parameters,docs:{...(H=h.parameters)==null?void 0:H.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter password',
    'aria-invalid': true,
    defaultValue: '123'
  }
}`,...(O=(z=h.parameters)==null?void 0:z.docs)==null?void 0:O.source}}};var $,B,G;f.parameters={...f.parameters,docs:{...($=f.parameters)==null?void 0:$.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    placeholder: 'Enter password'
  }
}`,...(G=(B=f.parameters)==null?void 0:B.docs)==null?void 0:G.source}}};var J,K,Q;w.parameters={...w.parameters,docs:{...(J=w.parameters)==null?void 0:J.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    required: true
  }
}`,...(Q=(K=w.parameters)==null?void 0:K.docs)==null?void 0:Q.source}}};var U,X,Y;b.parameters={...b.parameters,docs:{...(U=b.parameters)==null?void 0:U.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    hint: 'Must be at least 8 characters'
  }
}`,...(Y=(X=b.parameters)==null?void 0:X.docs)==null?void 0:Y.source}}};var Z,ee,re;x.parameters={...x.parameters,docs:{...(Z=x.parameters)==null?void 0:Z.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    error: 'Password is required',
    required: true
  }
}`,...(re=(ee=x.parameters)==null?void 0:ee.docs)==null?void 0:re.source}}};var se,ae,te;g.parameters={...g.parameters,docs:{...(se=g.parameters)==null?void 0:se.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    labelPosition: 'left',
    placeholder: 'Enter password'
  }
}`,...(te=(ae=g.parameters)==null?void 0:ae.docs)==null?void 0:te.source}}};var oe,ne,le;v.parameters={...v.parameters,docs:{...(oe=v.parameters)==null?void 0:oe.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    labelPosition: 'inner',
    placeholder: 'Enter password'
  }
}`,...(le=(ne=v.parameters)==null?void 0:ne.docs)==null?void 0:le.source}}};var de,ie,ce;P.parameters={...P.parameters,docs:{...(de=P.parameters)==null?void 0:de.docs,source:{originalSource:`{
  args: {
    leftIcon: <Lock />,
    placeholder: 'Enter password'
  }
}`,...(ce=(ie=P.parameters)==null?void 0:ie.docs)==null?void 0:ce.source}}};var pe,ue,me;E.parameters={...E.parameters,docs:{...(pe=E.parameters)==null?void 0:pe.docs,source:{originalSource:`{
  args: {
    leftIcon: <Lock />,
    label: 'Password',
    placeholder: 'Enter password',
    required: true
  }
}`,...(me=(ue=E.parameters)==null?void 0:ue.docs)==null?void 0:me.source}}};var he,fe,we;I.parameters={...I.parameters,docs:{...(he=I.parameters)==null?void 0:he.docs,source:{originalSource:`{
  render: () => <div className='flex flex-col gap-4'>
      <PasswordInput label='Password' placeholder='Enter password' leftIcon={<Lock />} required hint='Must be at least 8 characters' />
      <PasswordInput label='Confirm Password' placeholder='Confirm password' leftIcon={<Lock />} required />
    </div>
}`,...(we=(fe=I.parameters)==null?void 0:fe.docs)==null?void 0:we.source}}};const He=["Default","WithValue","Disabled","Invalid","WithLabel","WithLabelRequired","WithLabelAndHint","WithLabelAndError","LabelPositionLeft","LabelPositionInner","WithLeftIcon","WithLeftIconAndLabel","FormExample"];export{p as Default,m as Disabled,I as FormExample,h as Invalid,v as LabelPositionInner,g as LabelPositionLeft,f as WithLabel,x as WithLabelAndError,b as WithLabelAndHint,w as WithLabelRequired,P as WithLeftIcon,E as WithLeftIconAndLabel,u as WithValue,He as __namedExportsOrder,Fe as default};
