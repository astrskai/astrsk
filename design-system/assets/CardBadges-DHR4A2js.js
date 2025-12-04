import{c as s}from"./createLucideIcon-D-XtMVmw.js";import{j as n}from"./iframe-CJd9dEJT.js";import{c as d}from"./utils-DuMXYCiK.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]],N=s("clock",l);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],M=s("copy",c);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]],I=s("download",p);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],_=s("layers",m);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]],T=s("square-pen",u);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]],R=s("trash-2",y);function h({children:a,className:r,isDisabled:o=!1,onClick:e}){return n.jsx("article",{className:d("group relative flex h-full flex-col overflow-hidden","rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg","transition-all duration-300",!o&&e&&"cursor-pointer hover:border-zinc-600 hover:shadow-xl",o&&"pointer-events-none opacity-60",r),onClick:o?void 0:e,children:a})}h.__docgenInfo={description:`BaseCard Component (Internal)
Shared card wrapper providing consistent styling across all card types.

Features:
- Consistent border, background, shadow, and hover effects
- \`group\` class for child hover interactions (e.g., CardActionToolbar)
- Disabled state handling
- Click interaction support`,methods:[],displayName:"BaseCard",props:{children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},isDisabled:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};function g({actions:a,className:r}){const o=e=>t=>{t.stopPropagation(),!e.disabled&&!e.loading&&e.onClick(t)};return a.length===0?null:n.jsx("div",{className:d("absolute top-2 right-2 z-20 flex translate-y-0 items-center gap-1 rounded-lg border border-white/10 bg-black/60 p-1 opacity-100 backdrop-blur-md transition-all duration-300 lg:translate-y-[-10px] lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100",r),children:a.map((e,t)=>{const i=e.icon;return n.jsx("button",{onClick:o(e),className:d("rounded p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white",e.disabled&&"cursor-not-allowed opacity-50",e.loading&&"animate-pulse",e.className),title:e.title||e.label,disabled:e.disabled,children:n.jsx(i,{className:"h-4 w-4"})},t)})})}g.__docgenInfo={description:`Card Action Toolbar Component (Internal)
Desktop: Hidden by default, shows on hover
Mobile: Always visible`,methods:[],displayName:"CardActionToolbar",props:{actions:{required:!0,tsType:{name:"Array",elements:[{name:"CardAction"}],raw:"CardAction[]"},description:""},className:{required:!1,tsType:{name:"string"},description:""}}};function f({children:a}){return n.jsx("div",{className:"mt-auto flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-500",children:a})}function b({icon:a,children:r}){return n.jsxs("div",{className:"flex items-center gap-1",children:[a,r]})}f.__docgenInfo={description:`Container for metadata items in card components.
Provides consistent styling for the metadata section.

@example
\`\`\`tsx
<CardMetadataContainer>
  <CardMetadataItem icon={<Clock />}>2 days ago</CardMetadataItem>
  <CardMetadataItem>1500 Tokens</CardMetadataItem>
</CardMetadataContainer>
\`\`\``,methods:[],displayName:"CardMetadataContainer",props:{children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};b.__docgenInfo={description:`Individual metadata item with optional icon.
Use inside CardMetadataContainer for consistent styling.

@example
\`\`\`tsx
<CardMetadataItem icon={<Heart className="size-3" />}>2.5k likes</CardMetadataItem>
<CardMetadataItem>Just now</CardMetadataItem>
\`\`\``,methods:[],displayName:"CardMetadataItem",props:{icon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};const x={default:"border-white/10 bg-black/50 text-white",private:"border-amber-500/30 bg-amber-950/50 text-amber-300",owner:"border-blue-500/30 bg-blue-950/50 text-blue-300"};function C({badges:a,position:r,className:o}){const e=r?a.filter(t=>(t.position??"left")===r):a;return e.length===0?null:n.jsx("div",{className:d("flex flex-wrap gap-1.5",r==="right"&&"justify-end",o),children:e.map((t,i)=>n.jsxs("div",{className:d("flex max-w-full items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold backdrop-blur-md",x[t.variant??"default"]),children:[n.jsx("span",{className:"shrink-0",children:t.icon}),n.jsx("span",{className:"truncate",children:t.label})]},`${t.label}-${i}`))})}C.__docgenInfo={description:`CardBadges Component

Renders a list of badges for card components.
Typically positioned at the top-left of the card image area.

@example
\`\`\`tsx
<CardBadges
  badges={[
    { label: 'CHARACTER', icon: <LayersIcon /> },
    { label: 'Private', variant: 'private', icon: <LockIcon /> },
  ]}
/>
\`\`\``,methods:[],displayName:"CardBadges",props:{badges:{required:!0,tsType:{name:"Array",elements:[{name:"CardBadge"}],raw:"CardBadge[]"},description:"Array of badges to display"},position:{required:!1,tsType:{name:"union",raw:"'left' | 'right'",elements:[{name:"literal",value:"'left'"},{name:"literal",value:"'right'"}]},description:"Filter badges by position. If not specified, renders all badges."},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};export{h as B,g as C,I as D,_ as L,T as S,R as T,C as a,f as b,b as c,M as d,N as e};
