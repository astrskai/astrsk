import{j as e,r as Ce}from"./iframe-BJKmoOO-.js";import{c as d}from"./utils-CF6QUdYH.js";import{u as Bs,B as bs,C as _s,a as Rs,b as Be,c as Is,d as Vs,e as Ws,S as ke,f as ks,D as ys,T as S,L as n,g as js,P as ye}from"./useImageRenderer-BR6WODDs.js";import{S as g}from"./Skeleton-BZALURbf.js";import{L as l}from"./lock-BV1u6cNu.js";import{U as v}from"./user-DPBzggWu.js";import{S as je,U as Fs}from"./users-Brg2IXkn.js";import"./preload-helper-CwRszBsw.js";import"./createLucideIcon-CQuTB6gz.js";function zs({name:t,avatarUrl:p,loading:f="lazy"}){const[ze,C]=Ce.useState(!1);Ce.useEffect(()=>{C(!1)},[p]);const b=p&&!ze;return e.jsx("div",{className:"flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-900 bg-zinc-700",title:t,children:b?e.jsx("img",{src:p,alt:t,className:"h-full w-full object-cover",loading:f,onError:()=>C(!0)}):e.jsx("span",{className:"text-[10px] text-zinc-400",children:t.charAt(0).toUpperCase()||"?"})})}function Ae(){return e.jsx("div",{className:"h-8 w-8 animate-pulse rounded-full border-2 border-zinc-900 bg-zinc-700"})}zs.__docgenInfo={description:`Character Avatar Component
Displays a character's avatar image with fallback to initial letter.`,methods:[],displayName:"CharacterAvatarImage",props:{name:{required:!0,tsType:{name:"string"},description:"Character name"},avatarUrl:{required:!1,tsType:{name:"string"},description:"Character avatar image URL"},loading:{required:!1,tsType:{name:"union",raw:"'lazy' | 'eager'",elements:[{name:"literal",value:"'lazy'"},{name:"literal",value:"'eager'"}]},description:`Loading strategy for the avatar image.
@default 'lazy'`,defaultValue:{value:"'lazy'",computed:!1}}}};Ae.__docgenInfo={description:`Character Avatar Skeleton Component
Loading placeholder for character avatars.`,methods:[],displayName:"CharacterAvatarSkeleton"};const Ls=Vs,be=Ws;function o({title:t,imageUrl:p,placeholderImageUrl:f,actions:ze=[],className:C,isDisabled:b=!1,onClick:Ee,characterAvatars:k=[],areCharactersLoading:we=!1,badges:y=[],tags:u=[],summary:Me,likeButton:j,likeCount:Ue,downloadCount:Ne,imageSizes:ws,loading:Ms="lazy",priority:De=!1,renderImage:Us,classNames:s,footerActions:Pe}){const[Ns,Te]=Ce.useState(!1),Ds=Bs({renderImage:Us});Ce.useEffect(()=>{Te(!1)},[p,f]);const Ps=(p||f)&&!Ns,Ts=()=>{const r=p||f;return r?Ds({src:r,alt:t,className:"absolute inset-0 h-full w-full object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90",sizes:ws,loading:De?void 0:Ms,onError:()=>Te(!0),fill:!0,priority:De}):null};return e.jsxs(bs,{className:d("min-h-[320px] w-full bg-zinc-900 border-zinc-800 ring-1 ring-zinc-800/50 hover:border-zinc-600",!b&&Ee&&"hover:ring-zinc-700",C),isDisabled:b,onClick:Ee,children:[e.jsxs("div",{className:"relative h-48 overflow-hidden bg-zinc-800",children:[Ps?e.jsxs(e.Fragment,{children:[Ts(),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"absolute inset-0 flex items-center justify-center",children:e.jsx("span",{className:"text-6xl font-bold text-zinc-500",children:t.charAt(0).toUpperCase()||"?"})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"})]}),j&&e.jsx("div",{className:"absolute top-2 right-2 z-20",children:e.jsx(_s,{...j})}),e.jsx(Rs,{actions:ze,className:j?"top-12":void 0}),y.some(r=>(r.position??"left")==="left")&&e.jsx("div",{className:"absolute top-3 left-3 z-10 max-w-[45%]",children:e.jsx(Be,{badges:y,position:"left"})}),!j&&y.some(r=>r.position==="right")&&e.jsx("div",{className:"absolute top-3 right-3 z-10 max-w-[45%]",children:e.jsx(Be,{badges:y,position:"right"})}),e.jsx("div",{className:"absolute bottom-0 left-0 w-full p-5",children:e.jsx("h2",{className:d("line-clamp-2 text-xl md:text-2xl leading-tight font-bold text-ellipsis text-white",s==null?void 0:s.title),children:t})})]}),e.jsxs("div",{className:"flex flex-grow flex-col justify-between p-5",children:[e.jsxs("div",{className:"space-y-2 md:space-y-3",children:[u.length>0&&e.jsxs("div",{className:d("flex flex-wrap gap-2",s==null?void 0:s.tagsContainer),children:[u.slice(0,2).map((r,Le)=>e.jsx("span",{className:d("max-w-[35%] @[240px]:max-w-[26%] truncate rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",s==null?void 0:s.tag),children:r},`${r}-${Le}`)),u[2]&&e.jsx("span",{className:d("hidden @[240px]:inline! max-w-[26%] truncate rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",s==null?void 0:s.tag),children:u[2]}),u.length>2&&e.jsxs("span",{className:d("@[240px]:hidden! shrink-0 rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",s==null?void 0:s.tag),children:["+",u.length-2]}),u.length>3&&e.jsxs("span",{className:d("hidden @[240px]:inline! shrink-0 rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",s==null?void 0:s.tag),children:["+",u.length-3]})]}),Me&&e.jsx("p",{className:d("line-clamp-2 text-xs leading-relaxed break-all text-ellipsis text-zinc-400",s==null?void 0:s.summary),children:Me}),(Ue!==void 0||Ne!==void 0)&&e.jsx(Is,{likeCount:Ue,downloadCount:Ne})]}),(we||k.length>0)&&e.jsx("div",{className:"border-t border-zinc-800 pt-3 mt-3",children:we?e.jsxs("div",{className:"flex -space-x-2",children:[e.jsx(Ae,{}),e.jsx(Ae,{}),e.jsx(Ae,{})]}):e.jsxs("div",{className:"flex -space-x-2",children:[k.slice(0,3).map((r,Le)=>e.jsx(zs,{name:r.name,avatarUrl:r.avatarUrl,loading:r.loading??"lazy"},`${r.name}-${Le}`)),k.length>3&&e.jsxs("div",{className:"flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 text-[10px] text-zinc-400",children:["+",k.length-3]})]})})]}),Pe&&e.jsx("div",{className:"mt-auto flex border-t border-zinc-800",children:Pe})]})}o.__docgenInfo={description:"",methods:[],displayName:"SessionCard",props:{title:{required:!0,tsType:{name:"string"},description:"Session title"},imageUrl:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Cover image URL"},placeholderImageUrl:{required:!1,tsType:{name:"string"},description:"Placeholder image URL when imageUrl is not provided"},actions:{required:!1,tsType:{name:"Array",elements:[{name:"CardAction"}],raw:"CardAction[]"},description:"Action buttons displayed on the card",defaultValue:{value:"[]",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"},isDisabled:{required:!1,tsType:{name:"boolean"},description:"Whether the card is disabled",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Click handler for the card"},characterAvatars:{required:!1,tsType:{name:"Array",elements:[{name:"CharacterAvatarProps"}],raw:"CharacterAvatar[]"},description:"Character avatars to display",defaultValue:{value:"[]",computed:!1}},areCharactersLoading:{required:!1,tsType:{name:"boolean"},description:"Whether characters are loading",defaultValue:{value:"false",computed:!1}},badges:{required:!1,tsType:{name:"Array",elements:[{name:"CardBadge"}],raw:"CardBadge[]"},description:"Badges to display on the card (e.g., type indicator, private, owner).",defaultValue:{value:"[]",computed:!1}},tags:{required:!1,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:`Tags to display on the card.
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
\`\`\``},footerActions:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:`Custom footer actions to display at the bottom of the card.
Renders below the content area with a top border separator.
Useful for action buttons like "Continue", "Delete", etc.
@example
\`\`\`tsx
<SessionCard
  footerActions={
    <>
      <button className="flex-1 py-2">Continue</button>
      <button className="flex-1 py-2">Delete</button>
    </>
  }
/>
\`\`\``}}};function h({className:t}){return e.jsxs(bs,{className:d("min-h-[320px] w-full bg-zinc-900 border-zinc-800 ring-1 ring-zinc-800/50",t),isDisabled:!0,children:[e.jsxs("div",{className:"relative h-48 overflow-hidden bg-zinc-800",children:[e.jsx(g,{className:"absolute inset-0 h-full w-full",variant:"default"}),e.jsxs("div",{className:"absolute bottom-0 left-0 w-full p-5",children:[e.jsx(g,{className:"mb-2 h-7 w-3/4"}),e.jsx(g,{className:"h-7 w-1/2"})]})]}),e.jsx("div",{className:"flex flex-grow flex-col justify-between p-5",children:e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"flex items-center justify-between border-b border-zinc-800 pb-2",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(g,{className:"size-4",variant:"circular"}),e.jsx(g,{className:"h-4 w-20"})]})}),e.jsxs("div",{className:"flex -space-x-2 pt-1",children:[e.jsx(g,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(g,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(g,{className:"size-8 border-2 border-zinc-900",variant:"circular"})]})]})})]})}h.displayName="SessionCardSkeleton";h.__docgenInfo={description:`SessionCardSkeleton Component

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
\`\`\``,methods:[],displayName:"SessionCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};const Ys={title:"Content/SessionCard",component:o,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{title:{control:"text",description:"Session title"},imageUrl:{control:"text",description:"Cover image URL"},messageCount:{control:"number",description:"Number of messages in the session (optional - if undefined, message count section is hidden)"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},badges:{control:"object",description:"Badges to display on the card"},areCharactersLoading:{control:"boolean",description:"Whether characters are loading"},tags:{control:"object",description:"Tags to display on the card"},summary:{control:"text",description:"Session summary/description"},onClick:{action:"clicked"}},decorators:[t=>e.jsx("div",{style:{width:"320px"},children:e.jsx(t,{})})]},m="https://picsum.photos/seed/session1/600/400",A="https://picsum.photos/seed/session2/600/400",i="https://picsum.photos/seed/avatar1/100/100",c="https://picsum.photos/seed/avatar2/100/100",x="https://picsum.photos/seed/avatar3/100/100",Es="https://picsum.photos/seed/avatar4/100/100",a={args:{title:"Adventure in Wonderland",imageUrl:m,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:c}]}},z={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12})}]}},L={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12})},{label:"Private",variant:"private",icon:e.jsx(l,{size:12})}]}},E={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12})},{label:"Private",variant:"private",icon:e.jsx(l,{size:12})},{label:"Mine",variant:"owner",icon:e.jsx(v,{size:12})}]}},w={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}]}},M={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(v,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}]}},U={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(v,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"left"},{label:"Featured",icon:e.jsx(je,{size:12}),position:"left"}]}},N={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"},{label:"Mine",variant:"owner",icon:e.jsx(v,{size:12}),position:"right"},{label:"Featured",icon:e.jsx(je,{size:12}),position:"right"}]}},D={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(v,{size:12}),position:"left"},{label:"Featured",icon:e.jsx(je,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"},{label:"VIP",icon:e.jsx(v,{size:12}),position:"right"},{label:"New",position:"right"}]}},P={args:{...a.args,badges:[{label:"Very Long Session Label",icon:e.jsx(n,{size:12}),position:"left"},{label:"Extended Private Mode",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}]}},T={args:{title:"New Adventure",imageUrl:A,messageCount:0,characterAvatars:[{name:"Alice",avatarUrl:i}]}},B={args:{...a.args,title:"Just Started",messageCount:1}},_={args:{title:"Mystery Session",messageCount:15,characterAvatars:[{name:"Unknown",avatarUrl:void 0}]}},R={args:{title:"Adventure Session",imageUrl:"https://invalid-url-that-will-404.com/image.png",messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:"https://invalid-url-that-will-404.com/avatar.png"},{name:"Bob",avatarUrl:c}]}},I={args:{title:"Session without Message Count",imageUrl:m,characterAvatars:[{name:"Alice",avatarUrl:i}]}},V={args:{...a.args,title:"Group Session",characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:c},{name:"Charlie",avatarUrl:x},{name:"Diana",avatarUrl:Es},{name:"Eve"}]}},W={args:{...a.args,title:"Loading Characters...",areCharactersLoading:!0,characterAvatars:[]}},F={args:{...a.args,isDisabled:!0}},O={args:{...a.args,title:"The Exceptionally Long Session Title That Should Be Truncated After Two Lines"}},q={args:{...a.args,actions:[{icon:ke,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:ks,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:ys,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"},{icon:S,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},G={args:{...a.args,title:"Epic Campaign",messageCount:12345}},H={args:{...a.args,title:"Fantasy Adventure",tags:["Fantasy","Adventure","RPG"]}},Q={args:{...a.args,title:"Multi-Genre Session",tags:["Fantasy","Sci-Fi","Horror","Mystery","Romance"]}},$={args:{...a.args,title:"Quick Session",tags:["Casual"]}},J={args:{...a.args,title:"Epic Quest",summary:"An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom from ancient evil."}},K={args:{...a.args,title:"Mystery Manor",tags:["Mystery","Horror","Detective"],summary:"Investigate the haunted manor and uncover dark secrets hidden within its walls."}},X={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"Adventure in Wonderland",imageUrl:m,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:c}]}),e.jsx(o,{title:"Mystery Investigation",imageUrl:A,messageCount:128,badges:[{label:"SESSION",icon:e.jsx(n,{size:12})}],characterAvatars:[{name:"Detective",avatarUrl:x}]}),e.jsx(o,{title:"New Session",messageCount:0,characterAvatars:[]})]})},Y={args:{title:"Session with Custom Metadata",imageUrl:m,characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:c}],renderMetadata:()=>e.jsxs(Ls,{children:[e.jsx(be,{icon:e.jsx(js,{className:"size-3"}),children:"2 days ago"}),e.jsx(be,{icon:e.jsx(Fs,{className:"size-3"}),children:"3 participants"})]})}},Z={args:{title:"Popular Session",imageUrl:A,characterAvatars:[{name:"Alice",avatarUrl:i}],renderMetadata:()=>e.jsxs(Ls,{children:[e.jsx(be,{icon:e.jsx(je,{className:"size-3"}),children:"4.8 rating"}),e.jsx(be,{icon:e.jsx(js,{className:"size-3"}),children:"Last played: 1h ago"})]})}},ee={args:{title:"Session with Stats",imageUrl:m,characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:c},{name:"Charlie",avatarUrl:x}],renderMetadata:()=>e.jsxs("div",{className:"grid grid-cols-3 gap-2 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"156"}),e.jsx("div",{children:"Messages"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"3"}),e.jsx("div",{children:"Characters"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"2h"}),e.jsx("div",{children:"Duration"})]})]})}},ae={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(o,{title:"Default Session",imageUrl:m,messageCount:10,characterAvatars:[{name:"Alice",avatarUrl:i}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(o,{title:"Session with Badge",imageUrl:A,messageCount:25,badges:[{label:"SESSION",icon:e.jsx(n,{size:12})}],characterAvatars:[{name:"Bob",avatarUrl:c}]})})]})]})},te={args:{...a.args},decorators:[t=>e.jsx("div",{style:{width:"320px"},children:e.jsx(t,{})})],render:()=>e.jsx(h,{})},se={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(h,{}),e.jsx(h,{}),e.jsx(h,{})]})},re={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}}},ne={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")}}},ie={args:{...a.args,likeCount:1234}},oe={args:{...a.args,downloadCount:5678}},le={args:{...a.args,likeCount:1234,downloadCount:5678}},ce={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:1234,downloadCount:5678}},de={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:1235,downloadCount:5678}},me={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:2500,downloadCount:12e3,actions:[{icon:ke,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:ks,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:S,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},ue={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:123456,downloadCount:9876543}},ge={args:{title:"Epic Adventure Campaign",imageUrl:m,messageCount:1523,tags:["Fantasy","Adventure","Epic"],summary:"An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom.",badges:[{label:"SESSION",icon:e.jsx(n,{size:12})},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}],characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:c},{name:"Charlie",avatarUrl:x}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:2847,downloadCount:15230,actions:[{icon:ke,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:ys,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"}]}},pe={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"Popular Campaign",imageUrl:m,messageCount:1523,tags:["Popular","Trending"],summary:"A highly popular session loved by many users.",characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:c}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:12500,downloadCount:45e3}),e.jsx(o,{title:"New Adventure",imageUrl:A,messageCount:42,tags:["New","Fresh"],summary:"A fresh new session just started.",characterAvatars:[{name:"Charlie",avatarUrl:x}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:42,downloadCount:128}),e.jsx(o,{title:"Classic Journey",messageCount:9999,tags:["Classic","Evergreen"],summary:"A timeless classic that has stood the test of time.",characterAvatars:[{name:"Diana",avatarUrl:Es},{name:"Eve"}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:98765,downloadCount:543210})]})},he={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(n,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}},parameters:{docs:{description:{story:"When `likeButton` is provided, right-positioned badges are automatically hidden to prevent visual overlap. Use left-positioned badges instead when using likeButton."}}}},ve={args:{...a.args,footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white",onClick:()=>console.log("Continue clicked"),children:[e.jsx(ye,{size:16}),"Continue"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400",onClick:()=>console.log("Delete clicked"),children:[e.jsx(S,{size:16}),"Delete"]})]})}},xe={args:{...a.args,footerActions:e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white",onClick:()=>console.log("Continue clicked"),children:[e.jsx(ye,{size:16}),"Continue Session"]})}},fe={args:{...a.args,footerActions:e.jsxs(e.Fragment,{children:[e.jsx("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white",onClick:()=>console.log("Continue clicked"),children:e.jsx(ye,{size:16})}),e.jsx("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white",onClick:()=>console.log("Edit clicked"),children:e.jsx(ke,{size:16})}),e.jsx("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400",onClick:()=>console.log("Delete clicked"),children:e.jsx(S,{size:16})})]})}},Se={args:{title:"Epic Adventure Campaign",imageUrl:m,messageCount:1523,tags:["Fantasy","Adventure","Epic"],summary:"An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom.",badges:[{label:"SESSION",icon:e.jsx(n,{size:12})}],characterAvatars:[{name:"Alice",avatarUrl:i},{name:"Bob",avatarUrl:c},{name:"Charlie",avatarUrl:x}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:2847,downloadCount:15230,footerActions:e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white",onClick:()=>console.log("Continue clicked"),children:[e.jsx(ye,{size:16}),"Continue"]}),e.jsxs("button",{className:"flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400",onClick:()=>console.log("Delete clicked"),children:[e.jsx(S,{size:16}),"Delete"]})]})}};var _e,Re,Ie;a.parameters={...a.parameters,docs:{...(_e=a.parameters)==null?void 0:_e.docs,source:{originalSource:`{
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
}`,...(Ie=(Re=a.parameters)==null?void 0:Re.docs)==null?void 0:Ie.source}}};var Ve,We,Fe;z.parameters={...z.parameters,docs:{...(Ve=z.parameters)==null?void 0:Ve.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'SESSION',
      icon: <Layers size={12} />
    }]
  }
}`,...(Fe=(We=z.parameters)==null?void 0:We.docs)==null?void 0:Fe.source}}};var Oe,qe,Ge;L.parameters={...L.parameters,docs:{...(Oe=L.parameters)==null?void 0:Oe.docs,source:{originalSource:`{
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
}`,...(Ge=(qe=L.parameters)==null?void 0:qe.docs)==null?void 0:Ge.source}}};var He,Qe,$e;E.parameters={...E.parameters,docs:{...(He=E.parameters)==null?void 0:He.docs,source:{originalSource:`{
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
}`,...($e=(Qe=E.parameters)==null?void 0:Qe.docs)==null?void 0:$e.source}}};var Je,Ke,Xe;w.parameters={...w.parameters,docs:{...(Je=w.parameters)==null?void 0:Je.docs,source:{originalSource:`{
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
}`,...(Xe=(Ke=w.parameters)==null?void 0:Ke.docs)==null?void 0:Xe.source}}};var Ye,Ze,ea;M.parameters={...M.parameters,docs:{...(Ye=M.parameters)==null?void 0:Ye.docs,source:{originalSource:`{
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
}`,...(ea=(Ze=M.parameters)==null?void 0:Ze.docs)==null?void 0:ea.source}}};var aa,ta,sa;U.parameters={...U.parameters,docs:{...(aa=U.parameters)==null?void 0:aa.docs,source:{originalSource:`{
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
}`,...(sa=(ta=U.parameters)==null?void 0:ta.docs)==null?void 0:sa.source}}};var ra,na,ia;N.parameters={...N.parameters,docs:{...(ra=N.parameters)==null?void 0:ra.docs,source:{originalSource:`{
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
}`,...(ia=(na=N.parameters)==null?void 0:na.docs)==null?void 0:ia.source}}};var oa,la,ca;D.parameters={...D.parameters,docs:{...(oa=D.parameters)==null?void 0:oa.docs,source:{originalSource:`{
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
}`,...(ca=(la=D.parameters)==null?void 0:la.docs)==null?void 0:ca.source}}};var da,ma,ua;P.parameters={...P.parameters,docs:{...(da=P.parameters)==null?void 0:da.docs,source:{originalSource:`{
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
}`,...(ua=(ma=P.parameters)==null?void 0:ma.docs)==null?void 0:ua.source}}};var ga,pa,ha;T.parameters={...T.parameters,docs:{...(ga=T.parameters)==null?void 0:ga.docs,source:{originalSource:`{
  args: {
    title: 'New Adventure',
    imageUrl: SAMPLE_COVER_2,
    messageCount: 0,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(ha=(pa=T.parameters)==null?void 0:pa.docs)==null?void 0:ha.source}}};var va,xa,fa;B.parameters={...B.parameters,docs:{...(va=B.parameters)==null?void 0:va.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Just Started',
    messageCount: 1
  }
}`,...(fa=(xa=B.parameters)==null?void 0:xa.docs)==null?void 0:fa.source}}};var Sa,Aa,Ca;_.parameters={..._.parameters,docs:{...(Sa=_.parameters)==null?void 0:Sa.docs,source:{originalSource:`{
  args: {
    title: 'Mystery Session',
    messageCount: 15,
    characterAvatars: [{
      name: 'Unknown',
      avatarUrl: undefined
    }]
  }
}`,...(Ca=(Aa=_.parameters)==null?void 0:Aa.docs)==null?void 0:Ca.source}}};var ba,ka,ya;R.parameters={...R.parameters,docs:{...(ba=R.parameters)==null?void 0:ba.docs,source:{originalSource:`{
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
}`,...(ya=(ka=R.parameters)==null?void 0:ka.docs)==null?void 0:ya.source}}};var ja,za,La;I.parameters={...I.parameters,docs:{...(ja=I.parameters)==null?void 0:ja.docs,source:{originalSource:`{
  args: {
    title: 'Session without Message Count',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(La=(za=I.parameters)==null?void 0:za.docs)==null?void 0:La.source}}};var Ea,wa,Ma;V.parameters={...V.parameters,docs:{...(Ea=V.parameters)==null?void 0:Ea.docs,source:{originalSource:`{
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
}`,...(Ma=(wa=V.parameters)==null?void 0:wa.docs)==null?void 0:Ma.source}}};var Ua,Na,Da;W.parameters={...W.parameters,docs:{...(Ua=W.parameters)==null?void 0:Ua.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Loading Characters...',
    areCharactersLoading: true,
    characterAvatars: []
  }
}`,...(Da=(Na=W.parameters)==null?void 0:Na.docs)==null?void 0:Da.source}}};var Pa,Ta,Ba;F.parameters={...F.parameters,docs:{...(Pa=F.parameters)==null?void 0:Pa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(Ba=(Ta=F.parameters)==null?void 0:Ta.docs)==null?void 0:Ba.source}}};var _a,Ra,Ia;O.parameters={...O.parameters,docs:{...(_a=O.parameters)==null?void 0:_a.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'The Exceptionally Long Session Title That Should Be Truncated After Two Lines'
  }
}`,...(Ia=(Ra=O.parameters)==null?void 0:Ra.docs)==null?void 0:Ia.source}}};var Va,Wa,Fa;q.parameters={...q.parameters,docs:{...(Va=q.parameters)==null?void 0:Va.docs,source:{originalSource:`{
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
}`,...(Fa=(Wa=q.parameters)==null?void 0:Wa.docs)==null?void 0:Fa.source}}};var Oa,qa,Ga;G.parameters={...G.parameters,docs:{...(Oa=G.parameters)==null?void 0:Oa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Campaign',
    messageCount: 12345
  }
}`,...(Ga=(qa=G.parameters)==null?void 0:qa.docs)==null?void 0:Ga.source}}};var Ha,Qa,$a;H.parameters={...H.parameters,docs:{...(Ha=H.parameters)==null?void 0:Ha.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Fantasy Adventure',
    tags: ['Fantasy', 'Adventure', 'RPG']
  }
}`,...($a=(Qa=H.parameters)==null?void 0:Qa.docs)==null?void 0:$a.source}}};var Ja,Ka,Xa;Q.parameters={...Q.parameters,docs:{...(Ja=Q.parameters)==null?void 0:Ja.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Multi-Genre Session',
    tags: ['Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Romance']
  }
}`,...(Xa=(Ka=Q.parameters)==null?void 0:Ka.docs)==null?void 0:Xa.source}}};var Ya,Za,et;$.parameters={...$.parameters,docs:{...(Ya=$.parameters)==null?void 0:Ya.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Quick Session',
    tags: ['Casual']
  }
}`,...(et=(Za=$.parameters)==null?void 0:Za.docs)==null?void 0:et.source}}};var at,tt,st;J.parameters={...J.parameters,docs:{...(at=J.parameters)==null?void 0:at.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Quest',
    summary: 'An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom from ancient evil.'
  }
}`,...(st=(tt=J.parameters)==null?void 0:tt.docs)==null?void 0:st.source}}};var rt,nt,it;K.parameters={...K.parameters,docs:{...(rt=K.parameters)==null?void 0:rt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Mystery Manor',
    tags: ['Mystery', 'Horror', 'Detective'],
    summary: 'Investigate the haunted manor and uncover dark secrets hidden within its walls.'
  }
}`,...(it=(nt=K.parameters)==null?void 0:nt.docs)==null?void 0:it.source}}};var ot,lt,ct;X.parameters={...X.parameters,docs:{...(ot=X.parameters)==null?void 0:ot.docs,source:{originalSource:`{
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
}`,...(ct=(lt=X.parameters)==null?void 0:lt.docs)==null?void 0:ct.source}}};var dt,mt,ut;Y.parameters={...Y.parameters,docs:{...(dt=Y.parameters)==null?void 0:dt.docs,source:{originalSource:`{
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
}`,...(ut=(mt=Y.parameters)==null?void 0:mt.docs)==null?void 0:ut.source}}};var gt,pt,ht;Z.parameters={...Z.parameters,docs:{...(gt=Z.parameters)==null?void 0:gt.docs,source:{originalSource:`{
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
}`,...(ht=(pt=Z.parameters)==null?void 0:pt.docs)==null?void 0:ht.source}}};var vt,xt,ft;ee.parameters={...ee.parameters,docs:{...(vt=ee.parameters)==null?void 0:vt.docs,source:{originalSource:`{
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
}`,...(ft=(xt=ee.parameters)==null?void 0:xt.docs)==null?void 0:ft.source}}};var St,At,Ct;ae.parameters={...ae.parameters,docs:{...(St=ae.parameters)==null?void 0:St.docs,source:{originalSource:`{
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
}`,...(Ct=(At=ae.parameters)==null?void 0:At.docs)==null?void 0:Ct.source}}};var bt,kt,yt;te.parameters={...te.parameters,docs:{...(bt=te.parameters)==null?void 0:bt.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '320px'
  }}>
        <Story />
      </div>],
  render: () => <SessionCardSkeleton />
}`,...(yt=(kt=te.parameters)==null?void 0:kt.docs)==null?void 0:yt.source}}};var jt,zt,Lt;se.parameters={...se.parameters,docs:{...(jt=se.parameters)==null?void 0:jt.docs,source:{originalSource:`{
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
}`,...(Lt=(zt=se.parameters)==null?void 0:zt.docs)==null?void 0:Lt.source}}};var Et,wt,Mt;re.parameters={...re.parameters,docs:{...(Et=re.parameters)==null?void 0:Et.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }
  }
}`,...(Mt=(wt=re.parameters)==null?void 0:wt.docs)==null?void 0:Mt.source}}};var Ut,Nt,Dt;ne.parameters={...ne.parameters,docs:{...(Ut=ne.parameters)==null?void 0:Ut.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    }
  }
}`,...(Dt=(Nt=ne.parameters)==null?void 0:Nt.docs)==null?void 0:Dt.source}}};var Pt,Tt,Bt;ie.parameters={...ie.parameters,docs:{...(Pt=ie.parameters)==null?void 0:Pt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234
  }
}`,...(Bt=(Tt=ie.parameters)==null?void 0:Tt.docs)==null?void 0:Bt.source}}};var _t,Rt,It;oe.parameters={...oe.parameters,docs:{...(_t=oe.parameters)==null?void 0:_t.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    downloadCount: 5678
  }
}`,...(It=(Rt=oe.parameters)==null?void 0:Rt.docs)==null?void 0:It.source}}};var Vt,Wt,Ft;le.parameters={...le.parameters,docs:{...(Vt=le.parameters)==null?void 0:Vt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Ft=(Wt=le.parameters)==null?void 0:Wt.docs)==null?void 0:Ft.source}}};var Ot,qt,Gt;ce.parameters={...ce.parameters,docs:{...(Ot=ce.parameters)==null?void 0:Ot.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    },
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Gt=(qt=ce.parameters)==null?void 0:qt.docs)==null?void 0:Gt.source}}};var Ht,Qt,$t;de.parameters={...de.parameters,docs:{...(Ht=de.parameters)==null?void 0:Ht.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 1235,
    downloadCount: 5678
  }
}`,...($t=(Qt=de.parameters)==null?void 0:Qt.docs)==null?void 0:$t.source}}};var Jt,Kt,Xt;me.parameters={...me.parameters,docs:{...(Jt=me.parameters)==null?void 0:Jt.docs,source:{originalSource:`{
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
}`,...(Xt=(Kt=me.parameters)==null?void 0:Kt.docs)==null?void 0:Xt.source}}};var Yt,Zt,es;ue.parameters={...ue.parameters,docs:{...(Yt=ue.parameters)==null?void 0:Yt.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 123456,
    downloadCount: 9876543
  }
}`,...(es=(Zt=ue.parameters)==null?void 0:Zt.docs)==null?void 0:es.source}}};var as,ts,ss;ge.parameters={...ge.parameters,docs:{...(as=ge.parameters)==null?void 0:as.docs,source:{originalSource:`{
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
}`,...(ss=(ts=ge.parameters)==null?void 0:ts.docs)==null?void 0:ss.source}}};var rs,ns,is;pe.parameters={...pe.parameters,docs:{...(rs=pe.parameters)==null?void 0:rs.docs,source:{originalSource:`{
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
}`,...(is=(ns=pe.parameters)==null?void 0:ns.docs)==null?void 0:is.source}}};var os,ls,cs;he.parameters={...he.parameters,docs:{...(os=he.parameters)==null?void 0:os.docs,source:{originalSource:`{
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
}`,...(cs=(ls=he.parameters)==null?void 0:ls.docs)==null?void 0:cs.source}}};var ds,ms,us;ve.parameters={...ve.parameters,docs:{...(ds=ve.parameters)==null?void 0:ds.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    footerActions: <>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white" onClick={() => console.log('Continue clicked')}>
          <Play size={16} />
          Continue
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400" onClick={() => console.log('Delete clicked')}>
          <Trash2 size={16} />
          Delete
        </button>
      </>
  }
}`,...(us=(ms=ve.parameters)==null?void 0:ms.docs)==null?void 0:us.source}}};var gs,ps,hs;xe.parameters={...xe.parameters,docs:{...(gs=xe.parameters)==null?void 0:gs.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    footerActions: <button className="flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white" onClick={() => console.log('Continue clicked')}>
        <Play size={16} />
        Continue Session
      </button>
  }
}`,...(hs=(ps=xe.parameters)==null?void 0:ps.docs)==null?void 0:hs.source}}};var vs,xs,fs;fe.parameters={...fe.parameters,docs:{...(vs=fe.parameters)==null?void 0:vs.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    footerActions: <>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white" onClick={() => console.log('Continue clicked')}>
          <Play size={16} />
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white" onClick={() => console.log('Edit clicked')}>
          <Edit size={16} />
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400" onClick={() => console.log('Delete clicked')}>
          <Trash2 size={16} />
        </button>
      </>
  }
}`,...(fs=(xs=fe.parameters)==null?void 0:xs.docs)==null?void 0:fs.source}}};var Ss,As,Cs;Se.parameters={...Se.parameters,docs:{...(Ss=Se.parameters)==null?void 0:Ss.docs,source:{originalSource:`{
  args: {
    title: 'Epic Adventure Campaign',
    imageUrl: SAMPLE_COVER,
    messageCount: 1523,
    tags: ['Fantasy', 'Adventure', 'Epic'],
    summary: 'An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom.',
    badges: [{
      label: 'SESSION',
      icon: <Layers size={12} />
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
    footerActions: <>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white" onClick={() => console.log('Continue clicked')}>
          <Play size={16} />
          Continue
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400" onClick={() => console.log('Delete clicked')}>
          <Trash2 size={16} />
          Delete
        </button>
      </>
  }
}`,...(Cs=(As=Se.parameters)==null?void 0:As.docs)==null?void 0:Cs.source}}};const Zs=["Default","WithBadges","WithMultipleBadges","WithAllBadgeVariants","WithBadgesLeftAndRight","WithMultipleBadgesEachSide","ManyBadgesLeft","ManyBadgesRight","ManyBadgesBothSides","LongBadgeLabels","NewSession","SingleMessage","WithoutImage","ImageError","WithoutMessageCount","ManyAvatars","LoadingAvatars","Disabled","LongTitle","WithActions","HighMessageCount","WithTags","WithManyTags","WithSingleTag","WithSummary","WithTagsAndSummary","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid","WithLikeButton","WithLikeButtonLiked","WithLikeCount","WithDownloadCount","WithPopularityStats","WithLikeButtonAndStats","WithLikeButtonLikedAndStats","WithLikeButtonAndActions","HighPopularityCounts","FullFeatured","GridLayoutWithPopularity","LikeButtonHidesRightBadge","WithFooterActions","FooterActionsSingleButton","FooterActionsThreeButtons","FullFeaturedWithFooter"];export{ae as AllStates,Y as CustomMetadata,a as Default,F as Disabled,xe as FooterActionsSingleButton,fe as FooterActionsThreeButtons,ge as FullFeatured,Se as FullFeaturedWithFooter,ee as FullyCustomMetadata,X as GridLayout,pe as GridLayoutWithPopularity,G as HighMessageCount,ue as HighPopularityCounts,R as ImageError,he as LikeButtonHidesRightBadge,W as LoadingAvatars,P as LongBadgeLabels,O as LongTitle,V as ManyAvatars,D as ManyBadgesBothSides,U as ManyBadgesLeft,N as ManyBadgesRight,Z as MetadataWithIcons,T as NewSession,B as SingleMessage,te as Skeleton,se as SkeletonGrid,q as WithActions,E as WithAllBadgeVariants,z as WithBadges,w as WithBadgesLeftAndRight,oe as WithDownloadCount,ve as WithFooterActions,re as WithLikeButton,me as WithLikeButtonAndActions,ce as WithLikeButtonAndStats,ne as WithLikeButtonLiked,de as WithLikeButtonLikedAndStats,ie as WithLikeCount,Q as WithManyTags,L as WithMultipleBadges,M as WithMultipleBadgesEachSide,le as WithPopularityStats,$ as WithSingleTag,J as WithSummary,H as WithTags,K as WithTagsAndSummary,_ as WithoutImage,I as WithoutMessageCount,Zs as __namedExportsOrder,Ys as default};
