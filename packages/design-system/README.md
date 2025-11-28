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

Override CSS variables to customize the theme:

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
  /* ... */
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
