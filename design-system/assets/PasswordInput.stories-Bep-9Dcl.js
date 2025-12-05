import{r as j,j as e}from"./iframe-DiTp45fe.js";import{c as k}from"./utils-DuMXYCiK.js";import{I as qe}from"./IconInput-DI60VzzC.js";import{c as be}from"./createLucideIcon-DU6wH5l5.js";import{L as Ne}from"./Label-BjXHURPK.js";import{L as E}from"./lock-DG2QYivd.js";import"./preload-helper-CwRszBsw.js";import"./input-styles-6Rn9HMys.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Se=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],We=be("eye-off",Se);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ke=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],Ae=be("eye",ke),o=j.forwardRef(({leftIcon:L,label:s,hint:t,error:r,labelPosition:n="top",required:v,className:xe,id:ge,...Ie},Pe)=>{const[y,Ee]=j.useState(!1),Le=j.useId(),a=ge||Le,q=t?`${a}-hint`:void 0,N=r?`${a}-error`:void 0,S=n==="inner"?void 0:L,ve=()=>{Ee(je=>!je)},l=e.jsx(qe,{...Ie,ref:Pe,id:a,required:v,"aria-invalid":r?"true":void 0,"aria-describedby":[N,q].filter(Boolean).join(" ")||void 0,type:y?"text":"password",leftIcon:S,rightIcon:y?e.jsx(We,{"aria-hidden":"true"}):e.jsx(Ae,{"aria-hidden":"true"}),onRightIconClick:ve,rightIconAriaLabel:y?"Hide password":"Show password",className:xe}),W=s&&e.jsx(Ne,{htmlFor:a,required:v,error:!!r,className:k(n==="left"&&"min-w-[100px]"),children:s}),d=(r||t)&&e.jsxs("div",{className:"flex flex-col gap-1",children:[r&&e.jsx("p",{id:N,className:"text-xs text-[var(--color-status-error)]",children:r}),t&&!r&&e.jsx("p",{id:q,className:"text-xs text-[var(--fg-subtle)]",children:t})]}),ye=s&&e.jsxs("label",{htmlFor:a,className:k("pointer-events-none absolute left-3 top-0 -translate-y-1/2 rounded-sm px-1 text-xs font-medium","bg-[var(--input-bg)]",r?"text-[var(--color-status-error)]":"text-[var(--fg-muted)]",S&&"left-9"),children:[s,v&&e.jsx("span",{className:"ml-0.5 text-[var(--color-status-error)]",children:"*"})]});return n==="inner"?e.jsxs("div",{className:"relative",children:[l,ye,d]}):n==="left"?e.jsxs("div",{className:"flex items-start gap-3",children:[W,e.jsxs("div",{className:"flex flex-1 flex-col gap-1.5",children:[l,d]})]}):s?e.jsxs("div",{className:"flex flex-col gap-1.5",children:[W,l,d]}):e.jsxs("div",{className:"flex flex-col gap-1.5",children:[l,d]})});o.displayName="PasswordInput";o.__docgenInfo={description:`PasswordInput Component

A specialized input for password fields with built-in show/hide toggle.
Supports label, hint, error, and left icon for consistency with other inputs.

