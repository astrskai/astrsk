import{r as X,j as e}from"./iframe-CtPpfCw7.js";import{c as ts}from"./utils-DuMXYCiK.js";import{B as ns,C as ds,a as ge,b as ms,c as gs,S as ps,d as us,D as hs,T as vs,L as r,e as is}from"./CardBadges-DcXJ3HkY.js";import{S as o}from"./Skeleton-C4pvjcFf.js";import{L as l,U as p}from"./user-DAlAKA8E.js";import{S as Z,U as xs}from"./users-X4a5ImC7.js";import"./preload-helper-CwRszBsw.js";import"./createLucideIcon-BtAiJOEP.js";function Ss({name:s,avatarUrl:i}){const[m,h]=X.useState(!1);X.useEffect(()=>{h(!1)},[i]);const ae=i&&!m;return e.jsx("div",{className:"flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-900 bg-zinc-700",title:s,children:ae?e.jsx("img",{src:i,alt:s,className:"h-full w-full object-cover",onError:()=>h(!0)}):e.jsx("span",{className:"text-[10px] text-zinc-500",children:s.charAt(0).toUpperCase()||"?"})})}function re(){return e.jsx("div",{className:"h-8 w-8 animate-pulse rounded-full border-2 border-zinc-900 bg-zinc-700"})}function fs({className:s}){return e.jsx("svg",{className:s,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})})}const os=ms,Y=gs;function c({title:s,imageUrl:i,messageCount:m,actions:h=[],className:ae,isDisabled:ne=!1,onClick:ie,characterAvatars:v=[],areCharactersLoading:oe=!1,badges:x=[],renderMetadata:le,tags:S=[],summary:ce}){const[de,me]=X.useState(!1);X.useEffect(()=>{me(!1)},[i]);const ls=i&&!de,cs=i&&de;return e.jsxs(ns,{className:ts("min-h-[320px] w-full border-zinc-700 ring-1 ring-zinc-800",!ne&&ie&&"hover:ring-zinc-600",ae),isDisabled:ne,onClick:ie,children:[e.jsxs("div",{className:"relative h-48 overflow-hidden bg-zinc-800",children:[ls?e.jsxs(e.Fragment,{children:[e.jsx("img",{src:i,alt:s,className:"absolute inset-0 h-full w-full object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90",loading:"lazy",onError:()=>me(!0)}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"})]}):cs?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"absolute inset-0 flex items-center justify-center",children:e.jsx("span",{className:"text-6xl font-bold text-zinc-600",children:s.charAt(0).toUpperCase()||"?"})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"absolute inset-0 bg-zinc-800",children:e.jsx("div",{className:"absolute inset-0 opacity-20",style:{backgroundImage:"radial-gradient(#4f46e5 1px, transparent 1px)",backgroundSize:"16px 16px"}})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"})]}),e.jsx(ds,{actions:h}),x.some(t=>(t.position??"left")==="left")&&e.jsx("div",{className:"absolute top-3 left-3 z-10 max-w-[45%]",children:e.jsx(ge,{badges:x,position:"left"})}),x.some(t=>t.position==="right")&&e.jsx("div",{className:"absolute top-3 right-3 z-10 max-w-[45%]",children:e.jsx(ge,{badges:x,position:"right"})}),e.jsx("div",{className:"absolute bottom-0 left-0 w-full p-5",children:e.jsx("h2",{className:"line-clamp-2 h-[3.75rem] text-xl md:text-2xl leading-tight font-bold break-words text-white",children:s})})]}),e.jsx("div",{className:"flex flex-grow flex-col justify-between p-5",children:e.jsxs("div",{className:"space-y-2 md:space-y-3",children:[S.length>0&&e.jsxs("div",{className:"flex flex-wrap gap-2",children:[S.slice(0,3).map((t,se)=>e.jsx("span",{className:"rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",children:t},`${t}-${se}`)),S.length>3&&e.jsxs("span",{className:"rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",children:["+",S.length-3]})]}),ce&&e.jsx("p",{className:"line-clamp-2 text-xs leading-relaxed break-all text-ellipsis text-zinc-400",children:ce}),le?le():m!==void 0&&e.jsx("div",{className:"flex items-center justify-between text-sm",children:m===0?e.jsx("span",{className:"text-zinc-400",children:"New session"}):e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(fs,{className:"h-4 w-4 text-zinc-500"}),e.jsx("span",{className:"font-semibold text-zinc-300",children:m.toLocaleString()}),e.jsx("span",{className:"text-zinc-400",children:m===1?"Message":"Messages"})]})}),(oe||v.length>0)&&e.jsx("div",{className:"border-t border-zinc-800 pt-3",children:oe?e.jsxs("div",{className:"flex -space-x-2",children:[e.jsx(re,{}),e.jsx(re,{}),e.jsx(re,{})]}):e.jsxs("div",{className:"flex -space-x-2",children:[v.slice(0,3).map((t,se)=>e.jsx(Ss,{name:t.name,avatarUrl:t.avatarUrl},`${t.name}-${se}`)),v.length>3&&e.jsxs("div",{className:"flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 text-[10px] text-zinc-500",children:["+",v.length-3]})]})})]})})]})}c.__docgenInfo={description:"",methods:[],displayName:"SessionCard",props:{title:{required:!0,tsType:{name:"string"},description:"Session title"},imageUrl:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Cover image URL"},messageCount:{required:!1,tsType:{name:"number"},description:"Number of messages in the session (used in default metadata)"},actions:{required:!1,tsType:{name:"Array",elements:[{name:"CardAction"}],raw:"CardAction[]"},description:"Action buttons displayed on the card",defaultValue:{value:"[]",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"},isDisabled:{required:!1,tsType:{name:"boolean"},description:"Whether the card is disabled",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Click handler for the card"},characterAvatars:{required:!1,tsType:{name:"Array",elements:[{name:"CharacterAvatar"}],raw:"CharacterAvatar[]"},description:"Character avatars to display",defaultValue:{value:"[]",computed:!1}},areCharactersLoading:{required:!1,tsType:{name:"boolean"},description:"Whether characters are loading",defaultValue:{value:"false",computed:!1}},badges:{required:!1,tsType:{name:"Array",elements:[{name:"CardBadge"}],raw:"CardBadge[]"},description:"Badges to display on the card (e.g., type indicator, private, owner).",defaultValue:{value:"[]",computed:!1}},renderMetadata:{required:!1,tsType:{name:"signature",type:"function",raw:"() => React.ReactNode",signature:{arguments:[],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:`Custom render function for the metadata section.
When provided, replaces the default messageCount display.
Use CardMetadataContainer and CardMetadataItem for consistent styling.`},tags:{required:!1,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"Tags to display on the card",defaultValue:{value:"[]",computed:!1}},summary:{required:!1,tsType:{name:"string"},description:"Session summary/description"}}};function g({className:s}){return e.jsxs(ns,{className:ts("min-h-[320px] w-full border-zinc-700 ring-1 ring-zinc-800",s),isDisabled:!0,children:[e.jsxs("div",{className:"relative h-48 overflow-hidden bg-zinc-800",children:[e.jsx(o,{className:"absolute inset-0 h-full w-full",variant:"default"}),e.jsxs("div",{className:"absolute bottom-0 left-0 w-full p-5",children:[e.jsx(o,{className:"mb-2 h-7 w-3/4"}),e.jsx(o,{className:"h-7 w-1/2"})]})]}),e.jsx("div",{className:"flex flex-grow flex-col justify-between p-5",children:e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"flex items-center justify-between border-b border-zinc-800 pb-2",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(o,{className:"size-4",variant:"circular"}),e.jsx(o,{className:"h-4 w-20"})]})}),e.jsxs("div",{className:"flex -space-x-2 pt-1",children:[e.jsx(o,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(o,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(o,{className:"size-8 border-2 border-zinc-900",variant:"circular"})]})]})})]})}g.displayName="SessionCardSkeleton";g.__docgenInfo={description:`SessionCardSkeleton Component

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
\`\`\``,methods:[],displayName:"SessionCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};const ws={title:"Content/SessionCard",component:c,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{title:{control:"text",description:"Session title"},imageUrl:{control:"text",description:"Cover image URL"},messageCount:{control:"number",description:"Number of messages in the session (optional - if undefined, message count section is hidden)"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},badges:{control:"object",description:"Badges to display on the card"},areCharactersLoading:{control:"boolean",description:"Whether characters are loading"},tags:{control:"object",description:"Tags to display on the card"},summary:{control:"text",description:"Session summary/description"},onClick:{action:"clicked"}},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})]},u="https://picsum.photos/seed/session1/600/400",ee="https://picsum.photos/seed/session2/600/400",n="https://picsum.photos/seed/avatar1/100/100",d="https://picsum.photos/seed/avatar2/100/100",te="https://picsum.photos/seed/avatar3/100/100",As="https://picsum.photos/seed/avatar4/100/100",a={args:{title:"Adventure in Wonderland",imageUrl:u,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:n},{name:"Bob",avatarUrl:d}]}},f={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12})}]}},A={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12})},{label:"Private",variant:"private",icon:e.jsx(l,{size:12})}]}},b={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12})},{label:"Private",variant:"private",icon:e.jsx(l,{size:12})},{label:"Mine",variant:"owner",icon:e.jsx(p,{size:12})}]}},y={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}]}},j={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(p,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}]}},C={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(p,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"left"},{label:"Featured",icon:e.jsx(Z,{size:12}),position:"left"}]}},M={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"},{label:"Mine",variant:"owner",icon:e.jsx(p,{size:12}),position:"right"},{label:"Featured",icon:e.jsx(Z,{size:12}),position:"right"}]}},z={args:{...a.args,badges:[{label:"SESSION",icon:e.jsx(r,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(p,{size:12}),position:"left"},{label:"Featured",icon:e.jsx(Z,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(l,{size:12}),position:"right"},{label:"VIP",icon:e.jsx(p,{size:12}),position:"right"},{label:"New",position:"right"}]}},N={args:{...a.args,badges:[{label:"Very Long Session Label",icon:e.jsx(r,{size:12}),position:"left"},{label:"Extended Private Mode",variant:"private",icon:e.jsx(l,{size:12}),position:"right"}]}},E={args:{title:"New Adventure",imageUrl:ee,messageCount:0,characterAvatars:[{name:"Alice",avatarUrl:n}]}},w={args:{...a.args,title:"Just Started",messageCount:1}},L={args:{title:"Mystery Session",messageCount:15,characterAvatars:[{name:"Unknown",avatarUrl:void 0}]}},U={args:{title:"Adventure Session",imageUrl:"https://invalid-url-that-will-404.com/image.png",messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:"https://invalid-url-that-will-404.com/avatar.png"},{name:"Bob",avatarUrl:d}]}},T={args:{title:"Session without Message Count",imageUrl:u,characterAvatars:[{name:"Alice",avatarUrl:n}]}},_={args:{...a.args,title:"Group Session",characterAvatars:[{name:"Alice",avatarUrl:n},{name:"Bob",avatarUrl:d},{name:"Charlie",avatarUrl:te},{name:"Diana",avatarUrl:As},{name:"Eve"}]}},k={args:{...a.args,title:"Loading Characters...",areCharactersLoading:!0,characterAvatars:[]}},D={args:{...a.args,isDisabled:!0}},P={args:{...a.args,title:"The Exceptionally Long Session Title That Should Be Truncated After Two Lines"}},I={args:{...a.args,actions:[{icon:ps,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:us,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:hs,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"},{icon:vs,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},R={args:{...a.args,title:"Epic Campaign",messageCount:12345}},B={args:{...a.args,title:"Fantasy Adventure",tags:["Fantasy","Adventure","RPG"]}},V={args:{...a.args,title:"Multi-Genre Session",tags:["Fantasy","Sci-Fi","Horror","Mystery","Romance"]}},W={args:{...a.args,title:"Quick Session",tags:["Casual"]}},O={args:{...a.args,title:"Epic Quest",summary:"An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom from ancient evil."}},F={args:{...a.args,title:"Mystery Manor",tags:["Mystery","Horror","Detective"],summary:"Investigate the haunted manor and uncover dark secrets hidden within its walls."}},q={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(c,{title:"Adventure in Wonderland",imageUrl:u,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:n},{name:"Bob",avatarUrl:d}]}),e.jsx(c,{title:"Mystery Investigation",imageUrl:ee,messageCount:128,badges:[{label:"SESSION",icon:e.jsx(r,{size:12})}],characterAvatars:[{name:"Detective",avatarUrl:te}]}),e.jsx(c,{title:"New Session",messageCount:0,characterAvatars:[]})]})},G={args:{title:"Session with Custom Metadata",imageUrl:u,characterAvatars:[{name:"Alice",avatarUrl:n},{name:"Bob",avatarUrl:d}],renderMetadata:()=>e.jsxs(os,{children:[e.jsx(Y,{icon:e.jsx(is,{className:"size-3"}),children:"2 days ago"}),e.jsx(Y,{icon:e.jsx(xs,{className:"size-3"}),children:"3 participants"})]})}},H={args:{title:"Popular Session",imageUrl:ee,characterAvatars:[{name:"Alice",avatarUrl:n}],renderMetadata:()=>e.jsxs(os,{children:[e.jsx(Y,{icon:e.jsx(Z,{className:"size-3"}),children:"4.8 rating"}),e.jsx(Y,{icon:e.jsx(is,{className:"size-3"}),children:"Last played: 1h ago"})]})}},$={args:{title:"Session with Stats",imageUrl:u,characterAvatars:[{name:"Alice",avatarUrl:n},{name:"Bob",avatarUrl:d},{name:"Charlie",avatarUrl:te}],renderMetadata:()=>e.jsxs("div",{className:"grid grid-cols-3 gap-2 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"156"}),e.jsx("div",{children:"Messages"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"3"}),e.jsx("div",{children:"Characters"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"2h"}),e.jsx("div",{children:"Duration"})]})]})}},Q={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(c,{title:"Default Session",imageUrl:u,messageCount:10,characterAvatars:[{name:"Alice",avatarUrl:n}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(c,{title:"Session with Badge",imageUrl:ee,messageCount:25,badges:[{label:"SESSION",icon:e.jsx(r,{size:12})}],characterAvatars:[{name:"Bob",avatarUrl:d}]})})]})]})},J={args:{...a.args},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})],render:()=>e.jsx(g,{})},K={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(g,{}),e.jsx(g,{}),e.jsx(g,{})]})};var pe,ue,he;a.parameters={...a.parameters,docs:{...(pe=a.parameters)==null?void 0:pe.docs,source:{originalSource:`{
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
}`,...(he=(ue=a.parameters)==null?void 0:ue.docs)==null?void 0:he.source}}};var ve,xe,Se;f.parameters={...f.parameters,docs:{...(ve=f.parameters)==null?void 0:ve.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'SESSION',
      icon: <Layers size={12} />
    }]
  }
}`,...(Se=(xe=f.parameters)==null?void 0:xe.docs)==null?void 0:Se.source}}};var fe,Ae,be;A.parameters={...A.parameters,docs:{...(fe=A.parameters)==null?void 0:fe.docs,source:{originalSource:`{
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
}`,...(be=(Ae=A.parameters)==null?void 0:Ae.docs)==null?void 0:be.source}}};var ye,je,Ce;b.parameters={...b.parameters,docs:{...(ye=b.parameters)==null?void 0:ye.docs,source:{originalSource:`{
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
}`,...(Ce=(je=b.parameters)==null?void 0:je.docs)==null?void 0:Ce.source}}};var Me,ze,Ne;y.parameters={...y.parameters,docs:{...(Me=y.parameters)==null?void 0:Me.docs,source:{originalSource:`{
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
}`,...(Ne=(ze=y.parameters)==null?void 0:ze.docs)==null?void 0:Ne.source}}};var Ee,we,Le;j.parameters={...j.parameters,docs:{...(Ee=j.parameters)==null?void 0:Ee.docs,source:{originalSource:`{
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
}`,...(Le=(we=j.parameters)==null?void 0:we.docs)==null?void 0:Le.source}}};var Ue,Te,_e;C.parameters={...C.parameters,docs:{...(Ue=C.parameters)==null?void 0:Ue.docs,source:{originalSource:`{
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
}`,...(_e=(Te=C.parameters)==null?void 0:Te.docs)==null?void 0:_e.source}}};var ke,De,Pe;M.parameters={...M.parameters,docs:{...(ke=M.parameters)==null?void 0:ke.docs,source:{originalSource:`{
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
}`,...(Pe=(De=M.parameters)==null?void 0:De.docs)==null?void 0:Pe.source}}};var Ie,Re,Be;z.parameters={...z.parameters,docs:{...(Ie=z.parameters)==null?void 0:Ie.docs,source:{originalSource:`{
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
}`,...(Be=(Re=z.parameters)==null?void 0:Re.docs)==null?void 0:Be.source}}};var Ve,We,Oe;N.parameters={...N.parameters,docs:{...(Ve=N.parameters)==null?void 0:Ve.docs,source:{originalSource:`{
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
}`,...(Oe=(We=N.parameters)==null?void 0:We.docs)==null?void 0:Oe.source}}};var Fe,qe,Ge;E.parameters={...E.parameters,docs:{...(Fe=E.parameters)==null?void 0:Fe.docs,source:{originalSource:`{
  args: {
    title: 'New Adventure',
    imageUrl: SAMPLE_COVER_2,
    messageCount: 0,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(Ge=(qe=E.parameters)==null?void 0:qe.docs)==null?void 0:Ge.source}}};var He,$e,Qe;w.parameters={...w.parameters,docs:{...(He=w.parameters)==null?void 0:He.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Just Started',
    messageCount: 1
  }
}`,...(Qe=($e=w.parameters)==null?void 0:$e.docs)==null?void 0:Qe.source}}};var Je,Ke,Xe;L.parameters={...L.parameters,docs:{...(Je=L.parameters)==null?void 0:Je.docs,source:{originalSource:`{
  args: {
    title: 'Mystery Session',
    messageCount: 15,
    characterAvatars: [{
      name: 'Unknown',
      avatarUrl: undefined
    }]
  }
}`,...(Xe=(Ke=L.parameters)==null?void 0:Ke.docs)==null?void 0:Xe.source}}};var Ye,Ze,ea;U.parameters={...U.parameters,docs:{...(Ye=U.parameters)==null?void 0:Ye.docs,source:{originalSource:`{
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
}`,...(ea=(Ze=U.parameters)==null?void 0:Ze.docs)==null?void 0:ea.source}}};var aa,sa,ra;T.parameters={...T.parameters,docs:{...(aa=T.parameters)==null?void 0:aa.docs,source:{originalSource:`{
  args: {
    title: 'Session without Message Count',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(ra=(sa=T.parameters)==null?void 0:sa.docs)==null?void 0:ra.source}}};var ta,na,ia;_.parameters={..._.parameters,docs:{...(ta=_.parameters)==null?void 0:ta.docs,source:{originalSource:`{
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
}`,...(ia=(na=_.parameters)==null?void 0:na.docs)==null?void 0:ia.source}}};var oa,la,ca;k.parameters={...k.parameters,docs:{...(oa=k.parameters)==null?void 0:oa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Loading Characters...',
    areCharactersLoading: true,
    characterAvatars: []
  }
}`,...(ca=(la=k.parameters)==null?void 0:la.docs)==null?void 0:ca.source}}};var da,ma,ga;D.parameters={...D.parameters,docs:{...(da=D.parameters)==null?void 0:da.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(ga=(ma=D.parameters)==null?void 0:ma.docs)==null?void 0:ga.source}}};var pa,ua,ha;P.parameters={...P.parameters,docs:{...(pa=P.parameters)==null?void 0:pa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'The Exceptionally Long Session Title That Should Be Truncated After Two Lines'
  }
}`,...(ha=(ua=P.parameters)==null?void 0:ua.docs)==null?void 0:ha.source}}};var va,xa,Sa;I.parameters={...I.parameters,docs:{...(va=I.parameters)==null?void 0:va.docs,source:{originalSource:`{
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
}`,...(Sa=(xa=I.parameters)==null?void 0:xa.docs)==null?void 0:Sa.source}}};var fa,Aa,ba;R.parameters={...R.parameters,docs:{...(fa=R.parameters)==null?void 0:fa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Campaign',
    messageCount: 12345
  }
}`,...(ba=(Aa=R.parameters)==null?void 0:Aa.docs)==null?void 0:ba.source}}};var ya,ja,Ca;B.parameters={...B.parameters,docs:{...(ya=B.parameters)==null?void 0:ya.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Fantasy Adventure',
    tags: ['Fantasy', 'Adventure', 'RPG']
  }
}`,...(Ca=(ja=B.parameters)==null?void 0:ja.docs)==null?void 0:Ca.source}}};var Ma,za,Na;V.parameters={...V.parameters,docs:{...(Ma=V.parameters)==null?void 0:Ma.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Multi-Genre Session',
    tags: ['Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Romance']
  }
}`,...(Na=(za=V.parameters)==null?void 0:za.docs)==null?void 0:Na.source}}};var Ea,wa,La;W.parameters={...W.parameters,docs:{...(Ea=W.parameters)==null?void 0:Ea.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Quick Session',
    tags: ['Casual']
  }
}`,...(La=(wa=W.parameters)==null?void 0:wa.docs)==null?void 0:La.source}}};var Ua,Ta,_a;O.parameters={...O.parameters,docs:{...(Ua=O.parameters)==null?void 0:Ua.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Quest',
    summary: 'An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom from ancient evil.'
  }
}`,...(_a=(Ta=O.parameters)==null?void 0:Ta.docs)==null?void 0:_a.source}}};var ka,Da,Pa;F.parameters={...F.parameters,docs:{...(ka=F.parameters)==null?void 0:ka.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Mystery Manor',
    tags: ['Mystery', 'Horror', 'Detective'],
    summary: 'Investigate the haunted manor and uncover dark secrets hidden within its walls.'
  }
}`,...(Pa=(Da=F.parameters)==null?void 0:Da.docs)==null?void 0:Pa.source}}};var Ia,Ra,Ba;q.parameters={...q.parameters,docs:{...(Ia=q.parameters)==null?void 0:Ia.docs,source:{originalSource:`{
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
}`,...(Ba=(Ra=q.parameters)==null?void 0:Ra.docs)==null?void 0:Ba.source}}};var Va,Wa,Oa;G.parameters={...G.parameters,docs:{...(Va=G.parameters)==null?void 0:Va.docs,source:{originalSource:`{
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
}`,...(Oa=(Wa=G.parameters)==null?void 0:Wa.docs)==null?void 0:Oa.source}}};var Fa,qa,Ga;H.parameters={...H.parameters,docs:{...(Fa=H.parameters)==null?void 0:Fa.docs,source:{originalSource:`{
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
}`,...(Ga=(qa=H.parameters)==null?void 0:qa.docs)==null?void 0:Ga.source}}};var Ha,$a,Qa;$.parameters={...$.parameters,docs:{...(Ha=$.parameters)==null?void 0:Ha.docs,source:{originalSource:`{
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
}`,...(Qa=($a=$.parameters)==null?void 0:$a.docs)==null?void 0:Qa.source}}};var Ja,Ka,Xa;Q.parameters={...Q.parameters,docs:{...(Ja=Q.parameters)==null?void 0:Ja.docs,source:{originalSource:`{
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
}`,...(Xa=(Ka=Q.parameters)==null?void 0:Ka.docs)==null?void 0:Xa.source}}};var Ya,Za,es;J.parameters={...J.parameters,docs:{...(Ya=J.parameters)==null?void 0:Ya.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '320px'
  }}>
        <Story />
      </div>],
  render: () => <SessionCardSkeleton />
}`,...(es=(Za=J.parameters)==null?void 0:Za.docs)==null?void 0:es.source}}};var as,ss,rs;K.parameters={...K.parameters,docs:{...(as=K.parameters)==null?void 0:as.docs,source:{originalSource:`{
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
}`,...(rs=(ss=K.parameters)==null?void 0:ss.docs)==null?void 0:rs.source}}};const Ls=["Default","WithBadges","WithMultipleBadges","WithAllBadgeVariants","WithBadgesLeftAndRight","WithMultipleBadgesEachSide","ManyBadgesLeft","ManyBadgesRight","ManyBadgesBothSides","LongBadgeLabels","NewSession","SingleMessage","WithoutImage","ImageError","WithoutMessageCount","ManyAvatars","LoadingAvatars","Disabled","LongTitle","WithActions","HighMessageCount","WithTags","WithManyTags","WithSingleTag","WithSummary","WithTagsAndSummary","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid"];export{Q as AllStates,G as CustomMetadata,a as Default,D as Disabled,$ as FullyCustomMetadata,q as GridLayout,R as HighMessageCount,U as ImageError,k as LoadingAvatars,N as LongBadgeLabels,P as LongTitle,_ as ManyAvatars,z as ManyBadgesBothSides,C as ManyBadgesLeft,M as ManyBadgesRight,H as MetadataWithIcons,E as NewSession,w as SingleMessage,J as Skeleton,K as SkeletonGrid,I as WithActions,b as WithAllBadgeVariants,f as WithBadges,y as WithBadgesLeftAndRight,V as WithManyTags,A as WithMultipleBadges,j as WithMultipleBadgesEachSide,W as WithSingleTag,O as WithSummary,B as WithTags,F as WithTagsAndSummary,L as WithoutImage,T as WithoutMessageCount,Ls as __namedExportsOrder,ws as default};
