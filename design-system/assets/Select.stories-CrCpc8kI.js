import{r as l,j as e}from"./iframe-B-tfC-8l.js";import{c as b}from"./utils-CF6QUdYH.js";import"./preload-helper-CwRszBsw.js";const r=l.forwardRef(({id:u,options:t,value:n,onChange:s,placeholder:v="Select...",disabled:m=!1,className:I,align:ve="start"},me)=>{const L=l.useId(),E=`select-listbox-${L}`,W=`select-option-${L}`,[i,f]=l.useState(!1),[g,x]=l.useState(-1),N=l.useRef(null),z=l.useRef(null),y=t.find(a=>a.value===n);l.useEffect(()=>{if(!i)return;const a=p=>{N.current&&!N.current.contains(p.target)&&f(!1)};return document.addEventListener("mousedown",a),()=>document.removeEventListener("mousedown",a)},[i]),l.useEffect(()=>{if(i){const a=t.findIndex(p=>p.value===n);x(a>=0?a:0)}},[i,t,n]),l.useEffect(()=>{var a;i&&z.current&&g>=0&&((a=z.current.querySelectorAll('[role="option"]')[g])==null||a.scrollIntoView({block:"nearest"}))},[g,i]);const xe=a=>{var p;if(!m)switch(a.key){case"Enter":case" ":if(a.preventDefault(),i&&g>=0){const o=t[g];o&&!o.disabled&&(s==null||s(o.value),f(!1))}else f(!0);break;case"ArrowDown":a.preventDefault(),i?x(o=>{var h;let d=o+1;for(;d<t.length&&((h=t[d])!=null&&h.disabled);)d++;return d<t.length?d:o}):f(!0);break;case"ArrowUp":a.preventDefault(),i&&x(o=>{var h;let d=o-1;for(;d>=0&&((h=t[d])!=null&&h.disabled);)d--;return d>=0?d:o});break;case"Escape":a.preventDefault(),f(!1);break;case"Tab":f(!1);break;case"Home":if(a.preventDefault(),i){const o=t.findIndex(d=>!d.disabled);o>=0&&x(o)}break;case"End":if(a.preventDefault(),i){for(let o=t.length-1;o>=0;o--)if(!((p=t[o])!=null&&p.disabled)){x(o);break}}break}},he=a=>{a.disabled||(s==null||s(a.value),f(!1))};return e.jsxs("div",{ref:N,className:"relative inline-block",children:[e.jsxs("button",{ref:me,id:u,type:"button",role:"combobox","aria-expanded":i,"aria-haspopup":"listbox","aria-controls":E,disabled:m,onClick:()=>!m&&f(!i),onKeyDown:xe,className:b("flex h-9 w-full min-w-[8rem] items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors","bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--fg-default)]","outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]","disabled:cursor-not-allowed disabled:opacity-50",!m&&"cursor-pointer hover:border-[var(--border-focus)]",I),children:[e.jsx("span",{className:b("truncate",!y&&"text-[var(--fg-subtle)]"),children:(y==null?void 0:y.label)||v}),e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:b("shrink-0 text-[var(--fg-subtle)] transition-transform",i&&"rotate-180"),children:e.jsx("path",{d:"m6 9 6 6 6-6"})})]}),i&&e.jsx("ul",{ref:z,id:E,role:"listbox","aria-activedescendant":g>=0?`${W}-${g}`:void 0,className:b("absolute z-50 mt-1 max-h-60 w-full min-w-[8rem] overflow-auto rounded-lg border p-1","bg-[var(--bg-surface)] border-[var(--border-default)]","shadow-lg","animate-in fade-in-0 zoom-in-95",ve==="end"?"right-0":"left-0"),children:t.map((a,p)=>e.jsxs("li",{id:`${W}-${p}`,role:"option","aria-selected":a.value===n,"aria-disabled":a.disabled,onClick:()=>he(a),onMouseEnter:()=>!a.disabled&&x(p),className:b("relative flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors","text-[var(--fg-default)]",!a.disabled&&"hover:bg-[var(--bg-surface-overlay)]",g===p&&!a.disabled&&"bg-[var(--bg-surface-overlay)]",a.value===n&&"font-medium",a.disabled&&"cursor-not-allowed text-[var(--fg-subtle)] opacity-50"),children:[e.jsx("span",{className:"mr-2 flex h-4 w-4 items-center justify-center",children:a.value===n&&e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M20 6 9 17l-5-5"})})}),a.label]},a.value))})]})});r.displayName="Select";r.__docgenInfo={description:`Select Component

A fully custom select dropdown with keyboard navigation and accessibility.
Built without external dependencies.

@example
\`\`\`tsx
const [value, setValue] = useState('');

<Select
  options={[
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ]}
  value={value}
  onChange={setValue}
  placeholder="Select order..."
/>
\`\`\``,methods:[],displayName:"Select",props:{id:{required:!1,tsType:{name:"string"},description:"ID for the select trigger (for label association)"},options:{required:!0,tsType:{name:"Array",elements:[{name:"SelectOption"}],raw:"SelectOption[]"},description:"Options to display"},value:{required:!1,tsType:{name:"string"},description:"Current value"},onChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(value: string) => void",signature:{arguments:[{type:{name:"string"},name:"value"}],return:{name:"void"}}},description:"Change handler"},placeholder:{required:!1,tsType:{name:"string"},description:"Placeholder when no value selected",defaultValue:{value:"'Select...'",computed:!1}},disabled:{required:!1,tsType:{name:"boolean"},description:"Disabled state",defaultValue:{value:"false",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Additional class name for trigger"},align:{required:!1,tsType:{name:"union",raw:"'start' | 'end'",elements:[{name:"literal",value:"'start'"},{name:"literal",value:"'end'"}]},description:"Alignment of dropdown",defaultValue:{value:"'start'",computed:!1}}}};const c=[{value:"option1",label:"Option 1"},{value:"option2",label:"Option 2"},{value:"option3",label:"Option 3"}],ge=[{value:"us",label:"United States"},{value:"ca",label:"Canada"},{value:"uk",label:"United Kingdom"},{value:"de",label:"Germany"},{value:"fr",label:"France"},{value:"jp",label:"Japan"},{value:"kr",label:"South Korea"}],T=[{value:"newest",label:"Newest First"},{value:"oldest",label:"Oldest First"},{value:"name_asc",label:"Name (A-Z)"},{value:"name_desc",label:"Name (Z-A)"}],we={title:"Form Inputs/Select",component:r,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{placeholder:{control:"text",description:"Placeholder text when no value is selected"},disabled:{control:"boolean",description:"Disable select"},align:{control:"select",options:["start","end"],description:"Dropdown alignment"}},decorators:[u=>e.jsx("div",{style:{minHeight:"300px",padding:"20px"},children:e.jsx(u,{})})]},S={args:{options:c,placeholder:"Select an option..."},render:function(t){const[n,s]=l.useState();return e.jsx(r,{...t,value:n,onChange:s})}},w={args:{options:c},render:function(){const[t,n]=l.useState("option2");return e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px"},children:[e.jsx(r,{options:c,value:t,onChange:n,placeholder:"Select an option..."}),e.jsxs("p",{style:{fontSize:"14px",color:"var(--fg-subtle)"},children:["Selected: ",t||"none"]})]})}},j={args:{options:ge,placeholder:"Select a country..."},render:function(t){const[n,s]=l.useState();return e.jsx(r,{...t,value:n,onChange:s})}},V={args:{options:T},render:function(){const[t,n]=l.useState("newest");return e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[e.jsx("span",{style:{fontSize:"14px",color:"var(--fg-subtle)"},children:"Sort:"}),e.jsx(r,{options:T,value:t,onChange:n,align:"end"})]})}},C={args:{options:c},render:function(){const[t,n]=l.useState();return e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px",width:"300px"},children:[e.jsx(r,{options:c,placeholder:"Disabled (empty)",disabled:!0,value:t,onChange:n}),e.jsx(r,{options:c,value:"option1",onChange:()=>{},disabled:!0})]})}},O={args:{options:[{value:"available1",label:"Available Option 1"},{value:"disabled1",label:"Disabled Option",disabled:!0},{value:"available2",label:"Available Option 2"},{value:"disabled2",label:"Another Disabled",disabled:!0},{value:"available3",label:"Available Option 3"}],placeholder:"Select an option..."},render:function(t){const[n,s]=l.useState();return e.jsx(r,{...t,value:n,onChange:s})}},D={args:{options:c},render:function(){const[t,n]=l.useState(),[s,v]=l.useState();return e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",width:"400px"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"4px"},children:[e.jsx("span",{style:{fontSize:"12px",color:"var(--fg-subtle)"},children:'align="start"'}),e.jsx(r,{options:c,placeholder:"Left aligned",align:"start",value:t,onChange:n})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"4px",alignItems:"flex-end"},children:[e.jsx("span",{style:{fontSize:"12px",color:"var(--fg-subtle)"},children:'align="end"'}),e.jsx(r,{options:c,placeholder:"Right aligned",align:"end",value:s,onChange:v})]})]})}},R={args:{options:c},render:function(){const[t,n]=l.useState(),[s,v]=l.useState();return e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px",width:"300px"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{htmlFor:"country",style:{fontSize:"14px",fontWeight:500,color:"var(--fg-default)"},children:"Country"}),e.jsx(r,{id:"country",options:ge,placeholder:"Select your country",value:t,onChange:n})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{htmlFor:"preference",style:{fontSize:"14px",fontWeight:500,color:"var(--fg-default)"},children:"Preference"}),e.jsx(r,{id:"preference",options:c,placeholder:"Select preference",value:s,onChange:v}),e.jsx("span",{style:{fontSize:"12px",color:"var(--fg-subtle)"},children:"Choose your preferred option."})]})]})}},k={args:{options:Array.from({length:20},(u,t)=>({value:`item${t+1}`,label:`Item ${t+1}`})),placeholder:"Select an item..."},render:function(t){const[n,s]=l.useState();return e.jsx(r,{...t,value:n,onChange:s})}},A={args:{options:c},render:function(){const[t,n]=l.useState(),[s,v]=l.useState(),[m,I]=l.useState();return e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px"},children:[e.jsx(r,{options:c,placeholder:"Small (150px)",className:"w-[150px]",value:t,onChange:n}),e.jsx(r,{options:c,placeholder:"Medium (250px)",className:"w-[250px]",value:s,onChange:v}),e.jsx(r,{options:c,placeholder:"Large (350px)",className:"w-[350px]",value:m,onChange:I})]})}};var $,q,F;S.parameters={...S.parameters,docs:{...($=S.parameters)==null?void 0:$.docs,source:{originalSource:`{
  args: {
    options: sampleOptions,
    placeholder: 'Select an option...'
  },
  render: function Render(args) {
    const [value, setValue] = useState<string>();
    return <Select {...args} value={value} onChange={setValue} />;
  }
}`,...(F=(q=S.parameters)==null?void 0:q.docs)==null?void 0:F.source}}};var P,_,M;w.parameters={...w.parameters,docs:{...(P=w.parameters)==null?void 0:P.docs,source:{originalSource:`{
  args: {
    options: sampleOptions
  },
  render: function Render() {
    const [value, setValue] = useState('option2');
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
        <Select options={sampleOptions} value={value} onChange={setValue} placeholder="Select an option..." />
        <p style={{
        fontSize: '14px',
        color: 'var(--fg-subtle)'
      }}>
          Selected: {value || 'none'}
        </p>
      </div>;
  }
}`,...(M=(_=w.parameters)==null?void 0:_.docs)==null?void 0:M.source}}};var K,B,H;j.parameters={...j.parameters,docs:{...(K=j.parameters)==null?void 0:K.docs,source:{originalSource:`{
  args: {
    options: countryOptions,
    placeholder: 'Select a country...'
  },
  render: function Render(args) {
    const [value, setValue] = useState<string>();
    return <Select {...args} value={value} onChange={setValue} />;
  }
}`,...(H=(B=j.parameters)==null?void 0:B.docs)==null?void 0:H.source}}};var U,Z,G;V.parameters={...V.parameters,docs:{...(U=V.parameters)==null?void 0:U.docs,source:{originalSource:`{
  args: {
    options: sortOptions
  },
  render: function Render() {
    const [value, setValue] = useState('newest');
    return <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
        <span style={{
        fontSize: '14px',
        color: 'var(--fg-subtle)'
      }}>Sort:</span>
        <Select options={sortOptions} value={value} onChange={setValue} align="end" />
      </div>;
  }
}`,...(G=(Z=V.parameters)==null?void 0:Z.docs)==null?void 0:G.source}}};var J,Q,X;C.parameters={...C.parameters,docs:{...(J=C.parameters)==null?void 0:J.docs,source:{originalSource:`{
  args: {
    options: sampleOptions
  },
  render: function Render() {
    const [value, setValue] = useState<string>();
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '300px'
    }}>
        <Select options={sampleOptions} placeholder="Disabled (empty)" disabled value={value} onChange={setValue} />
        <Select options={sampleOptions} value="option1" onChange={() => {}} disabled />
      </div>;
  }
}`,...(X=(Q=C.parameters)==null?void 0:Q.docs)==null?void 0:X.source}}};var Y,ee,te;O.parameters={...O.parameters,docs:{...(Y=O.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  args: {
    options: [{
      value: 'available1',
      label: 'Available Option 1'
    }, {
      value: 'disabled1',
      label: 'Disabled Option',
      disabled: true
    }, {
      value: 'available2',
      label: 'Available Option 2'
    }, {
      value: 'disabled2',
      label: 'Another Disabled',
      disabled: true
    }, {
      value: 'available3',
      label: 'Available Option 3'
    }],
    placeholder: 'Select an option...'
  },
  render: function Render(args) {
    const [value, setValue] = useState<string>();
    return <Select {...args} value={value} onChange={setValue} />;
  }
}`,...(te=(ee=O.parameters)==null?void 0:ee.docs)==null?void 0:te.source}}};var ae,ne,le;D.parameters={...D.parameters,docs:{...(ae=D.parameters)==null?void 0:ae.docs,source:{originalSource:`{
  args: {
    options: sampleOptions
  },
  render: function Render() {
    const [leftValue, setLeftValue] = useState<string>();
    const [rightValue, setRightValue] = useState<string>();
    return <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      width: '400px'
    }}>
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
          <span style={{
          fontSize: '12px',
          color: 'var(--fg-subtle)'
        }}>align="start"</span>
          <Select options={sampleOptions} placeholder="Left aligned" align="start" value={leftValue} onChange={setLeftValue} />
        </div>
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        alignItems: 'flex-end'
      }}>
          <span style={{
          fontSize: '12px',
          color: 'var(--fg-subtle)'
        }}>align="end"</span>
          <Select options={sampleOptions} placeholder="Right aligned" align="end" value={rightValue} onChange={setRightValue} />
        </div>
      </div>;
  }
}`,...(le=(ne=D.parameters)==null?void 0:ne.docs)==null?void 0:le.source}}};var se,re,oe;R.parameters={...R.parameters,docs:{...(se=R.parameters)==null?void 0:se.docs,source:{originalSource:`{
  args: {
    options: sampleOptions
  },
  render: function Render() {
    const [country, setCountry] = useState<string>();
    const [preference, setPreference] = useState<string>();
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      width: '300px'
    }}>
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
          <label htmlFor="country" style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--fg-default)'
        }}>
            Country
          </label>
          <Select id="country" options={countryOptions} placeholder="Select your country" value={country} onChange={setCountry} />
        </div>
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
          <label htmlFor="preference" style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--fg-default)'
        }}>
            Preference
          </label>
          <Select id="preference" options={sampleOptions} placeholder="Select preference" value={preference} onChange={setPreference} />
          <span style={{
          fontSize: '12px',
          color: 'var(--fg-subtle)'
        }}>
            Choose your preferred option.
          </span>
        </div>
      </div>;
  }
}`,...(oe=(re=R.parameters)==null?void 0:re.docs)==null?void 0:oe.source}}};var ie,ce,ue;k.parameters={...k.parameters,docs:{...(ie=k.parameters)==null?void 0:ie.docs,source:{originalSource:`{
  args: {
    options: Array.from({
      length: 20
    }, (_, i) => ({
      value: \`item\${i + 1}\`,
      label: \`Item \${i + 1}\`
    })),
    placeholder: 'Select an item...'
  },
  render: function Render(args) {
    const [value, setValue] = useState<string>();
    return <Select {...args} value={value} onChange={setValue} />;
  }
}`,...(ue=(ce=k.parameters)==null?void 0:ce.docs)==null?void 0:ue.source}}};var de,pe,fe;A.parameters={...A.parameters,docs:{...(de=A.parameters)==null?void 0:de.docs,source:{originalSource:`{
  args: {
    options: sampleOptions
  },
  render: function Render() {
    const [value1, setValue1] = useState<string>();
    const [value2, setValue2] = useState<string>();
    const [value3, setValue3] = useState<string>();
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
        <Select options={sampleOptions} placeholder="Small (150px)" className="w-[150px]" value={value1} onChange={setValue1} />
        <Select options={sampleOptions} placeholder="Medium (250px)" className="w-[250px]" value={value2} onChange={setValue2} />
        <Select options={sampleOptions} placeholder="Large (350px)" className="w-[350px]" value={value3} onChange={setValue3} />
      </div>;
  }
}`,...(fe=(pe=A.parameters)==null?void 0:pe.docs)==null?void 0:fe.source}}};const je=["Default","WithValue","Countries","SortDropdown","Disabled","DisabledOptions","Alignment","WithLabels","ManyOptions","CustomWidth"];export{D as Alignment,j as Countries,A as CustomWidth,S as Default,C as Disabled,O as DisabledOptions,k as ManyOptions,V as SortDropdown,R as WithLabels,w as WithValue,je as __namedExportsOrder,we as default};
