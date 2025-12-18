import{r as u,j as e}from"./iframe-BJKmoOO-.js";import{c as C}from"./utils-CF6QUdYH.js";import"./preload-helper-CwRszBsw.js";const he={default:"divide-y divide-zinc-800",bordered:"divide-y divide-zinc-800 border border-zinc-800 rounded-lg overflow-hidden",separated:"space-y-2"},xe={default:"",bordered:"",separated:"border border-zinc-800 rounded-lg overflow-hidden"},ve=C("flex w-full items-center justify-between py-4 px-4","text-left font-medium text-zinc-100","transition-colors duration-200","hover:bg-zinc-800/50","focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-inset","disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"),ye=C("px-4 pb-4 text-zinc-400");function be({className:s,isOpen:c}){return e.jsx("svg",{className:C("h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300",c&&"rotate-180",s),viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"6 9 12 15 18 9"})})}function l({items:s,value:c,defaultValue:le=[],onChange:g,multiple:z=!1,collapsible:V=!0,variant:k="default",className:de}){const q=u.useId(),E=u.useRef(null),[ue,me]=u.useState(le),I=c!==void 0,d=I?c:ue,pe=u.useCallback(t=>{let i;if(d.includes(t)){if(!V&&d.length===1)return;i=d.filter(a=>a!==t)}else z?i=[...d,t]:i=[t];I||me(i),g==null||g(i)},[d,z,V,I,g]),ge=u.useCallback((t,i)=>{var p,f;const a=s.map((r,fe)=>({item:r,idx:fe})).filter(({item:r})=>!r.disabled);if(a.length===0)return;const m=a.findIndex(({idx:r})=>r===i);let o;if(t.key==="ArrowDown"){t.preventDefault();const r=(m+1)%a.length;o=a[r].idx}else if(t.key==="ArrowUp"){t.preventDefault();const r=(m-1+a.length)%a.length;o=a[r].idx}else t.key==="Home"?(t.preventDefault(),o=a[0].idx):t.key==="End"&&(t.preventDefault(),o=a[a.length-1].idx);if(o!==void 0){const r=(p=E.current)==null?void 0:p.querySelectorAll("button[aria-expanded]");(f=r==null?void 0:r[o])==null||f.focus()}},[s]);return e.jsx("div",{ref:E,className:C(he[k],de),children:s.map((t,i)=>{const a=d.includes(t.value),m=t.disabled,o=`${q}-trigger-${i}`,p=`${q}-content-${i}`;return e.jsxs("div",{className:xe[k],children:[e.jsx("h3",{children:e.jsxs("button",{type:"button",id:o,onClick:()=>!m&&pe(t.value),onKeyDown:f=>ge(f,i),disabled:m,"aria-expanded":a,"aria-controls":p,className:ve,children:[e.jsx("span",{className:"flex-1",children:t.trigger}),e.jsx(be,{isOpen:a})]})}),a&&e.jsx("div",{id:p,role:"region","aria-labelledby":o,className:ye,children:t.content})]},t.value)})})}l.displayName="Accordion";l.__docgenInfo={description:`Accordion Component

A flexible accordion component for expandable/collapsible content sections.

@example
\`\`\`tsx
// Simple usage
<Accordion
  items={[
    { value: 'item-1', trigger: 'Section 1', content: 'Content 1' },
    { value: 'item-2', trigger: 'Section 2', content: 'Content 2' },
  ]}
/>

// Multiple items can be expanded
<Accordion
  items={items}
  multiple
  defaultValue={['item-1']}
/>

// Controlled mode
<Accordion
  items={items}
  value={expanded}
  onChange={setExpanded}
  multiple
/>

// With custom trigger content
<Accordion
  items={[
    {
      value: 'faq-1',
      trigger: (
        <span className="flex items-center gap-2">
          <HelpIcon className="size-4" />
          How do I get started?
        </span>
      ),
      content: 'Follow these steps...',
    },
  ]}
/>
\`\`\``,methods:[],displayName:"Accordion",props:{items:{required:!0,tsType:{name:"Array",elements:[{name:"AccordionItem"}],raw:"AccordionItem[]"},description:"Array of accordion items"},value:{required:!1,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"Controlled expanded values (for controlled mode)"},defaultValue:{required:!1,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"Default expanded values (for uncontrolled mode)",defaultValue:{value:"[]",computed:!1}},onChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(value: string[]) => void",signature:{arguments:[{type:{name:"Array",elements:[{name:"string"}],raw:"string[]"},name:"value"}],return:{name:"void"}}},description:"Callback when expanded state changes"},multiple:{required:!1,tsType:{name:"boolean"},description:"Whether multiple items can be expanded at once",defaultValue:{value:"false",computed:!1}},collapsible:{required:!1,tsType:{name:"boolean"},description:"Whether all items can be collapsed",defaultValue:{value:"true",computed:!1}},variant:{required:!1,tsType:{name:"union",raw:"'default' | 'bordered' | 'separated'",elements:[{name:"literal",value:"'default'"},{name:"literal",value:"'bordered'"},{name:"literal",value:"'separated'"}]},description:"Visual variant",defaultValue:{value:"'default'",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional CSS classes"}}};const Se={title:"Navigation/Accordion",component:l,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["default","bordered","separated"],description:"Visual style variant"},multiple:{control:"boolean",description:"Whether multiple items can be expanded at once"},collapsible:{control:"boolean",description:"Whether all items can be collapsed"}},decorators:[s=>e.jsx("div",{style:{width:"500px"},children:e.jsx(s,{})})]},n=[{value:"item-1",trigger:"What is astrsk?",content:"astrsk is an AI-powered platform for creating and managing interactive character experiences. You can build custom AI characters with unique personalities and engage in dynamic conversations."},{value:"item-2",trigger:"How do I create a character?",content:`To create a character, navigate to the Characters page and click the "Create" button. You can customize your character's name, personality, background, and other attributes to make them unique.`},{value:"item-3",trigger:"Can I share my characters?",content:"Yes! You can share your characters with other users by making them public. Go to your character's settings and toggle the visibility option to allow others to interact with your creation."},{value:"item-4",trigger:"What payment methods are accepted?",content:"We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and various local payment methods depending on your region."}],h={args:{items:n,defaultValue:["item-1"]}},x={args:{items:n,variant:"bordered",defaultValue:["item-1"]}},v={args:{items:n,variant:"separated",defaultValue:["item-1"]}},y={args:{items:n,multiple:!0,defaultValue:["item-1","item-2"]}},b={args:{items:n,collapsible:!1,defaultValue:["item-1"]}},j={args:{items:[...n.slice(0,2),{value:"disabled-item",trigger:"This item is disabled",content:"You cannot see this content.",disabled:!0},...n.slice(2)],defaultValue:["item-1"]}};function je(){const[s,c]=u.useState(["item-1"]);return e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{type:"button",onClick:()=>c(["item-1","item-2"]),className:"rounded bg-zinc-700 px-3 py-1.5 text-sm text-white hover:bg-zinc-600",children:"Open First Two"}),e.jsx("button",{type:"button",onClick:()=>c([]),className:"rounded bg-zinc-700 px-3 py-1.5 text-sm text-white hover:bg-zinc-600",children:"Close All"})]}),e.jsx(l,{items:n,value:s,onChange:c,multiple:!0}),e.jsxs("p",{className:"text-xs text-zinc-500",children:["Expanded: ",s.length>0?s.join(", "):"none"]})]})}const N={args:{items:n},render:()=>e.jsx(je,{})},w={args:{items:[{value:"getting-started",trigger:e.jsxs("span",{className:"flex items-center gap-3",children:[e.jsx("span",{className:"flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold",children:"1"}),e.jsx("span",{children:"Getting Started"})]}),content:"Welcome to astrsk! Start by exploring the dashboard and creating your first character."},{value:"customize",trigger:e.jsxs("span",{className:"flex items-center gap-3",children:[e.jsx("span",{className:"flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-bold",children:"2"}),e.jsx("span",{children:"Customize Your Experience"})]}),content:"Personalize your settings, choose your preferred theme, and configure notifications."},{value:"advanced",trigger:e.jsxs("span",{className:"flex items-center gap-3",children:[e.jsx("span",{className:"flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold",children:"3"}),e.jsx("span",{children:"Advanced Features"})]}),content:"Explore advanced features like custom prompts, character sharing, and API integrations."}],variant:"separated"}},A={args:{items:n.slice(0,3)},decorators:[s=>e.jsx("div",{className:"flex flex-col gap-8",style:{width:"500px"},children:e.jsx(s,{})})],render:()=>e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("p",{className:"mb-2 text-xs text-zinc-500",children:"Default"}),e.jsx(l,{items:n.slice(0,3),defaultValue:["item-1"],variant:"default"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"mb-2 text-xs text-zinc-500",children:"Bordered"}),e.jsx(l,{items:n.slice(0,3),defaultValue:["item-1"],variant:"bordered"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"mb-2 text-xs text-zinc-500",children:"Separated"}),e.jsx(l,{items:n.slice(0,3),defaultValue:["item-1"],variant:"separated"})]})]})},S={args:{items:[{value:"long-1",trigger:"Terms of Service",content:e.jsxs("div",{className:"space-y-4",children:[e.jsx("p",{children:"By using our service, you agree to be bound by these terms and conditions. Please read them carefully before using the platform."}),e.jsx("h4",{className:"font-medium text-zinc-200",children:"1. Account Registration"}),e.jsx("p",{children:"You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials."}),e.jsx("h4",{className:"font-medium text-zinc-200",children:"2. Acceptable Use"}),e.jsx("p",{children:"You agree not to use the service for any unlawful purpose or in any way that could damage, disable, or impair the service."}),e.jsx("h4",{className:"font-medium text-zinc-200",children:"3. Content Guidelines"}),e.jsx("p",{children:"All content you create or share must comply with our community guidelines. We reserve the right to remove any content that violates these guidelines."})]})},{value:"long-2",trigger:"Privacy Policy",content:e.jsxs("div",{className:"space-y-4",children:[e.jsx("p",{children:"Your privacy is important to us. This policy explains how we collect, use, and protect your personal information."}),e.jsx("h4",{className:"font-medium text-zinc-200",children:"Data Collection"}),e.jsx("p",{children:"We collect information you provide directly, such as account details and content you create. We also collect usage data to improve our services."}),e.jsx("h4",{className:"font-medium text-zinc-200",children:"Data Usage"}),e.jsx("p",{children:"We use your data to provide and improve our services, communicate with you, and ensure the security of our platform."})]})}],variant:"bordered"}};var T,W,D;h.parameters={...h.parameters,docs:{...(T=h.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    items: faqItems,
    defaultValue: ['item-1']
  }
}`,...(D=(W=h.parameters)==null?void 0:W.docs)==null?void 0:D.source}}};var Y,P,R;x.parameters={...x.parameters,docs:{...(Y=x.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  args: {
    items: faqItems,
    variant: 'bordered',
    defaultValue: ['item-1']
  }
}`,...(R=(P=x.parameters)==null?void 0:P.docs)==null?void 0:R.source}}};var _,L,B;v.parameters={...v.parameters,docs:{...(_=v.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    items: faqItems,
    variant: 'separated',
    defaultValue: ['item-1']
  }
}`,...(B=(L=v.parameters)==null?void 0:L.docs)==null?void 0:B.source}}};var G,F,M;y.parameters={...y.parameters,docs:{...(G=y.parameters)==null?void 0:G.docs,source:{originalSource:`{
  args: {
    items: faqItems,
    multiple: true,
    defaultValue: ['item-1', 'item-2']
  }
}`,...(M=(F=y.parameters)==null?void 0:F.docs)==null?void 0:M.source}}};var O,U,H;b.parameters={...b.parameters,docs:{...(O=b.parameters)==null?void 0:O.docs,source:{originalSource:`{
  args: {
    items: faqItems,
    collapsible: false,
    defaultValue: ['item-1']
  }
}`,...(H=(U=b.parameters)==null?void 0:U.docs)==null?void 0:H.source}}};var $,K,J;j.parameters={...j.parameters,docs:{...($=j.parameters)==null?void 0:$.docs,source:{originalSource:`{
  args: {
    items: [...faqItems.slice(0, 2), {
      value: 'disabled-item',
      trigger: 'This item is disabled',
      content: 'You cannot see this content.',
      disabled: true
    }, ...faqItems.slice(2)],
    defaultValue: ['item-1']
  }
}`,...(J=(K=j.parameters)==null?void 0:K.docs)==null?void 0:J.source}}};var Q,X,Z;N.parameters={...N.parameters,docs:{...(Q=N.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  args: {
    items: faqItems
  },
  render: () => <ControlledExample />
}`,...(Z=(X=N.parameters)==null?void 0:X.docs)==null?void 0:Z.source}}};var ee,te,ae;w.parameters={...w.parameters,docs:{...(ee=w.parameters)==null?void 0:ee.docs,source:{originalSource:`{
  args: {
    items: [{
      value: 'getting-started',
      trigger: <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
              1
            </span>
            <span>Getting Started</span>
          </span>,
      content: 'Welcome to astrsk! Start by exploring the dashboard and creating your first character.'
    }, {
      value: 'customize',
      trigger: <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-bold">
              2
            </span>
            <span>Customize Your Experience</span>
          </span>,
      content: 'Personalize your settings, choose your preferred theme, and configure notifications.'
    }, {
      value: 'advanced',
      trigger: <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold">
              3
            </span>
            <span>Advanced Features</span>
          </span>,
      content: 'Explore advanced features like custom prompts, character sharing, and API integrations.'
    }],
    variant: 'separated'
  }
}`,...(ae=(te=w.parameters)==null?void 0:te.docs)==null?void 0:ae.source}}};var se,re,ne;A.parameters={...A.parameters,docs:{...(se=A.parameters)==null?void 0:se.docs,source:{originalSource:`{
  args: {
    items: faqItems.slice(0, 3)
  },
  decorators: [Story => <div className="flex flex-col gap-8" style={{
    width: '500px'
  }}>
        <Story />
      </div>],
  render: () => <>
      <div>
        <p className="mb-2 text-xs text-zinc-500">Default</p>
        <Accordion items={faqItems.slice(0, 3)} defaultValue={['item-1']} variant="default" />
      </div>
      <div>
        <p className="mb-2 text-xs text-zinc-500">Bordered</p>
        <Accordion items={faqItems.slice(0, 3)} defaultValue={['item-1']} variant="bordered" />
      </div>
      <div>
        <p className="mb-2 text-xs text-zinc-500">Separated</p>
        <Accordion items={faqItems.slice(0, 3)} defaultValue={['item-1']} variant="separated" />
      </div>
    </>
}`,...(ne=(re=A.parameters)==null?void 0:re.docs)==null?void 0:ne.source}}};var ie,oe,ce;S.parameters={...S.parameters,docs:{...(ie=S.parameters)==null?void 0:ie.docs,source:{originalSource:`{
  args: {
    items: [{
      value: 'long-1',
      trigger: 'Terms of Service',
      content: <div className="space-y-4">
            <p>
              By using our service, you agree to be bound by these terms and conditions. Please read
              them carefully before using the platform.
            </p>
            <h4 className="font-medium text-zinc-200">1. Account Registration</h4>
            <p>
              You must provide accurate and complete information when creating an account. You are
              responsible for maintaining the security of your account credentials.
            </p>
            <h4 className="font-medium text-zinc-200">2. Acceptable Use</h4>
            <p>
              You agree not to use the service for any unlawful purpose or in any way that could
              damage, disable, or impair the service.
            </p>
            <h4 className="font-medium text-zinc-200">3. Content Guidelines</h4>
            <p>
              All content you create or share must comply with our community guidelines. We reserve
              the right to remove any content that violates these guidelines.
            </p>
          </div>
    }, {
      value: 'long-2',
      trigger: 'Privacy Policy',
      content: <div className="space-y-4">
            <p>
              Your privacy is important to us. This policy explains how we collect, use, and protect
              your personal information.
            </p>
            <h4 className="font-medium text-zinc-200">Data Collection</h4>
            <p>
              We collect information you provide directly, such as account details and content you
              create. We also collect usage data to improve our services.
            </p>
            <h4 className="font-medium text-zinc-200">Data Usage</h4>
            <p>
              We use your data to provide and improve our services, communicate with you, and ensure
              the security of our platform.
            </p>
          </div>
    }],
    variant: 'bordered'
  }
}`,...(ce=(oe=S.parameters)==null?void 0:oe.docs)==null?void 0:ce.source}}};const Ce=["Default","Bordered","Separated","Multiple","NotCollapsible","WithDisabled","Controlled","CustomTrigger","AllVariants","LongContent"];export{A as AllVariants,x as Bordered,N as Controlled,w as CustomTrigger,h as Default,S as LongContent,y as Multiple,b as NotCollapsible,v as Separated,j as WithDisabled,Ce as __namedExportsOrder,Se as default};
