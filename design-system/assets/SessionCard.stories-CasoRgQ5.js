import{j as a}from"./iframe-XPH6M7k9.js";import{S as r,M as Ua,a as E}from"./SessionCard--J0Ne5KM.js";import{S as Ta,C as ja,D as Ia,T as ba,a as La}from"./trash-2-CmFQuC_o.js";import{c as L}from"./createLucideIcon-CwOZj8t1.js";import"./preload-helper-CwRszBsw.js";import"./utils-DuMXYCiK.js";import"./CardMetadata-BoTpfBdH.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fa=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],Da=L("layers",fa);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Na=[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]],wa=L("star",Na);/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pa=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]],Ra=L("users",Pa),Ga={title:"Content/SessionCard",component:r,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{title:{control:"text",description:"Session title"},imageUrl:{control:"text",description:"Cover image URL"},messageCount:{control:"number",description:"Number of messages in the session (optional - if undefined, message count section is hidden)"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},showTypeIndicator:{control:"boolean",description:"Whether to show the SESSION badge"},areCharactersLoading:{control:"boolean",description:"Whether characters are loading"},onClick:{action:"clicked"}},decorators:[o=>a.jsx("div",{style:{width:"320px"},children:a.jsx(o,{})})]},s="https://picsum.photos/seed/session1/600/400",_="https://picsum.photos/seed/session2/600/400",t="https://picsum.photos/seed/avatar1/100/100",n="https://picsum.photos/seed/avatar2/100/100",T="https://picsum.photos/seed/avatar3/100/100",Va="https://picsum.photos/seed/avatar4/100/100",U=()=>a.jsx(Da,{size:16}),e={args:{title:"Adventure in Wonderland",imageUrl:s,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:t},{name:"Bob",avatarUrl:n}],typeIndicator:a.jsxs(a.Fragment,{children:[a.jsx(U,{})," SESSION"]})}},i={args:{...e.args,showTypeIndicator:!0}},c={args:{title:"New Adventure",imageUrl:_,messageCount:0,characterAvatars:[{name:"Alice",avatarUrl:t}],typeIndicator:a.jsxs(a.Fragment,{children:[a.jsx(U,{})," SESSION"]})}},l={args:{...e.args,title:"Just Started",messageCount:1}},d={args:{title:"Mystery Session",messageCount:15,characterAvatars:[{name:"Unknown",avatarUrl:void 0}]}},m={args:{title:"Session without Message Count",imageUrl:s,characterAvatars:[{name:"Alice",avatarUrl:t}]}},p={args:{...e.args,title:"Group Session",characterAvatars:[{name:"Alice",avatarUrl:t},{name:"Bob",avatarUrl:n},{name:"Charlie",avatarUrl:T},{name:"Diana",avatarUrl:Va},{name:"Eve"}]}},g={args:{...e.args,title:"Loading Characters...",areCharactersLoading:!0,characterAvatars:[]}},u={args:{...e.args,isDisabled:!0}},A={args:{...e.args,title:"The Exceptionally Long Session Title That Should Be Truncated After Two Lines"}},h={args:{...e.args,actions:[{icon:Ta,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:ja,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:Ia,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"},{icon:ba,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},v={args:{...e.args,title:"Epic Campaign",messageCount:12345}},S={args:{...e.args},decorators:[o=>a.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:a.jsx(o,{})})],render:()=>a.jsxs(a.Fragment,{children:[a.jsx(r,{title:"Adventure in Wonderland",imageUrl:s,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:t},{name:"Bob",avatarUrl:n}]}),a.jsx(r,{title:"Mystery Investigation",imageUrl:_,messageCount:128,showTypeIndicator:!0,typeIndicator:a.jsxs(a.Fragment,{children:[a.jsx(U,{})," SESSION"]}),characterAvatars:[{name:"Detective",avatarUrl:T}]}),a.jsx(r,{title:"New Session",messageCount:0,characterAvatars:[]})]})},x={args:{title:"Session with Custom Metadata",imageUrl:s,characterAvatars:[{name:"Alice",avatarUrl:t},{name:"Bob",avatarUrl:n}],renderMetadata:()=>a.jsxs(Ua,{children:[a.jsx(E,{icon:a.jsx(La,{className:"size-3"}),children:"2 days ago"}),a.jsx(E,{icon:a.jsx(Ra,{className:"size-3"}),children:"3 participants"})]})}},C={args:{title:"Popular Session",imageUrl:_,characterAvatars:[{name:"Alice",avatarUrl:t}],renderMetadata:()=>a.jsxs(Ua,{children:[a.jsx(E,{icon:a.jsx(wa,{className:"size-3"}),children:"4.8 rating"}),a.jsx(E,{icon:a.jsx(La,{className:"size-3"}),children:"Last played: 1h ago"})]})}},M={args:{title:"Session with Stats",imageUrl:s,characterAvatars:[{name:"Alice",avatarUrl:t},{name:"Bob",avatarUrl:n},{name:"Charlie",avatarUrl:T}],renderMetadata:()=>a.jsxs("div",{className:"grid grid-cols-3 gap-2 border-b border-zinc-800 pb-2 text-xs text-zinc-500",children:[a.jsxs("div",{className:"text-center",children:[a.jsx("div",{className:"font-semibold text-white",children:"156"}),a.jsx("div",{children:"Messages"})]}),a.jsxs("div",{className:"text-center",children:[a.jsx("div",{className:"font-semibold text-white",children:"3"}),a.jsx("div",{children:"Characters"})]}),a.jsxs("div",{className:"text-center",children:[a.jsx("div",{className:"font-semibold text-white",children:"2h"}),a.jsx("div",{children:"Duration"})]})]})}},y={args:{...e.args},decorators:[o=>a.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:a.jsx(o,{})})],render:()=>a.jsxs(a.Fragment,{children:[a.jsxs("div",{children:[a.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),a.jsx("div",{style:{width:"320px"},children:a.jsx(r,{title:"Default Session",imageUrl:s,messageCount:10,characterAvatars:[{name:"Alice",avatarUrl:t}]})})]}),a.jsxs("div",{children:[a.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),a.jsx("div",{style:{width:"320px"},children:a.jsx(r,{title:"Session with Badge",imageUrl:_,messageCount:25,showTypeIndicator:!0,typeIndicator:a.jsxs(a.Fragment,{children:[a.jsx(U,{})," SESSION"]}),characterAvatars:[{name:"Bob",avatarUrl:n}]})})]})]})};var j,I,b;e.parameters={...e.parameters,docs:{...(j=e.parameters)==null?void 0:j.docs,source:{originalSource:`{
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
}`,...(b=(I=e.parameters)==null?void 0:I.docs)==null?void 0:b.source}}};var f,D,N;i.parameters={...i.parameters,docs:{...(f=i.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    showTypeIndicator: true
  }
}`,...(N=(D=i.parameters)==null?void 0:D.docs)==null?void 0:N.source}}};var w,P,R;c.parameters={...c.parameters,docs:{...(w=c.parameters)==null?void 0:w.docs,source:{originalSource:`{
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
}`,...(R=(P=c.parameters)==null?void 0:P.docs)==null?void 0:R.source}}};var V,k,O;l.parameters={...l.parameters,docs:{...(V=l.parameters)==null?void 0:V.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Just Started',
    messageCount: 1
  }
}`,...(O=(k=l.parameters)==null?void 0:k.docs)==null?void 0:O.source}}};var z,B,W;d.parameters={...d.parameters,docs:{...(z=d.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    title: 'Mystery Session',
    messageCount: 15,
    characterAvatars: [{
      name: 'Unknown',
      avatarUrl: undefined
    }]
  }
}`,...(W=(B=d.parameters)==null?void 0:B.docs)==null?void 0:W.source}}};var F,q,G;m.parameters={...m.parameters,docs:{...(F=m.parameters)==null?void 0:F.docs,source:{originalSource:`{
  args: {
    title: 'Session without Message Count',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(G=(q=m.parameters)==null?void 0:q.docs)==null?void 0:G.source}}};var H,J,$;p.parameters={...p.parameters,docs:{...(H=p.parameters)==null?void 0:H.docs,source:{originalSource:`{
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
}`,...($=(J=p.parameters)==null?void 0:J.docs)==null?void 0:$.source}}};var K,Q,X;g.parameters={...g.parameters,docs:{...(K=g.parameters)==null?void 0:K.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Loading Characters...',
    areCharactersLoading: true,
    characterAvatars: []
  }
}`,...(X=(Q=g.parameters)==null?void 0:Q.docs)==null?void 0:X.source}}};var Y,Z,aa;u.parameters={...u.parameters,docs:{...(Y=u.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(aa=(Z=u.parameters)==null?void 0:Z.docs)==null?void 0:aa.source}}};var ea,ta,ra;A.parameters={...A.parameters,docs:{...(ea=A.parameters)==null?void 0:ea.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'The Exceptionally Long Session Title That Should Be Truncated After Two Lines'
  }
}`,...(ra=(ta=A.parameters)==null?void 0:ta.docs)==null?void 0:ra.source}}};var sa,na,oa;h.parameters={...h.parameters,docs:{...(sa=h.parameters)==null?void 0:sa.docs,source:{originalSource:`{
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
}`,...(oa=(na=h.parameters)==null?void 0:na.docs)==null?void 0:oa.source}}};var ia,ca,la;v.parameters={...v.parameters,docs:{...(ia=v.parameters)==null?void 0:ia.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Campaign',
    messageCount: 12345
  }
}`,...(la=(ca=v.parameters)==null?void 0:ca.docs)==null?void 0:la.source}}};var da,ma,pa;S.parameters={...S.parameters,docs:{...(da=S.parameters)==null?void 0:da.docs,source:{originalSource:`{
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
}`,...(pa=(ma=S.parameters)==null?void 0:ma.docs)==null?void 0:pa.source}}};var ga,ua,Aa;x.parameters={...x.parameters,docs:{...(ga=x.parameters)==null?void 0:ga.docs,source:{originalSource:`{
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
}`,...(Aa=(ua=x.parameters)==null?void 0:ua.docs)==null?void 0:Aa.source}}};var ha,va,Sa;C.parameters={...C.parameters,docs:{...(ha=C.parameters)==null?void 0:ha.docs,source:{originalSource:`{
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
}`,...(Sa=(va=C.parameters)==null?void 0:va.docs)==null?void 0:Sa.source}}};var xa,Ca,Ma;M.parameters={...M.parameters,docs:{...(xa=M.parameters)==null?void 0:xa.docs,source:{originalSource:`{
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
}`,...(Ma=(Ca=M.parameters)==null?void 0:Ca.docs)==null?void 0:Ma.source}}};var ya,Ea,_a;y.parameters={...y.parameters,docs:{...(ya=y.parameters)==null?void 0:ya.docs,source:{originalSource:`{
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
}`,...(_a=(Ea=y.parameters)==null?void 0:Ea.docs)==null?void 0:_a.source}}};const Ha=["Default","WithTypeIndicator","NewSession","SingleMessage","WithoutImage","WithoutMessageCount","ManyAvatars","LoadingAvatars","Disabled","LongTitle","WithActions","HighMessageCount","GridLayout","CustomMetadata","MetadataWithIcons","FullyCustomMetadata","AllStates"];export{y as AllStates,x as CustomMetadata,e as Default,u as Disabled,M as FullyCustomMetadata,S as GridLayout,v as HighMessageCount,g as LoadingAvatars,A as LongTitle,p as ManyAvatars,C as MetadataWithIcons,c as NewSession,l as SingleMessage,h as WithActions,i as WithTypeIndicator,d as WithoutImage,m as WithoutMessageCount,Ha as __namedExportsOrder,Ga as default};
