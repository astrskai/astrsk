import type { Meta, StoryObj } from '@storybook/react-vite';
import { Copy, Download, Edit, Trash2, Heart, MessageSquare, Clock, Layers, Lock, User, Play, Plus } from 'lucide-react';
import { CharacterCard, MetadataContainer, MetadataItem } from './CharacterCard';
import { CharacterCardSkeleton } from './CharacterCardSkeleton';

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
    badges: {
      control: 'object',
      description: 'Badges to display on the card',
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

// With badges
export const WithBadges: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'CHARACTER', icon: <Layers size={12} /> },
    ],
  },
};

// With multiple badges
export const WithMultipleBadges: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'CHARACTER', icon: <Layers size={12} /> },
      { label: 'Private', variant: 'private', icon: <Lock size={12} /> },
    ],
  },
};

// With all badge variants
export const WithAllBadgeVariants: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'CHARACTER', icon: <Layers size={12} /> },
      { label: 'Private', variant: 'private', icon: <Lock size={12} /> },
      { label: 'Mine', variant: 'owner', icon: <User size={12} /> },
    ],
  },
};

// With badges on both sides (left and right)
export const WithBadgesLeftAndRight: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'CHARACTER', icon: <Layers size={12} />, position: 'left' },
      { label: 'Private', variant: 'private', icon: <Lock size={12} />, position: 'right' },
    ],
  },
};

// With multiple badges on each side
export const WithMultipleBadgesEachSide: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'CHARACTER', icon: <Layers size={12} />, position: 'left' },
      { label: 'Mine', variant: 'owner', icon: <User size={12} />, position: 'left' },
      { label: 'Private', variant: 'private', icon: <Lock size={12} />, position: 'right' },
    ],
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

// Image load error (shows initial fallback)
export const ImageError: Story = {
  args: {
    name: 'Alice Wonderland',
    imageUrl: 'https://invalid-url-that-will-404.com/image.png',
    summary: 'This character has an invalid image URL, showing the initial fallback.',
    tags: ['Error', 'Fallback'],
    tokenCount: 1000,
    updatedAt: 'Just now',
  },
};

// Many tags (overflow handling)
export const ManyTags: Story = {
  args: {
    name: 'Multi-Tagged Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'Shows +n indicator for overflow. Mobile: 2 tags + "+4", Desktop: 3 tags + "+3".',
    tags: ['Fantasy', 'Romance', 'Drama', 'Action', 'Comedy', 'Slice of Life'],
    tokenCount: 2500,
    updatedAt: '1 week ago',
  },
};

// Responsive tags - Container Query based (card width, not viewport)
export const ResponsiveTags: Story = {
  args: {
    name: 'Responsive Tags Demo',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'Container Query: 2 tags on narrow cards (<240px), 3 tags on wider cards.',
    tags: ['Fantasy', 'Romance', 'Drama', 'Action', 'Comedy'],
    tokenCount: 2500,
    updatedAt: '1 week ago',
  },
};

// Narrow card width test - Container Query in action
export const NarrowCardWidth: Story = {
  args: {
    name: 'Narrow Card (160px)',
    imageUrl: SAMPLE_IMAGE,
    summary: 'Card <240px: shows 2 tags + "+2" badge (Container Query).',
    tags: ['Fantasy', 'Adventure', 'Drama', 'Action'],
    tokenCount: 1000,
    updatedAt: '1 day ago',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '160px' }}>
        <Story />
      </div>
    ),
  ],
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
        badges={[{ label: 'CHARACTER', icon: <Layers size={12} /> }]}
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

// Custom metadata with renderMetadata
export const CustomMetadata: Story = {
  args: {
    name: 'Popular Character',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A character with custom metadata using renderMetadata prop.',
    tags: ['Popular', 'Trending'],
    renderMetadata: () => (
      <MetadataContainer>
        <MetadataItem icon={<Heart className="size-3" />}>2.5k likes</MetadataItem>
        <MetadataItem icon={<MessageSquare className="size-3" />}>128 chats</MetadataItem>
      </MetadataContainer>
    ),
  },
};

// Custom metadata with icons
export const MetadataWithIcons: Story = {
  args: {
    name: 'Active Character',
    imageUrl: SAMPLE_IMAGE_2,
    summary: 'Demonstrating metadata items with icons for better visual clarity.',
    tags: ['Active'],
    renderMetadata: () => (
      <MetadataContainer>
        <MetadataItem icon={<Clock className="size-3" />}>Last active: 2h ago</MetadataItem>
      </MetadataContainer>
    ),
  },
};

