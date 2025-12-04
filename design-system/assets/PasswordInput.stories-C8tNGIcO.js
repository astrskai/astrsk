import{r as c,j as e}from"./iframe-hUBzdzut.js";import{I as _}from"./IconInput-DxIHURNo.js";import{c as v}from"./createLucideIcon-B9DlvHFp.js";import"./preload-helper-CwRszBsw.js";import"./utils-DuMXYCiK.js";import"./input-styles-6Rn9HMys.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],z=v("eye-off",V);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],M=v("eye",D),s=c.forwardRef((d,k)=>{const[l,N]=c.useState(!1),C=()=>{N(S=>!S)};return e.jsx(_,{...d,ref:k,type:l?"text":"password",icon:l?e.jsx(z,{"aria-hidden":"true"}):e.jsx(M,{"aria-hidden":"true"}),iconPosition:"right",onIconClick:C,iconAriaLabel:l?"Hide password":"Show password"})});s.displayName="PasswordInput";s.__docgenInfo={description:`PasswordInput Component

A specialized input for password fields with built-in show/hide toggle.
Uses IconInput internally for consistent styling.

@example
\`\`\`tsx
<PasswordInput placeholder="Enter password" />
<PasswordInput placeholder="Confirm password" aria-label="Confirm password" />
\`\`\``,methods:[],displayName:"PasswordInput",composes:["Omit"]};const H={title:"Form Inputs/PasswordInput",component:s,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{placeholder:{control:"text",description:"Placeholder text"},disabled:{control:"boolean",description:"Whether the input is disabled"}},decorators:[d=>e.jsx("div",{style:{width:"320px"},children:e.jsx(d,{})})]},r={args:{placeholder:"Enter password"}},a={args:{placeholder:"Enter password",defaultValue:"mysecretpassword"}},o={args:{placeholder:"Disabled password",disabled:!0}},t={args:{placeholder:"Enter password","aria-invalid":!0,defaultValue:"123"}},n={args:{placeholder:"Enter password"},decorators:[()=>e.jsxs("div",{className:"flex flex-col gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Password"}),e.jsx(s,{placeholder:"Enter password"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Confirm Password"}),e.jsx(s,{placeholder:"Confirm password"})]})]})]};var i,p,m;r.parameters={...r.parameters,docs:{...(i=r.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter password'
  }
}`,...(m=(p=r.parameters)==null?void 0:p.docs)==null?void 0:m.source}}};var u,w,h;a.parameters={...a.parameters,docs:{...(u=a.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter password',
    defaultValue: 'mysecretpassword'
  }
}`,...(h=(w=a.parameters)==null?void 0:w.docs)==null?void 0:h.source}}};var x,f,b;o.parameters={...o.parameters,docs:{...(x=o.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    placeholder: 'Disabled password',
    disabled: true
  }
}`,...(b=(f=o.parameters)==null?void 0:f.docs)==null?void 0:b.source}}};var g,y,I;t.parameters={...t.parameters,docs:{...(g=t.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter password',
    'aria-invalid': true,
    defaultValue: '123'
  }
}`,...(I=(y=t.parameters)==null?void 0:y.docs)==null?void 0:I.source}}};var E,P,j;n.parameters={...n.parameters,docs:{...(E=n.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter password'
  },
  decorators: [() => <div className='flex flex-col gap-4'>
        <div>
          <label className='mb-2 block text-sm text-zinc-400'>Password</label>
          <PasswordInput placeholder='Enter password' />
        </div>
        <div>
          <label className='mb-2 block text-sm text-zinc-400'>
            Confirm Password
          </label>
          <PasswordInput placeholder='Confirm password' />
        </div>
      </div>]
}`,...(j=(P=n.parameters)==null?void 0:P.docs)==null?void 0:j.source}}};const T=["Default","WithValue","Disabled","Invalid","FormExample"];export{r as Default,o as Disabled,n as FormExample,t as Invalid,a as WithValue,T as __namedExportsOrder,H as default};
