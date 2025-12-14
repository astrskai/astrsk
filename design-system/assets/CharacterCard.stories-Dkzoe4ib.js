import{r as he,j as e}from"./iframe-Be38Beyt.js";import{c as Ct,f as Ht}from"./utils-CF6QUdYH.js";import{u as Yt,B as kt,C as Jt,a as Vt,b as xe,c as $t,d as At,e as te,S as se,f as vt,D as wt,T as jt,L as i,g as Kt}from"./useImageRenderer-B6j3m1Yq.js";import{S as s}from"./Skeleton-CCpa4c49.js";import{L as p}from"./lock-B6XoOr2F.js";import{U as Lt}from"./user-BBNfae-v.js";import{c as oe}from"./createLucideIcon-DwLq1bCy.js";import{M as Ot}from"./message-square-DYfYefy0.js";import"./preload-helper-CwRszBsw.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zt=[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]],Qt=oe("heart",Zt);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xt=[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]],l=oe("play",Xt);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const er=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],c=oe("plus",er),zt=At,re=te;function r({name:t,imageUrl:X,summary:ne,tags:g,maxVisibleTags:h=3,tokenCount:Et=0,updatedAt:ie,className:Nt,actions:Dt=[],isDisabled:Pt=!1,onClick:Mt,badges:x=[],placeholderImageUrl:ee,renderMetadata:le,emptySummaryText:ce="No summary",likeButton:ae,likeCount:de,downloadCount:ue,imageSizes:Tt,loading:Ut="lazy",priority:Rt=!1,footerActions:me,renderImage:It}){const[Wt,pe]=he.useState(!1),Bt=Yt({renderImage:It});he.useEffect(()=>{pe(!1)},[X,ee]);const ge=(X||ee)&&!Wt,_t=!ge,Ft=()=>{const o=X||ee;return o?Bt({src:o,alt:t,className:"absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",sizes:Tt,loading:Ut,onError:()=>pe(!0),fill:!0,priority:Rt}):null};return e.jsxs(kt,{className:Ct("min-h-[380px]",Nt),isDisabled:Pt,onClick:Mt,children:[e.jsxs("div",{className:"relative h-64 overflow-hidden bg-zinc-800",children:[ge&&Ft(),_t&&e.jsx("div",{className:"absolute inset-0 flex items-center justify-center",children:e.jsx("span",{className:"text-6xl font-bold text-zinc-500",children:t.charAt(0).toUpperCase()||"?"})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"}),ae&&e.jsx("div",{className:"absolute top-2 right-2 z-20",children:e.jsx(Jt,{...ae})}),e.jsx(Vt,{actions:Dt,className:ae?"top-12":void 0}),x.some(o=>(o.position??"left")==="left")&&e.jsx("div",{className:"absolute top-3 left-3 z-10 max-w-[45%]",children:e.jsx(xe,{badges:x,position:"left"})}),x.some(o=>o.position==="right")&&e.jsx("div",{className:"absolute top-3 right-3 z-10 max-w-[45%]",children:e.jsx(xe,{badges:x,position:"right"})})]}),e.jsxs("div",{className:"relative z-10 -mt-12 flex flex-grow flex-col p-4",children:[e.jsx("h3",{className:"mb-1 line-clamp-2 text-lg md:text-xl font-bold break-words text-white drop-shadow-md",children:t}),e.jsx("div",{className:"mb-2 md:mb-4 flex flex-wrap gap-2",children:g.length>0?e.jsxs(e.Fragment,{children:[g.slice(0,h).map((o,Gt)=>{const qt=Math.floor(85/(h+1));return e.jsx("span",{className:"truncate rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",style:{maxWidth:`${qt}%`},children:o},`${o}-${Gt}`)}),g.length>h&&e.jsxs("span",{className:"shrink-0 rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",children:["+",g.length-h]})]}):e.jsx("span",{className:"text-[10px] text-zinc-400",children:"No tags"})}),(ne||ce)&&e.jsx("p",{className:"mb-2 md:mb-4 line-clamp-2 flex-grow text-xs leading-relaxed break-all text-ellipsis text-zinc-400",children:ne||ce}),(de!==void 0||ue!==void 0)&&e.jsx($t,{likeCount:de,downloadCount:ue,className:"mb-2"}),le?le():e.jsxs(At,{children:[e.jsxs(te,{children:[Ht(Et)," Tokens"]}),ie&&e.jsx(te,{children:ie})]})]}),me&&e.jsx("div",{className:"mt-auto flex border-t border-zinc-800",children:me})]})}r.__docgenInfo={description:"",methods:[],displayName:"CharacterCard",props:{name:{required:!0,tsType:{name:"string"},description:"Character name"},imageUrl:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Character image URL"},summary:{required:!1,tsType:{name:"string"},description:"Character summary/description"},tags:{required:!0,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"Character tags"},maxVisibleTags:{required:!1,tsType:{name:"number"},description:`Maximum number of tags to display before showing "+n" indicator.
@default 3`,defaultValue:{value:"3",computed:!1}},tokenCount:{required:!1,tsType:{name:"number"},description:"Token count for the character (used in default metadata)",defaultValue:{value:"0",computed:!1}},updatedAt:{required:!1,tsType:{name:"string"},description:"Last updated timestamp (used in default metadata)"},actions:{required:!1,tsType:{name:"Array",elements:[{name:"CardAction"}],raw:"CardAction[]"},description:"Action buttons displayed on the card",defaultValue:{value:"[]",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"},isDisabled:{required:!1,tsType:{name:"boolean"},description:"Whether the card is disabled",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Click handler for the card"},badges:{required:!1,tsType:{name:"Array",elements:[{name:"CardBadge"}],raw:"CardBadge[]"},description:"Badges to display on the card (e.g., type indicator, private, owner).",defaultValue:{value:"[]",computed:!1}},placeholderImageUrl:{required:!1,tsType:{name:"string"},description:"Placeholder image URL when imageUrl is not provided"},renderMetadata:{required:!1,tsType:{name:"signature",type:"function",raw:"() => React.ReactNode",signature:{arguments:[],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:`Custom render function for the metadata section.
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
@default 'lazy'`,defaultValue:{value:"'lazy'",computed:!1}},priority:{required:!1,tsType:{name:"boolean"},description:`Priority loading hint for LCP optimization.
When true, the image will be preloaded with high priority (adds <link rel="preload">).
Use for the first visible card in a list to improve LCP score.
@default false`,defaultValue:{value:"false",computed:!1}},renderImage:{required:!1,tsType:{name:"signature",type:"function",raw:"(props: ImageComponentProps) => React.ReactNode",signature:{arguments:[{type:{name:"ImageComponentProps"},name:"props"}],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:`Custom image renderer for framework-specific optimization.
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
\`\`\``}}};function d({className:t}){return e.jsxs(kt,{className:Ct("min-h-[380px]",t),isDisabled:!0,children:[e.jsx("div",{className:"relative h-64 overflow-hidden bg-zinc-800",children:e.jsx(s,{className:"absolute inset-0 h-full w-full",variant:"default"})}),e.jsxs("div",{className:"relative z-10 -mt-12 flex flex-grow flex-col p-4",children:[e.jsx(s,{className:"mb-1 h-6 w-3/4"}),e.jsxs("div",{className:"mb-4 flex flex-wrap gap-2",children:[e.jsx(s,{className:"h-5 w-12"}),e.jsx(s,{className:"h-5 w-16"}),e.jsx(s,{className:"h-5 w-10"})]}),e.jsxs("div",{className:"mb-4 flex-grow space-y-2",children:[e.jsx(s,{className:"h-3 w-full"}),e.jsx(s,{className:"h-3 w-full"}),e.jsx(s,{className:"h-3 w-2/3"})]}),e.jsxs("div",{className:"flex items-center gap-2 border-t border-zinc-800 pt-3",children:[e.jsx(s,{className:"h-3 w-16"}),e.jsx(s,{className:"h-3 w-20"})]})]})]})}d.displayName="CharacterCardSkeleton";d.__docgenInfo={description:`CharacterCardSkeleton Component

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
\`\`\``,methods:[],displayName:"CharacterCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};const dr={title:"Content/CharacterCard",component:r,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{name:{control:"text",description:"Character name"},imageUrl:{control:"text",description:"Character image URL"},summary:{control:"text",description:"Character summary/description"},tags:{control:"object",description:"Character tags array"},tokenCount:{control:"number",description:"Token count for the character"},updatedAt:{control:"text",description:"Last updated timestamp"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},badges:{control:"object",description:"Badges to display on the card"},placeholderImageUrl:{control:"text",description:"Placeholder image URL when imageUrl is not provided",table:{defaultValue:{summary:"img/placeholder/character-placeholder.png"}}},onClick:{action:"clicked"}},decorators:[t=>e.jsx("div",{style:{width:"280px"},children:e.jsx(t,{})})]},n="https://picsum.photos/seed/character1/400/600",u="https://picsum.photos/seed/character2/400/600",m="https://picsum.photos/seed/character3/400/600",St="/astrsk/design-system/img/placeholder/character-placeholder.png",a={args:{name:"Alice Wonderland",imageUrl:n,summary:"A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.",tags:["Fantasy","Adventure","Classic"],tokenCount:1523,updatedAt:"2 days ago",placeholderImageUrl:St}},f={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})}]}},y={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})},{label:"Private",variant:"private",icon:e.jsx(p,{size:12})}]}},b={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})},{label:"Private",variant:"private",icon:e.jsx(p,{size:12})},{label:"Mine",variant:"owner",icon:e.jsx(Lt,{size:12})}]}},C={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(p,{size:12}),position:"right"}]}},k={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(Lt,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(p,{size:12}),position:"right"}]}},A={args:{name:"Mystery Character",summary:"A mysterious character with no image yet.",tags:["Unknown"],tokenCount:500,updatedAt:"Just now"}},v={args:{name:"Placeholder Character",summary:"A character using a placeholder image.",tags:["New"],tokenCount:0,updatedAt:"Just now",placeholderImageUrl:St}},w={args:{name:"Alice Wonderland",imageUrl:"https://invalid-url-that-will-404.com/image.png",summary:"This character has an invalid image URL, showing the initial fallback.",tags:["Error","Fallback"],tokenCount:1e3,updatedAt:"Just now"}},j={args:{name:"Multi-Tagged Character",imageUrl:u,summary:"This character has many different tags to demonstrate overflow.",tags:["Fantasy","Romance","Drama","Action","Comedy","Slice of Life"],tokenCount:2500,updatedAt:"1 week ago"}},L={args:{name:"Tagless Character",imageUrl:m,summary:"A character without any tags.",tags:[],tokenCount:800,updatedAt:"3 hours ago"}},z={args:{name:"The Exceptionally Long Named Character of the Eastern Kingdoms",imageUrl:n,summary:"A character with a very long name that should be truncated.",tags:["Epic","Fantasy"],tokenCount:3e3,updatedAt:"1 month ago"}},S={args:{...a.args,isDisabled:!0}},E={args:{...a.args,actions:[{icon:se,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:vt,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate character"},{icon:wt,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export character"},{icon:jt,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete character",className:"hover:text-red-400"}]}},N={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(r,{name:"Alice Wonderland",imageUrl:n,summary:"A curious young girl who falls down a rabbit hole into a fantasy world.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago"}),e.jsx(r,{name:"Bob the Builder",imageUrl:u,summary:"Can we fix it? Yes we can! A cheerful constructor who solves problems.",tags:["Kids","Comedy"],tokenCount:890,updatedAt:"1 week ago",badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})}]}),e.jsx(r,{name:"Charlie Detective",imageUrl:m,summary:"A sharp-minded detective solving mysteries in the foggy streets of London.",tags:["Mystery","Thriller","Drama"],tokenCount:2100,updatedAt:"Just now"})]})},D={args:{name:"Popular Character",imageUrl:n,summary:"A character with custom metadata using renderMetadata prop.",tags:["Popular","Trending"],renderMetadata:()=>e.jsxs(zt,{children:[e.jsx(re,{icon:e.jsx(Qt,{className:"size-3"}),children:"2.5k likes"}),e.jsx(re,{icon:e.jsx(Ot,{className:"size-3"}),children:"128 chats"})]})}},P={args:{name:"Active Character",imageUrl:u,summary:"Demonstrating metadata items with icons for better visual clarity.",tags:["Active"],renderMetadata:()=>e.jsx(zt,{children:e.jsx(re,{icon:e.jsx(Kt,{className:"size-3"}),children:"Last active: 2h ago"})})}},M={args:{name:"Custom Layout Character",imageUrl:m,summary:"When you need complete control over metadata layout.",tags:["Custom"],renderMetadata:()=>e.jsxs("div",{className:"mt-auto grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"1.2k"}),e.jsx("div",{children:"Likes"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"89"}),e.jsx("div",{children:"Chats"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"4.8"}),e.jsx("div",{children:"Rating"})]})]})}},T={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(r,{name:"Default Character",imageUrl:n,summary:"A standard character card with all typical fields.",tags:["Tag1","Tag2"],tokenCount:1e3,updatedAt:"1 day ago"})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(r,{name:"Character with Badge",imageUrl:u,summary:"Shows the CHARACTER type badge.",tags:["Fantasy"],tokenCount:500,updatedAt:"5 hours ago",badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Disabled"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(r,{name:"Disabled Character",imageUrl:m,summary:"This card is disabled and cannot be interacted with.",tags:["Locked"],tokenCount:0,isDisabled:!0})})]})]})},U={args:{...a.args},decorators:[t=>e.jsx("div",{style:{width:"280px"},children:e.jsx(t,{})})],render:()=>e.jsx(d,{})},R={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(d,{}),e.jsx(d,{}),e.jsx(d,{})]})},I={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}}},W={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")}}},B={args:{...a.args,likeCount:1234}},_={args:{...a.args,downloadCount:5678}},F={args:{...a.args,likeCount:1234,downloadCount:5678}},G={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:1234,downloadCount:5678}},q={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:1235,downloadCount:5678}},H={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:2500,downloadCount:12e3,actions:[{icon:se,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:vt,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate character"},{icon:jt,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete character",className:"hover:text-red-400"}]}},Y={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:123456,downloadCount:9876543}},J={args:{name:"Alice Wonderland",imageUrl:n,summary:"A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.",tags:["Fantasy","Adventure","Classic"],tokenCount:1523,updatedAt:"2 days ago",badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})},{label:"Private",variant:"private",icon:e.jsx(p,{size:12}),position:"right"}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:2847,downloadCount:15230,actions:[{icon:se,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:wt,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export character"}]}},V={args:{...a.args,footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 transition-all hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800",onClick:()=>console.log("Play clicked"),children:[e.jsx(l,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 transition-all hover:bg-amber-600/10 hover:text-amber-300",onClick:()=>console.log("Add clicked"),children:[e.jsx(c,{size:14})," ADD"]})]})}},$={args:{...a.args,badges:[{label:"PLAYER",variant:"default",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(l,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(c,{size:14})," ADD"]})]})}},K={args:{...a.args,badges:[{label:"AI",variant:"private",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(l,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(c,{size:14})," ADD"]})]})}},O={args:{name:"Mobile Character",imageUrl:n,summary:"A character card with compact footer for mobile view.",tags:["Mobile"],tokenCount:500,emptySummaryText:"",className:"min-h-0",footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold text-zinc-400 transition-all hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800",onClick:()=>console.log("Play clicked"),children:[e.jsx(l,{size:12})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold text-zinc-400 transition-all hover:bg-amber-600/10 hover:text-amber-300",onClick:()=>console.log("Add clicked"),children:[e.jsx(c,{size:12})," ADD"]})]})},decorators:[t=>e.jsx("div",{style:{width:"160px"},children:e.jsx(t,{})})]},Z={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(r,{name:"Alice Wonderland",imageUrl:n,summary:"A curious young girl who falls down a rabbit hole.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago",footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800",children:[e.jsx(l,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-amber-600/10 hover:text-amber-300",children:[e.jsx(c,{size:14})," ADD"]})]})}),e.jsx(r,{name:"Bob the Builder",imageUrl:u,summary:"Can we fix it? Yes we can!",tags:["Kids","Comedy"],tokenCount:890,updatedAt:"1 week ago",badges:[{label:"PLAYER",variant:"default",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(l,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(c,{size:14})," ADD"]})]})}),e.jsx(r,{name:"Charlie Detective",imageUrl:m,summary:"A sharp-minded detective solving mysteries.",tags:["Mystery","Thriller"],tokenCount:2100,updatedAt:"Just now",badges:[{label:"AI",variant:"private",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(l,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(c,{size:14})," ADD"]})]})})]})},Q={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(r,{name:"Popular Character",imageUrl:n,summary:"A highly popular character loved by many users.",tags:["Popular","Trending"],tokenCount:1523,updatedAt:"2 days ago",likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:12500,downloadCount:45e3}),e.jsx(r,{name:"New Character",imageUrl:u,summary:"A fresh new character just added to the platform.",tags:["New","Fresh"],tokenCount:890,updatedAt:"1 hour ago",likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:42,downloadCount:128}),e.jsx(r,{name:"Classic Character",imageUrl:m,summary:"A timeless classic that has stood the test of time.",tags:["Classic","Evergreen"],tokenCount:2100,updatedAt:"1 year ago",likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:98765,downloadCount:543210})]})};var fe,ye,be;a.parameters={...a.parameters,docs:{...(fe=a.parameters)==null?void 0:fe.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.',
    tags: ['Fantasy', 'Adventure', 'Classic'],
    tokenCount: 1523,
    updatedAt: '2 days ago',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(be=(ye=a.parameters)==null?void 0:ye.docs)==null?void 0:be.source}}};var Ce,ke,Ae;f.parameters={...f.parameters,docs:{...(Ce=f.parameters)==null?void 0:Ce.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'CHARACTER',
      icon: <Layers size={12} />
    }]
  }
}`,...(Ae=(ke=f.parameters)==null?void 0:ke.docs)==null?void 0:Ae.source}}};var ve,we,je;y.parameters={...y.parameters,docs:{...(ve=y.parameters)==null?void 0:ve.docs,source:{originalSource:`{
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
}`,...(je=(we=y.parameters)==null?void 0:we.docs)==null?void 0:je.source}}};var Le,ze,Se;b.parameters={...b.parameters,docs:{...(Le=b.parameters)==null?void 0:Le.docs,source:{originalSource:`{
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
}`,...(Se=(ze=b.parameters)==null?void 0:ze.docs)==null?void 0:Se.source}}};var Ee,Ne,De;C.parameters={...C.parameters,docs:{...(Ee=C.parameters)==null?void 0:Ee.docs,source:{originalSource:`{
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
}`,...(De=(Ne=C.parameters)==null?void 0:Ne.docs)==null?void 0:De.source}}};var Pe,Me,Te;k.parameters={...k.parameters,docs:{...(Pe=k.parameters)==null?void 0:Pe.docs,source:{originalSource:`{
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
}`,...(Te=(Me=k.parameters)==null?void 0:Me.docs)==null?void 0:Te.source}}};var Ue,Re,Ie;A.parameters={...A.parameters,docs:{...(Ue=A.parameters)==null?void 0:Ue.docs,source:{originalSource:`{
  args: {
    name: 'Mystery Character',
    summary: 'A mysterious character with no image yet.',
    tags: ['Unknown'],
    tokenCount: 500,
    updatedAt: 'Just now'
  }
}`,...(Ie=(Re=A.parameters)==null?void 0:Re.docs)==null?void 0:Ie.source}}};var We,Be,_e;v.parameters={...v.parameters,docs:{...(We=v.parameters)==null?void 0:We.docs,source:{originalSource:`{
  args: {
    name: 'Placeholder Character',
    summary: 'A character using a placeholder image.',
    tags: ['New'],
    tokenCount: 0,
    updatedAt: 'Just now',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(_e=(Be=v.parameters)==null?void 0:Be.docs)==null?void 0:_e.source}}};var Fe,Ge,qe;w.parameters={...w.parameters,docs:{...(Fe=w.parameters)==null?void 0:Fe.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: 'https://invalid-url-that-will-404.com/image.png',
    summary: 'This character has an invalid image URL, showing the initial fallback.',
    tags: ['Error', 'Fallback'],
    tokenCount: 1000,
    updatedAt: 'Just now'
  }
}`,...(qe=(Ge=w.parameters)==null?void 0:Ge.docs)==null?void 0:qe.source}}};var He,Ye,Je;j.parameters={...j.parameters,docs:{...(He=j.parameters)==null?void 0:He.docs,source:{originalSource:`{
  args: {
    name: 'Multi-Tagged Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'This character has many different tags to demonstrate overflow.',
    tags: ['Fantasy', 'Romance', 'Drama', 'Action', 'Comedy', 'Slice of Life'],
    tokenCount: 2500,
    updatedAt: '1 week ago'
  }
}`,...(Je=(Ye=j.parameters)==null?void 0:Ye.docs)==null?void 0:Je.source}}};var Ve,$e,Ke;L.parameters={...L.parameters,docs:{...(Ve=L.parameters)==null?void 0:Ve.docs,source:{originalSource:`{
  args: {
    name: 'Tagless Character',
    imageUrl: SAMPLE_IMAGE_3,
    summary: 'A character without any tags.',
    tags: [],
    tokenCount: 800,
    updatedAt: '3 hours ago'
  }
}`,...(Ke=($e=L.parameters)==null?void 0:$e.docs)==null?void 0:Ke.source}}};var Oe,Ze,Qe;z.parameters={...z.parameters,docs:{...(Oe=z.parameters)==null?void 0:Oe.docs,source:{originalSource:`{
  args: {
    name: 'The Exceptionally Long Named Character of the Eastern Kingdoms',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A character with a very long name that should be truncated.',
    tags: ['Epic', 'Fantasy'],
    tokenCount: 3000,
    updatedAt: '1 month ago'
  }
}`,...(Qe=(Ze=z.parameters)==null?void 0:Ze.docs)==null?void 0:Qe.source}}};var Xe,ea,aa;S.parameters={...S.parameters,docs:{...(Xe=S.parameters)==null?void 0:Xe.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(aa=(ea=S.parameters)==null?void 0:ea.docs)==null?void 0:aa.source}}};var ta,ra,sa;E.parameters={...E.parameters,docs:{...(ta=E.parameters)==null?void 0:ta.docs,source:{originalSource:`{
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
}`,...(sa=(ra=E.parameters)==null?void 0:ra.docs)==null?void 0:sa.source}}};var oa,na,ia;N.parameters={...N.parameters,docs:{...(oa=N.parameters)==null?void 0:oa.docs,source:{originalSource:`{
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
}`,...(ia=(na=N.parameters)==null?void 0:na.docs)==null?void 0:ia.source}}};var la,ca,da;D.parameters={...D.parameters,docs:{...(la=D.parameters)==null?void 0:la.docs,source:{originalSource:`{
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
}`,...(da=(ca=D.parameters)==null?void 0:ca.docs)==null?void 0:da.source}}};var ua,ma,pa;P.parameters={...P.parameters,docs:{...(ua=P.parameters)==null?void 0:ua.docs,source:{originalSource:`{
  args: {
    name: 'Active Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'Demonstrating metadata items with icons for better visual clarity.',
    tags: ['Active'],
    renderMetadata: () => <MetadataContainer>
        <MetadataItem icon={<Clock className="size-3" />}>Last active: 2h ago</MetadataItem>
      </MetadataContainer>
  }
}`,...(pa=(ma=P.parameters)==null?void 0:ma.docs)==null?void 0:pa.source}}};var ga,ha,xa;M.parameters={...M.parameters,docs:{...(ga=M.parameters)==null?void 0:ga.docs,source:{originalSource:`{
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
}`,...(xa=(ha=M.parameters)==null?void 0:ha.docs)==null?void 0:xa.source}}};var fa,ya,ba;T.parameters={...T.parameters,docs:{...(fa=T.parameters)==null?void 0:fa.docs,source:{originalSource:`{
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
}`,...(ba=(ya=T.parameters)==null?void 0:ya.docs)==null?void 0:ba.source}}};var Ca,ka,Aa;U.parameters={...U.parameters,docs:{...(Ca=U.parameters)==null?void 0:Ca.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '280px'
  }}>
        <Story />
      </div>],
  render: () => <CharacterCardSkeleton />
}`,...(Aa=(ka=U.parameters)==null?void 0:ka.docs)==null?void 0:Aa.source}}};var va,wa,ja;R.parameters={...R.parameters,docs:{...(va=R.parameters)==null?void 0:va.docs,source:{originalSource:`{
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
}`,...(ja=(wa=R.parameters)==null?void 0:wa.docs)==null?void 0:ja.source}}};var La,za,Sa;I.parameters={...I.parameters,docs:{...(La=I.parameters)==null?void 0:La.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }
  }
}`,...(Sa=(za=I.parameters)==null?void 0:za.docs)==null?void 0:Sa.source}}};var Ea,Na,Da;W.parameters={...W.parameters,docs:{...(Ea=W.parameters)==null?void 0:Ea.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    }
  }
}`,...(Da=(Na=W.parameters)==null?void 0:Na.docs)==null?void 0:Da.source}}};var Pa,Ma,Ta;B.parameters={...B.parameters,docs:{...(Pa=B.parameters)==null?void 0:Pa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234
  }
}`,...(Ta=(Ma=B.parameters)==null?void 0:Ma.docs)==null?void 0:Ta.source}}};var Ua,Ra,Ia;_.parameters={..._.parameters,docs:{...(Ua=_.parameters)==null?void 0:Ua.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    downloadCount: 5678
  }
}`,...(Ia=(Ra=_.parameters)==null?void 0:Ra.docs)==null?void 0:Ia.source}}};var Wa,Ba,_a;F.parameters={...F.parameters,docs:{...(Wa=F.parameters)==null?void 0:Wa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(_a=(Ba=F.parameters)==null?void 0:Ba.docs)==null?void 0:_a.source}}};var Fa,Ga,qa;G.parameters={...G.parameters,docs:{...(Fa=G.parameters)==null?void 0:Fa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    },
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(qa=(Ga=G.parameters)==null?void 0:Ga.docs)==null?void 0:qa.source}}};var Ha,Ya,Ja;q.parameters={...q.parameters,docs:{...(Ha=q.parameters)==null?void 0:Ha.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 1235,
    downloadCount: 5678
  }
}`,...(Ja=(Ya=q.parameters)==null?void 0:Ya.docs)==null?void 0:Ja.source}}};var Va,$a,Ka;H.parameters={...H.parameters,docs:{...(Va=H.parameters)==null?void 0:Va.docs,source:{originalSource:`{
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
}`,...(Ka=($a=H.parameters)==null?void 0:$a.docs)==null?void 0:Ka.source}}};var Oa,Za,Qa;Y.parameters={...Y.parameters,docs:{...(Oa=Y.parameters)==null?void 0:Oa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 123456,
    downloadCount: 9876543
  }
}`,...(Qa=(Za=Y.parameters)==null?void 0:Za.docs)==null?void 0:Qa.source}}};var Xa,et,at;J.parameters={...J.parameters,docs:{...(Xa=J.parameters)==null?void 0:Xa.docs,source:{originalSource:`{
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
}`,...(at=(et=J.parameters)==null?void 0:et.docs)==null?void 0:at.source}}};var tt,rt,st;V.parameters={...V.parameters,docs:{...(tt=V.parameters)==null?void 0:tt.docs,source:{originalSource:`{
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
}`,...(st=(rt=V.parameters)==null?void 0:rt.docs)==null?void 0:st.source}}};var ot,nt,it;$.parameters={...$.parameters,docs:{...(ot=$.parameters)==null?void 0:ot.docs,source:{originalSource:`{
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
}`,...(it=(nt=$.parameters)==null?void 0:nt.docs)==null?void 0:it.source}}};var lt,ct,dt;K.parameters={...K.parameters,docs:{...(lt=K.parameters)==null?void 0:lt.docs,source:{originalSource:`{
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
}`,...(dt=(ct=K.parameters)==null?void 0:ct.docs)==null?void 0:dt.source}}};var ut,mt,pt;O.parameters={...O.parameters,docs:{...(ut=O.parameters)==null?void 0:ut.docs,source:{originalSource:`{
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
}`,...(pt=(mt=O.parameters)==null?void 0:mt.docs)==null?void 0:pt.source}}};var gt,ht,xt;Z.parameters={...Z.parameters,docs:{...(gt=Z.parameters)==null?void 0:gt.docs,source:{originalSource:`{
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
}`,...(xt=(ht=Z.parameters)==null?void 0:ht.docs)==null?void 0:xt.source}}};var ft,yt,bt;Q.parameters={...Q.parameters,docs:{...(ft=Q.parameters)==null?void 0:ft.docs,source:{originalSource:`{
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
}`,...(bt=(yt=Q.parameters)==null?void 0:yt.docs)==null?void 0:bt.source}}};const ur=["Default","WithBadges","WithMultipleBadges","WithAllBadgeVariants","WithBadgesLeftAndRight","WithMultipleBadgesEachSide","WithoutImage","WithPlaceholder","ImageError","ManyTags","NoTags","LongName","Disabled","WithActions","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid","WithLikeButton","WithLikeButtonLiked","WithLikeCount","WithDownloadCount","WithPopularityStats","WithLikeButtonAndStats","WithLikeButtonLikedAndStats","WithLikeButtonAndActions","HighPopularityCounts","FullFeatured","WithFooterActions","WithFooterActionsSelectedPlayer","WithFooterActionsSelectedAI","WithFooterActionsCompact","GridLayoutWithFooterActions","GridLayoutWithPopularity"];export{T as AllStates,D as CustomMetadata,a as Default,S as Disabled,J as FullFeatured,M as FullyCustomMetadata,N as GridLayout,Z as GridLayoutWithFooterActions,Q as GridLayoutWithPopularity,Y as HighPopularityCounts,w as ImageError,z as LongName,j as ManyTags,P as MetadataWithIcons,L as NoTags,U as Skeleton,R as SkeletonGrid,E as WithActions,b as WithAllBadgeVariants,f as WithBadges,C as WithBadgesLeftAndRight,_ as WithDownloadCount,V as WithFooterActions,O as WithFooterActionsCompact,K as WithFooterActionsSelectedAI,$ as WithFooterActionsSelectedPlayer,I as WithLikeButton,H as WithLikeButtonAndActions,G as WithLikeButtonAndStats,W as WithLikeButtonLiked,q as WithLikeButtonLikedAndStats,B as WithLikeCount,y as WithMultipleBadges,k as WithMultipleBadgesEachSide,v as WithPlaceholder,F as WithPopularityStats,A as WithoutImage,ur as __namedExportsOrder,dr as default};
