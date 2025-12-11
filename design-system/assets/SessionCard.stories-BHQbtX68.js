import{r as me,j as e}from"./iframe-DesAGjRF.js";import{c as Ys}from"./utils-CF6QUdYH.js";import{u as gt,B as Zs,C as pt,a as ht,b as Ee,c as vt,d as xt,e as St,S as Se,f as et,D as at,T as st,L as t,g as tt}from"./useImageRenderer--5mp5vtR.js";import{S as d}from"./Skeleton-DajaFeFA.js";import{L as l}from"./lock-Nbeco8EM.js";import{U as p}from"./user-BHVx6Vol.js";import{S as ge,U as At}from"./users-BQbzdyvO.js";import"./preload-helper-CwRszBsw.js";import"./createLucideIcon-C8rR5eXn.js";function ft({name:s,avatarUrl:o,loading:u="lazy"}){const[pe,x]=me.useState(!1);me.useEffect(()=>{x(!1)},[o]);const S=o&&!pe;return e.jsx("div",{className:"flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-900 bg-zinc-700",title:s,children:S?e.jsx("img",{src:o,alt:s,className:"h-full w-full object-cover",loading:u,onError:()=>x(!0)}):e.jsx("span",{className:"text-[10px] text-zinc-400",children:s.charAt(0).toUpperCase()||"?"})})}function xe(){return e.jsx("div",{className:"h-8 w-8 animate-pulse rounded-full border-2 border-zinc-900 bg-zinc-700"})}function Ct({className:s}){return e.jsx("svg",{className:s,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})})}const rt=xt,ue=St;function i({title:s,imageUrl:o,messageCount:u,actions:pe=[],className:x,isDisabled:S=!1,onClick:Ae,characterAvatars:A=[],areCharactersLoading:fe=!1,badges:f=[],renderMetadata:Ce,tags:C=[],summary:ke,likeButton:he,likeCount:be,downloadCount:ye,imageSizes:it,loading:ot="lazy",renderImage:lt}){const[je,Le]=me.useState(!1),ct=gt({renderImage:lt});me.useEffect(()=>{Le(!1)},[o]);const dt=o&&!je,mt=o&&je,ut=()=>o?ct({src:o,alt:s,className:"absolute inset-0 h-full w-full object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90",sizes:it,loading:ot,onError:()=>Le(!0),fill:!0}):null;return e.jsxs(Zs,{className:Ys("min-h-[320px] w-full border-zinc-700 ring-1 ring-zinc-800",!S&&Ae&&"hover:ring-zinc-600",x),isDisabled:S,onClick:Ae,children:[e.jsxs("div",{className:"relative h-48 overflow-hidden bg-zinc-800",children:[dt?e.jsxs(e.Fragment,{children:[ut(),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"})]}):mt?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"absolute inset-0 flex items-center justify-center",children:e.jsx("span",{className:"text-6xl font-bold text-zinc-500",children:s.charAt(0).toUpperCase()||"?"})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"absolute inset-0 bg-zinc-800",children:e.jsx("div",{className:"absolute inset-0 opacity-20",style:{backgroundImage:"radial-gradient(#4f46e5 1px, transparent 1px)",backgroundSize:"16px 16px"}})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"})]}),he&&e.jsx("div",{className:"absolute top-2 right-2 z-20",children:e.jsx(pt,{...he})}),e.jsx(ht,{actions:pe,className:he?"top-12":void 0}),f.some(r=>(r.position??"left")==="left")&&e.jsx("div",{className:"absolute top-3 left-3 z-10 max-w-[45%]",children:e.jsx(Ee,{badges:f,position:"left"})}),f.some(r=>r.position==="right")&&e.jsx("div",{className:"absolute top-3 right-3 z-10 max-w-[45%]",children:e.jsx(Ee,{badges:f,position:"right"})}),e.jsx("div",{className:"absolute bottom-0 left-0 w-full p-5",children:e.jsx("h2",{className:"line-clamp-2 text-xl md:text-2xl leading-tight font-bold text-ellipsis text-white",children:s})})]}),e.jsx("div",{className:"flex flex-grow flex-col justify-between p-5",children:e.jsxs("div",{className:"space-y-2 md:space-y-3",children:[C.length>0&&e.jsxs("div",{className:"flex flex-wrap gap-2",children:[C.slice(0,3).map((r,ve)=>e.jsx("span",{className:"rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",children:r},`${r}-${ve}`)),C.length>3&&e.jsxs("span",{className:"rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",children:["+",C.length-3]})]}),ke&&e.jsx("p",{className:"line-clamp-2 text-xs leading-relaxed break-all text-ellipsis text-zinc-400",children:ke}),(be!==void 0||ye!==void 0)&&e.jsx(vt,{likeCount:be,downloadCount:ye}),Ce?Ce():u!==void 0&&e.jsx("div",{className:"flex items-center justify-between text-sm",children:u===0?e.jsx("span",{className:"text-zinc-400",children:"New session"}):e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Ct,{className:"h-4 w-4 text-zinc-400"}),e.jsx("span",{className:"font-semibold text-zinc-300",children:u.toLocaleString()}),e.jsx("span",{className:"text-zinc-400",children:u===1?"Message":"Messages"})]})}),(fe||A.length>0)&&e.jsx("div",{className:"border-t border-zinc-800 pt-3",children:fe?e.jsxs("div",{className:"flex -space-x-2",children:[e.jsx(xe,{}),e.jsx(xe,{}),e.jsx(xe,{})]}):e.jsxs("div",{className:"flex -space-x-2",children:[A.slice(0,3).map((r,ve)=>e.jsx(ft,{name:r.name,avatarUrl:r.avatarUrl,loading:r.loading??"lazy"},`${r.name}-${ve}`)),A.length>3&&e.jsxs("div",{className:"flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 text-[10px] text-zinc-400",children:["+",A.length-3]})]})})]})})]})}i.__docgenInfo={description:"",methods:[],displayName:"SessionCard",props:{title:{required:!0,tsType:{name:"string"},description:"Session title"},imageUrl:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Cover image URL"},messageCount:{required:!1,tsType:{name:"number"},description:"Number of messages in the session (used in default metadata)"},actions:{required:!1,tsType:{name:"Array",elements:[{name:"CardAction"}],raw:"CardAction[]"},description:"Action buttons displayed on the card",defaultValue:{value:"[]",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"},isDisabled:{required:!1,tsType:{name:"boolean"},description:"Whether the card is disabled",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Click handler for the card"},characterAvatars:{required:!1,tsType:{name:"Array",elements:[{name:"CharacterAvatar"}],raw:"CharacterAvatar[]"},description:"Character avatars to display",defaultValue:{value:"[]",computed:!1}},areCharactersLoading:{required:!1,tsType:{name:"boolean"},description:"Whether characters are loading",defaultValue:{value:"false",computed:!1}},badges:{required:!1,tsType:{name:"Array",elements:[{name:"CardBadge"}],raw:"CardBadge[]"},description:"Badges to display on the card (e.g., type indicator, private, owner).",defaultValue:{value:"[]",computed:!1}},renderMetadata:{required:!1,tsType:{name:"signature",type:"function",raw:"() => React.ReactNode",signature:{arguments:[],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:`Custom render function for the metadata section.
When provided, replaces the default messageCount display.
Use CardMetadataContainer and CardMetadataItem for consistent styling.`},tags:{required:!1,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"Tags to display on the card",defaultValue:{value:"[]",computed:!1}},summary:{required:!1,tsType:{name:"string"},description:"Session summary/description"},likeButton:{required:!1,tsType:{name:"LikeButtonProps"},description:"Like button configuration (displays in top-right corner)"},likeCount:{required:!1,tsType:{name:"number"},description:"Like count to display in popularity stats"},downloadCount:{required:!1,tsType:{name:"number"},description:"Download count to display in popularity stats"},imageSizes:{required:!1,tsType:{name:"string"},description:`The sizes attribute for the image element.
Helps browser select appropriate image size for responsive loading.
@example "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"`},loading:{required:!1,tsType:{name:"union",raw:"'lazy' | 'eager'",elements:[{name:"literal",value:"'lazy'"},{name:"literal",value:"'eager'"}]},description:`Loading strategy for the image.
Use 'eager' for above-the-fold images (e.g., first few cards in a list).
@default 'lazy'`,defaultValue:{value:"'lazy'",computed:!1}},renderImage:{required:!1,tsType:{name:"signature",type:"function",raw:"(props: ImageComponentProps) => React.ReactNode",signature:{arguments:[{type:{name:"ImageComponentProps"},name:"props"}],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:`Custom image renderer for framework-specific optimization.
Takes precedence over DesignSystemProvider's imageComponent.
@example Next.js usage:
\`\`\`tsx
renderImage={(props) => (
  <NextImage {...props} fill style={{ objectFit: 'cover' }} />
)}
\`\`\``}}};function g({className:s}){return e.jsxs(Zs,{className:Ys("min-h-[320px] w-full border-zinc-700 ring-1 ring-zinc-800",s),isDisabled:!0,children:[e.jsxs("div",{className:"relative h-48 overflow-hidden bg-zinc-800",children:[e.jsx(d,{className:"absolute inset-0 h-full w-full",variant:"default"}),e.jsxs("div",{className:"absolute bottom-0 left-0 w-full p-5",children:[e.jsx(d,{className:"mb-2 h-7 w-3/4"}),e.jsx(d,{className:"h-7 w-1/2"})]})]}),e.jsx("div",{className:"flex flex-grow flex-col justify-between p-5",children:e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"flex items-center justify-between border-b border-zinc-800 pb-2",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(d,{className:"size-4",variant:"circular"}),e.jsx(d,{className:"h-4 w-20"})]})}),e.jsxs("div",{className:"flex -space-x-2 pt-1",children:[e.jsx(d,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(d,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(d,{className:"size-8 border-2 border-zinc-900",variant:"circular"})]})]})})]})}g.displayName="SessionCardSkeleton";g.__docgenInfo={description:`SessionCardSkeleton Component

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
\`\`\``,methods:[],displayName:"SessionCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};const Nt={title:"Content/SessionCard",component:i,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{title:{control:"text",description:"Session title"},imageUrl:{control:"text",description:"Cover image URL"},messageCount:{control:"number",description:"Number of messages in the session (optional - if undefined, message count section is hidden)"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},badges:{control:"object",description:"Badges to display on the card"},areCharactersLoading:{control:"boolean",description:"Whether characters are loading"},tags:{control:"object",description:"Tags to display on the card"},summary:{control:"text",description:"Session summary/description"},onClick:{action:"clicked"}},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})]},m="https://picsum.photos/seed/session1/600/400",h="https://picsum.photos/seed/session2/600/400",n="https://picsum.photos/seed/avatar1/100/100",c="https://picsum.photos/seed/avatar2/100/100",v="https://picsum.photos/seed/avatar3/100/100",nt="https://picsum.photos/seed/avatar4/100/100",a={args:{title:"Adventure in Wonderland",imageUrl:m,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:n},{name:"Bob",avatarUrl:c}]}},k={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12})}]}},b={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12})},{label:"Private",variant:"private",icon:e.jsx(l,{size:12})}]}},y={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12})},{label:"Private",variant:"private",icon:e.jsx(l,{size:12})},{label:"Mine",variant:"owner",icon:e.jsx(p,{size:12})}]}},j={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}]}},L={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(p,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}]}},E={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(p,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"left"},{label:"Featured",icon:e.jsx(ge,{size:12}),position:"left"}]}},w={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"},{label:"Mine",variant:"owner",icon:e.jsx(p,{size:12}),position:"right"},{label:"Featured",icon:e.jsx(ge,{size:12}),position:"right"}]}},M={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(p,{size:12}),position:"left"},{label:"Featured",icon:e.jsx(ge,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"},{label:"VIP",icon:e.jsx(p,{size:12}),position:"right"},{label:"New",position:"right"}]}},z={args:{...a.args,badges:[{label:"Very Long Session Label",icon:e.jsx(t,{size:12}),position:"left"},{label:"Extended Private Mode",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}]}},N={args:{title:"New Adventure",imageUrl:h,messageCount:0,characterAvatars:[{name:"Alice",avatarUrl:n}]}},U={args:{...a.args,title:"Just Started",messageCount:1}},D={args:{title:"Mystery Session",messageCount:15,characterAvatars:[{name:"Unknown",avatarUrl:void 0}]}},T={args:{title:"Adventure Session",imageUrl:"https://invalid-url-that-will-404.com/image.png",messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:"https://invalid-url-that-will-404.com/avatar.png"},{name:"Bob",avatarUrl:c}]}},_={args:{title:"Session without Message Count",imageUrl:m,characterAvatars:[{name:"Alice",avatarUrl:n}]}},P={args:{...a.args,title:"Group Session",characterAvatars:[{name:"Alice",avatarUrl:n},{name:"Bob",avatarUrl:c},{name:"Charlie",avatarUrl:v},{name:"Diana",avatarUrl:nt},{name:"Eve"}]}},B={args:{...a.args,title:"Loading Characters...",areCharactersLoading:!0,characterAvatars:[]}},R={args:{...a.args,isDisabled:!0}},I={args:{...a.args,title:"The Exceptionally Long Session Title That Should Be Truncated After Two Lines"}},V={args:{...a.args,actions:[{icon:Se,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:et,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:at,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"},{icon:st,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},W={args:{...a.args,title:"Epic Campaign",messageCount:12345}},O={args:{...a.args,title:"Fantasy Adventure",tags:["Fantasy","Adventure","RPG"]}},F={args:{...a.args,title:"Multi-Genre Session",tags:["Fantasy","Sci-Fi","Horror","Mystery","Romance"]}},q={args:{...a.args,title:"Quick Session",tags:["Casual"]}},G={args:{...a.args,title:"Epic Quest",summary:"An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom from ancient evil."}},H={args:{...a.args,title:"Mystery Manor",tags:["Mystery","Horror","Detective"],summary:"Investigate the haunted manor and uncover dark secrets hidden within its walls."}},$={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(i,{title:"Adventure in Wonderland",imageUrl:m,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:n},{name:"Bob",avatarUrl:c}]}),e.jsx(i,{title:"Mystery Investigation",imageUrl:h,messageCount:128,badges:[{label:"SESSION",icon:e.jsx(t,{size:12})}],characterAvatars:[{name:"Detective",avatarUrl:v}]}),e.jsx(i,{title:"New Session",messageCount:0,characterAvatars:[]})]})},J={args:{title:"Session with Custom Metadata",imageUrl:m,characterAvatars:[{name:"Alice",avatarUrl:n},{name:"Bob",avatarUrl:c}],renderMetadata:()=>e.jsxs(rt,{children:[e.jsx(ue,{icon:e.jsx(tt,{className:"size-3"}),children:"2 days ago"}),e.jsx(ue,{icon:e.jsx(At,{className:"size-3"}),children:"3 participants"})]})}},Q={args:{title:"Popular Session",imageUrl:h,characterAvatars:[{name:"Alice",avatarUrl:n}],renderMetadata:()=>e.jsxs(rt,{children:[e.jsx(ue,{icon:e.jsx(ge,{className:"size-3"}),children:"4.8 rating"}),e.jsx(ue,{icon:e.jsx(tt,{className:"size-3"}),children:"Last played: 1h ago"})]})}},K={args:{title:"Session with Stats",imageUrl:m,characterAvatars:[{name:"Alice",avatarUrl:n},{name:"Bob",avatarUrl:c},{name:"Charlie",avatarUrl:v}],renderMetadata:()=>e.jsxs("div",{className:"grid grid-cols-3 gap-2 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"156"}),e.jsx("div",{children:"Messages"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"3"}),e.jsx("div",{children:"Characters"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"2h"}),e.jsx("div",{children:"Duration"})]})]})}},X={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(i,{title:"Default Session",imageUrl:m,messageCount:10,characterAvatars:[{name:"Alice",avatarUrl:n}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(i,{title:"Session with Badge",imageUrl:h,messageCount:25,badges:[{label:"SESSION",icon:e.jsx(t,{size:12})}],characterAvatars:[{name:"Bob",avatarUrl:c}]})})]})]})},Y={args:{...a.args},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})],render:()=>e.jsx(g,{})},Z={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(g,{}),e.jsx(g,{}),e.jsx(g,{})]})},ee={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}}},ae={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")}}},se={args:{...a.args,likeCount:1234}},te={args:{...a.args,downloadCount:5678}},re={args:{...a.args,likeCount:1234,downloadCount:5678}},ne={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:1234,downloadCount:5678}},ie={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:1235,downloadCount:5678}},oe={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:2500,downloadCount:12e3,actions:[{icon:Se,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:et,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:st,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},le={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:123456,downloadCount:9876543}},ce={args:{title:"Epic Adventure Campaign",imageUrl:m,messageCount:1523,tags:["Fantasy","Adventure","Epic"],summary:"An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom.",badges:[{label:"SESSION",icon:e.jsx(t,{size:12})},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}],characterAvatars:[{name:"Alice",avatarUrl:n},{name:"Bob",avatarUrl:c},{name:"Charlie",avatarUrl:v}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:2847,downloadCount:15230,actions:[{icon:Se,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:at,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"}]}},de={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(i,{title:"Popular Campaign",imageUrl:m,messageCount:1523,tags:["Popular","Trending"],summary:"A highly popular session loved by many users.",characterAvatars:[{name:"Alice",avatarUrl:n},{name:"Bob",avatarUrl:c}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:12500,downloadCount:45e3}),e.jsx(i,{title:"New Adventure",imageUrl:h,messageCount:42,tags:["New","Fresh"],summary:"A fresh new session just started.",characterAvatars:[{name:"Charlie",avatarUrl:v}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:42,downloadCount:128}),e.jsx(i,{title:"Classic Journey",messageCount:9999,tags:["Classic","Evergreen"],summary:"A timeless classic that has stood the test of time.",characterAvatars:[{name:"Diana",avatarUrl:nt},{name:"Eve"}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:98765,downloadCount:543210})]})};var we,Me,ze;a.parameters={...a.parameters,docs:{...(we=a.parameters)==null?void 0:we.docs,source:{originalSource:`{
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
}`,...(ze=(Me=a.parameters)==null?void 0:Me.docs)==null?void 0:ze.source}}};var Ne,Ue,De;k.parameters={...k.parameters,docs:{...(Ne=k.parameters)==null?void 0:Ne.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'SESSION',
      icon: <Layers size={12} />
    }]
  }
}`,...(De=(Ue=k.parameters)==null?void 0:Ue.docs)==null?void 0:De.source}}};var Te,_e,Pe;b.parameters={...b.parameters,docs:{...(Te=b.parameters)==null?void 0:Te.docs,source:{originalSource:`{
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
}`,...(Pe=(_e=b.parameters)==null?void 0:_e.docs)==null?void 0:Pe.source}}};var Be,Re,Ie;y.parameters={...y.parameters,docs:{...(Be=y.parameters)==null?void 0:Be.docs,source:{originalSource:`{
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
}`,...(Ie=(Re=y.parameters)==null?void 0:Re.docs)==null?void 0:Ie.source}}};var Ve,We,Oe;j.parameters={...j.parameters,docs:{...(Ve=j.parameters)==null?void 0:Ve.docs,source:{originalSource:`{
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
}`,...(Oe=(We=j.parameters)==null?void 0:We.docs)==null?void 0:Oe.source}}};var Fe,qe,Ge;L.parameters={...L.parameters,docs:{...(Fe=L.parameters)==null?void 0:Fe.docs,source:{originalSource:`{
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
}`,...(Ge=(qe=L.parameters)==null?void 0:qe.docs)==null?void 0:Ge.source}}};var He,$e,Je;E.parameters={...E.parameters,docs:{...(He=E.parameters)==null?void 0:He.docs,source:{originalSource:`{
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
}`,...(Je=($e=E.parameters)==null?void 0:$e.docs)==null?void 0:Je.source}}};var Qe,Ke,Xe;w.parameters={...w.parameters,docs:{...(Qe=w.parameters)==null?void 0:Qe.docs,source:{originalSource:`{
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
}`,...(ea=(Ze=M.parameters)==null?void 0:Ze.docs)==null?void 0:ea.source}}};var aa,sa,ta;z.parameters={...z.parameters,docs:{...(aa=z.parameters)==null?void 0:aa.docs,source:{originalSource:`{
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
}`,...(ta=(sa=z.parameters)==null?void 0:sa.docs)==null?void 0:ta.source}}};var ra,na,ia;N.parameters={...N.parameters,docs:{...(ra=N.parameters)==null?void 0:ra.docs,source:{originalSource:`{
  args: {
    title: 'New Adventure',
    imageUrl: SAMPLE_COVER_2,
    messageCount: 0,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(ia=(na=N.parameters)==null?void 0:na.docs)==null?void 0:ia.source}}};var oa,la,ca;U.parameters={...U.parameters,docs:{...(oa=U.parameters)==null?void 0:oa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Just Started',
    messageCount: 1
  }
}`,...(ca=(la=U.parameters)==null?void 0:la.docs)==null?void 0:ca.source}}};var da,ma,ua;D.parameters={...D.parameters,docs:{...(da=D.parameters)==null?void 0:da.docs,source:{originalSource:`{
  args: {
    title: 'Mystery Session',
    messageCount: 15,
    characterAvatars: [{
      name: 'Unknown',
      avatarUrl: undefined
    }]
  }
}`,...(ua=(ma=D.parameters)==null?void 0:ma.docs)==null?void 0:ua.source}}};var ga,pa,ha;T.parameters={...T.parameters,docs:{...(ga=T.parameters)==null?void 0:ga.docs,source:{originalSource:`{
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
}`,...(ha=(pa=T.parameters)==null?void 0:pa.docs)==null?void 0:ha.source}}};var va,xa,Sa;_.parameters={..._.parameters,docs:{...(va=_.parameters)==null?void 0:va.docs,source:{originalSource:`{
  args: {
    title: 'Session without Message Count',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(Sa=(xa=_.parameters)==null?void 0:xa.docs)==null?void 0:Sa.source}}};var Aa,fa,Ca;P.parameters={...P.parameters,docs:{...(Aa=P.parameters)==null?void 0:Aa.docs,source:{originalSource:`{
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
}`,...(Ca=(fa=P.parameters)==null?void 0:fa.docs)==null?void 0:Ca.source}}};var ka,ba,ya;B.parameters={...B.parameters,docs:{...(ka=B.parameters)==null?void 0:ka.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Loading Characters...',
    areCharactersLoading: true,
    characterAvatars: []
  }
}`,...(ya=(ba=B.parameters)==null?void 0:ba.docs)==null?void 0:ya.source}}};var ja,La,Ea;R.parameters={...R.parameters,docs:{...(ja=R.parameters)==null?void 0:ja.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(Ea=(La=R.parameters)==null?void 0:La.docs)==null?void 0:Ea.source}}};var wa,Ma,za;I.parameters={...I.parameters,docs:{...(wa=I.parameters)==null?void 0:wa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'The Exceptionally Long Session Title That Should Be Truncated After Two Lines'
  }
}`,...(za=(Ma=I.parameters)==null?void 0:Ma.docs)==null?void 0:za.source}}};var Na,Ua,Da;V.parameters={...V.parameters,docs:{...(Na=V.parameters)==null?void 0:Na.docs,source:{originalSource:`{
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
}`,...(Da=(Ua=V.parameters)==null?void 0:Ua.docs)==null?void 0:Da.source}}};var Ta,_a,Pa;W.parameters={...W.parameters,docs:{...(Ta=W.parameters)==null?void 0:Ta.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Campaign',
    messageCount: 12345
  }
}`,...(Pa=(_a=W.parameters)==null?void 0:_a.docs)==null?void 0:Pa.source}}};var Ba,Ra,Ia;O.parameters={...O.parameters,docs:{...(Ba=O.parameters)==null?void 0:Ba.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Fantasy Adventure',
    tags: ['Fantasy', 'Adventure', 'RPG']
  }
}`,...(Ia=(Ra=O.parameters)==null?void 0:Ra.docs)==null?void 0:Ia.source}}};var Va,Wa,Oa;F.parameters={...F.parameters,docs:{...(Va=F.parameters)==null?void 0:Va.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Multi-Genre Session',
    tags: ['Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Romance']
  }
}`,...(Oa=(Wa=F.parameters)==null?void 0:Wa.docs)==null?void 0:Oa.source}}};var Fa,qa,Ga;q.parameters={...q.parameters,docs:{...(Fa=q.parameters)==null?void 0:Fa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Quick Session',
    tags: ['Casual']
  }
}`,...(Ga=(qa=q.parameters)==null?void 0:qa.docs)==null?void 0:Ga.source}}};var Ha,$a,Ja;G.parameters={...G.parameters,docs:{...(Ha=G.parameters)==null?void 0:Ha.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Quest',
    summary: 'An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom from ancient evil.'
  }
}`,...(Ja=($a=G.parameters)==null?void 0:$a.docs)==null?void 0:Ja.source}}};var Qa,Ka,Xa;H.parameters={...H.parameters,docs:{...(Qa=H.parameters)==null?void 0:Qa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Mystery Manor',
    tags: ['Mystery', 'Horror', 'Detective'],
    summary: 'Investigate the haunted manor and uncover dark secrets hidden within its walls.'
  }
}`,...(Xa=(Ka=H.parameters)==null?void 0:Ka.docs)==null?void 0:Xa.source}}};var Ya,Za,es;$.parameters={...$.parameters,docs:{...(Ya=$.parameters)==null?void 0:Ya.docs,source:{originalSource:`{
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
}`,...(es=(Za=$.parameters)==null?void 0:Za.docs)==null?void 0:es.source}}};var as,ss,ts;J.parameters={...J.parameters,docs:{...(as=J.parameters)==null?void 0:as.docs,source:{originalSource:`{
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
}`,...(ts=(ss=J.parameters)==null?void 0:ss.docs)==null?void 0:ts.source}}};var rs,ns,is;Q.parameters={...Q.parameters,docs:{...(rs=Q.parameters)==null?void 0:rs.docs,source:{originalSource:`{
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
}`,...(is=(ns=Q.parameters)==null?void 0:ns.docs)==null?void 0:is.source}}};var os,ls,cs;K.parameters={...K.parameters,docs:{...(os=K.parameters)==null?void 0:os.docs,source:{originalSource:`{
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
}`,...(cs=(ls=K.parameters)==null?void 0:ls.docs)==null?void 0:cs.source}}};var ds,ms,us;X.parameters={...X.parameters,docs:{...(ds=X.parameters)==null?void 0:ds.docs,source:{originalSource:`{
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
}`,...(us=(ms=X.parameters)==null?void 0:ms.docs)==null?void 0:us.source}}};var gs,ps,hs;Y.parameters={...Y.parameters,docs:{...(gs=Y.parameters)==null?void 0:gs.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '320px'
  }}>
        <Story />
      </div>],
  render: () => <SessionCardSkeleton />
}`,...(hs=(ps=Y.parameters)==null?void 0:ps.docs)==null?void 0:hs.source}}};var vs,xs,Ss;Z.parameters={...Z.parameters,docs:{...(vs=Z.parameters)==null?void 0:vs.docs,source:{originalSource:`{
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
}`,...(Ss=(xs=Z.parameters)==null?void 0:xs.docs)==null?void 0:Ss.source}}};var As,fs,Cs;ee.parameters={...ee.parameters,docs:{...(As=ee.parameters)==null?void 0:As.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }
  }
}`,...(Cs=(fs=ee.parameters)==null?void 0:fs.docs)==null?void 0:Cs.source}}};var ks,bs,ys;ae.parameters={...ae.parameters,docs:{...(ks=ae.parameters)==null?void 0:ks.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    }
  }
}`,...(ys=(bs=ae.parameters)==null?void 0:bs.docs)==null?void 0:ys.source}}};var js,Ls,Es;se.parameters={...se.parameters,docs:{...(js=se.parameters)==null?void 0:js.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234
  }
}`,...(Es=(Ls=se.parameters)==null?void 0:Ls.docs)==null?void 0:Es.source}}};var ws,Ms,zs;te.parameters={...te.parameters,docs:{...(ws=te.parameters)==null?void 0:ws.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    downloadCount: 5678
  }
}`,...(zs=(Ms=te.parameters)==null?void 0:Ms.docs)==null?void 0:zs.source}}};var Ns,Us,Ds;re.parameters={...re.parameters,docs:{...(Ns=re.parameters)==null?void 0:Ns.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Ds=(Us=re.parameters)==null?void 0:Us.docs)==null?void 0:Ds.source}}};var Ts,_s,Ps;ne.parameters={...ne.parameters,docs:{...(Ts=ne.parameters)==null?void 0:Ts.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    },
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Ps=(_s=ne.parameters)==null?void 0:_s.docs)==null?void 0:Ps.source}}};var Bs,Rs,Is;ie.parameters={...ie.parameters,docs:{...(Bs=ie.parameters)==null?void 0:Bs.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 1235,
    downloadCount: 5678
  }
}`,...(Is=(Rs=ie.parameters)==null?void 0:Rs.docs)==null?void 0:Is.source}}};var Vs,Ws,Os;oe.parameters={...oe.parameters,docs:{...(Vs=oe.parameters)==null?void 0:Vs.docs,source:{originalSource:`{
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
}`,...(Os=(Ws=oe.parameters)==null?void 0:Ws.docs)==null?void 0:Os.source}}};var Fs,qs,Gs;le.parameters={...le.parameters,docs:{...(Fs=le.parameters)==null?void 0:Fs.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 123456,
    downloadCount: 9876543
  }
}`,...(Gs=(qs=le.parameters)==null?void 0:qs.docs)==null?void 0:Gs.source}}};var Hs,$s,Js;ce.parameters={...ce.parameters,docs:{...(Hs=ce.parameters)==null?void 0:Hs.docs,source:{originalSource:`{
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
}`,...(Js=($s=ce.parameters)==null?void 0:$s.docs)==null?void 0:Js.source}}};var Qs,Ks,Xs;de.parameters={...de.parameters,docs:{...(Qs=de.parameters)==null?void 0:Qs.docs,source:{originalSource:`{
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
}`,...(Xs=(Ks=de.parameters)==null?void 0:Ks.docs)==null?void 0:Xs.source}}};const Ut=["Default","WithBadges","WithMultipleBadges","WithAllBadgeVariants","WithBadgesLeftAndRight","WithMultipleBadgesEachSide","ManyBadgesLeft","ManyBadgesRight","ManyBadgesBothSides","LongBadgeLabels","NewSession","SingleMessage","WithoutImage","ImageError","WithoutMessageCount","ManyAvatars","LoadingAvatars","Disabled","LongTitle","WithActions","HighMessageCount","WithTags","WithManyTags","WithSingleTag","WithSummary","WithTagsAndSummary","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid","WithLikeButton","WithLikeButtonLiked","WithLikeCount","WithDownloadCount","WithPopularityStats","WithLikeButtonAndStats","WithLikeButtonLikedAndStats","WithLikeButtonAndActions","HighPopularityCounts","FullFeatured","GridLayoutWithPopularity"];export{X as AllStates,J as CustomMetadata,a as Default,R as Disabled,ce as FullFeatured,K as FullyCustomMetadata,$ as GridLayout,de as GridLayoutWithPopularity,W as HighMessageCount,le as HighPopularityCounts,T as ImageError,B as LoadingAvatars,z as LongBadgeLabels,I as LongTitle,P as ManyAvatars,M as ManyBadgesBothSides,E as ManyBadgesLeft,w as ManyBadgesRight,Q as MetadataWithIcons,N as NewSession,U as SingleMessage,Y as Skeleton,Z as SkeletonGrid,V as WithActions,y as WithAllBadgeVariants,k as WithBadges,j as WithBadgesLeftAndRight,te as WithDownloadCount,ee as WithLikeButton,oe as WithLikeButtonAndActions,ne as WithLikeButtonAndStats,ae as WithLikeButtonLiked,ie as WithLikeButtonLikedAndStats,se as WithLikeCount,F as WithManyTags,b as WithMultipleBadges,L as WithMultipleBadgesEachSide,re as WithPopularityStats,q as WithSingleTag,G as WithSummary,O as WithTags,H as WithTagsAndSummary,D as WithoutImage,_ as WithoutMessageCount,Ut as __namedExportsOrder,Nt as default};
