import{j as e}from"./iframe-DXfyAoVM.js";import{S as r}from"./SessionCard-C9X8OzIK.js";import{c as me,S as pe,C as ge,D as ue,T as Ae}from"./trash-2-CO4fYckl.js";import"./preload-helper-CwRszBsw.js";import"./utils-DuMXYCiK.js";import"./CardActionToolbar-Dqqh1ZhL.js";/**
 * @license lucide-react v0.503.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const he=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],Se=me("layers",he),Ue={title:"Content/SessionCard",component:r,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{title:{control:"text",description:"Session title"},imageUrl:{control:"text",description:"Cover image URL"},messageCount:{control:"number",description:"Number of messages in the session (optional - if undefined, message count section is hidden)"},isDisabled:{control:"boolean",description:"Whether the card is disabled"},showTypeIndicator:{control:"boolean",description:"Whether to show the SESSION badge"},areCharactersLoading:{control:"boolean",description:"Whether characters are loading"},onClick:{action:"clicked"}},decorators:[s=>e.jsx("div",{style:{width:"320px"},children:e.jsx(s,{})})]},v="https://picsum.photos/seed/session1/600/400",C="https://picsum.photos/seed/session2/600/400",t="https://picsum.photos/seed/avatar1/100/100",x="https://picsum.photos/seed/avatar2/100/100",de="https://picsum.photos/seed/avatar3/100/100",ve="https://picsum.photos/seed/avatar4/100/100",y=()=>e.jsx(Se,{size:16}),a={args:{title:"Adventure in Wonderland",imageUrl:v,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:t},{name:"Bob",avatarUrl:x}],typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(y,{})," SESSION"]})}},n={args:{...a.args,showTypeIndicator:!0}},o={args:{title:"New Adventure",imageUrl:C,messageCount:0,characterAvatars:[{name:"Alice",avatarUrl:t}],typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(y,{})," SESSION"]})}},i={args:{...a.args,title:"Just Started",messageCount:1}},c={args:{title:"Mystery Session",messageCount:15,characterAvatars:[{name:"Unknown",avatarUrl:void 0}]}},l={args:{title:"Session without Message Count",imageUrl:v,characterAvatars:[{name:"Alice",avatarUrl:t}]}},d={args:{...a.args,title:"Group Session",characterAvatars:[{name:"Alice",avatarUrl:t},{name:"Bob",avatarUrl:x},{name:"Charlie",avatarUrl:de},{name:"Diana",avatarUrl:ve},{name:"Eve"}]}},m={args:{...a.args,title:"Loading Characters...",areCharactersLoading:!0,characterAvatars:[]}},p={args:{...a.args,isDisabled:!0}},g={args:{...a.args,title:"The Exceptionally Long Session Title That Should Be Truncated After Two Lines"}},u={args:{...a.args,actions:[{icon:pe,label:"Edit",onClick:()=>console.log("Edit clicked"),title:"Edit session"},{icon:ge,label:"Duplicate",onClick:()=>console.log("Duplicate clicked"),title:"Duplicate session"},{icon:ue,label:"Export",onClick:()=>console.log("Export clicked"),title:"Export session"},{icon:Ae,label:"Delete",onClick:()=>console.log("Delete clicked"),title:"Delete session",className:"hover:text-red-400"}]}},A={args:{...a.args,title:"Epic Campaign",messageCount:12345}},h={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 320px)",gap:"24px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsx(r,{title:"Adventure in Wonderland",imageUrl:v,messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:t},{name:"Bob",avatarUrl:x}]}),e.jsx(r,{title:"Mystery Investigation",imageUrl:C,messageCount:128,showTypeIndicator:!0,typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(y,{})," SESSION"]}),characterAvatars:[{name:"Detective",avatarUrl:de}]}),e.jsx(r,{title:"New Session",messageCount:0,characterAvatars:[]})]})},S={args:{...a.args},decorators:[s=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"Default"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(r,{title:"Default Session",imageUrl:v,messageCount:10,characterAvatars:[{name:"Alice",avatarUrl:t}]})})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{marginBottom:"12px",fontSize:"14px",color:"var(--fg-muted)"},children:"With Type Indicator"}),e.jsx("div",{style:{width:"320px"},children:e.jsx(r,{title:"Session with Badge",imageUrl:C,messageCount:25,showTypeIndicator:!0,typeIndicator:e.jsxs(e.Fragment,{children:[e.jsx(y,{})," SESSION"]}),characterAvatars:[{name:"Bob",avatarUrl:x}]})})]})]})};var E,T,_;a.parameters={...a.parameters,docs:{...(E=a.parameters)==null?void 0:E.docs,source:{originalSource:`{
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
}`,...(_=(T=a.parameters)==null?void 0:T.docs)==null?void 0:_.source}}};var U,L,M;n.parameters={...n.parameters,docs:{...(U=n.parameters)==null?void 0:U.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    showTypeIndicator: true
  }
}`,...(M=(L=n.parameters)==null?void 0:L.docs)==null?void 0:M.source}}};var D,f,I;o.parameters={...o.parameters,docs:{...(D=o.parameters)==null?void 0:D.docs,source:{originalSource:`{
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
}`,...(I=(f=o.parameters)==null?void 0:f.docs)==null?void 0:I.source}}};var j,w,b;i.parameters={...i.parameters,docs:{...(j=i.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Just Started',
    messageCount: 1
  }
}`,...(b=(w=i.parameters)==null?void 0:w.docs)==null?void 0:b.source}}};var R,P,V;c.parameters={...c.parameters,docs:{...(R=c.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    title: 'Mystery Session',
    messageCount: 15,
    characterAvatars: [{
      name: 'Unknown',
      avatarUrl: undefined
    }]
  }
}`,...(V=(P=c.parameters)==null?void 0:P.docs)==null?void 0:V.source}}};var k,N,O;l.parameters={...l.parameters,docs:{...(k=l.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    title: 'Session without Message Count',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [{
      name: 'Alice',
      avatarUrl: SAMPLE_AVATAR_1
    }]
  }
}`,...(O=(N=l.parameters)==null?void 0:N.docs)==null?void 0:O.source}}};var W,B,z;d.parameters={...d.parameters,docs:{...(W=d.parameters)==null?void 0:W.docs,source:{originalSource:`{
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
}`,...(z=(B=d.parameters)==null?void 0:B.docs)==null?void 0:z.source}}};var F,G,q;m.parameters={...m.parameters,docs:{...(F=m.parameters)==null?void 0:F.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Loading Characters...',
    areCharactersLoading: true,
    characterAvatars: []
  }
}`,...(q=(G=m.parameters)==null?void 0:G.docs)==null?void 0:q.source}}};var H,J,K;p.parameters={...p.parameters,docs:{...(H=p.parameters)==null?void 0:H.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    isDisabled: true
  }
}`,...(K=(J=p.parameters)==null?void 0:J.docs)==null?void 0:K.source}}};var Q,X,Y;g.parameters={...g.parameters,docs:{...(Q=g.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'The Exceptionally Long Session Title That Should Be Truncated After Two Lines'
  }
}`,...(Y=(X=g.parameters)==null?void 0:X.docs)==null?void 0:Y.source}}};var Z,$,ee;u.parameters={...u.parameters,docs:{...(Z=u.parameters)==null?void 0:Z.docs,source:{originalSource:`{
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
}`,...(ee=($=u.parameters)==null?void 0:$.docs)==null?void 0:ee.source}}};var ae,re,te;A.parameters={...A.parameters,docs:{...(ae=A.parameters)==null?void 0:ae.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    title: 'Epic Campaign',
    messageCount: 12345
  }
}`,...(te=(re=A.parameters)==null?void 0:re.docs)==null?void 0:te.source}}};var se,ne,oe;h.parameters={...h.parameters,docs:{...(se=h.parameters)==null?void 0:se.docs,source:{originalSource:`{
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
}`,...(oe=(ne=h.parameters)==null?void 0:ne.docs)==null?void 0:oe.source}}};var ie,ce,le;S.parameters={...S.parameters,docs:{...(ie=S.parameters)==null?void 0:ie.docs,source:{originalSource:`{
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
}`,...(le=(ce=S.parameters)==null?void 0:ce.docs)==null?void 0:le.source}}};const Le=["Default","WithTypeIndicator","NewSession","SingleMessage","WithoutImage","WithoutMessageCount","ManyAvatars","LoadingAvatars","Disabled","LongTitle","WithActions","HighMessageCount","GridLayout","AllStates"];export{S as AllStates,a as Default,p as Disabled,h as GridLayout,A as HighMessageCount,m as LoadingAvatars,g as LongTitle,d as ManyAvatars,o as NewSession,i as SingleMessage,u as WithActions,n as WithTypeIndicator,c as WithoutImage,l as WithoutMessageCount,Le as __namedExportsOrder,Ue as default};
