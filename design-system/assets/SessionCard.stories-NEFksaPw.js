import{j as e}from"./iframe-DIyqx50_.js";import{S as o,M as Ve,a as b}from"./SessionCard-1h54UV4S.js";import{c as Be}from"./utils-DuMXYCiK.js";import{B as Oe}from"./CardMetadata-Cg3uMLCQ.js";import{S as t}from"./Skeleton-BLycNfd1.js";import{S as We,C as Fe,D as Ge,T as qe,a as ze}from"./trash-2-CWhO3wZi.js";import{U as He,S as Je}from"./users-Cljb0OU8.js";import{c as $e}from"./createLucideIcon-x2UP4BXA.js";import"./preload-helper-CwRszBsw.js";function i({className:s}){return e.jsxs(Oe,{className:Be("min-h-[320px] w-full border-zinc-700 ring-1 ring-zinc-800",s),isDisabled:!0,children:[e.jsxs("div",{className:"relative h-48 overflow-hidden bg-zinc-800",children:[e.jsx(t,{className:"absolute inset-0 h-full w-full",variant:"default"}),e.jsxs("div",{className:"absolute bottom-0 left-0 w-full p-5",children:[e.jsx(t,{className:"mb-2 h-7 w-3/4"}),e.jsx(t,{className:"h-7 w-1/2"})]})]}),e.jsx("div",{className:"flex flex-grow flex-col justify-between p-5",children:e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"flex items-center justify-between border-b border-zinc-800 pb-2",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(t,{className:"size-4",variant:"circular"}),e.jsx(t,{className:"h-4 w-20"})]})}),e.jsxs("div",{className:"flex -space-x-2 pt-1",children:[e.jsx(t,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(t,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(t,{className:"size-8 border-2 border-zinc-900",variant:"circular"})]})]})})]})}i.displayName="SessionCardSkeleton";i.__docgenInfo={description:`SessionCardSkeleton Component

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
 */const Ke=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],Qe=$e("layers",Ke),ia={title:"Content/SessionCard",component:o,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{title:{control:"text",description:"Session title"},imageUrl:{control:"text",description:"Cover image URL"},messageCount:{control:"number",description:"Number of messages in the session (optional - if undefined, message count section is hidden)"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},showTypeIndicator:{control:"boolean",description:"Whether to show the SESSION badge"},areCharactersLoading:{control:"boolean",description:"Whether characters are loading"},onClick:{action:"clicked"}},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})]},c="https://picsum.photos/seed/session1/600/400",T="https://picsum.photos/seed/session2/600/400",r="https://picsum.photos/seed/avatar1/100/100",n="https://picsum.photos/seed/avatar2/100/100",w="https://picsum.photos/seed/avatar3/100/100",Xe="https://picsum.photos/seed/avatar4/100/100",N=()=>e.jsx(Qe,{size:16}),a={args:{title:"Adventure in Wonderland",imageUrl:c,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:n}],typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(N,{})," SESSION"]})}},l={args:{...a.args,showTypeIndicator:!0}},d={args:{title:"New Adventure",imageUrl:T,messageCount:0,characterAvatars:[{name:"Alice",avatarUrl:r}],typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(N,{})," SESSION"]})}},m={args:{...a.args,title:"Just Started",messageCount:1}},p={args:{title:"Mystery Session",messageCount:15,characterAvatars:[{name:"Unknown",avatarUrl:void 0}]}},g={args:{title:"Adventure Session",imageUrl:"https://invalid-url-that-will-404.com/image.png",messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:"https://invalid-url-that-will-404.com/avatar.png"},{name:"Bob",avatarUrl:n}]}},u={args:{title:"Session without Message Count",imageUrl:c,characterAvatars:[{name:"Alice",avatarUrl:r}]}},h={args:{...a.args,title:"Group Session",characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:n},{name:"Charlie",avatarUrl:w},{name:"Diana",avatarUrl:Xe},{name:"Eve"}]}},v={args:{...a.args,title:"Loading Characters...",areCharactersLoading:!0,characterAvatars:[]}},A={args:{...a.args,isDisabled:!0}},S={args:{...a.args,title:"The Exceptionally Long Session Title That Should Be Truncated After Two Lines"}},x={args:{...a.args,actions:[{icon:We,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:Fe,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:Ge,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"},{icon:qe,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},C={args:{...a.args,title:"Epic Campaign",messageCount:12345}},y={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"Adventure in Wonderland",imageUrl:c,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:n}]}),e.jsx(o,{title:"Mystery Investigation",imageUrl:T,messageCount:128,showTypeIndicator:!0,typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(N,{})," SESSION"]}),characterAvatars:[{name:"Detective",avatarUrl:w}]}),e.jsx(o,{title:"New Session",messageCount:0,characterAvatars:[]})]})},M={args:{title:"Session with Custom Metadata",imageUrl:c,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:n}],renderMetadata:()=>e.jsxs(Ve,{children:[e.jsx(b,{icon:e.jsx(ze,{className:"size-3"}),children:"2 days ago"}),e.jsx(b,{icon:e.jsx(He,{className:"size-3"}),children:"3 participants"})]})}},E={args:{title:"Popular Session",imageUrl:T,characterAvatars:[{name:"Alice",avatarUrl:r}],renderMetadata:()=>e.jsxs(Ve,{children:[e.jsx(b,{icon:e.jsx(Je,{className:"size-3"}),children:"4.8 rating"}),e.jsx(b,{icon:e.jsx(ze,{className:"size-3"}),children:"Last played: 1h ago"})]})}},j={args:{title:"Session with Stats",imageUrl:c,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:n},{name:"Charlie",avatarUrl:w}],renderMetadata:()=>e.jsxs("div",{className:"grid grid-cols-3 gap-2 border-b border-zinc-800 pb-2 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"156"}),e.jsx("div",{children:"Messages"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"3"}),e.jsx("div",{children:"Characters"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"2h"}),e.jsx("div",{children:"Duration"})]})]})}},U={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(o,{title:"Default Session",imageUrl:c,messageCount:10,characterAvatars:[{name:"Alice",avatarUrl:r}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(o,{title:"Session with Badge",imageUrl:T,messageCount:25,showTypeIndicator:!0,typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(N,{})," SESSION"]}),characterAvatars:[{name:"Bob",avatarUrl:n}]})})]})]})},f={args:{...a.args},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})],render:()=>e.jsx(i,{})},_={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(i,{}),e.jsx(i,{}),e.jsx(i,{})]})};var L,I,D;a.parameters={...a.parameters,docs:{...(L=a.parameters)==null?void 0:L.docs,source:{originalSource:`{
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
}`,...(D=(I=a.parameters)==null?void 0:I.docs)==null?void 0:D.source}}};var k,P,R;l.parameters={...l.parameters,docs:{...(k=l.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    showTypeIndicator: true
  }
}`,...(R=(P=l.parameters)==null?void 0:P.docs)==null?void 0:R.source}}};var V,z,B;d.parameters={...d.parameters,docs:{...(V=d.parameters)==null?void 0:V.docs,source:{originalSource:`{
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
}`,...(B=(z=d.parameters)==null?void 0:z.docs)==null?void 0:B.source}}};var O,W,F;m.parameters={...m.parameters,docs:{...(O=m.parameters)==null?void 0:O.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Just Started',
    messageCount: 1
  }
}`,...(F=(W=m.parameters)==null?void 0:W.docs)==null?void 0:F.source}}};var G,q,H;p.parameters={...p.parameters,docs:{...(G=p.parameters)==null?void 0:G.docs,source:{originalSource:`{
  args: {
    title: 'Mystery Session',
    messageCount: 15,
    characterAvatars: [{
      name: 'Unknown',
      avatarUrl: undefined
    }]
  }
}`,...(H=(q=p.parameters)==null?void 0:q.docs)==null?void 0:H.source}}};var J,$,K;g.parameters={...g.parameters,docs:{...(J=g.parameters)==null?void 0:J.docs,source:{originalSource:`{
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
}`,...(K=($=g.parameters)==null?void 0:$.docs)==null?void 0:K.source}}};var Q,X,Y;u.parameters={...u.parameters,docs:{...(Q=u.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  args: {
    title: 'Session without Message Count',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(Y=(X=u.parameters)==null?void 0:X.docs)==null?void 0:Y.source}}};var Z,ee,ae;h.parameters={...h.parameters,docs:{...(Z=h.parameters)==null?void 0:Z.docs,source:{originalSource:`{
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
}`,...(ae=(ee=h.parameters)==null?void 0:ee.docs)==null?void 0:ae.source}}};var se,re,te;v.parameters={...v.parameters,docs:{...(se=v.parameters)==null?void 0:se.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Loading Characters...',
    areCharactersLoading: true,
    characterAvatars: []
  }
}`,...(te=(re=v.parameters)==null?void 0:re.docs)==null?void 0:te.source}}};var ne,oe,ie;A.parameters={...A.parameters,docs:{...(ne=A.parameters)==null?void 0:ne.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(ie=(oe=A.parameters)==null?void 0:oe.docs)==null?void 0:ie.source}}};var ce,le,de;S.parameters={...S.parameters,docs:{...(ce=S.parameters)==null?void 0:ce.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'The Exceptionally Long Session Title That Should Be Truncated After Two Lines'
  }
}`,...(de=(le=S.parameters)==null?void 0:le.docs)==null?void 0:de.source}}};var me,pe,ge;x.parameters={...x.parameters,docs:{...(me=x.parameters)==null?void 0:me.docs,source:{originalSource:`{
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
}`,...(ge=(pe=x.parameters)==null?void 0:pe.docs)==null?void 0:ge.source}}};var ue,he,ve;C.parameters={...C.parameters,docs:{...(ue=C.parameters)==null?void 0:ue.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Campaign',
    messageCount: 12345
  }
}`,...(ve=(he=C.parameters)==null?void 0:he.docs)==null?void 0:ve.source}}};var Ae,Se,xe;y.parameters={...y.parameters,docs:{...(Ae=y.parameters)==null?void 0:Ae.docs,source:{originalSource:`{
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
}`,...(xe=(Se=y.parameters)==null?void 0:Se.docs)==null?void 0:xe.source}}};var Ce,ye,Me;M.parameters={...M.parameters,docs:{...(Ce=M.parameters)==null?void 0:Ce.docs,source:{originalSource:`{
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
}`,...(Me=(ye=M.parameters)==null?void 0:ye.docs)==null?void 0:Me.source}}};var Ee,je,Ue;E.parameters={...E.parameters,docs:{...(Ee=E.parameters)==null?void 0:Ee.docs,source:{originalSource:`{
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
}`,...(Ue=(je=E.parameters)==null?void 0:je.docs)==null?void 0:Ue.source}}};var fe,_e,be;j.parameters={...j.parameters,docs:{...(fe=j.parameters)==null?void 0:fe.docs,source:{originalSource:`{
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
    renderMetadata: () => <div className="grid grid-cols-3 gap-2 border-b border-zinc-800 pb-2 text-xs text-zinc-500">
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
}`,...(be=(_e=j.parameters)==null?void 0:_e.docs)==null?void 0:be.source}}};var Te,Ne,we;U.parameters={...U.parameters,docs:{...(Te=U.parameters)==null?void 0:Te.docs,source:{originalSource:`{
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
}`,...(we=(Ne=U.parameters)==null?void 0:Ne.docs)==null?void 0:we.source}}};var Le,Ie,De;f.parameters={...f.parameters,docs:{...(Le=f.parameters)==null?void 0:Le.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '320px'
  }}>
        <Story />
      </div>],
  render: () => <SessionCardSkeleton />
}`,...(De=(Ie=f.parameters)==null?void 0:Ie.docs)==null?void 0:De.source}}};var ke,Pe,Re;_.parameters={..._.parameters,docs:{...(ke=_.parameters)==null?void 0:ke.docs,source:{originalSource:`{
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
}`,...(Re=(Pe=_.parameters)==null?void 0:Pe.docs)==null?void 0:Re.source}}};const ca=["Default","WithTypeIndicator","NewSession","SingleMessage","WithoutImage","ImageError","WithoutMessageCount","ManyAvatars","LoadingAvatars","Disabled","LongTitle","WithActions","HighMessageCount","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid"];export{U as AllStates,M as CustomMetadata,a as Default,A as Disabled,j as FullyCustomMetadata,y as GridLayout,C as HighMessageCount,g as ImageError,v as LoadingAvatars,S as LongTitle,h as ManyAvatars,E as MetadataWithIcons,d as NewSession,m as SingleMessage,f as Skeleton,_ as SkeletonGrid,x as WithActions,l as WithTypeIndicator,p as WithoutImage,u as WithoutMessageCount,ca as __namedExportsOrder,ia as default};
