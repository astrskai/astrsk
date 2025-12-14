import type { Meta, StoryObj } from '@storybook/react-vite';
import { Copy, Download, Edit, Trash2, Layers, Clock, Users, Star, Lock, User } from 'lucide-react';
import { SessionCard, MetadataContainer, MetadataItem } from './SessionCard';
import { SessionCardSkeleton } from './SessionCardSkeleton';

const meta = {
  title: 'Content/SessionCard',
  component: SessionCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Session title',
    },
    imageUrl: {
      control: 'text',
      description: 'Cover image URL',
    },
    messageCount: {
      control: 'number',
      description: 'Number of messages in the session (optional - if undefined, message count section is hidden)',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the card is disabled',
    },
    badges: {
      control: 'object',
      description: 'Badges to display on the card',
    },
    areCharactersLoading: {
      control: 'boolean',
      description: 'Whether characters are loading',
    },
    tags: {
      control: 'object',
      description: 'Tags to display on the card',
    },
    summary: {
      control: 'text',
      description: 'Session summary/description',
    },
    onClick: { action: 'clicked' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SessionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample images
const SAMPLE_COVER = 'https://picsum.photos/seed/session1/600/400';
const SAMPLE_COVER_2 = 'https://picsum.photos/seed/session2/600/400';
const SAMPLE_AVATAR_1 = 'https://picsum.photos/seed/avatar1/100/100';
const SAMPLE_AVATAR_2 = 'https://picsum.photos/seed/avatar2/100/100';
const SAMPLE_AVATAR_3 = 'https://picsum.photos/seed/avatar3/100/100';
const SAMPLE_AVATAR_4 = 'https://picsum.photos/seed/avatar4/100/100';

// Default interactive story
export const Default: Story = {
  args: {
    title: 'Adventure in Wonderland',
    imageUrl: SAMPLE_COVER,
    messageCount: 42,
    characterAvatars: [
      { name: 'Alice', avatarUrl: SAMPLE_AVATAR_1 },
      { name: 'Bob', avatarUrl: SAMPLE_AVATAR_2 },
    ],
  },
};

// With badges (new approach)
export const WithBadges: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'SESSION', icon: <Layers size={12} /> },
    ],
  },
};

// With multiple badges
export const WithMultipleBadges: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'SESSION', icon: <Layers size={12} /> },
      { label: 'Private', variant: 'private', icon: <Lock size={12} /> },
    ],
  },
};

// With all badge variants
export const WithAllBadgeVariants: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'SESSION', icon: <Layers size={12} /> },
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
      { label: 'SESSION', icon: <Layers size={12} />, position: 'left' },
      { label: 'Private', variant: 'private', icon: <Lock size={12} />, position: 'right' },
    ],
  },
};

// With multiple badges on each side
export const WithMultipleBadgesEachSide: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'SESSION', icon: <Layers size={12} />, position: 'left' },
      { label: 'Mine', variant: 'owner', icon: <User size={12} />, position: 'left' },
      { label: 'Private', variant: 'private', icon: <Lock size={12} />, position: 'right' },
    ],
  },
};

// Stress test: Many badges on left side (3+)
export const ManyBadgesLeft: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'SESSION', icon: <Layers size={12} />, position: 'left' },
      { label: 'Mine', variant: 'owner', icon: <User size={12} />, position: 'left' },
      { label: 'Private', variant: 'private', icon: <Lock size={12} />, position: 'left' },
      { label: 'Featured', icon: <Star size={12} />, position: 'left' },
    ],
  },
};

// Stress test: Many badges on right side (3+)
export const ManyBadgesRight: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'SESSION', icon: <Layers size={12} />, position: 'left' },
      { label: 'Private', variant: 'private', icon: <Lock size={12} />, position: 'right' },
      { label: 'Mine', variant: 'owner', icon: <User size={12} />, position: 'right' },
      { label: 'Featured', icon: <Star size={12} />, position: 'right' },
    ],
  },
};

