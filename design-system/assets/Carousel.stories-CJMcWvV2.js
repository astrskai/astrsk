import{r as i,R as le,j as e}from"./iframe-Cjd9Zdil.js";import{c as C}from"./utils-DuMXYCiK.js";import{C as s}from"./CharacterCard-DIU8GA-W.js";import{S as u}from"./SessionCard-CIV0OuF7.js";import"./preload-helper-CwRszBsw.js";import"./CardMetadata-DS17sc0W.js";function _({direction:r,className:U}){return e.jsx("svg",{className:U,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",children:r==="left"?e.jsx("polyline",{points:"15 18 9 12 15 6"}):e.jsx("polyline",{points:"9 18 15 12 9 6"})})}function m({children:r,className:U,gap:R=16,showArrows:Y=!0,showDots:Z=!1,scrollCount:k=1,"aria-label":ee="Carousel"}){const p=i.useRef(null),[ae,re]=i.useState(!1),[te,se]=i.useState(!1),[M,oe]=i.useState(0),[T,ne]=i.useState(0),j=le.Children.toArray(r),h=i.useCallback(()=>{const t=p.current;if(!t)return;const{scrollLeft:a,scrollWidth:n,clientWidth:A}=t,g=n-A;re(a>1),se(a<g-1);const c=t.children;if(c.length>0){ne(c.length);const y=g>0?a/g:0,E=Math.round(y*(c.length-1));oe(Math.min(Math.max(E,0),c.length-1))}},[]),ie=i.useCallback(t=>{const a=p.current;if(!a)return;const n=a.children;if(n.length<=1)return;const{scrollWidth:A,clientWidth:g}=a,c=A-g,E=t/(n.length-1)*c;a.scrollTo({left:E,behavior:"smooth"})},[]),I=i.useCallback(t=>{const a=p.current;if(!a)return;const n=a.children;if(n.length===0)return;const c=(n[0].offsetWidth+R)*k,y=t==="left"?a.scrollLeft-c:a.scrollLeft+c;a.scrollTo({left:y,behavior:"smooth"})},[R,k]);return i.useEffect(()=>{const t=p.current;if(!t)return;h();const a=()=>h();t.addEventListener("scroll",a,{passive:!0});const n=new ResizeObserver(()=>h());return n.observe(t),()=>{t.removeEventListener("scroll",a),n.disconnect()}},[h]),i.useEffect(()=>{h()},[r,h]),e.jsxs("div",{className:C("relative w-full",U),role:"region","aria-label":ee,"aria-roledescription":"carousel",children:[e.jsx("div",{ref:p,className:C("flex overflow-x-auto scroll-smooth","scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]","[&::-webkit-scrollbar]:hidden","snap-x snap-mandatory lg:snap-none","px-4 lg:px-0"),style:{gap:`${R}px`},tabIndex:0,"aria-live":"polite",children:j.map((t,a)=>e.jsx("div",{className:C("flex-shrink-0 snap-start","w-[280px] sm:w-[300px] lg:w-[320px]"),role:"group","aria-roledescription":"slide","aria-label":`${a+1} of ${j.length}`,children:t},a))}),Y&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:()=>I("left"),disabled:!ae,className:C("absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-4","hidden lg:flex items-center justify-center","h-10 w-10 rounded-full","bg-zinc-800 border border-zinc-700","text-zinc-400 hover:text-white hover:bg-zinc-700","transition-all duration-200","disabled:opacity-0 disabled:pointer-events-none","focus:outline-none focus:ring-2 focus:ring-zinc-500"),"aria-label":"Previous items",children:e.jsx(_,{direction:"left",className:"h-5 w-5"})}),e.jsx("button",{onClick:()=>I("right"),disabled:!te,className:C("absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-4","hidden lg:flex items-center justify-center","h-10 w-10 rounded-full","bg-zinc-800 border border-zinc-700","text-zinc-400 hover:text-white hover:bg-zinc-700","transition-all duration-200","disabled:opacity-0 disabled:pointer-events-none","focus:outline-none focus:ring-2 focus:ring-zinc-500"),"aria-label":"Next items",children:e.jsx(_,{direction:"right",className:"h-5 w-5"})})]}),Z&&T>1&&e.jsx("div",{className:"flex justify-center gap-2 mt-4",role:"tablist","aria-label":"Carousel navigation",children:Array.from({length:T}).map((t,a)=>e.jsx("button",{onClick:()=>ie(a),className:C("h-2 w-2 rounded-full transition-all duration-200","focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900",a===M?"bg-white w-4":"bg-zinc-600 hover:bg-zinc-500"),role:"tab","aria-selected":a===M,"aria-label":`Go to slide ${a+1}`},a))})]})}m.__docgenInfo={description:`Carousel Component

A responsive carousel component that works on both desktop and mobile.
- Desktop: Shows navigation arrows, scrolls by scrollCount
- Mobile: Touch/swipe scrolling with momentum, optional dots

@example
\`\`\`tsx
<Carousel showArrows showDots>
  <CharacterCard name="Alice" ... />
  <CharacterCard name="Bob" ... />
  <SessionCard title="Adventure" ... />
</Carousel>
\`\`\``,methods:[],displayName:"Carousel",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Carousel items"},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes for the container"},gap:{required:!1,tsType:{name:"number"},description:"Gap between items in pixels",defaultValue:{value:"16",computed:!1}},showArrows:{required:!1,tsType:{name:"boolean"},description:"Whether to show navigation arrows (desktop only)",defaultValue:{value:"true",computed:!1}},showDots:{required:!1,tsType:{name:"boolean"},description:"Whether to show dot indicators",defaultValue:{value:"false",computed:!1}},scrollCount:{required:!1,tsType:{name:"number"},description:"Number of items to scroll at once (desktop)",defaultValue:{value:"1",computed:!1}},"aria-label":{required:!1,tsType:{name:"string"},description:"Accessible label for the carousel",defaultValue:{value:"'Carousel'",computed:!1}}}};const Ce={title:"Content/Carousel",component:m,tags:["autodocs"],parameters:{layout:"padded",docs:{description:{component:`A responsive carousel component for displaying cards. Supports touch/swipe on mobile and arrow navigation on desktop.

## Installation

\`\`\`bash
npm install @astrsk/design-system
\`\`\`

## Usage

\`\`\`tsx
import { Carousel, CharacterCard, SessionCard } from '@astrsk/design-system';

// Basic usage with CharacterCards
function CharacterCarousel() {
  return (
    <Carousel showArrows showDots>
      <CharacterCard
        name="Alice"
        imageUrl="/characters/alice.png"
        summary="A curious adventurer"
        tags={['Fantasy', 'Adventure']}
        tokenCount={1500}
      />
      <CharacterCard
        name="Bob"
        imageUrl="/characters/bob.png"
        summary="A brave knight"
        tags={['Action']}
        tokenCount={2000}
      />
    </Carousel>
  );
}

// With SessionCards
function SessionCarousel() {
  return (
    <Carousel showArrows gap={20}>
      <SessionCard
        title="Adventure in Wonderland"
        imageUrl="/sessions/cover1.png"
        messageCount={42}
        characterAvatars={[
          { name: 'Alice', avatarUrl: '/avatars/alice.png' },
        ]}
      />
      <SessionCard
        title="Tea Party"
        imageUrl="/sessions/cover2.png"
        messageCount={128}
      />
    </Carousel>
  );
}

// Mobile-optimized (no arrows, dots only)
function MobileCarousel() {
  return (
    <Carousel showArrows={false} showDots gap={12}>
      {items.map((item) => (
        <CharacterCard key={item.id} {...item} />
      ))}
    </Carousel>
  );
}
\`\`\`
`}}},argTypes:{gap:{control:{type:"number",min:0,max:48},description:"Gap between items in pixels"},showArrows:{control:"boolean",description:"Whether to show navigation arrows (desktop only)"},showDots:{control:"boolean",description:"Whether to show dot indicators"},scrollCount:{control:{type:"number",min:1,max:5},description:"Number of items to scroll at once (desktop)"}}},o=["https://picsum.photos/seed/char1/400/600","https://picsum.photos/seed/char2/400/600","https://picsum.photos/seed/char3/400/600","https://picsum.photos/seed/char4/400/600","https://picsum.photos/seed/char5/400/600"],d=["https://picsum.photos/seed/session1/800/400","https://picsum.photos/seed/session2/800/400","https://picsum.photos/seed/session3/800/400","https://picsum.photos/seed/session4/800/400"],l=["https://picsum.photos/seed/avatar1/100/100","https://picsum.photos/seed/avatar2/100/100","https://picsum.photos/seed/avatar3/100/100"],w={args:{showArrows:!0,showDots:!0,gap:16,scrollCount:1},render:r=>e.jsxs(m,{...r,"aria-label":"Character cards carousel",children:[e.jsx(s,{name:"Alice Wonderland",imageUrl:o[0],summary:"A curious young girl who falls down a rabbit hole into a fantasy world.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago"}),e.jsx(s,{name:"Mad Hatter",imageUrl:o[1],summary:"An eccentric character known for his tea parties and riddles.",tags:["Fantasy","Comedy"],tokenCount:2100,updatedAt:"1 week ago"}),e.jsx(s,{name:"Cheshire Cat",imageUrl:o[2],summary:"A mysterious cat with a distinctive grin who can appear and disappear at will.",tags:["Mystery","Fantasy"],tokenCount:1800,updatedAt:"3 days ago"}),e.jsx(s,{name:"Queen of Hearts",imageUrl:o[3],summary:"The tyrannical ruler of Wonderland known for her temper.",tags:["Villain","Royal"],tokenCount:900,updatedAt:"5 days ago"}),e.jsx(s,{name:"White Rabbit",imageUrl:o[4],summary:"A nervous rabbit always worried about being late.",tags:["Fantasy","Guide"],tokenCount:750,updatedAt:"Just now"})]})},f={args:{showArrows:!0,showDots:!0,gap:16},render:r=>e.jsxs(m,{...r,"aria-label":"Session cards carousel",children:[e.jsx(u,{title:"Adventure in Wonderland",imageUrl:d[0],messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:l[0]},{name:"Hatter",avatarUrl:l[1]}]}),e.jsx(u,{title:"Tea Party Chaos",imageUrl:d[1],messageCount:128,characterAvatars:[{name:"Hatter",avatarUrl:l[1]},{name:"March Hare",avatarUrl:l[2]}]}),e.jsx(u,{title:"Court of the Queen",imageUrl:d[2],messageCount:256,characterAvatars:[{name:"Queen",avatarUrl:l[0]}]}),e.jsx(u,{title:"New Adventure",imageUrl:d[3],messageCount:0,characterAvatars:[]})]})},S={args:{showArrows:!0,showDots:!0,gap:20},render:r=>e.jsxs(m,{...r,"aria-label":"Mixed content carousel",children:[e.jsx(s,{name:"Alice Wonderland",imageUrl:o[0],summary:"A curious young girl who falls down a rabbit hole.",tags:["Fantasy"],tokenCount:1523}),e.jsx(u,{title:"Adventure in Wonderland",imageUrl:d[0],messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:l[0]}]}),e.jsx(s,{name:"Mad Hatter",imageUrl:o[1],summary:"An eccentric character known for his tea parties.",tags:["Comedy"],tokenCount:2100}),e.jsx(u,{title:"Tea Party",imageUrl:d[1],messageCount:128,characterAvatars:[{name:"Hatter",avatarUrl:l[1]}]})]})},b={args:{showArrows:!1,showDots:!0,gap:12},parameters:{viewport:{defaultViewport:"mobile1"},docs:{description:{story:"Mobile-optimized carousel with dots only. Swipe to navigate."}}},render:r=>e.jsxs(m,{...r,"aria-label":"Mobile carousel",children:[e.jsx(s,{name:"Alice",imageUrl:o[0],summary:"A curious young girl.",tags:["Fantasy"],tokenCount:1523}),e.jsx(s,{name:"Hatter",imageUrl:o[1],summary:"Tea party host.",tags:["Comedy"],tokenCount:2100}),e.jsx(s,{name:"Cat",imageUrl:o[2],summary:"Mysterious feline.",tags:["Mystery"],tokenCount:1800})]})},v={args:{showArrows:!0,showDots:!1,gap:16,scrollCount:2},render:r=>e.jsxs(m,{...r,"aria-label":"Arrows only carousel",children:[e.jsx(s,{name:"Alice",imageUrl:o[0],summary:"A curious young girl.",tags:["Fantasy"],tokenCount:1523}),e.jsx(s,{name:"Hatter",imageUrl:o[1],summary:"Tea party host.",tags:["Comedy"],tokenCount:2100}),e.jsx(s,{name:"Cat",imageUrl:o[2],summary:"Mysterious feline.",tags:["Mystery"],tokenCount:1800}),e.jsx(s,{name:"Queen",imageUrl:o[3],summary:"Ruler of Wonderland.",tags:["Villain"],tokenCount:900})]})},x={args:{showArrows:!0,showDots:!1,gap:32},render:r=>e.jsxs(m,{...r,"aria-label":"Wide gap carousel",children:[e.jsx(u,{title:"Session One",imageUrl:d[0],messageCount:10,characterAvatars:[{name:"Alice",avatarUrl:l[0]}]}),e.jsx(u,{title:"Session Two",imageUrl:d[1],messageCount:25,characterAvatars:[{name:"Bob",avatarUrl:l[1]}]}),e.jsx(u,{title:"Session Three",imageUrl:d[2],messageCount:50,characterAvatars:[{name:"Cat",avatarUrl:l[2]}]})]})};var W,G,H;w.parameters={...w.parameters,docs:{...(W=w.parameters)==null?void 0:W.docs,source:{originalSource:`{
  args: {
    showArrows: true,
    showDots: true,
    gap: 16,
    scrollCount: 1
  },
  render: args => <Carousel {...args} aria-label="Character cards carousel">
      <CharacterCard name="Alice Wonderland" imageUrl={CHARACTER_IMAGES[0]} summary="A curious young girl who falls down a rabbit hole into a fantasy world." tags={['Fantasy', 'Adventure']} tokenCount={1523} updatedAt="2 days ago" />
      <CharacterCard name="Mad Hatter" imageUrl={CHARACTER_IMAGES[1]} summary="An eccentric character known for his tea parties and riddles." tags={['Fantasy', 'Comedy']} tokenCount={2100} updatedAt="1 week ago" />
      <CharacterCard name="Cheshire Cat" imageUrl={CHARACTER_IMAGES[2]} summary="A mysterious cat with a distinctive grin who can appear and disappear at will." tags={['Mystery', 'Fantasy']} tokenCount={1800} updatedAt="3 days ago" />
      <CharacterCard name="Queen of Hearts" imageUrl={CHARACTER_IMAGES[3]} summary="The tyrannical ruler of Wonderland known for her temper." tags={['Villain', 'Royal']} tokenCount={900} updatedAt="5 days ago" />
      <CharacterCard name="White Rabbit" imageUrl={CHARACTER_IMAGES[4]} summary="A nervous rabbit always worried about being late." tags={['Fantasy', 'Guide']} tokenCount={750} updatedAt="Just now" />
    </Carousel>
}`,...(H=(G=w.parameters)==null?void 0:G.docs)==null?void 0:H.source}}};var V,N,O;f.parameters={...f.parameters,docs:{...(V=f.parameters)==null?void 0:V.docs,source:{originalSource:`{
  args: {
    showArrows: true,
    showDots: true,
    gap: 16
  },
  render: args => <Carousel {...args} aria-label="Session cards carousel">
      <SessionCard title="Adventure in Wonderland" imageUrl={SESSION_COVERS[0]} messageCount={42} characterAvatars={[{
      name: 'Alice',
      avatarUrl: AVATAR_IMAGES[0]
    }, {
      name: 'Hatter',
      avatarUrl: AVATAR_IMAGES[1]
    }]} />
      <SessionCard title="Tea Party Chaos" imageUrl={SESSION_COVERS[1]} messageCount={128} characterAvatars={[{
      name: 'Hatter',
      avatarUrl: AVATAR_IMAGES[1]
    }, {
      name: 'March Hare',
      avatarUrl: AVATAR_IMAGES[2]
    }]} />
      <SessionCard title="Court of the Queen" imageUrl={SESSION_COVERS[2]} messageCount={256} characterAvatars={[{
      name: 'Queen',
      avatarUrl: AVATAR_IMAGES[0]
    }]} />
      <SessionCard title="New Adventure" imageUrl={SESSION_COVERS[3]} messageCount={0} characterAvatars={[]} />
    </Carousel>
}`,...(O=(N=f.parameters)==null?void 0:N.docs)==null?void 0:O.source}}};var z,D,F;S.parameters={...S.parameters,docs:{...(z=S.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    showArrows: true,
    showDots: true,
    gap: 20
  },
  render: args => <Carousel {...args} aria-label="Mixed content carousel">
      <CharacterCard name="Alice Wonderland" imageUrl={CHARACTER_IMAGES[0]} summary="A curious young girl who falls down a rabbit hole." tags={['Fantasy']} tokenCount={1523} />
      <SessionCard title="Adventure in Wonderland" imageUrl={SESSION_COVERS[0]} messageCount={42} characterAvatars={[{
      name: 'Alice',
      avatarUrl: AVATAR_IMAGES[0]
    }]} />
      <CharacterCard name="Mad Hatter" imageUrl={CHARACTER_IMAGES[1]} summary="An eccentric character known for his tea parties." tags={['Comedy']} tokenCount={2100} />
      <SessionCard title="Tea Party" imageUrl={SESSION_COVERS[1]} messageCount={128} characterAvatars={[{
      name: 'Hatter',
      avatarUrl: AVATAR_IMAGES[1]
    }]} />
    </Carousel>
}`,...(F=(D=S.parameters)==null?void 0:D.docs)==null?void 0:F.source}}};var L,Q,q;b.parameters={...b.parameters,docs:{...(L=b.parameters)==null?void 0:L.docs,source:{originalSource:`{
  args: {
    showArrows: false,
    showDots: true,
    gap: 12
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Mobile-optimized carousel with dots only. Swipe to navigate.'
      }
    }
  },
  render: args => <Carousel {...args} aria-label="Mobile carousel">
      <CharacterCard name="Alice" imageUrl={CHARACTER_IMAGES[0]} summary="A curious young girl." tags={['Fantasy']} tokenCount={1523} />
      <CharacterCard name="Hatter" imageUrl={CHARACTER_IMAGES[1]} summary="Tea party host." tags={['Comedy']} tokenCount={2100} />
      <CharacterCard name="Cat" imageUrl={CHARACTER_IMAGES[2]} summary="Mysterious feline." tags={['Mystery']} tokenCount={1800} />
    </Carousel>
}`,...(q=(Q=b.parameters)==null?void 0:Q.docs)==null?void 0:q.source}}};var B,P,$;v.parameters={...v.parameters,docs:{...(B=v.parameters)==null?void 0:B.docs,source:{originalSource:`{
  args: {
    showArrows: true,
    showDots: false,
    gap: 16,
    scrollCount: 2
  },
  render: args => <Carousel {...args} aria-label="Arrows only carousel">
      <CharacterCard name="Alice" imageUrl={CHARACTER_IMAGES[0]} summary="A curious young girl." tags={['Fantasy']} tokenCount={1523} />
      <CharacterCard name="Hatter" imageUrl={CHARACTER_IMAGES[1]} summary="Tea party host." tags={['Comedy']} tokenCount={2100} />
      <CharacterCard name="Cat" imageUrl={CHARACTER_IMAGES[2]} summary="Mysterious feline." tags={['Mystery']} tokenCount={1800} />
      <CharacterCard name="Queen" imageUrl={CHARACTER_IMAGES[3]} summary="Ruler of Wonderland." tags={['Villain']} tokenCount={900} />
    </Carousel>
}`,...($=(P=v.parameters)==null?void 0:P.docs)==null?void 0:$.source}}};var J,K,X;x.parameters={...x.parameters,docs:{...(J=x.parameters)==null?void 0:J.docs,source:{originalSource:`{
  args: {
    showArrows: true,
    showDots: false,
    gap: 32
  },
  render: args => <Carousel {...args} aria-label="Wide gap carousel">
      <SessionCard title="Session One" imageUrl={SESSION_COVERS[0]} messageCount={10} characterAvatars={[{
      name: 'Alice',
      avatarUrl: AVATAR_IMAGES[0]
    }]} />
      <SessionCard title="Session Two" imageUrl={SESSION_COVERS[1]} messageCount={25} characterAvatars={[{
      name: 'Bob',
      avatarUrl: AVATAR_IMAGES[1]
    }]} />
      <SessionCard title="Session Three" imageUrl={SESSION_COVERS[2]} messageCount={50} characterAvatars={[{
      name: 'Cat',
      avatarUrl: AVATAR_IMAGES[2]
    }]} />
    </Carousel>
}`,...(X=(K=x.parameters)==null?void 0:K.docs)==null?void 0:X.source}}};const pe=["WithCharacterCards","WithSessionCards","MixedContent","MobileStyle","ArrowsOnly","WideGap"];export{v as ArrowsOnly,S as MixedContent,b as MobileStyle,x as WideGap,w as WithCharacterCards,f as WithSessionCards,pe as __namedExportsOrder,Ce as default};
