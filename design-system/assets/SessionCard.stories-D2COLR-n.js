import{j as e}from"./iframe-Uxw7MMH5.js";import{S as o,M as ze,a as b}from"./SessionCard-WkKBDEfY.js";import{c as Oe}from"./utils-DuMXYCiK.js";import{B as We}from"./CardMetadata-DilUp86a.js";import{S as t}from"./Skeleton-danfzlBd.js";import{S as Fe,C as Ge,D as qe,T as He,a as Be}from"./trash-2-Sww5FV3v.js";import{c as L}from"./createLucideIcon-CotmXz5v.js";import"./preload-helper-CwRszBsw.js";function i({className:s}){return e.jsxs(We,{className:Oe("min-h-[320px] w-full border-zinc-700 ring-1 ring-zinc-800",s),isDisabled:!0,children:[e.jsxs("div",{className:"relative h-48 overflow-hidden bg-zinc-800",children:[e.jsx(t,{className:"absolute inset-0 h-full w-full",variant:"default"}),e.jsxs("div",{className:"absolute bottom-0 left-0 w-full p-5",children:[e.jsx(t,{className:"mb-2 h-7 w-3/4"}),e.jsx(t,{className:"h-7 w-1/2"})]})]}),e.jsx("div",{className:"flex flex-grow flex-col justify-between p-5",children:e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"flex items-center justify-between border-b border-zinc-800 pb-2",children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(t,{className:"size-4",variant:"circular"}),e.jsx(t,{className:"h-4 w-20"})]})}),e.jsxs("div",{className:"flex -space-x-2 pt-1",children:[e.jsx(t,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(t,{className:"size-8 border-2 border-zinc-900",variant:"circular"}),e.jsx(t,{className:"size-8 border-2 border-zinc-900",variant:"circular"})]})]})})]})}i.displayName="SessionCardSkeleton";i.__docgenInfo={description:`SessionCardSkeleton Component

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
 */const $e=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],Je=L("layers",$e);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ke=[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]],Qe=L("star",Ke);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xe=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]],Ye=L("users",Xe),ca={title:"Content/SessionCard",component:o,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{title:{control:"text",description:"Session title"},imageUrl:{control:"text",description:"Cover image URL"},messageCount:{control:"number",description:"Number of messages in the session (optional - if undefined, message count section is hidden)"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},showTypeIndicator:{control:"boolean",description:"Whether to show the SESSION badge"},areCharactersLoading:{control:"boolean",description:"Whether characters are loading"},onClick:{action:"clicked"}},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})]},c="https://picsum.photos/seed/session1/600/400",N="https://picsum.photos/seed/session2/600/400",r="https://picsum.photos/seed/avatar1/100/100",n="https://picsum.photos/seed/avatar2/100/100",w="https://picsum.photos/seed/avatar3/100/100",Ze="https://picsum.photos/seed/avatar4/100/100",T=()=>e.jsx(Je,{size:16}),a={args:{title:"Adventure in Wonderland",imageUrl:c,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:n}],typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(T,{})," SESSION"]})}},l={args:{...a.args,showTypeIndicator:!0}},d={args:{title:"New Adventure",imageUrl:N,messageCount:0,characterAvatars:[{name:"Alice",avatarUrl:r}],typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(T,{})," SESSION"]})}},m={args:{...a.args,title:"Just Started",messageCount:1}},p={args:{title:"Mystery Session",messageCount:15,characterAvatars:[{name:"Unknown",avatarUrl:void 0}]}},g={args:{title:"Adventure Session",imageUrl:"https://invalid-url-that-will-404.com/image.png",messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:"https://invalid-url-that-will-404.com/avatar.png"},{name:"Bob",avatarUrl:n}]}},u={args:{title:"Session without Message Count",imageUrl:c,characterAvatars:[{name:"Alice",avatarUrl:r}]}},h={args:{...a.args,title:"Group Session",characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:n},{name:"Charlie",avatarUrl:w},{name:"Diana",avatarUrl:Ze},{name:"Eve"}]}},v={args:{...a.args,title:"Loading Characters...",areCharactersLoading:!0,characterAvatars:[]}},A={args:{...a.args,isDisabled:!0}},S={args:{...a.args,title:"The Exceptionally Long Session Title That Should Be Truncated After Two Lines"}},x={args:{...a.args,actions:[{icon:Fe,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:Ge,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:qe,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"},{icon:He,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},C={args:{...a.args,title:"Epic Campaign",messageCount:12345}},y={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"Adventure in Wonderland",imageUrl:c,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:n}]}),e.jsx(o,{title:"Mystery Investigation",imageUrl:N,messageCount:128,showTypeIndicator:!0,typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(T,{})," SESSION"]}),characterAvatars:[{name:"Detective",avatarUrl:w}]}),e.jsx(o,{title:"New Session",messageCount:0,characterAvatars:[]})]})},M={args:{title:"Session with Custom Metadata",imageUrl:c,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:n}],renderMetadata:()=>e.jsxs(ze,{children:[e.jsx(b,{icon:e.jsx(Be,{className:"size-3"}),children:"2 days ago"}),e.jsx(b,{icon:e.jsx(Ye,{className:"size-3"}),children:"3 participants"})]})}},E={args:{title:"Popular Session",imageUrl:N,characterAvatars:[{name:"Alice",avatarUrl:r}],renderMetadata:()=>e.jsxs(ze,{children:[e.jsx(b,{icon:e.jsx(Qe,{className:"size-3"}),children:"4.8 rating"}),e.jsx(b,{icon:e.jsx(Be,{className:"size-3"}),children:"Last played: 1h ago"})]})}},j={args:{title:"Session with Stats",imageUrl:c,characterAvatars:[{name:"Alice",avatarUrl:r},{name:"Bob",avatarUrl:n},{name:"Charlie",avatarUrl:w}],renderMetadata:()=>e.jsxs("div",{className:"grid grid-cols-3 gap-2 border-b border-zinc-800 pb-2 text-xs text-zinc-500",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"156"}),e.jsx("div",{children:"Messages"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"3"}),e.jsx("div",{children:"Characters"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"font-semibold text-white",children:"2h"}),e.jsx("div",{children:"Duration"})]})]})}},_={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(o,{title:"Default Session",imageUrl:c,messageCount:10,characterAvatars:[{name:"Alice",avatarUrl:r}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(o,{title:"Session with Badge",imageUrl:N,messageCount:25,showTypeIndicator:!0,typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(T,{})," SESSION"]}),characterAvatars:[{name:"Bob",avatarUrl:n}]})})]})]})},f={args:{...a.args},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})],render:()=>e.jsx(i,{})},U={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(i,{}),e.jsx(i,{}),e.jsx(i,{})]})};var I,k,D;a.parameters={...a.parameters,docs:{...(I=a.parameters)==null?void 0:I.docs,source:{originalSource:`{
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
}`,...(D=(k=a.parameters)==null?void 0:k.docs)==null?void 0:D.source}}};var P,R,V;l.parameters={...l.parameters,docs:{...(P=l.parameters)==null?void 0:P.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    showTypeIndicator: true
  }
}`,...(V=(R=l.parameters)==null?void 0:R.docs)==null?void 0:V.source}}};var z,B,O;d.parameters={...d.parameters,docs:{...(z=d.parameters)==null?void 0:z.docs,source:{originalSource:`{
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
}`,...(O=(B=d.parameters)==null?void 0:B.docs)==null?void 0:O.source}}};var W,F,G;m.parameters={...m.parameters,docs:{...(W=m.parameters)==null?void 0:W.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Just Started',
    messageCount: 1
  }
}`,...(G=(F=m.parameters)==null?void 0:F.docs)==null?void 0:G.source}}};var q,H,$;p.parameters={...p.parameters,docs:{...(q=p.parameters)==null?void 0:q.docs,source:{originalSource:`{
  args: {
    title: 'Mystery Session',
    messageCount: 15,
    characterAvatars: [{
      name: 'Unknown',
      avatarUrl: undefined
    }]
  }
}`,...($=(H=p.parameters)==null?void 0:H.docs)==null?void 0:$.source}}};var J,K,Q;g.parameters={...g.parameters,docs:{...(J=g.parameters)==null?void 0:J.docs,source:{originalSource:`{
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
}`,...(Q=(K=g.parameters)==null?void 0:K.docs)==null?void 0:Q.source}}};var X,Y,Z;u.parameters={...u.parameters,docs:{...(X=u.parameters)==null?void 0:X.docs,source:{originalSource:`{
  args: {
    title: 'Session without Message Count',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(Z=(Y=u.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};var ee,ae,se;h.parameters={...h.parameters,docs:{...(ee=h.parameters)==null?void 0:ee.docs,source:{originalSource:`{
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
}`,...(se=(ae=h.parameters)==null?void 0:ae.docs)==null?void 0:se.source}}};var re,te,ne;v.parameters={...v.parameters,docs:{...(re=v.parameters)==null?void 0:re.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Loading Characters...',
    areCharactersLoading: true,
    characterAvatars: []
  }
}`,...(ne=(te=v.parameters)==null?void 0:te.docs)==null?void 0:ne.source}}};var oe,ie,ce;A.parameters={...A.parameters,docs:{...(oe=A.parameters)==null?void 0:oe.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(ce=(ie=A.parameters)==null?void 0:ie.docs)==null?void 0:ce.source}}};var le,de,me;S.parameters={...S.parameters,docs:{...(le=S.parameters)==null?void 0:le.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'The Exceptionally Long Session Title That Should Be Truncated After Two Lines'
  }
}`,...(me=(de=S.parameters)==null?void 0:de.docs)==null?void 0:me.source}}};var pe,ge,ue;x.parameters={...x.parameters,docs:{...(pe=x.parameters)==null?void 0:pe.docs,source:{originalSource:`{
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
}`,...(ue=(ge=x.parameters)==null?void 0:ge.docs)==null?void 0:ue.source}}};var he,ve,Ae;C.parameters={...C.parameters,docs:{...(he=C.parameters)==null?void 0:he.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Campaign',
    messageCount: 12345
  }
}`,...(Ae=(ve=C.parameters)==null?void 0:ve.docs)==null?void 0:Ae.source}}};var Se,xe,Ce;y.parameters={...y.parameters,docs:{...(Se=y.parameters)==null?void 0:Se.docs,source:{originalSource:`{
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
}`,...(Ce=(xe=y.parameters)==null?void 0:xe.docs)==null?void 0:Ce.source}}};var ye,Me,Ee;M.parameters={...M.parameters,docs:{...(ye=M.parameters)==null?void 0:ye.docs,source:{originalSource:`{
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
}`,...(Ee=(Me=M.parameters)==null?void 0:Me.docs)==null?void 0:Ee.source}}};var je,_e,fe;E.parameters={...E.parameters,docs:{...(je=E.parameters)==null?void 0:je.docs,source:{originalSource:`{
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
}`,...(fe=(_e=E.parameters)==null?void 0:_e.docs)==null?void 0:fe.source}}};var Ue,be,Ne;j.parameters={...j.parameters,docs:{...(Ue=j.parameters)==null?void 0:Ue.docs,source:{originalSource:`{
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
}`,...(Ne=(be=j.parameters)==null?void 0:be.docs)==null?void 0:Ne.source}}};var Te,Le,we;_.parameters={..._.parameters,docs:{...(Te=_.parameters)==null?void 0:Te.docs,source:{originalSource:`{
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
}`,...(we=(Le=_.parameters)==null?void 0:Le.docs)==null?void 0:we.source}}};var Ie,ke,De;f.parameters={...f.parameters,docs:{...(Ie=f.parameters)==null?void 0:Ie.docs,source:{originalSource:`{
  args: {
    ...Default.args
  },
  decorators: [Story => <div style={{
    width: '320px'
  }}>
        <Story />
      </div>],
  render: () => <SessionCardSkeleton />
}`,...(De=(ke=f.parameters)==null?void 0:ke.docs)==null?void 0:De.source}}};var Pe,Re,Ve;U.parameters={...U.parameters,docs:{...(Pe=U.parameters)==null?void 0:Pe.docs,source:{originalSource:`{
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
}`,...(Ve=(Re=U.parameters)==null?void 0:Re.docs)==null?void 0:Ve.source}}};const la=["Default","WithTypeIndicator","NewSession","SingleMessage","WithoutImage","ImageError","WithoutMessageCount","ManyAvatars","LoadingAvatars","Disabled","LongTitle","WithActions","HighMessageCount","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates","Skeleton","SkeletonGrid"];export{_ as AllStates,M as CustomMetadata,a as Default,A as Disabled,j as FullyCustomMetadata,y as GridLayout,C as HighMessageCount,g as ImageError,v as LoadingAvatars,S as LongTitle,h as ManyAvatars,E as MetadataWithIcons,d as NewSession,m as SingleMessage,f as Skeleton,U as SkeletonGrid,x as WithActions,l as WithTypeIndicator,p as WithoutImage,u as WithoutMessageCount,la as __namedExportsOrder,ca as default};
