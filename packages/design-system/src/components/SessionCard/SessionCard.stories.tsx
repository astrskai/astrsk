import type { Meta, StoryObj } from '@storybook/react-vite';
import { Copy, Download, Edit, Trash2, Layers, Clock, Users, Star } from 'lucide-react';
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
    showTypeIndicator: {
      control: 'boolean',
      description: 'Whether to show the SESSION badge',
    },
    areCharactersLoading: {
      control: 'boolean',
      description: 'Whether characters are loading',
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

// Icon components for stories
const TypeIcon = () => <Layers size={16} />;

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
    typeIndicator: <><TypeIcon /> SESSION</>,
  },
};

// With type indicator badge
export const WithTypeIndicator: Story = {
  args: {
    ...Default.args,
    showTypeIndicator: true,
  },
};

// New session (no messages)
export const NewSession: Story = {
  args: {
    title: 'New Adventure',
    imageUrl: SAMPLE_COVER_2,
    messageCount: 0,
    characterAvatars: [{ name: 'Alice', avatarUrl: SAMPLE_AVATAR_1 }],
    typeIndicator: <><TypeIcon /> SESSION</>,
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
        showTypeIndicator
        typeIndicator={<><TypeIcon /> SESSION</>}
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
      <div className="grid grid-cols-3 gap-2 border-b border-zinc-800 pb-2 text-xs text-zinc-500">
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
            showTypeIndicator
            typeIndicator={<><TypeIcon /> SESSION</>}
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