// Stress test: Many badges on both sides
export const ManyBadgesBothSides: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'SESSION', icon: <Layers size={12} />, position: 'left' },
      { label: 'Mine', variant: 'owner', icon: <User size={12} />, position: 'left' },
      { label: 'Featured', icon: <Star size={12} />, position: 'left' },
      { label: 'Private', variant: 'private', icon: <Lock size={12} />, position: 'right' },
      { label: 'VIP', icon: <User size={12} />, position: 'right' },
      { label: 'New', position: 'right' },
    ],
  },
};

// Stress test: Long badge labels (truncation)
export const LongBadgeLabels: Story = {
  args: {
    ...Default.args,
    badges: [
      { label: 'Very Long Session Label', icon: <Layers size={12} />, position: 'left' },
      { label: 'Extended Private Mode', variant: 'private', icon: <Lock size={12} />, position: 'right' },
    ],
  },
};

// New session (no messages)
export const NewSession: Story = {
  args: {
    title: 'New Adventure',
    imageUrl: SAMPLE_COVER_2,
    messageCount: 0,
    characterAvatars: [{ name: 'Alice', avatarUrl: SAMPLE_AVATAR_1 }],
  },
};

// Single message
export const SingleMessage: Story = {
  args: {
    ...Default.args,
    title: 'Just Started',
    messageCount: 1,
  },
};

// Without cover image (placeholder pattern)
export const WithoutImage: Story = {
  args: {
    title: 'Mystery Session',
    messageCount: 15,
    characterAvatars: [
      { name: 'Unknown', avatarUrl: undefined },
    ],
  },
};

// Image load error (shows initial fallback)
export const ImageError: Story = {
  args: {
    title: 'Adventure Session',
    imageUrl: 'https://invalid-url-that-will-404.com/image.png',
    messageCount: 42,
    characterAvatars: [
      { name: 'Alice', avatarUrl: 'https://invalid-url-that-will-404.com/avatar.png' },
      { name: 'Bob', avatarUrl: SAMPLE_AVATAR_2 },
    ],
  },
};

// Without message count (hidden)
export const WithoutMessageCount: Story = {
  args: {
    title: 'Session without Message Count',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [
      { name: 'Alice', avatarUrl: SAMPLE_AVATAR_1 },
    ],
  },
};

// Many character avatars
export const ManyAvatars: Story = {
  args: {
    ...Default.args,
    title: 'Group Session',
    characterAvatars: [
      { name: 'Alice', avatarUrl: SAMPLE_AVATAR_1 },
      { name: 'Bob', avatarUrl: SAMPLE_AVATAR_2 },
      { name: 'Charlie', avatarUrl: SAMPLE_AVATAR_3 },
      { name: 'Diana', avatarUrl: SAMPLE_AVATAR_4 },
      { name: 'Eve' },
    ],
  },
};

// Loading avatars
export const LoadingAvatars: Story = {
  args: {
    ...Default.args,
    title: 'Loading Characters...',
    areCharactersLoading: true,
    characterAvatars: [],
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    ...Default.args,
    isDisabled: true,
  },
};

// Long title
export const LongTitle: Story = {
  args: {
    ...Default.args,
    title: 'The Exceptionally Long Session Title That Should Be Truncated After Two Lines',
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
        title: 'Edit session',
      },
      {
        icon: Copy,
        label: 'Duplicate',
        onClick: () => console.log('Duplicate clicked'),
        title: 'Duplicate session',
      },
      {
        icon: Download,
        label: 'Export',
        onClick: () => console.log('Export clicked'),
        title: 'Export session',
      },
      {
        icon: Trash2,
        label: 'Delete',
        onClick: () => console.log('Delete clicked'),
        title: 'Delete session',
        className: 'hover:text-red-400',
      },
    ],
  },
};

