import{c as i}from"./createLucideIcon-DgB9jd_9.js";import{j as a}from"./iframe-BHybmGn3.js";import{c as s}from"./utils-CF6QUdYH.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]],R=i("clock",c);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],q=i("copy",p);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]],A=i("download",u);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],B=i("layers",m);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]],z=i("square-pen",f);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]],L=i("trash-2",h);function x({children:e,className:r,isDisabled:o=!1,onClick:t}){return a.jsx("article",{className:s("group relative flex h-full flex-col overflow-hidden","rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg","transition-all duration-300",!o&&t&&"cursor-pointer hover:border-zinc-600 hover:shadow-xl",o&&"pointer-events-none opacity-60",r),onClick:o?void 0:t,children:e})}x.__docgenInfo={description:`BaseCard Component (Internal)
Shared card wrapper providing consistent styling across all card types.

Features:
- Consistent border, background, shadow, and hover effects
- \`group\` class for child hover interactions (e.g., CardActionToolbar)
- Disabled state handling
- Click interaction support`,methods:[],displayName:"BaseCard",props:{children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},isDisabled:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};function y({actions:e,className:r}){const o=t=>n=>{n.stopPropagation(),!t.disabled&&!t.loading&&t.onClick(n)};return e.length===0?null:a.jsx("div",{className:s("absolute top-2 right-2 z-20 flex translate-y-0 items-center gap-1 rounded-lg border border-white/10 bg-black/60 p-1 opacity-100 backdrop-blur-md transition-all duration-300 lg:translate-y-[-10px] lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100",r),children:e.map((t,n)=>{const d=t.icon;return a.jsx("button",{onClick:o(t),className:s("rounded p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white",t.disabled&&"cursor-not-allowed opacity-50",t.loading&&"animate-pulse",t.className),title:t.title||t.label,disabled:t.disabled,children:a.jsx(d,{className:"h-4 w-4"})},n)})})}y.__docgenInfo={description:`Card Action Toolbar Component (Internal)
Desktop: Hidden by default, shows on hover
Mobile: Always visible`,methods:[],displayName:"CardActionToolbar",props:{actions:{required:!0,tsType:{name:"Array",elements:[{name:"CardAction"}],raw:"CardAction[]"},description:""},className:{required:!1,tsType:{name:"string"},description:""}}};function g({children:e}){return a.jsx("div",{className:"mt-auto flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-400",children:e})}function C({icon:e,children:r}){return a.jsxs("div",{className:"flex items-center gap-1",children:[e,r]})}g.__docgenInfo={description:`Container for metadata items in card components.
Provides consistent styling for the metadata section.

@example
\`\`\`tsx
<CardMetadataContainer>
  <CardMetadataItem icon={<Clock />}>2 days ago</CardMetadataItem>
  <CardMetadataItem>1500 Tokens</CardMetadataItem>
</CardMetadataContainer>
\`\`\``,methods:[],displayName:"CardMetadataContainer",props:{children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};C.__docgenInfo={description:`Individual metadata item with optional icon.
Use inside CardMetadataContainer for consistent styling.

@example
\`\`\`tsx
<CardMetadataItem icon={<Heart className="size-3" />}>2.5k likes</CardMetadataItem>
<CardMetadataItem>Just now</CardMetadataItem>
\`\`\``,methods:[],displayName:"CardMetadataItem",props:{icon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};const v={default:"border-white/10 bg-black/50 text-white",private:"border-amber-500/30 bg-amber-950/50 text-amber-300",owner:"border-blue-500/30 bg-blue-950/50 text-blue-300"};function b({badges:e,position:r,className:o}){const t=r?e.filter(n=>(n.position??"left")===r):e;return t.length===0?null:a.jsx("div",{className:s("flex flex-wrap gap-1.5",r==="right"&&"justify-end",o),children:t.map((n,d)=>a.jsxs("div",{className:s("flex max-w-full items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold backdrop-blur-md",v[n.variant??"default"],n.className),children:[n.icon&&a.jsx("span",{className:"shrink-0",children:n.icon}),a.jsx("span",{className:"truncate",children:n.label})]},`${n.label}-${d}`))})}b.__docgenInfo={description:`CardBadges Component

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
\`\`\``,methods:[],displayName:"CardBadges",props:{badges:{required:!0,tsType:{name:"Array",elements:[{name:"CardBadge"}],raw:"CardBadge[]"},description:"Array of badges to display"},position:{required:!1,tsType:{name:"union",raw:"'left' | 'right'",elements:[{name:"literal",value:"'left'"},{name:"literal",value:"'right'"}]},description:"Filter badges by position. If not specified, renders all badges."},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};function k({filled:e,className:r}){return a.jsx("svg",{className:r,viewBox:"0 0 24 24",fill:e?"currentColor":"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",children:a.jsx("path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"})})}function w({isLiked:e,onClick:r,isLoading:o}){const t=n=>{n.preventDefault(),n.stopPropagation(),o||r(n)};return a.jsx("button",{onClick:t,disabled:o,className:s("flex items-center justify-center p-2","transition-all duration-200","hover:scale-110 active:scale-95","[filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.8))_drop-shadow(0_2px_4px_rgba(0,0,0,0.6))]",e?"text-rose-500 hover:text-rose-400":"text-white/90 hover:text-white",o&&"pointer-events-none opacity-70"),"aria-label":e?"Remove from favorites":"Add to favorites","aria-pressed":e,children:a.jsx(k,{filled:e,className:"h-5 w-5"})})}w.__docgenInfo={description:`CardLikeButton Component

A like/favorite button for card components.
Displays a heart icon that toggles between filled and outline states.

@example
\`\`\`tsx
<CardLikeButton
  isLiked={true}
  onClick={(e) => handleLike(e)}
/>
\`\`\``,methods:[],displayName:"CardLikeButton",props:{isLiked:{required:!0,tsType:{name:"boolean"},description:"현재 좋아요 상태"},onClick:{required:!0,tsType:{name:"signature",type:"function",raw:"(e: React.MouseEvent) => void",signature:{arguments:[{type:{name:"ReactMouseEvent",raw:"React.MouseEvent"},name:"e"}],return:{name:"void"}}},description:"클릭 핸들러"},isLoading:{required:!1,tsType:{name:"boolean"},description:"로딩 상태"}}};function l(e){return e<1e3?e.toString():e<1e4?`${(e/1e3).toFixed(1)}K`:e<1e6?`${Math.floor(e/1e3)}K`:e<1e7?`${(e/1e6).toFixed(1)}M`:`${Math.floor(e/1e6)}M`}function N({className:e}){return a.jsx("svg",{className:e,viewBox:"0 0 24 24",fill:"currentColor",stroke:"none",children:a.jsx("path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"})})}function j({className:e}){return a.jsxs("svg",{className:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",children:[a.jsx("path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}),a.jsx("polyline",{points:"7 10 12 15 17 10"}),a.jsx("line",{x1:"12",x2:"12",y1:"15",y2:"3"})]})}function M({likeCount:e,downloadCount:r,className:o}){const t=e!==void 0,n=r!==void 0;return!t&&!n?null:a.jsxs("div",{className:s("flex items-center gap-3",o),children:[t&&a.jsxs("div",{className:"flex items-center gap-1",children:[a.jsx(N,{className:"h-3.5 w-3.5 text-rose-400"}),a.jsx("span",{className:"text-xs font-medium text-zinc-300",children:l(e)})]}),n&&a.jsxs("div",{className:"flex items-center gap-1",children:[a.jsx(j,{className:"h-3.5 w-3.5 text-emerald-400"}),a.jsx("span",{className:"text-xs font-medium text-zinc-300",children:l(r)})]})]})}M.__docgenInfo={description:`CardPopularityStats Component

Displays popularity metrics (likes, downloads) for card components.
Visually distinct from other metadata with colored icons.

@example
\`\`\`tsx
<CardPopularityStats
  likeCount={1234}
  downloadCount={5678}
/>
\`\`\``,methods:[],displayName:"CardPopularityStats",props:{likeCount:{required:!1,tsType:{name:"number"},description:"좋아요 카운트"},downloadCount:{required:!1,tsType:{name:"number"},description:"다운로드 카운트"},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};export{x as B,w as C,A as D,B as L,z as S,L as T,y as a,b,M as c,g as d,C as e,q as f,R as g};
