import{r as I,j as e}from"./iframe-D-dWrFNZ.js";import{c as j}from"./utils-DuMXYCiK.js";import{L as te}from"./Label-CIxBLLcr.js";import{I as se}from"./Input-DqUPl5d5.js";import"./preload-helper-CwRszBsw.js";const l=I.forwardRef(({label:t,hint:s,error:r,labelPosition:i="top",required:x,className:Y,id:Z,...f},ee)=>{const le=I.useId(),a=Z||le,E=s?`${a}-hint`:void 0,v=r?`${a}-error`:void 0,w=t&&e.jsx(te,{htmlFor:a,required:x,className:j(i==="left"&&"min-w-[100px]"),children:t}),re=i==="inner"?f.placeholder||" ":f.placeholder,y=e.jsx(se,{ref:ee,id:a,required:x,"aria-invalid":r?"true":void 0,"aria-describedby":[v,E].filter(Boolean).join(" ")||void 0,placeholder:re,className:Y,...f}),g=(r||s)&&e.jsxs("div",{className:"flex flex-col gap-1",children:[r&&e.jsx("p",{id:v,className:"text-xs text-[var(--color-status-error)]",children:r}),s&&!r&&e.jsx("p",{id:E,className:"text-xs text-[var(--fg-subtle)]",children:s})]}),ae=t&&e.jsxs("label",{htmlFor:a,className:j("absolute top-0 left-3 -translate-y-1/2 px-1 text-xs font-medium pointer-events-none","bg-[var(--input-bg)] rounded-sm",r?"text-[var(--color-status-error)]":"text-[var(--fg-muted)]"),children:[t,x&&e.jsx("span",{className:"text-[var(--color-status-error)] ml-0.5",children:"*"})]});return i==="inner"?e.jsxs("div",{className:"relative",children:[y,ae,g]}):i==="left"?e.jsxs("div",{className:"flex items-start gap-3",children:[w,e.jsxs("div",{className:"flex flex-1 flex-col gap-1.5",children:[y,g]})]}):e.jsxs("div",{className:"flex flex-col gap-1.5",children:[w,y,g]})});l.displayName="LabeledInput";l.__docgenInfo={description:"",methods:[],displayName:"LabeledInput",props:{label:{required:!1,tsType:{name:"string"},description:"Label text"},hint:{required:!1,tsType:{name:"string"},description:"Helper text shown below input"},error:{required:!1,tsType:{name:"string"},description:"Error message (also sets aria-invalid)"},labelPosition:{required:!1,tsType:{name:"union",raw:"'top' | 'left' | 'inner'",elements:[{name:"literal",value:"'top'"},{name:"literal",value:"'left'"},{name:"literal",value:"'inner'"}]},description:"Label position: top (above), left (inline), inner (floating on border)",defaultValue:{value:"'top'",computed:!1}},required:{required:!1,tsType:{name:"boolean"},description:"Required field indicator"}}};const ce={title:"Form Inputs/LabeledInput",component:l,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{label:{control:"text",description:"Label text"},hint:{control:"text",description:"Helper text shown below input"},error:{control:"text",description:"Error message"},labelPosition:{control:"select",options:["top","left","inner"],description:"Label position: top (above), left (inline), inner (floating on border)",table:{defaultValue:{summary:"top"}}},required:{control:"boolean",description:"Required field indicator"},disabled:{control:"boolean",description:"Disable input"}}},n={args:{label:"Email",placeholder:"Enter your email",type:"email"}},o={args:{label:"Username",placeholder:"Enter username",hint:"Username must be 3-20 characters long."}},d={args:{label:"Password",type:"password",placeholder:"Enter password",error:"Password must be at least 8 characters."}},p={args:{label:"Full Name",placeholder:"Enter your full name",required:!0}},c={render:()=>e.jsxs("div",{style:{width:"400px",display:"flex",flexDirection:"column",gap:"16px"},children:[e.jsx(l,{label:"First Name",labelPosition:"left",placeholder:"Enter first name"}),e.jsx(l,{label:"Last Name",labelPosition:"left",placeholder:"Enter last name"}),e.jsx(l,{label:"Email",labelPosition:"left",type:"email",placeholder:"Enter email",hint:"We'll never share your email."})]})},u={render:()=>e.jsxs("div",{style:{width:"320px",display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsx(l,{label:"Email",labelPosition:"inner",type:"email",placeholder:"Enter your email"}),e.jsx(l,{label:"Password",labelPosition:"inner",type:"password",placeholder:"Enter password"}),e.jsx(l,{label:"Username",labelPosition:"inner",placeholder:"Enter username",required:!0}),e.jsx(l,{label:"Phone",labelPosition:"inner",type:"tel",placeholder:"+1 (555) 000-0000",hint:"Optional field"}),e.jsx(l,{label:"Invalid Field",labelPosition:"inner",placeholder:"This has an error",error:"This field is required."})]})},m={args:{label:"Disabled Field",placeholder:"Cannot edit",disabled:!0}},h={render:()=>e.jsxs("div",{style:{width:"320px",display:"flex",flexDirection:"column",gap:"16px"},children:[e.jsx(l,{label:"Full Name",placeholder:"John Doe",required:!0}),e.jsx(l,{label:"Email",type:"email",placeholder:"john@example.com",required:!0,hint:"We'll send confirmation to this email."}),e.jsx(l,{label:"Password",type:"password",placeholder:"Enter password",required:!0,error:"Password must contain at least 8 characters."}),e.jsx(l,{label:"Phone",type:"tel",placeholder:"+1 (555) 000-0000",hint:"Optional"})]})},b={render:()=>e.jsxs("div",{style:{width:"320px",display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsx(l,{label:"Default",placeholder:"Default input"}),e.jsx(l,{label:"With Hint",placeholder:"Input with hint",hint:"This is a helpful hint."}),e.jsx(l,{label:"With Error",placeholder:"Input with error",error:"This field has an error."}),e.jsx(l,{label:"Required",placeholder:"Required input",required:!0}),e.jsx(l,{label:"Disabled",placeholder:"Disabled input",disabled:!0}),e.jsx(l,{label:"With Value",defaultValue:"Pre-filled value"})]})};var L,P,q;n.parameters={...n.parameters,docs:{...(L=n.parameters)==null?void 0:L.docs,source:{originalSource:`{
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    type: 'email'
  }
}`,...(q=(P=n.parameters)==null?void 0:P.docs)==null?void 0:q.source}}};var D,N,F;o.parameters={...o.parameters,docs:{...(D=o.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    hint: 'Username must be 3-20 characters long.'
  }
}`,...(F=(N=o.parameters)==null?void 0:N.docs)==null?void 0:F.source}}};var T,W,S;d.parameters={...d.parameters,docs:{...(T=d.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    error: 'Password must be at least 8 characters.'
  }
}`,...(S=(W=d.parameters)==null?void 0:W.docs)==null?void 0:S.source}}};var R,H,U;p.parameters={...p.parameters,docs:{...(R=p.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    label: 'Full Name',
    placeholder: 'Enter your full name',
    required: true
  }
}`,...(U=(H=p.parameters)==null?void 0:H.docs)==null?void 0:U.source}}};var V,O,_;c.parameters={...c.parameters,docs:{...(V=c.parameters)==null?void 0:V.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }}>
      <LabeledInput label="First Name" labelPosition="left" placeholder="Enter first name" />
      <LabeledInput label="Last Name" labelPosition="left" placeholder="Enter last name" />
      <LabeledInput label="Email" labelPosition="left" type="email" placeholder="Enter email" hint="We'll never share your email." />
    </div>
}`,...(_=(O=c.parameters)==null?void 0:O.docs)==null?void 0:_.source}}};var A,C,J;u.parameters={...u.parameters,docs:{...(A=u.parameters)==null?void 0:A.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  }}>
      <LabeledInput label="Email" labelPosition="inner" type="email" placeholder="Enter your email" />
      <LabeledInput label="Password" labelPosition="inner" type="password" placeholder="Enter password" />
      <LabeledInput label="Username" labelPosition="inner" placeholder="Enter username" required />
      <LabeledInput label="Phone" labelPosition="inner" type="tel" placeholder="+1 (555) 000-0000" hint="Optional field" />
      <LabeledInput label="Invalid Field" labelPosition="inner" placeholder="This has an error" error="This field is required." />
    </div>
}`,...(J=(C=u.parameters)==null?void 0:C.docs)==null?void 0:J.source}}};var $,B,k;m.parameters={...m.parameters,docs:{...($=m.parameters)==null?void 0:$.docs,source:{originalSource:`{
  args: {
    label: 'Disabled Field',
    placeholder: 'Cannot edit',
    disabled: true
  }
}`,...(k=(B=m.parameters)==null?void 0:B.docs)==null?void 0:k.source}}};var z,G,K;h.parameters={...h.parameters,docs:{...(z=h.parameters)==null?void 0:z.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }}>
      <LabeledInput label="Full Name" placeholder="John Doe" required />
      <LabeledInput label="Email" type="email" placeholder="john@example.com" required hint="We'll send confirmation to this email." />
      <LabeledInput label="Password" type="password" placeholder="Enter password" required error="Password must contain at least 8 characters." />
      <LabeledInput label="Phone" type="tel" placeholder="+1 (555) 000-0000" hint="Optional" />
    </div>
}`,...(K=(G=h.parameters)==null?void 0:G.docs)==null?void 0:K.source}}};var M,Q,X;b.parameters={...b.parameters,docs:{...(M=b.parameters)==null?void 0:M.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  }}>
      <LabeledInput label="Default" placeholder="Default input" />
      <LabeledInput label="With Hint" placeholder="Input with hint" hint="This is a helpful hint." />
      <LabeledInput label="With Error" placeholder="Input with error" error="This field has an error." />
      <LabeledInput label="Required" placeholder="Required input" required />
      <LabeledInput label="Disabled" placeholder="Disabled input" disabled />
      <LabeledInput label="With Value" defaultValue="Pre-filled value" />
    </div>
}`,...(X=(Q=b.parameters)==null?void 0:Q.docs)==null?void 0:X.source}}};const ue=["Default","WithHint","WithError","Required","LabelLeft","LabelInner","Disabled","FormExample","AllStates"];export{b as AllStates,n as Default,m as Disabled,h as FormExample,u as LabelInner,c as LabelLeft,p as Required,d as WithError,o as WithHint,ue as __namedExportsOrder,ce as default};
