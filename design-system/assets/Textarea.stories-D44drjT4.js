import{j as e}from"./iframe-DOj_uB-Z.js";import{T as r}from"./Textarea-DDmrS_3K.js";import{L as c}from"./Label-CCcyll5J.js";import"./preload-helper-CwRszBsw.js";import"./utils-CF6QUdYH.js";const q={title:"Form Inputs/Textarea",component:r,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{placeholder:{control:"text",description:"Placeholder text"},disabled:{control:"boolean",description:"Disable textarea"},rows:{control:"number",description:"Number of visible rows"}}},a={args:{placeholder:"Enter your message..."},decorators:[s=>e.jsx("div",{style:{width:"400px"},children:e.jsx(s,{})})]},o={args:{defaultValue:`This is a pre-filled textarea with some content that spans multiple lines.

You can edit this text.`},decorators:[s=>e.jsx("div",{style:{width:"400px"},children:e.jsx(s,{})})]},t={args:{placeholder:"Cannot edit",disabled:!0},decorators:[s=>e.jsx("div",{style:{width:"400px"},children:e.jsx(s,{})})]},l={args:{"aria-invalid":"true",defaultValue:"Invalid content"},decorators:[s=>e.jsx("div",{style:{width:"400px"},children:e.jsx(s,{})})]},i={render:()=>e.jsxs("div",{style:{width:"400px",display:"flex",flexDirection:"column",gap:"16px"},children:[e.jsx(r,{placeholder:"3 rows",rows:3}),e.jsx(r,{placeholder:"6 rows",rows:6}),e.jsx(r,{placeholder:"10 rows",rows:10})]})},d={render:()=>e.jsxs("div",{style:{width:"400px",display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx(c,{htmlFor:"message",children:"Message"}),e.jsx(r,{id:"message",placeholder:"Enter your message..."})]})},n={render:()=>e.jsxs("div",{style:{width:"400px",display:"flex",flexDirection:"column",gap:"16px"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx(c,{htmlFor:"bio",required:!0,children:"Bio"}),e.jsx(r,{id:"bio",placeholder:"Tell us about yourself...",rows:4}),e.jsx("span",{style:{fontSize:"12px",color:"var(--fg-subtle)"},children:"Max 500 characters."})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx(c,{htmlFor:"feedback",children:"Feedback"}),e.jsx(r,{id:"feedback",placeholder:"Share your thoughts...",rows:4})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx(c,{htmlFor:"error-field",error:!0,children:"Description"}),e.jsx(r,{id:"error-field","aria-invalid":"true",defaultValue:"Too short"}),e.jsx("span",{style:{fontSize:"12px",color:"var(--color-status-error)"},children:"Description must be at least 50 characters."})]})]})};var p,x,u;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter your message...'
  },
  decorators: [Story => <div style={{
    width: '400px'
  }}>
        <Story />
      </div>]
}`,...(u=(x=a.parameters)==null?void 0:x.docs)==null?void 0:u.source}}};var m,h,f;o.parameters={...o.parameters,docs:{...(m=o.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    defaultValue: 'This is a pre-filled textarea with some content that spans multiple lines.\\n\\nYou can edit this text.'
  },
  decorators: [Story => <div style={{
    width: '400px'
  }}>
        <Story />
      </div>]
}`,...(f=(h=o.parameters)==null?void 0:h.docs)==null?void 0:f.source}}};var y,g,v;t.parameters={...t.parameters,docs:{...(y=t.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    placeholder: 'Cannot edit',
    disabled: true
  },
  decorators: [Story => <div style={{
    width: '400px'
  }}>
        <Story />
      </div>]
}`,...(v=(g=t.parameters)==null?void 0:g.docs)==null?void 0:v.source}}};var b,w,j;l.parameters={...l.parameters,docs:{...(b=l.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    'aria-invalid': 'true',
    defaultValue: 'Invalid content'
  },
  decorators: [Story => <div style={{
    width: '400px'
  }}>
        <Story />
      </div>]
}`,...(j=(w=l.parameters)==null?void 0:w.docs)==null?void 0:j.source}}};var D,S,T;i.parameters={...i.parameters,docs:{...(D=i.parameters)==null?void 0:D.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }}>
      <Textarea placeholder="3 rows" rows={3} />
      <Textarea placeholder="6 rows" rows={6} />
      <Textarea placeholder="10 rows" rows={10} />
    </div>
}`,...(T=(S=i.parameters)==null?void 0:S.docs)==null?void 0:T.source}}};var F,L,E;d.parameters={...d.parameters,docs:{...(F=d.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  }}>
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" placeholder="Enter your message..." />
    </div>
}`,...(E=(L=d.parameters)==null?void 0:L.docs)==null?void 0:E.source}}};var V,k,I;n.parameters={...n.parameters,docs:{...(V=n.parameters)==null?void 0:V.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }}>
      <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
        <Label htmlFor="bio" required>Bio</Label>
        <Textarea id="bio" placeholder="Tell us about yourself..." rows={4} />
        <span style={{
        fontSize: '12px',
        color: 'var(--fg-subtle)'
      }}>
          Max 500 characters.
        </span>
      </div>
      <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
        <Label htmlFor="feedback">Feedback</Label>
        <Textarea id="feedback" placeholder="Share your thoughts..." rows={4} />
      </div>
      <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
        <Label htmlFor="error-field" error>Description</Label>
        <Textarea id="error-field" aria-invalid="true" defaultValue="Too short" />
        <span style={{
        fontSize: '12px',
        color: 'var(--color-status-error)'
      }}>
          Description must be at least 50 characters.
        </span>
      </div>
    </div>
}`,...(I=(k=n.parameters)==null?void 0:k.docs)==null?void 0:I.source}}};const B=["Default","WithValue","Disabled","Invalid","CustomRows","WithLabel","FormExample"];export{i as CustomRows,a as Default,t as Disabled,n as FormExample,l as Invalid,d as WithLabel,o as WithValue,B as __namedExportsOrder,q as default};