// High message count
export const HighMessageCount: Story = {
  args: {
    ...Default.args,
    title: 'Epic Campaign',
    messageCount: 12345,
  },
};

// With tags
export const WithTags: Story = {
  args: {
    ...Default.args,
    title: 'Fantasy Adventure',
    tags: ['Fantasy', 'Adventure', 'RPG'],
  },
};

// With many tags (overflow)
export const WithManyTags: Story = {
  args: {
    ...Default.args,
    title: 'Multi-Genre Session',
    tags: ['Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Romance'],
  },
};

// With single tag
export const WithSingleTag: Story = {
  args: {
    ...Default.args,
    title: 'Quick Session',
    tags: ['Casual'],
  },
};

// With summary
export const WithSummary: Story = {
  args: {
    ...Default.args,
    title: 'Epic Quest',
    summary:
      'An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom from ancient evil.',
  },
};

// With tags and summary
export const WithTagsAndSummary: Story = {
  args: {
    ...Default.args,
    title: 'Mystery Manor',
    tags: ['Mystery', 'Horror', 'Detective'],
    summary:
      'Investigate the haunted manor and uncover dark secrets hidden within its walls.',
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
          gridTemplateColumns: 'repeat(3, 320px)',
          gap: '24px',
        }}
      >
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <SessionCard
        title="Adventure in Wonderland"
        imageUrl={SAMPLE_COVER}
        messageCount={42}
        characterAvatars={[
          { name: 'Alice', avatarUrl: SAMPLE_AVATAR_1 },
          { name: 'Bob', avatarUrl: SAMPLE_AVATAR_2 },
        ]}
      />
      <SessionCard
        title="Mystery Investigation"
        imageUrl={SAMPLE_COVER_2}
        messageCount={128}
        badges={[{ label: 'SESSION', icon: <Layers size={12} /> }]}
        characterAvatars={[
          { name: 'Detective', avatarUrl: SAMPLE_AVATAR_3 },
        ]}
      />
      <SessionCard
        title="New Session"
        messageCount={0}
        characterAvatars={[]}
      />
    </>
  ),
};

// Custom metadata with renderMetadata
export const CustomMetadata: Story = {
  args: {
    title: 'Session with Custom Metadata',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [
      { name: 'Alice', avatarUrl: SAMPLE_AVATAR_1 },
      { name: 'Bob', avatarUrl: SAMPLE_AVATAR_2 },
    ],
    renderMetadata: () => (
      <MetadataContainer>
        <MetadataItem icon={<Clock className="size-3" />}>2 days ago</MetadataItem>
        <MetadataItem icon={<Users className="size-3" />}>3 participants</MetadataItem>
      </MetadataContainer>
    ),
  },
};

// Custom metadata with icons
export const MetadataWithIcons: Story = {
  args: {
    title: 'Popular Session',
    imageUrl: SAMPLE_COVER_2,
    characterAvatars: [
      { name: 'Alice', avatarUrl: SAMPLE_AVATAR_1 },
    ],
    renderMetadata: () => (
      <MetadataContainer>
        <MetadataItem icon={<Star className="size-3" />}>4.8 rating</MetadataItem>
        <MetadataItem icon={<Clock className="size-3" />}>Last played: 1h ago</MetadataItem>
      </MetadataContainer>
    ),
  },
};

