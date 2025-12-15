# @astrsk/design-system

A modern React component library built with Tailwind CSS v4.

- [Storybook Documentation](https://astrskai.github.io/astrsk/design-system/)
- [GitHub Repository](https://github.com/astrskai/astrsk/tree/develop/packages/design-system)

## Installation

```bash
npm install @astrsk/design-system
# or
pnpm add @astrsk/design-system
```

## Usage

### Import Styles

Import the CSS once in your app's entry point:

```tsx
// main.tsx or App.tsx
import '@astrsk/design-system/styles';
```

### Setup Provider (Optional)

For framework-specific image optimization (Next.js, Remix, etc.), wrap your app with `DesignSystemProvider`:

```tsx
// app/providers.tsx or _app.tsx
import { DesignSystemProvider } from '@astrsk/design-system';
import Image from 'next/image';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DesignSystemProvider
      imageComponent={({ src, alt, className, sizes, loading, onError, fill, priority }) => (
        <Image
          src={src}
          alt={alt}
          className={className}
          sizes={sizes}
          loading={loading}
          onError={onError}
          fill={fill}
          priority={priority}
          style={{ objectFit: 'cover' }}
        />
      )}
    >
      {children}
    </DesignSystemProvider>
  );
}
```

This applies optimized images globally to `CharacterCard`, `SessionCard`, and other image components.

### Use Components

#### Option 1: Barrel Import (Default)

Import all components from the main package (simpler, but larger bundle):

```tsx
import { Button, Input, LabeledInput } from '@astrsk/design-system';

function App() {
  return (
    <div>
      <Button variant="default">Click me</Button>
      <Button variant="secondary" size="lg">Large</Button>

      <Input placeholder="Basic input" />

      <LabeledInput
        label="Email"
        type="email"
        placeholder="Enter email"
        hint="We'll never share your email."
        required
      />
    </div>
  );
}
```

#### Option 2: Subpath Imports (Optimized - Recommended)

Import only the components you need for better tree-shaking (smaller bundle):

```tsx
import { Button } from '@astrsk/design-system/button';
import { Input } from '@astrsk/design-system/input';
import { LabeledInput } from '@astrsk/design-system/labeled-input';

function App() {
  return (
    <div>
      <Button variant="default">Click me</Button>
      <Input placeholder="Basic input" />
      <LabeledInput label="Email" type="email" />
    </div>
  );
}
```

**Available Subpath Imports:**
- `@astrsk/design-system/button`
- `@astrsk/design-system/input`
- `@astrsk/design-system/label`
- `@astrsk/design-system/labeled-input`
- `@astrsk/design-system/textarea`
- `@astrsk/design-system/labeled-textarea`
- `@astrsk/design-system/select`
- `@astrsk/design-system/avatar`
- `@astrsk/design-system/skeleton`
- `@astrsk/design-system/character-card`
- `@astrsk/design-system/session-card`
- `@astrsk/design-system/tab-bar`
- `@astrsk/design-system/accordion`
- `@astrsk/design-system/utils` (utility functions like `cn`)

**Bundle Size Comparison:**
- Barrel import: ~60KB (all components)
- Subpath imports: ~10-15KB per component (only what you use)

## Provider & Image Optimization

The `DesignSystemProvider` allows you to customize how images are rendered across all components.

### ImageComponentProps

```typescript
interface ImageComponentProps {
  src: string;           // Image source URL
  alt: string;           // Alt text for accessibility
  className?: string;    // CSS class names
  sizes?: string;        // Responsive image sizes hint
  loading?: 'lazy' | 'eager';  // Loading strategy
  onError?: () => void;  // Error handler
  fill?: boolean;        // Whether image should fill container
  priority?: boolean;    // Priority loading for LCP optimization
}
```

### Priority Order

Image rendering follows this priority:

1. **`renderImage` prop** - Per-component override
2. **`DesignSystemProvider.imageComponent`** - Global setting
3. **Default `<img>` tag** - Fallback

### Per-Component Override

Override the global setting for specific components:

```tsx
import { CharacterCard } from '@astrsk/design-system';
import Image from 'next/image';

<CharacterCard
  name="Alice"
  imageUrl="/image.jpg"
  tags={['fantasy']}
  priority={true}  // This card loads with priority
  renderImage={({ src, alt, className, sizes, loading, onError, fill, priority }) => (
    <Image
      src={src}
      alt={alt}
      className={className}
      sizes={sizes}
      loading={loading}
      onError={onError}
      fill={fill}
      priority={priority}
      style={{ objectFit: 'cover' }}
    />
  )}
/>
```

### LCP Optimization with Priority

Use the `priority` prop for above-the-fold images to improve Largest Contentful Paint (LCP) scores:

```tsx
// First card in a list - use priority for LCP optimization
{cards.map((card, index) => (
  <CharacterCard
    key={card.id}
    name={card.name}
    imageUrl={card.imageUrl}
    tags={card.tags}
    priority={index === 0}  // Only first card gets priority
  />
))}
```

When `priority={true}` (behavior varies by framework):
- In Next.js, the image may be preloaded via `<link rel="preload">` in the HTML head
- This allows the browser to fetch the image earlier in the loading sequence
- Can significantly improve LCP scores (actual improvement depends on your app and network conditions)

### Without Provider (Default)

Without `DesignSystemProvider`, components use standard `<img>` tags:

```tsx
// Works out of the box - no provider needed
<CharacterCard name="Alice" imageUrl="/image.jpg" tags={['fantasy']} />
<SessionCard title="Adventure" imageUrl="/session.jpg" />
```

### Customizing Internal Element Styles

Use the `classNames` prop to customize styles of internal elements. Classes are **merged** with defaults using `cn()`, so you can add new styles or override existing ones:

```tsx
<CharacterCard
  name="Alice"
  imageUrl="/image.jpg"
  tags={['fantasy']}
  classNames={{
    name: "font-serif text-2xl",     // Override font and size
    summary: "italic",                // Add italic style
    tag: "bg-blue-800",               // Override tag background
    tagsContainer: "gap-4",           // Override gap between tags
  }}
/>

<SessionCard
  title="Adventure"
  classNames={{
    title: "font-serif text-3xl",
    summary: "text-zinc-300",
  }}
/>
```

**Available classNames keys:**

| Component | Keys |
|-----------|------|
| `CharacterCard` | `name`, `summary`, `tag`, `tagsContainer` |
| `SessionCard` | `title`, `summary`, `tag`, `tagsContainer` |

## Components

### Button

```tsx
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="link">Link</Button>

<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

<Button size="icon"><IconComponent /></Button>
```

**Props:** `variant`, `size`, + all HTML button attributes

### Input

```tsx
<Input placeholder="Basic input" />
<Input type="email" />
<Input disabled />
<Input aria-invalid="true" />
```

### IconInput

```tsx
import { Search } from 'lucide-react';

<IconInput icon={<Search />} placeholder="Search..." />
```

**Props:** `icon` (required), + all Input props

### Label

```tsx
<Label htmlFor="email">Email</Label>
<Label required>Required Field</Label>
<Label error>Error Field</Label>
```

### LabeledInput

```tsx
<LabeledInput label="Email" placeholder="Enter email" />
<LabeledInput label="Password" type="password" error="Invalid password" />
<LabeledInput label="Name" hint="Optional" />
<LabeledInput label="Username" labelPosition="left" />
<LabeledInput label="Field" labelPosition="inner" />
```

**Props:** `label`, `hint`, `error`, `labelPosition` ('top' | 'left' | 'inner'), `required`

### Select

```tsx
const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
];

<Select options={options} placeholder="Select an option..." />
<Select options={options} defaultValue="option1" />
<Select options={options} disabled />
<Select options={options} aria-invalid="true" />
```

**Props:** `options` (required), `placeholder`, + all HTML select attributes

### Textarea

```tsx
<Textarea placeholder="Enter message..." />
<Textarea rows={6} />
```

### LabeledTextarea

```tsx
<LabeledTextarea label="Bio" placeholder="Tell us about yourself..." />
<LabeledTextarea label="Notes" hint="Max 500 characters" required />
<LabeledTextarea label="Description" error="Too short" />
```

**Props:** Same as LabeledInput

## Customization

All components use CSS variables for styling, making it easy to customize the look and feel for your project without modifying component source code.

### Override Theme Variables

Simply redefine the CSS variables in your app's global CSS:

```css
:root {
  /* Backgrounds */
  --bg-canvas: #000000;
  --bg-surface: #0a0a0c;

  /* Foreground */
  --fg-default: #ffffff;
  --fg-muted: #e2e2e8;
  --fg-subtle: #9898a4;

  /* Borders */
  --border-default: #232328;
  --border-focus: #5b82ba;

  /* Input */
  --input-bg: #232328;
  --input-border: #3a3a42;

  /* Button */
  --btn-primary-bg: #4a6fa5;
  --btn-primary-fg: #ffffff;
}
```

### Brand Color

Change the primary brand color across all components by overriding the brand palette:

```css
:root {
  /* Your brand colors (e.g., purple theme) */
  --color-brand-700: #6b21a8;
  --color-brand-600: #7c3aed;
  --color-brand-500: #8b5cf6;
  --color-brand-400: #a78bfa;
  --color-brand-300: #c4b5fd;
}
```

This automatically updates buttons, focus rings, accents, and other branded elements.

### Dark/Light Theme Support

```css
/* Dark theme (default) */
:root {
  --bg-canvas: #000000;
  --fg-default: #ffffff;
}

/* Light theme - add .light class to html or body */
.light {
  --bg-canvas: #ffffff;
  --fg-default: #1a1a1a;
}
```

See the full token list in the [Storybook Colors documentation](https://astrskai.github.io/astrsk/design-system/?path=/docs/design-tokens-colors--docs).

## Development

```bash
# Install dependencies
pnpm install

# Run Storybook
pnpm dev

# Build library
pnpm build

# Build Storybook
pnpm build-storybook

# Type check
pnpm lint
```

## License

MIT
