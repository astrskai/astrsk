import{r as de,j as e}from"./iframe-CHvyI5Jn.js";import{c as Ys}from"./utils-DuMXYCiK.js";import{B as Zs,C as ct,a as dt,b as Ee,c as mt,d as ut,e as gt,S as xe,f as et,D as at,T as st,L as t,g as tt}from"./CardPopularityStats-BjwFZc0-.js";import{S as d}from"./Skeleton-DZHat7JU.js";import{L as o}from"./lock-BtvGNWIB.js";import{U as p}from"./user-D3p8tKL5.js";import{S as ue,U as pt}from"./users-CQ0u1g8G.js";import"./preload-helper-CwRszBsw.js";import"./createLucideIcon-DhpHCYSY.js";function ht({name:s,avatarUrl:c}){const[u,x]=de.useState(!1);de.useEffect(()=>{x(!1)},[c]);const ge=c&&!u;return e.jsx("div",{className:"flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-900 bg-zinc-700",title:s,children:ge?e.jsx("img",{src:c,alt:s,className:"h-full w-full object-cover",onError:()=>x(!0)}):e.jsx("span",{className:"text-[10px] text-zinc-400",children:s.charAt(0).toUpperCase()||"?"})})}function ve(){return e.jsx("div",{className:"h-8 w-8 animate-pulse rounded-full border-2 border-zinc-900 bg-zinc-700"})}function vt({className:s}){return e.jsx("svg",{className:s,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})})}const rt=ut,me=gt;function i({title:s,imageUrl:c,messageCount:u,actions:x=[],className:ge,isDisabled:Se=!1,onClick:Ae,characterAvatars:S=[],areCharactersLoading:Ce=!1,badges:A=[],renderMetadata:fe,tags:C=[],summary:ke,likeButton:pe,likeCount:be,downloadCount:ye,imageSizes:it}){const[je,Le]=de.useState(!1);de.useEffect(()=>{Le(!1)},[c]);const ot=c&&!je,lt=c&&je;return e.jsxs(Zs,{className:Ys("min-h-[320px] w-full border-zinc-700 ring-1 ring-zinc-800",!Se&&Ae&&"hover:ring-zinc-600",ge),isDisabled:Se,onClick:Ae,children:[e.jsxs("div",{className:"relative h-48 overflow-hidden bg-zinc-800",children:[ot?e.jsxs(e.Fragment,{children:[e.jsx("img",{src:c,alt:s,sizes:it,className:"absolute inset-0 h-full w-full object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90",loading:"lazy",onError:()=>Le(!0)}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"})]}):lt?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"absolute inset-0 flex items-center justify-center",children:e.jsx("span",{className:"text-6xl font-bold text-zinc-500",children:s.charAt(0).toUpperCase()||"?"})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"absolute inset-0 bg-zinc-800",children:e.jsx("div",{className:"absolute inset-0 opacity-20",style:{backgroundImage:"radial-gradient(#4f46e5 1px, transparent 1px)",backgroundSize:"16px 16px"}})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"})]}),pe&&e.jsx("div",{className:"absolute top-2 right-2 z-20",children:e.jsx(ct,{...pe})}),e.jsx(dt,{actions:x,className:pe?"top-12":void 0}),A.some(n=>(n.position??"left")==="left")&&e.jsx("div",{className:"absolute top-3 left-3 z-10 max-w-[45%]",children:e.jsx(Ee,{badges:A,position:"left"})}),A.some(n=>n.position==="right")&&e.jsx("div",{className:"absolute top-3 right-3 z-10 max-w-[45%]",children:e.jsx(Ee,{badges:A,position:"right"})}),e.jsx("div",{className:"absolute bottom-0 left-0 w-full p-5",children:e.jsx("h2",{className:"line-clamp-2 text-xl md:text-2xl leading-tight font-bold text-ellipsis text-white",children:s})})]}),e.jsx("div",{className:"flex flex-grow flex-col justify-between p-5",children:e.jsxs("div",{className:"space-y-2 md:space-y-3",children:[C.length>0&&e.jsxs("div",{className:"flex flex-wrap gap-2",children:[C.slice(0,3).map((n,he)=>e.jsx("span",{className:"rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",children:n},`${n}-${he}`)),C.length>3&&e.jsxs("span",{className:"rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",children:["+",C.length-3]})]}),ke&&e.jsx("p",{className:"line-clamp-2 text-xs leading-relaxed break-all text-ellipsis text-zinc-400",children:ke}),(be!==void 0||ye!==void 0)&&e.jsx(mt,{likeCount:be,downloadCount:ye}),fe?fe():u!==void 0&&e.jsx("div",{className:"flex items-center justify-between text-sm",children:u===0?e.jsx("span",{className:"text-zinc-400",children:"New session"}):e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(vt,{className:"h-4 w-4 text-zinc-400"}),e.jsx("span",{className:"font-semibold text-zinc-300",children:u.toLocaleString()}),e.jsx("span",{className:"text-zinc-400",children:u===1?"Message":"Messages"})]})}),(Ce||S.length>0)&&e.jsx("div",{className:"border-t border-zinc-800 pt-3",children:Ce?e.jsxs("div",{className:"flex -space-x-2",children:[e.jsx(ve,{}),e.jsx(ve,{}),e.jsx(ve,{})]}):e.jsxs("div",{className:"flex -space-x-2",children:[S.slice(0,3).map((n,he)=>e.jsx(ht,{name:n.name,avatarUrl:n.avatarUrl},`${n.name}-${he}`)),S.length>3&&e.jsxs("div",{className:"flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 text-[10px] text-zinc-400",children:["+",S.length-3]})]})})]})})]})}i.__docgenInfo={description:"",methods:[],displayName:"SessionCard",props:{title:{required:!0,tsType:{name:"string"},description:"Session title"},imageUrl:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Cover image URL"},messageCount:{required:!1,tsType:{name:"number"},description:"Number of messages in the session (used in default metadata)"},actions:{required:!1,tsType:{name:"Array",elements:[{name:"CardAction"}],raw:"CardAction[]"},description:"Action buttons displayed on the card",defaultValue:{value:"[]",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"},isDisabled:{required:!1,tsType:{name:"boolean"},description:"Whether the card is disabled",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Click handler for the card"},characterAvatars:{required:!1,tsType:{name:"Array",elements:[{name:"CharacterAvatar"}],raw:"CharacterAvatar[]"},description:"Character avatars to display",defaultValue:{value:"[]",computed:!1}},areCharactersLoading:{required:!1,tsType:{name:"boolean"},description:"Whether characters are loading",defaultValue:{value:"false",computed:!1}},badges:{required:!1,tsType:{name:"Array",elements:[{name:"CardBadge"}],raw:"CardBadge[]"},description:"Badges to display on the card (e.g., type indicator, private, owner).",defaultValue:{value:"[]",computed:!1}},renderMetadata:{required:!1,tsType:{name:"signature",type:"function",raw:"() => React.ReactNode",signature:{arguments:[],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:`Custom render function for the metadata section.
When provided, replaces the default messageCount display.
Use CardMetadataContainer and CardMetadataItem for consistent styling.`},tags:{required:!1,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"Tags to display on the card",defaultValue:{value:"[]",computed:!1}},summary:{required:!1,tsType:{name:"string"},description:"Session summary/description"},likeButton:{required:!1,tsType:{name:"LikeButtonProps"},description:"Like button configuration (displays in top-right corner)"},likeCount:{required:!1,tsType:{name:"number"},description:"Like count to display in popularity stats"},downloadCount:{required:!1,tsType:{name:"number"},description:"Download count to display in popularity stats"},imageSizes:{required:!1,tsType:{name:"string"},description:`The sizes attribute for the image element.
Helps browser select appropriate image size for responsive loading.
@example "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"`}}};function g({className:s}){return e.jsxs(Zs,{className:Ys("min-h-[320px] w-full border-zinc-700 ring-1 ring-zinc-800",s),isDisabled:!0,children:[e.jsxs("div",{className:"relative h-48 overflow-hidden bg-zinc-800",children:[e.jsx(d,{className:"absolute inset-0 h-full w-full",variant:"default"}),e.jsxs("div",{className:"absolute bottom-0 left-0 w-full p-5",children:[e.jsx(d,{className:"mb-2 h-7 w-3/4"}),e.jsx(d,{className:"h-7 w-1/2"})]})]}),e.jsx("div",{className:"flex flex-grow flex-col justify-between p-5",children:e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"flex items-center justify-between border-b border-zinc-800 pb-2",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(d,{className:"size-4",variant:"circular"}),e.jsx(d,{className:"h-4 w-20"})]})}),e.jsxs("div",{className:"flex -space-x-2 pt-1",children:[e.jsx(d,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(d,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(d,{className:"size-8 border-2 border-zinc-900",variant:"circular"})]})]})})]})}g.displayName="SessionCardSkeleton";g.__docgenInfo={description:`SessionCardSkeleton Component

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
\`\`\``,methods:[],displayName:"SessionCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};const Lt={title:"Content/SessionCard",component:i,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{title:{control:"text",description:"Session title"},imageUrl:{control:"text",description:"Cover image URL"},messageCount:{control:"number",description:"Number of messages in the session (optional - if undefined, message count section is hidden)"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},badges:{control:"object",description:"Badges to display on the card"},areCharactersLoading:{control:"boolean",description:"Whether characters are loading"},tags:{control:"object",description:"Tags to display on the card"},summary:{control:"text",description:"Session summary/description"},onClick:{action:"clicked"}},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})]},m="https://picsum.photos/seed/session1/600/400",h="https://picsum.photos/seed/session2/600/400",r="https://picsum.photos/seed/avatar1/100/100",l="https://picsum.photos/seed/avatar2/100/100",v="https://picsum.photos/seed/avatar3/100/100",nt="https://picsum.photos/seed/avatar4/100/100",a={args:{title:"Adventure in Wonderland",imageUrl:m,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:l}]}},f={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12})}]}},k={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12})},{label:"Private",variant:"private",icon:e.jsx(o,{size:12})}]}},b={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12})},{label:"Private",variant:"private",icon:e.jsx(o,{size:12})},{label:"Mine",variant:"owner",icon:e.jsx(p,{size:12})}]}},y={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(o,{size:12}),position:"right"}]}},j={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(p,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(o,{size:12}),position:"right"}]}},L={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(p,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(o,{size:12}),position:"left"},{label:"Featured",icon:e.jsx(ue,{size:12}),position:"left"}]}},E={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(o,{size:12}),position:"right"},{label:"Mine",variant:"owner",icon:e.jsx(p,{size:12}),position:"right"},{label:"Featured",icon:e.jsx(ue,{size:12}),position:"right"}]}},w={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(t,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(p,{size:12}),position:"left"},{label:"Featured",icon:e.jsx(ue,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(o,{size:12}),position:"right"},{label:"VIP",icon:e.jsx(p,{size:12}),position:"right"},{label:"New",position:"right"}]}},M={args:{...a.args,badges:[{label:"Very Long Session Label",icon:e.jsx(t,{size:12}),position:"left"},{label:"Extended Private Mode",variant:"private",icon:e.jsx(o,{size:12}),position:"right"}]}},z={args:{title:"New Adventure",imageUrl:h,messageCount:0,characterAvatars:[{name:"Alice",avatarUrl:r}]}},N={args:{...a.args,title:"Just Started",messageCount:1}},U={args:{title:"Mystery Session",messageCount:15,characterAvatars:[{name:"Unknown",avatarUrl:void 0}]}},D={args:{title:"Adventure Session",imageUrl:"https://invalid-url-that-will-404.com/image.png",messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:"https://invalid-url-that-will-404.com/avatar.png"},{name:"Bob",avatarUrl:l}]}},_={args:{title:"Session without Message Count",imageUrl:m,characterAvatars:[{name:"Alice",avatarUrl:r}]}},T={args:{...a.args,title:"Group Session",characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:l},{name:"Charlie",avatarUrl:v},{name:"Diana",avatarUrl:nt},{name:"Eve"}]}},B={args:{...a.args,title:"Loading Characters...",areCharactersLoading:!0,characterAvatars:[]}},P={args:{...a.args,isDisabled:!0}},R={args:{...a.args,title:"The Exceptionally Long Session Title That Should Be Truncated After Two Lines"}},V={args:{...a.args,actions:[{icon:xe,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:et,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:at,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"},{icon:st,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},I={args:{...a.args,title:"Epic Campaign",messageCount:12345}},W={args:{...a.args,title:"Fantasy Adventure",tags:["Fantasy","Adventure","RPG"]}},O={args:{...a.args,title:"Multi-Genre Session",tags:["Fantasy","Sci-Fi","Horror","Mystery","Romance"]}},F={args:{...a.args,title:"Quick Session",tags:["Casual"]}},q={args:{...a.args,title:"Epic Quest",summary:"An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom from ancient evil."}},G={args:{...a.args,title:"Mystery Manor",tags:["Mystery","Horror","Detective"],summary:"Investigate the haunted manor and uncover dark secrets hidden within its walls."}},H={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(i,{title:"Adventure in Wonderland",imageUrl:m,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:l}]}),e.jsx(i,{title:"Mystery Investigation",imageUrl:h,messageCount:128,badges:[{label:"SESSION",icon:e.jsx(t,{size:12})}],characterAvatars:[{name:"Detective",avatarUrl:v}]}),e.jsx(i,{title:"New Session",messageCount:0,characterAvatars:[]})]})},$={args:{title:"Session with Custom Metadata",imageUrl:m,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:l}],renderMetadata:()=>e.jsxs(rt,{children:[e.jsx(me,{icon:e.jsx(tt,{className:"size-3"}),children:"2 days ago"}),e.jsx(me,{icon:e.jsx(pt,{className:"size-3"}),children:"3 participants"})]})}},J={args:{title:"Popular Session",imageUrl:h,characterAvatars:[{name:"Alice",avatarUrl:r}],renderMetadata:()=>e.jsxs(rt,{children:[e.jsx(me,{icon:e.jsx(ue,{className:"size-3"}),children:"4.8 rating"}),e.jsx(me,{icon:e.jsx(tt,{className:"size-3"}),children:"Last played: 1h ago"})]})}},Q={args:{title:"Session with Stats",imageUrl:m,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:l},{name:"Charlie",avatarUrl:v}],renderMetadata:()=>e.jsxs("div",{className:"grid grid-cols-3 gap-2 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"156"}),e.jsx("div",{children:"Messages"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"3"}),e.jsx("div",{children:"Characters"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"2h"}),e.jsx("div",{children:"Duration"})]})]})}},K={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(i,{title:"Default Session",imageUrl:m,messageCount:10,characterAvatars:[{name:"Alice",avatarUrl:r}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(i,{title:"Session with Badge",imageUrl:h,messageCount:25,badges:[{label:"SESSION",icon:e.jsx(t,{size:12})}],characterAvatars:[{name:"Bob",avatarUrl:l}]})})]})]})},X={args:{...a.args},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})],render:()=>e.jsx(g,{})},Y={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(g,{}),e.jsx(g,{}),e.jsx(g,{})]})},Z={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}}},ee={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")}}},ae={args:{...a.args,likeCount:1234}},se={args:{...a.args,downloadCount:5678}},te={args:{...a.args,likeCount:1234,downloadCount:5678}},re={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:1234,downloadCount:5678}},ne={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:1235,downloadCount:5678}},ie={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:2500,downloadCount:12e3,actions:[{icon:xe,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:et,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:st,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},oe={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:123456,downloadCount:9876543}},le={args:{title:"Epic Adventure Campaign",imageUrl:m,messageCount:1523,tags:["Fantasy","Adventure","Epic"],summary:"An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom.",badges:[{label:"SESSION",icon:e.jsx(t,{size:12})},{label:"Private",variant:"private",icon:e.jsx(o,{size:12}),position:"right"}],characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:l},{name:"Charlie",avatarUrl:v}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:2847,downloadCount:15230,actions:[{icon:xe,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:at,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"}]}},ce={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(i,{title:"Popular Campaign",imageUrl:m,messageCount:1523,tags:["Popular","Trending"],summary:"A highly popular session loved by many users.",characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:l}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:12500,downloadCount:45e3}),e.jsx(i,{title:"New Adventure",imageUrl:h,messageCount:42,tags:["New","Fresh"],summary:"A fresh new session just started.",characterAvatars:[{name:"Charlie",avatarUrl:v}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:42,downloadCount:128}),e.jsx(i,{title:"Classic Journey",messageCount:9999,tags:["Classic","Evergreen"],summary:"A timeless classic that has stood the test of time.",characterAvatars:[{name:"Diana",avatarUrl:nt},{name:"Eve"}],likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:98765,downloadCount:543210})]})};var we,Me,ze;a.parameters={...a.parameters,docs:{...(we=a.parameters)==null?void 0:we.docs,source:{originalSource:`{
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
}`,...(ze=(Me=a.parameters)==null?void 0:Me.docs)==null?void 0:ze.source}}};var Ne,Ue,De;f.parameters={...f.parameters,docs:{...(Ne=f.parameters)==null?void 0:Ne.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'SESSION',
      icon: <Layers size={12} />
    }]
  }
}`,...(De=(Ue=f.parameters)==null?void 0:Ue.docs)==null?void 0:De.source}}};var _e,Te,Be;k.parameters={...k.parameters,docs:{...(_e=k.parameters)==null?void 0:_e.docs,source:{originalSource:`{
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
}`,...(Be=(Te=k.parameters)==null?void 0:Te.docs)==null?void 0:Be.source}}};var Pe,Re,Ve;b.parameters={...b.parameters,docs:{...(Pe=b.parameters)==null?void 0:Pe.docs,source:{originalSource:`{
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
}`,...(Ve=(Re=b.parameters)==null?void 0:Re.docs)==null?void 0:Ve.source}}};var Ie,We,Oe;y.parameters={...y.parameters,docs:{...(Ie=y.parameters)==null?void 0:Ie.docs,source:{originalSource:`{
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
}`,...(Oe=(We=y.parameters)==null?void 0:We.docs)==null?void 0:Oe.source}}};var Fe,qe,Ge;j.parameters={...j.parameters,docs:{...(Fe=j.parameters)==null?void 0:Fe.docs,source:{originalSource:`{
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
}`,...(Ge=(qe=j.parameters)==null?void 0:qe.docs)==null?void 0:Ge.source}}};var He,$e,Je;L.parameters={...L.parameters,docs:{...(He=L.parameters)==null?void 0:He.docs,source:{originalSource:`{
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
}`,...(Je=($e=L.parameters)==null?void 0:$e.docs)==null?void 0:Je.source}}};var Qe,Ke,Xe;E.parameters={...E.parameters,docs:{...(Qe=E.parameters)==null?void 0:Qe.docs,source:{originalSource:`{
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
}`,...(Xe=(Ke=E.parameters)==null?void 0:Ke.docs)==null?void 0:Xe.source}}};var Ye,Ze,ea;w.parameters={...w.parameters,docs:{...(Ye=w.parameters)==null?void 0:Ye.docs,source:{originalSource:`{
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
}`,...(ea=(Ze=w.parameters)==null?void 0:Ze.docs)==null?void 0:ea.source}}};var aa,sa,ta;M.parameters={...M.parameters,docs:{...(aa=M.parameters)==null?void 0:aa.docs,source:{originalSource:`{
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
}`,...(ta=(sa=M.parameters)==null?void 0:sa.docs)==null?void 0:ta.source}}};var ra,na,ia;z.parameters={...z.parameters,docs:{...(ra=z.parameters)==null?void 0:ra.docs,source:{originalSource:`{
  args: {
    title: 'New Adventure',
    imageUrl: SAMPLE_COVER_2,
    messageCount: 0,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(ia=(na=z.parameters)==null?void 0:na.docs)==null?void 0:ia.source}}};var oa,la,ca;N.parameters={...N.parameters,docs:{...(oa=N.parameters)==null?void 0:oa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Just Started',
    messageCount: 1
  }
}`,...(ca=(la=N.parameters)==null?void 0:la.docs)==null?void 0:ca.source}}};var da,ma,ua;U.parameters={...U.parameters,docs:{...(da=U.parameters)==null?void 0:da.docs,source:{originalSource:`{
  args: {
    title: 'Mystery Session',
    messageCount: 15,
    characterAvatars: [{
      name: 'Unknown',
      avatarUrl: undefined
    }]
  }
}`,...(ua=(ma=U.parameters)==null?void 0:ma.docs)==null?void 0:ua.source}}};var ga,pa,ha;D.parameters={...D.parameters,docs:{...(ga=D.parameters)==null?void 0:ga.docs,source:{originalSource:`{
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
}`,...(ha=(pa=D.parameters)==null?void 0:pa.docs)==null?void 0:ha.source}}};var va,xa,Sa;_.parameters={..._.parameters,docs:{...(va=_.parameters)==null?void 0:va.docs,source:{originalSource:`{
  args: {
    title: 'Session without Message Count',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(Sa=(xa=_.parameters)==null?void 0:xa.docs)==null?void 0:Sa.source}}};var Aa,Ca,fa;T.parameters={...T.parameters,docs:{...(Aa=T.parameters)==null?void 0:Aa.docs,source:{originalSource:`{
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
}`,...(fa=(Ca=T.parameters)==null?void 0:Ca.docs)==null?void 0:fa.source}}};var ka,ba,ya;B.parameters={...B.parameters,docs:{...(ka=B.parameters)==null?void 0:ka.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Loading Characters...',
    areCharactersLoading: true,
    characterAvatars: []
  }
}`,...(ya=(ba=B.parameters)==null?void 0:ba.docs)==null?void 0:ya.source}}};var ja,La,Ea;P.parameters={...P.parameters,docs:{...(ja=P.parameters)==null?void 0:ja.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(Ea=(La=P.parameters)==null?void 0:La.docs)==null?void 0:Ea.source}}};var wa,Ma,za;R.parameters={...R.parameters,docs:{...(wa=R.parameters)==null?void 0:wa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'The Exceptionally Long Session Title That Should Be Truncated After Two Lines'
  }
}`,...(za=(Ma=R.parameters)==null?void 0:Ma.docs)==null?void 0:za.source}}};var Na,Ua,Da;V.parameters={...V.parameters,docs:{...(Na=V.parameters)==null?void 0:Na.docs,source:{originalSource:`{
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
}`,...(Da=(Ua=V.parameters)==null?void 0:Ua.docs)==null?void 0:Da.source}}};var _a,Ta,Ba;I.parameters={...I.parameters,docs:{...(_a=I.parameters)==null?void 0:_a.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Campaign',
    messageCount: 12345
  }
}`,...(Ba=(Ta=I.parameters)==null?void 0:Ta.docs)==null?void 0:Ba.source}}};var Pa,Ra,Va;W.parameters={...W.parameters,docs:{...(Pa=W.parameters)==null?void 0:Pa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Fantasy Adventure',
    tags: ['Fantasy', 'Adventure', 'RPG']
  }
}`,...(Va=(Ra=W.parameters)==null?void 0:Ra.docs)==null?void 0:Va.source}}};var Ia,Wa,Oa;O.parameters={...O.parameters,docs:{...(Ia=O.parameters)==null?void 0:Ia.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Multi-Genre Session',
    tags: ['Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Romance']
  }
}`,...(Oa=(Wa=O.parameters)==null?void 0:Wa.docs)==null?void 0:Oa.source}}};var Fa,qa,Ga;F.parameters={...F.parameters,docs:{...(Fa=F.parameters)==null?void 0:Fa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Quick Session',
    tags: ['Casual']
  }
}`,...(Ga=(qa=F.parameters)==null?void 0:qa.docs)==null?void 0:Ga.source}}};var Ha,$a,Ja;q.parameters={...q.parameters,docs:{...(Ha=q.parameters)==null?void 0:Ha.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Quest',
    summary: 'An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom from ancient evil.'
  }
}`,...(Ja=($a=q.parameters)==null?void 0:$a.docs)==null?void 0:Ja.source}}};var Qa,Ka,Xa;G.parameters={...G.parameters,docs:{...(Qa=G.parameters)==null?void 0:Qa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Mystery Manor',
    tags: ['Mystery', 'Horror', 'Detective'],
    summary: 'Investigate the haunted manor and uncover dark secrets hidden within its walls.'
  }
}`,...(Xa=(Ka=G.parameters)==null?void 0:Ka.docs)==null?void 0:Xa.source}}};var Ya,Za,es;H.parameters={...H.parameters,docs:{...(Ya=H.parameters)==null?void 0:Ya.docs,source:{originalSource:`{
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
}`,...(es=(Za=H.parameters)==null?void 0:Za.docs)==null?void 0:es.source}}};var as,ss,ts;$.parameters={...$.parameters,docs:{...(as=$.parameters)==null?void 0:as.docs,source:{originalSource:`{
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
}`,...(ts=(ss=$.parameters)==null?void 0:ss.docs)==null?void 0:ts.source}}};var rs,ns,is;J.parameters={...J.parameters,docs:{...(rs=J.parameters)==null?void 0:rs.docs,source:{originalSource:`{
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
}`,...(is=(ns=J.parameters)==null?void 0:ns.docs)==null?void 0:is.source}}};var os,ls,cs;Q.parameters={...Q.parameters,docs:{...(os=Q.parameters)==null?void 0:os.docs,source:{originalSource:`{
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
}`,...(cs=(ls=Q.parameters)==null?void 0:ls.docs)==null?void 0:cs.source}}};var ds,ms,us;K.parameters={...K.parameters,docs:{...(ds=K.parameters)==null?void 0:ds.docs,source:{originalSource:`{
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
}`,...(us=(ms=K.parameters)==null?void 0:ms.docs)==null?void 0:us.source}}};var gs,ps,hs;X.parameters={...X.parameters,docs:{...(gs=X.parameters)==null?void 0:gs.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '320px'
  }}>
        <Story />
      </div>],
  render: () => <SessionCardSkeleton />
}`,...(hs=(ps=X.parameters)==null?void 0:ps.docs)==null?void 0:hs.source}}};var vs,xs,Ss;Y.parameters={...Y.parameters,docs:{...(vs=Y.parameters)==null?void 0:vs.docs,source:{originalSource:`{
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
}`,...(Ss=(xs=Y.parameters)==null?void 0:xs.docs)==null?void 0:Ss.source}}};var As,Cs,fs;Z.parameters={...Z.parameters,docs:{...(As=Z.parameters)==null?void 0:As.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }
  }
}`,...(fs=(Cs=Z.parameters)==null?void 0:Cs.docs)==null?void 0:fs.source}}};var ks,bs,ys;ee.parameters={...ee.parameters,docs:{...(ks=ee.parameters)==null?void 0:ks.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    }
  }
}`,...(ys=(bs=ee.parameters)==null?void 0:bs.docs)==null?void 0:ys.source}}};var js,Ls,Es;ae.parameters={...ae.parameters,docs:{...(js=ae.parameters)==null?void 0:js.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234
  }
}`,...(Es=(Ls=ae.parameters)==null?void 0:Ls.docs)==null?void 0:Es.source}}};var ws,Ms,zs;se.parameters={...se.parameters,docs:{...(ws=se.parameters)==null?void 0:ws.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    downloadCount: 5678
  }
}`,...(zs=(Ms=se.parameters)==null?void 0:Ms.docs)==null?void 0:zs.source}}};var Ns,Us,Ds;te.parameters={...te.parameters,docs:{...(Ns=te.parameters)==null?void 0:Ns.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Ds=(Us=te.parameters)==null?void 0:Us.docs)==null?void 0:Ds.source}}};var _s,Ts,Bs;re.parameters={...re.parameters,docs:{...(_s=re.parameters)==null?void 0:_s.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    },
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Bs=(Ts=re.parameters)==null?void 0:Ts.docs)==null?void 0:Bs.source}}};var Ps,Rs,Vs;ne.parameters={...ne.parameters,docs:{...(Ps=ne.parameters)==null?void 0:Ps.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 1235,
    downloadCount: 5678
  }
}`,...(Vs=(Rs=ne.parameters)==null?void 0:Rs.docs)==null?void 0:Vs.source}}};var Is,Ws,Os;ie.parameters={...ie.parameters,docs:{...(Is=ie.parameters)==null?void 0:Is.docs,source:{originalSource:`{
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
}`,...(Os=(Ws=ie.parameters)==null?void 0:Ws.docs)==null?void 0:Os.source}}};var Fs,qs,Gs;oe.parameters={...oe.parameters,docs:{...(Fs=oe.parameters)==null?void 0:Fs.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 123456,
    downloadCount: 9876543
  }
}`,...(Gs=(qs=oe.parameters)==null?void 0:qs.docs)==null?void 0:Gs.source}}};var Hs,$s,Js;le.parameters={...le.parameters,docs:{...(Hs=le.parameters)==null?void 0:Hs.docs,source:{originalSource:`{
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
}`,...(Js=($s=le.parameters)==null?void 0:$s.docs)==null?void 0:Js.source}}};var Qs,Ks,Xs;ce.parameters={...ce.parameters,docs:{...(Qs=ce.parameters)==null?void 0:Qs.docs,source:{originalSource:`{
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
}`,...(Xs=(Ks=ce.parameters)==null?void 0:Ks.docs)==null?void 0:Xs.source}}};const Et=["Default","WithBadges","WithMultipleBadges","WithAllBadgeVariants","WithBadgesLeftAndRight","WithMultipleBadgesEachSide","ManyBadgesLeft","ManyBadgesRight","ManyBadgesBothSides","LongBadgeLabels","NewSession","SingleMessage","WithoutImage","ImageError","WithoutMessageCount","ManyAvatars","LoadingAvatars","Disabled","LongTitle","WithActions","HighMessageCount","WithTags","WithManyTags","WithSingleTag","WithSummary","WithTagsAndSummary","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid","WithLikeButton","WithLikeButtonLiked","WithLikeCount","WithDownloadCount","WithPopularityStats","WithLikeButtonAndStats","WithLikeButtonLikedAndStats","WithLikeButtonAndActions","HighPopularityCounts","FullFeatured","GridLayoutWithPopularity"];export{K as AllStates,$ as CustomMetadata,a as Default,P as Disabled,le as FullFeatured,Q as FullyCustomMetadata,H as GridLayout,ce as GridLayoutWithPopularity,I as HighMessageCount,oe as HighPopularityCounts,D as ImageError,B as LoadingAvatars,M as LongBadgeLabels,R as LongTitle,T as ManyAvatars,w as ManyBadgesBothSides,L as ManyBadgesLeft,E as ManyBadgesRight,J as MetadataWithIcons,z as NewSession,N as SingleMessage,X as Skeleton,Y as SkeletonGrid,V as WithActions,b as WithAllBadgeVariants,f as WithBadges,y as WithBadgesLeftAndRight,se as WithDownloadCount,Z as WithLikeButton,ie as WithLikeButtonAndActions,re as WithLikeButtonAndStats,ee as WithLikeButtonLiked,ne as WithLikeButtonLikedAndStats,ae as WithLikeCount,O as WithManyTags,k as WithMultipleBadges,j as WithMultipleBadgesEachSide,te as WithPopularityStats,F as WithSingleTag,q as WithSummary,W as WithTags,G as WithTagsAndSummary,U as WithoutImage,_ as WithoutMessageCount,Et as __namedExportsOrder,Lt as default};
