import{r as ge,j as e}from"./iframe-DAkvFKvn.js";import{c as bt,f as Ft}from"./utils-CF6QUdYH.js";import{u as Gt,B as Ct,C as Ht,a as qt,b as he,c as Yt,d as kt,e as ae,S as re,f as At,D as vt,T as wt,L as i,g as Jt}from"./useImageRenderer-CfztQJ1Y.js";import{S as s}from"./Skeleton-DUnPqdQh.js";import{L as p}from"./lock-EpqZrEty.js";import{U as jt}from"./user-Bwa1lJzs.js";import{c as se}from"./createLucideIcon-BB9Pgv53.js";import{M as Vt}from"./message-square-DPiI9zEJ.js";import"./preload-helper-CwRszBsw.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kt=[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]],$t=se("heart",Kt);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ot=[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]],l=se("play",Ot);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zt=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],c=se("plus",Zt),Lt=kt,te=ae;function r({name:t,imageUrl:Q,summary:oe,tags:g,tokenCount:St=0,updatedAt:ne,className:Et,actions:Nt=[],isDisabled:Dt=!1,onClick:Mt,badges:h=[],placeholderImageUrl:X,renderMetadata:ie,emptySummaryText:le="No summary",likeButton:ee,likeCount:ce,downloadCount:de,imageSizes:Pt,loading:Tt="lazy",footerActions:me,renderImage:Ut}){const[Rt,ue]=ge.useState(!1),It=Gt({renderImage:Ut});ge.useEffect(()=>{ue(!1)},[Q,X]);const pe=(Q||X)&&!Rt,Bt=!pe,Wt=()=>{const o=Q||X;return o?It({src:o,alt:t,className:"absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",sizes:Pt,loading:Tt,onError:()=>ue(!0),fill:!0}):null};return e.jsxs(Ct,{className:bt("min-h-[380px]",Et),isDisabled:Dt,onClick:Mt,children:[e.jsxs("div",{className:"relative h-64 overflow-hidden bg-zinc-800",children:[pe&&Wt(),Bt&&e.jsx("div",{className:"absolute inset-0 flex items-center justify-center",children:e.jsx("span",{className:"text-6xl font-bold text-zinc-500",children:t.charAt(0).toUpperCase()||"?"})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90"}),ee&&e.jsx("div",{className:"absolute top-2 right-2 z-20",children:e.jsx(Ht,{...ee})}),e.jsx(qt,{actions:Nt,className:ee?"top-12":void 0}),h.some(o=>(o.position??"left")==="left")&&e.jsx("div",{className:"absolute top-3 left-3 z-10 max-w-[45%]",children:e.jsx(he,{badges:h,position:"left"})}),h.some(o=>o.position==="right")&&e.jsx("div",{className:"absolute top-3 right-3 z-10 max-w-[45%]",children:e.jsx(he,{badges:h,position:"right"})})]}),e.jsxs("div",{className:"relative z-10 -mt-12 flex flex-grow flex-col p-4",children:[e.jsx("h3",{className:"mb-1 line-clamp-2 text-lg md:text-xl font-bold break-words text-white drop-shadow-md",children:t}),e.jsx("div",{className:"mb-2 md:mb-4 flex flex-wrap gap-2",children:g.length>0?e.jsxs(e.Fragment,{children:[g.slice(0,3).map((o,_t)=>e.jsx("span",{className:"rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",children:o},`${o}-${_t}`)),g.length>3&&e.jsxs("span",{className:"rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",children:["+",g.length-3]})]}):e.jsx("span",{className:"text-[10px] text-zinc-400",children:"No tags"})}),(oe||le)&&e.jsx("p",{className:"mb-2 md:mb-4 line-clamp-2 flex-grow text-xs leading-relaxed break-all text-ellipsis text-zinc-400",children:oe||le}),(ce!==void 0||de!==void 0)&&e.jsx(Yt,{likeCount:ce,downloadCount:de,className:"mb-2"}),ie?ie():e.jsxs(kt,{children:[e.jsxs(ae,{children:[Ft(St)," Tokens"]}),ne&&e.jsx(ae,{children:ne})]})]}),me&&e.jsx("div",{className:"mt-auto flex border-t border-zinc-800",children:me})]})}r.__docgenInfo={description:"",methods:[],displayName:"CharacterCard",props:{name:{required:!0,tsType:{name:"string"},description:"Character name"},imageUrl:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Character image URL"},summary:{required:!1,tsType:{name:"string"},description:"Character summary/description"},tags:{required:!0,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"Character tags"},tokenCount:{required:!1,tsType:{name:"number"},description:"Token count for the character (used in default metadata)",defaultValue:{value:"0",computed:!1}},updatedAt:{required:!1,tsType:{name:"string"},description:"Last updated timestamp (used in default metadata)"},actions:{required:!1,tsType:{name:"Array",elements:[{name:"CardAction"}],raw:"CardAction[]"},description:"Action buttons displayed on the card",defaultValue:{value:"[]",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"},isDisabled:{required:!1,tsType:{name:"boolean"},description:"Whether the card is disabled",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Click handler for the card"},badges:{required:!1,tsType:{name:"Array",elements:[{name:"CardBadge"}],raw:"CardBadge[]"},description:"Badges to display on the card (e.g., type indicator, private, owner).",defaultValue:{value:"[]",computed:!1}},placeholderImageUrl:{required:!1,tsType:{name:"string"},description:"Placeholder image URL when imageUrl is not provided"},renderMetadata:{required:!1,tsType:{name:"signature",type:"function",raw:"() => React.ReactNode",signature:{arguments:[],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:`Custom render function for the metadata section.
When provided, replaces the default tokenCount/updatedAt display.
Use CardMetadataContainer and CardMetadataItem for consistent styling.`},emptySummaryText:{required:!1,tsType:{name:"string"},description:'Text to display when summary is empty. Defaults to "No summary". Set to empty string to hide.',defaultValue:{value:"'No summary'",computed:!1}},likeButton:{required:!1,tsType:{name:"LikeButtonProps"},description:`Like button configuration (displays in top-right corner).
Controlled component - parent manages isLiked state and handles onClick.
@example
\`\`\`tsx
const [isLiked, setIsLiked] = useState(false);
<CharacterCard
  likeButton={{
    isLiked: isLiked,
    onClick: () => setIsLiked(!isLiked),
    isLoading: false
  }}
/>
\`\`\``},likeCount:{required:!1,tsType:{name:"number"},description:"Like count to display in popularity stats"},downloadCount:{required:!1,tsType:{name:"number"},description:"Download count to display in popularity stats"},imageSizes:{required:!1,tsType:{name:"string"},description:`The sizes attribute for the image element.
Helps browser select appropriate image size for responsive loading.
@example "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"`},loading:{required:!1,tsType:{name:"union",raw:"'lazy' | 'eager'",elements:[{name:"literal",value:"'lazy'"},{name:"literal",value:"'eager'"}]},description:`Loading strategy for the image.
Use 'eager' for above-the-fold images (e.g., first few cards in a list).
@default 'lazy'`,defaultValue:{value:"'lazy'",computed:!1}},renderImage:{required:!1,tsType:{name:"signature",type:"function",raw:"(props: ImageComponentProps) => React.ReactNode",signature:{arguments:[{type:{name:"ImageComponentProps"},name:"props"}],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:`Custom image renderer for framework-specific optimization.
Takes precedence over DesignSystemProvider's imageComponent.
@example Next.js usage:
\`\`\`tsx
renderImage={(props) => (
  <NextImage {...props} fill style={{ objectFit: 'cover' }} />
)}
\`\`\``},footerActions:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:`Custom footer actions to display at the bottom of the card.
Renders below the content area with a top border separator.
Useful for action buttons like "Play", "Add", "Edit", etc.
@example
\`\`\`tsx
<CharacterCard
  footerActions={
    <>
      <button className="flex-1 py-2">Play</button>
      <button className="flex-1 py-2">Add</button>
    </>
  }
/>
\`\`\``}}};function d({className:t}){return e.jsxs(Ct,{className:bt("min-h-[380px]",t),isDisabled:!0,children:[e.jsx("div",{className:"relative h-64 overflow-hidden bg-zinc-800",children:e.jsx(s,{className:"absolute inset-0 h-full w-full",variant:"default"})}),e.jsxs("div",{className:"relative z-10 -mt-12 flex flex-grow flex-col p-4",children:[e.jsx(s,{className:"mb-1 h-6 w-3/4"}),e.jsxs("div",{className:"mb-4 flex flex-wrap gap-2",children:[e.jsx(s,{className:"h-5 w-12"}),e.jsx(s,{className:"h-5 w-16"}),e.jsx(s,{className:"h-5 w-10"})]}),e.jsxs("div",{className:"mb-4 flex-grow space-y-2",children:[e.jsx(s,{className:"h-3 w-full"}),e.jsx(s,{className:"h-3 w-full"}),e.jsx(s,{className:"h-3 w-2/3"})]}),e.jsxs("div",{className:"flex items-center gap-2 border-t border-zinc-800 pt-3",children:[e.jsx(s,{className:"h-3 w-16"}),e.jsx(s,{className:"h-3 w-20"})]})]})]})}d.displayName="CharacterCardSkeleton";d.__docgenInfo={description:`CharacterCardSkeleton Component

A skeleton placeholder for CharacterCard while loading.
Matches the exact layout of CharacterCard for seamless loading states.

@example
\`\`\`tsx
// Basic usage
<CharacterCardSkeleton />

// In a grid
{isLoading ? (
  <CharacterCardSkeleton />
) : (
  <CharacterCard {...props} />
)}
\`\`\``,methods:[],displayName:"CharacterCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};const ir={title:"Content/CharacterCard",component:r,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{name:{control:"text",description:"Character name"},imageUrl:{control:"text",description:"Character image URL"},summary:{control:"text",description:"Character summary/description"},tags:{control:"object",description:"Character tags array"},tokenCount:{control:"number",description:"Token count for the character"},updatedAt:{control:"text",description:"Last updated timestamp"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},badges:{control:"object",description:"Badges to display on the card"},placeholderImageUrl:{control:"text",description:"Placeholder image URL when imageUrl is not provided",table:{defaultValue:{summary:"img/placeholder/character-placeholder.png"}}},onClick:{action:"clicked"}},decorators:[t=>e.jsx("div",{style:{width:"280px"},children:e.jsx(t,{})})]},n="https://picsum.photos/seed/character1/400/600",m="https://picsum.photos/seed/character2/400/600",u="https://picsum.photos/seed/character3/400/600",zt="/astrsk/design-system/img/placeholder/character-placeholder.png",a={args:{name:"Alice Wonderland",imageUrl:n,summary:"A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.",tags:["Fantasy","Adventure","Classic"],tokenCount:1523,updatedAt:"2 days ago",placeholderImageUrl:zt}},x={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})}]}},y={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})},{label:"Private",variant:"private",icon:e.jsx(p,{size:12})}]}},f={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})},{label:"Private",variant:"private",icon:e.jsx(p,{size:12})},{label:"Mine",variant:"owner",icon:e.jsx(jt,{size:12})}]}},b={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(p,{size:12}),position:"right"}]}},C={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(jt,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(p,{size:12}),position:"right"}]}},k={args:{name:"Mystery Character",summary:"A mysterious character with no image yet.",tags:["Unknown"],tokenCount:500,updatedAt:"Just now"}},A={args:{name:"Placeholder Character",summary:"A character using a placeholder image.",tags:["New"],tokenCount:0,updatedAt:"Just now",placeholderImageUrl:zt}},v={args:{name:"Alice Wonderland",imageUrl:"https://invalid-url-that-will-404.com/image.png",summary:"This character has an invalid image URL, showing the initial fallback.",tags:["Error","Fallback"],tokenCount:1e3,updatedAt:"Just now"}},w={args:{name:"Multi-Tagged Character",imageUrl:m,summary:"This character has many different tags to demonstrate overflow.",tags:["Fantasy","Romance","Drama","Action","Comedy","Slice of Life"],tokenCount:2500,updatedAt:"1 week ago"}},j={args:{name:"Tagless Character",imageUrl:u,summary:"A character without any tags.",tags:[],tokenCount:800,updatedAt:"3 hours ago"}},L={args:{name:"The Exceptionally Long Named Character of the Eastern Kingdoms",imageUrl:n,summary:"A character with a very long name that should be truncated.",tags:["Epic","Fantasy"],tokenCount:3e3,updatedAt:"1 month ago"}},z={args:{...a.args,isDisabled:!0}},S={args:{...a.args,actions:[{icon:re,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:At,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate character"},{icon:vt,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export character"},{icon:wt,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete character",className:"hover:text-red-400"}]}},E={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(r,{name:"Alice Wonderland",imageUrl:n,summary:"A curious young girl who falls down a rabbit hole into a fantasy world.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago"}),e.jsx(r,{name:"Bob the Builder",imageUrl:m,summary:"Can we fix it? Yes we can! A cheerful constructor who solves problems.",tags:["Kids","Comedy"],tokenCount:890,updatedAt:"1 week ago",badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})}]}),e.jsx(r,{name:"Charlie Detective",imageUrl:u,summary:"A sharp-minded detective solving mysteries in the foggy streets of London.",tags:["Mystery","Thriller","Drama"],tokenCount:2100,updatedAt:"Just now"})]})},N={args:{name:"Popular Character",imageUrl:n,summary:"A character with custom metadata using renderMetadata prop.",tags:["Popular","Trending"],renderMetadata:()=>e.jsxs(Lt,{children:[e.jsx(te,{icon:e.jsx($t,{className:"size-3"}),children:"2.5k likes"}),e.jsx(te,{icon:e.jsx(Vt,{className:"size-3"}),children:"128 chats"})]})}},D={args:{name:"Active Character",imageUrl:m,summary:"Demonstrating metadata items with icons for better visual clarity.",tags:["Active"],renderMetadata:()=>e.jsx(Lt,{children:e.jsx(te,{icon:e.jsx(Jt,{className:"size-3"}),children:"Last active: 2h ago"})})}},M={args:{name:"Custom Layout Character",imageUrl:u,summary:"When you need complete control over metadata layout.",tags:["Custom"],renderMetadata:()=>e.jsxs("div",{className:"mt-auto grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"1.2k"}),e.jsx("div",{children:"Likes"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"89"}),e.jsx("div",{children:"Chats"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"4.8"}),e.jsx("div",{children:"Rating"})]})]})}},P={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(r,{name:"Default Character",imageUrl:n,summary:"A standard character card with all typical fields.",tags:["Tag1","Tag2"],tokenCount:1e3,updatedAt:"1 day ago"})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(r,{name:"Character with Badge",imageUrl:m,summary:"Shows the CHARACTER type badge.",tags:["Fantasy"],tokenCount:500,updatedAt:"5 hours ago",badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Disabled"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(r,{name:"Disabled Character",imageUrl:u,summary:"This card is disabled and cannot be interacted with.",tags:["Locked"],tokenCount:0,isDisabled:!0})})]})]})},T={args:{...a.args},decorators:[t=>e.jsx("div",{style:{width:"280px"},children:e.jsx(t,{})})],render:()=>e.jsx(d,{})},U={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(d,{}),e.jsx(d,{}),e.jsx(d,{})]})},R={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}}},I={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")}}},B={args:{...a.args,likeCount:1234}},W={args:{...a.args,downloadCount:5678}},_={args:{...a.args,likeCount:1234,downloadCount:5678}},F={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:1234,downloadCount:5678}},G={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:1235,downloadCount:5678}},H={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:2500,downloadCount:12e3,actions:[{icon:re,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:At,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate character"},{icon:wt,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete character",className:"hover:text-red-400"}]}},q={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:123456,downloadCount:9876543}},Y={args:{name:"Alice Wonderland",imageUrl:n,summary:"A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.",tags:["Fantasy","Adventure","Classic"],tokenCount:1523,updatedAt:"2 days ago",badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})},{label:"Private",variant:"private",icon:e.jsx(p,{size:12}),position:"right"}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:2847,downloadCount:15230,actions:[{icon:re,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:vt,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export character"}]}},J={args:{...a.args,footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 transition-all hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800",onClick:()=>console.log("Play clicked"),children:[e.jsx(l,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 transition-all hover:bg-amber-600/10 hover:text-amber-300",onClick:()=>console.log("Add clicked"),children:[e.jsx(c,{size:14})," ADD"]})]})}},V={args:{...a.args,badges:[{label:"PLAYER",variant:"default",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(l,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(c,{size:14})," ADD"]})]})}},K={args:{...a.args,badges:[{label:"AI",variant:"private",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(l,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(c,{size:14})," ADD"]})]})}},$={args:{name:"Mobile Character",imageUrl:n,summary:"A character card with compact footer for mobile view.",tags:["Mobile"],tokenCount:500,emptySummaryText:"",className:"min-h-0",footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold text-zinc-400 transition-all hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800",onClick:()=>console.log("Play clicked"),children:[e.jsx(l,{size:12})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold text-zinc-400 transition-all hover:bg-amber-600/10 hover:text-amber-300",onClick:()=>console.log("Add clicked"),children:[e.jsx(c,{size:12})," ADD"]})]})},decorators:[t=>e.jsx("div",{style:{width:"160px"},children:e.jsx(t,{})})]},O={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(r,{name:"Alice Wonderland",imageUrl:n,summary:"A curious young girl who falls down a rabbit hole.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago",footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800",children:[e.jsx(l,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-amber-600/10 hover:text-amber-300",children:[e.jsx(c,{size:14})," ADD"]})]})}),e.jsx(r,{name:"Bob the Builder",imageUrl:m,summary:"Can we fix it? Yes we can!",tags:["Kids","Comedy"],tokenCount:890,updatedAt:"1 week ago",badges:[{label:"PLAYER",variant:"default",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(l,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(c,{size:14})," ADD"]})]})}),e.jsx(r,{name:"Charlie Detective",imageUrl:u,summary:"A sharp-minded detective solving mysteries.",tags:["Mystery","Thriller"],tokenCount:2100,updatedAt:"Just now",badges:[{label:"AI",variant:"private",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(l,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(c,{size:14})," ADD"]})]})})]})},Z={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(r,{name:"Popular Character",imageUrl:n,summary:"A highly popular character loved by many users.",tags:["Popular","Trending"],tokenCount:1523,updatedAt:"2 days ago",likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:12500,downloadCount:45e3}),e.jsx(r,{name:"New Character",imageUrl:m,summary:"A fresh new character just added to the platform.",tags:["New","Fresh"],tokenCount:890,updatedAt:"1 hour ago",likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:42,downloadCount:128}),e.jsx(r,{name:"Classic Character",imageUrl:u,summary:"A timeless classic that has stood the test of time.",tags:["Classic","Evergreen"],tokenCount:2100,updatedAt:"1 year ago",likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:98765,downloadCount:543210})]})};var xe,ye,fe;a.parameters={...a.parameters,docs:{...(xe=a.parameters)==null?void 0:xe.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.',
    tags: ['Fantasy', 'Adventure', 'Classic'],
    tokenCount: 1523,
    updatedAt: '2 days ago',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(fe=(ye=a.parameters)==null?void 0:ye.docs)==null?void 0:fe.source}}};var be,Ce,ke;x.parameters={...x.parameters,docs:{...(be=x.parameters)==null?void 0:be.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'CHARACTER',
      icon: <Layers size={12} />
    }]
  }
}`,...(ke=(Ce=x.parameters)==null?void 0:Ce.docs)==null?void 0:ke.source}}};var Ae,ve,we;y.parameters={...y.parameters,docs:{...(Ae=y.parameters)==null?void 0:Ae.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'CHARACTER',
      icon: <Layers size={12} />
    }, {
      label: 'Private',
      variant: 'private',
      icon: <Lock size={12} />
    }]
  }
}`,...(we=(ve=y.parameters)==null?void 0:ve.docs)==null?void 0:we.source}}};var je,Le,ze;f.parameters={...f.parameters,docs:{...(je=f.parameters)==null?void 0:je.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'CHARACTER',
      icon: <Layers size={12} />
    }, {
      label: 'Private',
      variant: 'private',
      icon: <Lock size={12} />
    }, {
      label: 'Mine',
      variant: 'owner',
      icon: <User size={12} />
    }]
  }
}`,...(ze=(Le=f.parameters)==null?void 0:Le.docs)==null?void 0:ze.source}}};var Se,Ee,Ne;b.parameters={...b.parameters,docs:{...(Se=b.parameters)==null?void 0:Se.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'CHARACTER',
      icon: <Layers size={12} />,
      position: 'left'
    }, {
      label: 'Private',
      variant: 'private',
      icon: <Lock size={12} />,
      position: 'right'
    }]
  }
}`,...(Ne=(Ee=b.parameters)==null?void 0:Ee.docs)==null?void 0:Ne.source}}};var De,Me,Pe;C.parameters={...C.parameters,docs:{...(De=C.parameters)==null?void 0:De.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'CHARACTER',
      icon: <Layers size={12} />,
      position: 'left'
    }, {
      label: 'Mine',
      variant: 'owner',
      icon: <User size={12} />,
      position: 'left'
    }, {
      label: 'Private',
      variant: 'private',
      icon: <Lock size={12} />,
      position: 'right'
    }]
  }
}`,...(Pe=(Me=C.parameters)==null?void 0:Me.docs)==null?void 0:Pe.source}}};var Te,Ue,Re;k.parameters={...k.parameters,docs:{...(Te=k.parameters)==null?void 0:Te.docs,source:{originalSource:`{
  args: {
    name: 'Mystery Character',
    summary: 'A mysterious character with no image yet.',
    tags: ['Unknown'],
    tokenCount: 500,
    updatedAt: 'Just now'
  }
}`,...(Re=(Ue=k.parameters)==null?void 0:Ue.docs)==null?void 0:Re.source}}};var Ie,Be,We;A.parameters={...A.parameters,docs:{...(Ie=A.parameters)==null?void 0:Ie.docs,source:{originalSource:`{
  args: {
    name: 'Placeholder Character',
    summary: 'A character using a placeholder image.',
    tags: ['New'],
    tokenCount: 0,
    updatedAt: 'Just now',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(We=(Be=A.parameters)==null?void 0:Be.docs)==null?void 0:We.source}}};var _e,Fe,Ge;v.parameters={...v.parameters,docs:{...(_e=v.parameters)==null?void 0:_e.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: 'https://invalid-url-that-will-404.com/image.png',
    summary: 'This character has an invalid image URL, showing the initial fallback.',
    tags: ['Error', 'Fallback'],
    tokenCount: 1000,
    updatedAt: 'Just now'
  }
}`,...(Ge=(Fe=v.parameters)==null?void 0:Fe.docs)==null?void 0:Ge.source}}};var He,qe,Ye;w.parameters={...w.parameters,docs:{...(He=w.parameters)==null?void 0:He.docs,source:{originalSource:`{
  args: {
    name: 'Multi-Tagged Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'This character has many different tags to demonstrate overflow.',
    tags: ['Fantasy', 'Romance', 'Drama', 'Action', 'Comedy', 'Slice of Life'],
    tokenCount: 2500,
    updatedAt: '1 week ago'
  }
}`,...(Ye=(qe=w.parameters)==null?void 0:qe.docs)==null?void 0:Ye.source}}};var Je,Ve,Ke;j.parameters={...j.parameters,docs:{...(Je=j.parameters)==null?void 0:Je.docs,source:{originalSource:`{
  args: {
    name: 'Tagless Character',
    imageUrl: SAMPLE_IMAGE_3,
    summary: 'A character without any tags.',
    tags: [],
    tokenCount: 800,
    updatedAt: '3 hours ago'
  }
}`,...(Ke=(Ve=j.parameters)==null?void 0:Ve.docs)==null?void 0:Ke.source}}};var $e,Oe,Ze;L.parameters={...L.parameters,docs:{...($e=L.parameters)==null?void 0:$e.docs,source:{originalSource:`{
  args: {
    name: 'The Exceptionally Long Named Character of the Eastern Kingdoms',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A character with a very long name that should be truncated.',
    tags: ['Epic', 'Fantasy'],
    tokenCount: 3000,
    updatedAt: '1 month ago'
  }
}`,...(Ze=(Oe=L.parameters)==null?void 0:Oe.docs)==null?void 0:Ze.source}}};var Qe,Xe,ea;z.parameters={...z.parameters,docs:{...(Qe=z.parameters)==null?void 0:Qe.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(ea=(Xe=z.parameters)==null?void 0:Xe.docs)==null?void 0:ea.source}}};var aa,ta,ra;S.parameters={...S.parameters,docs:{...(aa=S.parameters)==null?void 0:aa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    actions: [{
      icon: Edit,
      label: 'Edit',
      onClick: () => console.log('Edit clicked'),
      title: 'Edit character'
    }, {
      icon: Copy,
      label: 'Duplicate',
      onClick: () => console.log('Duplicate clicked'),
      title: 'Duplicate character'
    }, {
      icon: Download,
      label: 'Export',
      onClick: () => console.log('Export clicked'),
      title: 'Export character'
    }, {
      icon: Trash2,
      label: 'Delete',
      onClick: () => console.log('Delete clicked'),
      title: 'Delete character',
      className: 'hover:text-red-400'
    }]
  }
}`,...(ra=(ta=S.parameters)==null?void 0:ta.docs)==null?void 0:ra.source}}};var sa,oa,na;E.parameters={...E.parameters,docs:{...(sa=E.parameters)==null?void 0:sa.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 280px)',
    gap: '24px'
  }}>
        <Story />
      </div>],
  render: () => <>
      <CharacterCard name="Alice Wonderland" imageUrl={SAMPLE_IMAGE} summary="A curious young girl who falls down a rabbit hole into a fantasy world." tags={['Fantasy', 'Adventure']} tokenCount={1523} updatedAt="2 days ago" />
      <CharacterCard name="Bob the Builder" imageUrl={SAMPLE_IMAGE_2} summary="Can we fix it? Yes we can! A cheerful constructor who solves problems." tags={['Kids', 'Comedy']} tokenCount={890} updatedAt="1 week ago" badges={[{
      label: 'CHARACTER',
      icon: <Layers size={12} />
    }]} />
      <CharacterCard name="Charlie Detective" imageUrl={SAMPLE_IMAGE_3} summary="A sharp-minded detective solving mysteries in the foggy streets of London." tags={['Mystery', 'Thriller', 'Drama']} tokenCount={2100} updatedAt="Just now" />
    </>
}`,...(na=(oa=E.parameters)==null?void 0:oa.docs)==null?void 0:na.source}}};var ia,la,ca;N.parameters={...N.parameters,docs:{...(ia=N.parameters)==null?void 0:ia.docs,source:{originalSource:`{
  args: {
    name: 'Popular Character',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A character with custom metadata using renderMetadata prop.',
    tags: ['Popular', 'Trending'],
    renderMetadata: () => <MetadataContainer>
        <MetadataItem icon={<Heart className="size-3" />}>2.5k likes</MetadataItem>
        <MetadataItem icon={<MessageSquare className="size-3" />}>128 chats</MetadataItem>
      </MetadataContainer>
  }
}`,...(ca=(la=N.parameters)==null?void 0:la.docs)==null?void 0:ca.source}}};var da,ma,ua;D.parameters={...D.parameters,docs:{...(da=D.parameters)==null?void 0:da.docs,source:{originalSource:`{
  args: {
    name: 'Active Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'Demonstrating metadata items with icons for better visual clarity.',
    tags: ['Active'],
    renderMetadata: () => <MetadataContainer>
        <MetadataItem icon={<Clock className="size-3" />}>Last active: 2h ago</MetadataItem>
      </MetadataContainer>
  }
}`,...(ua=(ma=D.parameters)==null?void 0:ma.docs)==null?void 0:ua.source}}};var pa,ga,ha;M.parameters={...M.parameters,docs:{...(pa=M.parameters)==null?void 0:pa.docs,source:{originalSource:`{
  args: {
    name: 'Custom Layout Character',
    imageUrl: SAMPLE_IMAGE_3,
    summary: 'When you need complete control over metadata layout.',
    tags: ['Custom'],
    renderMetadata: () => <div className="mt-auto grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
        <div className="text-center">
          <div className="font-semibold text-white">1.2k</div>
          <div>Likes</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-white">89</div>
          <div>Chats</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-white">4.8</div>
          <div>Rating</div>
        </div>
      </div>
  }
}`,...(ha=(ga=M.parameters)==null?void 0:ga.docs)==null?void 0:ha.source}}};var xa,ya,fa;P.parameters={...P.parameters,docs:{...(xa=P.parameters)==null?void 0:xa.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  }}>
        <Story />
      </div>],
  render: () => <>
      <div>
        <h4 style={{
        marginBottom: '12px',
        fontSize: '14px',
        color: 'var(--fg-muted)'
      }}>
          Default
        </h4>
        <div style={{
        width: '280px'
      }}>
          <CharacterCard name="Default Character" imageUrl={SAMPLE_IMAGE} summary="A standard character card with all typical fields." tags={['Tag1', 'Tag2']} tokenCount={1000} updatedAt="1 day ago" />
        </div>
      </div>
      <div>
        <h4 style={{
        marginBottom: '12px',
        fontSize: '14px',
        color: 'var(--fg-muted)'
      }}>
          With Type Indicator
        </h4>
        <div style={{
        width: '280px'
      }}>
          <CharacterCard name="Character with Badge" imageUrl={SAMPLE_IMAGE_2} summary="Shows the CHARACTER type badge." tags={['Fantasy']} tokenCount={500} updatedAt="5 hours ago" badges={[{
          label: 'CHARACTER',
          icon: <Layers size={12} />
        }]} />
        </div>
      </div>
      <div>
        <h4 style={{
        marginBottom: '12px',
        fontSize: '14px',
        color: 'var(--fg-muted)'
      }}>
          Disabled
        </h4>
        <div style={{
        width: '280px'
      }}>
          <CharacterCard name="Disabled Character" imageUrl={SAMPLE_IMAGE_3} summary="This card is disabled and cannot be interacted with." tags={['Locked']} tokenCount={0} isDisabled />
        </div>
      </div>
    </>
}`,...(fa=(ya=P.parameters)==null?void 0:ya.docs)==null?void 0:fa.source}}};var ba,Ca,ka;T.parameters={...T.parameters,docs:{...(ba=T.parameters)==null?void 0:ba.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '280px'
  }}>
        <Story />
      </div>],
  render: () => <CharacterCardSkeleton />
}`,...(ka=(Ca=T.parameters)==null?void 0:Ca.docs)==null?void 0:ka.source}}};var Aa,va,wa;U.parameters={...U.parameters,docs:{...(Aa=U.parameters)==null?void 0:Aa.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 280px)',
    gap: '24px'
  }}>
        <Story />
      </div>],
  render: () => <>
      <CharacterCardSkeleton />
      <CharacterCardSkeleton />
      <CharacterCardSkeleton />
    </>
}`,...(wa=(va=U.parameters)==null?void 0:va.docs)==null?void 0:wa.source}}};var ja,La,za;R.parameters={...R.parameters,docs:{...(ja=R.parameters)==null?void 0:ja.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }
  }
}`,...(za=(La=R.parameters)==null?void 0:La.docs)==null?void 0:za.source}}};var Sa,Ea,Na;I.parameters={...I.parameters,docs:{...(Sa=I.parameters)==null?void 0:Sa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    }
  }
}`,...(Na=(Ea=I.parameters)==null?void 0:Ea.docs)==null?void 0:Na.source}}};var Da,Ma,Pa;B.parameters={...B.parameters,docs:{...(Da=B.parameters)==null?void 0:Da.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234
  }
}`,...(Pa=(Ma=B.parameters)==null?void 0:Ma.docs)==null?void 0:Pa.source}}};var Ta,Ua,Ra;W.parameters={...W.parameters,docs:{...(Ta=W.parameters)==null?void 0:Ta.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    downloadCount: 5678
  }
}`,...(Ra=(Ua=W.parameters)==null?void 0:Ua.docs)==null?void 0:Ra.source}}};var Ia,Ba,Wa;_.parameters={..._.parameters,docs:{...(Ia=_.parameters)==null?void 0:Ia.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Wa=(Ba=_.parameters)==null?void 0:Ba.docs)==null?void 0:Wa.source}}};var _a,Fa,Ga;F.parameters={...F.parameters,docs:{...(_a=F.parameters)==null?void 0:_a.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    },
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Ga=(Fa=F.parameters)==null?void 0:Fa.docs)==null?void 0:Ga.source}}};var Ha,qa,Ya;G.parameters={...G.parameters,docs:{...(Ha=G.parameters)==null?void 0:Ha.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 1235,
    downloadCount: 5678
  }
}`,...(Ya=(qa=G.parameters)==null?void 0:qa.docs)==null?void 0:Ya.source}}};var Ja,Va,Ka;H.parameters={...H.parameters,docs:{...(Ja=H.parameters)==null?void 0:Ja.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    },
    likeCount: 2500,
    downloadCount: 12000,
    actions: [{
      icon: Edit,
      label: 'Edit',
      onClick: () => console.log('Edit clicked'),
      title: 'Edit character'
    }, {
      icon: Copy,
      label: 'Duplicate',
      onClick: () => console.log('Duplicate clicked'),
      title: 'Duplicate character'
    }, {
      icon: Trash2,
      label: 'Delete',
      onClick: () => console.log('Delete clicked'),
      title: 'Delete character',
      className: 'hover:text-red-400'
    }]
  }
}`,...(Ka=(Va=H.parameters)==null?void 0:Va.docs)==null?void 0:Ka.source}}};var $a,Oa,Za;q.parameters={...q.parameters,docs:{...($a=q.parameters)==null?void 0:$a.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 123456,
    downloadCount: 9876543
  }
}`,...(Za=(Oa=q.parameters)==null?void 0:Oa.docs)==null?void 0:Za.source}}};var Qa,Xa,et;Y.parameters={...Y.parameters,docs:{...(Qa=Y.parameters)==null?void 0:Qa.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.',
    tags: ['Fantasy', 'Adventure', 'Classic'],
    tokenCount: 1523,
    updatedAt: '2 days ago',
    badges: [{
      label: 'CHARACTER',
      icon: <Layers size={12} />
    }, {
      label: 'Private',
      variant: 'private',
      icon: <Lock size={12} />,
      position: 'right'
    }],
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 2847,
    downloadCount: 15230,
    actions: [{
      icon: Edit,
      label: 'Edit',
      onClick: () => console.log('Edit clicked'),
      title: 'Edit character'
    }, {
      icon: Download,
      label: 'Export',
      onClick: () => console.log('Export clicked'),
      title: 'Export character'
    }]
  }
}`,...(et=(Xa=Y.parameters)==null?void 0:Xa.docs)==null?void 0:et.source}}};var at,tt,rt;J.parameters={...J.parameters,docs:{...(at=J.parameters)==null?void 0:at.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    footerActions: <>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 transition-all hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800" onClick={() => console.log('Play clicked')}>
          <Play size={14} /> PLAY
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 transition-all hover:bg-amber-600/10 hover:text-amber-300" onClick={() => console.log('Add clicked')}>
          <Plus size={14} /> ADD
        </button>
      </>
  }
}`,...(rt=(tt=J.parameters)==null?void 0:tt.docs)==null?void 0:rt.source}}};var st,ot,nt;V.parameters={...V.parameters,docs:{...(st=V.parameters)==null?void 0:st.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'PLAYER',
      variant: 'default',
      position: 'right'
    }],
    footerActions: <>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800" disabled>
          <Play size={14} /> PLAY
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed" disabled>
          <Plus size={14} /> ADD
        </button>
      </>
  }
}`,...(nt=(ot=V.parameters)==null?void 0:ot.docs)==null?void 0:nt.source}}};var it,lt,ct;K.parameters={...K.parameters,docs:{...(it=K.parameters)==null?void 0:it.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'AI',
      variant: 'private',
      position: 'right'
    }],
    footerActions: <>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800" disabled>
          <Play size={14} /> PLAY
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed" disabled>
          <Plus size={14} /> ADD
        </button>
      </>
  }
}`,...(ct=(lt=K.parameters)==null?void 0:lt.docs)==null?void 0:ct.source}}};var dt,mt,ut;$.parameters={...$.parameters,docs:{...(dt=$.parameters)==null?void 0:dt.docs,source:{originalSource:`{
  args: {
    name: 'Mobile Character',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A character card with compact footer for mobile view.',
    tags: ['Mobile'],
    tokenCount: 500,
    emptySummaryText: '',
    className: 'min-h-0',
    footerActions: <>
        <button className="flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold text-zinc-400 transition-all hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800" onClick={() => console.log('Play clicked')}>
          <Play size={12} /> PLAY
        </button>
        <button className="flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold text-zinc-400 transition-all hover:bg-amber-600/10 hover:text-amber-300" onClick={() => console.log('Add clicked')}>
          <Plus size={12} /> ADD
        </button>
      </>
  },
  decorators: [Story => <div style={{
    width: '160px'
  }}>
        <Story />
      </div>]
}`,...(ut=(mt=$.parameters)==null?void 0:mt.docs)==null?void 0:ut.source}}};var pt,gt,ht;O.parameters={...O.parameters,docs:{...(pt=O.parameters)==null?void 0:pt.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 280px)',
    gap: '24px'
  }}>
        <Story />
      </div>],
  render: () => <>
      <CharacterCard name="Alice Wonderland" imageUrl={SAMPLE_IMAGE} summary="A curious young girl who falls down a rabbit hole." tags={['Fantasy', 'Adventure']} tokenCount={1523} updatedAt="2 days ago" footerActions={<>
            <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800">
              <Play size={14} /> PLAY
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-amber-600/10 hover:text-amber-300">
              <Plus size={14} /> ADD
            </button>
          </>} />
      <CharacterCard name="Bob the Builder" imageUrl={SAMPLE_IMAGE_2} summary="Can we fix it? Yes we can!" tags={['Kids', 'Comedy']} tokenCount={890} updatedAt="1 week ago" badges={[{
      label: 'PLAYER',
      variant: 'default',
      position: 'right'
    }]} footerActions={<>
            <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800" disabled>
              <Play size={14} /> PLAY
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed" disabled>
              <Plus size={14} /> ADD
            </button>
          </>} />
      <CharacterCard name="Charlie Detective" imageUrl={SAMPLE_IMAGE_3} summary="A sharp-minded detective solving mysteries." tags={['Mystery', 'Thriller']} tokenCount={2100} updatedAt="Just now" badges={[{
      label: 'AI',
      variant: 'private',
      position: 'right'
    }]} footerActions={<>
            <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800" disabled>
              <Play size={14} /> PLAY
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed" disabled>
              <Plus size={14} /> ADD
            </button>
          </>} />
    </>
}`,...(ht=(gt=O.parameters)==null?void 0:gt.docs)==null?void 0:ht.source}}};var xt,yt,ft;Z.parameters={...Z.parameters,docs:{...(xt=Z.parameters)==null?void 0:xt.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 280px)',
    gap: '24px'
  }}>
        <Story />
      </div>],
  render: () => <>
      <CharacterCard name="Popular Character" imageUrl={SAMPLE_IMAGE} summary="A highly popular character loved by many users." tags={['Popular', 'Trending']} tokenCount={1523} updatedAt="2 days ago" likeButton={{
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    }} likeCount={12500} downloadCount={45000} />
      <CharacterCard name="New Character" imageUrl={SAMPLE_IMAGE_2} summary="A fresh new character just added to the platform." tags={['New', 'Fresh']} tokenCount={890} updatedAt="1 hour ago" likeButton={{
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }} likeCount={42} downloadCount={128} />
      <CharacterCard name="Classic Character" imageUrl={SAMPLE_IMAGE_3} summary="A timeless classic that has stood the test of time." tags={['Classic', 'Evergreen']} tokenCount={2100} updatedAt="1 year ago" likeButton={{
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }} likeCount={98765} downloadCount={543210} />
    </>
}`,...(ft=(yt=Z.parameters)==null?void 0:yt.docs)==null?void 0:ft.source}}};const lr=["Default","WithBadges","WithMultipleBadges","WithAllBadgeVariants","WithBadgesLeftAndRight","WithMultipleBadgesEachSide","WithoutImage","WithPlaceholder","ImageError","ManyTags","NoTags","LongName","Disabled","WithActions","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid","WithLikeButton","WithLikeButtonLiked","WithLikeCount","WithDownloadCount","WithPopularityStats","WithLikeButtonAndStats","WithLikeButtonLikedAndStats","WithLikeButtonAndActions","HighPopularityCounts","FullFeatured","WithFooterActions","WithFooterActionsSelectedPlayer","WithFooterActionsSelectedAI","WithFooterActionsCompact","GridLayoutWithFooterActions","GridLayoutWithPopularity"];export{P as AllStates,N as CustomMetadata,a as Default,z as Disabled,Y as FullFeatured,M as FullyCustomMetadata,E as GridLayout,O as GridLayoutWithFooterActions,Z as GridLayoutWithPopularity,q as HighPopularityCounts,v as ImageError,L as LongName,w as ManyTags,D as MetadataWithIcons,j as NoTags,T as Skeleton,U as SkeletonGrid,S as WithActions,f as WithAllBadgeVariants,x as WithBadges,b as WithBadgesLeftAndRight,W as WithDownloadCount,J as WithFooterActions,$ as WithFooterActionsCompact,K as WithFooterActionsSelectedAI,V as WithFooterActionsSelectedPlayer,R as WithLikeButton,H as WithLikeButtonAndActions,F as WithLikeButtonAndStats,I as WithLikeButtonLiked,G as WithLikeButtonLikedAndStats,B as WithLikeCount,y as WithMultipleBadges,C as WithMultipleBadgesEachSide,A as WithPlaceholder,_ as WithPopularityStats,k as WithoutImage,lr as __namedExportsOrder,ir as default};
