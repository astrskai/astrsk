import{r as N,j as e}from"./iframe-CZ4dJ1rT.js";import{c as G}from"./utils-DuMXYCiK.js";import"./preload-helper-Dp1pzeXC.js";const q={default:"bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-bg-hover)]",destructive:"bg-[var(--color-status-error)] text-white hover:opacity-90",outline:"border border-[var(--btn-outline-border)] bg-transparent text-[var(--btn-outline-fg)] hover:bg-[var(--btn-outline-bg-hover)]",secondary:"bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-fg)] border border-[var(--border-muted)] hover:bg-[var(--btn-secondary-bg-hover)]",ghost:"bg-transparent text-[var(--btn-ghost-fg)] hover:bg-[var(--btn-ghost-bg-hover)]",link:"text-[var(--accent-primary)] underline-offset-4 hover:underline"},H={default:"h-9 px-4 py-2 has-[>svg]:px-3",sm:"h-8 rounded-lg gap-1.5 px-3 text-xs has-[>svg]:px-2.5",lg:"h-11 rounded-xl px-6 text-base has-[>svg]:px-4",icon:"size-9","icon-sm":"size-8","icon-lg":"size-11"},t=N.forwardRef(({className:V,variant:C="default",size:O="default",round:T=!1,..._},E)=>e.jsx("button",{ref:E,"data-slot":"button",className:G("inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all",T?"rounded-full":"rounded-xl","disabled:pointer-events-none disabled:opacity-50","outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]","[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",q[C],H[O],V),..._}));t.displayName="Button";t.__docgenInfo={description:"",methods:[],displayName:"Button",props:{variant:{required:!1,tsType:{name:"union",raw:"keyof typeof variantStyles",elements:[{name:"literal",value:"default"},{name:"literal",value:"destructive"},{name:"literal",value:"outline"},{name:"literal",value:"secondary"},{name:"literal",value:"ghost"},{name:"literal",value:"link"}]},description:"",defaultValue:{value:"'default'",computed:!1}},size:{required:!1,tsType:{name:"union",raw:"keyof typeof sizeStyles",elements:[{name:"literal",value:"default"},{name:"literal",value:"sm"},{name:"literal",value:"lg"},{name:"literal",value:"icon"},{name:"literal",value:"'icon-sm'"},{name:"literal",value:"'icon-lg'"}]},description:"",defaultValue:{value:"'default'",computed:!1}},round:{required:!1,tsType:{name:"boolean"},description:"If true, applies rounded-full instead of default border radius",defaultValue:{value:"false",computed:!1}}}};const a=()=>e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M12 5v14M5 12h14"})}),W=()=>e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"})}),A=()=>e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"})}),c=()=>e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{width:"20",height:"16",x:"2",y:"4",rx:"2"}),e.jsx("path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"})]}),K={title:"Actions/Button",component:t,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["default","secondary","outline","ghost","destructive","link"],description:"Visual style variant",table:{defaultValue:{summary:"default"}}},size:{control:"select",options:["default","sm","lg","icon","icon-sm","icon-lg"],description:"Button size",table:{defaultValue:{summary:"default"}}},disabled:{control:"boolean",description:"Disable button"},onClick:{action:"clicked"}}},n={args:{children:"Button",variant:"default",size:"default"}},i={render:()=>e.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"},children:[e.jsx(t,{variant:"default",children:"Default"}),e.jsx(t,{variant:"secondary",children:"Secondary"}),e.jsx(t,{variant:"outline",children:"Outline"}),e.jsx(t,{variant:"ghost",children:"Ghost"}),e.jsx(t,{variant:"destructive",children:"Destructive"}),e.jsx(t,{variant:"link",children:"Link"})]})},s={render:()=>e.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"center"},children:[e.jsx(t,{size:"sm",children:"Small"}),e.jsx(t,{size:"default",children:"Default"}),e.jsx(t,{size:"lg",children:"Large"})]})},r={render:()=>e.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"},children:[e.jsxs(t,{children:[e.jsx(c,{})," Login with Email"]}),e.jsxs(t,{variant:"secondary",children:[e.jsx(W,{})," Download"]}),e.jsxs(t,{variant:"outline",children:[e.jsx(a,{})," Add New"]}),e.jsxs(t,{variant:"ghost",children:["Settings ",e.jsx(a,{})]})]})},l={render:()=>e.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"center"},children:[e.jsx(t,{size:"icon-sm","aria-label":"Add",children:e.jsx(a,{})}),e.jsx(t,{size:"icon","aria-label":"Download",children:e.jsx(W,{})}),e.jsx(t,{size:"icon-lg","aria-label":"Mail",children:e.jsx(c,{})}),e.jsx(t,{size:"icon",variant:"destructive","aria-label":"Delete",children:e.jsx(A,{})}),e.jsx(t,{size:"icon",variant:"outline","aria-label":"Add",children:e.jsx(a,{})}),e.jsx(t,{size:"icon",variant:"ghost","aria-label":"Settings",children:e.jsx(c,{})})]})},o={render:()=>e.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"},children:[e.jsx(t,{disabled:!0,children:"Disabled"}),e.jsx(t,{disabled:!0,variant:"secondary",children:"Disabled"}),e.jsx(t,{disabled:!0,variant:"outline",children:"Disabled"}),e.jsx(t,{disabled:!0,size:"icon","aria-label":"Add",children:e.jsx(a,{})})]})},d={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"24px"},children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"center"},children:[e.jsx(t,{size:"sm",children:"Small"}),e.jsx(t,{size:"default",children:"Default"}),e.jsx(t,{size:"lg",children:"Large"}),e.jsx(t,{size:"icon-sm","aria-label":"Icon",children:e.jsx(a,{})}),e.jsx(t,{size:"icon","aria-label":"Icon",children:e.jsx(a,{})}),e.jsx(t,{size:"icon-lg","aria-label":"Icon",children:e.jsx(a,{})})]})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Secondary"}),e.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"center"},children:[e.jsx(t,{variant:"secondary",size:"sm",children:"Small"}),e.jsx(t,{variant:"secondary",size:"default",children:"Default"}),e.jsx(t,{variant:"secondary",size:"lg",children:"Large"}),e.jsx(t,{variant:"secondary",size:"icon","aria-label":"Icon",children:e.jsx(a,{})})]})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Outline"}),e.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"center"},children:[e.jsx(t,{variant:"outline",size:"sm",children:"Small"}),e.jsx(t,{variant:"outline",size:"default",children:"Default"}),e.jsx(t,{variant:"outline",size:"lg",children:"Large"}),e.jsx(t,{variant:"outline",size:"icon","aria-label":"Icon",children:e.jsx(a,{})})]})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Ghost"}),e.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"center"},children:[e.jsx(t,{variant:"ghost",size:"sm",children:"Small"}),e.jsx(t,{variant:"ghost",size:"default",children:"Default"}),e.jsx(t,{variant:"ghost",size:"lg",children:"Large"}),e.jsx(t,{variant:"ghost",size:"icon","aria-label":"Icon",children:e.jsx(a,{})})]})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Destructive"}),e.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"center"},children:[e.jsx(t,{variant:"destructive",size:"sm",children:"Small"}),e.jsx(t,{variant:"destructive",size:"default",children:"Default"}),e.jsx(t,{variant:"destructive",size:"lg",children:"Large"}),e.jsx(t,{variant:"destructive",size:"icon","aria-label":"Icon",children:e.jsx(A,{})})]})]})]})};var u,v,x;n.parameters={...n.parameters,docs:{...(u=n.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default'
  }
}`,...(x=(v=n.parameters)==null?void 0:v.docs)==null?void 0:x.source}}};var p,g,m;i.parameters={...i.parameters,docs:{...(p=i.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  }}>
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
}`,...(m=(g=i.parameters)==null?void 0:g.docs)==null?void 0:m.source}}};var h,f,B;s.parameters={...s.parameters,docs:{...(h=s.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  }}>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
}`,...(B=(f=s.parameters)==null?void 0:f.docs)==null?void 0:B.source}}};var y,j,b;r.parameters={...r.parameters,docs:{...(y=r.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  }}>
      <Button>
        <MailIcon /> Login with Email
      </Button>
      <Button variant="secondary">
        <DownloadIcon /> Download
      </Button>
      <Button variant="outline">
        <PlusIcon /> Add New
      </Button>
      <Button variant="ghost">
        Settings <PlusIcon />
      </Button>
    </div>
}`,...(b=(j=r.parameters)==null?void 0:j.docs)==null?void 0:b.source}}};var z,I,w;l.parameters={...l.parameters,docs:{...(z=l.parameters)==null?void 0:z.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  }}>
      <Button size="icon-sm" aria-label="Add">
        <PlusIcon />
      </Button>
      <Button size="icon" aria-label="Download">
        <DownloadIcon />
      </Button>
      <Button size="icon-lg" aria-label="Mail">
        <MailIcon />
      </Button>
      <Button size="icon" variant="destructive" aria-label="Delete">
        <TrashIcon />
      </Button>
      <Button size="icon" variant="outline" aria-label="Add">
        <PlusIcon />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Settings">
        <MailIcon />
      </Button>
    </div>
}`,...(w=(I=l.parameters)==null?void 0:I.docs)==null?void 0:w.source}}};var S,D,k;o.parameters={...o.parameters,docs:{...(S=o.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  }}>
      <Button disabled>Disabled</Button>
      <Button disabled variant="secondary">
        Disabled
      </Button>
      <Button disabled variant="outline">
        Disabled
      </Button>
      <Button disabled size="icon" aria-label="Add">
        <PlusIcon />
      </Button>
    </div>
}`,...(k=(D=o.parameters)==null?void 0:D.docs)==null?void 0:k.source}}};var L,M,P;d.parameters={...d.parameters,docs:{...(L=d.parameters)==null?void 0:L.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }}>
      <div>
        <h4 style={{
        marginBottom: '12px',
        fontSize: '14px',
        color: 'var(--fg-muted)'
      }}>
          Default
        </h4>
        <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon-sm" aria-label="Icon"><PlusIcon /></Button>
          <Button size="icon" aria-label="Icon"><PlusIcon /></Button>
          <Button size="icon-lg" aria-label="Icon"><PlusIcon /></Button>
        </div>
      </div>
      <div>
        <h4 style={{
        marginBottom: '12px',
        fontSize: '14px',
        color: 'var(--fg-muted)'
      }}>
          Secondary
        </h4>
        <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
          <Button variant="secondary" size="sm">Small</Button>
          <Button variant="secondary" size="default">Default</Button>
          <Button variant="secondary" size="lg">Large</Button>
          <Button variant="secondary" size="icon" aria-label="Icon"><PlusIcon /></Button>
        </div>
      </div>
      <div>
        <h4 style={{
        marginBottom: '12px',
        fontSize: '14px',
        color: 'var(--fg-muted)'
      }}>
          Outline
        </h4>
        <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
          <Button variant="outline" size="sm">Small</Button>
          <Button variant="outline" size="default">Default</Button>
          <Button variant="outline" size="lg">Large</Button>
          <Button variant="outline" size="icon" aria-label="Icon"><PlusIcon /></Button>
        </div>
      </div>
      <div>
        <h4 style={{
        marginBottom: '12px',
        fontSize: '14px',
        color: 'var(--fg-muted)'
      }}>
          Ghost
        </h4>
        <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
          <Button variant="ghost" size="sm">Small</Button>
          <Button variant="ghost" size="default">Default</Button>
          <Button variant="ghost" size="lg">Large</Button>
          <Button variant="ghost" size="icon" aria-label="Icon"><PlusIcon /></Button>
        </div>
      </div>
      <div>
        <h4 style={{
        marginBottom: '12px',
        fontSize: '14px',
        color: 'var(--fg-muted)'
      }}>
          Destructive
        </h4>
        <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
          <Button variant="destructive" size="sm">Small</Button>
          <Button variant="destructive" size="default">Default</Button>
          <Button variant="destructive" size="lg">Large</Button>
          <Button variant="destructive" size="icon" aria-label="Icon"><TrashIcon /></Button>
        </div>
      </div>
    </div>
}`,...(P=(M=d.parameters)==null?void 0:M.docs)==null?void 0:P.source}}};const Q=["Default","Variants","Sizes","WithIcon","IconOnly","Disabled","AllCombinations"];export{d as AllCombinations,n as Default,o as Disabled,l as IconOnly,s as Sizes,i as Variants,r as WithIcon,Q as __namedExportsOrder,K as default};
