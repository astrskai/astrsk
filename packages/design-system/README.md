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
