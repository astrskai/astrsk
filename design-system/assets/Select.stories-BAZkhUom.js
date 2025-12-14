import{r as B,j as e}from"./iframe-B7sIs6_0.js";import{c as G}from"./utils-CF6QUdYH.js";import"./preload-helper-CwRszBsw.js";const H=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,o=B.forwardRef(({className:_,options:L,placeholder:u,style:K,defaultValue:f,...x},M)=>{const U=!("value"in x)&&u&&f===void 0?"":f;return e.jsxs("select",{ref:M,"data-slot":"select",defaultValue:U,className:G("flex h-9 w-full appearance-none rounded-lg border px-3 py-2 text-sm transition-colors","bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--fg-default)]","bg-no-repeat pr-10","outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]","disabled:cursor-not-allowed disabled:opacity-50","aria-invalid:border-[var(--color-status-error)] aria-invalid:ring-[var(--color-status-error)]/20",_),style:{backgroundImage:H,backgroundPosition:"right 12px center",backgroundSize:"16px 16px",...K},...x,children:[u&&e.jsx("option",{value:"",disabled:!0,hidden:!0,children:u}),L.map(a=>e.jsx("option",{value:a.value,disabled:a.disabled,children:a.label},a.value))]})});o.displayName="Select";o.__docgenInfo={description:"",methods:[],displayName:"Select",props:{options:{required:!0,tsType:{name:"Array",elements:[{name:"SelectOption"}],raw:"SelectOption[]"},description:"Options to display in the select"},placeholder:{required:!1,tsType:{name:"string"},description:"Placeholder text (shown as first disabled option)"}},composes:["Omit"]};const l=[{value:"option1",label:"Option 1"},{value:"option2",label:"Option 2"},{value:"option3",label:"Option 3"}],T=[{value:"us",label:"United States"},{value:"ca",label:"Canada"},{value:"uk",label:"United Kingdom"},{value:"de",label:"Germany"},{value:"fr",label:"France"},{value:"jp",label:"Japan"},{value:"kr",label:"South Korea"}],Z={title:"Form Inputs/Select",component:o,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{placeholder:{control:"text",description:"Placeholder text shown as first disabled option"},disabled:{control:"boolean",description:"Disable select"}}},t={args:{options:l,placeholder:"Select an option..."}},s={args:{options:l,defaultValue:"option2"}},r={args:{options:T,placeholder:"Select a country..."}},i={args:{options:l},render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px",width:"300px"},children:[e.jsx(o,{options:l,placeholder:"Disabled empty",disabled:!0}),e.jsx(o,{options:l,defaultValue:"option1",disabled:!0})]})},n={args:{options:[{value:"available1",label:"Available Option 1"},{value:"disabled1",label:"Disabled Option",disabled:!0},{value:"available2",label:"Available Option 2"},{value:"disabled2",label:"Another Disabled",disabled:!0}],placeholder:"Select an option..."}},p={args:{options:l},render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px",width:"300px"},children:[e.jsx(o,{options:l,placeholder:"Invalid select","aria-invalid":"true"}),e.jsx(o,{options:l,defaultValue:"option1","aria-invalid":"true"})]})},d={args:{options:l},render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px",width:"300px"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{htmlFor:"country",style:{fontSize:"14px",fontWeight:500,color:"var(--fg-default)"},children:"Country"}),e.jsx(o,{id:"country",options:T,placeholder:"Select your country"})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{htmlFor:"preference",style:{fontSize:"14px",fontWeight:500,color:"var(--fg-default)"},children:"Preference"}),e.jsx(o,{id:"preference",options:l,placeholder:"Select preference"}),e.jsx("span",{style:{fontSize:"12px",color:"var(--fg-subtle)"},children:"Choose your preferred option."})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{htmlFor:"required-field",style:{fontSize:"14px",fontWeight:500,color:"var(--fg-default)"},children:"Required Field"}),e.jsx(o,{id:"required-field",options:l,placeholder:"Select an option","aria-invalid":"true"}),e.jsx("span",{style:{fontSize:"12px",color:"var(--color-status-error)"},children:"This field is required."})]})]})},c={args:{options:l},render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px"},children:[e.jsx(o,{options:l,placeholder:"Small width",style:{width:"150px"}}),e.jsx(o,{options:l,placeholder:"Medium width (default)",style:{width:"300px"}}),e.jsx(o,{options:l,placeholder:"Large width",style:{width:"450px"}}),e.jsx(o,{options:l,placeholder:"Full width",style:{width:"100%"}})]})};var m,h,v;t.parameters={...t.parameters,docs:{...(m=t.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    options: sampleOptions,
    placeholder: 'Select an option...'
  }
}`,...(v=(h=t.parameters)==null?void 0:h.docs)==null?void 0:v.source}}};var b,g,y;s.parameters={...s.parameters,docs:{...(b=s.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    options: sampleOptions,
    defaultValue: 'option2'
  }
}`,...(y=(g=s.parameters)==null?void 0:g.docs)==null?void 0:y.source}}};var S,O,w;r.parameters={...r.parameters,docs:{...(S=r.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    options: countryOptions,
    placeholder: 'Select a country...'
  }
}`,...(w=(O=r.parameters)==null?void 0:O.docs)==null?void 0:w.source}}};var j,D,C;i.parameters={...i.parameters,docs:{...(j=i.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    options: sampleOptions
  },
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '300px'
  }}>
      <Select options={sampleOptions} placeholder="Disabled empty" disabled />
      <Select options={sampleOptions} defaultValue="option1" disabled />
    </div>
}`,...(C=(D=i.parameters)==null?void 0:D.docs)==null?void 0:C.source}}};var F,W,z;n.parameters={...n.parameters,docs:{...(F=n.parameters)==null?void 0:F.docs,source:{originalSource:`{
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
    }],
    placeholder: 'Select an option...'
  }
}`,...(z=(W=n.parameters)==null?void 0:W.docs)==null?void 0:z.source}}};var q,V,k;p.parameters={...p.parameters,docs:{...(q=p.parameters)==null?void 0:q.docs,source:{originalSource:`{
  args: {
    options: sampleOptions
  },
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '300px'
  }}>
      <Select options={sampleOptions} placeholder="Invalid select" aria-invalid="true" />
      <Select options={sampleOptions} defaultValue="option1" aria-invalid="true" />
    </div>
}`,...(k=(V=p.parameters)==null?void 0:V.docs)==null?void 0:k.source}}};var I,A,E;d.parameters={...d.parameters,docs:{...(I=d.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    options: sampleOptions
  },
  render: () => <div style={{
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
        <Select id="country" options={countryOptions} placeholder="Select your country" />
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
        <Select id="preference" options={sampleOptions} placeholder="Select preference" />
        <span style={{
        fontSize: '12px',
        color: 'var(--fg-subtle)'
      }}>
          Choose your preferred option.
        </span>
      </div>
      <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
        <label htmlFor="required-field" style={{
        fontSize: '14px',
        fontWeight: 500,
        color: 'var(--fg-default)'
      }}>
          Required Field
        </label>
        <Select id="required-field" options={sampleOptions} placeholder="Select an option" aria-invalid="true" />
        <span style={{
        fontSize: '12px',
        color: 'var(--color-status-error)'
      }}>
          This field is required.
        </span>
      </div>
    </div>
}`,...(E=(A=d.parameters)==null?void 0:A.docs)==null?void 0:E.source}}};var N,P,R;c.parameters={...c.parameters,docs:{...(N=c.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    options: sampleOptions
  },
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }}>
      <Select options={sampleOptions} placeholder="Small width" style={{
      width: '150px'
    }} />
      <Select options={sampleOptions} placeholder="Medium width (default)" style={{
      width: '300px'
    }} />
      <Select options={sampleOptions} placeholder="Large width" style={{
      width: '450px'
    }} />
      <Select options={sampleOptions} placeholder="Full width" style={{
      width: '100%'
    }} />
    </div>
}`,...(R=(P=c.parameters)==null?void 0:P.docs)==null?void 0:R.source}}};const $=["Default","WithDefaultValue","Countries","Disabled","DisabledOptions","Invalid","WithLabels","Widths"];export{r as Countries,t as Default,i as Disabled,n as DisabledOptions,p as Invalid,c as Widths,s as WithDefaultValue,d as WithLabels,$ as __namedExportsOrder,Z as default};