@example
\`\`\`tsx
<PasswordInput placeholder="Enter password" />
<PasswordInput label="Password" required />
<PasswordInput label="Password" leftIcon={<Lock />} error="Required" />
\`\`\``,methods:[],displayName:"PasswordInput",props:{label:{required:!1,tsType:{name:"string"},description:"Label text"},hint:{required:!1,tsType:{name:"string"},description:"Helper text shown below input"},error:{required:!1,tsType:{name:"string"},description:"Error message (also sets aria-invalid)"},labelPosition:{required:!1,tsType:{name:"union",raw:"'top' | 'left' | 'inner'",elements:[{name:"literal",value:"'top'"},{name:"literal",value:"'left'"},{name:"literal",value:"'inner'"}]},description:"Label position: top (above), left (inline), inner (floating on border)\nNote: `inner` label position cannot be used with `leftIcon`",defaultValue:{value:"'top'",computed:!1}},required:{required:!1,tsType:{name:"boolean"},description:"Required field indicator"}},composes:["Omit"]};const He={title:"Form Inputs/PasswordInput",component:o,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{placeholder:{control:"text",description:"Placeholder text"},disabled:{control:"boolean",description:"Whether the input is disabled"},label:{control:"text",description:"Label text"},labelPosition:{control:"select",options:["top","left","inner"],description:"Label position"},hint:{control:"text",description:"Hint text below the input"},error:{control:"text",description:"Error message"},required:{control:"boolean",description:"Required field indicator"}},decorators:[L=>e.jsx("div",{style:{width:"320px"},children:e.jsx(L,{})})]},i={args:{placeholder:"Enter password"}},c={args:{placeholder:"Enter password",defaultValue:"mysecretpassword"}},p={args:{placeholder:"Disabled password",disabled:!0}},u={args:{placeholder:"Enter password","aria-invalid":!0,defaultValue:"123"}},m={args:{label:"Password",placeholder:"Enter password"}},h={args:{label:"Password",placeholder:"Enter password",required:!0}},f={args:{label:"Password",placeholder:"Enter password",hint:"Must be at least 8 characters"}},w={args:{label:"Password",placeholder:"Enter password",error:"Password is required",required:!0}},b={args:{label:"Password",labelPosition:"left",placeholder:"Enter password"}},x={args:{label:"Password",labelPosition:"inner",placeholder:"Enter password"}},g={args:{leftIcon:e.jsx(E,{}),placeholder:"Enter password"}},I={args:{leftIcon:e.jsx(E,{}),label:"Password",placeholder:"Enter password",required:!0}},P={render:()=>e.jsxs("div",{className:"flex flex-col gap-4",children:[e.jsx(o,{label:"Password",placeholder:"Enter password",leftIcon:e.jsx(E,{}),required:!0,hint:"Must be at least 8 characters"}),e.jsx(o,{label:"Confirm Password",placeholder:"Confirm password",leftIcon:e.jsx(E,{}),required:!0})]})};var A,M,R;i.parameters={...i.parameters,docs:{...(A=i.parameters)==null?void 0:A.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter password'
  }
}`,...(R=(M=i.parameters)==null?void 0:M.docs)==null?void 0:R.source}}};var V,_,C;c.parameters={...c.parameters,docs:{...(V=c.parameters)==null?void 0:V.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter password',
    defaultValue: 'mysecretpassword'
  }
}`,...(C=(_=c.parameters)==null?void 0:_.docs)==null?void 0:C.source}}};var D,T,F;p.parameters={...p.parameters,docs:{...(D=p.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    placeholder: 'Disabled password',
    disabled: true
  }
}`,...(F=(T=p.parameters)==null?void 0:T.docs)==null?void 0:F.source}}};var H,O,$;u.parameters={...u.parameters,docs:{...(H=u.parameters)==null?void 0:H.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter password',
    'aria-invalid': true,
    defaultValue: '123'
  }
}`,...($=(O=u.parameters)==null?void 0:O.docs)==null?void 0:$.source}}};var z,B,G;m.parameters={...m.parameters,docs:{...(z=m.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    placeholder: 'Enter password'
  }
}`,...(G=(B=m.parameters)==null?void 0:B.docs)==null?void 0:G.source}}};var J,K,Q;h.parameters={...h.parameters,docs:{...(J=h.parameters)==null?void 0:J.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    required: true
  }
}`,...(Q=(K=h.parameters)==null?void 0:K.docs)==null?void 0:Q.source}}};var U,X,Y;f.parameters={...f.parameters,docs:{...(U=f.parameters)==null?void 0:U.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    hint: 'Must be at least 8 characters'
  }
}`,...(Y=(X=f.parameters)==null?void 0:X.docs)==null?void 0:Y.source}}};var Z,ee,re;w.parameters={...w.parameters,docs:{...(Z=w.parameters)==null?void 0:Z.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    error: 'Password is required',
    required: true
  }
}`,...(re=(ee=w.parameters)==null?void 0:ee.docs)==null?void 0:re.source}}};var se,ae,oe;b.parameters={...b.parameters,docs:{...(se=b.parameters)==null?void 0:se.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    labelPosition: 'left',
    placeholder: 'Enter password'
  }
}`,...(oe=(ae=b.parameters)==null?void 0:ae.docs)==null?void 0:oe.source}}};var te,ne,le;x.parameters={...x.parameters,docs:{...(te=x.parameters)==null?void 0:te.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    labelPosition: 'inner',
    placeholder: 'Enter password'
  }
}`,...(le=(ne=x.parameters)==null?void 0:ne.docs)==null?void 0:le.source}}};var de,ie,ce;g.parameters={...g.parameters,docs:{...(de=g.parameters)==null?void 0:de.docs,source:{originalSource:`{
  args: {
    leftIcon: <Lock />,
    placeholder: 'Enter password'
  }
}`,...(ce=(ie=g.parameters)==null?void 0:ie.docs)==null?void 0:ce.source}}};var pe,ue,me;I.parameters={...I.parameters,docs:{...(pe=I.parameters)==null?void 0:pe.docs,source:{originalSource:`{
  args: {
    leftIcon: <Lock />,
    label: 'Password',
    placeholder: 'Enter password',
    required: true
  }
}`,...(me=(ue=I.parameters)==null?void 0:ue.docs)==null?void 0:me.source}}};var he,fe,we;P.parameters={...P.parameters,docs:{...(he=P.parameters)==null?void 0:he.docs,source:{originalSource:`{
  render: () => <div className='flex flex-col gap-4'>
      <PasswordInput label='Password' placeholder='Enter password' leftIcon={<Lock />} required hint='Must be at least 8 characters' />
      <PasswordInput label='Confirm Password' placeholder='Confirm password' leftIcon={<Lock />} required />
    </div>
}`,...(we=(fe=P.parameters)==null?void 0:fe.docs)==null?void 0:we.source}}};const Oe=["Default","WithValue","Disabled","Invalid","WithLabel","WithLabelRequired","WithLabelAndHint","WithLabelAndError","LabelPositionLeft","LabelPositionInner","WithLeftIcon","WithLeftIconAndLabel","FormExample"];export{i as Default,p as Disabled,P as FormExample,u as Invalid,x as LabelPositionInner,b as LabelPositionLeft,m as WithLabel,w as WithLabelAndError,f as WithLabelAndHint,h as WithLabelRequired,g as WithLeftIcon,I as WithLeftIconAndLabel,c as WithValue,Oe as __namedExportsOrder,He as default};
