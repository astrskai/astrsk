import{j as e}from"./iframe-BHybmGn3.js";import{I as r}from"./IconInput-K3yb3_Ut.js";import{c as a}from"./createLucideIcon-DgB9jd_9.js";import{L as A}from"./lock-B0C3i8lx.js";import{U as R}from"./user-D2rzN8Ff.js";import"./preload-helper-CwRszBsw.js";import"./utils-CF6QUdYH.js";import"./input-styles-z0NdvNUJ.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],W=a("calendar",V);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]],O=a("credit-card",F);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]],$=a("mail",T);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=[["path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",key:"foiqr5"}]],G=a("phone",B);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]],p=a("search",H),ae={title:"Form Inputs/IconInput",component:r,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{icon:{control:!1,description:"Icon to display inside the input"},iconPosition:{control:"radio",options:["left","right"],description:"Position of the icon",table:{defaultValue:{summary:"left"}}},placeholder:{control:"text",description:"Placeholder text"},disabled:{control:"boolean",description:"Whether the input is disabled"},type:{control:"select",options:["text","email","password","search","tel","url"],description:"Input type"}},decorators:[q=>e.jsx("div",{style:{width:"320px"},children:e.jsx(q,{})})]},o={name:"Search",args:{icon:e.jsx(p,{}),placeholder:"Search...",type:"search"}},s={args:{icon:e.jsx($,{}),placeholder:"Enter your email",type:"email"}},c={args:{icon:e.jsx(A,{}),iconPosition:"right",placeholder:"Enter password",type:"password"}},t={args:{icon:e.jsx(R,{}),placeholder:"Username"}},n={args:{icon:e.jsx(G,{}),placeholder:"Phone number",type:"tel"}},i={args:{icon:e.jsx(p,{}),placeholder:"Disabled input",disabled:!0}},l={args:{placeholder:"Regular input without icon"}},d={args:{icon:e.jsx(p,{}),placeholder:"Search..."},decorators:[()=>e.jsxs("div",{className:"flex flex-col gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Search"}),e.jsx(r,{icon:e.jsx(p,{}),placeholder:"Search..."})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Email"}),e.jsx(r,{icon:e.jsx($,{}),type:"email",placeholder:"email@example.com"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Password (icon right)"}),e.jsx(r,{icon:e.jsx(A,{}),iconPosition:"right",type:"password",placeholder:"Password"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Credit Card"}),e.jsx(r,{icon:e.jsx(O,{}),placeholder:"Card number"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-2 block text-sm text-zinc-400",children:"Date"}),e.jsx(r,{icon:e.jsx(W,{}),placeholder:"Select date"})]})]})]};var m,h,x;o.parameters={...o.parameters,docs:{...(m=o.parameters)==null?void 0:m.docs,source:{originalSource:`{
  name: 'Search',
  args: {
    icon: <Search />,
    placeholder: 'Search...',
    type: 'search'
  }
}`,...(x=(h=o.parameters)==null?void 0:h.docs)==null?void 0:x.source}}};var u,b,y;s.parameters={...s.parameters,docs:{...(u=s.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    icon: <Mail />,
    placeholder: 'Enter your email',
    type: 'email'
  }
}`,...(y=(b=s.parameters)==null?void 0:b.docs)==null?void 0:y.source}}};var g,j,S;c.parameters={...c.parameters,docs:{...(g=c.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    icon: <Lock />,
    iconPosition: 'right',
    placeholder: 'Enter password',
    type: 'password'
  }
}`,...(S=(j=c.parameters)==null?void 0:j.docs)==null?void 0:S.source}}};var k,v,I;t.parameters={...t.parameters,docs:{...(k=t.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    icon: <User />,
    placeholder: 'Username'
  }
}`,...(I=(v=t.parameters)==null?void 0:v.docs)==null?void 0:I.source}}};var w,N,P;n.parameters={...n.parameters,docs:{...(w=n.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    icon: <Phone />,
    placeholder: 'Phone number',
    type: 'tel'
  }
}`,...(P=(N=n.parameters)==null?void 0:N.docs)==null?void 0:P.source}}};var f,_,z;i.parameters={...i.parameters,docs:{...(f=i.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    icon: <Search />,
    placeholder: 'Disabled input',
    disabled: true
  }
}`,...(z=(_=i.parameters)==null?void 0:_.docs)==null?void 0:z.source}}};var C,E,L;l.parameters={...l.parameters,docs:{...(C=l.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    placeholder: 'Regular input without icon'
  }
}`,...(L=(E=l.parameters)==null?void 0:E.docs)==null?void 0:L.source}}};var M,U,D;d.parameters={...d.parameters,docs:{...(M=d.parameters)==null?void 0:M.docs,source:{originalSource:`{
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
}`,...(D=(U=d.parameters)==null?void 0:U.docs)==null?void 0:D.source}}};const oe=["Search_","Email","Password","Username","PhoneNumber","Disabled","WithoutIcon","AllVariants"];export{d as AllVariants,i as Disabled,s as Email,c as Password,n as PhoneNumber,o as Search_,t as Username,l as WithoutIcon,oe as __namedExportsOrder,ae as default};
