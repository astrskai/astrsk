import{j as e}from"./iframe-CtPpfCw7.js";import{I as l}from"./Input-C7mJFr3E.js";import"./preload-helper-CwRszBsw.js";import"./utils-DuMXYCiK.js";import"./input-styles-6Rn9HMys.js";const U={title:"Form Inputs/Input",component:l,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{type:{control:"select",options:["text","email","password","number","search","tel","url"],description:"Input type",table:{defaultValue:{summary:"text"}}},placeholder:{control:"text",description:"Placeholder text"},disabled:{control:"boolean",description:"Disable input"}}},t={args:{placeholder:"Enter text...",type:"text"}},r={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px",width:"300px"},children:[e.jsx(l,{type:"text",placeholder:"Text input"}),e.jsx(l,{type:"email",placeholder:"Email input"}),e.jsx(l,{type:"password",placeholder:"Password input"}),e.jsx(l,{type:"number",placeholder:"Number input"}),e.jsx(l,{type:"search",placeholder:"Search input"}),e.jsx(l,{type:"tel",placeholder:"Phone input"}),e.jsx(l,{type:"url",placeholder:"URL input"})]})},a={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px",width:"300px"},children:[e.jsx(l,{defaultValue:"Hello World"}),e.jsx(l,{type:"email",defaultValue:"user@example.com"}),e.jsx(l,{type:"password",defaultValue:"password123"})]})},i={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px",width:"300px"},children:[e.jsx(l,{disabled:!0,placeholder:"Disabled empty"}),e.jsx(l,{disabled:!0,defaultValue:"Disabled with value"})]})},s={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px",width:"300px"},children:[e.jsx(l,{"aria-invalid":"true",placeholder:"Invalid input"}),e.jsx(l,{"aria-invalid":"true",defaultValue:"Invalid with value"})]})},p={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px",width:"300px"},children:[e.jsx(l,{type:"file"}),e.jsx(l,{type:"file",accept:"image/*"})]})},d={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px",width:"300px"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{htmlFor:"name",style:{fontSize:"14px",fontWeight:500,color:"var(--fg-default)"},children:"Name"}),e.jsx(l,{id:"name",placeholder:"Enter your name"})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{htmlFor:"email",style:{fontSize:"14px",fontWeight:500,color:"var(--fg-default)"},children:"Email"}),e.jsx(l,{id:"email",type:"email",placeholder:"Enter your email"}),e.jsx("span",{style:{fontSize:"12px",color:"var(--fg-subtle)"},children:"We'll never share your email."})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{htmlFor:"error-field",style:{fontSize:"14px",fontWeight:500,color:"var(--fg-default)"},children:"Required Field"}),e.jsx(l,{id:"error-field","aria-invalid":"true",placeholder:"This field has an error"}),e.jsx("span",{style:{fontSize:"12px",color:"var(--color-status-error)"},children:"This field is required."})]})]})},o={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px"},children:[e.jsx(l,{placeholder:"Small width",style:{width:"150px"}}),e.jsx(l,{placeholder:"Medium width (default)",style:{width:"300px"}}),e.jsx(l,{placeholder:"Large width",style:{width:"450px"}}),e.jsx(l,{placeholder:"Full width",style:{width:"100%"}})]})};var n,c,u;t.parameters={...t.parameters,docs:{...(n=t.parameters)==null?void 0:n.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter text...',
    type: 'text'
  }
}`,...(u=(c=t.parameters)==null?void 0:c.docs)==null?void 0:u.source}}};var x,m,h;r.parameters={...r.parameters,docs:{...(x=r.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '300px'
  }}>
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="search" placeholder="Search input" />
      <Input type="tel" placeholder="Phone input" />
      <Input type="url" placeholder="URL input" />
    </div>
}`,...(h=(m=r.parameters)==null?void 0:m.docs)==null?void 0:h.source}}};var f,y,v;a.parameters={...a.parameters,docs:{...(f=a.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '300px'
  }}>
      <Input defaultValue="Hello World" />
      <Input type="email" defaultValue="user@example.com" />
      <Input type="password" defaultValue="password123" />
    </div>
}`,...(v=(y=a.parameters)==null?void 0:y.docs)==null?void 0:v.source}}};var g,w,j;i.parameters={...i.parameters,docs:{...(g=i.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '300px'
  }}>
      <Input disabled placeholder="Disabled empty" />
      <Input disabled defaultValue="Disabled with value" />
    </div>
}`,...(j=(w=i.parameters)==null?void 0:w.docs)==null?void 0:j.source}}};var I,b,D;s.parameters={...s.parameters,docs:{...(I=s.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '300px'
  }}>
      <Input aria-invalid="true" placeholder="Invalid input" />
      <Input aria-invalid="true" defaultValue="Invalid with value" />
    </div>
}`,...(D=(b=s.parameters)==null?void 0:b.docs)==null?void 0:D.source}}};var S,W,F;p.parameters={...p.parameters,docs:{...(S=p.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '300px'
  }}>
      <Input type="file" />
      <Input type="file" accept="image/*" />
    </div>
}`,...(F=(W=p.parameters)==null?void 0:W.docs)==null?void 0:F.source}}};var V,E,z;d.parameters={...d.parameters,docs:{...(V=d.parameters)==null?void 0:V.docs,source:{originalSource:`{
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
        <label htmlFor="name" style={{
        fontSize: '14px',
        fontWeight: 500,
        color: 'var(--fg-default)'
      }}>
          Name
        </label>
        <Input id="name" placeholder="Enter your name" />
      </div>
      <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
        <label htmlFor="email" style={{
        fontSize: '14px',
        fontWeight: 500,
        color: 'var(--fg-default)'
      }}>
          Email
        </label>
        <Input id="email" type="email" placeholder="Enter your email" />
        <span style={{
        fontSize: '12px',
        color: 'var(--fg-subtle)'
      }}>
          We'll never share your email.
        </span>
      </div>
      <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
        <label htmlFor="error-field" style={{
        fontSize: '14px',
        fontWeight: 500,
        color: 'var(--fg-default)'
      }}>
          Required Field
        </label>
        <Input id="error-field" aria-invalid="true" placeholder="This field has an error" />
        <span style={{
        fontSize: '12px',
        color: 'var(--color-status-error)'
      }}>
          This field is required.
        </span>
      </div>
    </div>
}`,...(z=(E=d.parameters)==null?void 0:E.docs)==null?void 0:z.source}}};var T,L,P;o.parameters={...o.parameters,docs:{...(T=o.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }}>
      <Input placeholder="Small width" style={{
      width: '150px'
    }} />
      <Input placeholder="Medium width (default)" style={{
      width: '300px'
    }} />
      <Input placeholder="Large width" style={{
      width: '450px'
    }} />
      <Input placeholder="Full width" style={{
      width: '100%'
    }} />
    </div>
}`,...(P=(L=o.parameters)==null?void 0:L.docs)==null?void 0:P.source}}};const _=["Default","Types","WithValue","Disabled","Invalid","FileInput","WithLabels","Widths"];export{t as Default,i as Disabled,p as FileInput,s as Invalid,r as Types,o as Widths,d as WithLabels,a as WithValue,_ as __namedExportsOrder,U as default};
