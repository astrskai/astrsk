import{r as j,j as e}from"./iframe-CHvyI5Jn.js";import{c as T}from"./utils-DuMXYCiK.js";import{L as ee}from"./Label-CwSRlL5B.js";import{T as re}from"./Textarea-qiagSb2x.js";import"./preload-helper-CwRszBsw.js";const a=j.forwardRef(({label:r,hint:l,error:s,labelPosition:o="top",required:h,className:K,id:Q,...b},U)=>{const X=j.useId(),t=Q||X,g=l?`${t}-hint`:void 0,v=s?`${t}-error`:void 0,w=r&&e.jsx(ee,{htmlFor:t,required:h,className:T(o==="left"&&"min-w-[100px]"),children:r}),Y=o==="inner"?b.placeholder||" ":b.placeholder,f=e.jsx(re,{ref:U,id:t,required:h,"aria-invalid":s?"true":void 0,"aria-describedby":[v,g].filter(Boolean).join(" ")||void 0,placeholder:Y,className:K,...b}),y=(s||l)&&e.jsxs("div",{className:"flex flex-col gap-1",children:[s&&e.jsx("p",{id:v,className:"text-xs text-[var(--color-status-error)]",children:s}),l&&!s&&e.jsx("p",{id:g,className:"text-xs text-[var(--fg-subtle)]",children:l})]}),Z=r&&e.jsxs("label",{htmlFor:t,className:T("absolute top-0 left-3 -translate-y-1/2 px-1 text-xs font-medium pointer-events-none","bg-[var(--input-bg)] rounded-sm",s?"text-[var(--color-status-error)]":"text-[var(--fg-muted)]"),children:[r,h&&e.jsx("span",{className:"text-[var(--color-status-error)] ml-0.5",children:"*"})]});return o==="inner"?e.jsxs("div",{className:"relative",children:[f,Z,y]}):o==="left"?e.jsxs("div",{className:"flex items-start gap-3",children:[w,e.jsxs("div",{className:"flex flex-1 flex-col gap-1.5",children:[f,y]})]}):e.jsxs("div",{className:"flex flex-col gap-1.5",children:[w,f,y]})});a.displayName="LabeledTextarea";a.__docgenInfo={description:"",methods:[],displayName:"LabeledTextarea",props:{label:{required:!1,tsType:{name:"string"},description:"Label text"},hint:{required:!1,tsType:{name:"string"},description:"Helper text shown below textarea"},error:{required:!1,tsType:{name:"string"},description:"Error message (also sets aria-invalid)"},labelPosition:{required:!1,tsType:{name:"union",raw:"'top' | 'left' | 'inner'",elements:[{name:"literal",value:"'top'"},{name:"literal",value:"'left'"},{name:"literal",value:"'inner'"}]},description:"Label position: top (above), left (inline), inner (floating on border)",defaultValue:{value:"'top'",computed:!1}},required:{required:!1,tsType:{name:"boolean"},description:"Required field indicator"}}};const ie={title:"Form Inputs/LabeledTextarea",component:a,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{label:{control:"text",description:"Label text"},hint:{control:"text",description:"Helper text shown below textarea"},error:{control:"text",description:"Error message"},labelPosition:{control:"select",options:["top","left","inner"],description:"Label position: top (above), left (inline), inner (floating on border)",table:{defaultValue:{summary:"top"}}},required:{control:"boolean",description:"Required field indicator"},disabled:{control:"boolean",description:"Disable textarea"},rows:{control:"number",description:"Number of visible rows"}}},i={args:{label:"Message",placeholder:"Enter your message..."},decorators:[r=>e.jsx("div",{style:{width:"400px"},children:e.jsx(r,{})})]},n={args:{label:"Bio",placeholder:"Tell us about yourself...",hint:"Max 500 characters.",rows:4},decorators:[r=>e.jsx("div",{style:{width:"400px"},children:e.jsx(r,{})})]},d={args:{label:"Description",placeholder:"Enter description...",error:"Description must be at least 50 characters.",defaultValue:"Too short"},decorators:[r=>e.jsx("div",{style:{width:"400px"},children:e.jsx(r,{})})]},c={args:{label:"Feedback",placeholder:"Share your thoughts...",required:!0},decorators:[r=>e.jsx("div",{style:{width:"400px"},children:e.jsx(r,{})})]},p={render:()=>e.jsxs("div",{style:{width:"500px",display:"flex",flexDirection:"column",gap:"16px"},children:[e.jsx(a,{label:"Comments",labelPosition:"left",placeholder:"Enter comments...",rows:4}),e.jsx(a,{label:"Notes",labelPosition:"left",placeholder:"Enter notes...",hint:"Optional field",rows:4})]})},x={render:()=>e.jsxs("div",{style:{width:"400px",display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsx(a,{label:"Message",labelPosition:"inner",placeholder:"Enter your message...",rows:4}),e.jsx(a,{label:"Description",labelPosition:"inner",placeholder:"Enter description...",required:!0,rows:4}),e.jsx(a,{label:"Notes",labelPosition:"inner",placeholder:"Add notes...",hint:"Optional",rows:4}),e.jsx(a,{label:"Invalid Field",labelPosition:"inner",placeholder:"This has an error",error:"This field is required.",rows:4})]})},m={args:{label:"Disabled Field",placeholder:"Cannot edit",disabled:!0},decorators:[r=>e.jsx("div",{style:{width:"400px"},children:e.jsx(r,{})})]},u={render:()=>e.jsxs("div",{style:{width:"400px",display:"flex",flexDirection:"column",gap:"16px"},children:[e.jsx(a,{label:"Bio",placeholder:"Tell us about yourself...",hint:"Max 500 characters.",required:!0,rows:4}),e.jsx(a,{label:"Goals",placeholder:"What are your goals?",rows:3}),e.jsx(a,{label:"Experience",placeholder:"Describe your experience...",error:"Please provide more detail (minimum 100 characters).",defaultValue:"I have some experience.",rows:4})]})};var E,L,D;i.parameters={...i.parameters,docs:{...(E=i.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    label: 'Message',
    placeholder: 'Enter your message...'
  },
  decorators: [Story => <div style={{
    width: '400px'
  }}>
        <Story />
      </div>]
}`,...(D=(L=i.parameters)==null?void 0:L.docs)==null?void 0:D.source}}};var S,q,N;n.parameters={...n.parameters,docs:{...(S=n.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    label: 'Bio',
    placeholder: 'Tell us about yourself...',
    hint: 'Max 500 characters.',
    rows: 4
  },
  decorators: [Story => <div style={{
    width: '400px'
  }}>
        <Story />
      </div>]
}`,...(N=(q=n.parameters)==null?void 0:q.docs)==null?void 0:N.source}}};var P,I,F;d.parameters={...d.parameters,docs:{...(P=d.parameters)==null?void 0:P.docs,source:{originalSource:`{
  args: {
    label: 'Description',
    placeholder: 'Enter description...',
    error: 'Description must be at least 50 characters.',
    defaultValue: 'Too short'
  },
  decorators: [Story => <div style={{
    width: '400px'
  }}>
        <Story />
      </div>]
}`,...(F=(I=d.parameters)==null?void 0:I.docs)==null?void 0:F.source}}};var M,R,V;c.parameters={...c.parameters,docs:{...(M=c.parameters)==null?void 0:M.docs,source:{originalSource:`{
  args: {
    label: 'Feedback',
    placeholder: 'Share your thoughts...',
    required: true
  },
  decorators: [Story => <div style={{
    width: '400px'
  }}>
        <Story />
      </div>]
}`,...(V=(R=c.parameters)==null?void 0:R.docs)==null?void 0:V.source}}};var W,B,O;p.parameters={...p.parameters,docs:{...(W=p.parameters)==null?void 0:W.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '500px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }}>
      <LabeledTextarea label="Comments" labelPosition="left" placeholder="Enter comments..." rows={4} />
      <LabeledTextarea label="Notes" labelPosition="left" placeholder="Enter notes..." hint="Optional field" rows={4} />
    </div>
}`,...(O=(B=p.parameters)==null?void 0:B.docs)==null?void 0:O.source}}};var C,H,_;x.parameters={...x.parameters,docs:{...(C=x.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  }}>
      <LabeledTextarea label="Message" labelPosition="inner" placeholder="Enter your message..." rows={4} />
      <LabeledTextarea label="Description" labelPosition="inner" placeholder="Enter description..." required rows={4} />
      <LabeledTextarea label="Notes" labelPosition="inner" placeholder="Add notes..." hint="Optional" rows={4} />
      <LabeledTextarea label="Invalid Field" labelPosition="inner" placeholder="This has an error" error="This field is required." rows={4} />
    </div>
}`,...(_=(H=x.parameters)==null?void 0:H.docs)==null?void 0:_.source}}};var k,A,G;m.parameters={...m.parameters,docs:{...(k=m.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    label: 'Disabled Field',
    placeholder: 'Cannot edit',
    disabled: true
  },
  decorators: [Story => <div style={{
    width: '400px'
  }}>
        <Story />
      </div>]
}`,...(G=(A=m.parameters)==null?void 0:A.docs)==null?void 0:G.source}}};var $,z,J;u.parameters={...u.parameters,docs:{...($=u.parameters)==null?void 0:$.docs,source:{originalSource:`{
  render: () => <div style={{
    width: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }}>
      <LabeledTextarea label="Bio" placeholder="Tell us about yourself..." hint="Max 500 characters." required rows={4} />
      <LabeledTextarea label="Goals" placeholder="What are your goals?" rows={3} />
      <LabeledTextarea label="Experience" placeholder="Describe your experience..." error="Please provide more detail (minimum 100 characters)." defaultValue="I have some experience." rows={4} />
    </div>
}`,...(J=(z=u.parameters)==null?void 0:z.docs)==null?void 0:J.source}}};const ne=["Default","WithHint","WithError","Required","LabelLeft","LabelInner","Disabled","FormExample"];export{i as Default,m as Disabled,u as FormExample,x as LabelInner,p as LabelLeft,c as Required,d as WithError,n as WithHint,ne as __namedExportsOrder,ie as default};
