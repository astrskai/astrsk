# TopNavigation & SortDialog Component Usage

## TopNavigation Transparency Support

The `TopNavigation` component now supports transparency with backdrop blur for overlay scenarios like session pages with backgrounds.

### Transparency Props

- **`transparent`**: Boolean to enable transparency mode
- **`transparencyLevel`**: Number (0-100) for opacity level, defaults to 50
- Automatically adds `backdrop-blur-[20px]` when transparent

### Usage Example

```typescript
<TopNavigation
  title="Session Name"
  transparent={true}
  transparencyLevel={50}
  className="z-20"
  leftAction={<BackButton />}
  rightAction={<SettingsButton />}
/>
```

---

# SortDialog Component Usage

## Overview

The `SortDialog` component provides a reusable sorting interface that matches the look and feel of the `ListEditDialog` component. It displays a list of sort options in a consistent dialog format.

## Basic Usage

```typescript
import { SortDialog } from "@/components-v2/sort-dialog";

// Define your sort options
const sortOptions = [
  { value: "latest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "title-asc", label: "Title (A-Z)" },
  { value: "title-desc", label: "Title (Z-A)" },
];

// Use in your component
<SortDialog
  options={sortOptions}
  onSort={(value) => handleSort(value)}
/>
```

## Props

- **`options`**: Array of sort options with `value` and `label` properties
- **`onSort`**: Callback function called when a sort option is selected
- **`triggerClassName`**: Optional additional CSS classes for the trigger button
- **`contentClassName`**: Optional additional CSS classes for the dialog content

## Features

- **Consistent styling**: Matches the `ListEditDialog` component appearance
- **ArrowUpAZ icon**: Uses the standard sort icon as trigger
- **Auto-close**: Dialog closes automatically when an option is selected
- **Hover effects**: Buttons have hover states for better UX
- **Flexible options**: Supports any number of sort options

## Example with SearchCardsSort

```typescript
import { SearchCardsSort } from "@/modules/card/repos";
import { SortDialog } from "@/components-v2/sort-dialog";

const sortOptions = [
  { value: SearchCardsSort.Latest, label: "Newest First" },
  { value: SearchCardsSort.Oldest, label: "Oldest First" },
  { value: SearchCardsSort.TitleAtoZ, label: "Title (A-Z)" },
  { value: SearchCardsSort.TitleZtoA, label: "Title (Z-A)" },
];

<SortDialog
  options={sortOptions}
  onSort={(value) => handleSortChange(value as SearchCardsSort)}
/>
```

## Integration with TopNavigation

The SortDialog works well alongside other action buttons in the TopNavigation component:

```typescript
<TopNavigation
  title="Cards"
  rightAction={
    <div className="flex items-center gap-2">
      <SortDialog options={sortOptions} onSort={handleSort} />
      <ListEditDialog onAction={handleAction} />
    </div>
  }
/>
```