import{r as he,j as e}from"./iframe-B7sIs6_0.js";import{c as g}from"./utils-CF6QUdYH.js";import{u as ft,B as nt,C as At,a as Ct,b as Ue,c as kt,d as bt,e as yt,S as Ce,f as it,D as ot,T as lt,L as r,g as ct}from"./useImageRenderer-BBiAO4Os.js";import{S as m}from"./Skeleton-QjbliPQf.js";import{L as l}from"./lock-CEr9HHCn.js";import{U as v}from"./user-GNr-mCYg.js";import{S as xe,U as jt}from"./users-CunXcjIJ.js";import"./preload-helper-CwRszBsw.js";import"./createLucideIcon-DJFYYEIn.js";function Lt({name:s,avatarUrl:c,loading:p="lazy"}){const[Se,f]=he.useState(!1);he.useEffect(()=>{f(!1)},[c]);const A=c&&!Se;return e.jsx("div",{className:"flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-900 bg-zinc-700",title:s,children:A?e.jsx("img",{src:c,alt:s,className:"h-full w-full object-cover",loading:p,onError:()=>f(!0)}):e.jsx("span",{className:"text-[10px] text-zinc-400",children:s.charAt(0).toUpperCase()||"?"})})}function Ae(){return e.jsx("div",{className:"h-8 w-8 animate-pulse rounded-full border-2 border-zinc-900 bg-zinc-700"})}function Et({className:s}){return e.jsx("svg",{className:s,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})})}const dt=bt,ve=yt;function o({title:s,imageUrl:c,messageCount:p,actions:Se=[],className:f,isDisabled:A=!1,onClick:ke,characterAvatars:C=[],areCharactersLoading:be=!1,badges:k=[],renderMetadata:ye,tags:b=[],summary:je,likeButton:y,likeCount:Le,downloadCount:Ee,imageSizes:ut,loading:gt="lazy",priority:we=!1,renderImage:pt,classNames:t}){const[ze,Me]=he.useState(!1),ht=ft({renderImage:pt});he.useEffect(()=>{Me(!1)},[c]);const vt=c&&!ze,xt=c&&ze,St=()=>c?ht({src:c,alt:s,className:"absolute inset-0 h-full w-full object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90",sizes:ut,loading:we?void 0:gt,onError:()=>Me(!0),fill:!0,priority:we}):null;return e.jsxs(nt,{className:g("min-h-[320px] w-full border-zinc-800 ring-1 ring-zinc-800/50",!A&&ke&&"hover:ring-zinc-700",f),isDisabled:A,onClick:ke,children:[e.jsxs("div",{className:"relative h-48 overflow-hidden bg-zinc-800",children:[vt?e.jsxs(e.Fragment,{children:[St(),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"})]}):xt?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"absolute inset-0 flex items-center justify-center",children:e.jsx("span",{className:"text-6xl font-bold text-zinc-500",children:s.charAt(0).toUpperCase()||"?"})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"absolute inset-0 bg-zinc-800",children:e.jsx("div",{className:"absolute inset-0 opacity-20",style:{backgroundImage:"radial-gradient(#4f46e5 1px, transparent 1px)",backgroundSize:"16px 16px"}})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"})]}),y&&e.jsx("div",{className:"absolute top-2 right-2 z-20",children:e.jsx(At,{...y})}),e.jsx(Ct,{actions:Se,className:y?"top-12":void 0}),k.some(n=>(n.position??"left")==="left")&&e.jsx("div",{className:"absolute top-3 left-3 z-10 max-w-[45%]",children:e.jsx(Ue,{badges:k,position:"left"})}),!y&&k.some(n=>n.position==="right")&&e.jsx("div",{className:"absolute top-3 right-3 z-10 max-w-[45%]",children:e.jsx(Ue,{badges:k,position:"right"})}),e.jsx("div",{className:"absolute bottom-0 left-0 w-full p-5",children:e.jsx("h2",{className:g("line-clamp-2 text-xl md:text-2xl leading-tight font-bold text-ellipsis text-white",t==null?void 0:t.title),children:s})})]}),e.jsx("div",{className:"flex flex-grow flex-col justify-between p-5",children:e.jsxs("div",{className:"space-y-2 md:space-y-3",children:[b.length>0&&e.jsxs("div",{className:g("flex flex-wrap gap-2",t==null?void 0:t.tagsContainer),children:[b.slice(0,3).map((n,fe)=>e.jsx("span",{className:g("rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",t==null?void 0:t.tag),children:n},`${n}-${fe}`)),b.length>3&&e.jsxs("span",{className:g("rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",t==null?void 0:t.tag),children:["+",b.length-3]})]}),je&&e.jsx("p",{className:g("line-clamp-2 text-xs leading-relaxed break-all text-ellipsis text-zinc-400",t==null?void 0:t.summary),children:je}),(Le!==void 0||Ee!==void 0)&&e.jsx(kt,{likeCount:Le,downloadCount:Ee}),ye?ye():p!==void 0&&e.jsx("div",{className:"flex items-center justify-between text-sm",children:p===0?e.jsx("span",{className:"text-zinc-400",children:"New session"}):e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Et,{className:"h-4 w-4 text-zinc-400"}),e.jsx("span",{className:"font-semibold text-zinc-300",children:p.toLocaleString()}),e.jsx("span",{className:"text-zinc-400",children:p===1?"Message":"Messages"})]})}),(be||C.length>0)&&e.jsx("div",{className:"border-t border-zinc-800 pt-3",children:be?e.jsxs("div",{className:"flex -space-x-2",children:[e.jsx(Ae,{}),e.jsx(Ae,{}),e.jsx(Ae,{})]}):e.jsxs("div",{className:"flex -space-x-2",children:[C.slice(0,3).map((n,fe)=>e.jsx(Lt,{name:n.name,avatarUrl:n.avatarUrl,loading:n.loading??"lazy"},`${n.name}-${fe}`)),C.length>3&&e.jsxs("div",{className:"flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 text-[10px] text-zinc-400",children:["+",C.length-3]})]})})]})})]})}o.__docgenInfo={description:"",methods:[],displayName:"SessionCard",props:{title:{required:!0,tsType:{name:"string"},description:"Session title"},imageUrl:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Cover image URL"},messageCount:{required:!1,tsType:{name:"number"},description:"Number of messages in the session (used in default metadata)"},actions:{required:!1,tsType:{name:"Array",elements:[{name:"CardAction"}],raw:"CardAction[]"},description:"Action buttons displayed on the card",defaultValue:{value:"[]",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"},isDisabled:{required:!1,tsType:{name:"boolean"},description:"Whether the card is disabled",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Click handler for the card"},characterAvatars:{required:!1,tsType:{name:"Array",elements:[{name:"CharacterAvatar"}],raw:"CharacterAvatar[]"},description:"Character avatars to display",defaultValue:{value:"[]",computed:!1}},areCharactersLoading:{required:!1,tsType:{name:"boolean"},description:"Whether characters are loading",defaultValue:{value:"false",computed:!1}},badges:{required:!1,tsType:{name:"Array",elements:[{name:"CardBadge"}],raw:"CardBadge[]"},description:"Badges to display on the card (e.g., type indicator, private, owner).",defaultValue:{value:"[]",computed:!1}},renderMetadata:{required:!1,tsType:{name:"signature",type:"function",raw:"() => React.ReactNode",signature:{arguments:[],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:`Custom render function for the metadata section.
When provided, replaces the default messageCount display.
Use CardMetadataContainer and CardMetadataItem for consistent styling.`},tags:{required:!1,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"Tags to display on the card",defaultValue:{value:"[]",computed:!1}},summary:{required:!1,tsType:{name:"string"},description:"Session summary/description"},likeButton:{required:!1,tsType:{name:"LikeButtonProps"},description:"Like button configuration (displays in top-right corner)"},likeCount:{required:!1,tsType:{name:"number"},description:"Like count to display in popularity stats"},downloadCount:{required:!1,tsType:{name:"number"},description:"Download count to display in popularity stats"},imageSizes:{required:!1,tsType:{name:"string"},description:`The sizes attribute for the image element.
Helps browser select appropriate image size for responsive loading.
@example "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"`},loading:{required:!1,tsType:{name:"union",raw:"'lazy' | 'eager'",elements:[{name:"literal",value:"'lazy'"},{name:"literal",value:"'eager'"}]},description:`Loading strategy for the image.
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
\`\`\``},classNames:{required:!1,tsType:{name:"SessionCardClassNames"},description:`Custom class names for internal elements.
Classes are merged with defaults, allowing you to add or override styles.
@example
\`\`\`tsx
<SessionCard
  classNames={{
    title: "font-serif text-3xl",
    summary: "italic",
  }}
/>
\`\`\``}}};function h({className:s}){return e.jsxs(nt,{className:g("min-h-[320px] w-full border-zinc-700 ring-1 ring-zinc-800",s),isDisabled:!0,children:[e.jsxs("div",{className:"relative h-48 overflow-hidden bg-zinc-800",children:[e.jsx(m,{className:"absolute inset-0 h-full w-full",variant:"default"}),e.jsxs("div",{className:"absolute bottom-0 left-0 w-full p-5",children:[e.jsx(m,{className:"mb-2 h-7 w-3/4"}),e.jsx(m,{className:"h-7 w-1/2"})]})]}),e.jsx("div",{className:"flex flex-grow flex-col justify-between p-5",children:e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"flex items-center justify-between border-b border-zinc-800 pb-2",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(m,{className:"size-4",variant:"circular"}),e.jsx(m,{className:"h-4 w-20"})]})}),e.jsxs("div",{className:"flex -space-x-2 pt-1",children:[e.jsx(m,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(m,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(m,{className:"size-8 border-2 border-zinc-900",variant:"circular"})]})]})})]})}h.displayName="SessionCardSkeleton";h.__docgenInfo={description:`SessionCardSkeleton Component

A skeleton placeholder for SessionCard while loading.
Matches the exact layout of SessionCard for seamless loading states.

@example
\`\`\`tsx
// Basic usage
<SessionCardSkeleton />

// In a grid
{isLoading ? (
  <SessionCardSkeleton />
) : (
  <SessionCard {...props} />
)}
\`\`\``,methods:[],displayName:"SessionCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};const _t={title:"Content/SessionCard",component:o,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{title:{control:"text",description:"Session title"},imageUrl:{control:"text",description:"Cover image URL"},messageCount:{control:"number",description:"Number of messages in the session (optional - if undefined, message count section is hidden)"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},badges:{control:"object",description:"Badges to display on the card"},areCharactersLoading:{control:"boolean",description:"Whether characters are loading"},tags:{control:"object",description:"Tags to display on the card"},summary:{control:"text",description:"Session summary/description"},onClick:{action:"clicked"}},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})]},u="https://picsum.photos/seed/session1/600/400",x="https://picsum.photos/seed/session2/600/400",i="https://picsum.photos/seed/avatar1/100/100",d="https://picsum.photos/seed/avatar2/100/100",S="https://picsum.photos/seed/avatar3/100/100",mt="https://picsum.photos/seed/avatar4/100/100",a={args:{title:"Adventure in Wonderland",imageUrl:u,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:d}]}},j={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12})}]}},L={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12})},{label:"Private",variant:"private",icon:e.jsx(l,{size:12})}]}},E={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12})},{label:"Private",variant:"private",icon:e.jsx(l,{size:12})},{label:"Mine",variant:"owner",icon:e.jsx(v,{size:12})}]}},w={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}]}},z={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(v,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}]}},M={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(v,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"left"},{label:"Featured",icon:e.jsx(xe,{size:12}),position:"left"}]}},U={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"},{label:"Mine",variant:"owner",icon:e.jsx(v,{size:12}),position:"right"},{label:"Featured",icon:e.jsx(xe,{size:12}),position:"right"}]}},N={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(v,{size:12}),position:"left"},{label:"Featured",icon:e.jsx(xe,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"},{label:"VIP",icon:e.jsx(v,{size:12}),position:"right"},{label:"New",position:"right"}]}},B={args:{...a.args,badges:[{label:"Very Long Session Label",icon:e.jsx(r,{size:12}),position:"left"},{label:"Extended Private Mode",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}]}},T={args:{title:"New Adventure",imageUrl:x,messageCount:0,characterAvatars:[{name:"Alice",avatarUrl:i}]}},D={args:{...a.args,title:"Just Started",messageCount:1}},P={args:{title:"Mystery Session",messageCount:15,characterAvatars:[{name:"Unknown",avatarUrl:void 0}]}},_={args:{title:"Adventure Session",imageUrl:"https://invalid-url-that-will-404.com/image.png",messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:"https://invalid-url-that-will-404.com/avatar.png"},{name:"Bob",avatarUrl:d}]}},R={args:{title:"Session without Message Count",imageUrl:u,characterAvatars:[{name:"Alice",avatarUrl:i}]}},I={args:{...a.args,title:"Group Session",characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:d},{name:"Charlie",avatarUrl:S},{name:"Diana",avatarUrl:mt},{name:"Eve"}]}},W={args:{...a.args,title:"Loading Characters...",areCharactersLoading:!0,characterAvatars:[]}},V={args:{...a.args,isDisabled:!0}},O={args:{...a.args,title:"The Exceptionally Long Session Title That Should Be Truncated After Two Lines"}},F={args:{...a.args,actions:[{icon:Ce,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:it,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:ot,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"},{icon:lt,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},q={args:{...a.args,title:"Epic Campaign",messageCount:12345}},G={args:{...a.args,title:"Fantasy Adventure",tags:["Fantasy","Adventure","RPG"]}},H={args:{...a.args,title:"Multi-Genre Session",tags:["Fantasy","Sci-Fi","Horror","Mystery","Romance"]}},$={args:{...a.args,title:"Quick Session",tags:["Casual"]}},J={args:{...a.args,title:"Epic Quest",summary:"An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom from ancient evil."}},Q={args:{...a.args,title:"Mystery Manor",tags:["Mystery","Horror","Detective"],summary:"Investigate the haunted manor and uncover dark secrets hidden within its walls."}},K={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"Adventure in Wonderland",imageUrl:u,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:d}]}),e.jsx(o,{title:"Mystery Investigation",imageUrl:x,messageCount:128,badges:[{label:"SESSION",icon:e.jsx(r,{size:12})}],characterAvatars:[{name:"Detective",avatarUrl:S}]}),e.jsx(o,{title:"New Session",messageCount:0,characterAvatars:[]})]})},X={args:{title:"Session with Custom Metadata",imageUrl:u,characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:d}],renderMetadata:()=>e.jsxs(dt,{children:[e.jsx(ve,{icon:e.jsx(ct,{className:"size-3"}),children:"2 days ago"}),e.jsx(ve,{icon:e.jsx(jt,{className:"size-3"}),children:"3 participants"})]})}},Y={args:{title:"Popular Session",imageUrl:x,characterAvatars:[{name:"Alice",avatarUrl:i}],renderMetadata:()=>e.jsxs(dt,{children:[e.jsx(ve,{icon:e.jsx(xe,{className:"size-3"}),children:"4.8 rating"}),e.jsx(ve,{icon:e.jsx(ct,{className:"size-3"}),children:"Last played: 1h ago"})]})}},Z={args:{title:"Session with Stats",imageUrl:u,characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:d},{name:"Charlie",avatarUrl:S}],renderMetadata:()=>e.jsxs("div",{className:"grid grid-cols-3 gap-2 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"156"}),e.jsx("div",{children:"Messages"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"3"}),e.jsx("div",{children:"Characters"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"2h"}),e.jsx("div",{children:"Duration"})]})]})}},ee={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(o,{title:"Default Session",imageUrl:u,messageCount:10,characterAvatars:[{name:"Alice",avatarUrl:i}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(o,{title:"Session with Badge",imageUrl:x,messageCount:25,badges:[{label:"SESSION",icon:e.jsx(r,{size:12})}],characterAvatars:[{name:"Bob",avatarUrl:d}]})})]})]})},ae={args:{...a.args},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})],render:()=>e.jsx(h,{})},se={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(h,{}),e.jsx(h,{}),e.jsx(h,{})]})},te={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}}},re={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")}}},ne={args:{...a.args,likeCount:1234}},ie={args:{...a.args,downloadCount:5678}},oe={args:{...a.args,likeCount:1234,downloadCount:5678}},le={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:1234,downloadCount:5678}},ce={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:1235,downloadCount:5678}},de={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:2500,downloadCount:12e3,actions:[{icon:Ce,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:it,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:lt,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},me={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:123456,downloadCount:9876543}},ue={args:{title:"Epic Adventure Campaign",imageUrl:u,messageCount:1523,tags:["Fantasy","Adventure","Epic"],summary:"An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom.",badges:[{label:"SESSION",icon:e.jsx(r,{size:12})},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}],characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:d},{name:"Charlie",avatarUrl:S}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:2847,downloadCount:15230,actions:[{icon:Ce,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:ot,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"}]}},ge={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"Popular Campaign",imageUrl:u,messageCount:1523,tags:["Popular","Trending"],summary:"A highly popular session loved by many users.",characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:d}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:12500,downloadCount:45e3}),e.jsx(o,{title:"New Adventure",imageUrl:x,messageCount:42,tags:["New","Fresh"],summary:"A fresh new session just started.",characterAvatars:[{name:"Charlie",avatarUrl:S}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:42,downloadCount:128}),e.jsx(o,{title:"Classic Journey",messageCount:9999,tags:["Classic","Evergreen"],summary:"A timeless classic that has stood the test of time.",characterAvatars:[{name:"Diana",avatarUrl:mt},{name:"Eve"}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:98765,downloadCount:543210})]})},pe={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}},parameters:{docs:{description:{story:"When `likeButton` is provided, right-positioned badges are automatically hidden to prevent visual overlap. Use left-positioned badges instead when using likeButton."}}}};var Ne,Be,Te;a.parameters={...a.parameters,docs:{...(Ne=a.parameters)==null?void 0:Ne.docs,source:{originalSource:`{
  args: {
    title: 'Adventure in Wonderland',
    imageUrl: SAMPLE_COVER,
    messageCount: 42,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }, {
      name: 'Bob',
      avatarUrl: SAMPLE_AVATAR_2
    }]
  }
}`,...(Te=(Be=a.parameters)==null?void 0:Be.docs)==null?void 0:Te.source}}};var De,Pe,_e;j.parameters={...j.parameters,docs:{...(De=j.parameters)==null?void 0:De.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'SESSION',
      icon: <Layers size={12} />
    }]
  }
}`,...(_e=(Pe=j.parameters)==null?void 0:Pe.docs)==null?void 0:_e.source}}};var Re,Ie,We;L.parameters={...L.parameters,docs:{...(Re=L.parameters)==null?void 0:Re.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'SESSION',
      icon: <Layers size={12} />
    }, {
      label: 'Private',
      variant: 'private',
      icon: <Lock size={12} />
    }]
  }
}`,...(We=(Ie=L.parameters)==null?void 0:Ie.docs)==null?void 0:We.source}}};var Ve,Oe,Fe;E.parameters={...E.parameters,docs:{...(Ve=E.parameters)==null?void 0:Ve.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'SESSION',
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
}`,...(Fe=(Oe=E.parameters)==null?void 0:Oe.docs)==null?void 0:Fe.source}}};var qe,Ge,He;w.parameters={...w.parameters,docs:{...(qe=w.parameters)==null?void 0:qe.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'SESSION',
      icon: <Layers size={12} />,
      position: 'left'
    }, {
      label: 'Private',
      variant: 'private',
      icon: <Lock size={12} />,
      position: 'right'
    }]
  }
}`,...(He=(Ge=w.parameters)==null?void 0:Ge.docs)==null?void 0:He.source}}};var $e,Je,Qe;z.parameters={...z.parameters,docs:{...($e=z.parameters)==null?void 0:$e.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'SESSION',
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
}`,...(Qe=(Je=z.parameters)==null?void 0:Je.docs)==null?void 0:Qe.source}}};var Ke,Xe,Ye;M.parameters={...M.parameters,docs:{...(Ke=M.parameters)==null?void 0:Ke.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'SESSION',
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
      position: 'left'
    }, {
      label: 'Featured',
      icon: <Star size={12} />,
      position: 'left'
    }]
  }
}`,...(Ye=(Xe=M.parameters)==null?void 0:Xe.docs)==null?void 0:Ye.source}}};var Ze,ea,aa;U.parameters={...U.parameters,docs:{...(Ze=U.parameters)==null?void 0:Ze.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'SESSION',
      icon: <Layers size={12} />,
      position: 'left'
    }, {
      label: 'Private',
      variant: 'private',
      icon: <Lock size={12} />,
      position: 'right'
    }, {
      label: 'Mine',
      variant: 'owner',
      icon: <User size={12} />,
      position: 'right'
    }, {
      label: 'Featured',
      icon: <Star size={12} />,
      position: 'right'
    }]
  }
}`,...(aa=(ea=U.parameters)==null?void 0:ea.docs)==null?void 0:aa.source}}};var sa,ta,ra;N.parameters={...N.parameters,docs:{...(sa=N.parameters)==null?void 0:sa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'SESSION',
      icon: <Layers size={12} />,
      position: 'left'
    }, {
      label: 'Mine',
      variant: 'owner',
      icon: <User size={12} />,
      position: 'left'
    }, {
      label: 'Featured',
      icon: <Star size={12} />,
      position: 'left'
    }, {
      label: 'Private',
      variant: 'private',
      icon: <Lock size={12} />,
      position: 'right'
    }, {
      label: 'VIP',
      icon: <User size={12} />,
      position: 'right'
    }, {
      label: 'New',
      position: 'right'
    }]
  }
}`,...(ra=(ta=N.parameters)==null?void 0:ta.docs)==null?void 0:ra.source}}};var na,ia,oa;B.parameters={...B.parameters,docs:{...(na=B.parameters)==null?void 0:na.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'Very Long Session Label',
      icon: <Layers size={12} />,
      position: 'left'
    }, {
      label: 'Extended Private Mode',
      variant: 'private',
      icon: <Lock size={12} />,
      position: 'right'
    }]
  }
}`,...(oa=(ia=B.parameters)==null?void 0:ia.docs)==null?void 0:oa.source}}};var la,ca,da;T.parameters={...T.parameters,docs:{...(la=T.parameters)==null?void 0:la.docs,source:{originalSource:`{
  args: {
    title: 'New Adventure',
    imageUrl: SAMPLE_COVER_2,
    messageCount: 0,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(da=(ca=T.parameters)==null?void 0:ca.docs)==null?void 0:da.source}}};var ma,ua,ga;D.parameters={...D.parameters,docs:{...(ma=D.parameters)==null?void 0:ma.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Just Started',
    messageCount: 1
  }
}`,...(ga=(ua=D.parameters)==null?void 0:ua.docs)==null?void 0:ga.source}}};var pa,ha,va;P.parameters={...P.parameters,docs:{...(pa=P.parameters)==null?void 0:pa.docs,source:{originalSource:`{
  args: {
    title: 'Mystery Session',
    messageCount: 15,
    characterAvatars: [{
      name: 'Unknown',
      avatarUrl: undefined
    }]
  }
}`,...(va=(ha=P.parameters)==null?void 0:ha.docs)==null?void 0:va.source}}};var xa,Sa,fa;_.parameters={..._.parameters,docs:{...(xa=_.parameters)==null?void 0:xa.docs,source:{originalSource:`{
  args: {
    title: 'Adventure Session',
    imageUrl: 'https://invalid-url-that-will-404.com/image.png',
    messageCount: 42,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: 'https://invalid-url-that-will-404.com/avatar.png'
    }, {
      name: 'Bob',
      avatarUrl: SAMPLE_AVATAR_2
    }]
  }
}`,...(fa=(Sa=_.parameters)==null?void 0:Sa.docs)==null?void 0:fa.source}}};var Aa,Ca,ka;R.parameters={...R.parameters,docs:{...(Aa=R.parameters)==null?void 0:Aa.docs,source:{originalSource:`{
  args: {
    title: 'Session without Message Count',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(ka=(Ca=R.parameters)==null?void 0:Ca.docs)==null?void 0:ka.source}}};var ba,ya,ja;I.parameters={...I.parameters,docs:{...(ba=I.parameters)==null?void 0:ba.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Group Session',
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }, {
      name: 'Bob',
      avatarUrl: SAMPLE_AVATAR_2
    }, {
      name: 'Charlie',
      avatarUrl: SAMPLE_AVATAR_3
    }, {
      name: 'Diana',
      avatarUrl: SAMPLE_AVATAR_4
    }, {
      name: 'Eve'
    }]
  }
}`,...(ja=(ya=I.parameters)==null?void 0:ya.docs)==null?void 0:ja.source}}};var La,Ea,wa;W.parameters={...W.parameters,docs:{...(La=W.parameters)==null?void 0:La.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Loading Characters...',
    areCharactersLoading: true,
    characterAvatars: []
  }
}`,...(wa=(Ea=W.parameters)==null?void 0:Ea.docs)==null?void 0:wa.source}}};var za,Ma,Ua;V.parameters={...V.parameters,docs:{...(za=V.parameters)==null?void 0:za.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(Ua=(Ma=V.parameters)==null?void 0:Ma.docs)==null?void 0:Ua.source}}};var Na,Ba,Ta;O.parameters={...O.parameters,docs:{...(Na=O.parameters)==null?void 0:Na.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'The Exceptionally Long Session Title That Should Be Truncated After Two Lines'
  }
}`,...(Ta=(Ba=O.parameters)==null?void 0:Ba.docs)==null?void 0:Ta.source}}};var Da,Pa,_a;F.parameters={...F.parameters,docs:{...(Da=F.parameters)==null?void 0:Da.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    actions: [{
      icon: Edit,
      label: 'Edit',
      onClick: () => console.log('Edit clicked'),
      title: 'Edit session'
    }, {
      icon: Copy,
      label: 'Duplicate',
      onClick: () => console.log('Duplicate clicked'),
      title: 'Duplicate session'
    }, {
      icon: Download,
      label: 'Export',
      onClick: () => console.log('Export clicked'),
      title: 'Export session'
    }, {
      icon: Trash2,
      label: 'Delete',
      onClick: () => console.log('Delete clicked'),
      title: 'Delete session',
      className: 'hover:text-red-400'
    }]
  }
}`,...(_a=(Pa=F.parameters)==null?void 0:Pa.docs)==null?void 0:_a.source}}};var Ra,Ia,Wa;q.parameters={...q.parameters,docs:{...(Ra=q.parameters)==null?void 0:Ra.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Campaign',
    messageCount: 12345
  }
}`,...(Wa=(Ia=q.parameters)==null?void 0:Ia.docs)==null?void 0:Wa.source}}};var Va,Oa,Fa;G.parameters={...G.parameters,docs:{...(Va=G.parameters)==null?void 0:Va.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Fantasy Adventure',
    tags: ['Fantasy', 'Adventure', 'RPG']
  }
}`,...(Fa=(Oa=G.parameters)==null?void 0:Oa.docs)==null?void 0:Fa.source}}};var qa,Ga,Ha;H.parameters={...H.parameters,docs:{...(qa=H.parameters)==null?void 0:qa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Multi-Genre Session',
    tags: ['Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Romance']
  }
}`,...(Ha=(Ga=H.parameters)==null?void 0:Ga.docs)==null?void 0:Ha.source}}};var $a,Ja,Qa;$.parameters={...$.parameters,docs:{...($a=$.parameters)==null?void 0:$a.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Quick Session',
    tags: ['Casual']
  }
}`,...(Qa=(Ja=$.parameters)==null?void 0:Ja.docs)==null?void 0:Qa.source}}};var Ka,Xa,Ya;J.parameters={...J.parameters,docs:{...(Ka=J.parameters)==null?void 0:Ka.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Quest',
    summary: 'An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom from ancient evil.'
  }
}`,...(Ya=(Xa=J.parameters)==null?void 0:Xa.docs)==null?void 0:Ya.source}}};var Za,es,as;Q.parameters={...Q.parameters,docs:{...(Za=Q.parameters)==null?void 0:Za.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Mystery Manor',
    tags: ['Mystery', 'Horror', 'Detective'],
    summary: 'Investigate the haunted manor and uncover dark secrets hidden within its walls.'
  }
}`,...(as=(es=Q.parameters)==null?void 0:es.docs)==null?void 0:as.source}}};var ss,ts,rs;K.parameters={...K.parameters,docs:{...(ss=K.parameters)==null?void 0:ss.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 320px)',
    gap: '24px'
  }}>
        <Story />
      </div>],
  render: () => <>
      <SessionCard title="Adventure in Wonderland" imageUrl={SAMPLE_COVER} messageCount={42} characterAvatars={[{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }, {
      name: 'Bob',
      avatarUrl: SAMPLE_AVATAR_2
    }]} />
      <SessionCard title="Mystery Investigation" imageUrl={SAMPLE_COVER_2} messageCount={128} badges={[{
      label: 'SESSION',
      icon: <Layers size={12} />
    }]} characterAvatars={[{
      name: 'Detective',
      avatarUrl: SAMPLE_AVATAR_3
    }]} />
      <SessionCard title="New Session" messageCount={0} characterAvatars={[]} />
    </>
}`,...(rs=(ts=K.parameters)==null?void 0:ts.docs)==null?void 0:rs.source}}};var ns,is,os;X.parameters={...X.parameters,docs:{...(ns=X.parameters)==null?void 0:ns.docs,source:{originalSource:`{
  args: {
    title: 'Session with Custom Metadata',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }, {
      name: 'Bob',
      avatarUrl: SAMPLE_AVATAR_2
    }],
    renderMetadata: () => <MetadataContainer>
        <MetadataItem icon={<Clock className="size-3" />}>2 days ago</MetadataItem>
        <MetadataItem icon={<Users className="size-3" />}>3 participants</MetadataItem>
      </MetadataContainer>
  }
}`,...(os=(is=X.parameters)==null?void 0:is.docs)==null?void 0:os.source}}};var ls,cs,ds;Y.parameters={...Y.parameters,docs:{...(ls=Y.parameters)==null?void 0:ls.docs,source:{originalSource:`{
  args: {
    title: 'Popular Session',
    imageUrl: SAMPLE_COVER_2,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }],
    renderMetadata: () => <MetadataContainer>
        <MetadataItem icon={<Star className="size-3" />}>4.8 rating</MetadataItem>
        <MetadataItem icon={<Clock className="size-3" />}>Last played: 1h ago</MetadataItem>
      </MetadataContainer>
  }
}`,...(ds=(cs=Y.parameters)==null?void 0:cs.docs)==null?void 0:ds.source}}};var ms,us,gs;Z.parameters={...Z.parameters,docs:{...(ms=Z.parameters)==null?void 0:ms.docs,source:{originalSource:`{
  args: {
    title: 'Session with Stats',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }, {
      name: 'Bob',
      avatarUrl: SAMPLE_AVATAR_2
    }, {
      name: 'Charlie',
      avatarUrl: SAMPLE_AVATAR_3
    }],
    renderMetadata: () => <div className="grid grid-cols-3 gap-2 text-xs text-zinc-500">
        <div className="text-center">
          <div className="font-semibold text-white">156</div>
          <div>Messages</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-white">3</div>
          <div>Characters</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-white">2h</div>
          <div>Duration</div>
        </div>
      </div>
  }
}`,...(gs=(us=Z.parameters)==null?void 0:us.docs)==null?void 0:gs.source}}};var ps,hs,vs;ee.parameters={...ee.parameters,docs:{...(ps=ee.parameters)==null?void 0:ps.docs,source:{originalSource:`{
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
        width: '320px'
      }}>
          <SessionCard title="Default Session" imageUrl={SAMPLE_COVER} messageCount={10} characterAvatars={[{
          name: 'Alice',
          avatarUrl: SAMPLE_AVATAR_1
        }]} />
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
        width: '320px'
      }}>
          <SessionCard title="Session with Badge" imageUrl={SAMPLE_COVER_2} messageCount={25} badges={[{
          label: 'SESSION',
          icon: <Layers size={12} />
        }]} characterAvatars={[{
          name: 'Bob',
          avatarUrl: SAMPLE_AVATAR_2
        }]} />
        </div>
      </div>
    </>
}`,...(vs=(hs=ee.parameters)==null?void 0:hs.docs)==null?void 0:vs.source}}};var xs,Ss,fs;ae.parameters={...ae.parameters,docs:{...(xs=ae.parameters)==null?void 0:xs.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '320px'
  }}>
        <Story />
      </div>],
  render: () => <SessionCardSkeleton />
}`,...(fs=(Ss=ae.parameters)==null?void 0:Ss.docs)==null?void 0:fs.source}}};var As,Cs,ks;se.parameters={...se.parameters,docs:{...(As=se.parameters)==null?void 0:As.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 320px)',
    gap: '24px'
  }}>
        <Story />
      </div>],
  render: () => <>
      <SessionCardSkeleton />
      <SessionCardSkeleton />
      <SessionCardSkeleton />
    </>
}`,...(ks=(Cs=se.parameters)==null?void 0:Cs.docs)==null?void 0:ks.source}}};var bs,ys,js;te.parameters={...te.parameters,docs:{...(bs=te.parameters)==null?void 0:bs.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }
  }
}`,...(js=(ys=te.parameters)==null?void 0:ys.docs)==null?void 0:js.source}}};var Ls,Es,ws;re.parameters={...re.parameters,docs:{...(Ls=re.parameters)==null?void 0:Ls.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    }
  }
}`,...(ws=(Es=re.parameters)==null?void 0:Es.docs)==null?void 0:ws.source}}};var zs,Ms,Us;ne.parameters={...ne.parameters,docs:{...(zs=ne.parameters)==null?void 0:zs.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234
  }
}`,...(Us=(Ms=ne.parameters)==null?void 0:Ms.docs)==null?void 0:Us.source}}};var Ns,Bs,Ts;ie.parameters={...ie.parameters,docs:{...(Ns=ie.parameters)==null?void 0:Ns.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    downloadCount: 5678
  }
}`,...(Ts=(Bs=ie.parameters)==null?void 0:Bs.docs)==null?void 0:Ts.source}}};var Ds,Ps,_s;oe.parameters={...oe.parameters,docs:{...(Ds=oe.parameters)==null?void 0:Ds.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(_s=(Ps=oe.parameters)==null?void 0:Ps.docs)==null?void 0:_s.source}}};var Rs,Is,Ws;le.parameters={...le.parameters,docs:{...(Rs=le.parameters)==null?void 0:Rs.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    },
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Ws=(Is=le.parameters)==null?void 0:Is.docs)==null?void 0:Ws.source}}};var Vs,Os,Fs;ce.parameters={...ce.parameters,docs:{...(Vs=ce.parameters)==null?void 0:Vs.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 1235,
    downloadCount: 5678
  }
}`,...(Fs=(Os=ce.parameters)==null?void 0:Os.docs)==null?void 0:Fs.source}}};var qs,Gs,Hs;de.parameters={...de.parameters,docs:{...(qs=de.parameters)==null?void 0:qs.docs,source:{originalSource:`{
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
      title: 'Edit session'
    }, {
      icon: Copy,
      label: 'Duplicate',
      onClick: () => console.log('Duplicate clicked'),
      title: 'Duplicate session'
    }, {
      icon: Trash2,
      label: 'Delete',
      onClick: () => console.log('Delete clicked'),
      title: 'Delete session',
      className: 'hover:text-red-400'
    }]
  }
}`,...(Hs=(Gs=de.parameters)==null?void 0:Gs.docs)==null?void 0:Hs.source}}};var $s,Js,Qs;me.parameters={...me.parameters,docs:{...($s=me.parameters)==null?void 0:$s.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 123456,
    downloadCount: 9876543
  }
}`,...(Qs=(Js=me.parameters)==null?void 0:Js.docs)==null?void 0:Qs.source}}};var Ks,Xs,Ys;ue.parameters={...ue.parameters,docs:{...(Ks=ue.parameters)==null?void 0:Ks.docs,source:{originalSource:`{
  args: {
    title: 'Epic Adventure Campaign',
    imageUrl: SAMPLE_COVER,
    messageCount: 1523,
    tags: ['Fantasy', 'Adventure', 'Epic'],
    summary: 'An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom.',
    badges: [{
      label: 'SESSION',
      icon: <Layers size={12} />
    }, {
      label: 'Private',
      variant: 'private',
      icon: <Lock size={12} />,
      position: 'right'
    }],
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }, {
      name: 'Bob',
      avatarUrl: SAMPLE_AVATAR_2
    }, {
      name: 'Charlie',
      avatarUrl: SAMPLE_AVATAR_3
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
      title: 'Edit session'
    }, {
      icon: Download,
      label: 'Export',
      onClick: () => console.log('Export clicked'),
      title: 'Export session'
    }]
  }
}`,...(Ys=(Xs=ue.parameters)==null?void 0:Xs.docs)==null?void 0:Ys.source}}};var Zs,et,at;ge.parameters={...ge.parameters,docs:{...(Zs=ge.parameters)==null?void 0:Zs.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 320px)',
    gap: '24px'
  }}>
        <Story />
      </div>],
  render: () => <>
      <SessionCard title="Popular Campaign" imageUrl={SAMPLE_COVER} messageCount={1523} tags={['Popular', 'Trending']} summary="A highly popular session loved by many users." characterAvatars={[{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }, {
      name: 'Bob',
      avatarUrl: SAMPLE_AVATAR_2
    }]} likeButton={{
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    }} likeCount={12500} downloadCount={45000} />
      <SessionCard title="New Adventure" imageUrl={SAMPLE_COVER_2} messageCount={42} tags={['New', 'Fresh']} summary="A fresh new session just started." characterAvatars={[{
      name: 'Charlie',
      avatarUrl: SAMPLE_AVATAR_3
    }]} likeButton={{
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }} likeCount={42} downloadCount={128} />
      <SessionCard title="Classic Journey" messageCount={9999} tags={['Classic', 'Evergreen']} summary="A timeless classic that has stood the test of time." characterAvatars={[{
      name: 'Diana',
      avatarUrl: SAMPLE_AVATAR_4
    }, {
      name: 'Eve'
    }]} likeButton={{
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }} likeCount={98765} downloadCount={543210} />
    </>
}`,...(at=(et=ge.parameters)==null?void 0:et.docs)==null?void 0:at.source}}};var st,tt,rt;pe.parameters={...pe.parameters,docs:{...(st=pe.parameters)==null?void 0:st.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'SESSION',
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
}`,...(rt=(tt=pe.parameters)==null?void 0:tt.docs)==null?void 0:rt.source}}};const Rt=["Default","WithBadges","WithMultipleBadges","WithAllBadgeVariants","WithBadgesLeftAndRight","WithMultipleBadgesEachSide","ManyBadgesLeft","ManyBadgesRight","ManyBadgesBothSides","LongBadgeLabels","NewSession","SingleMessage","WithoutImage","ImageError","WithoutMessageCount","ManyAvatars","LoadingAvatars","Disabled","LongTitle","WithActions","HighMessageCount","WithTags","WithManyTags","WithSingleTag","WithSummary","WithTagsAndSummary","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid","WithLikeButton","WithLikeButtonLiked","WithLikeCount","WithDownloadCount","WithPopularityStats","WithLikeButtonAndStats","WithLikeButtonLikedAndStats","WithLikeButtonAndActions","HighPopularityCounts","FullFeatured","GridLayoutWithPopularity","LikeButtonHidesRightBadge"];export{ee as AllStates,X as CustomMetadata,a as Default,V as Disabled,ue as FullFeatured,Z as FullyCustomMetadata,K as GridLayout,ge as GridLayoutWithPopularity,q as HighMessageCount,me as HighPopularityCounts,_ as ImageError,pe as LikeButtonHidesRightBadge,W as LoadingAvatars,B as LongBadgeLabels,O as LongTitle,I as ManyAvatars,N as ManyBadgesBothSides,M as ManyBadgesLeft,U as ManyBadgesRight,Y as MetadataWithIcons,T as NewSession,D as SingleMessage,ae as Skeleton,se as SkeletonGrid,F as WithActions,E as WithAllBadgeVariants,j as WithBadges,w as WithBadgesLeftAndRight,ie as WithDownloadCount,te as WithLikeButton,de as WithLikeButtonAndActions,le as WithLikeButtonAndStats,re as WithLikeButtonLiked,ce as WithLikeButtonLikedAndStats,ne as WithLikeCount,H as WithManyTags,L as WithMultipleBadges,z as WithMultipleBadgesEachSide,oe as WithPopularityStats,$ as WithSingleTag,J as WithSummary,G as WithTags,Q as WithTagsAndSummary,P as WithoutImage,R as WithoutMessageCount,Rt as __namedExportsOrder,_t as default};
