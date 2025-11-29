import type { Meta, StoryObj } from '@storybook/react-vite';
import { Copy, Download, Edit, Trash2 } from 'lucide-react';
import { CharacterCard } from './CharacterCard';

const meta = {
  title: 'Content/CharacterCard',
  component: CharacterCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Character name',
    },
    imageUrl: {
      control: 'text',
      description: 'Character image URL',
    },
    summary: {
      control: 'text',
      description: 'Character summary/description',
    },
    tags: {
      control: 'object',
      description: 'Character tags array',
    },
    tokenCount: {
      control: 'number',
      description: 'Token count for the character',
    },
    updatedAt: {
      control: 'text',
      description: 'Last updated timestamp',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the card is disabled',
    },
    showTypeIndicator: {
      control: 'boolean',
      description: 'Whether to show the CHARACTER badge',
    },
    placeholderImageUrl: {
      control: 'text',
      description: 'Placeholder image URL when imageUrl is not provided',
      table: {
        defaultValue: { summary: 'img/placeholder/character-placeholder.png' },
      },
    },
    onClick: { action: 'clicked' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '280px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CharacterCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample images for demo
const SAMPLE_IMAGE = 'https://picsum.photos/seed/character1/400/600';
const SAMPLE_IMAGE_2 = 'https://picsum.photos/seed/character2/400/600';
const SAMPLE_IMAGE_3 = 'https://picsum.photos/seed/character3/400/600';
// Use import.meta.env.BASE_URL for correct path resolution on GitHub Pages
const SAMPLE_PLACEHOLDER = `${import.meta.env.BASE_URL}img/placeholder/character-placeholder.png`;

// Default interactive story
export const Default: Story = {
  args: {
    name: 'Alice Wonderland',
    imageUrl: SAMPLE_IMAGE,
    summary:
      'A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.',
    tags: ['Fantasy', 'Adventure', 'Classic'],
    tokenCount: 1523,
    updatedAt: '2 days ago',
    placeholderImageUrl: SAMPLE_PLACEHOLDER,
  },
};

// With type indicator badge
export const WithTypeIndicator: Story = {
  args: {
    ...Default.args,
    showTypeIndicator: true,
  },
};

// Without image (shows "No Image" fallback)
export const WithoutImage: Story = {
  args: {
    name: 'Mystery Character',
    summary: 'A mysterious character with no image yet.',
    tags: ['Unknown'],
    tokenCount: 500,
    updatedAt: 'Just now',
  },
};

// With placeholder image
export const WithPlaceholder: Story = {
  args: {
    name: 'Placeholder Character',
    summary: 'A character using a placeholder image.',
    tags: ['New'],
    tokenCount: 0,
    updatedAt: 'Just now',
    placeholderImageUrl: SAMPLE_PLACEHOLDER,
  },
};

// Many tags (overflow handling)
export const ManyTags: Story = {
  args: {
    name: 'Multi-Tagged Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'This character has many different tags to demonstrate overflow.',
    tags: ['Fantasy', 'Romance', 'Drama', 'Action', 'Comedy', 'Slice of Life'],
    tokenCount: 2500,
    updatedAt: '1 week ago',
  },
};

// No tags
export const NoTags: Story = {
  args: {
    name: 'Tagless Character',
    imageUrl: SAMPLE_IMAGE_3,
    summary: 'A character without any tags.',
    tags: [],
    tokenCount: 800,
    updatedAt: '3 hours ago',
  },
};

// Long name
export const LongName: Story = {
  args: {
    name: 'The Exceptionally Long Named Character of the Eastern Kingdoms',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A character with a very long name that should be truncated.',
    tags: ['Epic', 'Fantasy'],
    tokenCount: 3000,
    updatedAt: '1 month ago',
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    ...Default.args,
    isDisabled: true,
  },
};

// With actions
export const WithActions: Story = {
  args: {
    ...Default.args,
    actions: [
      {
        icon: Edit,
        label: 'Edit',
        onClick: () => console.log('Edit clicked'),
        title: 'Edit character',
      },
      {
        icon: Copy,
        label: 'Duplicate',
        onClick: () => console.log('Duplicate clicked'),
        title: 'Duplicate character',
      },
      {
        icon: Download,
        label: 'Export',
        onClick: () => console.log('Export clicked'),
        title: 'Export character',
      },
      {
        icon: Trash2,
        label: 'Delete',
        onClick: () => console.log('Delete clicked'),
        title: 'Delete character',
        className: 'hover:text-red-400',
      },
    ],
  },
};

// Grid layout example
export const GridLayout: Story = {
  args: {
    ...Default.args,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 280px)',
          gap: '24px',
        }}
      >
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <CharacterCard
        name="Alice Wonderland"
        imageUrl={SAMPLE_IMAGE}
        summary="A curious young girl who falls down a rabbit hole into a fantasy world."
        tags={['Fantasy', 'Adventure']}
        tokenCount={1523}
        updatedAt="2 days ago"
      />
      <CharacterCard
        name="Bob the Builder"
        imageUrl={SAMPLE_IMAGE_2}
        summary="Can we fix it? Yes we can! A cheerful constructor who solves problems."
        tags={['Kids', 'Comedy']}
        tokenCount={890}
        updatedAt="1 week ago"
        showTypeIndicator
      />
      <CharacterCard
        name="Charlie Detective"
        imageUrl={SAMPLE_IMAGE_3}
        summary="A sharp-minded detective solving mysteries in the foggy streets of London."
        tags={['Mystery', 'Thriller', 'Drama']}
        tokenCount={2100}
        updatedAt="Just now"
      />
    </>
  ),
};

// All states overview
export const AllStates: Story = {
  args: {
    ...Default.args,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
        }}
      >
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <div>
        <h4
          style={{
            marginBottom: '12px',
            fontSize: '14px',
            color: 'var(--fg-muted)',
          }}
        >
          Default
        </h4>
        <div style={{ width: '280px' }}>
          <CharacterCard
            name="Default Character"
            imageUrl={SAMPLE_IMAGE}
            summary="A standard character card with all typical fields."
            tags={['Tag1', 'Tag2']}
            tokenCount={1000}
            updatedAt="1 day ago"
          />
        </div>
      </div>
      <div>
        <h4
          style={{
            marginBottom: '12px',
            fontSize: '14px',
            color: 'var(--fg-muted)',
          }}
        >
          With Type Indicator
        </h4>
        <div style={{ width: '280px' }}>
          <CharacterCard
            name="Character with Badge"
            imageUrl={SAMPLE_IMAGE_2}
            summary="Shows the CHARACTER type badge."
            tags={['Fantasy']}
            tokenCount={500}
            updatedAt="5 hours ago"
            showTypeIndicator
          />
        </div>
      </div>
      <div>
        <h4
          style={{
            marginBottom: '12px',
            fontSize: '14px',
            color: 'var(--fg-muted)',
          }}
        >
          Disabled
        </h4>
        <div style={{ width: '280px' }}>
          <CharacterCard
            name="Disabled Character"
            imageUrl={SAMPLE_IMAGE_3}
            summary="This card is disabled and cannot be interacted with."
            tags={['Locked']}
            tokenCount={0}
            isDisabled
          />
        </div>
      </div>
    </>
  ),
};
