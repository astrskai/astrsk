# @astrsk/design-system

astrsk Design System - A modern React component library built with Tailwind CSS v4.

## Installation

```bash
npm install @astrsk/design-system
# or
pnpm add @astrsk/design-system
# or
yarn add @astrsk/design-system
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
import { Button } from '@astrsk/design-system';

function App() {
  return (
    <div>
      <Button variant="primary" size="medium">
        Click me
      </Button>
      <Button variant="secondary" size="large">
        Secondary
      </Button>
    </div>
  );
}
```

## Components

### Button

A versatile button component with multiple variants and sizes.

**Props:**

- `variant`: `'primary'` | `'secondary'` | `'outline'` (default: `'primary'`)
- `size`: `'small'` | `'medium'` | `'large'` (default: `'medium'`)
- All standard HTML button attributes

**Examples:**

```tsx
<Button variant="primary">Primary Button</Button>
<Button variant="secondary" size="large">Large Secondary</Button>
<Button variant="outline" disabled>Disabled Outline</Button>
```

## CSS Classes (Optional)

You can also use CSS classes directly without React components:

```html
<button class="btn btn-primary btn-medium">Click me</button>
```

## Customization

Override theme variables by defining them in your CSS:

```css
:root {
  --color-btn-background-primary: #your-color;
  --color-btn-background-primary-hover: #your-hover-color;
  --color-btn-text-primary: #your-text-color;
}
```

## Development

```bash
# Install dependencies
pnpm install

# Run Storybook
pnpm dev

# Build
pnpm build

# Test
pnpm test
```

## License

MIT
