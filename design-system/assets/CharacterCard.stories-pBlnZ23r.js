import{j as e}from"./iframe-VINGRqCx.js";import{C as t,M as de,a as v}from"./CharacterCard-DqIuNJAC.js";import{S as ue,C as ge,D as he,T as pe,a as ye}from"./trash-2-28HiSUPp.js";import{c as le}from"./createLucideIcon-CxqYMi1z.js";import"./preload-helper-CwRszBsw.js";import"./utils-DuMXYCiK.js";import"./CardMetadata-DWObe_ff.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ce=[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]],xe=le("heart",Ce);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ae=[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]],ve=le("message-square",Ae),De={title:"Content/CharacterCard",component:t,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{name:{control:"text",description:"Character name"},imageUrl:{control:"text",description:"Character image URL"},summary:{control:"text",description:"Character summary/description"},tags:{control:"object",description:"Character tags array"},tokenCount:{control:"number",description:"Token count for the character"},updatedAt:{control:"text",description:"Last updated timestamp"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},showTypeIndicator:{control:"boolean",description:"Whether to show the CHARACTER badge"},placeholderImageUrl:{control:"text",description:"Placeholder image URL when imageUrl is not provided",table:{defaultValue:{summary:"img/placeholder/character-placeholder.png"}}},onClick:{action:"clicked"}},decorators:[r=>e.jsx("div",{style:{width:"280px"},children:e.jsx(r,{})})]},s="https://picsum.photos/seed/character1/400/600",x="https://picsum.photos/seed/character2/400/600",A="https://picsum.photos/seed/character3/400/600",me="/astrsk/design-system/img/placeholder/character-placeholder.png",a={args:{name:"Alice Wonderland",imageUrl:s,summary:"A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.",tags:["Fantasy","Adventure","Classic"],tokenCount:1523,updatedAt:"2 days ago",placeholderImageUrl:me}},o={args:{...a.args,showTypeIndicator:!0}},n={args:{name:"Mystery Character",summary:"A mysterious character with no image yet.",tags:["Unknown"],tokenCount:500,updatedAt:"Just now"}},i={args:{name:"Placeholder Character",summary:"A character using a placeholder image.",tags:["New"],tokenCount:0,updatedAt:"Just now",placeholderImageUrl:me}},c={args:{name:"Multi-Tagged Character",imageUrl:x,summary:"This character has many different tags to demonstrate overflow.",tags:["Fantasy","Romance","Drama","Action","Comedy","Slice of Life"],tokenCount:2500,updatedAt:"1 week ago"}},d={args:{name:"Tagless Character",imageUrl:A,summary:"A character without any tags.",tags:[],tokenCount:800,updatedAt:"3 hours ago"}},l={args:{name:"The Exceptionally Long Named Character of the Eastern Kingdoms",imageUrl:s,summary:"A character with a very long name that should be truncated.",tags:["Epic","Fantasy"],tokenCount:3e3,updatedAt:"1 month ago"}},m={args:{...a.args,isDisabled:!0}},u={args:{...a.args,actions:[{icon:ue,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit character"},{icon:ge,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate character"},{icon:he,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export character"},{icon:pe,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete character",className:"hover:text-red-400"}]}},g={args:{...a.args},decorators:[r=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 280px)",gap:"24px"},children:e.jsx(r,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(t,{name:"Alice Wonderland",imageUrl:s,summary:"A curious young girl who falls down a rabbit hole into a fantasy world.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago"}),e.jsx(t,{name:"Bob the Builder",imageUrl:x,summary:"Can we fix it? Yes we can! A cheerful constructor who solves problems.",tags:["Kids","Comedy"],tokenCount:890,updatedAt:"1 week ago",showTypeIndicator:!0}),e.jsx(t,{name:"Charlie Detective",imageUrl:A,summary:"A sharp-minded detective solving mysteries in the foggy streets of London.",tags:["Mystery","Thriller","Drama"],tokenCount:2100,updatedAt:"Just now"})]})},h={args:{name:"Popular Character",imageUrl:s,summary:"A character with custom metadata using renderMetadata prop.",tags:["Popular","Trending"],renderMetadata:()=>e.jsxs(de,{children:[e.jsx(v,{icon:e.jsx(xe,{className:"size-3"}),children:"2.5k likes"}),e.jsx(v,{icon:e.jsx(ve,{className:"size-3"}),children:"128 chats"})]})}},p={args:{name:"Active Character",imageUrl:x,summary:"Demonstrating metadata items with icons for better visual clarity.",tags:["Active"],renderMetadata:()=>e.jsx(de,{children:e.jsx(v,{icon:e.jsx(ye,{className:"size-3"}),children:"Last active: 2h ago"})})}},y={args:{name:"Custom Layout Character",imageUrl:A,summary:"When you need complete control over metadata layout.",tags:["Custom"],renderMetadata:()=>e.jsxs("div",{className:"mt-auto grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"1.2k"}),e.jsx("div",{children:"Likes"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"89"}),e.jsx("div",{children:"Chats"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"4.8"}),e.jsx("div",{children:"Rating"})]})]})}},C={args:{...a.args},decorators:[r=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(r,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(t,{name:"Default Character",imageUrl:s,summary:"A standard character card with all typical fields.",tags:["Tag1","Tag2"],tokenCount:1e3,updatedAt:"1 day ago"})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(t,{name:"Character with Badge",imageUrl:x,summary:"Shows the CHARACTER type badge.",tags:["Fantasy"],tokenCount:500,updatedAt:"5 hours ago",showTypeIndicator:!0})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Disabled"}),e.jsx("div",{style:{width:"280px"},children:e.jsx(t,{name:"Disabled Character",imageUrl:A,summary:"This card is disabled and cannot be interacted with.",tags:["Locked"],tokenCount:0,isDisabled:!0})})]})]})};var w,M,f;a.parameters={...a.parameters,docs:{...(w=a.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    name: 'Alice Wonderland',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.',
    tags: ['Fantasy', 'Adventure', 'Classic'],
    tokenCount: 1523,
    updatedAt: '2 days ago',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(f=(M=a.parameters)==null?void 0:M.docs)==null?void 0:f.source}}};var k,E,b;o.parameters={...o.parameters,docs:{...(k=o.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    showTypeIndicator: true
  }
}`,...(b=(E=o.parameters)==null?void 0:E.docs)==null?void 0:b.source}}};var S,D,L;n.parameters={...n.parameters,docs:{...(S=n.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    name: 'Mystery Character',
    summary: 'A mysterious character with no image yet.',
    tags: ['Unknown'],
    tokenCount: 500,
    updatedAt: 'Just now'
  }
}`,...(L=(D=n.parameters)==null?void 0:D.docs)==null?void 0:L.source}}};var j,I,T;i.parameters={...i.parameters,docs:{...(j=i.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    name: 'Placeholder Character',
    summary: 'A character using a placeholder image.',
    tags: ['New'],
    tokenCount: 0,
    updatedAt: 'Just now',
    placeholderImageUrl: SAMPLE_PLACEHOLDER
  }
}`,...(T=(I=i.parameters)==null?void 0:I.docs)==null?void 0:T.source}}};var U,_,N;c.parameters={...c.parameters,docs:{...(U=c.parameters)==null?void 0:U.docs,source:{originalSource:`{
  args: {
    name: 'Multi-Tagged Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'This character has many different tags to demonstrate overflow.',
    tags: ['Fantasy', 'Romance', 'Drama', 'Action', 'Comedy', 'Slice of Life'],
    tokenCount: 2500,
    updatedAt: '1 week ago'
  }
}`,...(N=(_=c.parameters)==null?void 0:_.docs)==null?void 0:N.source}}};var P,W,z;d.parameters={...d.parameters,docs:{...(P=d.parameters)==null?void 0:P.docs,source:{originalSource:`{
  args: {
    name: 'Tagless Character',
    imageUrl: SAMPLE_IMAGE_3,
    summary: 'A character without any tags.',
    tags: [],
    tokenCount: 800,
    updatedAt: '3 hours ago'
  }
}`,...(z=(W=d.parameters)==null?void 0:W.docs)==null?void 0:z.source}}};var G,R,F;l.parameters={...l.parameters,docs:{...(G=l.parameters)==null?void 0:G.docs,source:{originalSource:`{
  args: {
    name: 'The Exceptionally Long Named Character of the Eastern Kingdoms',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A character with a very long name that should be truncated.',
    tags: ['Epic', 'Fantasy'],
    tokenCount: 3000,
    updatedAt: '1 month ago'
  }
}`,...(F=(R=l.parameters)==null?void 0:R.docs)==null?void 0:F.source}}};var B,H,J;m.parameters={...m.parameters,docs:{...(B=m.parameters)==null?void 0:B.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(J=(H=m.parameters)==null?void 0:H.docs)==null?void 0:J.source}}};var q,K,O;u.parameters={...u.parameters,docs:{...(q=u.parameters)==null?void 0:q.docs,source:{originalSource:`{
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
}`,...(O=(K=u.parameters)==null?void 0:K.docs)==null?void 0:O.source}}};var V,Y,$;g.parameters={...g.parameters,docs:{...(V=g.parameters)==null?void 0:V.docs,source:{originalSource:`{
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
}`,...($=(Y=g.parameters)==null?void 0:Y.docs)==null?void 0:$.source}}};var Z,Q,X;h.parameters={...h.parameters,docs:{...(Z=h.parameters)==null?void 0:Z.docs,source:{originalSource:`{
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
}`,...(X=(Q=h.parameters)==null?void 0:Q.docs)==null?void 0:X.source}}};var ee,ae,te;p.parameters={...p.parameters,docs:{...(ee=p.parameters)==null?void 0:ee.docs,source:{originalSource:`{
  args: {
    name: 'Active Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'Demonstrating metadata items with icons for better visual clarity.',
    tags: ['Active'],
    renderMetadata: () => <MetadataContainer>
        <MetadataItem icon={<Clock className="size-3" />}>Last active: 2h ago</MetadataItem>
      </MetadataContainer>
  }
}`,...(te=(ae=p.parameters)==null?void 0:ae.docs)==null?void 0:te.source}}};var re,se,oe;y.parameters={...y.parameters,docs:{...(re=y.parameters)==null?void 0:re.docs,source:{originalSource:`{
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
}`,...(oe=(se=y.parameters)==null?void 0:se.docs)==null?void 0:oe.source}}};var ne,ie,ce;C.parameters={...C.parameters,docs:{...(ne=C.parameters)==null?void 0:ne.docs,source:{originalSource:`{
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
}`,...(ce=(ie=C.parameters)==null?void 0:ie.docs)==null?void 0:ce.source}}};const Le=["Default","WithTypeIndicator","WithoutImage","WithPlaceholder","ManyTags","NoTags","LongName","Disabled","WithActions","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates"];export{C as AllStates,h as CustomMetadata,a as Default,m as Disabled,y as FullyCustomMetadata,g as GridLayout,l as LongName,c as ManyTags,p as MetadataWithIcons,d as NoTags,u as WithActions,i as WithPlaceholder,o as WithTypeIndicator,n as WithoutImage,Le as __namedExportsOrder,De as default};
