import{r as D,j as e}from"./iframe-DwvkU5AC.js";import{c as N}from"./utils-DuMXYCiK.js";import{I as M}from"./Input-DqkJvtnj.js";import"./preload-helper-Dp1pzeXC.js";const o=D.forwardRef(({className:r,icon:b,...L},E)=>e.jsxs("div",{className:"relative",children:[e.jsx("span",{"aria-hidden":"true",className:"absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] [&>svg]:size-4 pointer-events-none",children:b}),e.jsx(M,{ref:E,className:N("pl-9",r),...L})]}));o.displayName="IconInput";o.__docgenInfo={description:"",methods:[],displayName:"IconInput",props:{icon:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Icon element to display on the left side (decorative).\nThe icon is hidden from screen readers (aria-hidden).\nEnsure the input has an accessible name via `placeholder` or `aria-label`."}}};const i=()=>e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"11",cy:"11",r:"8"}),e.jsx("path",{d:"m21 21-4.3-4.3"})]}),d=()=>e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{width:"20",height:"16",x:"2",y:"4",rx:"2"}),e.jsx("path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"})]}),R=()=>e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"12",cy:"7",r:"4"})]}),B=()=>e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2"}),e.jsx("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"})]}),P={title:"Form Inputs/IconInput",component:o,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{placeholder:{control:"text",description:"Placeholder text"},disabled:{control:"boolean",description:"Disable input"}}},s={args:{icon:e.jsx(i,{}),placeholder:"Search...",type:"search"},decorators:[r=>e.jsx("div",{style:{width:"300px"},children:e.jsx(r,{})})]},n={args:{icon:e.jsx(d,{}),placeholder:"Enter your email",type:"email"},decorators:[r=>e.jsx("div",{style:{width:"300px"},children:e.jsx(r,{})})]},a={args:{icon:e.jsx(i,{})},render:()=>e.jsxs("div",{style:{width:"300px",display:"flex",flexDirection:"column",gap:"12px"},children:[e.jsx(o,{icon:e.jsx(i,{}),placeholder:"Search..."}),e.jsx(o,{icon:e.jsx(d,{}),type:"email",placeholder:"Email"}),e.jsx(o,{icon:e.jsx(R,{}),placeholder:"Username"}),e.jsx(o,{icon:e.jsx(B,{}),type:"password",placeholder:"Password"})]})},t={args:{icon:e.jsx(i,{}),placeholder:"Disabled search",disabled:!0},decorators:[r=>e.jsx("div",{style:{width:"300px"},children:e.jsx(r,{})})]},c={args:{icon:e.jsx(d,{}),placeholder:"Invalid email","aria-invalid":"true"},decorators:[r=>e.jsx("div",{style:{width:"300px"},children:e.jsx(r,{})})]};var l,p,h;s.parameters={...s.parameters,docs:{...(l=s.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    icon: <SearchIcon />,
    placeholder: 'Search...',
    type: 'search'
  },
  decorators: [Story => <div style={{
    width: '300px'
  }}>
        <Story />
      </div>]
}`,...(h=(p=s.parameters)==null?void 0:p.docs)==null?void 0:h.source}}};var x,m,u;n.parameters={...n.parameters,docs:{...(x=n.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    icon: <MailIcon />,
    placeholder: 'Enter your email',
    type: 'email'
  },
  decorators: [Story => <div style={{
    width: '300px'
  }}>
        <Story />
      </div>]
}`,...(u=(m=n.parameters)==null?void 0:m.docs)==null?void 0:u.source}}};var j,v,y;a.parameters={...a.parameters,docs:{...(j=a.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    icon: <SearchIcon />
  },
  render: () => <div style={{
    width: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }}>
      <IconInput icon={<SearchIcon />} placeholder="Search..." />
      <IconInput icon={<MailIcon />} type="email" placeholder="Email" />
      <IconInput icon={<UserIcon />} placeholder="Username" />
      <IconInput icon={<LockIcon />} type="password" placeholder="Password" />
    </div>
}`,...(y=(v=a.parameters)==null?void 0:v.docs)==null?void 0:y.source}}};var I,w,g;t.parameters={...t.parameters,docs:{...(I=t.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    icon: <SearchIcon />,
    placeholder: 'Disabled search',
    disabled: true
  },
  decorators: [Story => <div style={{
    width: '300px'
  }}>
        <Story />
      </div>]
}`,...(g=(w=t.parameters)==null?void 0:w.docs)==null?void 0:g.source}}};var S,f,k;c.parameters={...c.parameters,docs:{...(S=c.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    icon: <MailIcon />,
    placeholder: 'Invalid email',
    'aria-invalid': 'true'
  },
  decorators: [Story => <div style={{
    width: '300px'
  }}>
        <Story />
      </div>]
}`,...(k=(f=c.parameters)==null?void 0:f.docs)==null?void 0:k.source}}};const T=["Search","Email","IconVariants","Disabled","Invalid"];export{t as Disabled,n as Email,a as IconVariants,c as Invalid,s as Search,T as __namedExportsOrder,P as default};
