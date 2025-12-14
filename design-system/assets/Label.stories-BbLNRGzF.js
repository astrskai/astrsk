import{j as e}from"./iframe-Be38Beyt.js";import{L as r}from"./Label-Bpqd_sJT.js";import{I as t}from"./Input-CKam73ei.js";import"./preload-helper-CwRszBsw.js";import"./utils-CF6QUdYH.js";import"./input-styles-z0NdvNUJ.js";const I={title:"Form Inputs/Label",component:r,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{required:{control:"boolean",description:"Show required indicator (*)"},error:{control:"boolean",description:"Error state styling"}}},a={args:{children:"Email",htmlFor:"email"}},s={args:{children:"Username",htmlFor:"username",required:!0}},o={args:{children:"Password",htmlFor:"password",error:!0}},l={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px",width:"300px"},children:[e.jsx(r,{htmlFor:"email-input",children:"Email Address"}),e.jsx(t,{id:"email-input",type:"email",placeholder:"Enter your email"})]})},i={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px",width:"300px"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx(r,{htmlFor:"name",required:!0,children:"Full Name"}),e.jsx(t,{id:"name",placeholder:"John Doe"})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx(r,{htmlFor:"email",required:!0,children:"Email"}),e.jsx(t,{id:"email",type:"email",placeholder:"john@example.com"})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx(r,{htmlFor:"password",error:!0,children:"Password"}),e.jsx(t,{id:"password",type:"password","aria-invalid":"true"}),e.jsx("span",{style:{fontSize:"12px",color:"var(--color-status-error)"},children:"Password is required."})]})]})};var d,n,p;a.parameters={...a.parameters,docs:{...(d=a.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    children: 'Email',
    htmlFor: 'email'
  }
}`,...(p=(n=a.parameters)==null?void 0:n.docs)==null?void 0:p.source}}};var m,c,u;s.parameters={...s.parameters,docs:{...(m=s.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    children: 'Username',
    htmlFor: 'username',
    required: true
  }
}`,...(u=(c=s.parameters)==null?void 0:c.docs)==null?void 0:u.source}}};var x,h,y;o.parameters={...o.parameters,docs:{...(x=o.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    children: 'Password',
    htmlFor: 'password',
    error: true
  }
}`,...(y=(h=o.parameters)==null?void 0:h.docs)==null?void 0:y.source}}};var f,g,v;l.parameters={...l.parameters,docs:{...(f=l.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '300px'
  }}>
      <Label htmlFor="email-input">Email Address</Label>
      <Input id="email-input" type="email" placeholder="Enter your email" />
    </div>
}`,...(v=(g=l.parameters)==null?void 0:g.docs)==null?void 0:v.source}}};var w,F,j;i.parameters={...i.parameters,docs:{...(w=i.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '300px'
  }}>
      <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
        <Label htmlFor="name" required>Full Name</Label>
        <Input id="name" placeholder="John Doe" />
      </div>
      <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
        <Label htmlFor="email" required>Email</Label>
        <Input id="email" type="email" placeholder="john@example.com" />
      </div>
      <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
        <Label htmlFor="password" error>Password</Label>
        <Input id="password" type="password" aria-invalid="true" />
        <span style={{
        fontSize: '12px',
        color: 'var(--color-status-error)'
      }}>
          Password is required.
        </span>
      </div>
    </div>
}`,...(j=(F=i.parameters)==null?void 0:F.docs)==null?void 0:j.source}}};const P=["Default","Required","ErrorState","WithInput","FormExample"];export{a as Default,o as ErrorState,i as FormExample,s as Required,l as WithInput,P as __namedExportsOrder,I as default};
