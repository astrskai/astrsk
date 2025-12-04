import{r as F,j as e}from"./iframe-CJd9dEJT.js";import{c as aa}from"./utils-DuMXYCiK.js";import{B as ta,C as ha,a as J,b as ra,c as I,S as xa,d as ya,D as Ca,T as fa,L as n,e as va}from"./CardBadges-DHR4A2js.js";import{S as r}from"./Skeleton-objcXKWa.js";import{L as T,U as sa}from"./user-A_O7fgCu.js";import{c as Aa}from"./createLucideIcon-D-XtMVmw.js";import{M as ba}from"./message-square-9mQpa41o.js";import"./preload-helper-CwRszBsw.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wa=[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]],ja=Aa("heart",wa),na=ra,P=I;function s({name:a,imageUrl:R,summary:_,tags:l,tokenCount:ia=0,updatedAt:W,className:ca,actions:la=[],isDisabled:da=!1,onClick:ma,badges:d=[],placeholderImageUrl:U,renderMetadata:B,emptySummaryText:H="No summary"}){const[ua,G]=F.useState(!1);F.useEffect(()=>{G(!1)},[R,U]);const q=(R||U)&&!ua,pa=!q;return e.jsxs(ta,{className:aa("min-h-[380px]",ca),isDisabled:da,onClick:ma,children:[e.jsxs("div",{className:"relative h-64 overflow-hidden bg-zinc-800",children:[q&&e.jsx("img",{src:R||U,alt:a,className:"absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",loading:"lazy",onError:()=>G(!0)}),pa&&e.jsx("div",{className:"absolute inset-0 flex items-center justify-center",children:e.jsx("span",{className:"text-6xl font-bold text-zinc-600",children:a.charAt(0).toUpperCase()||"?"})}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90"}),e.jsx(ha,{actions:la}),d.some(o=>(o.position??"left")==="left")&&e.jsx("div",{className:"absolute top-3 left-3 z-10 max-w-[45%]",children:e.jsx(J,{badges:d,position:"left"})}),d.some(o=>o.position==="right")&&e.jsx("div",{className:"absolute top-3 right-3 z-10 max-w-[45%]",children:e.jsx(J,{badges:d,position:"right"})})]}),e.jsxs("div",{className:"relative z-10 -mt-12 flex flex-grow flex-col p-4",children:[e.jsx("h3",{className:"mb-1 line-clamp-2 text-lg md:text-xl font-bold break-words text-white drop-shadow-md",children:a}),e.jsx("div",{className:"mb-2 md:mb-4 flex flex-wrap gap-2",children:l.length>0?e.jsxs(e.Fragment,{children:[l.slice(0,3).map((o,ga)=>e.jsx("span",{className:"rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",children:o},`${o}-${ga}`)),l.length>3&&e.jsxs("span",{className:"rounded border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300",children:["+",l.length-3]})]}):e.jsx("span",{className:"text-[10px] text-zinc-600",children:"No tags"})}),(_||H)&&e.jsx("p",{className:"mb-2 md:mb-4 line-clamp-2 flex-grow text-xs leading-relaxed break-all text-ellipsis text-zinc-400",children:_||H}),B?B():e.jsxs(ra,{children:[e.jsxs(I,{children:[ia," Tokens"]}),W&&e.jsx(I,{children:W})]})]})]})}s.__docgenInfo={description:"",methods:[],displayName:"CharacterCard",props:{name:{required:!0,tsType:{name:"string"},description:"Character name"},imageUrl:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:"Character image URL"},summary:{required:!1,tsType:{name:"string"},description:"Character summary/description"},tags:{required:!0,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"Character tags"},tokenCount:{required:!1,tsType:{name:"number"},description:"Token count for the character (used in default metadata)",defaultValue:{value:"0",computed:!1}},updatedAt:{required:!1,tsType:{name:"string"},description:"Last updated timestamp (used in default metadata)"},actions:{required:!1,tsType:{name:"Array",elements:[{name:"CardAction"}],raw:"CardAction[]"},description:"Action buttons displayed on the card",defaultValue:{value:"[]",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"},isDisabled:{required:!1,tsType:{name:"boolean"},description:"Whether the card is disabled",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Click handler for the card"},badges:{required:!1,tsType:{name:"Array",elements:[{name:"CardBadge"}],raw:"CardBadge[]"},description:"Badges to display on the card (e.g., type indicator, private, owner).",defaultValue:{value:"[]",computed:!1}},placeholderImageUrl:{required:!1,tsType:{name:"string"},description:"Placeholder image URL when imageUrl is not provided"},renderMetadata:{required:!1,tsType:{name:"signature",type:"function",raw:"() => React.ReactNode",signature:{arguments:[],return:{name:"ReactReactNode",raw:"React.ReactNode"}}},description:`Custom render function for the metadata section.
When provided, replaces the default tokenCount/updatedAt display.
Use CardMetadataContainer and CardMetadataItem for consistent styling.`},emptySummaryText:{required:!1,tsType:{name:"string"},description:'Text to display when summary is empty. Defaults to "No summary". Set to empty string to hide.',defaultValue:{value:"'No summary'",computed:!1}}}};function i({className:a}){return e.jsxs(ta,{className:aa("min-h-[380px]",a),isDisabled:!0,children:[e.jsx("div",{className:"relative h-64 overflow-hidden bg-zinc-800",children:e.jsx(r,{className:"absolute inset-0 h-full w-full",variant:"default"})}),e.jsxs("div",{className:"relative z-10 -mt-12 flex flex-grow flex-col p-4",children:[e.jsx(r,{className:"mb-1 h-6 w-3/4"}),e.jsxs("div",{className:"mb-4 flex flex-wrap gap-2",children:[e.jsx(r,{className:"h-5 w-12"}),e.jsx(r,{className:"h-5 w-16"}),e.jsx(r,{className:"h-5 w-10"})]}),e.jsxs("div",{className:"mb-4 flex-grow space-y-2",children:[e.jsx(r,{className:"h-3 w-full"}),e.jsx(r,{className:"h-3 w-full"}),e.jsx(r,{className:"h-3 w-2/3"})]}),e.jsxs("div",{className:"flex items-center gap-2 border-t border-zinc-800 pt-3",children:[e.jsx(r,{className:"h-3 w-16"}),e.jsx(r,{className:"h-3 w-20"})]})]})]})}i.displayName="CharacterCardSkeleton";i.__docgenInfo={description:`CharacterCardSkeleton Component

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
\`\`\``,methods:[],displayName:"CharacterCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};const Da={title:"Content/CharacterCard",component:s,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{name:{control:"text",description:"Character name"},imageUrl:{control:"text",description:"Character image URL"},summary:{control:"text",description:"Character summary/description"},tags:{control:"object",description:"Character tags array"},tokenCount:{control:"number",description:"Token count for the character"},updatedAt:{control:"text",description:"Last updated timestamp"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},badges:{control:"object",description:"Badges to display on the card"},placeholderImageUrl:{control:"text",description:"Placeholder image URL when imageUrl is not provided",table:{defaultValue:{summary:"img/placeholder/character-placeholder.png"}}},onClick:{action:"clicked"}},decorators:[a=>e.jsx("div",{style:{width:"280px"},children:e.jsx(a,{})})]},c="https://picsum.photos/seed/character1/400/600",z="https://picsum.photos/seed/character2/400/600",D="https://picsum.photos/seed/character3/400/600",oa="/astrsk/design-system/img/placeholder/character-placeholder.png",t={args:{name:"Alice Wonderland",imageUrl:c,summary:"A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.",tags:["Fantasy","Adventure","Classic"],tokenCount:1523,updatedAt:"2 days ago",placeholderImageUrl:oa}},m={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(n,{size:12})}]}},u={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(n,{size:12})},{label:"Private",variant:"private",icon:e.jsx(T,{size:12})}]}},p={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(n,{size:12})},{label:"Private",variant:"private",icon:e.jsx(T,{size:12})},{label:"Mine",variant:"owner",icon:e.jsx(sa,{size:12})}]}},g={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(n,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(T,{size:12}),position:"right"}]}},h={args:{...t.args,badges:[{label:"CHARACTER",icon:e.jsx(n,{size:12}),position:"left"},{label:"Mine",variant:"owner",icon:e.jsx(sa,{size:12}),position:"left"},{label:"Private",variant:"private",icon:e.jsx(T,{size:12}),position:"right"}]}},x={args:{name:"Mystery Character",summary:"A mysterious character with no image yet.",tags:["Unknown"],tokenCount:500,updatedAt:"Just now"}},y={args:{name:"Placeholder Character",summary:"A character using a placeholder image.",tags:["New"],tokenCount:0,updatedAt:"Just now",placeholderImageUrl:oa}},C={args:{name:"Alice Wonderland",imageUrl:"https://invalid-url-that-will-404.com/image.png",summary:"This character has an invalid image URL, showing the initial fallback.",tags:["Error","Fallback"],tokenCount:1e3,updatedAt:"Just now"}},f={args:{name:"Multi-Tagged Character",imageUrl:z,summary:"This character has many different tags to demonstrate overflow.",tags:["Fantasy","Romance","Drama","Action","Comedy","Slice of Life"],tokenCount:2500,updatedAt:"1 week ago"}},v={args:{name:"Tagless Character",imageUrl:D,summary:"A character without any tags.",tags:[],tokenCount:800,updatedAt:"3 hours ago"}},A={args:{name:"The Exceptionally Long Named Character of the Eastern Kingdoms",imageUrl:c,summary:"A character with a very long name that should be truncated.",tags:["Epic","Fantasy"],tokenCount:3e3,updatedAt:"1 month ago"}},b={args:{...t.args,isDisabled:!0}},w={args:{...t.args,actions:[{icon:xa,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:ya,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate character"},{icon:Ca,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export character"},{icon:fa,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete character",className:"hover:text-red-400"}]}},j={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(s,{name:"Alice Wonderland",imageUrl:c,summary:"A curious young girl who falls down a rabbit hole into a fantasy world.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago"}),e.jsx(s,{name:"Bob the Builder",imageUrl:z,summary:"Can we fix it? Yes we can! A cheerful constructor who solves problems.",tags:["Kids","Comedy"],tokenCount:890,updatedAt:"1 week ago",badges:[{label:"CHARACTER",icon:e.jsx(n,{size:12})}]}),e.jsx(s,{name:"Charlie Detective",imageUrl:D,summary:"A sharp-minded detective solving mysteries in the foggy streets of London.",tags:["Mystery","Thriller","Drama"],tokenCount:2100,updatedAt:"Just now"})]})},k={args:{name:"Popular Character",imageUrl:c,summary:"A character with custom metadata using renderMetadata prop.",tags:["Popular","Trending"],renderMetadata:()=>e.jsxs(na,{children:[e.jsx(P,{icon:e.jsx(ja,{className:"size-3"}),children:"2.5k likes"}),e.jsx(P,{icon:e.jsx(ba,{className:"size-3"}),children:"128 chats"})]})}},S={args:{name:"Active Character",imageUrl:z,summary:"Demonstrating metadata items with icons for better visual clarity.",tags:["Active"],renderMetadata:()=>e.jsx(na,{children:e.jsx(P,{icon:e.jsx(va,{className:"size-3"}),children:"Last active: 2h ago"})})}},E={args:{name:"Custom Layout Character",imageUrl:D,summary:"When you need complete control over metadata layout.",tags:["Custom"],renderMetadata:()=>e.jsxs("div",{className:"mt-auto grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"1.2k"}),e.jsx("div",{children:"Likes"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"89"}),e.jsx("div",{children:"Chats"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"4.8"}),e.jsx("div",{children:"Rating"})]})]})}},M={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(s,{name:"Default Character",imageUrl:c,summary:"A standard character card with all typical fields.",tags:["Tag1","Tag2"],tokenCount:1e3,updatedAt:"1 day ago"})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(s,{name:"Character with Badge",imageUrl:z,summary:"Shows the CHARACTER type badge.",tags:["Fantasy"],tokenCount:500,updatedAt:"5 hours ago",badges:[{label:"CHARACTER",icon:e.jsx(n,{size:12})}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Disabled"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(s,{name:"Disabled Character",imageUrl:D,summary:"This card is disabled and cannot be interacted with.",tags:["Locked"],tokenCount:0,isDisabled:!0})})]})]})},N={args:{...t.args},decorators:[a=>e.jsx("div",{style:{width:"280px"},children:e.jsx(a,{})})],render:()=>e.jsx(i,{})},L={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(i,{}),e.jsx(i,{}),e.jsx(i,{})]})};var V,K,O;t.parameters={...t.parameters,docs:{...(V=t.parameters)==null?void 0:V.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.',
    tags: ['Fantasy', 'Adventure', 'Classic'],
    tokenCount: 1523,
    updatedAt: '2 days ago',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(O=(K=t.parameters)==null?void 0:K.docs)==null?void 0:O.source}}};var $,Y,Z;m.parameters={...m.parameters,docs:{...($=m.parameters)==null?void 0:$.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    badges: [{
      label: 'CHARACTER',
      icon: <Layers size={12} />
    }]
  }
}`,...(Z=(Y=m.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};var Q,X,ee;u.parameters={...u.parameters,docs:{...(Q=u.parameters)==null?void 0:Q.docs,source:{originalSource:`{
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
}`,...(ee=(X=u.parameters)==null?void 0:X.docs)==null?void 0:ee.source}}};var ae,te,re;p.parameters={...p.parameters,docs:{...(ae=p.parameters)==null?void 0:ae.docs,source:{originalSource:`{
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
}`,...(re=(te=p.parameters)==null?void 0:te.docs)==null?void 0:re.source}}};var se,ne,oe;g.parameters={...g.parameters,docs:{...(se=g.parameters)==null?void 0:se.docs,source:{originalSource:`{
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
}`,...(oe=(ne=g.parameters)==null?void 0:ne.docs)==null?void 0:oe.source}}};var ie,ce,le;h.parameters={...h.parameters,docs:{...(ie=h.parameters)==null?void 0:ie.docs,source:{originalSource:`{
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
}`,...(le=(ce=h.parameters)==null?void 0:ce.docs)==null?void 0:le.source}}};var de,me,ue;x.parameters={...x.parameters,docs:{...(de=x.parameters)==null?void 0:de.docs,source:{originalSource:`{
  args: {
    name: 'Mystery Character',
    summary: 'A mysterious character with no image yet.',
    tags: ['Unknown'],
    tokenCount: 500,
    updatedAt: 'Just now'
  }
}`,...(ue=(me=x.parameters)==null?void 0:me.docs)==null?void 0:ue.source}}};var pe,ge,he;y.parameters={...y.parameters,docs:{...(pe=y.parameters)==null?void 0:pe.docs,source:{originalSource:`{
  args: {
    name: 'Placeholder Character',
    summary: 'A character using a placeholder image.',
    tags: ['New'],
    tokenCount: 0,
    updatedAt: 'Just now',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(he=(ge=y.parameters)==null?void 0:ge.docs)==null?void 0:he.source}}};var xe,ye,Ce;C.parameters={...C.parameters,docs:{...(xe=C.parameters)==null?void 0:xe.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: 'https://invalid-url-that-will-404.com/image.png',
    summary: 'This character has an invalid image URL, showing the initial fallback.',
    tags: ['Error', 'Fallback'],
    tokenCount: 1000,
    updatedAt: 'Just now'
  }
}`,...(Ce=(ye=C.parameters)==null?void 0:ye.docs)==null?void 0:Ce.source}}};var fe,ve,Ae;f.parameters={...f.parameters,docs:{...(fe=f.parameters)==null?void 0:fe.docs,source:{originalSource:`{
  args: {
    name: 'Multi-Tagged Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'This character has many different tags to demonstrate overflow.',
    tags: ['Fantasy', 'Romance', 'Drama', 'Action', 'Comedy', 'Slice of Life'],
    tokenCount: 2500,
    updatedAt: '1 week ago'
  }
}`,...(Ae=(ve=f.parameters)==null?void 0:ve.docs)==null?void 0:Ae.source}}};var be,we,je;v.parameters={...v.parameters,docs:{...(be=v.parameters)==null?void 0:be.docs,source:{originalSource:`{
  args: {
    name: 'Tagless Character',
    imageUrl: SAMPLE_IMAGE_3,
    summary: 'A character without any tags.',
    tags: [],
    tokenCount: 800,
    updatedAt: '3 hours ago'
  }
}`,...(je=(we=v.parameters)==null?void 0:we.docs)==null?void 0:je.source}}};var ke,Se,Ee;A.parameters={...A.parameters,docs:{...(ke=A.parameters)==null?void 0:ke.docs,source:{originalSource:`{
  args: {
    name: 'The Exceptionally Long Named Character of the Eastern Kingdoms',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A character with a very long name that should be truncated.',
    tags: ['Epic', 'Fantasy'],
    tokenCount: 3000,
    updatedAt: '1 month ago'
  }
}`,...(Ee=(Se=A.parameters)==null?void 0:Se.docs)==null?void 0:Ee.source}}};var Me,Ne,Le;b.parameters={...b.parameters,docs:{...(Me=b.parameters)==null?void 0:Me.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(Le=(Ne=b.parameters)==null?void 0:Ne.docs)==null?void 0:Le.source}}};var Te,ze,De;w.parameters={...w.parameters,docs:{...(Te=w.parameters)==null?void 0:Te.docs,source:{originalSource:`{
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
}`,...(De=(ze=w.parameters)==null?void 0:ze.docs)==null?void 0:De.source}}};var Re,Ue,Ie;j.parameters={...j.parameters,docs:{...(Re=j.parameters)==null?void 0:Re.docs,source:{originalSource:`{
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
}`,...(Ie=(Ue=j.parameters)==null?void 0:Ue.docs)==null?void 0:Ie.source}}};var Pe,_e,We;k.parameters={...k.parameters,docs:{...(Pe=k.parameters)==null?void 0:Pe.docs,source:{originalSource:`{
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
}`,...(We=(_e=k.parameters)==null?void 0:_e.docs)==null?void 0:We.source}}};var Be,He,Ge;S.parameters={...S.parameters,docs:{...(Be=S.parameters)==null?void 0:Be.docs,source:{originalSource:`{
  args: {
    name: 'Active Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'Demonstrating metadata items with icons for better visual clarity.',
    tags: ['Active'],
    renderMetadata: () => <MetadataContainer>
        <MetadataItem icon={<Clock className="size-3" />}>Last active: 2h ago</MetadataItem>
      </MetadataContainer>
  }
}`,...(Ge=(He=S.parameters)==null?void 0:He.docs)==null?void 0:Ge.source}}};var qe,Fe,Je;E.parameters={...E.parameters,docs:{...(qe=E.parameters)==null?void 0:qe.docs,source:{originalSource:`{
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
}`,...(Je=(Fe=E.parameters)==null?void 0:Fe.docs)==null?void 0:Je.source}}};var Ve,Ke,Oe;M.parameters={...M.parameters,docs:{...(Ve=M.parameters)==null?void 0:Ve.docs,source:{originalSource:`{
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
}`,...(Oe=(Ke=M.parameters)==null?void 0:Ke.docs)==null?void 0:Oe.source}}};var $e,Ye,Ze;N.parameters={...N.parameters,docs:{...($e=N.parameters)==null?void 0:$e.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '280px'
  }}>
        <Story />
      </div>],
  render: () => <CharacterCardSkeleton />
}`,...(Ze=(Ye=N.parameters)==null?void 0:Ye.docs)==null?void 0:Ze.source}}};var Qe,Xe,ea;L.parameters={...L.parameters,docs:{...(Qe=L.parameters)==null?void 0:Qe.docs,source:{originalSource:`{
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
}`,...(ea=(Xe=L.parameters)==null?void 0:Xe.docs)==null?void 0:ea.source}}};const Ra=["Default","WithBadges","WithMultipleBadges","WithAllBadgeVariants","WithBadgesLeftAndRight","WithMultipleBadgesEachSide","WithoutImage","WithPlaceholder","ImageError","ManyTags","NoTags","LongName","Disabled","WithActions","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid"];export{M as AllStates,k as CustomMetadata,t as Default,b as Disabled,E as FullyCustomMetadata,j as GridLayout,C as ImageError,A as LongName,f as ManyTags,S as MetadataWithIcons,v as NoTags,N as Skeleton,L as SkeletonGrid,w as WithActions,p as WithAllBadgeVariants,m as WithBadges,g as WithBadgesLeftAndRight,u as WithMultipleBadges,h as WithMultipleBadgesEachSide,y as WithPlaceholder,x as WithoutImage,Ra as __namedExportsOrder,Da as default};
