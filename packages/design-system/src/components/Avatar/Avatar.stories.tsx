import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';

const meta = {
  title: 'Display/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Predefined avatar size',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    customSize: {
      control: 'number',
      description: 'Custom size in pixels (overrides size prop)',
    },
    src: {
      control: 'text',
      description: 'Image source URL',
    },
    alt: {
      control: 'text',
      description: 'Alt text (also used for fallback initial)',
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleImage = 'https://i.pravatar.cc/150?img=1';

// Default interactive story
export const Default: Story = {
  args: {
    src: sampleImage,
    alt: 'John Doe',
    size: 'md',
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar src={sampleImage} alt="XS" size="xs" />
      <Avatar src={sampleImage} alt="SM" size="sm" />
      <Avatar src={sampleImage} alt="MD" size="md" />
      <Avatar src={sampleImage} alt="LG" size="lg" />
      <Avatar src={sampleImage} alt="XL" size="xl" />
      <Avatar src={sampleImage} alt="2XL" size="2xl" />
    </div>
  ),
};

// Size labels
export const SizeLabels: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar src={sampleImage} alt="User" size={size} />
          <span style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>
            {size} - {size === 'xs' ? '24px' : size === 'sm' ? '32px' : size === 'md' ? '40px' : size === 'lg' ? '48px' : size === 'xl' ? '64px' : '96px'}
          </span>
        </div>
      ))}
    </div>
  ),
};

// Custom size
export const CustomSize: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar src={sampleImage} alt="User" customSize={36} />
      <Avatar src={sampleImage} alt="User" customSize={56} />
      <Avatar src={sampleImage} alt="User" customSize={80} />
      <Avatar src={sampleImage} alt="User" customSize={120} />
    </div>
  ),
};

// Fallback (no image)
export const Fallback: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar alt="John Doe" size="md" />
      <Avatar alt="Alice" size="md" />
      <Avatar alt="Bob" size="md" />
      <Avatar alt="Charlie" size="lg" />
      <Avatar alt="Diana" size="xl" />
    </div>
  ),
};

// Custom fallback
export const CustomFallback: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar alt="User" size="md" fallback="👤" />
      <Avatar alt="Admin" size="md" fallback="🔒" />
      <Avatar alt="Team" size="lg" fallback={<span style={{ fontSize: '10px' }}>TEAM</span>} />
    </div>
  ),
};

// Default user icon (for logged-out state)
const UserIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ color: 'var(--fg-muted)' }}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const DefaultUserIcon: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p style={{ color: 'var(--fg-muted)', fontSize: '14px', marginBottom: '12px' }}>
          Logged-out state (with user icon fallback):
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Avatar alt="User" size="sm" fallback={<UserIcon className="h-4 w-4" />} />
          <Avatar alt="User" size="md" fallback={<UserIcon className="h-5 w-5" />} />
          <Avatar alt="User" size="lg" fallback={<UserIcon className="h-6 w-6" />} />
          <Avatar alt="User" size="xl" fallback={<UserIcon className="h-8 w-8" />} />
        </div>
      </div>
      <div>
        <p style={{ color: 'var(--fg-muted)', fontSize: '14px', marginBottom: '12px' }}>
          Logged-in state (with image):
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Avatar src="https://i.pravatar.cc/150?img=5" alt="John" size="sm" />
          <Avatar src="https://i.pravatar.cc/150?img=5" alt="John" size="md" />
          <Avatar src="https://i.pravatar.cc/150?img=5" alt="John" size="lg" />
          <Avatar src="https://i.pravatar.cc/150?img=5" alt="John" size="xl" />
        </div>
      </div>
    </div>
  ),
};

// Broken image (shows fallback)
export const BrokenImage: Story = {
  args: {
    src: 'https://invalid-url.com/broken-image.jpg',
    alt: 'Broken',
    size: 'lg',
  },
};

// Group of avatars
export const AvatarGroup: Story = {
  render: () => (
    <div style={{ display: 'flex' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ marginLeft: i === 1 ? 0 : '-12px' }}>
          <Avatar
            src={`https://i.pravatar.cc/150?img=${i}`}
            alt={`User ${i}`}
            size="md"
            style={{ border: '2px solid var(--bg-canvas)' }}
          />
        </div>
      ))}
    </div>
  ),
};

// With different images
export const DifferentImages: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Avatar
          key={i}
          src={`https://i.pravatar.cc/150?img=${i + 10}`}
          alt={`User ${i}`}
          size="lg"
        />
      ))}
    </div>
  ),
};