// Fully custom metadata layout
export const FullyCustomMetadata: Story = {
  args: {
    title: 'Session with Stats',
    imageUrl: SAMPLE_COVER,
    characterAvatars: [
      { name: 'Alice', avatarUrl: SAMPLE_AVATAR_1 },
      { name: 'Bob', avatarUrl: SAMPLE_AVATAR_2 },
      { name: 'Charlie', avatarUrl: SAMPLE_AVATAR_3 },
    ],
    renderMetadata: () => (
      <div className="grid grid-cols-3 gap-2 text-xs text-zinc-500">
        <div className="text-center">
          <div className="font-semibold text-white">156</div>
          <div>Messages</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-white">3</div>
          <div>Characters</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-white">2h</div>
          <div>Duration</div>
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
        <div style={{ width: '320px' }}>
          <SessionCard
            title="Default Session"
            imageUrl={SAMPLE_COVER}
            messageCount={10}
            characterAvatars={[{ name: 'Alice', avatarUrl: SAMPLE_AVATAR_1 }]}
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
        <div style={{ width: '320px' }}>
          <SessionCard
            title="Session with Badge"
            imageUrl={SAMPLE_COVER_2}
            messageCount={25}
            badges={[{ label: 'SESSION', icon: <Layers size={12} /> }]}
            characterAvatars={[{ name: 'Bob', avatarUrl: SAMPLE_AVATAR_2 }]}
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
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
  render: () => <SessionCardSkeleton />,
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
          gridTemplateColumns: 'repeat(3, 320px)',
          gap: '24px',
        }}
      >
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <SessionCardSkeleton />
      <SessionCardSkeleton />
      <SessionCardSkeleton />
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
        title: 'Edit session',
      },
      {
        icon: Copy,
        label: 'Duplicate',
        onClick: () => console.log('Duplicate clicked'),
        title: 'Duplicate session',
      },
      {
        icon: Trash2,
        label: 'Delete',
        onClick: () => console.log('Delete clicked'),
        title: 'Delete session',
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
    title: 'Epic Adventure Campaign',
    imageUrl: SAMPLE_COVER,
    messageCount: 1523,
    tags: ['Fantasy', 'Adventure', 'Epic'],
    summary:
      'An immersive fantasy adventure where heroes embark on a dangerous journey to save the kingdom.',
    badges: [
      { label: 'SESSION', icon: <Layers size={12} /> },
      { label: 'Private', variant: 'private', icon: <Lock size={12} />, position: 'right' },
    ],
    characterAvatars: [
      { name: 'Alice', avatarUrl: SAMPLE_AVATAR_1 },
      { name: 'Bob', avatarUrl: SAMPLE_AVATAR_2 },
      { name: 'Charlie', avatarUrl: SAMPLE_AVATAR_3 },
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
        title: 'Edit session',
      },
      {
        icon: Download,
        label: 'Export',
        onClick: () => console.log('Export clicked'),
        title: 'Export session',
      },
    ],
  },
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
          gridTemplateColumns: 'repeat(3, 320px)',
          gap: '24px',
        }}
      >
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <SessionCard
        title="Popular Campaign"
        imageUrl={SAMPLE_COVER}
        messageCount={1523}
        tags={['Popular', 'Trending']}
        summary="A highly popular session loved by many users."
        characterAvatars={[
          { name: 'Alice', avatarUrl: SAMPLE_AVATAR_1 },
          { name: 'Bob', avatarUrl: SAMPLE_AVATAR_2 },
        ]}
        likeButton={{
          isLiked: true,
          onClick: () => console.log('Unlike clicked'),
        }}
        likeCount={12500}
        downloadCount={45000}
      />
      <SessionCard
        title="New Adventure"
        imageUrl={SAMPLE_COVER_2}
        messageCount={42}
        tags={['New', 'Fresh']}
        summary="A fresh new session just started."
        characterAvatars={[
          { name: 'Charlie', avatarUrl: SAMPLE_AVATAR_3 },
        ]}
        likeButton={{
          isLiked: false,
          onClick: () => console.log('Like clicked'),
        }}
        likeCount={42}
        downloadCount={128}
      />
      <SessionCard
        title="Classic Journey"
        messageCount={9999}
        tags={['Classic', 'Evergreen']}
        summary="A timeless classic that has stood the test of time."
        characterAvatars={[
          { name: 'Diana', avatarUrl: SAMPLE_AVATAR_4 },
          { name: 'Eve' },
        ]}
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
      { label: 'SESSION', icon: <Layers size={12} />, position: 'left' },
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
