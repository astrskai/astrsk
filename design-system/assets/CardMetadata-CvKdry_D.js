import{j as t}from"./iframe-KbqHUPdU.js";import{c as i}from"./utils-DuMXYCiK.js";function d({children:a,className:r,isDisabled:n=!1,onClick:e}){return t.jsx("article",{className:i("group relative flex h-full flex-col overflow-hidden","rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg","transition-all duration-300",!n&&e&&"cursor-pointer hover:border-zinc-600 hover:shadow-xl",n&&"pointer-events-none opacity-60",r),onClick:n?void 0:e,children:a})}d.__docgenInfo={description:`BaseCard Component (Internal)
Shared card wrapper providing consistent styling across all card types.

Features:
- Consistent border, background, shadow, and hover effects
- \`group\` class for child hover interactions (e.g., CardActionToolbar)
- Disabled state handling
- Click interaction support`,methods:[],displayName:"BaseCard",props:{children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},isDisabled:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};function l({actions:a,className:r}){const n=e=>o=>{o.stopPropagation(),e.disabled||e.onClick(o)};return a.length===0?null:t.jsx("div",{className:i("absolute top-2 right-2 z-20 flex translate-y-0 items-center gap-1 rounded-lg border border-white/10 bg-black/60 p-1 opacity-100 backdrop-blur-md transition-all duration-300 lg:translate-y-[-10px] lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100",r),children:a.map((e,o)=>{const s=e.icon;return t.jsx("button",{onClick:n(e),className:i("rounded p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white",e.disabled&&"cursor-not-allowed opacity-50",e.loading&&"animate-pulse",e.className),title:e.title||e.label,disabled:e.disabled,children:t.jsx(s,{className:"h-4 w-4"})},o)})})}l.__docgenInfo={description:`Card Action Toolbar Component (Internal)
Desktop: Hidden by default, shows on hover
Mobile: Always visible`,methods:[],displayName:"CardActionToolbar",props:{actions:{required:!0,tsType:{name:"Array",elements:[{name:"CardAction"}],raw:"CardAction[]"},description:""},className:{required:!1,tsType:{name:"string"},description:""}}};function c({children:a}){return t.jsx("div",{className:"mt-auto flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-500",children:a})}function p({icon:a,children:r}){return t.jsxs("div",{className:"flex items-center gap-1",children:[a,r]})}c.__docgenInfo={description:`Container for metadata items in card components.
Provides consistent styling for the metadata section.

@example
\`\`\`tsx
<CardMetadataContainer>
  <CardMetadataItem icon={<Clock />}>2 days ago</CardMetadataItem>
  <CardMetadataItem>1500 Tokens</CardMetadataItem>
</CardMetadataContainer>
\`\`\``,methods:[],displayName:"CardMetadataContainer",props:{children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};p.__docgenInfo={description:`Individual metadata item with optional icon.
Use inside CardMetadataContainer for consistent styling.

@example
\`\`\`tsx
<CardMetadataItem icon={<Heart className="size-3" />}>2.5k likes</CardMetadataItem>
<CardMetadataItem>Just now</CardMetadataItem>
\`\`\``,methods:[],displayName:"CardMetadataItem",props:{icon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};export{d as B,l as C,c as a,p as b};
