import{r as f,j as e}from"./iframe-zKWJ0SCh.js";import{c as le}from"./utils-DuMXYCiK.js";import"./preload-helper-CwRszBsw.js";const ie={xs:"h-6 w-6 text-xs",sm:"h-8 w-8 text-xs",md:"h-10 w-10 text-sm",lg:"h-12 w-12 text-sm",xl:"h-16 w-16 text-base","2xl":"h-24 w-24 text-lg"},a=f.forwardRef(({src:s,alt:u="Avatar",size:O="md",customSize:t,fallback:K,className:Q,style:Y,...Z},ee)=>{const[ae,z]=f.useState(!1),se=()=>{z(!0)};f.useEffect(()=>{z(!1)},[s]);const re=!s||ae,te=K??(u?u.charAt(0).toUpperCase():"?");return e.jsx("div",{ref:ee,"data-slot":"avatar",className:le("relative flex shrink-0 items-center justify-center overflow-hidden rounded-full","border border-[var(--border-default)] bg-[var(--bg-surface)]",!t&&ie[O],Q),style:{...t&&{width:t,height:t},...Y},...Z,children:re?e.jsx("span",{className:"flex h-full w-full items-center justify-center bg-[var(--bg-elevated)] font-medium text-[var(--fg-muted)]",children:te}):e.jsx("img",{src:s,alt:u,onError:se,className:"h-full w-full object-cover"})})});a.displayName="Avatar";a.__docgenInfo={description:"",methods:[],displayName:"Avatar",props:{src:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Image source URL"},alt:{required:!1,tsType:{name:"string"},description:"Alt text for the image, also used for fallback initial",defaultValue:{value:"'Avatar'",computed:!1}},size:{required:!1,tsType:{name:"union",raw:"'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'",elements:[{name:"literal",value:"'xs'"},{name:"literal",value:"'sm'"},{name:"literal",value:"'md'"},{name:"literal",value:"'lg'"},{name:"literal",value:"'xl'"},{name:"literal",value:"'2xl'"}]},description:"Predefined size: xs (24px), sm (32px), md (40px), lg (48px), xl (64px), 2xl (96px)",defaultValue:{value:"'md'",computed:!1}},customSize:{required:!1,tsType:{name:"number"},description:"Custom size in pixels (overrides size prop)"},fallback:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Fallback content when no src is provided (defaults to first letter of alt)"}}};const me={title:"Display/Avatar",component:a,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{size:{control:"select",options:["xs","sm","md","lg","xl","2xl"],description:"Predefined avatar size",table:{defaultValue:{summary:"md"}}},customSize:{control:"number",description:"Custom size in pixels (overrides size prop)"},src:{control:"text",description:"Image source URL"},alt:{control:"text",description:"Alt text (also used for fallback initial)"}}},r="https://i.pravatar.cc/150?img=1",l={args:{src:r,alt:"John Doe",size:"md"}},i={render:()=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px"},children:[e.jsx(a,{src:r,alt:"XS",size:"xs"}),e.jsx(a,{src:r,alt:"SM",size:"sm"}),e.jsx(a,{src:r,alt:"MD",size:"md"}),e.jsx(a,{src:r,alt:"LG",size:"lg"}),e.jsx(a,{src:r,alt:"XL",size:"xl"}),e.jsx(a,{src:r,alt:"2XL",size:"2xl"})]})},c={render:()=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"16px"},children:["xs","sm","md","lg","xl","2xl"].map(s=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx(a,{src:r,alt:"User",size:s}),e.jsxs("span",{style:{color:"var(--fg-muted)",fontSize:"14px"},children:[s," - ",s==="xs"?"24px":s==="sm"?"32px":s==="md"?"40px":s==="lg"?"48px":s==="xl"?"64px":"96px"]})]},s))})},o={render:()=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px"},children:[e.jsx(a,{src:r,alt:"User",customSize:36}),e.jsx(a,{src:r,alt:"User",customSize:56}),e.jsx(a,{src:r,alt:"User",customSize:80}),e.jsx(a,{src:r,alt:"User",customSize:120})]})},n={render:()=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px"},children:[e.jsx(a,{alt:"John Doe",size:"md"}),e.jsx(a,{alt:"Alice",size:"md"}),e.jsx(a,{alt:"Bob",size:"md"}),e.jsx(a,{alt:"Charlie",size:"lg"}),e.jsx(a,{alt:"Diana",size:"xl"})]})},m={render:()=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px"},children:[e.jsx(a,{alt:"User",size:"md",fallback:"👤"}),e.jsx(a,{alt:"Admin",size:"md",fallback:"🔒"}),e.jsx(a,{alt:"Team",size:"lg",fallback:e.jsx("span",{style:{fontSize:"10px"},children:"TEAM"})})]})},p=({className:s})=>e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:s,style:{color:"var(--fg-muted)"},children:[e.jsx("path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"12",cy:"7",r:"4"})]}),d={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"24px"},children:[e.jsxs("div",{children:[e.jsx("p",{style:{color:"var(--fg-muted)",fontSize:"14px",marginBottom:"12px"},children:"Logged-out state (with user icon fallback):"}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px"},children:[e.jsx(a,{alt:"User",size:"sm",fallback:e.jsx(p,{className:"h-4 w-4"})}),e.jsx(a,{alt:"User",size:"md",fallback:e.jsx(p,{className:"h-5 w-5"})}),e.jsx(a,{alt:"User",size:"lg",fallback:e.jsx(p,{className:"h-6 w-6"})}),e.jsx(a,{alt:"User",size:"xl",fallback:e.jsx(p,{className:"h-8 w-8"})})]})]}),e.jsxs("div",{children:[e.jsx("p",{style:{color:"var(--fg-muted)",fontSize:"14px",marginBottom:"12px"},children:"Logged-in state (with image):"}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px"},children:[e.jsx(a,{src:"https://i.pravatar.cc/150?img=5",alt:"John",size:"sm"}),e.jsx(a,{src:"https://i.pravatar.cc/150?img=5",alt:"John",size:"md"}),e.jsx(a,{src:"https://i.pravatar.cc/150?img=5",alt:"John",size:"lg"}),e.jsx(a,{src:"https://i.pravatar.cc/150?img=5",alt:"John",size:"xl"})]})]})]})},x={args:{src:"https://invalid-url.com/broken-image.jpg",alt:"Broken",size:"lg"}},g={render:()=>e.jsx("div",{style:{display:"flex"},children:[1,2,3,4,5].map(s=>e.jsx("div",{style:{marginLeft:s===1?0:"-12px"},children:e.jsx(a,{src:`https://i.pravatar.cc/150?img=${s}`,alt:`User ${s}`,size:"md",style:{border:"2px solid var(--bg-canvas)"}})},s))})},v={render:()=>e.jsx("div",{style:{display:"flex",gap:"12px",flexWrap:"wrap"},children:[1,2,3,4,5,6,7,8].map(s=>e.jsx(a,{src:`https://i.pravatar.cc/150?img=${s+10}`,alt:`User ${s}`,size:"lg"},s))})};var h,y,j;l.parameters={...l.parameters,docs:{...(h=l.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    src: sampleImage,
    alt: 'John Doe',
    size: 'md'
  }
}`,...(j=(y=l.parameters)==null?void 0:y.docs)==null?void 0:j.source}}};var b,A,I;i.parameters={...i.parameters,docs:{...(b=i.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  }}>
      <Avatar src={sampleImage} alt="XS" size="xs" />
      <Avatar src={sampleImage} alt="SM" size="sm" />
      <Avatar src={sampleImage} alt="MD" size="md" />
      <Avatar src={sampleImage} alt="LG" size="lg" />
      <Avatar src={sampleImage} alt="XL" size="xl" />
      <Avatar src={sampleImage} alt="2XL" size="2xl" />
    </div>
}`,...(I=(A=i.parameters)==null?void 0:A.docs)==null?void 0:I.source}}};var k,S,w;c.parameters={...c.parameters,docs:{...(k=c.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }}>
      {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map(size => <div key={size} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
          <Avatar src={sampleImage} alt="User" size={size} />
          <span style={{
        color: 'var(--fg-muted)',
        fontSize: '14px'
      }}>
            {size} - {size === 'xs' ? '24px' : size === 'sm' ? '32px' : size === 'md' ? '40px' : size === 'lg' ? '48px' : size === 'xl' ? '64px' : '96px'}
          </span>
        </div>)}
    </div>
}`,...(w=(S=c.parameters)==null?void 0:S.docs)==null?void 0:w.source}}};var U,D,L;o.parameters={...o.parameters,docs:{...(U=o.parameters)==null?void 0:U.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  }}>
      <Avatar src={sampleImage} alt="User" customSize={36} />
      <Avatar src={sampleImage} alt="User" customSize={56} />
      <Avatar src={sampleImage} alt="User" customSize={80} />
      <Avatar src={sampleImage} alt="User" customSize={120} />
    </div>
}`,...(L=(D=o.parameters)==null?void 0:D.docs)==null?void 0:L.source}}};var N,C,J;n.parameters={...n.parameters,docs:{...(N=n.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  }}>
      <Avatar alt="John Doe" size="md" />
      <Avatar alt="Alice" size="md" />
      <Avatar alt="Bob" size="md" />
      <Avatar alt="Charlie" size="lg" />
      <Avatar alt="Diana" size="xl" />
    </div>
}`,...(J=(C=n.parameters)==null?void 0:C.docs)==null?void 0:J.source}}};var B,E,T;m.parameters={...m.parameters,docs:{...(B=m.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  }}>
      <Avatar alt="User" size="md" fallback="👤" />
      <Avatar alt="Admin" size="md" fallback="🔒" />
      <Avatar alt="Team" size="lg" fallback={<span style={{
      fontSize: '10px'
    }}>TEAM</span>} />
    </div>
}`,...(T=(E=m.parameters)==null?void 0:E.docs)==null?void 0:T.source}}};var R,$,M;d.parameters={...d.parameters,docs:{...(R=d.parameters)==null?void 0:R.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }}>
      <div>
        <p style={{
        color: 'var(--fg-muted)',
        fontSize: '14px',
        marginBottom: '12px'
      }}>
          Logged-out state (with user icon fallback):
        </p>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
          <Avatar alt="User" size="sm" fallback={<UserIcon className="h-4 w-4" />} />
          <Avatar alt="User" size="md" fallback={<UserIcon className="h-5 w-5" />} />
          <Avatar alt="User" size="lg" fallback={<UserIcon className="h-6 w-6" />} />
          <Avatar alt="User" size="xl" fallback={<UserIcon className="h-8 w-8" />} />
        </div>
      </div>
      <div>
        <p style={{
        color: 'var(--fg-muted)',
        fontSize: '14px',
        marginBottom: '12px'
      }}>
          Logged-in state (with image):
        </p>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
          <Avatar src="https://i.pravatar.cc/150?img=5" alt="John" size="sm" />
          <Avatar src="https://i.pravatar.cc/150?img=5" alt="John" size="md" />
          <Avatar src="https://i.pravatar.cc/150?img=5" alt="John" size="lg" />
          <Avatar src="https://i.pravatar.cc/150?img=5" alt="John" size="xl" />
        </div>
      </div>
    </div>
}`,...(M=($=d.parameters)==null?void 0:$.docs)==null?void 0:M.source}}};var F,X,q;x.parameters={...x.parameters,docs:{...(F=x.parameters)==null?void 0:F.docs,source:{originalSource:`{
  args: {
    src: 'https://invalid-url.com/broken-image.jpg',
    alt: 'Broken',
    size: 'lg'
  }
}`,...(q=(X=x.parameters)==null?void 0:X.docs)==null?void 0:q.source}}};var G,_,V;g.parameters={...g.parameters,docs:{...(G=g.parameters)==null?void 0:G.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex'
  }}>
      {[1, 2, 3, 4, 5].map(i => <div key={i} style={{
      marginLeft: i === 1 ? 0 : '-12px'
    }}>
          <Avatar src={\`https://i.pravatar.cc/150?img=\${i}\`} alt={\`User \${i}\`} size="md" style={{
        border: '2px solid var(--bg-canvas)'
      }} />
        </div>)}
    </div>
}`,...(V=(_=g.parameters)==null?void 0:_.docs)==null?void 0:V.source}}};var W,P,H;v.parameters={...v.parameters,docs:{...(W=v.parameters)==null?void 0:W.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  }}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Avatar key={i} src={\`https://i.pravatar.cc/150?img=\${i + 10}\`} alt={\`User \${i}\`} size="lg" />)}
    </div>
}`,...(H=(P=v.parameters)==null?void 0:P.docs)==null?void 0:H.source}}};const pe=["Default","Sizes","SizeLabels","CustomSize","Fallback","CustomFallback","DefaultUserIcon","BrokenImage","AvatarGroup","DifferentImages"];export{g as AvatarGroup,x as BrokenImage,m as CustomFallback,o as CustomSize,l as Default,d as DefaultUserIcon,v as DifferentImages,n as Fallback,c as SizeLabels,i as Sizes,pe as __namedExportsOrder,me as default};