// Fully custom metadata layout
export const FullyCustomMetadata: Story = {
  args: {
    name: 'Custom Layout Character',
    imageUrl: SAMPLE_IMAGE_3,
    summary: 'When you need complete control over metadata layout.',
    tags: ['Custom'],
    renderMetadata: () => (
      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
        <div className="text-center">
          <div className="font-semibold text-white">1.2k</div>
          <div>Likes</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-white">89</div>
          <div>Chats</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-white">4.8</div>
          <div>Rating</div>
        </div>
      </div>
    ),
  },
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
            badges={[{ label: 'CHARACTER', icon: <Layers size={12} /> }]}
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

// Skeleton loading state
export const Skeleton: Story = {
  args: {
    ...Default.args,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '280px' }}>
        <Story />
      </div>
    ),
  ],
  render: () => <CharacterCardSkeleton />,
};

// Skeleton in grid layout
export const SkeletonGrid: Story = {
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
      <CharacterCardSkeleton />
      <CharacterCardSkeleton />
      <CharacterCardSkeleton />
    </>
  ),
};

// With like button
export const WithLikeButton: Story = {
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked'),
    },
  },
};

// With like button (liked state)
export const WithLikeButtonLiked: Story = {
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked'),
    },
  },
};

// With popularity stats (likes only)
export const WithLikeCount: Story = {
  args: {
    ...Default.args,
    likeCount: 1234,
  },
};

// With popularity stats (downloads only)
export const WithDownloadCount: Story = {
  args: {
    ...Default.args,
    downloadCount: 5678,
  },
};

// With both popularity stats
export const WithPopularityStats: Story = {
  args: {
    ...Default.args,
    likeCount: 1234,
    downloadCount: 5678,
  },
};

// With like button and popularity stats
export const WithLikeButtonAndStats: Story = {
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked'),
    },
    likeCount: 1234,
    downloadCount: 5678,
  },
};

// With like button liked and popularity stats
export const WithLikeButtonLikedAndStats: Story = {
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked'),
    },
    likeCount: 1235,
    downloadCount: 5678,
  },
};

// With like button and actions
export const WithLikeButtonAndActions: Story = {
  args: {
    ...Default.args,
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked'),
    },
    likeCount: 2500,
    downloadCount: 12000,
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
        icon: Trash2,
        label: 'Delete',
        onClick: () => console.log('Delete clicked'),
        title: 'Delete character',
        className: 'hover:text-red-400',
      },
    ],
  },
};

// High popularity counts (formatted)
export const HighPopularityCounts: Story = {
  args: {
    ...Default.args,
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked'),
    },
    likeCount: 123456,
    downloadCount: 9876543,
  },
};

// Full featured card
export const FullFeatured: Story = {
  args: {
    name: 'Alice Wonderland',
    imageUrl: SAMPLE_IMAGE,
    summary:
      'A curious young girl who falls down a rabbit hole into a fantasy world populated by peculiar creatures.',
    tags: ['Fantasy', 'Adventure', 'Classic'],
    tokenCount: 1523,
    updatedAt: '2 days ago',
    badges: [
      { label: 'CHARACTER', icon: <Layers size={12} /> },
      { label: 'Private', variant: 'private', icon: <Lock size={12} /> },
    ],
    likeButton: {
      isLiked: true,
      onClick: () => console.log('Unlike clicked'),
    },
    likeCount: 2847,
    downloadCount: 15230,
    actions: [
      {
        icon: Edit,
        label: 'Edit',
        onClick: () => console.log('Edit clicked'),
        title: 'Edit character',
      },
      {
        icon: Download,
        label: 'Export',
        onClick: () => console.log('Export clicked'),
        title: 'Export character',
      },
    ],
  },
};

// With footer actions (selection buttons)
export const WithFooterActions: Story = {
  args: {
    ...Default.args,
    footerActions: (
      <>
        <button
          className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 transition-all hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800"
          onClick={() => console.log('Play clicked')}
        >
          <Play size={14} /> PLAY
        </button>
        <button
          className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 transition-all hover:bg-amber-600/10 hover:text-amber-300"
          onClick={() => console.log('Add clicked')}
        >
          <Plus size={14} /> ADD
        </button>
      </>
    ),
  },
};

// With footer actions (selected as player)
export const WithFooterActionsSelectedPlayer: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'PLAYER', variant: 'default', position: 'right' },
    ],
    footerActions: (
      <>
        <button
          className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800"
          disabled
        >
          <Play size={14} /> PLAY
        </button>
        <button
          className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed"
          disabled
        >
          <Plus size={14} /> ADD
        </button>
      </>
    ),
  },
};

