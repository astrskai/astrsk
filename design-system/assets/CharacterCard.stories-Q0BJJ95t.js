import{r as be,j as e}from"./iframe-B7sIs6_0.js";import{c,f as Ka}from"./utils-CF6QUdYH.js";import{u as Oa,B as za,C as Za,a as Qa,b as Ce,c as Xa,d as Ea,e as oe,S as ie,f as Sa,D as Da,T as Pa,L as i,g as er}from"./useImageRenderer-BBiAO4Os.js";import{S as o}from"./Skeleton-QjbliPQf.js";import{L as p}from"./lock-CEr9HHCn.js";import{U as Ma}from"./user-GNr-mCYg.js";import{c as le}from"./createLucideIcon-DJFYYEIn.js";import{M as tr}from"./message-square-Ds5Ry167.js";import"./preload-helper-CwRszBsw.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ar=[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]],rr=le("heart",ar);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sr=[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]],d=le("play",sr);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const or=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],u=le("plus",or),Na=Ea,ne=oe;function s({name:a,imageUrl:re,summary:ce,tags:x,maxVisibleTags:f=3,tokenCount:Ra=0,updatedAt:de,className:Ua,actions:Ba=[],isDisabled:Wa=!1,onClick:Ia,badges:y=[],placeholderImageUrl:se,renderMetadata:ue,emptySummaryText:me="No summary",likeButton:b,likeCount:pe,downloadCount:ge,imageSizes:_a,loading:Fa="lazy",priority:he=!1,footerActions:xe,renderImage:Ga,classNames:r}){const[Ha,fe]=be.useState(!1),qa=Oa({renderImage:Ga});be.useEffect(()=>{fe(!1)},[re,se]);const ye=(re||se)&&!Ha,Ya=!ye,Ja=()=>{const n=re||se;return n?qa({src:n,alt:a,className:"absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",sizes:_a,loading:he?void 0:Fa,onError:()=>fe(!0),fill:!0,priority:he}):null};return e.jsxs(za,{className:c("min-h-[380px]",Ua),isDisabled:Wa,onClick:Ia,children:[e.jsxs("div",{className:"relative h-64 overflow-hidden bg-zinc-800",children:[ye&&Ja(),Ya&&e.jsx("div",{className:"absolute inset-0 flex items-center justify-center",children:e.jsx("span",{className:"text-6xl font-bold text-zinc-500",children:a.charAt(0).toUpperCase()||"?"})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"}),b&&e.jsx("div",{className:"absolute top-2 right-2 z-20",children:e.jsx(Za,{...b})}),e.jsx(Qa,{actions:Ba,className:b?"top-12":void 0}),y.some(n=>(n.position??"left")==="left")&&e.jsx("div",{className:"absolute top-3 left-3 z-10 max-w-[45%]",children:e.jsx(Ce,{badges:y,position:"left"})}),!b&&y.some(n=>n.position==="right")&&e.jsx("div",{className:"absolute top-3 right-3 z-10 max-w-[45%]",children:e.jsx(Ce,{badges:y,position:"right"})})]}),e.jsxs("div",{className:"relative z-10 -mt-12 flex flex-grow flex-col p-4",children:[e.jsx("h3",{className:c("mb-1 line-clamp-2 text-lg md:text-xl font-bold break-words text-white drop-shadow-md",r==null?void 0:r.name),children:a}),e.jsx("div",{className:c("mb-2 md:mb-4 flex flex-wrap gap-2",r==null?void 0:r.tagsContainer),children:x.length>0?e.jsxs(e.Fragment,{children:[x.slice(0,f).map((n,Va)=>{const $a=Math.floor(85/(f+1));return e.jsx("span",{className:c("truncate rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",r==null?void 0:r.tag),style:{maxWidth:`${$a}%`},children:n},`${n}-${Va}`)}),x.length>f&&e.jsxs("span",{className:c("shrink-0 rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",r==null?void 0:r.tag),children:["+",x.length-f]})]}):e.jsx("span",{className:"text-[10px] text-zinc-400",children:"No tags"})}),(ce||me)&&e.jsx("p",{className:c("mb-2 md:mb-4 line-clamp-2 flex-grow text-xs leading-relaxed break-all text-ellipsis text-zinc-400",r==null?void 0:r.summary),children:ce||me}),(pe!==void 0||ge!==void 0)&&e.jsx(Xa,{likeCount:pe,downloadCount:ge,className:"mb-2"}),ue?ue():e.jsxs(Ea,{children:[e.jsxs(oe,{children:[Ka(Ra)," Tokens"]}),de&&e.jsx(oe,{children:de})]})]}),xe&&e.jsx("div",{className:"mt-auto flex border-t border-zinc-800",children:xe})]})}s.__docgenInfo={description:"",methods:[],displayName:"CharacterCard",props:{name:{required:!0,tsType:{name:"string"},description:"Character name"},imageUrl:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Character image URL"},summary:{required:!1,tsType:{name:"string"},description:"Character summary/description"},tags:{required:!0,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"Character tags"},maxVisibleTags:{required:!1,tsType:{name:"number"},description:`Maximum number of tags to display before showing "+n" indicator.
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
\`\`\``}}};function m({className:a}){return e.jsxs(za,{className:c("min-h-[380px]",a),isDisabled:!0,children:[e.jsx("div",{className:"relative h-64 overflow-hidden bg-zinc-800",children:e.jsx(o,{className:"absolute inset-0 h-full w-full",variant:"default"})}),e.jsxs("div",{className:"relative z-10 -mt-12 flex flex-grow flex-col p-4",children:[e.jsx(o,{className:"mb-1 h-6 w-3/4"}),e.jsxs("div",{className:"mb-4 flex flex-wrap gap-2",children:[e.jsx(o,{className:"h-5 w-12"}),e.jsx(o,{className:"h-5 w-16"}),e.jsx(o,{className:"h-5 w-10"})]}),e.jsxs("div",{className:"mb-4 flex-grow space-y-2",children:[e.jsx(o,{className:"h-3 w-full"}),e.jsx(o,{className:"h-3 w-full"}),e.jsx(o,{className:"h-3 w-2/3"})]}),e.jsxs("div",{className:"flex items-center gap-2 border-t border-zinc-800 pt-3",children:[e.jsx(o,{className:"h-3 w-16"}),e.jsx(o,{className:"h-3 w-20"})]})]})]})}m.displayName="CharacterCardSkeleton";m.__docgenInfo={description:`CharacterCardSkeleton Component

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
\`\`\``,methods:[],displayName:"CharacterCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};const hr={title:"Content/CharacterCard",component:s,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{name:{control:"text",description:"Character name"},imageUrl:{control:"text",description:"Character image URL"},summary:{control:"text",description:"Character summary/description"},tags:{control:"object",description:"Character tags array"},tokenCount:{control:"number",description:"Token count for the character"},updatedAt:{control:"text",description:"Last updated timestamp"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},badges:{control:"object",description:"Badges to display on the card"},placeholderImageUrl:{control:"text",description:"Placeholder image URL when imageUrl is not provided",table:{defaultValue:{summary:"img/placeholder/character-placeholder.png"}}},onClick:{action:"clicked"}},decorators:[a=>e.jsx("div",{style:{width:"280px"},children:e.jsx(a,{})})]},l="https://picsum.photos/seed/character1/400/600",g="https://picsum.photos/seed/character2/400/600",h="https://picsum.photos/seed/character3/400/600",Ta="/astrsk/design-system/img/placeholder/character-placeholder.png",t={args:{name:"Alice Wonderland",imageUrl:l,summary:"A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.",tags:["Fantasy","Adventure","Classic"],tokenCount:1523,updatedAt:"2 days ago",placeholderImageUrl:Ta}},C={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})}]}},k={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})},{label:"Private",variant:"private",icon:e.jsx(p,{size:12})}]}},A={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})},{label:"Private",variant:"private",icon:e.jsx(p,{size:12})},{label:"Mine",variant:"owner",icon:e.jsx(Ma,{size:12})}]}},v={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(p,{size:12}),position:"right"}]}},w={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(Ma,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(p,{size:12}),position:"right"}]}},j={args:{name:"Mystery Character",summary:"A mysterious character with no image yet.",tags:["Unknown"],tokenCount:500,updatedAt:"Just now"}},L={args:{name:"Placeholder Character",summary:"A character using a placeholder image.",tags:["New"],tokenCount:0,updatedAt:"Just now",placeholderImageUrl:Ta}},z={args:{name:"Alice Wonderland",imageUrl:"https://invalid-url-that-will-404.com/image.png",summary:"This character has an invalid image URL, showing the initial fallback.",tags:["Error","Fallback"],tokenCount:1e3,updatedAt:"Just now"}},E={args:{name:"Multi-Tagged Character",imageUrl:g,summary:"This character has many different tags to demonstrate overflow.",tags:["Fantasy","Romance","Drama","Action","Comedy","Slice of Life"],tokenCount:2500,updatedAt:"1 week ago"}},S={args:{name:"Tagless Character",imageUrl:h,summary:"A character without any tags.",tags:[],tokenCount:800,updatedAt:"3 hours ago"}},D={args:{name:"The Exceptionally Long Named Character of the Eastern Kingdoms",imageUrl:l,summary:"A character with a very long name that should be truncated.",tags:["Epic","Fantasy"],tokenCount:3e3,updatedAt:"1 month ago"}},P={args:{...t.args,isDisabled:!0}},M={args:{...t.args,actions:[{icon:ie,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:Sa,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate character"},{icon:Da,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export character"},{icon:Pa,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete character",className:"hover:text-red-400"}]}},N={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(s,{name:"Alice Wonderland",imageUrl:l,summary:"A curious young girl who falls down a rabbit hole into a fantasy world.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago"}),e.jsx(s,{name:"Bob the Builder",imageUrl:g,summary:"Can we fix it? Yes we can! A cheerful constructor who solves problems.",tags:["Kids","Comedy"],tokenCount:890,updatedAt:"1 week ago",badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})}]}),e.jsx(s,{name:"Charlie Detective",imageUrl:h,summary:"A sharp-minded detective solving mysteries in the foggy streets of London.",tags:["Mystery","Thriller","Drama"],tokenCount:2100,updatedAt:"Just now"})]})},T={args:{name:"Popular Character",imageUrl:l,summary:"A character with custom metadata using renderMetadata prop.",tags:["Popular","Trending"],renderMetadata:()=>e.jsxs(Na,{children:[e.jsx(ne,{icon:e.jsx(rr,{className:"size-3"}),children:"2.5k likes"}),e.jsx(ne,{icon:e.jsx(tr,{className:"size-3"}),children:"128 chats"})]})}},R={args:{name:"Active Character",imageUrl:g,summary:"Demonstrating metadata items with icons for better visual clarity.",tags:["Active"],renderMetadata:()=>e.jsx(Na,{children:e.jsx(ne,{icon:e.jsx(er,{className:"size-3"}),children:"Last active: 2h ago"})})}},U={args:{name:"Custom Layout Character",imageUrl:h,summary:"When you need complete control over metadata layout.",tags:["Custom"],renderMetadata:()=>e.jsxs("div",{className:"mt-auto grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"1.2k"}),e.jsx("div",{children:"Likes"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"89"}),e.jsx("div",{children:"Chats"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"4.8"}),e.jsx("div",{children:"Rating"})]})]})}},B={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(s,{name:"Default Character",imageUrl:l,summary:"A standard character card with all typical fields.",tags:["Tag1","Tag2"],tokenCount:1e3,updatedAt:"1 day ago"})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(s,{name:"Character with Badge",imageUrl:g,summary:"Shows the CHARACTER type badge.",tags:["Fantasy"],tokenCount:500,updatedAt:"5 hours ago",badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Disabled"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(s,{name:"Disabled Character",imageUrl:h,summary:"This card is disabled and cannot be interacted with.",tags:["Locked"],tokenCount:0,isDisabled:!0})})]})]})},W={args:{...t.args},decorators:[a=>e.jsx("div",{style:{width:"280px"},children:e.jsx(a,{})})],render:()=>e.jsx(m,{})},I={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(m,{}),e.jsx(m,{}),e.jsx(m,{})]})},_={args:{...t.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}}},F={args:{...t.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")}}},G={args:{...t.args,likeCount:1234}},H={args:{...t.args,downloadCount:5678}},q={args:{...t.args,likeCount:1234,downloadCount:5678}},Y={args:{...t.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:1234,downloadCount:5678}},J={args:{...t.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:1235,downloadCount:5678}},V={args:{...t.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:2500,downloadCount:12e3,actions:[{icon:ie,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:Sa,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate character"},{icon:Pa,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete character",className:"hover:text-red-400"}]}},$={args:{...t.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:123456,downloadCount:9876543}},K={args:{name:"Alice Wonderland",imageUrl:l,summary:"A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.",tags:["Fantasy","Adventure","Classic"],tokenCount:1523,updatedAt:"2 days ago",badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})},{label:"Private",variant:"private",icon:e.jsx(p,{size:12})}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:2847,downloadCount:15230,actions:[{icon:ie,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:Da,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export character"}]}},O={args:{...t.args,footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 transition-all hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800",onClick:()=>console.log("Play clicked"),children:[e.jsx(d,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 transition-all hover:bg-amber-600/10 hover:text-amber-300",onClick:()=>console.log("Add clicked"),children:[e.jsx(u,{size:14})," ADD"]})]})}},Z={args:{...t.args,badges:[{label:"PLAYER",variant:"default",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(d,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(u,{size:14})," ADD"]})]})}},Q={args:{...t.args,badges:[{label:"AI",variant:"private",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(d,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(u,{size:14})," ADD"]})]})}},X={args:{name:"Mobile Character",imageUrl:l,summary:"A character card with compact footer for mobile view.",tags:["Mobile"],tokenCount:500,emptySummaryText:"",className:"min-h-0",footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold text-zinc-400 transition-all hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800",onClick:()=>console.log("Play clicked"),children:[e.jsx(d,{size:12})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold text-zinc-400 transition-all hover:bg-amber-600/10 hover:text-amber-300",onClick:()=>console.log("Add clicked"),children:[e.jsx(u,{size:12})," ADD"]})]})},decorators:[a=>e.jsx("div",{style:{width:"160px"},children:e.jsx(a,{})})]},ee={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(s,{name:"Alice Wonderland",imageUrl:l,summary:"A curious young girl who falls down a rabbit hole.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago",footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800",children:[e.jsx(d,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-amber-600/10 hover:text-amber-300",children:[e.jsx(u,{size:14})," ADD"]})]})}),e.jsx(s,{name:"Bob the Builder",imageUrl:g,summary:"Can we fix it? Yes we can!",tags:["Kids","Comedy"],tokenCount:890,updatedAt:"1 week ago",badges:[{label:"PLAYER",variant:"default",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(d,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(u,{size:14})," ADD"]})]})}),e.jsx(s,{name:"Charlie Detective",imageUrl:h,summary:"A sharp-minded detective solving mysteries.",tags:["Mystery","Thriller"],tokenCount:2100,updatedAt:"Just now",badges:[{label:"AI",variant:"private",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(d,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(u,{size:14})," ADD"]})]})})]})},te={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(s,{name:"Popular Character",imageUrl:l,summary:"A highly popular character loved by many users.",tags:["Popular","Trending"],tokenCount:1523,updatedAt:"2 days ago",likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:12500,downloadCount:45e3}),e.jsx(s,{name:"New Character",imageUrl:g,summary:"A fresh new character just added to the platform.",tags:["New","Fresh"],tokenCount:890,updatedAt:"1 hour ago",likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:42,downloadCount:128}),e.jsx(s,{name:"Classic Character",imageUrl:h,summary:"A timeless classic that has stood the test of time.",tags:["Classic","Evergreen"],tokenCount:2100,updatedAt:"1 year ago",likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:98765,downloadCount:543210})]})},ae={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(p,{size:12}),position:"right"}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}},parameters:{docs:{description:{story:"When `likeButton` is provided, right-positioned badges are automatically hidden to prevent visual overlap. Use left-positioned badges instead when using likeButton."}}}};var ke,Ae,ve;t.parameters={...t.parameters,docs:{...(ke=t.parameters)==null?void 0:ke.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.',
    tags: ['Fantasy', 'Adventure', 'Classic'],
    tokenCount: 1523,
    updatedAt: '2 days ago',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(ve=(Ae=t.parameters)==null?void 0:Ae.docs)==null?void 0:ve.source}}};var we,je,Le;C.parameters={...C.parameters,docs:{...(we=C.parameters)==null?void 0:we.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'CHARACTER',
      icon: <Layers size={12} />
    }]
  }
}`,...(Le=(je=C.parameters)==null?void 0:je.docs)==null?void 0:Le.source}}};var ze,Ee,Se;k.parameters={...k.parameters,docs:{...(ze=k.parameters)==null?void 0:ze.docs,source:{originalSource:`{
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
}`,...(Se=(Ee=k.parameters)==null?void 0:Ee.docs)==null?void 0:Se.source}}};var De,Pe,Me;A.parameters={...A.parameters,docs:{...(De=A.parameters)==null?void 0:De.docs,source:{originalSource:`{
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
}`,...(Me=(Pe=A.parameters)==null?void 0:Pe.docs)==null?void 0:Me.source}}};var Ne,Te,Re;v.parameters={...v.parameters,docs:{...(Ne=v.parameters)==null?void 0:Ne.docs,source:{originalSource:`{
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
}`,...(Re=(Te=v.parameters)==null?void 0:Te.docs)==null?void 0:Re.source}}};var Ue,Be,We;w.parameters={...w.parameters,docs:{...(Ue=w.parameters)==null?void 0:Ue.docs,source:{originalSource:`{
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
}`,...(We=(Be=w.parameters)==null?void 0:Be.docs)==null?void 0:We.source}}};var Ie,_e,Fe;j.parameters={...j.parameters,docs:{...(Ie=j.parameters)==null?void 0:Ie.docs,source:{originalSource:`{
  args: {
    name: 'Mystery Character',
    summary: 'A mysterious character with no image yet.',
    tags: ['Unknown'],
    tokenCount: 500,
    updatedAt: 'Just now'
  }
}`,...(Fe=(_e=j.parameters)==null?void 0:_e.docs)==null?void 0:Fe.source}}};var Ge,He,qe;L.parameters={...L.parameters,docs:{...(Ge=L.parameters)==null?void 0:Ge.docs,source:{originalSource:`{
  args: {
    name: 'Placeholder Character',
    summary: 'A character using a placeholder image.',
    tags: ['New'],
    tokenCount: 0,
    updatedAt: 'Just now',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(qe=(He=L.parameters)==null?void 0:He.docs)==null?void 0:qe.source}}};var Ye,Je,Ve;z.parameters={...z.parameters,docs:{...(Ye=z.parameters)==null?void 0:Ye.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: 'https://invalid-url-that-will-404.com/image.png',
    summary: 'This character has an invalid image URL, showing the initial fallback.',
    tags: ['Error', 'Fallback'],
    tokenCount: 1000,
    updatedAt: 'Just now'
  }
}`,...(Ve=(Je=z.parameters)==null?void 0:Je.docs)==null?void 0:Ve.source}}};var $e,Ke,Oe;E.parameters={...E.parameters,docs:{...($e=E.parameters)==null?void 0:$e.docs,source:{originalSource:`{
  args: {
    name: 'Multi-Tagged Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'This character has many different tags to demonstrate overflow.',
    tags: ['Fantasy', 'Romance', 'Drama', 'Action', 'Comedy', 'Slice of Life'],
    tokenCount: 2500,
    updatedAt: '1 week ago'
  }
}`,...(Oe=(Ke=E.parameters)==null?void 0:Ke.docs)==null?void 0:Oe.source}}};var Ze,Qe,Xe;S.parameters={...S.parameters,docs:{...(Ze=S.parameters)==null?void 0:Ze.docs,source:{originalSource:`{
  args: {
    name: 'Tagless Character',
    imageUrl: SAMPLE_IMAGE_3,
    summary: 'A character without any tags.',
    tags: [],
    tokenCount: 800,
    updatedAt: '3 hours ago'
  }
}`,...(Xe=(Qe=S.parameters)==null?void 0:Qe.docs)==null?void 0:Xe.source}}};var et,tt,at;D.parameters={...D.parameters,docs:{...(et=D.parameters)==null?void 0:et.docs,source:{originalSource:`{
  args: {
    name: 'The Exceptionally Long Named Character of the Eastern Kingdoms',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A character with a very long name that should be truncated.',
    tags: ['Epic', 'Fantasy'],
    tokenCount: 3000,
    updatedAt: '1 month ago'
  }
}`,...(at=(tt=D.parameters)==null?void 0:tt.docs)==null?void 0:at.source}}};var rt,st,ot;P.parameters={...P.parameters,docs:{...(rt=P.parameters)==null?void 0:rt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(ot=(st=P.parameters)==null?void 0:st.docs)==null?void 0:ot.source}}};var nt,it,lt;M.parameters={...M.parameters,docs:{...(nt=M.parameters)==null?void 0:nt.docs,source:{originalSource:`{
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
}`,...(lt=(it=M.parameters)==null?void 0:it.docs)==null?void 0:lt.source}}};var ct,dt,ut;N.parameters={...N.parameters,docs:{...(ct=N.parameters)==null?void 0:ct.docs,source:{originalSource:`{
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
}`,...(ut=(dt=N.parameters)==null?void 0:dt.docs)==null?void 0:ut.source}}};var mt,pt,gt;T.parameters={...T.parameters,docs:{...(mt=T.parameters)==null?void 0:mt.docs,source:{originalSource:`{
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
}`,...(gt=(pt=T.parameters)==null?void 0:pt.docs)==null?void 0:gt.source}}};var ht,xt,ft;R.parameters={...R.parameters,docs:{...(ht=R.parameters)==null?void 0:ht.docs,source:{originalSource:`{
  args: {
    name: 'Active Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'Demonstrating metadata items with icons for better visual clarity.',
    tags: ['Active'],
    renderMetadata: () => <MetadataContainer>
        <MetadataItem icon={<Clock className="size-3" />}>Last active: 2h ago</MetadataItem>
      </MetadataContainer>
  }
}`,...(ft=(xt=R.parameters)==null?void 0:xt.docs)==null?void 0:ft.source}}};var yt,bt,Ct;U.parameters={...U.parameters,docs:{...(yt=U.parameters)==null?void 0:yt.docs,source:{originalSource:`{
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
}`,...(Ct=(bt=U.parameters)==null?void 0:bt.docs)==null?void 0:Ct.source}}};var kt,At,vt;B.parameters={...B.parameters,docs:{...(kt=B.parameters)==null?void 0:kt.docs,source:{originalSource:`{
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
}`,...(vt=(At=B.parameters)==null?void 0:At.docs)==null?void 0:vt.source}}};var wt,jt,Lt;W.parameters={...W.parameters,docs:{...(wt=W.parameters)==null?void 0:wt.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '280px'
  }}>
        <Story />
      </div>],
  render: () => <CharacterCardSkeleton />
}`,...(Lt=(jt=W.parameters)==null?void 0:jt.docs)==null?void 0:Lt.source}}};var zt,Et,St;I.parameters={...I.parameters,docs:{...(zt=I.parameters)==null?void 0:zt.docs,source:{originalSource:`{
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
}`,...(St=(Et=I.parameters)==null?void 0:Et.docs)==null?void 0:St.source}}};var Dt,Pt,Mt;_.parameters={..._.parameters,docs:{...(Dt=_.parameters)==null?void 0:Dt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }
  }
}`,...(Mt=(Pt=_.parameters)==null?void 0:Pt.docs)==null?void 0:Mt.source}}};var Nt,Tt,Rt;F.parameters={...F.parameters,docs:{...(Nt=F.parameters)==null?void 0:Nt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    }
  }
}`,...(Rt=(Tt=F.parameters)==null?void 0:Tt.docs)==null?void 0:Rt.source}}};var Ut,Bt,Wt;G.parameters={...G.parameters,docs:{...(Ut=G.parameters)==null?void 0:Ut.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234
  }
}`,...(Wt=(Bt=G.parameters)==null?void 0:Bt.docs)==null?void 0:Wt.source}}};var It,_t,Ft;H.parameters={...H.parameters,docs:{...(It=H.parameters)==null?void 0:It.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    downloadCount: 5678
  }
}`,...(Ft=(_t=H.parameters)==null?void 0:_t.docs)==null?void 0:Ft.source}}};var Gt,Ht,qt;q.parameters={...q.parameters,docs:{...(Gt=q.parameters)==null?void 0:Gt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(qt=(Ht=q.parameters)==null?void 0:Ht.docs)==null?void 0:qt.source}}};var Yt,Jt,Vt;Y.parameters={...Y.parameters,docs:{...(Yt=Y.parameters)==null?void 0:Yt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    },
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Vt=(Jt=Y.parameters)==null?void 0:Jt.docs)==null?void 0:Vt.source}}};var $t,Kt,Ot;J.parameters={...J.parameters,docs:{...($t=J.parameters)==null?void 0:$t.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 1235,
    downloadCount: 5678
  }
}`,...(Ot=(Kt=J.parameters)==null?void 0:Kt.docs)==null?void 0:Ot.source}}};var Zt,Qt,Xt;V.parameters={...V.parameters,docs:{...(Zt=V.parameters)==null?void 0:Zt.docs,source:{originalSource:`{
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
}`,...(Xt=(Qt=V.parameters)==null?void 0:Qt.docs)==null?void 0:Xt.source}}};var ea,ta,aa;$.parameters={...$.parameters,docs:{...(ea=$.parameters)==null?void 0:ea.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 123456,
    downloadCount: 9876543
  }
}`,...(aa=(ta=$.parameters)==null?void 0:ta.docs)==null?void 0:aa.source}}};var ra,sa,oa;K.parameters={...K.parameters,docs:{...(ra=K.parameters)==null?void 0:ra.docs,source:{originalSource:`{
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
}`,...(oa=(sa=K.parameters)==null?void 0:sa.docs)==null?void 0:oa.source}}};var na,ia,la;O.parameters={...O.parameters,docs:{...(na=O.parameters)==null?void 0:na.docs,source:{originalSource:`{
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
}`,...(la=(ia=O.parameters)==null?void 0:ia.docs)==null?void 0:la.source}}};var ca,da,ua;Z.parameters={...Z.parameters,docs:{...(ca=Z.parameters)==null?void 0:ca.docs,source:{originalSource:`{
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
}`,...(ua=(da=Z.parameters)==null?void 0:da.docs)==null?void 0:ua.source}}};var ma,pa,ga;Q.parameters={...Q.parameters,docs:{...(ma=Q.parameters)==null?void 0:ma.docs,source:{originalSource:`{
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
}`,...(ga=(pa=Q.parameters)==null?void 0:pa.docs)==null?void 0:ga.source}}};var ha,xa,fa;X.parameters={...X.parameters,docs:{...(ha=X.parameters)==null?void 0:ha.docs,source:{originalSource:`{
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
}`,...(fa=(xa=X.parameters)==null?void 0:xa.docs)==null?void 0:fa.source}}};var ya,ba,Ca;ee.parameters={...ee.parameters,docs:{...(ya=ee.parameters)==null?void 0:ya.docs,source:{originalSource:`{
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
}`,...(Ca=(ba=ee.parameters)==null?void 0:ba.docs)==null?void 0:Ca.source}}};var ka,Aa,va;te.parameters={...te.parameters,docs:{...(ka=te.parameters)==null?void 0:ka.docs,source:{originalSource:`{
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
}`,...(va=(Aa=te.parameters)==null?void 0:Aa.docs)==null?void 0:va.source}}};var wa,ja,La;ae.parameters={...ae.parameters,docs:{...(wa=ae.parameters)==null?void 0:wa.docs,source:{originalSource:`{
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
}`,...(La=(ja=ae.parameters)==null?void 0:ja.docs)==null?void 0:La.source}}};const xr=["Default","WithBadges","WithMultipleBadges","WithAllBadgeVariants","WithBadgesLeftAndRight","WithMultipleBadgesEachSide","WithoutImage","WithPlaceholder","ImageError","ManyTags","NoTags","LongName","Disabled","WithActions","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid","WithLikeButton","WithLikeButtonLiked","WithLikeCount","WithDownloadCount","WithPopularityStats","WithLikeButtonAndStats","WithLikeButtonLikedAndStats","WithLikeButtonAndActions","HighPopularityCounts","FullFeatured","WithFooterActions","WithFooterActionsSelectedPlayer","WithFooterActionsSelectedAI","WithFooterActionsCompact","GridLayoutWithFooterActions","GridLayoutWithPopularity","LikeButtonHidesRightBadge"];export{B as AllStates,T as CustomMetadata,t as Default,P as Disabled,K as FullFeatured,U as FullyCustomMetadata,N as GridLayout,ee as GridLayoutWithFooterActions,te as GridLayoutWithPopularity,$ as HighPopularityCounts,z as ImageError,ae as LikeButtonHidesRightBadge,D as LongName,E as ManyTags,R as MetadataWithIcons,S as NoTags,W as Skeleton,I as SkeletonGrid,M as WithActions,A as WithAllBadgeVariants,C as WithBadges,v as WithBadgesLeftAndRight,H as WithDownloadCount,O as WithFooterActions,X as WithFooterActionsCompact,Q as WithFooterActionsSelectedAI,Z as WithFooterActionsSelectedPlayer,_ as WithLikeButton,V as WithLikeButtonAndActions,Y as WithLikeButtonAndStats,F as WithLikeButtonLiked,J as WithLikeButtonLikedAndStats,G as WithLikeCount,k as WithMultipleBadges,w as WithMultipleBadgesEachSide,L as WithPlaceholder,q as WithPopularityStats,j as WithoutImage,xr as __namedExportsOrder,hr as default};
