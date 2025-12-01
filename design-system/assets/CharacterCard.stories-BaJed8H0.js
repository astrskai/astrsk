import{j as e}from"./iframe-Uxw7MMH5.js";import{C as s,M as ke,a as M}from"./CharacterCard-m6lDE3QP.js";import{c as be}from"./utils-DuMXYCiK.js";import{B as je}from"./CardMetadata-DilUp86a.js";import{S as r}from"./Skeleton-danfzlBd.js";import{S as Ee,C as De,D as Ne,T as Le,a as Ie}from"./trash-2-Sww5FV3v.js";import{c as Se}from"./createLucideIcon-CotmXz5v.js";import"./preload-helper-CwRszBsw.js";function o({className:a}){return e.jsxs(je,{className:be("min-h-[380px]",a),isDisabled:!0,children:[e.jsx("div",{className:"relative h-64 overflow-hidden bg-zinc-800",children:e.jsx(r,{className:"absolute inset-0 h-full w-full",variant:"default"})}),e.jsxs("div",{className:"relative z-10 -mt-12 flex flex-grow flex-col p-4",children:[e.jsx(r,{className:"mb-1 h-6 w-3/4"}),e.jsxs("div",{className:"mb-4 flex flex-wrap gap-2",children:[e.jsx(r,{className:"h-5 w-12"}),e.jsx(r,{className:"h-5 w-16"}),e.jsx(r,{className:"h-5 w-10"})]}),e.jsxs("div",{className:"mb-4 flex-grow space-y-2",children:[e.jsx(r,{className:"h-3 w-full"}),e.jsx(r,{className:"h-3 w-full"}),e.jsx(r,{className:"h-3 w-2/3"})]}),e.jsxs("div",{className:"flex items-center gap-2 border-t border-zinc-800 pt-3",children:[e.jsx(r,{className:"h-3 w-16"}),e.jsx(r,{className:"h-3 w-20"})]})]})]})}o.displayName="CharacterCardSkeleton";o.__docgenInfo={description:`CharacterCardSkeleton Component

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
\`\`\``,methods:[],displayName:"CharacterCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Te=[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]],Ue=Se("heart",Te);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e=[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]],Pe=Se("message-square",_e),qe={title:"Content/CharacterCard",component:s,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{name:{control:"text",description:"Character name"},imageUrl:{control:"text",description:"Character image URL"},summary:{control:"text",description:"Character summary/description"},tags:{control:"object",description:"Character tags array"},tokenCount:{control:"number",description:"Token count for the character"},updatedAt:{control:"text",description:"Last updated timestamp"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},showTypeIndicator:{control:"boolean",description:"Whether to show the CHARACTER badge"},placeholderImageUrl:{control:"text",description:"Placeholder image URL when imageUrl is not provided",table:{defaultValue:{summary:"img/placeholder/character-placeholder.png"}}},onClick:{action:"clicked"}},decorators:[a=>e.jsx("div",{style:{width:"280px"},children:e.jsx(a,{})})]},n="https://picsum.photos/seed/character1/400/600",k="https://picsum.photos/seed/character2/400/600",S="https://picsum.photos/seed/character3/400/600",Me="/astrsk/design-system/img/placeholder/character-placeholder.png",t={args:{name:"Alice Wonderland",imageUrl:n,summary:"A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.",tags:["Fantasy","Adventure","Classic"],tokenCount:1523,updatedAt:"2 days ago",placeholderImageUrl:Me}},i={args:{...t.args,showTypeIndicator:!0}},c={args:{name:"Mystery Character",summary:"A mysterious character with no image yet.",tags:["Unknown"],tokenCount:500,updatedAt:"Just now"}},d={args:{name:"Placeholder Character",summary:"A character using a placeholder image.",tags:["New"],tokenCount:0,updatedAt:"Just now",placeholderImageUrl:Me}},l={args:{name:"Alice Wonderland",imageUrl:"https://invalid-url-that-will-404.com/image.png",summary:"This character has an invalid image URL, showing the initial fallback.",tags:["Error","Fallback"],tokenCount:1e3,updatedAt:"Just now"}},m={args:{name:"Multi-Tagged Character",imageUrl:k,summary:"This character has many different tags to demonstrate overflow.",tags:["Fantasy","Romance","Drama","Action","Comedy","Slice of Life"],tokenCount:2500,updatedAt:"1 week ago"}},h={args:{name:"Tagless Character",imageUrl:S,summary:"A character without any tags.",tags:[],tokenCount:800,updatedAt:"3 hours ago"}},u={args:{name:"The Exceptionally Long Named Character of the Eastern Kingdoms",imageUrl:n,summary:"A character with a very long name that should be truncated.",tags:["Epic","Fantasy"],tokenCount:3e3,updatedAt:"1 month ago"}},g={args:{...t.args,isDisabled:!0}},p={args:{...t.args,actions:[{icon:Ee,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:De,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate character"},{icon:Ne,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export character"},{icon:Le,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete character",className:"hover:text-red-400"}]}},y={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(s,{name:"Alice Wonderland",imageUrl:n,summary:"A curious young girl who falls down a rabbit hole into a fantasy world.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago"}),e.jsx(s,{name:"Bob the Builder",imageUrl:k,summary:"Can we fix it? Yes we can! A cheerful constructor who solves problems.",tags:["Kids","Comedy"],tokenCount:890,updatedAt:"1 week ago",showTypeIndicator:!0}),e.jsx(s,{name:"Charlie Detective",imageUrl:S,summary:"A sharp-minded detective solving mysteries in the foggy streets of London.",tags:["Mystery","Thriller","Drama"],tokenCount:2100,updatedAt:"Just now"})]})},C={args:{name:"Popular Character",imageUrl:n,summary:"A character with custom metadata using renderMetadata prop.",tags:["Popular","Trending"],renderMetadata:()=>e.jsxs(ke,{children:[e.jsx(M,{icon:e.jsx(Ue,{className:"size-3"}),children:"2.5k likes"}),e.jsx(M,{icon:e.jsx(Pe,{className:"size-3"}),children:"128 chats"})]})}},x={args:{name:"Active Character",imageUrl:k,summary:"Demonstrating metadata items with icons for better visual clarity.",tags:["Active"],renderMetadata:()=>e.jsx(ke,{children:e.jsx(M,{icon:e.jsx(Ie,{className:"size-3"}),children:"Last active: 2h ago"})})}},A={args:{name:"Custom Layout Character",imageUrl:S,summary:"When you need complete control over metadata layout.",tags:["Custom"],renderMetadata:()=>e.jsxs("div",{className:"mt-auto grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"1.2k"}),e.jsx("div",{children:"Likes"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"89"}),e.jsx("div",{children:"Chats"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"4.8"}),e.jsx("div",{children:"Rating"})]})]})}},v={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(s,{name:"Default Character",imageUrl:n,summary:"A standard character card with all typical fields.",tags:["Tag1","Tag2"],tokenCount:1e3,updatedAt:"1 day ago"})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(s,{name:"Character with Badge",imageUrl:k,summary:"Shows the CHARACTER type badge.",tags:["Fantasy"],tokenCount:500,updatedAt:"5 hours ago",showTypeIndicator:!0})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Disabled"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(s,{name:"Disabled Character",imageUrl:S,summary:"This card is disabled and cannot be interacted with.",tags:["Locked"],tokenCount:0,isDisabled:!0})})]})]})},w={args:{...t.args},decorators:[a=>e.jsx("div",{style:{width:"280px"},children:e.jsx(a,{})})],render:()=>e.jsx(o,{})},f={args:{...t.args},decorators:[a=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(a,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(o,{}),e.jsx(o,{}),e.jsx(o,{})]})};var b,j,E;t.parameters={...t.parameters,docs:{...(b=t.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.',
    tags: ['Fantasy', 'Adventure', 'Classic'],
    tokenCount: 1523,
    updatedAt: '2 days ago',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(E=(j=t.parameters)==null?void 0:j.docs)==null?void 0:E.source}}};var D,N,L;i.parameters={...i.parameters,docs:{...(D=i.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    showTypeIndicator: true
  }
}`,...(L=(N=i.parameters)==null?void 0:N.docs)==null?void 0:L.source}}};var I,T,U;c.parameters={...c.parameters,docs:{...(I=c.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    name: 'Mystery Character',
    summary: 'A mysterious character with no image yet.',
    tags: ['Unknown'],
    tokenCount: 500,
    updatedAt: 'Just now'
  }
}`,...(U=(T=c.parameters)==null?void 0:T.docs)==null?void 0:U.source}}};var _,P,W;d.parameters={...d.parameters,docs:{...(_=d.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    name: 'Placeholder Character',
    summary: 'A character using a placeholder image.',
    tags: ['New'],
    tokenCount: 0,
    updatedAt: 'Just now',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(W=(P=d.parameters)==null?void 0:P.docs)==null?void 0:W.source}}};var z,G,R;l.parameters={...l.parameters,docs:{...(z=l.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: 'https://invalid-url-that-will-404.com/image.png',
    summary: 'This character has an invalid image URL, showing the initial fallback.',
    tags: ['Error', 'Fallback'],
    tokenCount: 1000,
    updatedAt: 'Just now'
  }
}`,...(R=(G=l.parameters)==null?void 0:G.docs)==null?void 0:R.source}}};var F,B,H;m.parameters={...m.parameters,docs:{...(F=m.parameters)==null?void 0:F.docs,source:{originalSource:`{
  args: {
    name: 'Multi-Tagged Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'This character has many different tags to demonstrate overflow.',
    tags: ['Fantasy', 'Romance', 'Drama', 'Action', 'Comedy', 'Slice of Life'],
    tokenCount: 2500,
    updatedAt: '1 week ago'
  }
}`,...(H=(B=m.parameters)==null?void 0:B.docs)==null?void 0:H.source}}};var J,q,K;h.parameters={...h.parameters,docs:{...(J=h.parameters)==null?void 0:J.docs,source:{originalSource:`{
  args: {
    name: 'Tagless Character',
    imageUrl: SAMPLE_IMAGE_3,
    summary: 'A character without any tags.',
    tags: [],
    tokenCount: 800,
    updatedAt: '3 hours ago'
  }
}`,...(K=(q=h.parameters)==null?void 0:q.docs)==null?void 0:K.source}}};var O,$,V;u.parameters={...u.parameters,docs:{...(O=u.parameters)==null?void 0:O.docs,source:{originalSource:`{
  args: {
    name: 'The Exceptionally Long Named Character of the Eastern Kingdoms',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A character with a very long name that should be truncated.',
    tags: ['Epic', 'Fantasy'],
    tokenCount: 3000,
    updatedAt: '1 month ago'
  }
}`,...(V=($=u.parameters)==null?void 0:$.docs)==null?void 0:V.source}}};var Y,Z,Q;g.parameters={...g.parameters,docs:{...(Y=g.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(Q=(Z=g.parameters)==null?void 0:Z.docs)==null?void 0:Q.source}}};var X,ee,ae;p.parameters={...p.parameters,docs:{...(X=p.parameters)==null?void 0:X.docs,source:{originalSource:`{
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
}`,...(ae=(ee=p.parameters)==null?void 0:ee.docs)==null?void 0:ae.source}}};var te,re,se;y.parameters={...y.parameters,docs:{...(te=y.parameters)==null?void 0:te.docs,source:{originalSource:`{
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
      <CharacterCard name="Bob the Builder" imageUrl={SAMPLE_IMAGE_2} summary="Can we fix it? Yes we can! A cheerful constructor who solves problems." tags={['Kids', 'Comedy']} tokenCount={890} updatedAt="1 week ago" showTypeIndicator />
      <CharacterCard name="Charlie Detective" imageUrl={SAMPLE_IMAGE_3} summary="A sharp-minded detective solving mysteries in the foggy streets of London." tags={['Mystery', 'Thriller', 'Drama']} tokenCount={2100} updatedAt="Just now" />
    </>
}`,...(se=(re=y.parameters)==null?void 0:re.docs)==null?void 0:se.source}}};var oe,ne,ie;C.parameters={...C.parameters,docs:{...(oe=C.parameters)==null?void 0:oe.docs,source:{originalSource:`{
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
}`,...(ie=(ne=C.parameters)==null?void 0:ne.docs)==null?void 0:ie.source}}};var ce,de,le;x.parameters={...x.parameters,docs:{...(ce=x.parameters)==null?void 0:ce.docs,source:{originalSource:`{
  args: {
    name: 'Active Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'Demonstrating metadata items with icons for better visual clarity.',
    tags: ['Active'],
    renderMetadata: () => <MetadataContainer>
        <MetadataItem icon={<Clock className="size-3" />}>Last active: 2h ago</MetadataItem>
      </MetadataContainer>
  }
}`,...(le=(de=x.parameters)==null?void 0:de.docs)==null?void 0:le.source}}};var me,he,ue;A.parameters={...A.parameters,docs:{...(me=A.parameters)==null?void 0:me.docs,source:{originalSource:`{
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
}`,...(ue=(he=A.parameters)==null?void 0:he.docs)==null?void 0:ue.source}}};var ge,pe,ye;v.parameters={...v.parameters,docs:{...(ge=v.parameters)==null?void 0:ge.docs,source:{originalSource:`{
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
          <CharacterCard name="Character with Badge" imageUrl={SAMPLE_IMAGE_2} summary="Shows the CHARACTER type badge." tags={['Fantasy']} tokenCount={500} updatedAt="5 hours ago" showTypeIndicator />
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
}`,...(ye=(pe=v.parameters)==null?void 0:pe.docs)==null?void 0:ye.source}}};var Ce,xe,Ae;w.parameters={...w.parameters,docs:{...(Ce=w.parameters)==null?void 0:Ce.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '280px'
  }}>
        <Story />
      </div>],
  render: () => <CharacterCardSkeleton />
}`,...(Ae=(xe=w.parameters)==null?void 0:xe.docs)==null?void 0:Ae.source}}};var ve,we,fe;f.parameters={...f.parameters,docs:{...(ve=f.parameters)==null?void 0:ve.docs,source:{originalSource:`{
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
}`,...(fe=(we=f.parameters)==null?void 0:we.docs)==null?void 0:fe.source}}};const Ke=["Default","WithTypeIndicator","WithoutImage","WithPlaceholder","ImageError","ManyTags","NoTags","LongName","Disabled","WithActions","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid"];export{v as AllStates,C as CustomMetadata,t as Default,g as Disabled,A as FullyCustomMetadata,y as GridLayout,l as ImageError,u as LongName,m as ManyTags,x as MetadataWithIcons,h as NoTags,w as Skeleton,f as SkeletonGrid,p as WithActions,d as WithPlaceholder,i as WithTypeIndicator,c as WithoutImage,Ke as __namedExportsOrder,qe as default};
