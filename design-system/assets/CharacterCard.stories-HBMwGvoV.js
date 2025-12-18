import{r as Ce,j as e}from"./iframe-ZuNO-dhk.js";import{c as l,f as ar}from"./utils-CF6QUdYH.js";import{u as tr,B as Nt,C as rr,a as sr,b as be,c as or,d as Tt,e as ne,S as le,f as Rt,D as Ut,T as Bt,L as c,g as nr,P as u}from"./useImageRenderer-BtX6EwDx.js";import{S as o}from"./Skeleton-CL9FqWeP.js";import{L as h}from"./lock-CoI_nJLd.js";import{U as It}from"./user-B2t_MKtr.js";import{c as Wt}from"./createLucideIcon-Bn9-7kpQ.js";import{M as ir}from"./message-square-BKCOXDnx.js";import"./preload-helper-CwRszBsw.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lr=[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]],cr=Wt("heart",lr);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dr=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],m=Wt("plus",dr),_t=Tt,ie=ne;function s({name:t,imageUrl:se,summary:ce,tags:d,tokenCount:Gt=0,updatedAt:de,className:Ht,actions:qt=[],isDisabled:Yt=!1,onClick:Jt,badges:y=[],placeholderImageUrl:oe,renderMetadata:ue,emptySummaryText:me="No summary",likeButton:f,likeCount:pe,downloadCount:ge,imageSizes:Vt,loading:Kt="lazy",priority:he=!1,footerActions:xe,renderImage:Qt,classNames:r}){const[$t,ye]=Ce.useState(!1),Ot=tr({renderImage:Qt});Ce.useEffect(()=>{ye(!1)},[se,oe]);const fe=(se||oe)&&!$t,Zt=!fe,Xt=()=>{const i=se||oe;return i?Ot({src:i,alt:t,className:"absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",sizes:Vt,loading:he?void 0:Kt,onError:()=>ye(!0),fill:!0,priority:he}):null};return e.jsxs(Nt,{className:l("min-h-[380px] bg-zinc-900 border-zinc-800 hover:border-zinc-600",Ht),isDisabled:Yt,onClick:Jt,children:[e.jsxs("div",{className:"relative h-64 overflow-hidden bg-zinc-800",children:[fe&&Xt(),Zt&&e.jsx("div",{className:"absolute inset-0 flex items-center justify-center",children:e.jsx("span",{className:"text-6xl font-bold text-zinc-500",children:t.charAt(0).toUpperCase()||"?"})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"}),f&&e.jsx("div",{className:"absolute top-2 right-2 z-20",children:e.jsx(rr,{...f})}),e.jsx(sr,{actions:qt,className:f?"top-12":void 0}),y.some(i=>(i.position??"left")==="left")&&e.jsx("div",{className:"absolute top-3 left-3 z-10 max-w-[45%]",children:e.jsx(be,{badges:y,position:"left"})}),!f&&y.some(i=>i.position==="right")&&e.jsx("div",{className:"absolute top-3 right-3 z-10 max-w-[45%]",children:e.jsx(be,{badges:y,position:"right"})})]}),e.jsxs("div",{className:"relative z-10 -mt-12 flex flex-grow flex-col p-4",children:[e.jsx("h3",{className:l("mb-1 line-clamp-2 text-lg md:text-xl font-bold break-words text-white drop-shadow-md",r==null?void 0:r.name),children:t}),e.jsx("div",{className:l("mb-2 @[240px]:mb-4 flex flex-wrap gap-2",r==null?void 0:r.tagsContainer),children:d.length>0?e.jsxs(e.Fragment,{children:[d.slice(0,2).map((i,er)=>e.jsx("span",{className:l("max-w-[35%] @[240px]:max-w-[26%] truncate rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",r==null?void 0:r.tag),children:i},`${i}-${er}`)),d[2]&&e.jsx("span",{className:l("hidden @[240px]:inline! max-w-[26%] truncate rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",r==null?void 0:r.tag),children:d[2]}),d.length>2&&e.jsxs("span",{className:l("@[240px]:hidden! shrink-0 rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",r==null?void 0:r.tag),children:["+",d.length-2]}),d.length>3&&e.jsxs("span",{className:l("hidden @[240px]:inline! shrink-0 rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",r==null?void 0:r.tag),children:["+",d.length-3]})]}):e.jsx("span",{className:"text-[10px] text-zinc-400",children:"No tags"})}),(ce||me)&&e.jsx("p",{className:l("mb-2 md:mb-4 line-clamp-2 flex-grow text-xs leading-relaxed break-all text-ellipsis text-zinc-400",r==null?void 0:r.summary),children:ce||me}),(pe!==void 0||ge!==void 0)&&e.jsx(or,{likeCount:pe,downloadCount:ge,className:"mb-2"}),ue?ue():e.jsxs(Tt,{className:"border-zinc-800 text-zinc-400",children:[e.jsxs(ne,{children:[ar(Gt)," Tokens"]}),de&&e.jsx(ne,{children:de})]})]}),xe&&e.jsx("div",{className:"mt-auto flex border-t border-zinc-800",children:xe})]})}s.__docgenInfo={description:"",methods:[],displayName:"CharacterCard",props:{name:{required:!0,tsType:{name:"string"},description:"Character name"},imageUrl:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Character image URL"},summary:{required:!1,tsType:{name:"string"},description:"Character summary/description"},tags:{required:!0,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:`Character tags.
Container Query responsive: 2 tags on narrow cards (<240px), 3 on wider cards.
Remaining tags shown as "+n" indicator.`},tokenCount:{required:!1,tsType:{name:"number"},description:"Token count for the character (used in default metadata)",defaultValue:{value:"0",computed:!1}},updatedAt:{required:!1,tsType:{name:"string"},description:"Last updated timestamp (used in default metadata)"},actions:{required:!1,tsType:{name:"Array",elements:[{name:"CardAction"}],raw:"CardAction[]"},description:"Action buttons displayed on the card",defaultValue:{value:"[]",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"},isDisabled:{required:!1,tsType:{name:"boolean"},description:"Whether the card is disabled",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Click handler for the card"},badges:{required:!1,tsType:{name:"Array",elements:[{name:"CardBadge"}],raw:"CardBadge[]"},description:"Badges to display on the card (e.g., type indicator, private, owner).",defaultValue:{value:"[]",computed:!1}},placeholderImageUrl:{required:!1,tsType:{name:"string"},description:"Placeholder image URL when imageUrl is not provided"},renderMetadata:{required:!1,tsType:{name:"signature",type:"function",raw:"() => React.ReactNode",signature:{arguments:[],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:`Custom render function for the metadata section.
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
\`\`\``},classNames:{required:!1,tsType:{name:"CharacterCardClassNames"},description:`Custom class names for internal elements.
Classes are merged with defaults, allowing you to add or override styles.
@example
\`\`\`tsx
<CharacterCard
  classNames={{
    name: "font-serif text-2xl",
    summary: "italic",
  }}
/>
\`\`\``}}};function g({className:t}){return e.jsxs(Nt,{className:l("min-h-[380px] bg-zinc-900 border-zinc-800",t),isDisabled:!0,children:[e.jsx("div",{className:"relative h-64 overflow-hidden bg-zinc-800",children:e.jsx(o,{className:"absolute inset-0 h-full w-full",variant:"default"})}),e.jsxs("div",{className:"relative z-10 -mt-12 flex flex-grow flex-col p-4",children:[e.jsx(o,{className:"mb-1 h-6 w-3/4"}),e.jsxs("div",{className:"mb-4 flex flex-wrap gap-2",children:[e.jsx(o,{className:"h-5 w-12"}),e.jsx(o,{className:"h-5 w-16"}),e.jsx(o,{className:"h-5 w-10"})]}),e.jsxs("div",{className:"mb-4 flex-grow space-y-2",children:[e.jsx(o,{className:"h-3 w-full"}),e.jsx(o,{className:"h-3 w-full"}),e.jsx(o,{className:"h-3 w-2/3"})]}),e.jsxs("div",{className:"flex items-center gap-2 border-t border-zinc-800 pt-3",children:[e.jsx(o,{className:"h-3 w-16"}),e.jsx(o,{className:"h-3 w-20"})]})]})]})}g.displayName="CharacterCardSkeleton";g.__docgenInfo={description:`CharacterCardSkeleton Component

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
\`\`\``,methods:[],displayName:"CharacterCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};const br={title:"Content/CharacterCard",component:s,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{name:{control:"text",description:"Character name"},imageUrl:{control:"text",description:"Character image URL"},summary:{control:"text",description:"Character summary/description"},tags:{control:"object",description:"Character tags array"},tokenCount:{control:"number",description:"Token count for the character"},updatedAt:{control:"text",description:"Last updated timestamp"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},badges:{control:"object",description:"Badges to display on the card"},placeholderImageUrl:{control:"text",description:"Placeholder image URL when imageUrl is not provided",table:{defaultValue:{summary:"img/placeholder/character-placeholder.png"}}},onClick:{action:"clicked"}},decorators:[t=>e.jsx("div",{style:{width:"280px"},children:e.jsx(t,{})})]},n="https://picsum.photos/seed/character1/400/600",p="https://picsum.photos/seed/character2/400/600",x="https://picsum.photos/seed/character3/400/600",Ft="/astrsk/design-system/img/placeholder/character-placeholder.png",a={args:{name:"Alice Wonderland",imageUrl:n,summary:"A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.",tags:["Fantasy","Adventure","Classic"],tokenCount:1523,updatedAt:"2 days ago",placeholderImageUrl:Ft}},C={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(c,{size:12})}]}},b={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(c,{size:12})},{label:"Private",variant:"private",icon:e.jsx(h,{size:12})}]}},k={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(c,{size:12})},{label:"Private",variant:"private",icon:e.jsx(h,{size:12})},{label:"Mine",variant:"owner",icon:e.jsx(It,{size:12})}]}},A={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(c,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(h,{size:12}),position:"right"}]}},v={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(c,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(It,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(h,{size:12}),position:"right"}]}},w={args:{name:"Mystery Character",summary:"A mysterious character with no image yet.",tags:["Unknown"],tokenCount:500,updatedAt:"Just now"}},j={args:{name:"Placeholder Character",summary:"A character using a placeholder image.",tags:["New"],tokenCount:0,updatedAt:"Just now",placeholderImageUrl:Ft}},L={args:{name:"Alice Wonderland",imageUrl:"https://invalid-url-that-will-404.com/image.png",summary:"This character has an invalid image URL, showing the initial fallback.",tags:["Error","Fallback"],tokenCount:1e3,updatedAt:"Just now"}},z={args:{name:"Multi-Tagged Character",imageUrl:p,summary:'Shows +n indicator for overflow. Mobile: 2 tags + "+4", Desktop: 3 tags + "+3".',tags:["Fantasy","Romance","Drama","Action","Comedy","Slice of Life"],tokenCount:2500,updatedAt:"1 week ago"}},S={args:{name:"Responsive Tags Demo",imageUrl:p,summary:"Container Query: 2 tags on narrow cards (<240px), 3 tags on wider cards.",tags:["Fantasy","Romance","Drama","Action","Comedy"],tokenCount:2500,updatedAt:"1 week ago"}},E={args:{name:"Narrow Card (160px)",imageUrl:n,summary:'Card <240px: shows 2 tags + "+2" badge (Container Query).',tags:["Fantasy","Adventure","Drama","Action"],tokenCount:1e3,updatedAt:"1 day ago"},decorators:[t=>e.jsx("div",{style:{width:"160px"},children:e.jsx(t,{})})]},D={args:{name:"Tagless Character",imageUrl:x,summary:"A character without any tags.",tags:[],tokenCount:800,updatedAt:"3 hours ago"}},P={args:{name:"The Exceptionally Long Named Character of the Eastern Kingdoms",imageUrl:n,summary:"A character with a very long name that should be truncated.",tags:["Epic","Fantasy"],tokenCount:3e3,updatedAt:"1 month ago"}},M={args:{...a.args,isDisabled:!0}},N={args:{...a.args,actions:[{icon:le,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:Rt,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate character"},{icon:Ut,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export character"},{icon:Bt,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete character",className:"hover:text-red-400"}]}},T={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(s,{name:"Alice Wonderland",imageUrl:n,summary:"A curious young girl who falls down a rabbit hole into a fantasy world.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago"}),e.jsx(s,{name:"Bob the Builder",imageUrl:p,summary:"Can we fix it? Yes we can! A cheerful constructor who solves problems.",tags:["Kids","Comedy"],tokenCount:890,updatedAt:"1 week ago",badges:[{label:"CHARACTER",icon:e.jsx(c,{size:12})}]}),e.jsx(s,{name:"Charlie Detective",imageUrl:x,summary:"A sharp-minded detective solving mysteries in the foggy streets of London.",tags:["Mystery","Thriller","Drama"],tokenCount:2100,updatedAt:"Just now"})]})},R={args:{name:"Popular Character",imageUrl:n,summary:"A character with custom metadata using renderMetadata prop.",tags:["Popular","Trending"],renderMetadata:()=>e.jsxs(_t,{children:[e.jsx(ie,{icon:e.jsx(cr,{className:"size-3"}),children:"2.5k likes"}),e.jsx(ie,{icon:e.jsx(ir,{className:"size-3"}),children:"128 chats"})]})}},U={args:{name:"Active Character",imageUrl:p,summary:"Demonstrating metadata items with icons for better visual clarity.",tags:["Active"],renderMetadata:()=>e.jsx(_t,{children:e.jsx(ie,{icon:e.jsx(nr,{className:"size-3"}),children:"Last active: 2h ago"})})}},B={args:{name:"Custom Layout Character",imageUrl:x,summary:"When you need complete control over metadata layout.",tags:["Custom"],renderMetadata:()=>e.jsxs("div",{className:"mt-auto grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"1.2k"}),e.jsx("div",{children:"Likes"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"89"}),e.jsx("div",{children:"Chats"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"4.8"}),e.jsx("div",{children:"Rating"})]})]})}},I={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(s,{name:"Default Character",imageUrl:n,summary:"A standard character card with all typical fields.",tags:["Tag1","Tag2"],tokenCount:1e3,updatedAt:"1 day ago"})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(s,{name:"Character with Badge",imageUrl:p,summary:"Shows the CHARACTER type badge.",tags:["Fantasy"],tokenCount:500,updatedAt:"5 hours ago",badges:[{label:"CHARACTER",icon:e.jsx(c,{size:12})}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Disabled"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(s,{name:"Disabled Character",imageUrl:x,summary:"This card is disabled and cannot be interacted with.",tags:["Locked"],tokenCount:0,isDisabled:!0})})]})]})},W={args:{...a.args},decorators:[t=>e.jsx("div",{style:{width:"280px"},children:e.jsx(t,{})})],render:()=>e.jsx(g,{})},_={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(g,{}),e.jsx(g,{}),e.jsx(g,{})]})},F={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}}},G={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")}}},H={args:{...a.args,likeCount:1234}},q={args:{...a.args,downloadCount:5678}},Y={args:{...a.args,likeCount:1234,downloadCount:5678}},J={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:1234,downloadCount:5678}},V={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:1235,downloadCount:5678}},K={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:2500,downloadCount:12e3,actions:[{icon:le,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:Rt,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate character"},{icon:Bt,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete character",className:"hover:text-red-400"}]}},Q={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:123456,downloadCount:9876543}},$={args:{name:"Alice Wonderland",imageUrl:n,summary:"A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.",tags:["Fantasy","Adventure","Classic"],tokenCount:1523,updatedAt:"2 days ago",badges:[{label:"CHARACTER",icon:e.jsx(c,{size:12})},{label:"Private",variant:"private",icon:e.jsx(h,{size:12})}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:2847,downloadCount:15230,actions:[{icon:le,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:Ut,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export character"}]}},O={args:{...a.args,footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 transition-all hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800",onClick:()=>console.log("Play clicked"),children:[e.jsx(u,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 transition-all hover:bg-amber-600/10 hover:text-amber-300",onClick:()=>console.log("Add clicked"),children:[e.jsx(m,{size:14})," ADD"]})]})}},Z={args:{...a.args,badges:[{label:"PLAYER",variant:"default",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(u,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(m,{size:14})," ADD"]})]})}},X={args:{...a.args,badges:[{label:"AI",variant:"private",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(u,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(m,{size:14})," ADD"]})]})}},ee={args:{name:"Mobile Character",imageUrl:n,summary:"A character card with compact footer for mobile view.",tags:["Mobile"],tokenCount:500,emptySummaryText:"",className:"min-h-0",footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold text-zinc-400 transition-all hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800",onClick:()=>console.log("Play clicked"),children:[e.jsx(u,{size:12})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold text-zinc-400 transition-all hover:bg-amber-600/10 hover:text-amber-300",onClick:()=>console.log("Add clicked"),children:[e.jsx(m,{size:12})," ADD"]})]})},decorators:[t=>e.jsx("div",{style:{width:"160px"},children:e.jsx(t,{})})]},ae={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(s,{name:"Alice Wonderland",imageUrl:n,summary:"A curious young girl who falls down a rabbit hole.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago",footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800",children:[e.jsx(u,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-amber-600/10 hover:text-amber-300",children:[e.jsx(m,{size:14})," ADD"]})]})}),e.jsx(s,{name:"Bob the Builder",imageUrl:p,summary:"Can we fix it? Yes we can!",tags:["Kids","Comedy"],tokenCount:890,updatedAt:"1 week ago",badges:[{label:"PLAYER",variant:"default",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(u,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(m,{size:14})," ADD"]})]})}),e.jsx(s,{name:"Charlie Detective",imageUrl:x,summary:"A sharp-minded detective solving mysteries.",tags:["Mystery","Thriller"],tokenCount:2100,updatedAt:"Just now",badges:[{label:"AI",variant:"private",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(u,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(m,{size:14})," ADD"]})]})})]})},te={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(s,{name:"Popular Character",imageUrl:n,summary:"A highly popular character loved by many users.",tags:["Popular","Trending"],tokenCount:1523,updatedAt:"2 days ago",likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:12500,downloadCount:45e3}),e.jsx(s,{name:"New Character",imageUrl:p,summary:"A fresh new character just added to the platform.",tags:["New","Fresh"],tokenCount:890,updatedAt:"1 hour ago",likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:42,downloadCount:128}),e.jsx(s,{name:"Classic Character",imageUrl:x,summary:"A timeless classic that has stood the test of time.",tags:["Classic","Evergreen"],tokenCount:2100,updatedAt:"1 year ago",likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:98765,downloadCount:543210})]})},re={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(c,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(h,{size:12}),position:"right"}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}},parameters:{docs:{description:{story:"When `likeButton` is provided, right-positioned badges are automatically hidden to prevent visual overlap. Use left-positioned badges instead when using likeButton."}}}};var ke,Ae,ve;a.parameters={...a.parameters,docs:{...(ke=a.parameters)==null?void 0:ke.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.',
    tags: ['Fantasy', 'Adventure', 'Classic'],
    tokenCount: 1523,
    updatedAt: '2 days ago',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(ve=(Ae=a.parameters)==null?void 0:Ae.docs)==null?void 0:ve.source}}};var we,je,Le;C.parameters={...C.parameters,docs:{...(we=C.parameters)==null?void 0:we.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'CHARACTER',
      icon: <Layers size={12} />
    }]
  }
}`,...(Le=(je=C.parameters)==null?void 0:je.docs)==null?void 0:Le.source}}};var ze,Se,Ee;b.parameters={...b.parameters,docs:{...(ze=b.parameters)==null?void 0:ze.docs,source:{originalSource:`{
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
}`,...(Ee=(Se=b.parameters)==null?void 0:Se.docs)==null?void 0:Ee.source}}};var De,Pe,Me;k.parameters={...k.parameters,docs:{...(De=k.parameters)==null?void 0:De.docs,source:{originalSource:`{
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
}`,...(Me=(Pe=k.parameters)==null?void 0:Pe.docs)==null?void 0:Me.source}}};var Ne,Te,Re;A.parameters={...A.parameters,docs:{...(Ne=A.parameters)==null?void 0:Ne.docs,source:{originalSource:`{
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
}`,...(Re=(Te=A.parameters)==null?void 0:Te.docs)==null?void 0:Re.source}}};var Ue,Be,Ie;v.parameters={...v.parameters,docs:{...(Ue=v.parameters)==null?void 0:Ue.docs,source:{originalSource:`{
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
}`,...(Ie=(Be=v.parameters)==null?void 0:Be.docs)==null?void 0:Ie.source}}};var We,_e,Fe;w.parameters={...w.parameters,docs:{...(We=w.parameters)==null?void 0:We.docs,source:{originalSource:`{
  args: {
    name: 'Mystery Character',
    summary: 'A mysterious character with no image yet.',
    tags: ['Unknown'],
    tokenCount: 500,
    updatedAt: 'Just now'
  }
}`,...(Fe=(_e=w.parameters)==null?void 0:_e.docs)==null?void 0:Fe.source}}};var Ge,He,qe;j.parameters={...j.parameters,docs:{...(Ge=j.parameters)==null?void 0:Ge.docs,source:{originalSource:`{
  args: {
    name: 'Placeholder Character',
    summary: 'A character using a placeholder image.',
    tags: ['New'],
    tokenCount: 0,
    updatedAt: 'Just now',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(qe=(He=j.parameters)==null?void 0:He.docs)==null?void 0:qe.source}}};var Ye,Je,Ve;L.parameters={...L.parameters,docs:{...(Ye=L.parameters)==null?void 0:Ye.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: 'https://invalid-url-that-will-404.com/image.png',
    summary: 'This character has an invalid image URL, showing the initial fallback.',
    tags: ['Error', 'Fallback'],
    tokenCount: 1000,
    updatedAt: 'Just now'
  }
}`,...(Ve=(Je=L.parameters)==null?void 0:Je.docs)==null?void 0:Ve.source}}};var Ke,Qe,$e;z.parameters={...z.parameters,docs:{...(Ke=z.parameters)==null?void 0:Ke.docs,source:{originalSource:`{
  args: {
    name: 'Multi-Tagged Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'Shows +n indicator for overflow. Mobile: 2 tags + "+4", Desktop: 3 tags + "+3".',
    tags: ['Fantasy', 'Romance', 'Drama', 'Action', 'Comedy', 'Slice of Life'],
    tokenCount: 2500,
    updatedAt: '1 week ago'
  }
}`,...($e=(Qe=z.parameters)==null?void 0:Qe.docs)==null?void 0:$e.source}}};var Oe,Ze,Xe;S.parameters={...S.parameters,docs:{...(Oe=S.parameters)==null?void 0:Oe.docs,source:{originalSource:`{
  args: {
    name: 'Responsive Tags Demo',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'Container Query: 2 tags on narrow cards (<240px), 3 tags on wider cards.',
    tags: ['Fantasy', 'Romance', 'Drama', 'Action', 'Comedy'],
    tokenCount: 2500,
    updatedAt: '1 week ago'
  }
}`,...(Xe=(Ze=S.parameters)==null?void 0:Ze.docs)==null?void 0:Xe.source}}};var ea,aa,ta;E.parameters={...E.parameters,docs:{...(ea=E.parameters)==null?void 0:ea.docs,source:{originalSource:`{
  args: {
    name: 'Narrow Card (160px)',
    imageUrl: SAMPLE_IMAGE,
    summary: 'Card <240px: shows 2 tags + "+2" badge (Container Query).',
    tags: ['Fantasy', 'Adventure', 'Drama', 'Action'],
    tokenCount: 1000,
    updatedAt: '1 day ago'
  },
  decorators: [Story => <div style={{
    width: '160px'
  }}>
        <Story />
      </div>]
}`,...(ta=(aa=E.parameters)==null?void 0:aa.docs)==null?void 0:ta.source}}};var ra,sa,oa;D.parameters={...D.parameters,docs:{...(ra=D.parameters)==null?void 0:ra.docs,source:{originalSource:`{
  args: {
    name: 'Tagless Character',
    imageUrl: SAMPLE_IMAGE_3,
    summary: 'A character without any tags.',
    tags: [],
    tokenCount: 800,
    updatedAt: '3 hours ago'
  }
}`,...(oa=(sa=D.parameters)==null?void 0:sa.docs)==null?void 0:oa.source}}};var na,ia,la;P.parameters={...P.parameters,docs:{...(na=P.parameters)==null?void 0:na.docs,source:{originalSource:`{
  args: {
    name: 'The Exceptionally Long Named Character of the Eastern Kingdoms',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A character with a very long name that should be truncated.',
    tags: ['Epic', 'Fantasy'],
    tokenCount: 3000,
    updatedAt: '1 month ago'
  }
}`,...(la=(ia=P.parameters)==null?void 0:ia.docs)==null?void 0:la.source}}};var ca,da,ua;M.parameters={...M.parameters,docs:{...(ca=M.parameters)==null?void 0:ca.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(ua=(da=M.parameters)==null?void 0:da.docs)==null?void 0:ua.source}}};var ma,pa,ga;N.parameters={...N.parameters,docs:{...(ma=N.parameters)==null?void 0:ma.docs,source:{originalSource:`{
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
}`,...(ga=(pa=N.parameters)==null?void 0:pa.docs)==null?void 0:ga.source}}};var ha,xa,ya;T.parameters={...T.parameters,docs:{...(ha=T.parameters)==null?void 0:ha.docs,source:{originalSource:`{
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
}`,...(ya=(xa=T.parameters)==null?void 0:xa.docs)==null?void 0:ya.source}}};var fa,Ca,ba;R.parameters={...R.parameters,docs:{...(fa=R.parameters)==null?void 0:fa.docs,source:{originalSource:`{
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
}`,...(ba=(Ca=R.parameters)==null?void 0:Ca.docs)==null?void 0:ba.source}}};var ka,Aa,va;U.parameters={...U.parameters,docs:{...(ka=U.parameters)==null?void 0:ka.docs,source:{originalSource:`{
  args: {
    name: 'Active Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'Demonstrating metadata items with icons for better visual clarity.',
    tags: ['Active'],
    renderMetadata: () => <MetadataContainer>
        <MetadataItem icon={<Clock className="size-3" />}>Last active: 2h ago</MetadataItem>
      </MetadataContainer>
  }
}`,...(va=(Aa=U.parameters)==null?void 0:Aa.docs)==null?void 0:va.source}}};var wa,ja,La;B.parameters={...B.parameters,docs:{...(wa=B.parameters)==null?void 0:wa.docs,source:{originalSource:`{
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
}`,...(La=(ja=B.parameters)==null?void 0:ja.docs)==null?void 0:La.source}}};var za,Sa,Ea;I.parameters={...I.parameters,docs:{...(za=I.parameters)==null?void 0:za.docs,source:{originalSource:`{
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
}`,...(Ea=(Sa=I.parameters)==null?void 0:Sa.docs)==null?void 0:Ea.source}}};var Da,Pa,Ma;W.parameters={...W.parameters,docs:{...(Da=W.parameters)==null?void 0:Da.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '280px'
  }}>
        <Story />
      </div>],
  render: () => <CharacterCardSkeleton />
}`,...(Ma=(Pa=W.parameters)==null?void 0:Pa.docs)==null?void 0:Ma.source}}};var Na,Ta,Ra;_.parameters={..._.parameters,docs:{...(Na=_.parameters)==null?void 0:Na.docs,source:{originalSource:`{
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
}`,...(Ra=(Ta=_.parameters)==null?void 0:Ta.docs)==null?void 0:Ra.source}}};var Ua,Ba,Ia;F.parameters={...F.parameters,docs:{...(Ua=F.parameters)==null?void 0:Ua.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }
  }
}`,...(Ia=(Ba=F.parameters)==null?void 0:Ba.docs)==null?void 0:Ia.source}}};var Wa,_a,Fa;G.parameters={...G.parameters,docs:{...(Wa=G.parameters)==null?void 0:Wa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    }
  }
}`,...(Fa=(_a=G.parameters)==null?void 0:_a.docs)==null?void 0:Fa.source}}};var Ga,Ha,qa;H.parameters={...H.parameters,docs:{...(Ga=H.parameters)==null?void 0:Ga.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234
  }
}`,...(qa=(Ha=H.parameters)==null?void 0:Ha.docs)==null?void 0:qa.source}}};var Ya,Ja,Va;q.parameters={...q.parameters,docs:{...(Ya=q.parameters)==null?void 0:Ya.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    downloadCount: 5678
  }
}`,...(Va=(Ja=q.parameters)==null?void 0:Ja.docs)==null?void 0:Va.source}}};var Ka,Qa,$a;Y.parameters={...Y.parameters,docs:{...(Ka=Y.parameters)==null?void 0:Ka.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...($a=(Qa=Y.parameters)==null?void 0:Qa.docs)==null?void 0:$a.source}}};var Oa,Za,Xa;J.parameters={...J.parameters,docs:{...(Oa=J.parameters)==null?void 0:Oa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    },
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Xa=(Za=J.parameters)==null?void 0:Za.docs)==null?void 0:Xa.source}}};var et,at,tt;V.parameters={...V.parameters,docs:{...(et=V.parameters)==null?void 0:et.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 1235,
    downloadCount: 5678
  }
}`,...(tt=(at=V.parameters)==null?void 0:at.docs)==null?void 0:tt.source}}};var rt,st,ot;K.parameters={...K.parameters,docs:{...(rt=K.parameters)==null?void 0:rt.docs,source:{originalSource:`{
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
}`,...(ot=(st=K.parameters)==null?void 0:st.docs)==null?void 0:ot.source}}};var nt,it,lt;Q.parameters={...Q.parameters,docs:{...(nt=Q.parameters)==null?void 0:nt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 123456,
    downloadCount: 9876543
  }
}`,...(lt=(it=Q.parameters)==null?void 0:it.docs)==null?void 0:lt.source}}};var ct,dt,ut;$.parameters={...$.parameters,docs:{...(ct=$.parameters)==null?void 0:ct.docs,source:{originalSource:`{
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
      icon: <Lock size={12} />
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
}`,...(ut=(dt=$.parameters)==null?void 0:dt.docs)==null?void 0:ut.source}}};var mt,pt,gt;O.parameters={...O.parameters,docs:{...(mt=O.parameters)==null?void 0:mt.docs,source:{originalSource:`{
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
}`,...(gt=(pt=O.parameters)==null?void 0:pt.docs)==null?void 0:gt.source}}};var ht,xt,yt;Z.parameters={...Z.parameters,docs:{...(ht=Z.parameters)==null?void 0:ht.docs,source:{originalSource:`{
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
}`,...(yt=(xt=Z.parameters)==null?void 0:xt.docs)==null?void 0:yt.source}}};var ft,Ct,bt;X.parameters={...X.parameters,docs:{...(ft=X.parameters)==null?void 0:ft.docs,source:{originalSource:`{
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
}`,...(bt=(Ct=X.parameters)==null?void 0:Ct.docs)==null?void 0:bt.source}}};var kt,At,vt;ee.parameters={...ee.parameters,docs:{...(kt=ee.parameters)==null?void 0:kt.docs,source:{originalSource:`{
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
}`,...(vt=(At=ee.parameters)==null?void 0:At.docs)==null?void 0:vt.source}}};var wt,jt,Lt;ae.parameters={...ae.parameters,docs:{...(wt=ae.parameters)==null?void 0:wt.docs,source:{originalSource:`{
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
}`,...(Lt=(jt=ae.parameters)==null?void 0:jt.docs)==null?void 0:Lt.source}}};var zt,St,Et;te.parameters={...te.parameters,docs:{...(zt=te.parameters)==null?void 0:zt.docs,source:{originalSource:`{
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
}`,...(Et=(St=te.parameters)==null?void 0:St.docs)==null?void 0:Et.source}}};var Dt,Pt,Mt;re.parameters={...re.parameters,docs:{...(Dt=re.parameters)==null?void 0:Dt.docs,source:{originalSource:`{
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
    }],
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'When \`likeButton\` is provided, right-positioned badges are automatically hidden to prevent visual overlap. Use left-positioned badges instead when using likeButton.'
      }
    }
  }
}`,...(Mt=(Pt=re.parameters)==null?void 0:Pt.docs)==null?void 0:Mt.source}}};const kr=["Default","WithBadges","WithMultipleBadges","WithAllBadgeVariants","WithBadgesLeftAndRight","WithMultipleBadgesEachSide","WithoutImage","WithPlaceholder","ImageError","ManyTags","ResponsiveTags","NarrowCardWidth","NoTags","LongName","Disabled","WithActions","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid","WithLikeButton","WithLikeButtonLiked","WithLikeCount","WithDownloadCount","WithPopularityStats","WithLikeButtonAndStats","WithLikeButtonLikedAndStats","WithLikeButtonAndActions","HighPopularityCounts","FullFeatured","WithFooterActions","WithFooterActionsSelectedPlayer","WithFooterActionsSelectedAI","WithFooterActionsCompact","GridLayoutWithFooterActions","GridLayoutWithPopularity","LikeButtonHidesRightBadge"];export{I as AllStates,R as CustomMetadata,a as Default,M as Disabled,$ as FullFeatured,B as FullyCustomMetadata,T as GridLayout,ae as GridLayoutWithFooterActions,te as GridLayoutWithPopularity,Q as HighPopularityCounts,L as ImageError,re as LikeButtonHidesRightBadge,P as LongName,z as ManyTags,U as MetadataWithIcons,E as NarrowCardWidth,D as NoTags,S as ResponsiveTags,W as Skeleton,_ as SkeletonGrid,N as WithActions,k as WithAllBadgeVariants,C as WithBadges,A as WithBadgesLeftAndRight,q as WithDownloadCount,O as WithFooterActions,ee as WithFooterActionsCompact,X as WithFooterActionsSelectedAI,Z as WithFooterActionsSelectedPlayer,F as WithLikeButton,K as WithLikeButtonAndActions,J as WithLikeButtonAndStats,G as WithLikeButtonLiked,V as WithLikeButtonLikedAndStats,H as WithLikeCount,b as WithMultipleBadges,v as WithMultipleBadgesEachSide,j as WithPlaceholder,Y as WithPopularityStats,w as WithoutImage,kr as __namedExportsOrder,br as default};
