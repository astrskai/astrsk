import{r as h,R as We,j as e}from"./iframe-L6B2kDkv.js";import{c}from"./utils-DuMXYCiK.js";import{C as t}from"./CharacterCard-BmZhG0Zc.js";import{S as g}from"./SessionCard-DoLgMsCu.js";import"./preload-helper-CwRszBsw.js";import"./CardMetadata-DFOkiukh.js";const fe=c("absolute top-1/2 z-10 -translate-y-1/2","flex items-center justify-center","transition-all duration-200","disabled:opacity-0 disabled:pointer-events-none","focus:outline-none focus:ring-2 focus:ring-zinc-500"),Be=c(fe,"h-10 w-10 rounded-full","bg-zinc-800 border border-zinc-700","text-zinc-400 hover:text-white hover:bg-zinc-700"),Ge=c(fe,"h-12 w-12","text-white/70 hover:text-white","focus:ring-0","opacity-0 group-hover:opacity-100"),He=c("flex overflow-x-auto scroll-smooth","scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]","[&::-webkit-scrollbar]:hidden","snap-x snap-mandatory"),Oe=c("h-2 rounded-full transition-all duration-200","focus:outline-none"),De="focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900",Ve="left-0 -translate-x-4",Le="right-0 translate-x-4",Fe="left-2",ze="right-2",F="h-5 w-5",z="h-8 w-8";function P({direction:a,className:w}){return e.jsx("svg",{className:w,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",children:a==="left"?e.jsx("polyline",{points:"15 18 9 12 15 6"}):e.jsx("polyline",{points:"9 18 15 12 9 6"})})}function i({children:a,className:w,gap:S=16,showArrows:ve=!0,showDots:Ee=!1,scrollCount:H=1,"aria-label":xe="Carousel",variant:Re="default",loop:f=!1}){const l=Re==="banner",O=l?Ge:Be,v=h.useRef(null),[Ue,Me]=h.useState(!1),[Te,_e]=h.useState(!0),[ke,Ne]=h.useState(0),G=We.Children.toArray(a),D=G.length,y=h.useCallback(()=>{const o=v.current;if(!o)return;const{scrollLeft:r,scrollWidth:n,clientWidth:R}=o,b=n-R;Me(r>1),_e(r<b-1);const C=o.children;if(C.length>0){const A=b>0?r/b:0,E=Math.round(A*(C.length-1));Ne(Math.min(Math.max(E,0),C.length-1))}},[]),je=h.useCallback(o=>{const r=v.current;if(!r)return;const n=r.children;if(n.length<=1)return;const{scrollWidth:R,clientWidth:b}=r,C=R-b,E=o/(n.length-1)*C;r.scrollTo({left:E,behavior:"smooth"})},[]),V=h.useCallback(o=>{const r=v.current;if(!r)return;const n=r.children;if(n.length===0)return;const C=(n[0].offsetWidth+(l?0:S))*H,{scrollLeft:A,scrollWidth:E,clientWidth:Ie}=r,L=E-Ie;let x;o==="left"?f&&A<=1?x=L:x=A-C:f&&A>=L-1?x=0:x=A+C,r.scrollTo({left:x,behavior:"smooth"})},[S,H,f,l]);return h.useEffect(()=>{const o=v.current;if(!o)return;y();const r=()=>y();o.addEventListener("scroll",r,{passive:!0});const n=new ResizeObserver(()=>y());return n.observe(o),()=>{o.removeEventListener("scroll",r),n.disconnect()}},[y]),h.useEffect(()=>{y()},[a,y]),e.jsxs("div",{className:c("relative w-full",l&&"group",w),role:"region","aria-label":xe,"aria-roledescription":"carousel",children:[e.jsx("div",{ref:v,className:He,style:{gap:l?0:`${S}px`},tabIndex:0,"aria-live":"polite",children:G.map((o,r)=>e.jsx("div",{className:c("flex-shrink-0 snap-start",l?"w-full":"w-[280px] sm:w-[300px] lg:w-[320px]"),role:"group","aria-roledescription":"slide","aria-label":`${r+1} of ${G.length}`,children:o},r))}),ve&&e.jsxs(e.Fragment,{children:[e.jsx("button",{type:"button",onClick:()=>V("left"),disabled:!f&&!Ue,className:c(O,l?Fe:Ve),"aria-label":"Previous items",children:e.jsx(P,{direction:"left",className:l?z:F})}),e.jsx("button",{type:"button",onClick:()=>V("right"),disabled:!f&&!Te,className:c(O,l?ze:Le),"aria-label":"Next items",children:e.jsx(P,{direction:"right",className:l?z:F})})]}),Ee&&D>1&&e.jsx("div",{className:c("flex justify-center gap-2",l?"absolute bottom-4 left-1/2 -translate-x-1/2 z-10":"mt-4"),role:"tablist","aria-label":"Carousel navigation",children:Array.from({length:D}).map((o,r)=>{const n=r===ke;return e.jsx("button",{type:"button",onClick:()=>je(r),className:c(Oe,!l&&De,n?"bg-white w-4":"bg-zinc-600 hover:bg-zinc-500 w-2",l&&!n&&"bg-white/40 hover:bg-white/60"),role:"tab","aria-selected":n,"aria-label":`Go to slide ${r+1}`},r)})})]})}i.__docgenInfo={description:`Carousel Component

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
\`\`\``,methods:[],displayName:"Carousel",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Carousel items"},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes for the container"},gap:{required:!1,tsType:{name:"number"},description:"Gap between items in pixels",defaultValue:{value:"16",computed:!1}},showArrows:{required:!1,tsType:{name:"boolean"},description:"Whether to show navigation arrows",defaultValue:{value:"true",computed:!1}},showDots:{required:!1,tsType:{name:"boolean"},description:"Whether to show dot indicators",defaultValue:{value:"false",computed:!1}},scrollCount:{required:!1,tsType:{name:"number"},description:"Number of items to scroll at once",defaultValue:{value:"1",computed:!1}},"aria-label":{required:!1,tsType:{name:"string"},description:"Accessible label for the carousel",defaultValue:{value:"'Carousel'",computed:!1}},variant:{required:!1,tsType:{name:"union",raw:"'default' | 'banner'",elements:[{name:"literal",value:"'default'"},{name:"literal",value:"'banner'"}]},description:"Variant type: 'default' for card carousel, 'banner' for full-width banner slides",defaultValue:{value:"'default'",computed:!1}},loop:{required:!1,tsType:{name:"boolean"},description:"Whether to loop back to start/end when reaching boundaries",defaultValue:{value:"false",computed:!1}}}};const Ze={title:"Content/Carousel",component:i,tags:["autodocs"],parameters:{layout:"padded",docs:{description:{component:`A responsive carousel component for displaying cards. Supports touch/swipe on mobile and arrow navigation on desktop.

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
`}}},argTypes:{gap:{control:{type:"number",min:0,max:48},description:"Gap between items in pixels"},showArrows:{control:"boolean",description:"Whether to show navigation arrows (desktop only)"},showDots:{control:"boolean",description:"Whether to show dot indicators"},scrollCount:{control:{type:"number",min:1,max:5},description:"Number of items to scroll at once (desktop)"}}},s=["https://picsum.photos/seed/char1/400/600","https://picsum.photos/seed/char2/400/600","https://picsum.photos/seed/char3/400/600","https://picsum.photos/seed/char4/400/600","https://picsum.photos/seed/char5/400/600"],p=["https://picsum.photos/seed/session1/800/400","https://picsum.photos/seed/session2/800/400","https://picsum.photos/seed/session3/800/400","https://picsum.photos/seed/session4/800/400"],u=["https://picsum.photos/seed/avatar1/100/100","https://picsum.photos/seed/avatar2/100/100","https://picsum.photos/seed/avatar3/100/100"],U={args:{showArrows:!0,showDots:!0,gap:16,scrollCount:1},render:a=>e.jsxs(i,{...a,"aria-label":"Character cards carousel",children:[e.jsx(t,{name:"Alice Wonderland",imageUrl:s[0],summary:"A curious young girl who falls down a rabbit hole into a fantasy world.",tags:["Fantasy","Adventure"],tokenCount:1523,updatedAt:"2 days ago"}),e.jsx(t,{name:"Mad Hatter",imageUrl:s[1],summary:"An eccentric character known for his tea parties and riddles.",tags:["Fantasy","Comedy"],tokenCount:2100,updatedAt:"1 week ago"}),e.jsx(t,{name:"Cheshire Cat",imageUrl:s[2],summary:"A mysterious cat with a distinctive grin who can appear and disappear at will.",tags:["Mystery","Fantasy"],tokenCount:1800,updatedAt:"3 days ago"}),e.jsx(t,{name:"Queen of Hearts",imageUrl:s[3],summary:"The tyrannical ruler of Wonderland known for her temper.",tags:["Villain","Royal"],tokenCount:900,updatedAt:"5 days ago"}),e.jsx(t,{name:"White Rabbit",imageUrl:s[4],summary:"A nervous rabbit always worried about being late.",tags:["Fantasy","Guide"],tokenCount:750,updatedAt:"Just now"})]})},M={args:{showArrows:!0,showDots:!0,gap:16},render:a=>e.jsxs(i,{...a,"aria-label":"Session cards carousel",children:[e.jsx(g,{title:"Adventure in Wonderland",imageUrl:p[0],messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:u[0]},{name:"Hatter",avatarUrl:u[1]}]}),e.jsx(g,{title:"Tea Party Chaos",imageUrl:p[1],messageCount:128,characterAvatars:[{name:"Hatter",avatarUrl:u[1]},{name:"March Hare",avatarUrl:u[2]}]}),e.jsx(g,{title:"Court of the Queen",imageUrl:p[2],messageCount:256,characterAvatars:[{name:"Queen",avatarUrl:u[0]}]}),e.jsx(g,{title:"New Adventure",imageUrl:p[3],messageCount:0,characterAvatars:[]})]})},T={args:{showArrows:!0,showDots:!0,gap:20},render:a=>e.jsxs(i,{...a,"aria-label":"Mixed content carousel",children:[e.jsx(t,{name:"Alice Wonderland",imageUrl:s[0],summary:"A curious young girl who falls down a rabbit hole.",tags:["Fantasy"],tokenCount:1523}),e.jsx(g,{title:"Adventure in Wonderland",imageUrl:p[0],messageCount:42,characterAvatars:[{name:"Alice",avatarUrl:u[0]}]}),e.jsx(t,{name:"Mad Hatter",imageUrl:s[1],summary:"An eccentric character known for his tea parties.",tags:["Comedy"],tokenCount:2100}),e.jsx(g,{title:"Tea Party",imageUrl:p[1],messageCount:128,characterAvatars:[{name:"Hatter",avatarUrl:u[1]}]})]})},_={args:{showArrows:!1,showDots:!0,gap:12},parameters:{viewport:{defaultViewport:"mobile1"},docs:{description:{story:"Mobile-optimized carousel with dots only. Swipe to navigate."}}},render:a=>e.jsxs(i,{...a,"aria-label":"Mobile carousel",children:[e.jsx(t,{name:"Alice",imageUrl:s[0],summary:"A curious young girl.",tags:["Fantasy"],tokenCount:1523}),e.jsx(t,{name:"Hatter",imageUrl:s[1],summary:"Tea party host.",tags:["Comedy"],tokenCount:2100}),e.jsx(t,{name:"Cat",imageUrl:s[2],summary:"Mysterious feline.",tags:["Mystery"],tokenCount:1800})]})},k={args:{showArrows:!0,showDots:!1,gap:16,scrollCount:2},render:a=>e.jsxs(i,{...a,"aria-label":"Arrows only carousel",children:[e.jsx(t,{name:"Alice",imageUrl:s[0],summary:"A curious young girl.",tags:["Fantasy"],tokenCount:1523}),e.jsx(t,{name:"Hatter",imageUrl:s[1],summary:"Tea party host.",tags:["Comedy"],tokenCount:2100}),e.jsx(t,{name:"Cat",imageUrl:s[2],summary:"Mysterious feline.",tags:["Mystery"],tokenCount:1800}),e.jsx(t,{name:"Queen",imageUrl:s[3],summary:"Ruler of Wonderland.",tags:["Villain"],tokenCount:900})]})},N={args:{showArrows:!0,showDots:!1,gap:32},render:a=>e.jsxs(i,{...a,"aria-label":"Wide gap carousel",children:[e.jsx(g,{title:"Session One",imageUrl:p[0],messageCount:10,characterAvatars:[{name:"Alice",avatarUrl:u[0]}]}),e.jsx(g,{title:"Session Two",imageUrl:p[1],messageCount:25,characterAvatars:[{name:"Bob",avatarUrl:u[1]}]}),e.jsx(g,{title:"Session Three",imageUrl:p[2],messageCount:50,characterAvatars:[{name:"Cat",avatarUrl:u[2]}]})]})},d=["https://picsum.photos/seed/banner1/1200/400","https://picsum.photos/seed/banner2/1200/400","https://picsum.photos/seed/banner3/1200/400","https://picsum.photos/seed/banner4/1200/400"];function m({imageUrl:a,title:w,subtitle:S}){return e.jsxs("div",{className:"relative aspect-[3/1] w-full overflow-hidden rounded-lg",children:[e.jsx("img",{src:a,alt:w,className:"h-full w-full object-cover"}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"}),e.jsxs("div",{className:"absolute bottom-6 left-6 text-white",children:[e.jsx("h3",{className:"text-2xl font-bold",children:w}),e.jsx("p",{className:"mt-1 text-sm text-white/80",children:S})]})]})}const j={args:{showArrows:!0,showDots:!0,variant:"banner"},parameters:{docs:{description:{story:"Full-width banner carousel with minimal arrow styling and dots positioned inside the banner."}}},render:a=>e.jsxs(i,{...a,"aria-label":"Banner carousel",children:[e.jsx(m,{imageUrl:d[0],title:"Welcome to Wonderland",subtitle:"Explore a world of imagination and adventure"}),e.jsx(m,{imageUrl:d[1],title:"New Characters Available",subtitle:"Meet the latest additions to our character gallery"}),e.jsx(m,{imageUrl:d[2],title:"Special Event",subtitle:"Join the Mad Hatter's Tea Party this weekend"}),e.jsx(m,{imageUrl:d[3],title:"Create Your Story",subtitle:"Start your own adventure today"})]})},I={args:{showArrows:!1,showDots:!0,variant:"banner"},parameters:{docs:{description:{story:"Banner carousel with dots only, ideal for touch devices."}}},render:a=>e.jsxs(i,{...a,"aria-label":"Banner carousel with dots only",children:[e.jsx(m,{imageUrl:d[0],title:"Welcome to Wonderland",subtitle:"Explore a world of imagination and adventure"}),e.jsx(m,{imageUrl:d[1],title:"New Characters Available",subtitle:"Meet the latest additions to our character gallery"}),e.jsx(m,{imageUrl:d[2],title:"Special Event",subtitle:"Join the Mad Hatter's Tea Party this weekend"})]})},W={args:{showArrows:!0,showDots:!0,variant:"banner",loop:!0},parameters:{docs:{description:{story:"Banner carousel with loop enabled. At the last slide, clicking next goes back to the first slide."}}},render:a=>e.jsxs(i,{...a,"aria-label":"Looping banner carousel",children:[e.jsx(m,{imageUrl:d[0],title:"Welcome to Wonderland",subtitle:"Explore a world of imagination and adventure"}),e.jsx(m,{imageUrl:d[1],title:"New Characters Available",subtitle:"Meet the latest additions to our character gallery"}),e.jsx(m,{imageUrl:d[2],title:"Special Event",subtitle:"Join the Mad Hatter's Tea Party this weekend"})]})},B={args:{showArrows:!0,showDots:!0,loop:!0},parameters:{docs:{description:{story:"Card carousel with loop enabled. Navigation arrows are always visible."}}},render:a=>e.jsxs(i,{...a,"aria-label":"Looping card carousel",children:[e.jsx(t,{name:"Alice",imageUrl:s[0],summary:"A curious young girl.",tags:["Fantasy"],tokenCount:1523}),e.jsx(t,{name:"Hatter",imageUrl:s[1],summary:"Tea party host.",tags:["Comedy"],tokenCount:2100}),e.jsx(t,{name:"Cat",imageUrl:s[2],summary:"Mysterious feline.",tags:["Mystery"],tokenCount:1800})]})};var q,J,Q;U.parameters={...U.parameters,docs:{...(q=U.parameters)==null?void 0:q.docs,source:{originalSource:`{
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
}`,...(Q=(J=U.parameters)==null?void 0:J.docs)==null?void 0:Q.source}}};var $,Y,Z;M.parameters={...M.parameters,docs:{...($=M.parameters)==null?void 0:$.docs,source:{originalSource:`{
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
}`,...(Z=(Y=M.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};var K,X,ee;T.parameters={...T.parameters,docs:{...(K=T.parameters)==null?void 0:K.docs,source:{originalSource:`{
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
}`,...(ee=(X=T.parameters)==null?void 0:X.docs)==null?void 0:ee.source}}};var ae,re,te;_.parameters={..._.parameters,docs:{...(ae=_.parameters)==null?void 0:ae.docs,source:{originalSource:`{
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
}`,...(te=(re=_.parameters)==null?void 0:re.docs)==null?void 0:te.source}}};var se,oe,ne;k.parameters={...k.parameters,docs:{...(se=k.parameters)==null?void 0:se.docs,source:{originalSource:`{
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
}`,...(ne=(oe=k.parameters)==null?void 0:oe.docs)==null?void 0:ne.source}}};var le,ie,ce;N.parameters={...N.parameters,docs:{...(le=N.parameters)==null?void 0:le.docs,source:{originalSource:`{
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
}`,...(ce=(ie=N.parameters)==null?void 0:ie.docs)==null?void 0:ce.source}}};var ue,de,me;j.parameters={...j.parameters,docs:{...(ue=j.parameters)==null?void 0:ue.docs,source:{originalSource:`{
  args: {
    showArrows: true,
    showDots: true,
    variant: 'banner'
  },
  parameters: {
    docs: {
      description: {
        story: 'Full-width banner carousel with minimal arrow styling and dots positioned inside the banner.'
      }
    }
  },
  render: args => <Carousel {...args} aria-label="Banner carousel">
      <BannerSlide imageUrl={BANNER_IMAGES[0]} title="Welcome to Wonderland" subtitle="Explore a world of imagination and adventure" />
      <BannerSlide imageUrl={BANNER_IMAGES[1]} title="New Characters Available" subtitle="Meet the latest additions to our character gallery" />
      <BannerSlide imageUrl={BANNER_IMAGES[2]} title="Special Event" subtitle="Join the Mad Hatter's Tea Party this weekend" />
      <BannerSlide imageUrl={BANNER_IMAGES[3]} title="Create Your Story" subtitle="Start your own adventure today" />
    </Carousel>
}`,...(me=(de=j.parameters)==null?void 0:de.docs)==null?void 0:me.source}}};var he,ge,pe;I.parameters={...I.parameters,docs:{...(he=I.parameters)==null?void 0:he.docs,source:{originalSource:`{
  args: {
    showArrows: false,
    showDots: true,
    variant: 'banner'
  },
  parameters: {
    docs: {
      description: {
        story: 'Banner carousel with dots only, ideal for touch devices.'
      }
    }
  },
  render: args => <Carousel {...args} aria-label="Banner carousel with dots only">
      <BannerSlide imageUrl={BANNER_IMAGES[0]} title="Welcome to Wonderland" subtitle="Explore a world of imagination and adventure" />
      <BannerSlide imageUrl={BANNER_IMAGES[1]} title="New Characters Available" subtitle="Meet the latest additions to our character gallery" />
      <BannerSlide imageUrl={BANNER_IMAGES[2]} title="Special Event" subtitle="Join the Mad Hatter's Tea Party this weekend" />
    </Carousel>
}`,...(pe=(ge=I.parameters)==null?void 0:ge.docs)==null?void 0:pe.source}}};var Ce,Ae,we;W.parameters={...W.parameters,docs:{...(Ce=W.parameters)==null?void 0:Ce.docs,source:{originalSource:`{
  args: {
    showArrows: true,
    showDots: true,
    variant: 'banner',
    loop: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Banner carousel with loop enabled. At the last slide, clicking next goes back to the first slide.'
      }
    }
  },
  render: args => <Carousel {...args} aria-label="Looping banner carousel">
      <BannerSlide imageUrl={BANNER_IMAGES[0]} title="Welcome to Wonderland" subtitle="Explore a world of imagination and adventure" />
      <BannerSlide imageUrl={BANNER_IMAGES[1]} title="New Characters Available" subtitle="Meet the latest additions to our character gallery" />
      <BannerSlide imageUrl={BANNER_IMAGES[2]} title="Special Event" subtitle="Join the Mad Hatter's Tea Party this weekend" />
    </Carousel>
}`,...(we=(Ae=W.parameters)==null?void 0:Ae.docs)==null?void 0:we.source}}};var ye,be,Se;B.parameters={...B.parameters,docs:{...(ye=B.parameters)==null?void 0:ye.docs,source:{originalSource:`{
  args: {
    showArrows: true,
    showDots: true,
    loop: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Card carousel with loop enabled. Navigation arrows are always visible.'
      }
    }
  },
  render: args => <Carousel {...args} aria-label="Looping card carousel">
      <CharacterCard name="Alice" imageUrl={CHARACTER_IMAGES[0]} summary="A curious young girl." tags={['Fantasy']} tokenCount={1523} />
      <CharacterCard name="Hatter" imageUrl={CHARACTER_IMAGES[1]} summary="Tea party host." tags={['Comedy']} tokenCount={2100} />
      <CharacterCard name="Cat" imageUrl={CHARACTER_IMAGES[2]} summary="Mysterious feline." tags={['Mystery']} tokenCount={1800} />
    </Carousel>
}`,...(Se=(be=B.parameters)==null?void 0:be.docs)==null?void 0:Se.source}}};const Ke=["WithCharacterCards","WithSessionCards","MixedContent","MobileStyle","ArrowsOnly","WideGap","Banner","BannerDotsOnly","BannerLoop","CardsLoop"];export{k as ArrowsOnly,j as Banner,I as BannerDotsOnly,W as BannerLoop,B as CardsLoop,T as MixedContent,_ as MobileStyle,N as WideGap,U as WithCharacterCards,M as WithSessionCards,Ke as __namedExportsOrder,Ze as default};
