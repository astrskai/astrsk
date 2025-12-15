import{j as e}from"./iframe-BLXYQOJY.js";import{S as s}from"./Skeleton-WstXSMPt.js";import"./preload-helper-CwRszBsw.js";import"./utils-CF6QUdYH.js";const L={title:"Feedback/Skeleton",component:s,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["default","circular","rounded"],description:"Border radius variant"},width:{control:"text",description:"Width of the skeleton"},height:{control:"text",description:"Height of the skeleton"},className:{control:"text",description:"Additional CSS classes"}}},a={args:{className:"h-4 w-48"}},r={render:()=>e.jsxs("div",{className:"flex flex-col gap-4",children:[e.jsxs("div",{children:[e.jsx("p",{className:"mb-2 text-sm text-zinc-400",children:"Default (rounded corners)"}),e.jsx(s,{className:"h-4 w-48",variant:"default"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"mb-2 text-sm text-zinc-400",children:"Circular"}),e.jsx(s,{className:"size-12",variant:"circular"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"mb-2 text-sm text-zinc-400",children:"Rounded (xl)"}),e.jsx(s,{className:"h-24 w-48",variant:"rounded"})]})]})},n={render:()=>e.jsxs("div",{className:"w-64 space-y-2",children:[e.jsx(s,{className:"h-4 w-full"}),e.jsx(s,{className:"h-4 w-full"}),e.jsx(s,{className:"h-4 w-3/4"})]})},c={render:()=>e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(s,{className:"size-10",variant:"circular"}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(s,{className:"h-4 w-32"}),e.jsx(s,{className:"h-3 w-24"})]})]})},l={render:()=>e.jsxs("div",{className:"w-64 rounded-xl border border-zinc-800 bg-zinc-900 p-4",children:[e.jsx(s,{className:"mb-4 h-32 w-full",variant:"rounded"}),e.jsx(s,{className:"mb-2 h-5 w-3/4"}),e.jsx(s,{className:"mb-4 h-4 w-1/2"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx(s,{className:"h-6 w-16"}),e.jsx(s,{className:"h-6 w-16"})]})]})},t={args:{width:200,height:100,variant:"rounded"}},o={render:()=>e.jsx("div",{className:"grid grid-cols-3 gap-4",children:Array.from({length:6}).map((E,C)=>e.jsxs("div",{className:"space-y-2",children:[e.jsx(s,{className:"h-24 w-24",variant:"rounded"}),e.jsx(s,{className:"h-4 w-24"}),e.jsx(s,{className:"h-3 w-16"})]},C))})};var d,i,m;a.parameters={...a.parameters,docs:{...(d=a.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    className: 'h-4 w-48'
  }
}`,...(m=(i=a.parameters)==null?void 0:i.docs)==null?void 0:m.source}}};var p,h,x;r.parameters={...r.parameters,docs:{...(p=r.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm text-zinc-400">Default (rounded corners)</p>
        <Skeleton className="h-4 w-48" variant="default" />
      </div>
      <div>
        <p className="mb-2 text-sm text-zinc-400">Circular</p>
        <Skeleton className="size-12" variant="circular" />
      </div>
      <div>
        <p className="mb-2 text-sm text-zinc-400">Rounded (xl)</p>
        <Skeleton className="h-24 w-48" variant="rounded" />
      </div>
    </div>
}`,...(x=(h=r.parameters)==null?void 0:h.docs)==null?void 0:x.source}}};var u,N,v;n.parameters={...n.parameters,docs:{...(u=n.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => <div className="w-64 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
}`,...(v=(N=n.parameters)==null?void 0:N.docs)==null?void 0:v.source}}};var w,g,j;c.parameters={...c.parameters,docs:{...(w=c.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-3">
      <Skeleton className="size-10" variant="circular" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
}`,...(j=(g=c.parameters)==null?void 0:g.docs)==null?void 0:j.source}}};var S,f,k;l.parameters={...l.parameters,docs:{...(S=l.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <div className="w-64 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <Skeleton className="mb-4 h-32 w-full" variant="rounded" />
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="mb-4 h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
}`,...(k=(f=l.parameters)==null?void 0:f.docs)==null?void 0:k.source}}};var b,z,y;t.parameters={...t.parameters,docs:{...(b=t.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    width: 200,
    height: 100,
    variant: 'rounded'
  }
}`,...(y=(z=t.parameters)==null?void 0:z.docs)==null?void 0:y.source}}};var D,P,A;o.parameters={...o.parameters,docs:{...(D=o.parameters)==null?void 0:D.docs,source:{originalSource:`{
  render: () => <div className="grid grid-cols-3 gap-4">
      {Array.from({
      length: 6
    }).map((_, i) => <div key={i} className="space-y-2">
          <Skeleton className="h-24 w-24" variant="rounded" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>)}
    </div>
}`,...(A=(P=o.parameters)==null?void 0:P.docs)==null?void 0:A.source}}};const V=["Default","Variants","TextPlaceholder","AvatarPlaceholder","CardPlaceholder","ExplicitDimensions","GridLayout"];export{c as AvatarPlaceholder,l as CardPlaceholder,a as Default,t as ExplicitDimensions,o as GridLayout,n as TextPlaceholder,r as Variants,V as __namedExportsOrder,L as default};
