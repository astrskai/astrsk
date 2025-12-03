import{j as e}from"./iframe-6ZUTQY2J.js";import{S as o,M as ta,a as I}from"./SessionCard-CRzon1_k.js";import{c as oa}from"./utils-DuMXYCiK.js";import{B as ia}from"./CardMetadata-B_vs75E5.js";import{S as t}from"./Skeleton-CZxA5Lkw.js";import{S as ca,C as la,D as da,T as ma,a as na}from"./trash-2-BJk52nkV.js";import{U as ga,S as pa}from"./users-Cc5SA6sQ.js";import{c as ua}from"./createLucideIcon-BzGJg-2e.js";import"./preload-helper-CwRszBsw.js";function i({className:s}){return e.jsxs(ia,{className:oa("min-h-[320px] w-full border-zinc-700 ring-1 ring-zinc-800",s),isDisabled:!0,children:[e.jsxs("div",{className:"relative h-48 overflow-hidden bg-zinc-800",children:[e.jsx(t,{className:"absolute inset-0 h-full w-full",variant:"default"}),e.jsxs("div",{className:"absolute bottom-0 left-0 w-full p-5",children:[e.jsx(t,{className:"mb-2 h-7 w-3/4"}),e.jsx(t,{className:"h-7 w-1/2"})]})]}),e.jsx("div",{className:"flex flex-grow flex-col justify-between p-5",children:e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"flex items-center justify-between border-b border-zinc-800 pb-2",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(t,{className:"size-4",variant:"circular"}),e.jsx(t,{className:"h-4 w-20"})]})}),e.jsxs("div",{className:"flex -space-x-2 pt-1",children:[e.jsx(t,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(t,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(t,{className:"size-8 border-2 border-zinc-900",variant:"circular"})]})]})})]})}i.displayName="SessionCardSkeleton";i.__docgenInfo={description:`SessionCardSkeleton Component

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
\`\`\``,methods:[],displayName:"SessionCardSkeleton",props:{className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ha=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],va=ua("layers",ha),_a={title:"Content/SessionCard",component:o,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{title:{control:"text",description:"Session title"},imageUrl:{control:"text",description:"Cover image URL"},messageCount:{control:"number",description:"Number of messages in the session (optional - if undefined, message count section is hidden)"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},showTypeIndicator:{control:"boolean",description:"Whether to show the SESSION badge"},areCharactersLoading:{control:"boolean",description:"Whether characters are loading"},tags:{control:"object",description:"Tags to display on the card"},summary:{control:"text",description:"Session summary/description"},onClick:{action:"clicked"}},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})]},c="https://picsum.photos/seed/session1/600/400",D="https://picsum.photos/seed/session2/600/400",r="https://picsum.photos/seed/avatar1/100/100",n="https://picsum.photos/seed/avatar2/100/100",R="https://picsum.photos/seed/avatar3/100/100",Sa="https://picsum.photos/seed/avatar4/100/100",k=()=>e.jsx(va,{size:16}),a={args:{title:"Adventure in Wonderland",imageUrl:c,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:n}],typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(k,{})," SESSION"]})}},l={args:{...a.args,showTypeIndicator:!0}},d={args:{title:"New Adventure",imageUrl:D,messageCount:0,characterAvatars:[{name:"Alice",avatarUrl:r}],typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(k,{})," SESSION"]})}},m={args:{...a.args,title:"Just Started",messageCount:1}},g={args:{title:"Mystery Session",messageCount:15,characterAvatars:[{name:"Unknown",avatarUrl:void 0}]}},p={args:{title:"Adventure Session",imageUrl:"https://invalid-url-that-will-404.com/image.png",messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:"https://invalid-url-that-will-404.com/avatar.png"},{name:"Bob",avatarUrl:n}]}},u={args:{title:"Session without Message Count",imageUrl:c,characterAvatars:[{name:"Alice",avatarUrl:r}]}},h={args:{...a.args,title:"Group Session",characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:n},{name:"Charlie",avatarUrl:R},{name:"Diana",avatarUrl:Sa},{name:"Eve"}]}},v={args:{...a.args,title:"Loading Characters...",areCharactersLoading:!0,characterAvatars:[]}},S={args:{...a.args,isDisabled:!0}},A={args:{...a.args,title:"The Exceptionally Long Session Title That Should Be Truncated After Two Lines"}},x={args:{...a.args,actions:[{icon:ca,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:la,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:da,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"},{icon:ma,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},y={args:{...a.args,title:"Epic Campaign",messageCount:12345}},C={args:{...a.args,title:"Fantasy Adventure",tags:["Fantasy","Adventure","RPG"]}},M={args:{...a.args,title:"Multi-Genre Session",tags:["Fantasy","Sci-Fi","Horror","Mystery","Romance"]}},E={args:{...a.args,title:"Quick Session",tags:["Casual"]}},f={args:{...a.args,title:"Epic Quest",summary:"An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom from ancient evil."}},j={args:{...a.args,title:"Mystery Manor",tags:["Mystery","Horror","Detective"],summary:"Investigate the haunted manor and uncover dark secrets hidden within its walls."}},U={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"Adventure in Wonderland",imageUrl:c,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:n}]}),e.jsx(o,{title:"Mystery Investigation",imageUrl:D,messageCount:128,showTypeIndicator:!0,typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(k,{})," SESSION"]}),characterAvatars:[{name:"Detective",avatarUrl:R}]}),e.jsx(o,{title:"New Session",messageCount:0,characterAvatars:[]})]})},_={args:{title:"Session with Custom Metadata",imageUrl:c,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:n}],renderMetadata:()=>e.jsxs(ta,{children:[e.jsx(I,{icon:e.jsx(na,{className:"size-3"}),children:"2 days ago"}),e.jsx(I,{icon:e.jsx(ga,{className:"size-3"}),children:"3 participants"})]})}},T={args:{title:"Popular Session",imageUrl:D,characterAvatars:[{name:"Alice",avatarUrl:r}],renderMetadata:()=>e.jsxs(ta,{children:[e.jsx(I,{icon:e.jsx(pa,{className:"size-3"}),children:"4.8 rating"}),e.jsx(I,{icon:e.jsx(na,{className:"size-3"}),children:"Last played: 1h ago"})]})}},w={args:{title:"Session with Stats",imageUrl:c,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:n},{name:"Charlie",avatarUrl:R}],renderMetadata:()=>e.jsxs("div",{className:"grid grid-cols-3 gap-2 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"156"}),e.jsx("div",{children:"Messages"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"3"}),e.jsx("div",{children:"Characters"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"2h"}),e.jsx("div",{children:"Duration"})]})]})}},b={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(o,{title:"Default Session",imageUrl:c,messageCount:10,characterAvatars:[{name:"Alice",avatarUrl:r}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(o,{title:"Session with Badge",imageUrl:D,messageCount:25,showTypeIndicator:!0,typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(k,{})," SESSION"]}),characterAvatars:[{name:"Bob",avatarUrl:n}]})})]})]})},N={args:{...a.args},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})],render:()=>e.jsx(i,{})},L={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(i,{}),e.jsx(i,{}),e.jsx(i,{})]})};var P,V,W;a.parameters={...a.parameters,docs:{...(P=a.parameters)==null?void 0:P.docs,source:{originalSource:`{
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
    }],
    typeIndicator: <><TypeIcon /> SESSION</>
  }
}`,...(W=(V=a.parameters)==null?void 0:V.docs)==null?void 0:W.source}}};var z,B,O;l.parameters={...l.parameters,docs:{...(z=l.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    showTypeIndicator: true
  }
}`,...(O=(B=l.parameters)==null?void 0:B.docs)==null?void 0:O.source}}};var F,G,H;d.parameters={...d.parameters,docs:{...(F=d.parameters)==null?void 0:F.docs,source:{originalSource:`{
  args: {
    title: 'New Adventure',
    imageUrl: SAMPLE_COVER_2,
    messageCount: 0,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }],
    typeIndicator: <><TypeIcon /> SESSION</>
  }
}`,...(H=(G=d.parameters)==null?void 0:G.docs)==null?void 0:H.source}}};var q,Q,J;m.parameters={...m.parameters,docs:{...(q=m.parameters)==null?void 0:q.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Just Started',
    messageCount: 1
  }
}`,...(J=(Q=m.parameters)==null?void 0:Q.docs)==null?void 0:J.source}}};var $,K,X;g.parameters={...g.parameters,docs:{...($=g.parameters)==null?void 0:$.docs,source:{originalSource:`{
  args: {
    title: 'Mystery Session',
    messageCount: 15,
    characterAvatars: [{
      name: 'Unknown',
      avatarUrl: undefined
    }]
  }
}`,...(X=(K=g.parameters)==null?void 0:K.docs)==null?void 0:X.source}}};var Y,Z,ee;p.parameters={...p.parameters,docs:{...(Y=p.parameters)==null?void 0:Y.docs,source:{originalSource:`{
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
}`,...(ee=(Z=p.parameters)==null?void 0:Z.docs)==null?void 0:ee.source}}};var ae,se,re;u.parameters={...u.parameters,docs:{...(ae=u.parameters)==null?void 0:ae.docs,source:{originalSource:`{
  args: {
    title: 'Session without Message Count',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(re=(se=u.parameters)==null?void 0:se.docs)==null?void 0:re.source}}};var te,ne,oe;h.parameters={...h.parameters,docs:{...(te=h.parameters)==null?void 0:te.docs,source:{originalSource:`{
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
}`,...(oe=(ne=h.parameters)==null?void 0:ne.docs)==null?void 0:oe.source}}};var ie,ce,le;v.parameters={...v.parameters,docs:{...(ie=v.parameters)==null?void 0:ie.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Loading Characters...',
    areCharactersLoading: true,
    characterAvatars: []
  }
}`,...(le=(ce=v.parameters)==null?void 0:ce.docs)==null?void 0:le.source}}};var de,me,ge;S.parameters={...S.parameters,docs:{...(de=S.parameters)==null?void 0:de.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(ge=(me=S.parameters)==null?void 0:me.docs)==null?void 0:ge.source}}};var pe,ue,he;A.parameters={...A.parameters,docs:{...(pe=A.parameters)==null?void 0:pe.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'The Exceptionally Long Session Title That Should Be Truncated After Two Lines'
  }
}`,...(he=(ue=A.parameters)==null?void 0:ue.docs)==null?void 0:he.source}}};var ve,Se,Ae;x.parameters={...x.parameters,docs:{...(ve=x.parameters)==null?void 0:ve.docs,source:{originalSource:`{
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
}`,...(Ae=(Se=x.parameters)==null?void 0:Se.docs)==null?void 0:Ae.source}}};var xe,ye,Ce;y.parameters={...y.parameters,docs:{...(xe=y.parameters)==null?void 0:xe.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Campaign',
    messageCount: 12345
  }
}`,...(Ce=(ye=y.parameters)==null?void 0:ye.docs)==null?void 0:Ce.source}}};var Me,Ee,fe;C.parameters={...C.parameters,docs:{...(Me=C.parameters)==null?void 0:Me.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Fantasy Adventure',
    tags: ['Fantasy', 'Adventure', 'RPG']
  }
}`,...(fe=(Ee=C.parameters)==null?void 0:Ee.docs)==null?void 0:fe.source}}};var je,Ue,_e;M.parameters={...M.parameters,docs:{...(je=M.parameters)==null?void 0:je.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Multi-Genre Session',
    tags: ['Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Romance']
  }
}`,...(_e=(Ue=M.parameters)==null?void 0:Ue.docs)==null?void 0:_e.source}}};var Te,we,be;E.parameters={...E.parameters,docs:{...(Te=E.parameters)==null?void 0:Te.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Quick Session',
    tags: ['Casual']
  }
}`,...(be=(we=E.parameters)==null?void 0:we.docs)==null?void 0:be.source}}};var Ne,Le,Ie;f.parameters={...f.parameters,docs:{...(Ne=f.parameters)==null?void 0:Ne.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Quest',
    summary: 'An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom from ancient evil.'
  }
}`,...(Ie=(Le=f.parameters)==null?void 0:Le.docs)==null?void 0:Ie.source}}};var De,ke,Re;j.parameters={...j.parameters,docs:{...(De=j.parameters)==null?void 0:De.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Mystery Manor',
    tags: ['Mystery', 'Horror', 'Detective'],
    summary: 'Investigate the haunted manor and uncover dark secrets hidden within its walls.'
  }
}`,...(Re=(ke=j.parameters)==null?void 0:ke.docs)==null?void 0:Re.source}}};var Pe,Ve,We;U.parameters={...U.parameters,docs:{...(Pe=U.parameters)==null?void 0:Pe.docs,source:{originalSource:`{
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
      <SessionCard title="Mystery Investigation" imageUrl={SAMPLE_COVER_2} messageCount={128} showTypeIndicator typeIndicator={<><TypeIcon /> SESSION</>} characterAvatars={[{
      name: 'Detective',
      avatarUrl: SAMPLE_AVATAR_3
    }]} />
      <SessionCard title="New Session" messageCount={0} characterAvatars={[]} />
    </>
}`,...(We=(Ve=U.parameters)==null?void 0:Ve.docs)==null?void 0:We.source}}};var ze,Be,Oe;_.parameters={..._.parameters,docs:{...(ze=_.parameters)==null?void 0:ze.docs,source:{originalSource:`{
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
}`,...(Oe=(Be=_.parameters)==null?void 0:Be.docs)==null?void 0:Oe.source}}};var Fe,Ge,He;T.parameters={...T.parameters,docs:{...(Fe=T.parameters)==null?void 0:Fe.docs,source:{originalSource:`{
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
}`,...(He=(Ge=T.parameters)==null?void 0:Ge.docs)==null?void 0:He.source}}};var qe,Qe,Je;w.parameters={...w.parameters,docs:{...(qe=w.parameters)==null?void 0:qe.docs,source:{originalSource:`{
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
}`,...(Je=(Qe=w.parameters)==null?void 0:Qe.docs)==null?void 0:Je.source}}};var $e,Ke,Xe;b.parameters={...b.parameters,docs:{...($e=b.parameters)==null?void 0:$e.docs,source:{originalSource:`{
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
          <SessionCard title="Session with Badge" imageUrl={SAMPLE_COVER_2} messageCount={25} showTypeIndicator typeIndicator={<><TypeIcon /> SESSION</>} characterAvatars={[{
          name: 'Bob',
          avatarUrl: SAMPLE_AVATAR_2
        }]} />
        </div>
      </div>
    </>
}`,...(Xe=(Ke=b.parameters)==null?void 0:Ke.docs)==null?void 0:Xe.source}}};var Ye,Ze,ea;N.parameters={...N.parameters,docs:{...(Ye=N.parameters)==null?void 0:Ye.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '320px'
  }}>
        <Story />
      </div>],
  render: () => <SessionCardSkeleton />
}`,...(ea=(Ze=N.parameters)==null?void 0:Ze.docs)==null?void 0:ea.source}}};var aa,sa,ra;L.parameters={...L.parameters,docs:{...(aa=L.parameters)==null?void 0:aa.docs,source:{originalSource:`{
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
}`,...(ra=(sa=L.parameters)==null?void 0:sa.docs)==null?void 0:ra.source}}};const Ta=["Default","WithTypeIndicator","NewSession","SingleMessage","WithoutImage","ImageError","WithoutMessageCount","ManyAvatars","LoadingAvatars","Disabled","LongTitle","WithActions","HighMessageCount","WithTags","WithManyTags","WithSingleTag","WithSummary","WithTagsAndSummary","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid"];export{b as AllStates,_ as CustomMetadata,a as Default,S as Disabled,w as FullyCustomMetadata,U as GridLayout,y as HighMessageCount,p as ImageError,v as LoadingAvatars,A as LongTitle,h as ManyAvatars,T as MetadataWithIcons,d as NewSession,m as SingleMessage,N as Skeleton,L as SkeletonGrid,x as WithActions,M as WithManyTags,E as WithSingleTag,f as WithSummary,C as WithTags,j as WithTagsAndSummary,l as WithTypeIndicator,g as WithoutImage,u as WithoutMessageCount,Ta as __namedExportsOrder,_a as default};
