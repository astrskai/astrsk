import{r as ne,j as e}from"./iframe-CHvyI5Jn.js";import{c as $a}from"./utils-DuMXYCiK.js";import{B as Ya,C as gt,a as pt,b as oe,c as ht,d as Za,e as O,S as Y,f as Qa,D as Xa,T as et,L as n,g as Ct}from"./CardPopularityStats-BjwFZc0-.js";import{S as s}from"./Skeleton-DZHat7JU.js";import{L as c}from"./lock-BtvGNWIB.js";import{U as at}from"./user-D3p8tKL5.js";import{c as kt}from"./createLucideIcon-DhpHCYSY.js";import{M as yt}from"./message-square-CO61Rvmq.js";import"./preload-helper-CwRszBsw.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xt=[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]],ft=kt("heart",xt),tt=Za,$=O;function r({name:t,imageUrl:J,summary:Z,tags:u,tokenCount:st=0,updatedAt:Q,className:nt,actions:ot=[],isDisabled:it=!1,onClick:lt,badges:g=[],placeholderImageUrl:V,renderMetadata:X,emptySummaryText:ee="No summary",likeButton:K,likeCount:ae,downloadCount:te,imageSizes:ct}){const[dt,re]=ne.useState(!1);ne.useEffect(()=>{re(!1)},[J,V]);const se=(J||V)&&!dt,mt=!se;return e.jsxs(Ya,{className:$a("min-h-[380px]",nt),isDisabled:it,onClick:lt,children:[e.jsxs("div",{className:"relative h-64 overflow-hidden bg-zinc-800",children:[se&&e.jsx("img",{src:J||V,alt:t,sizes:ct,className:"absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",loading:"lazy",onError:()=>re(!0)}),mt&&e.jsx("div",{className:"absolute inset-0 flex items-center justify-center",children:e.jsx("span",{className:"text-6xl font-bold text-zinc-500",children:t.charAt(0).toUpperCase()||"?"})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90"}),K&&e.jsx("div",{className:"absolute top-2 right-2 z-20",children:e.jsx(gt,{...K})}),e.jsx(pt,{actions:ot,className:K?"top-12":void 0}),g.some(i=>(i.position??"left")==="left")&&e.jsx("div",{className:"absolute top-3 left-3 z-10 max-w-[45%]",children:e.jsx(oe,{badges:g,position:"left"})}),g.some(i=>i.position==="right")&&e.jsx("div",{className:"absolute top-3 right-3 z-10 max-w-[45%]",children:e.jsx(oe,{badges:g,position:"right"})})]}),e.jsxs("div",{className:"relative z-10 -mt-12 flex flex-grow flex-col p-4",children:[e.jsx("h3",{className:"mb-1 line-clamp-2 text-lg md:text-xl font-bold break-words text-white drop-shadow-md",children:t}),e.jsx("div",{className:"mb-2 md:mb-4 flex flex-wrap gap-2",children:u.length>0?e.jsxs(e.Fragment,{children:[u.slice(0,3).map((i,ut)=>e.jsx("span",{className:"rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",children:i},`${i}-${ut}`)),u.length>3&&e.jsxs("span",{className:"rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",children:["+",u.length-3]})]}):e.jsx("span",{className:"text-[10px] text-zinc-400",children:"No tags"})}),(Z||ee)&&e.jsx("p",{className:"mb-2 md:mb-4 line-clamp-2 flex-grow text-xs leading-relaxed break-all text-ellipsis text-zinc-400",children:Z||ee}),(ae!==void 0||te!==void 0)&&e.jsx(ht,{likeCount:ae,downloadCount:te,className:"mb-2"}),X?X():e.jsxs(Za,{children:[e.jsxs(O,{children:[st," Tokens"]}),Q&&e.jsx(O,{children:Q})]})]})]})}r.__docgenInfo={description:"",methods:[],displayName:"CharacterCard",props:{name:{required:!0,tsType:{name:"string"},description:"Character name"},imageUrl:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Character image URL"},summary:{required:!1,tsType:{name:"string"},description:"Character summary/description"},tags:{required:!0,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"Character tags"},tokenCount:{required:!1,tsType:{name:"number"},description:"Token count for the character (used in default metadata)",defaultValue:{value:"0",computed:!1}},updatedAt:{required:!1,tsType:{name:"string"},description:"Last updated timestamp (used in default metadata)"},actions:{required:!1,tsType:{name:"Array",elements:[{name:"CardAction"}],raw:"CardAction[]"},description:"Action buttons displayed on the card",defaultValue:{value:"[]",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"},isDisabled:{required:!1,tsType:{name:"boolean"},description:"Whether the card is disabled",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Click handler for the card"},badges:{required:!1,tsType:{name:"Array",elements:[{name:"CardBadge"}],raw:"CardBadge[]"},description:"Badges to display on the card (e.g., type indicator, private, owner).",defaultValue:{value:"[]",computed:!1}},placeholderImageUrl:{required:!1,tsType:{name:"string"},description:"Placeholder image URL when imageUrl is not provided"},renderMetadata:{required:!1,tsType:{name:"signature",type:"function",raw:"() => React.ReactNode",signature:{arguments:[],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:`Custom render function for the metadata section.
When provided, replaces the default tokenCount/updatedAt display.
Use CardMetadataContainer and CardMetadataItem for consistent styling.`},emptySummaryText:{required:!1,tsType:{name:"string"},description:'Text to display when summary is empty. Defaults to "No summary". Set to empty string to hide.',defaultValue:{value:"'No summary'",computed:!1}},likeButton:{required:!1,tsType:{name:"LikeButtonProps"},description:"Like button configuration (displays in top-right corner)"},likeCount:{required:!1,tsType:{name:"number"},description:"Like count to display in popularity stats"},downloadCount:{required:!1,tsType:{name:"number"},description:"Download count to display in popularity stats"},imageSizes:{required:!1,tsType:{name:"string"},description:`The sizes attribute for the image element.
Helps browser select appropriate image size for responsive loading.
@example "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"`}}};function l({className:t}){return e.jsxs(Ya,{className:$a("min-h-[380px]",t),isDisabled:!0,children:[e.jsx("div",{className:"relative h-64 overflow-hidden bg-zinc-800",children:e.jsx(s,{className:"absolute inset-0 h-full w-full",variant:"default"})}),e.jsxs("div",{className:"relative z-10 -mt-12 flex flex-grow flex-col p-4",children:[e.jsx(s,{className:"mb-1 h-6 w-3/4"}),e.jsxs("div",{className:"mb-4 flex flex-wrap gap-2",children:[e.jsx(s,{className:"h-5 w-12"}),e.jsx(s,{className:"h-5 w-16"}),e.jsx(s,{className:"h-5 w-10"})]}),e.jsxs("div",{className:"mb-4 flex-grow space-y-2",children:[e.jsx(s,{className:"h-3 w-full"}),e.jsx(s,{className:"h-3 w-full"}),e.jsx(s,{className:"h-3 w-2/3"})]}),e.jsxs("div",{className:"flex items-center gap-2 border-t border-zinc-800 pt-3",children:[e.jsx(s,{className:"h-3 w-16"}),e.jsx(s,{className:"h-3 w-20"})]})]})]})}l.displayName="CharacterCardSkeleton";l.__docgenInfo={description:`CharacterCardSkeleton Component

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
\`\`\``,methods:[],displayName:"CharacterCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};const Dt={title:"Content/CharacterCard",component:r,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{name:{control:"text",description:"Character name"},imageUrl:{control:"text",description:"Character image URL"},summary:{control:"text",description:"Character summary/description"},tags:{control:"object",description:"Character tags array"},tokenCount:{control:"number",description:"Token count for the character"},updatedAt:{control:"text",description:"Last updated timestamp"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},badges:{control:"object",description:"Badges to display on the card"},placeholderImageUrl:{control:"text",description:"Placeholder image URL when imageUrl is not provided",table:{defaultValue:{summary:"img/placeholder/character-placeholder.png"}}},onClick:{action:"clicked"}},decorators:[t=>e.jsx("div",{style:{width:"280px"},children:e.jsx(t,{})})]},o="https://picsum.photos/seed/character1/400/600",d="https://picsum.photos/seed/character2/400/600",m="https://picsum.photos/seed/character3/400/600",rt="/astrsk/design-system/img/placeholder/character-placeholder.png",a={args:{name:"Alice Wonderland",imageUrl:o,summary:"A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.",tags:["Fantasy","Adventure","Classic"],tokenCount:1523,updatedAt:"2 days ago",placeholderImageUrl:rt}},p={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(n,{size:12})}]}},h={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(n,{size:12})},{label:"Private",variant:"private",icon:e.jsx(c,{size:12})}]}},C={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(n,{size:12})},{label:"Private",variant:"private",icon:e.jsx(c,{size:12})},{label:"Mine",variant:"owner",icon:e.jsx(at,{size:12})}]}},k={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(n,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(c,{size:12}),position:"right"}]}},y={args:{...a.args,badges:[{label:"CHARACTER",icon:e.jsx(n,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(at,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(c,{size:12}),position:"right"}]}},x={args:{name:"Mystery Character",summary:"A mysterious character with no image yet.",tags:["Unknown"],tokenCount:500,updatedAt:"Just now"}},f={args:{name:"Placeholder Character",summary:"A character using a placeholder image.",tags:["New"],tokenCount:0,updatedAt:"Just now",placeholderImageUrl:rt}},A={args:{name:"Alice Wonderland",imageUrl:"https://invalid-url-that-will-404.com/image.png",summary:"This character has an invalid image URL, showing the initial fallback.",tags:["Error","Fallback"],tokenCount:1e3,updatedAt:"Just now"}},v={args:{name:"Multi-Tagged Character",imageUrl:d,summary:"This character has many different tags to demonstrate overflow.",tags:["Fantasy","Romance","Drama","Action","Comedy","Slice of Life"],tokenCount:2500,updatedAt:"1 week ago"}},b={args:{name:"Tagless Character",imageUrl:m,summary:"A character without any tags.",tags:[],tokenCount:800,updatedAt:"3 hours ago"}},w={args:{name:"The Exceptionally Long Named Character of the Eastern Kingdoms",imageUrl:o,summary:"A character with a very long name that should be truncated.",tags:["Epic","Fantasy"],tokenCount:3e3,updatedAt:"1 month ago"}},L={args:{...a.args,isDisabled:!0}},E={args:{...a.args,actions:[{icon:Y,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:Qa,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate character"},{icon:Xa,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export character"},{icon:et,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete character",className:"hover:text-red-400"}]}},j={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(r,{name:"Alice Wonderland",imageUrl:o,summary:"A curious young girl who falls down a rabbit hole into a fantasy world.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago"}),e.jsx(r,{name:"Bob the Builder",imageUrl:d,summary:"Can we fix it? Yes we can! A cheerful constructor who solves problems.",tags:["Kids","Comedy"],tokenCount:890,updatedAt:"1 week ago",badges:[{label:"CHARACTER",icon:e.jsx(n,{size:12})}]}),e.jsx(r,{name:"Charlie Detective",imageUrl:m,summary:"A sharp-minded detective solving mysteries in the foggy streets of London.",tags:["Mystery","Thriller","Drama"],tokenCount:2100,updatedAt:"Just now"})]})},S={args:{name:"Popular Character",imageUrl:o,summary:"A character with custom metadata using renderMetadata prop.",tags:["Popular","Trending"],renderMetadata:()=>e.jsxs(tt,{children:[e.jsx($,{icon:e.jsx(ft,{className:"size-3"}),children:"2.5k likes"}),e.jsx($,{icon:e.jsx(yt,{className:"size-3"}),children:"128 chats"})]})}},M={args:{name:"Active Character",imageUrl:d,summary:"Demonstrating metadata items with icons for better visual clarity.",tags:["Active"],renderMetadata:()=>e.jsx(tt,{children:e.jsx($,{icon:e.jsx(Ct,{className:"size-3"}),children:"Last active: 2h ago"})})}},D={args:{name:"Custom Layout Character",imageUrl:m,summary:"When you need complete control over metadata layout.",tags:["Custom"],renderMetadata:()=>e.jsxs("div",{className:"mt-auto grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"1.2k"}),e.jsx("div",{children:"Likes"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"89"}),e.jsx("div",{children:"Chats"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"4.8"}),e.jsx("div",{children:"Rating"})]})]})}},N={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(r,{name:"Default Character",imageUrl:o,summary:"A standard character card with all typical fields.",tags:["Tag1","Tag2"],tokenCount:1e3,updatedAt:"1 day ago"})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(r,{name:"Character with Badge",imageUrl:d,summary:"Shows the CHARACTER type badge.",tags:["Fantasy"],tokenCount:500,updatedAt:"5 hours ago",badges:[{label:"CHARACTER",icon:e.jsx(n,{size:12})}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Disabled"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(r,{name:"Disabled Character",imageUrl:m,summary:"This card is disabled and cannot be interacted with.",tags:["Locked"],tokenCount:0,isDisabled:!0})})]})]})},T={args:{...a.args},decorators:[t=>e.jsx("div",{style:{width:"280px"},children:e.jsx(t,{})})],render:()=>e.jsx(l,{})},z={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(l,{}),e.jsx(l,{}),e.jsx(l,{})]})},U={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")}}},B={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")}}},P={args:{...a.args,likeCount:1234}},R={args:{...a.args,downloadCount:5678}},W={args:{...a.args,likeCount:1234,downloadCount:5678}},I={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:1234,downloadCount:5678}},_={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:1235,downloadCount:5678}},F={args:{...a.args,likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:2500,downloadCount:12e3,actions:[{icon:Y,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:Qa,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate character"},{icon:et,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete character",className:"hover:text-red-400"}]}},G={args:{...a.args,likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:123456,downloadCount:9876543}},H={args:{name:"Alice Wonderland",imageUrl:o,summary:"A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.",tags:["Fantasy","Adventure","Classic"],tokenCount:1523,updatedAt:"2 days ago",badges:[{label:"CHARACTER",icon:e.jsx(n,{size:12})},{label:"Private",variant:"private",icon:e.jsx(c,{size:12}),position:"right"}],likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:2847,downloadCount:15230,actions:[{icon:Y,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:Xa,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export character"}]}},q={args:{...a.args},decorators:[t=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(t,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(r,{name:"Popular Character",imageUrl:o,summary:"A highly popular character loved by many users.",tags:["Popular","Trending"],tokenCount:1523,updatedAt:"2 days ago",likeButton:{isLiked:!0,onClick:()=>console.log("Unlike clicked")},likeCount:12500,downloadCount:45e3}),e.jsx(r,{name:"New Character",imageUrl:d,summary:"A fresh new character just added to the platform.",tags:["New","Fresh"],tokenCount:890,updatedAt:"1 hour ago",likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:42,downloadCount:128}),e.jsx(r,{name:"Classic Character",imageUrl:m,summary:"A timeless classic that has stood the test of time.",tags:["Classic","Evergreen"],tokenCount:2100,updatedAt:"1 year ago",likeButton:{isLiked:!1,onClick:()=>console.log("Like clicked")},likeCount:98765,downloadCount:543210})]})};var ie,le,ce;a.parameters={...a.parameters,docs:{...(ie=a.parameters)==null?void 0:ie.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.',
    tags: ['Fantasy', 'Adventure', 'Classic'],
    tokenCount: 1523,
    updatedAt: '2 days ago',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(ce=(le=a.parameters)==null?void 0:le.docs)==null?void 0:ce.source}}};var de,me,ue;p.parameters={...p.parameters,docs:{...(de=p.parameters)==null?void 0:de.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'CHARACTER',
      icon: <Layers size={12} />
    }]
  }
}`,...(ue=(me=p.parameters)==null?void 0:me.docs)==null?void 0:ue.source}}};var ge,pe,he;h.parameters={...h.parameters,docs:{...(ge=h.parameters)==null?void 0:ge.docs,source:{originalSource:`{
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
}`,...(he=(pe=h.parameters)==null?void 0:pe.docs)==null?void 0:he.source}}};var Ce,ke,ye;C.parameters={...C.parameters,docs:{...(Ce=C.parameters)==null?void 0:Ce.docs,source:{originalSource:`{
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
}`,...(ye=(ke=C.parameters)==null?void 0:ke.docs)==null?void 0:ye.source}}};var xe,fe,Ae;k.parameters={...k.parameters,docs:{...(xe=k.parameters)==null?void 0:xe.docs,source:{originalSource:`{
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
}`,...(Ae=(fe=k.parameters)==null?void 0:fe.docs)==null?void 0:Ae.source}}};var ve,be,we;y.parameters={...y.parameters,docs:{...(ve=y.parameters)==null?void 0:ve.docs,source:{originalSource:`{
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
}`,...(we=(be=y.parameters)==null?void 0:be.docs)==null?void 0:we.source}}};var Le,Ee,je;x.parameters={...x.parameters,docs:{...(Le=x.parameters)==null?void 0:Le.docs,source:{originalSource:`{
  args: {
    name: 'Mystery Character',
    summary: 'A mysterious character with no image yet.',
    tags: ['Unknown'],
    tokenCount: 500,
    updatedAt: 'Just now'
  }
}`,...(je=(Ee=x.parameters)==null?void 0:Ee.docs)==null?void 0:je.source}}};var Se,Me,De;f.parameters={...f.parameters,docs:{...(Se=f.parameters)==null?void 0:Se.docs,source:{originalSource:`{
  args: {
    name: 'Placeholder Character',
    summary: 'A character using a placeholder image.',
    tags: ['New'],
    tokenCount: 0,
    updatedAt: 'Just now',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(De=(Me=f.parameters)==null?void 0:Me.docs)==null?void 0:De.source}}};var Ne,Te,ze;A.parameters={...A.parameters,docs:{...(Ne=A.parameters)==null?void 0:Ne.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: 'https://invalid-url-that-will-404.com/image.png',
    summary: 'This character has an invalid image URL, showing the initial fallback.',
    tags: ['Error', 'Fallback'],
    tokenCount: 1000,
    updatedAt: 'Just now'
  }
}`,...(ze=(Te=A.parameters)==null?void 0:Te.docs)==null?void 0:ze.source}}};var Ue,Be,Pe;v.parameters={...v.parameters,docs:{...(Ue=v.parameters)==null?void 0:Ue.docs,source:{originalSource:`{
  args: {
    name: 'Multi-Tagged Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'This character has many different tags to demonstrate overflow.',
    tags: ['Fantasy', 'Romance', 'Drama', 'Action', 'Comedy', 'Slice of Life'],
    tokenCount: 2500,
    updatedAt: '1 week ago'
  }
}`,...(Pe=(Be=v.parameters)==null?void 0:Be.docs)==null?void 0:Pe.source}}};var Re,We,Ie;b.parameters={...b.parameters,docs:{...(Re=b.parameters)==null?void 0:Re.docs,source:{originalSource:`{
  args: {
    name: 'Tagless Character',
    imageUrl: SAMPLE_IMAGE_3,
    summary: 'A character without any tags.',
    tags: [],
    tokenCount: 800,
    updatedAt: '3 hours ago'
  }
}`,...(Ie=(We=b.parameters)==null?void 0:We.docs)==null?void 0:Ie.source}}};var _e,Fe,Ge;w.parameters={...w.parameters,docs:{...(_e=w.parameters)==null?void 0:_e.docs,source:{originalSource:`{
  args: {
    name: 'The Exceptionally Long Named Character of the Eastern Kingdoms',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A character with a very long name that should be truncated.',
    tags: ['Epic', 'Fantasy'],
    tokenCount: 3000,
    updatedAt: '1 month ago'
  }
}`,...(Ge=(Fe=w.parameters)==null?void 0:Fe.docs)==null?void 0:Ge.source}}};var He,qe,Je;L.parameters={...L.parameters,docs:{...(He=L.parameters)==null?void 0:He.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(Je=(qe=L.parameters)==null?void 0:qe.docs)==null?void 0:Je.source}}};var Ve,Ke,Oe;E.parameters={...E.parameters,docs:{...(Ve=E.parameters)==null?void 0:Ve.docs,source:{originalSource:`{
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
}`,...(Oe=(Ke=E.parameters)==null?void 0:Ke.docs)==null?void 0:Oe.source}}};var $e,Ye,Ze;j.parameters={...j.parameters,docs:{...($e=j.parameters)==null?void 0:$e.docs,source:{originalSource:`{
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
}`,...(Ze=(Ye=j.parameters)==null?void 0:Ye.docs)==null?void 0:Ze.source}}};var Qe,Xe,ea;S.parameters={...S.parameters,docs:{...(Qe=S.parameters)==null?void 0:Qe.docs,source:{originalSource:`{
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
}`,...(ea=(Xe=S.parameters)==null?void 0:Xe.docs)==null?void 0:ea.source}}};var aa,ta,ra;M.parameters={...M.parameters,docs:{...(aa=M.parameters)==null?void 0:aa.docs,source:{originalSource:`{
  args: {
    name: 'Active Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'Demonstrating metadata items with icons for better visual clarity.',
    tags: ['Active'],
    renderMetadata: () => <MetadataContainer>
        <MetadataItem icon={<Clock className="size-3" />}>Last active: 2h ago</MetadataItem>
      </MetadataContainer>
  }
}`,...(ra=(ta=M.parameters)==null?void 0:ta.docs)==null?void 0:ra.source}}};var sa,na,oa;D.parameters={...D.parameters,docs:{...(sa=D.parameters)==null?void 0:sa.docs,source:{originalSource:`{
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
}`,...(oa=(na=D.parameters)==null?void 0:na.docs)==null?void 0:oa.source}}};var ia,la,ca;N.parameters={...N.parameters,docs:{...(ia=N.parameters)==null?void 0:ia.docs,source:{originalSource:`{
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
}`,...(ca=(la=N.parameters)==null?void 0:la.docs)==null?void 0:ca.source}}};var da,ma,ua;T.parameters={...T.parameters,docs:{...(da=T.parameters)==null?void 0:da.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '280px'
  }}>
        <Story />
      </div>],
  render: () => <CharacterCardSkeleton />
}`,...(ua=(ma=T.parameters)==null?void 0:ma.docs)==null?void 0:ua.source}}};var ga,pa,ha;z.parameters={...z.parameters,docs:{...(ga=z.parameters)==null?void 0:ga.docs,source:{originalSource:`{
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
}`,...(ha=(pa=z.parameters)==null?void 0:pa.docs)==null?void 0:ha.source}}};var Ca,ka,ya;U.parameters={...U.parameters,docs:{...(Ca=U.parameters)==null?void 0:Ca.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    }
  }
}`,...(ya=(ka=U.parameters)==null?void 0:ka.docs)==null?void 0:ya.source}}};var xa,fa,Aa;B.parameters={...B.parameters,docs:{...(xa=B.parameters)==null?void 0:xa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    }
  }
}`,...(Aa=(fa=B.parameters)==null?void 0:fa.docs)==null?void 0:Aa.source}}};var va,ba,wa;P.parameters={...P.parameters,docs:{...(va=P.parameters)==null?void 0:va.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234
  }
}`,...(wa=(ba=P.parameters)==null?void 0:ba.docs)==null?void 0:wa.source}}};var La,Ea,ja;R.parameters={...R.parameters,docs:{...(La=R.parameters)==null?void 0:La.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    downloadCount: 5678
  }
}`,...(ja=(Ea=R.parameters)==null?void 0:Ea.docs)==null?void 0:ja.source}}};var Sa,Ma,Da;W.parameters={...W.parameters,docs:{...(Sa=W.parameters)==null?void 0:Sa.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(Da=(Ma=W.parameters)==null?void 0:Ma.docs)==null?void 0:Da.source}}};var Na,Ta,za;I.parameters={...I.parameters,docs:{...(Na=I.parameters)==null?void 0:Na.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked')
    },
    likeCount: 1234,
    downloadCount: 5678
  }
}`,...(za=(Ta=I.parameters)==null?void 0:Ta.docs)==null?void 0:za.source}}};var Ua,Ba,Pa;_.parameters={..._.parameters,docs:{...(Ua=_.parameters)==null?void 0:Ua.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 1235,
    downloadCount: 5678
  }
}`,...(Pa=(Ba=_.parameters)==null?void 0:Ba.docs)==null?void 0:Pa.source}}};var Ra,Wa,Ia;F.parameters={...F.parameters,docs:{...(Ra=F.parameters)==null?void 0:Ra.docs,source:{originalSource:`{
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
}`,...(Ia=(Wa=F.parameters)==null?void 0:Wa.docs)==null?void 0:Ia.source}}};var _a,Fa,Ga;G.parameters={...G.parameters,docs:{...(_a=G.parameters)==null?void 0:_a.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked')
    },
    likeCount: 123456,
    downloadCount: 9876543
  }
}`,...(Ga=(Fa=G.parameters)==null?void 0:Fa.docs)==null?void 0:Ga.source}}};var Ha,qa,Ja;H.parameters={...H.parameters,docs:{...(Ha=H.parameters)==null?void 0:Ha.docs,source:{originalSource:`{
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
}`,...(Ja=(qa=H.parameters)==null?void 0:qa.docs)==null?void 0:Ja.source}}};var Va,Ka,Oa;q.parameters={...q.parameters,docs:{...(Va=q.parameters)==null?void 0:Va.docs,source:{originalSource:`{
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
}`,...(Oa=(Ka=q.parameters)==null?void 0:Ka.docs)==null?void 0:Oa.source}}};const Nt=["Default","WithBadges","WithMultipleBadges","WithAllBadgeVariants","WithBadgesLeftAndRight","WithMultipleBadgesEachSide","WithoutImage","WithPlaceholder","ImageError","ManyTags","NoTags","LongName","Disabled","WithActions","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid","WithLikeButton","WithLikeButtonLiked","WithLikeCount","WithDownloadCount","WithPopularityStats","WithLikeButtonAndStats","WithLikeButtonLikedAndStats","WithLikeButtonAndActions","HighPopularityCounts","FullFeatured","GridLayoutWithPopularity"];export{N as AllStates,S as CustomMetadata,a as Default,L as Disabled,H as FullFeatured,D as FullyCustomMetadata,j as GridLayout,q as GridLayoutWithPopularity,G as HighPopularityCounts,A as ImageError,w as LongName,v as ManyTags,M as MetadataWithIcons,b as NoTags,T as Skeleton,z as SkeletonGrid,E as WithActions,C as WithAllBadgeVariants,p as WithBadges,k as WithBadgesLeftAndRight,R as WithDownloadCount,U as WithLikeButton,F as WithLikeButtonAndActions,I as WithLikeButtonAndStats,B as WithLikeButtonLiked,_ as WithLikeButtonLikedAndStats,P as WithLikeCount,h as WithMultipleBadges,y as WithMultipleBadgesEachSide,f as WithPlaceholder,W as WithPopularityStats,x as WithoutImage,Nt as __namedExportsOrder,Dt as default};