// With footer actions (selected as AI)
export const WithFooterActionsSelectedAI: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'AI', variant: 'private', position: 'right' },
    ],
    footerActions: (
      <>
        <button
          className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800"
          disabled
        >
          <Play size={14} /> PLAY
        </button>
        <button
          className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed"
          disabled
        >
          <Plus size={14} /> ADD
        </button>
      </>
    ),
  },
};

// With footer actions - compact mobile style
export const WithFooterActionsCompact: Story = {
  args: {
    name: 'Mobile Character',
    imageUrl: SAMPLE_IMAGE,
    summary: 'A character card with compact footer for mobile view.',
    tags: ['Mobile'],
    tokenCount: 500,
    emptySummaryText: '',
    className: 'min-h-0',
    footerActions: (
      <>
        <button
          className="flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold text-zinc-400 transition-all hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800"
          onClick={() => console.log('Play clicked')}
        >
          <Play size={12} /> PLAY
        </button>
        <button
          className="flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold text-zinc-400 transition-all hover:bg-amber-600/10 hover:text-amber-300"
          onClick={() => console.log('Add clicked')}
        >
          <Plus size={12} /> ADD
        </button>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '160px' }}>
        <Story />
      </div>
    ),
  ],
};

// Grid layout with footer actions
export const GridLayoutWithFooterActions: Story = {
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
        summary="A curious young girl who falls down a rabbit hole."
        tags={['Fantasy', 'Adventure']}
        tokenCount={1523}
        updatedAt="2 days ago"
        footerActions={
          <>
            <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-blue-600/10 hover:text-blue-300 border-r border-zinc-800">
              <Play size={14} /> PLAY
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-400 hover:bg-amber-600/10 hover:text-amber-300">
              <Plus size={14} /> ADD
            </button>
          </>
        }
      />
      <CharacterCard
        name="Bob the Builder"
        imageUrl={SAMPLE_IMAGE_2}
        summary="Can we fix it? Yes we can!"
        tags={['Kids', 'Comedy']}
        tokenCount={890}
        updatedAt="1 week ago"
        badges={[{ label: 'PLAYER', variant: 'default', position: 'right' }]}
        footerActions={
          <>
            <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800" disabled>
              <Play size={14} /> PLAY
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed" disabled>
              <Plus size={14} /> ADD
            </button>
          </>
        }
      />
      <CharacterCard
        name="Charlie Detective"
        imageUrl={SAMPLE_IMAGE_3}
        summary="A sharp-minded detective solving mysteries."
        tags={['Mystery', 'Thriller']}
        tokenCount={2100}
        updatedAt="Just now"
        badges={[{ label: 'AI', variant: 'private', position: 'right' }]}
        footerActions={
          <>
            <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed border-r border-zinc-800" disabled>
              <Play size={14} /> PLAY
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed" disabled>
              <Plus size={14} /> ADD
            </button>
          </>
        }
      />
    </>
  ),
};

// Grid layout with popularity
export const GridLayoutWithPopularity: Story = {
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
        name="Popular Character"
        imageUrl={SAMPLE_IMAGE}
        summary="A highly popular character loved by many users."
        tags={['Popular', 'Trending']}
        tokenCount={1523}
        updatedAt="2 days ago"
        likeButton={{
          isLiked: true,
          onClick: () => console.log('Unlike clicked'),
        }}
        likeCount={12500}
        downloadCount={45000}
      />
      <CharacterCard
        name="New Character"
        imageUrl={SAMPLE_IMAGE_2}
        summary="A fresh new character just added to the platform."
        tags={['New', 'Fresh']}
        tokenCount={890}
        updatedAt="1 hour ago"
        likeButton={{
          isLiked: false,
          onClick: () => console.log('Like clicked'),
        }}
        likeCount={42}
        downloadCount={128}
      />
      <CharacterCard
        name="Classic Character"
        imageUrl={SAMPLE_IMAGE_3}
        summary="A timeless classic that has stood the test of time."
        tags={['Classic', 'Evergreen']}
        tokenCount={2100}
        updatedAt="1 year ago"
        likeButton={{
          isLiked: false,
          onClick: () => console.log('Like clicked'),
        }}
        likeCount={98765}
        downloadCount={543210}
      />
    </>
  ),
};

// Demonstrates that right badges are hidden when likeButton is present
export const LikeButtonHidesRightBadge: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'CHARACTER', icon: <Layers size={12} />, position: 'left' },
      { label: 'Private', variant: 'private', icon: <Lock size={12} />, position: 'right' },
    ],
    likeButton: {
      isLiked: false,
      onClick: () => console.log('Like clicked'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'When `likeButton` is provided, right-positioned badges are automatically hidden to prevent visual overlap. Use left-positioned badges instead when using likeButton.',
      },
    },
  },
};
