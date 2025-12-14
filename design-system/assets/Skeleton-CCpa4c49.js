import{j as o}from"./iframe-Be38Beyt.js";import{c as s}from"./utils-CF6QUdYH.js";function r({className:t,width:e,height:n,variant:a="default",style:l,...i}){return o.jsx("div",{className:s("animate-pulse bg-zinc-700",a==="default"&&"rounded",a==="circular"&&"rounded-full",a==="rounded"&&"rounded-xl",t),style:{...l,...e!==void 0&&{width:typeof e=="number"?`${e}px`:e},...n!==void 0&&{height:typeof n=="number"?`${n}px`:n}},"aria-hidden":"true",...i})}r.displayName="Skeleton";r.__docgenInfo={description:`Skeleton Component

A placeholder component that shows a pulsing animation while content is loading.

@example
\`\`\`tsx
// Basic usage
<Skeleton className="h-4 w-32" />

// With explicit dimensions
<Skeleton width={200} height={20} />

// Circular avatar placeholder
<Skeleton variant="circular" className="size-10" />

// Rounded card placeholder
<Skeleton variant="rounded" className="h-48 w-full" />
\`\`\``,methods:[],displayName:"Skeleton",props:{width:{required:!1,tsType:{name:"union",raw:"string | number",elements:[{name:"string"},{name:"number"}]},description:"Width of the skeleton"},height:{required:!1,tsType:{name:"union",raw:"string | number",elements:[{name:"string"},{name:"number"}]},description:"Height of the skeleton"},variant:{required:!1,tsType:{name:"union",raw:"'default' | 'circular' | 'rounded'",elements:[{name:"literal",value:"'default'"},{name:"literal",value:"'circular'"},{name:"literal",value:"'rounded'"}]},description:"Border radius variant",defaultValue:{value:"'default'",computed:!1}}}};export{r as S};
