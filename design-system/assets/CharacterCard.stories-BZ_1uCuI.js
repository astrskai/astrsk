import{r as ye,j as e}from"./iframe-DnVlusoH.js";import{c,f as Ka}from"./utils-CF6QUdYH.js";import{u as Oa,B as La,C as Za,a as Qa,b as be,c as Xa,d as za,e as oe,S as ie,f as Ea,D as Sa,T as Da,L as i,g as er}from"./useImageRenderer-D2k2AGtj.js";import{S as o}from"./Skeleton-IXr2085K.js";import{L as p}from"./lock-Cbx0FWCW.js";import{U as Pa}from"./user-BUWzg_yR.js";import{c as le}from"./createLucideIcon-BU1d_TG2.js";import{M as tr}from"./message-square-BuCdiamH.js";import"./preload-helper-CwRszBsw.js";/**
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
 */const or=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],u=le("plus",or),Ma=za,ne=oe;function s({name:a,imageUrl:re,summary:ce,tags:x,maxVisibleTags:f=3,tokenCount:Ta=0,updatedAt:de,className:Ra,actions:Ua=[],isDisabled:Ba=!1,onClick:Wa,badges:y=[],placeholderImageUrl:se,renderMetadata:ue,emptySummaryText:me="No summary",likeButton:b,likeCount:pe,downloadCount:ge,imageSizes:Ia,loading:_a="lazy",priority:Fa=!1,footerActions:he,renderImage:Ga,classNames:r}){const[Ha,xe]=ye.useState(!1),qa=Oa({renderImage:Ga});ye.useEffect(()=>{xe(!1)},[re,se]);const fe=(re||se)&&!Ha,Ya=!fe,Ja=()=>{const n=re||se;return n?qa({src:n,alt:a,className:"absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",sizes:Ia,loading:_a,onError:()=>xe(!0),fill:!0,priority:Fa}):null};return e.jsxs(La,{className:c("min-h-[380px]",Ra),isDisabled:Ba,onClick:Wa,children:[e.jsxs("div",{className:"relative h-64 overflow-hidden bg-zinc-800",children:[fe&&Ja(),Ya&&e.jsx("div",{className:"absolute inset-0 flex items-center justify-center",children:e.jsx("span",{className:"text-6xl font-bold text-zinc-500",children:a.charAt(0).toUpperCase()||"?"})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"}),b&&e.jsx("div",{className:"absolute top-2 right-2 z-20",children:e.jsx(Za,{...b})}),e.jsx(Qa,{actions:Ua,className:b?"top-12":void 0}),y.some(n=>(n.position??"left")==="left")&&e.jsx("div",{className:"absolute top-3 left-3 z-10 max-w-[45%]",children:e.jsx(be,{badges:y,position:"left"})}),!b&&y.some(n=>n.position==="right")&&e.jsx("div",{className:"absolute top-3 right-3 z-10 max-w-[45%]",children:e.jsx(be,{badges:y,position:"right"})})]}),e.jsxs("div",{className:"relative z-10 -mt-12 flex flex-grow flex-col p-4",children:[e.jsx("h3",{className:c("mb-1 line-clamp-2 text-lg md:text-xl font-bold break-words text-white drop-shadow-md",r==null?void 0:r.name),children:a}),e.jsx("div",{className:c("mb-2 md:mb-4 flex flex-wrap gap-2",r==null?void 0:r.tagsContainer),children:x.length>0?e.jsxs(e.Fragment,{children:[x.slice(0,f).map((n,Va)=>{const $a=Math.floor(85/(f+1));return e.jsx("span",{className:c("truncate rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",r==null?void 0:r.tag),style:{maxWidth:`${$a}%`},children:n},`${n}-${Va}`)}),x.length>f&&e.jsxs("span",{className:c("shrink-0 rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",r==null?void 0:r.tag),children:["+",x.length-f]})]}):e.jsx("span",{className:"text-[10px] text-zinc-400",children:"No tags"})}),(ce||me)&&e.jsx("p",{className:c("mb-2 md:mb-4 line-clamp-2 flex-grow text-xs leading-relaxed break-all text-ellipsis text-zinc-400",r==null?void 0:r.summary),children:ce||me}),(pe!==void 0||ge!==void 0)&&e.jsx(Xa,{likeCount:pe,downloadCount:ge,className:"mb-2"}),ue?ue():e.jsxs(za,{children:[e.jsxs(oe,{children:[Ka(Ta)," Tokens"]}),de&&e.jsx(oe,{children:de})]})]}),he&&e.jsx("div",{className:"mt-auto flex border-t border-zinc-800",children:he})]})}s.__docgenInfo={description:"",methods:[],displayName:"CharacterCard",props:{name:{required:!0,tsType:{name:"string"},description:"Character name"},imageUrl:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Character image URL"},summary:{required:!1,tsType:{name:"string"},description:"Character summary/description"},tags:{required:!0,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"Character tags"},maxVisibleTags:{required:!1,tsType:{name:"number"},description:`Maximum number of tags to display before showing "+n" indicator.
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
\`\`\``}}};function m({className:a}){return e.jsxs(La,{className:c("min-h-[380px]",a),isDisabled:!0,children:[e.jsx("div",{className:"relative h-64 overflow-hidden bg-zinc-800",children:e.jsx(o,{className:"absolute inset-0 h-full w-full",variant:"default"})}),e.jsxs("div",{className:"relative z-10 -mt-12 flex flex-grow flex-col p-4",children:[e.jsx(o,{className:"mb-1 h-6 w-3/4"}),e.jsxs("div",{className:"mb-4 flex flex-wrap gap-2",children:[e.jsx(o,{className:"h-5 w-12"}),e.jsx(o,{className:"h-5 w-16"}),e.jsx(o,{className:"h-5 w-10"})]}),e.jsxs("div",{className:"mb-4 flex-grow space-y-2",children:[e.jsx(o,{className:"h-3 w-full"}),e.jsx(o,{className:"h-3 w-full"}),e.jsx(o,{className:"h-3 w-2/3"})]}),e.jsxs("div",{className:"flex items-center gap-2 border-t border-zinc-800 pt-3",children:[e.jsx(o,{className:"h-3 w-16"}),e.jsx(o,{className:"h-3 w-20"})]})]})]})}m.displayName="CharacterCardSkeleton";m.__docgenInfo={description:`CharacterCardSkeleton Component

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
\`\`\``,methods:[],displayName:"CharacterCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};const hr={title:"Content/CharacterCard",component:s,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{name:{control:"text",description:"Character name"},imageUrl:{control:"text",description:"Character image URL"},summary:{control:"text",description:"Character summary/description"},tags:{control:"object",description:"Character tags array"},tokenCount:{control:"number",description:"Token count for the character"},updatedAt:{control:"text",description:"Last updated timestamp"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},badges:{control:"object",description:"Badges to display on the card"},placeholderImageUrl:{control:"text",description:"Placeholder image URL when imageUrl is not provided",table:{defaultValue:{summary:"img/placeholder/character-placeholder.png"}}},onClick:{action:"clicked"}},decorators:[a=>e.jsx("div",{style:{width:"280px"},children:e.jsx(a,{})})]},l="https://picsum.photos/seed/character1/400/600",g="https://picsum.photos/seed/character2/400/600",h="https://picsum.photos/seed/character3/400/600",Na="/astrsk/design-system/img/placeholder/character-placeholder.png",t={args:{name:"Alice Wonderland",imageUrl:l,summary:"A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.",tags:["Fantasy","Adventure","Classic"],tokenCount:1523,updatedAt:"2 days ago",placeholderImageUrl:Na}},C={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})}]}},k={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})},{label:"Private",variant:"private",icon:e.jsx(p,{size:12})}]}},A={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})},{label:"Private",variant:"private",icon:e.jsx(p,{size:12})},{label:"Mine",variant:"owner",icon:e.jsx(Pa,{size:12})}]}},v={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(p,{size:12}),position:"right"}]}},w={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(Pa,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(p,{size:12}),position:"right"}]}},j={args:{name:"Mystery Character",summary:"A mysterious character with no image yet.",tags:["Unknown"],tokenCount:500,updatedAt:"Just now"}},L={args:{name:"Placeholder Character",summary:"A character using a placeholder image.",tags:["New"],tokenCount:0,updatedAt:"Just now",placeholderImageUrl:Na}},z={args:{name:"Alice Wonderland",imageUrl:"https://invalid-url-that-will-404.com/image.png",summary:"This character has an invalid image URL, showing the initial fallback.",tags:["Error","Fallback"],tokenCount:1e3,updatedAt:"Just now"}},E={args:{name:"Multi-Tagged Character",imageUrl:g,summary:"This character has many different tags to demonstrate overflow.",tags:["Fantasy","Romance","Drama","Action","Comedy","Slice of Life"],tokenCount:2500,updatedAt:"1 week ago"}},S={args:{name:"Tagless Character",imageUrl:h,summary:"A character without any tags.",tags:[],tokenCount:800,updatedAt:"3 hours ago"}},D={args:{name:"The Exceptionally Long Named Character of the Eastern Kingdoms",imageUrl:l,summary:"A character with a very long name that should be truncated.",tags:["Epic","Fantasy"],tokenCount:3e3,updatedAt:"1 month ago"}},P={args:{...t.args,isDisabled:!0}},M={args:{...t.args,actions:[{icon:ie,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:Ea,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate character"},{icon:Sa,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export character"},{icon:Da,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete character",className:"hover:text-red-400"}]}},N={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(s,{name:"Alice Wonderland",imageUrl:l,summary:"A curious young girl who falls down a rabbit hole into a fantasy world.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago"}),e.jsx(s,{name:"Bob the Builder",imageUrl:g,summary:"Can we fix it? Yes we can! A cheerful constructor who solves problems.",tags:["Kids","Comedy"],tokenCount:890,updatedAt:"1 week ago",badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})}]}),e.jsx(s,{name:"Charlie Detective",imageUrl:h,summary:"A sharp-minded detective solving mysteries in the foggy streets of London.",tags:["Mystery","Thriller","Drama"],tokenCount:2100,updatedAt:"Just now"})]})},T={args:{name:"Popular Character",imageUrl:l,summary:"A character with custom metadata using renderMetadata prop.",tags:["Popular","Trending"],renderMetadata:()=>e.jsxs(Ma,{children:[e.jsx(ne,{icon:e.jsx(rr,{className:"size-3"}),children:"2.5k likes"}),e.jsx(ne,{icon:e.jsx(tr,{className:"size-3"}),children:"128 chats"})]})}},R={args:{name:"Active Character",imageUrl:g,summary:"Demonstrating metadata items with icons for better visual clarity.",tags:["Active"],renderMetadata:()=>e.jsx(Ma,{children:e.jsx(ne,{icon:e.jsx(er,{className:"size-3"}),children:"Last active: 2h ago"})})}},U={args:{name:"Custom Layout Character",imageUrl:h,summary:"When you need complete control over metadata layout.",tags:["Custom"],renderMetadata:()=>e.jsxs("div",{className:"mt-auto grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"1.2k"}),e.jsx("div",{children:"Likes"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"89"}),e.jsx("div",{children:"Chats"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"4.8"}),e.jsx("div",{children:"Rating"})]})]})}},B={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(s,{name:"Default Character",imageUrl:l,summary:"A standard character card with all typical fields.",tags:["Tag1","Tag2"],tokenCount:1e3,updatedAt:"1 day ago"})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(s,{name:"Character with Badge",imageUrl:g,summary:"Shows the CHARACTER type badge.",tags:["Fantasy"],tokenCount:500,updatedAt:"5 hours ago",badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Disabled"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(s,{name:"Disabled Character",imageUrl:h,summary:"This card is disabled and cannot be interacted with.",tags:["Locked"],tokenCount:0,isDisabled:!0})})]})]})},W={args:{...t.args},decorators:[a=>e.jsx("div",{style:{width:"280px"},children:e.jsx(a,{})})],render:()=>e.jsx(m,{})},I={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(m,{}),e.jsx(m,{}),e.jsx(m,{})]})},_={args:{...t.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}}},F={args:{...t.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")}}},G={args:{...t.args,likeCount:1234}},H={args:{...t.args,downloadCount:5678}},q={args:{...t.args,likeCount:1234,downloadCount:5678}},Y={args:{...t.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:1234,downloadCount:5678}},J={args:{...t.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:1235,downloadCount:5678}},V={args:{...t.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:2500,downloadCount:12e3,actions:[{icon:ie,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:Ea,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate character"},{icon:Da,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete character",className:"hover:text-red-400"}]}},$={args:{...t.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:123456,downloadCount:9876543}},K={args:{name:"Alice Wonderland",imageUrl:l,summary:"A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.",tags:["Fantasy","Adventure","Classic"],tokenCount:1523,updatedAt:"2 days ago",badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12})},{label:"Private",variant:"private",icon:e.jsx(p,{size:12})}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:2847,downloadCount:15230,actions:[{icon:ie,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:Sa,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export character"}]}},O={args:{...t.args,footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 transition-all hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800",onClick:()=>console.log("Play clicked"),children:[e.jsx(d,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 transition-all hover:bg-amber-600/10 hover:text-amber-300",onClick:()=>console.log("Add clicked"),children:[e.jsx(u,{size:14})," ADD"]})]})}},Z={args:{...t.args,badges:[{label:"PLAYER",variant:"default",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(d,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(u,{size:14})," ADD"]})]})}},Q={args:{...t.args,badges:[{label:"AI",variant:"private",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(d,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(u,{size:14})," ADD"]})]})}},X={args:{name:"Mobile Character",imageUrl:l,summary:"A character card with compact footer for mobile view.",tags:["Mobile"],tokenCount:500,emptySummaryText:"",className:"min-h-0",footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold text-zinc-400 transition-all hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800",onClick:()=>console.log("Play clicked"),children:[e.jsx(d,{size:12})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold text-zinc-400 transition-all hover:bg-amber-600/10 hover:text-amber-300",onClick:()=>console.log("Add clicked"),children:[e.jsx(u,{size:12})," ADD"]})]})},decorators:[a=>e.jsx("div",{style:{width:"160px"},children:e.jsx(a,{})})]},ee={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(s,{name:"Alice Wonderland",imageUrl:l,summary:"A curious young girl who falls down a rabbit hole.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago",footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800",children:[e.jsx(d,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-amber-600/10 hover:text-amber-300",children:[e.jsx(u,{size:14})," ADD"]})]})}),e.jsx(s,{name:"Bob the Builder",imageUrl:g,summary:"Can we fix it? Yes we can!",tags:["Kids","Comedy"],tokenCount:890,updatedAt:"1 week ago",badges:[{label:"PLAYER",variant:"default",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(d,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(u,{size:14})," ADD"]})]})}),e.jsx(s,{name:"Charlie Detective",imageUrl:h,summary:"A sharp-minded detective solving mysteries.",tags:["Mystery","Thriller"],tokenCount:2100,updatedAt:"Just now",badges:[{label:"AI",variant:"private",position:"right"}],footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800",disabled:!0,children:[e.jsx(d,{size:14})," PLAY"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed",disabled:!0,children:[e.jsx(u,{size:14})," ADD"]})]})})]})},te={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(s,{name:"Popular Character",imageUrl:l,summary:"A highly popular character loved by many users.",tags:["Popular","Trending"],tokenCount:1523,updatedAt:"2 days ago",likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:12500,downloadCount:45e3}),e.jsx(s,{name:"New Character",imageUrl:g,summary:"A fresh new character just added to the platform.",tags:["New","Fresh"],tokenCount:890,updatedAt:"1 hour ago",likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:42,downloadCount:128}),e.jsx(s,{name:"Classic Character",imageUrl:h,summary:"A timeless classic that has stood the test of time.",tags:["Classic","Evergreen"],tokenCount:2100,updatedAt:"1 year ago",likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:98765,downloadCount:543210})]})},ae={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(i,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(p,{size:12}),position:"right"}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}},parameters:{docs:{description:{story:"When `likeButton` is provided, right-positioned badges are automatically hidden to prevent visual overlap. Use left-positioned badges instead when using likeButton."}}}};var Ce,ke,Ae;t.parameters={...t.parameters,docs:{...(Ce=t.parameters)==null?void 0:Ce.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.',
    tags: ['Fantasy', 'Adventure', 'Classic'],
    tokenCount: 1523,
    updatedAt: '2 days ago',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(Ae=(ke=t.parameters)==null?void 0:ke.docs)==null?void 0:Ae.source}}};var ve,we,je;C.parameters={...C.parameters,docs:{...(ve=C.parameters)==null?void 0:ve.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'CHARACTER',
      icon: <Layers size={12} />
    }]
  }
}`,...(je=(we=C.parameters)==null?void 0:we.docs)==null?void 0:je.source}}};var Le,ze,Ee;k.parameters={...k.parameters,docs:{...(Le=k.parameters)==null?void 0:Le.docs,source:{originalSource:`{
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
}`,...(Ee=(ze=k.parameters)==null?void 0:ze.docs)==null?void 0:Ee.source}}};var Se,De,Pe;A.parameters={...A.parameters,docs:{...(Se=A.parameters)==null?void 0:Se.docs,source:{originalSource:`{
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
}`,...(Pe=(De=A.parameters)==null?void 0:De.docs)==null?void 0:Pe.source}}};var Me,Ne,Te;v.parameters={...v.parameters,docs:{...(Me=v.parameters)==null?void 0:Me.docs,source:{originalSource:`{
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
}`,...(Te=(Ne=v.parameters)==null?void 0:Ne.docs)==null?void 0:Te.source}}};var Re,Ue,Be;w.parameters={...w.parameters,docs:{...(Re=w.parameters)==null?void 0:Re.docs,source:{originalSource:`{
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
}`,...(Be=(Ue=w.parameters)==null?void 0:Ue.docs)==null?void 0:Be.source}}};var We,Ie,_e;j.parameters={...j.parameters,docs:{...(We=j.parameters)==null?void 0:We.docs,source:{originalSource:`{
  args: {
    name: 'Mystery Character',
    summary: 'A mysterious character with no image yet.',
    tags: ['Unknown'],
    tokenCount: 500,
    updatedAt: 'Just now'
  }
}`,...(_e=(Ie=j.parameters)==null?void 0:Ie.docs)==null?void 0:_e.source}}};var Fe,Ge,He;L.parameters={...L.parameters,docs:{...(Fe=L.parameters)==null?void 0:Fe.docs,source:{originalSource:`{
  args: {
    name: 'Placeholder Character',
    summary: 'A character using a placeholder image.',
    tags: ['New'],
    tokenCount: 0,
    updatedAt: 'Just now',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(He=(Ge=L.parameters)==null?void 0:Ge.docs)==null?void 0:He.source}}};var qe,Ye,Je;z.parameters={...z.parameters,docs:{...(qe=z.parameters)==null?void 0:qe.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: 'https://invalid-url-that-will-404.com/image.png',
    summary: 'This character has an invalid image URL, showing the initial fallback.',
    tags: ['Error', 'Fallback'],
    tokenCount: 1000,
    updatedAt: 'Just now'
  }
}`,...(Je=(Ye=z.parameters)==null?void 0:Ye.docs)==null?void 0:Je.source}}};var Ve,$e,Ke;E.parameters={...E.parameters,docs:{...(Ve=E.parameters)==null?void 0:Ve.docs,source:{originalSource:`{
  args: {
    name: 'Multi-Tagged Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'This character has many different tags to demonstrate overflow.',
    tags: ['Fantasy', 'Romance', 'Drama', 'Action', 'Comedy', 'Slice of Life'],
    tokenCount: 2500,
    updatedAt: '1 week ago'
  }
}`,...(Ke=($e=E.parameters)==null?void 0:$e.docs)==null?void 0:Ke.source}}};var Oe,Ze,Qe;S.parameters={...S.parameters,docs:{...(Oe=S.parameters)==null?void 0:Oe.docs,source:{originalSource:`{
  args: {
    name: 'Tagless Character',
    imageUrl: SAMPLE_IMAGE_3,
    summary: 'A character without any tags.',
    tags: [],
    tokenCount: 800,
    updatedAt: '3 hours ago'
  }
}`,...(Qe=(Ze=S.parameters)==null?void 0:Ze.docs)==null?void 0:Qe.source}}};var Xe,et,tt;D.parameters={...D.parameters,docs:{...(Xe=D.parameters)==null?void 0:Xe.docs,source:{originalSource:`{
  args: {
    name: 'The Exceptionally Long Named Character of the Eastern Kingdoms',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A character with a very long name that should be truncated.',
    tags: ['Epic', 'Fantasy'],
    tokenCount: 3000,
    updatedAt: '1 month ago'
  }
}`,...(tt=(et=D.parameters)==null?void 0:et.docs)==null?void 0:tt.source}}};var at,rt,st;P.parameters={...P.parameters,docs:{...(at=P.parameters)==null?void 0:at.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(st=(rt=P.parameters)==null?void 0:rt.docs)==null?void 0:st.source}}};var ot,nt,it;M.parameters={...M.parameters,docs:{...(ot=M.parameters)==null?void 0:ot.docs,source:{originalSource:`{
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
}`,...(it=(nt=M.parameters)==null?void 0:nt.docs)==null?void 0:it.source}}};var lt,ct,dt;N.parameters={...N.parameters,docs:{...(lt=N.parameters)==null?void 0:lt.docs,source:{originalSource:`{
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
}`,...(dt=(ct=N.parameters)==null?void 0:ct.docs)==null?void 0:dt.source}}};var ut,mt,pt;T.parameters={...T.parameters,docs:{...(ut=T.parameters)==null?void 0:ut.docs,source:{originalSource:`{
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
}`,...(pt=(mt=T.parameters)==null?void 0:mt.docs)==null?void 0:pt.source}}};var gt,ht,xt;R.parameters={...R.parameters,docs:{...(gt=R.parameters)==null?void 0:gt.docs,source:{originalSource:`{
  args: {
    name: 'Active Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'Demonstrating metadata items with icons for better visual clarity.',
    tags: ['Active'],
    renderMetadata: () => <MetadataContainer>
        <MetadataItem icon={<Clock className="size-3" />}>Last active: 2h ago</MetadataItem>
      </MetadataContainer>
  }
}`,...(xt=(ht=R.parameters)==null?void 0:ht.docs)==null?void 0:xt.source}}};var ft,yt,bt;U.parameters={...U.parameters,docs:{...(ft=U.parameters)==null?void 0:ft.docs,source:{originalSource:`{
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
}`,...(bt=(yt=U.parameters)==null?void 0:yt.docs)==null?void 0:bt.source}}};var Ct,kt,At;B.parameters={...B.parameters,docs:{...(Ct=B.parameters)==null?void 0:Ct.docs,source:{originalSource:`{
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
}`,...(At=(kt=B.parameters)==null?void 0:kt.docs)==null?void 0:At.source}}};var vt,wt,jt;W.parameters={...W.parameters,docs:{...(vt=W.parameters)==null?void 0:vt.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '280px'
  }}>
        <Story />
      </div>],
  render: () => <CharacterCardSkeleton />
}`,...(jt=(wt=W.parameters)==null?void 0:wt.docs)==null?void 0:jt.source}}};var Lt,zt,Et;I.parameters={...I.parameters,docs:{...(Lt=I.parameters)==null?void 0:Lt.docs,source:{originalSource:`{
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
}`,...(Et=(zt=I.parameters)==null?void 0:zt.docs)==null?void 0:Et.source}}};var St,Dt,Pt;_.parameters={..._.parameters,docs:{...(St=_.parameters)==null?void 0:St.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }
  }
}`,...(Pt=(Dt=_.parameters)==null?void 0:Dt.docs)==null?void 0:Pt.source}}};var Mt,Nt,Tt;F.parameters={...F.parameters,docs:{...(Mt=F.parameters)==null?void 0:Mt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    }
  }
}`,...(Tt=(Nt=F.parameters)==null?void 0:Nt.docs)==null?void 0:Tt.source}}};var Rt,Ut,Bt;G.parameters={...G.parameters,docs:{...(Rt=G.parameters)==null?void 0:Rt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234
  }
}`,...(Bt=(Ut=G.parameters)==null?void 0:Ut.docs)==null?void 0:Bt.source}}};var Wt,It,_t;H.parameters={...H.parameters,docs:{...(Wt=H.parameters)==null?void 0:Wt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    downloadCount: 5678
  }
}`,...(_t=(It=H.parameters)==null?void 0:It.docs)==null?void 0:_t.source}}};var Ft,Gt,Ht;q.parameters={...q.parameters,docs:{...(Ft=q.parameters)==null?void 0:Ft.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Ht=(Gt=q.parameters)==null?void 0:Gt.docs)==null?void 0:Ht.source}}};var qt,Yt,Jt;Y.parameters={...Y.parameters,docs:{...(qt=Y.parameters)==null?void 0:qt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    },
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Jt=(Yt=Y.parameters)==null?void 0:Yt.docs)==null?void 0:Jt.source}}};var Vt,$t,Kt;J.parameters={...J.parameters,docs:{...(Vt=J.parameters)==null?void 0:Vt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 1235,
    downloadCount: 5678
  }
}`,...(Kt=($t=J.parameters)==null?void 0:$t.docs)==null?void 0:Kt.source}}};var Ot,Zt,Qt;V.parameters={...V.parameters,docs:{...(Ot=V.parameters)==null?void 0:Ot.docs,source:{originalSource:`{
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
}`,...(Qt=(Zt=V.parameters)==null?void 0:Zt.docs)==null?void 0:Qt.source}}};var Xt,ea,ta;$.parameters={...$.parameters,docs:{...(Xt=$.parameters)==null?void 0:Xt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 123456,
    downloadCount: 9876543
  }
}`,...(ta=(ea=$.parameters)==null?void 0:ea.docs)==null?void 0:ta.source}}};var aa,ra,sa;K.parameters={...K.parameters,docs:{...(aa=K.parameters)==null?void 0:aa.docs,source:{originalSource:`{
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
}`,...(sa=(ra=K.parameters)==null?void 0:ra.docs)==null?void 0:sa.source}}};var oa,na,ia;O.parameters={...O.parameters,docs:{...(oa=O.parameters)==null?void 0:oa.docs,source:{originalSource:`{
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
}`,...(ia=(na=O.parameters)==null?void 0:na.docs)==null?void 0:ia.source}}};var la,ca,da;Z.parameters={...Z.parameters,docs:{...(la=Z.parameters)==null?void 0:la.docs,source:{originalSource:`{
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
}`,...(da=(ca=Z.parameters)==null?void 0:ca.docs)==null?void 0:da.source}}};var ua,ma,pa;Q.parameters={...Q.parameters,docs:{...(ua=Q.parameters)==null?void 0:ua.docs,source:{originalSource:`{
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
}`,...(pa=(ma=Q.parameters)==null?void 0:ma.docs)==null?void 0:pa.source}}};var ga,ha,xa;X.parameters={...X.parameters,docs:{...(ga=X.parameters)==null?void 0:ga.docs,source:{originalSource:`{
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
}`,...(xa=(ha=X.parameters)==null?void 0:ha.docs)==null?void 0:xa.source}}};var fa,ya,ba;ee.parameters={...ee.parameters,docs:{...(fa=ee.parameters)==null?void 0:fa.docs,source:{originalSource:`{
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
}`,...(ba=(ya=ee.parameters)==null?void 0:ya.docs)==null?void 0:ba.source}}};var Ca,ka,Aa;te.parameters={...te.parameters,docs:{...(Ca=te.parameters)==null?void 0:Ca.docs,source:{originalSource:`{
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
}`,...(Aa=(ka=te.parameters)==null?void 0:ka.docs)==null?void 0:Aa.source}}};var va,wa,ja;ae.parameters={...ae.parameters,docs:{...(va=ae.parameters)==null?void 0:va.docs,source:{originalSource:`{
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
}`,...(ja=(wa=ae.parameters)==null?void 0:wa.docs)==null?void 0:ja.source}}};const xr=["Default","WithBadges","WithMultipleBadges","WithAllBadgeVariants","WithBadgesLeftAndRight","WithMultipleBadgesEachSide","WithoutImage","WithPlaceholder","ImageError","ManyTags","NoTags","LongName","Disabled","WithActions","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid","WithLikeButton","WithLikeButtonLiked","WithLikeCount","WithDownloadCount","WithPopularityStats","WithLikeButtonAndStats","WithLikeButtonLikedAndStats","WithLikeButtonAndActions","HighPopularityCounts","FullFeatured","WithFooterActions","WithFooterActionsSelectedPlayer","WithFooterActionsSelectedAI","WithFooterActionsCompact","GridLayoutWithFooterActions","GridLayoutWithPopularity","LikeButtonHidesRightBadge"];export{B as AllStates,T as CustomMetadata,t as Default,P as Disabled,K as FullFeatured,U as FullyCustomMetadata,N as GridLayout,ee as GridLayoutWithFooterActions,te as GridLayoutWithPopularity,$ as HighPopularityCounts,z as ImageError,ae as LikeButtonHidesRightBadge,D as LongName,E as ManyTags,R as MetadataWithIcons,S as NoTags,W as Skeleton,I as SkeletonGrid,M as WithActions,A as WithAllBadgeVariants,C as WithBadges,v as WithBadgesLeftAndRight,H as WithDownloadCount,O as WithFooterActions,X as WithFooterActionsCompact,Q as WithFooterActionsSelectedAI,Z as WithFooterActionsSelectedPlayer,_ as WithLikeButton,V as WithLikeButtonAndActions,Y as WithLikeButtonAndStats,F as WithLikeButtonLiked,J as WithLikeButtonLikedAndStats,G as WithLikeCount,k as WithMultipleBadges,w as WithMultipleBadgesEachSide,L as WithPlaceholder,q as WithPopularityStats,j as WithoutImage,xr as __namedExportsOrder,hr as default};
