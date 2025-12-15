import{r as he,j as e}from"./iframe-BgASNlDm.js";import{c}from"./utils-CF6QUdYH.js";import{u as xt,B as tt,C as St,a as At,b as ze,c as ft,d as Ct,e as kt,S as Ce,f as rt,D as nt,T as it,L as n,g as ot}from"./useImageRenderer-RZoNCkWe.js";import{S as m}from"./Skeleton-ClSp2uDz.js";import{L as l}from"./lock-BC49c09B.js";import{U as v}from"./user-CUgn8UEr.js";import{S as xe,U as bt}from"./users-Bggb1h8p.js";import"./preload-helper-CwRszBsw.js";import"./createLucideIcon-D4XuoCZ6.js";function yt({name:s,avatarUrl:p,loading:x="lazy"}){const[Se,f]=he.useState(!1);he.useEffect(()=>{f(!1)},[p]);const C=p&&!Se;return e.jsx("div",{className:"flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-900 bg-zinc-700",title:s,children:C?e.jsx("img",{src:p,alt:s,className:"h-full w-full object-cover",loading:x,onError:()=>f(!0)}):e.jsx("span",{className:"text-[10px] text-zinc-400",children:s.charAt(0).toUpperCase()||"?"})})}function fe(){return e.jsx("div",{className:"h-8 w-8 animate-pulse rounded-full border-2 border-zinc-900 bg-zinc-700"})}const lt=Ct,ve=kt;function o({title:s,imageUrl:p,placeholderImageUrl:x,actions:Se=[],className:f,isDisabled:C=!1,onClick:ke,characterAvatars:k=[],areCharactersLoading:be=!1,badges:b=[],tags:g=[],summary:ye,likeButton:y,likeCount:Le,downloadCount:je,imageSizes:dt,loading:gt="lazy",priority:Ee=!1,renderImage:mt,classNames:t}){const[ut,we]=he.useState(!1),pt=xt({renderImage:mt});he.useEffect(()=>{we(!1)},[p,x]);const ht=(p||x)&&!ut,vt=()=>{const r=p||x;return r?pt({src:r,alt:s,className:"absolute inset-0 h-full w-full object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90",sizes:dt,loading:Ee?void 0:gt,onError:()=>we(!0),fill:!0,priority:Ee}):null};return e.jsxs(tt,{className:c("min-h-[320px] w-full bg-zinc-900 border-zinc-800 ring-1 ring-zinc-800/50 hover:border-zinc-600",!C&&ke&&"hover:ring-zinc-700",f),isDisabled:C,onClick:ke,children:[e.jsxs("div",{className:"relative h-48 overflow-hidden bg-zinc-800",children:[ht?e.jsxs(e.Fragment,{children:[vt(),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"absolute inset-0 flex items-center justify-center",children:e.jsx("span",{className:"text-6xl font-bold text-zinc-500",children:s.charAt(0).toUpperCase()||"?"})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"})]}),y&&e.jsx("div",{className:"absolute top-2 right-2 z-20",children:e.jsx(St,{...y})}),e.jsx(At,{actions:Se,className:y?"top-12":void 0}),b.some(r=>(r.position??"left")==="left")&&e.jsx("div",{className:"absolute top-3 left-3 z-10 max-w-[45%]",children:e.jsx(ze,{badges:b,position:"left"})}),!y&&b.some(r=>r.position==="right")&&e.jsx("div",{className:"absolute top-3 right-3 z-10 max-w-[45%]",children:e.jsx(ze,{badges:b,position:"right"})}),e.jsx("div",{className:"absolute bottom-0 left-0 w-full p-5",children:e.jsx("h2",{className:c("line-clamp-2 text-xl md:text-2xl leading-tight font-bold text-ellipsis text-white",t==null?void 0:t.title),children:s})})]}),e.jsxs("div",{className:"flex flex-grow flex-col justify-between p-5",children:[e.jsxs("div",{className:"space-y-2 md:space-y-3",children:[g.length>0&&e.jsxs("div",{className:c("flex flex-wrap gap-2",t==null?void 0:t.tagsContainer),children:[g.slice(0,2).map((r,Ae)=>e.jsx("span",{className:c("max-w-[35%] @[240px]:max-w-[26%] truncate rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",t==null?void 0:t.tag),children:r},`${r}-${Ae}`)),g[2]&&e.jsx("span",{className:c("hidden @[240px]:inline! max-w-[26%] truncate rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",t==null?void 0:t.tag),children:g[2]}),g.length>2&&e.jsxs("span",{className:c("@[240px]:hidden! shrink-0 rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",t==null?void 0:t.tag),children:["+",g.length-2]}),g.length>3&&e.jsxs("span",{className:c("hidden @[240px]:inline! shrink-0 rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",t==null?void 0:t.tag),children:["+",g.length-3]})]}),ye&&e.jsx("p",{className:c("line-clamp-2 text-xs leading-relaxed break-all text-ellipsis text-zinc-400",t==null?void 0:t.summary),children:ye}),(Le!==void 0||je!==void 0)&&e.jsx(ft,{likeCount:Le,downloadCount:je})]}),(be||k.length>0)&&e.jsx("div",{className:"border-t border-zinc-800 pt-3 mt-3",children:be?e.jsxs("div",{className:"flex -space-x-2",children:[e.jsx(fe,{}),e.jsx(fe,{}),e.jsx(fe,{})]}):e.jsxs("div",{className:"flex -space-x-2",children:[k.slice(0,3).map((r,Ae)=>e.jsx(yt,{name:r.name,avatarUrl:r.avatarUrl,loading:r.loading??"lazy"},`${r.name}-${Ae}`)),k.length>3&&e.jsxs("div",{className:"flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 text-[10px] text-zinc-400",children:["+",k.length-3]})]})})]})]})}o.__docgenInfo={description:"",methods:[],displayName:"SessionCard",props:{title:{required:!0,tsType:{name:"string"},description:"Session title"},imageUrl:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Cover image URL"},placeholderImageUrl:{required:!1,tsType:{name:"string"},description:"Placeholder image URL when imageUrl is not provided"},actions:{required:!1,tsType:{name:"Array",elements:[{name:"CardAction"}],raw:"CardAction[]"},description:"Action buttons displayed on the card",defaultValue:{value:"[]",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"},isDisabled:{required:!1,tsType:{name:"boolean"},description:"Whether the card is disabled",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Click handler for the card"},characterAvatars:{required:!1,tsType:{name:"Array",elements:[{name:"CharacterAvatar"}],raw:"CharacterAvatar[]"},description:"Character avatars to display",defaultValue:{value:"[]",computed:!1}},areCharactersLoading:{required:!1,tsType:{name:"boolean"},description:"Whether characters are loading",defaultValue:{value:"false",computed:!1}},badges:{required:!1,tsType:{name:"Array",elements:[{name:"CardBadge"}],raw:"CardBadge[]"},description:"Badges to display on the card (e.g., type indicator, private, owner).",defaultValue:{value:"[]",computed:!1}},tags:{required:!1,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:`Tags to display on the card.
Container Query responsive: 2 tags on narrow cards (<240px), 3 on wider cards.
Remaining tags shown as "+n" indicator.`,defaultValue:{value:"[]",computed:!1}},summary:{required:!1,tsType:{name:"string"},description:"Session summary/description"},likeButton:{required:!1,tsType:{name:"LikeButtonProps"},description:"Like button configuration (displays in top-right corner)"},likeCount:{required:!1,tsType:{name:"number"},description:"Like count to display in popularity stats"},downloadCount:{required:!1,tsType:{name:"number"},description:"Download count to display in popularity stats"},imageSizes:{required:!1,tsType:{name:"string"},description:`The sizes attribute for the image element.
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
\`\`\``}}};function h({className:s}){return e.jsxs(tt,{className:c("min-h-[320px] w-full bg-zinc-900 border-zinc-800 ring-1 ring-zinc-800/50",s),isDisabled:!0,children:[e.jsxs("div",{className:"relative h-48 overflow-hidden bg-zinc-800",children:[e.jsx(m,{className:"absolute inset-0 h-full w-full",variant:"default"}),e.jsxs("div",{className:"absolute bottom-0 left-0 w-full p-5",children:[e.jsx(m,{className:"mb-2 h-7 w-3/4"}),e.jsx(m,{className:"h-7 w-1/2"})]})]}),e.jsx("div",{className:"flex flex-grow flex-col justify-between p-5",children:e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"flex items-center justify-between border-b border-zinc-800 pb-2",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(m,{className:"size-4",variant:"circular"}),e.jsx(m,{className:"h-4 w-20"})]})}),e.jsxs("div",{className:"flex -space-x-2 pt-1",children:[e.jsx(m,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(m,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(m,{className:"size-8 border-2 border-zinc-900",variant:"circular"})]})]})})]})}h.displayName="SessionCardSkeleton";h.__docgenInfo={description:`SessionCardSkeleton Component

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
\`\`\``,methods:[],displayName:"SessionCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};const Dt={title:"Content/SessionCard",component:o,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{title:{control:"text",description:"Session title"},imageUrl:{control:"text",description:"Cover image URL"},messageCount:{control:"number",description:"Number of messages in the session (optional - if undefined, message count section is hidden)"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},badges:{control:"object",description:"Badges to display on the card"},areCharactersLoading:{control:"boolean",description:"Whether characters are loading"},tags:{control:"object",description:"Tags to display on the card"},summary:{control:"text",description:"Session summary/description"},onClick:{action:"clicked"}},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})]},u="https://picsum.photos/seed/session1/600/400",S="https://picsum.photos/seed/session2/600/400",i="https://picsum.photos/seed/avatar1/100/100",d="https://picsum.photos/seed/avatar2/100/100",A="https://picsum.photos/seed/avatar3/100/100",ct="https://picsum.photos/seed/avatar4/100/100",a={args:{title:"Adventure in Wonderland",imageUrl:u,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:d}]}},L={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12})}]}},j={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12})},{label:"Private",variant:"private",icon:e.jsx(l,{size:12})}]}},E={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12})},{label:"Private",variant:"private",icon:e.jsx(l,{size:12})},{label:"Mine",variant:"owner",icon:e.jsx(v,{size:12})}]}},w={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}]}},z={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(v,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}]}},M={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(v,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"left"},{label:"Featured",icon:e.jsx(xe,{size:12}),position:"left"}]}},U={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"},{label:"Mine",variant:"owner",icon:e.jsx(v,{size:12}),position:"right"},{label:"Featured",icon:e.jsx(xe,{size:12}),position:"right"}]}},B={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(v,{size:12}),position:"left"},{label:"Featured",icon:e.jsx(xe,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"},{label:"VIP",icon:e.jsx(v,{size:12}),position:"right"},{label:"New",position:"right"}]}},P={args:{...a.args,badges:[{label:"Very Long Session Label",icon:e.jsx(n,{size:12}),position:"left"},{label:"Extended Private Mode",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}]}},D={args:{title:"New Adventure",imageUrl:S,messageCount:0,characterAvatars:[{name:"Alice",avatarUrl:i}]}},T={args:{...a.args,title:"Just Started",messageCount:1}},_={args:{title:"Mystery Session",messageCount:15,characterAvatars:[{name:"Unknown",avatarUrl:void 0}]}},N={args:{title:"Adventure Session",imageUrl:"https://invalid-url-that-will-404.com/image.png",messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:"https://invalid-url-that-will-404.com/avatar.png"},{name:"Bob",avatarUrl:d}]}},R={args:{title:"Session without Message Count",imageUrl:u,characterAvatars:[{name:"Alice",avatarUrl:i}]}},I={args:{...a.args,title:"Group Session",characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:d},{name:"Charlie",avatarUrl:A},{name:"Diana",avatarUrl:ct},{name:"Eve"}]}},V={args:{...a.args,title:"Loading Characters...",areCharactersLoading:!0,characterAvatars:[]}},W={args:{...a.args,isDisabled:!0}},O={args:{...a.args,title:"The Exceptionally Long Session Title That Should Be Truncated After Two Lines"}},F={args:{...a.args,actions:[{icon:Ce,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:rt,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:nt,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"},{icon:it,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},q={args:{...a.args,title:"Epic Campaign",messageCount:12345}},G={args:{...a.args,title:"Fantasy Adventure",tags:["Fantasy","Adventure","RPG"]}},H={args:{...a.args,title:"Multi-Genre Session",tags:["Fantasy","Sci-Fi","Horror","Mystery","Romance"]}},Q={args:{...a.args,title:"Quick Session",tags:["Casual"]}},$={args:{...a.args,title:"Epic Quest",summary:"An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom from ancient evil."}},J={args:{...a.args,title:"Mystery Manor",tags:["Mystery","Horror","Detective"],summary:"Investigate the haunted manor and uncover dark secrets hidden within its walls."}},K={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"Adventure in Wonderland",imageUrl:u,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:d}]}),e.jsx(o,{title:"Mystery Investigation",imageUrl:S,messageCount:128,badges:[{label:"SESSION",icon:e.jsx(n,{size:12})}],characterAvatars:[{name:"Detective",avatarUrl:A}]}),e.jsx(o,{title:"New Session",messageCount:0,characterAvatars:[]})]})},X={args:{title:"Session with Custom Metadata",imageUrl:u,characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:d}],renderMetadata:()=>e.jsxs(lt,{children:[e.jsx(ve,{icon:e.jsx(ot,{className:"size-3"}),children:"2 days ago"}),e.jsx(ve,{icon:e.jsx(bt,{className:"size-3"}),children:"3 participants"})]})}},Y={args:{title:"Popular Session",imageUrl:S,characterAvatars:[{name:"Alice",avatarUrl:i}],renderMetadata:()=>e.jsxs(lt,{children:[e.jsx(ve,{icon:e.jsx(xe,{className:"size-3"}),children:"4.8 rating"}),e.jsx(ve,{icon:e.jsx(ot,{className:"size-3"}),children:"Last played: 1h ago"})]})}},Z={args:{title:"Session with Stats",imageUrl:u,characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:d},{name:"Charlie",avatarUrl:A}],renderMetadata:()=>e.jsxs("div",{className:"grid grid-cols-3 gap-2 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"156"}),e.jsx("div",{children:"Messages"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"3"}),e.jsx("div",{children:"Characters"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"2h"}),e.jsx("div",{children:"Duration"})]})]})}},ee={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(o,{title:"Default Session",imageUrl:u,messageCount:10,characterAvatars:[{name:"Alice",avatarUrl:i}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(o,{title:"Session with Badge",imageUrl:S,messageCount:25,badges:[{label:"SESSION",icon:e.jsx(n,{size:12})}],characterAvatars:[{name:"Bob",avatarUrl:d}]})})]})]})},ae={args:{...a.args},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})],render:()=>e.jsx(h,{})},se={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(h,{}),e.jsx(h,{}),e.jsx(h,{})]})},te={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}}},re={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")}}},ne={args:{...a.args,likeCount:1234}},ie={args:{...a.args,downloadCount:5678}},oe={args:{...a.args,likeCount:1234,downloadCount:5678}},le={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:1234,downloadCount:5678}},ce={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:1235,downloadCount:5678}},de={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:2500,downloadCount:12e3,actions:[{icon:Ce,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:rt,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:it,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},ge={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:123456,downloadCount:9876543}},me={args:{title:"Epic Adventure Campaign",imageUrl:u,messageCount:1523,tags:["Fantasy","Adventure","Epic"],summary:"An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom.",badges:[{label:"SESSION",icon:e.jsx(n,{size:12})},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}],characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:d},{name:"Charlie",avatarUrl:A}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:2847,downloadCount:15230,actions:[{icon:Ce,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:nt,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"}]}},ue={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"Popular Campaign",imageUrl:u,messageCount:1523,tags:["Popular","Trending"],summary:"A highly popular session loved by many users.",characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:d}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:12500,downloadCount:45e3}),e.jsx(o,{title:"New Adventure",imageUrl:S,messageCount:42,tags:["New","Fresh"],summary:"A fresh new session just started.",characterAvatars:[{name:"Charlie",avatarUrl:A}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:42,downloadCount:128}),e.jsx(o,{title:"Classic Journey",messageCount:9999,tags:["Classic","Evergreen"],summary:"A timeless classic that has stood the test of time.",characterAvatars:[{name:"Diana",avatarUrl:ct},{name:"Eve"}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:98765,downloadCount:543210})]})},pe={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}},parameters:{docs:{description:{story:"When `likeButton` is provided, right-positioned badges are automatically hidden to prevent visual overlap. Use left-positioned badges instead when using likeButton."}}}};var Me,Ue,Be;a.parameters={...a.parameters,docs:{...(Me=a.parameters)==null?void 0:Me.docs,source:{originalSource:`{
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
}`,...(Be=(Ue=a.parameters)==null?void 0:Ue.docs)==null?void 0:Be.source}}};var Pe,De,Te;L.parameters={...L.parameters,docs:{...(Pe=L.parameters)==null?void 0:Pe.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'SESSION',
      icon: <Layers size={12} />
    }]
  }
}`,...(Te=(De=L.parameters)==null?void 0:De.docs)==null?void 0:Te.source}}};var _e,Ne,Re;j.parameters={...j.parameters,docs:{...(_e=j.parameters)==null?void 0:_e.docs,source:{originalSource:`{
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
}`,...(Re=(Ne=j.parameters)==null?void 0:Ne.docs)==null?void 0:Re.source}}};var Ie,Ve,We;E.parameters={...E.parameters,docs:{...(Ie=E.parameters)==null?void 0:Ie.docs,source:{originalSource:`{
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
}`,...(We=(Ve=E.parameters)==null?void 0:Ve.docs)==null?void 0:We.source}}};var Oe,Fe,qe;w.parameters={...w.parameters,docs:{...(Oe=w.parameters)==null?void 0:Oe.docs,source:{originalSource:`{
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
}`,...(qe=(Fe=w.parameters)==null?void 0:Fe.docs)==null?void 0:qe.source}}};var Ge,He,Qe;z.parameters={...z.parameters,docs:{...(Ge=z.parameters)==null?void 0:Ge.docs,source:{originalSource:`{
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
}`,...(Qe=(He=z.parameters)==null?void 0:He.docs)==null?void 0:Qe.source}}};var $e,Je,Ke;M.parameters={...M.parameters,docs:{...($e=M.parameters)==null?void 0:$e.docs,source:{originalSource:`{
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
}`,...(Ke=(Je=M.parameters)==null?void 0:Je.docs)==null?void 0:Ke.source}}};var Xe,Ye,Ze;U.parameters={...U.parameters,docs:{...(Xe=U.parameters)==null?void 0:Xe.docs,source:{originalSource:`{
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
}`,...(Ze=(Ye=U.parameters)==null?void 0:Ye.docs)==null?void 0:Ze.source}}};var ea,aa,sa;B.parameters={...B.parameters,docs:{...(ea=B.parameters)==null?void 0:ea.docs,source:{originalSource:`{
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
}`,...(sa=(aa=B.parameters)==null?void 0:aa.docs)==null?void 0:sa.source}}};var ta,ra,na;P.parameters={...P.parameters,docs:{...(ta=P.parameters)==null?void 0:ta.docs,source:{originalSource:`{
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
}`,...(na=(ra=P.parameters)==null?void 0:ra.docs)==null?void 0:na.source}}};var ia,oa,la;D.parameters={...D.parameters,docs:{...(ia=D.parameters)==null?void 0:ia.docs,source:{originalSource:`{
  args: {
    title: 'New Adventure',
    imageUrl: SAMPLE_COVER_2,
    messageCount: 0,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(la=(oa=D.parameters)==null?void 0:oa.docs)==null?void 0:la.source}}};var ca,da,ga;T.parameters={...T.parameters,docs:{...(ca=T.parameters)==null?void 0:ca.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Just Started',
    messageCount: 1
  }
}`,...(ga=(da=T.parameters)==null?void 0:da.docs)==null?void 0:ga.source}}};var ma,ua,pa;_.parameters={..._.parameters,docs:{...(ma=_.parameters)==null?void 0:ma.docs,source:{originalSource:`{
  args: {
    title: 'Mystery Session',
    messageCount: 15,
    characterAvatars: [{
      name: 'Unknown',
      avatarUrl: undefined
    }]
  }
}`,...(pa=(ua=_.parameters)==null?void 0:ua.docs)==null?void 0:pa.source}}};var ha,va,xa;N.parameters={...N.parameters,docs:{...(ha=N.parameters)==null?void 0:ha.docs,source:{originalSource:`{
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
}`,...(xa=(va=N.parameters)==null?void 0:va.docs)==null?void 0:xa.source}}};var Sa,Aa,fa;R.parameters={...R.parameters,docs:{...(Sa=R.parameters)==null?void 0:Sa.docs,source:{originalSource:`{
  args: {
    title: 'Session without Message Count',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(fa=(Aa=R.parameters)==null?void 0:Aa.docs)==null?void 0:fa.source}}};var Ca,ka,ba;I.parameters={...I.parameters,docs:{...(Ca=I.parameters)==null?void 0:Ca.docs,source:{originalSource:`{
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
}`,...(ba=(ka=I.parameters)==null?void 0:ka.docs)==null?void 0:ba.source}}};var ya,La,ja;V.parameters={...V.parameters,docs:{...(ya=V.parameters)==null?void 0:ya.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Loading Characters...',
    areCharactersLoading: true,
    characterAvatars: []
  }
}`,...(ja=(La=V.parameters)==null?void 0:La.docs)==null?void 0:ja.source}}};var Ea,wa,za;W.parameters={...W.parameters,docs:{...(Ea=W.parameters)==null?void 0:Ea.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(za=(wa=W.parameters)==null?void 0:wa.docs)==null?void 0:za.source}}};var Ma,Ua,Ba;O.parameters={...O.parameters,docs:{...(Ma=O.parameters)==null?void 0:Ma.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'The Exceptionally Long Session Title That Should Be Truncated After Two Lines'
  }
}`,...(Ba=(Ua=O.parameters)==null?void 0:Ua.docs)==null?void 0:Ba.source}}};var Pa,Da,Ta;F.parameters={...F.parameters,docs:{...(Pa=F.parameters)==null?void 0:Pa.docs,source:{originalSource:`{
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
}`,...(Ta=(Da=F.parameters)==null?void 0:Da.docs)==null?void 0:Ta.source}}};var _a,Na,Ra;q.parameters={...q.parameters,docs:{...(_a=q.parameters)==null?void 0:_a.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Campaign',
    messageCount: 12345
  }
}`,...(Ra=(Na=q.parameters)==null?void 0:Na.docs)==null?void 0:Ra.source}}};var Ia,Va,Wa;G.parameters={...G.parameters,docs:{...(Ia=G.parameters)==null?void 0:Ia.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Fantasy Adventure',
    tags: ['Fantasy', 'Adventure', 'RPG']
  }
}`,...(Wa=(Va=G.parameters)==null?void 0:Va.docs)==null?void 0:Wa.source}}};var Oa,Fa,qa;H.parameters={...H.parameters,docs:{...(Oa=H.parameters)==null?void 0:Oa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Multi-Genre Session',
    tags: ['Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Romance']
  }
}`,...(qa=(Fa=H.parameters)==null?void 0:Fa.docs)==null?void 0:qa.source}}};var Ga,Ha,Qa;Q.parameters={...Q.parameters,docs:{...(Ga=Q.parameters)==null?void 0:Ga.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Quick Session',
    tags: ['Casual']
  }
}`,...(Qa=(Ha=Q.parameters)==null?void 0:Ha.docs)==null?void 0:Qa.source}}};var $a,Ja,Ka;$.parameters={...$.parameters,docs:{...($a=$.parameters)==null?void 0:$a.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Quest',
    summary: 'An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom from ancient evil.'
  }
}`,...(Ka=(Ja=$.parameters)==null?void 0:Ja.docs)==null?void 0:Ka.source}}};var Xa,Ya,Za;J.parameters={...J.parameters,docs:{...(Xa=J.parameters)==null?void 0:Xa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Mystery Manor',
    tags: ['Mystery', 'Horror', 'Detective'],
    summary: 'Investigate the haunted manor and uncover dark secrets hidden within its walls.'
  }
}`,...(Za=(Ya=J.parameters)==null?void 0:Ya.docs)==null?void 0:Za.source}}};var es,as,ss;K.parameters={...K.parameters,docs:{...(es=K.parameters)==null?void 0:es.docs,source:{originalSource:`{
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
}`,...(ss=(as=K.parameters)==null?void 0:as.docs)==null?void 0:ss.source}}};var ts,rs,ns;X.parameters={...X.parameters,docs:{...(ts=X.parameters)==null?void 0:ts.docs,source:{originalSource:`{
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
}`,...(ns=(rs=X.parameters)==null?void 0:rs.docs)==null?void 0:ns.source}}};var is,os,ls;Y.parameters={...Y.parameters,docs:{...(is=Y.parameters)==null?void 0:is.docs,source:{originalSource:`{
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
}`,...(ls=(os=Y.parameters)==null?void 0:os.docs)==null?void 0:ls.source}}};var cs,ds,gs;Z.parameters={...Z.parameters,docs:{...(cs=Z.parameters)==null?void 0:cs.docs,source:{originalSource:`{
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
}`,...(gs=(ds=Z.parameters)==null?void 0:ds.docs)==null?void 0:gs.source}}};var ms,us,ps;ee.parameters={...ee.parameters,docs:{...(ms=ee.parameters)==null?void 0:ms.docs,source:{originalSource:`{
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
}`,...(ps=(us=ee.parameters)==null?void 0:us.docs)==null?void 0:ps.source}}};var hs,vs,xs;ae.parameters={...ae.parameters,docs:{...(hs=ae.parameters)==null?void 0:hs.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '320px'
  }}>
        <Story />
      </div>],
  render: () => <SessionCardSkeleton />
}`,...(xs=(vs=ae.parameters)==null?void 0:vs.docs)==null?void 0:xs.source}}};var Ss,As,fs;se.parameters={...se.parameters,docs:{...(Ss=se.parameters)==null?void 0:Ss.docs,source:{originalSource:`{
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
}`,...(fs=(As=se.parameters)==null?void 0:As.docs)==null?void 0:fs.source}}};var Cs,ks,bs;te.parameters={...te.parameters,docs:{...(Cs=te.parameters)==null?void 0:Cs.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }
  }
}`,...(bs=(ks=te.parameters)==null?void 0:ks.docs)==null?void 0:bs.source}}};var ys,Ls,js;re.parameters={...re.parameters,docs:{...(ys=re.parameters)==null?void 0:ys.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    }
  }
}`,...(js=(Ls=re.parameters)==null?void 0:Ls.docs)==null?void 0:js.source}}};var Es,ws,zs;ne.parameters={...ne.parameters,docs:{...(Es=ne.parameters)==null?void 0:Es.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234
  }
}`,...(zs=(ws=ne.parameters)==null?void 0:ws.docs)==null?void 0:zs.source}}};var Ms,Us,Bs;ie.parameters={...ie.parameters,docs:{...(Ms=ie.parameters)==null?void 0:Ms.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    downloadCount: 5678
  }
}`,...(Bs=(Us=ie.parameters)==null?void 0:Us.docs)==null?void 0:Bs.source}}};var Ps,Ds,Ts;oe.parameters={...oe.parameters,docs:{...(Ps=oe.parameters)==null?void 0:Ps.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Ts=(Ds=oe.parameters)==null?void 0:Ds.docs)==null?void 0:Ts.source}}};var _s,Ns,Rs;le.parameters={...le.parameters,docs:{...(_s=le.parameters)==null?void 0:_s.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    },
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Rs=(Ns=le.parameters)==null?void 0:Ns.docs)==null?void 0:Rs.source}}};var Is,Vs,Ws;ce.parameters={...ce.parameters,docs:{...(Is=ce.parameters)==null?void 0:Is.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 1235,
    downloadCount: 5678
  }
}`,...(Ws=(Vs=ce.parameters)==null?void 0:Vs.docs)==null?void 0:Ws.source}}};var Os,Fs,qs;de.parameters={...de.parameters,docs:{...(Os=de.parameters)==null?void 0:Os.docs,source:{originalSource:`{
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
}`,...(qs=(Fs=de.parameters)==null?void 0:Fs.docs)==null?void 0:qs.source}}};var Gs,Hs,Qs;ge.parameters={...ge.parameters,docs:{...(Gs=ge.parameters)==null?void 0:Gs.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 123456,
    downloadCount: 9876543
  }
}`,...(Qs=(Hs=ge.parameters)==null?void 0:Hs.docs)==null?void 0:Qs.source}}};var $s,Js,Ks;me.parameters={...me.parameters,docs:{...($s=me.parameters)==null?void 0:$s.docs,source:{originalSource:`{
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
}`,...(Ks=(Js=me.parameters)==null?void 0:Js.docs)==null?void 0:Ks.source}}};var Xs,Ys,Zs;ue.parameters={...ue.parameters,docs:{...(Xs=ue.parameters)==null?void 0:Xs.docs,source:{originalSource:`{
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
}`,...(Zs=(Ys=ue.parameters)==null?void 0:Ys.docs)==null?void 0:Zs.source}}};var et,at,st;pe.parameters={...pe.parameters,docs:{...(et=pe.parameters)==null?void 0:et.docs,source:{originalSource:`{
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
}`,...(st=(at=pe.parameters)==null?void 0:at.docs)==null?void 0:st.source}}};const Tt=["Default","WithBadges","WithMultipleBadges","WithAllBadgeVariants","WithBadgesLeftAndRight","WithMultipleBadgesEachSide","ManyBadgesLeft","ManyBadgesRight","ManyBadgesBothSides","LongBadgeLabels","NewSession","SingleMessage","WithoutImage","ImageError","WithoutMessageCount","ManyAvatars","LoadingAvatars","Disabled","LongTitle","WithActions","HighMessageCount","WithTags","WithManyTags","WithSingleTag","WithSummary","WithTagsAndSummary","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid","WithLikeButton","WithLikeButtonLiked","WithLikeCount","WithDownloadCount","WithPopularityStats","WithLikeButtonAndStats","WithLikeButtonLikedAndStats","WithLikeButtonAndActions","HighPopularityCounts","FullFeatured","GridLayoutWithPopularity","LikeButtonHidesRightBadge"];export{ee as AllStates,X as CustomMetadata,a as Default,W as Disabled,me as FullFeatured,Z as FullyCustomMetadata,K as GridLayout,ue as GridLayoutWithPopularity,q as HighMessageCount,ge as HighPopularityCounts,N as ImageError,pe as LikeButtonHidesRightBadge,V as LoadingAvatars,P as LongBadgeLabels,O as LongTitle,I as ManyAvatars,B as ManyBadgesBothSides,M as ManyBadgesLeft,U as ManyBadgesRight,Y as MetadataWithIcons,D as NewSession,T as SingleMessage,ae as Skeleton,se as SkeletonGrid,F as WithActions,E as WithAllBadgeVariants,L as WithBadges,w as WithBadgesLeftAndRight,ie as WithDownloadCount,te as WithLikeButton,de as WithLikeButtonAndActions,le as WithLikeButtonAndStats,re as WithLikeButtonLiked,ce as WithLikeButtonLikedAndStats,ne as WithLikeCount,H as WithManyTags,j as WithMultipleBadges,z as WithMultipleBadgesEachSide,oe as WithPopularityStats,Q as WithSingleTag,$ as WithSummary,G as WithTags,J as WithTagsAndSummary,_ as WithoutImage,R as WithoutMessageCount,Tt as __namedExportsOrder,Dt as default};
