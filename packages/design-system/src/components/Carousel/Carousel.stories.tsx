import type { Meta, StoryObj } from '@storybook/react-vite';
import { Carousel } from './Carousel';
import { CharacterCard } from '../CharacterCard';
import { SessionCard } from '../SessionCard';

const meta = {
  title: 'Content/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `A responsive carousel component for displaying cards. Supports touch/swipe on mobile and arrow navigation on desktop.

## Installation

\`\`\`bash
npm install @astrsk/design-system
\`\`\`

## Usage

\`\`\`tsx
import { Carousel, CharacterCard, SessionCard } from '@astrsk/design-system';

// Basic usage with CharacterCards
function CharacterCarousel() {
  return (
    <Carousel showArrows showDots>
      <CharacterCard
        name="Alice"
        imageUrl="/characters/alice.png"
        summary="A curious adventurer"
        tags={['Fantasy', 'Adventure']}
        tokenCount={1500}
      />
      <CharacterCard
        name="Bob"
        imageUrl="/characters/bob.png"
        summary="A brave knight"
        tags={['Action']}
        tokenCount={2000}
      />
    </Carousel>
  );
}

// With SessionCards
function SessionCarousel() {
  return (
    <Carousel showArrows gap={20}>
      <SessionCard
        title="Adventure in Wonderland"
        imageUrl="/sessions/cover1.png"
        messageCount={42}
        characterAvatars={[
          { name: 'Alice', avatarUrl: '/avatars/alice.png' },
        ]}
      />
      <SessionCard
        title="Tea Party"
        imageUrl="/sessions/cover2.png"
        messageCount={128}
      />
    </Carousel>
  );
}

// Mobile-optimized (no arrows, dots only)
function MobileCarousel() {
  return (
    <Carousel showArrows={false} showDots gap={12}>
      {items.map((item) => (
        <CharacterCard key={item.id} {...item} />
      ))}
    </Carousel>
  );
}
\`\`\`
`,
      },
    },
  },
  argTypes: {
    gap: {
      control: { type: 'number', min: 0, max: 48 },
      description: 'Gap between items in pixels',
    },
    showArrows: {
      control: 'boolean',
      description: 'Whether to show navigation arrows (desktop only)',
    },
    showDots: {
      control: 'boolean',
      description: 'Whether to show dot indicators',
    },
    scrollCount: {
      control: { type: 'number', min: 1, max: 5 },
      description: 'Number of items to scroll at once (desktop)',
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample images
const CHARACTER_IMAGES = [
  'https://picsum.photos/seed/char1/400/600',
  'https://picsum.photos/seed/char2/400/600',
  'https://picsum.photos/seed/char3/400/600',
  'https://picsum.photos/seed/char4/400/600',
  'https://picsum.photos/seed/char5/400/600',
];

const SESSION_COVERS = [
  'https://picsum.photos/seed/session1/800/400',
  'https://picsum.photos/seed/session2/800/400',
  'https://picsum.photos/seed/session3/800/400',
  'https://picsum.photos/seed/session4/800/400',
];

const AVATAR_IMAGES = [
  'https://picsum.photos/seed/avatar1/100/100',
  'https://picsum.photos/seed/avatar2/100/100',
  'https://picsum.photos/seed/avatar3/100/100',
];

// Default with CharacterCards
export const WithCharacterCards: Story = {
  args: {
    showArrows: true,
    showDots: true,
    gap: 16,
    scrollCount: 1,
  },
  render: (args) => (
    <Carousel {...args} aria-label="Character cards carousel">
      <CharacterCard
        name="Alice Wonderland"
        imageUrl={CHARACTER_IMAGES[0]}
        summary="A curious young girl who falls down a rabbit hole into a fantasy world."
        tags={['Fantasy', 'Adventure']}
        tokenCount={1523}
        updatedAt="2 days ago"
      />
      <CharacterCard
        name="Mad Hatter"
        imageUrl={CHARACTER_IMAGES[1]}
        summary="An eccentric character known for his tea parties and riddles."
        tags={['Fantasy', 'Comedy']}
        tokenCount={2100}
        updatedAt="1 week ago"
      />
      <CharacterCard
        name="Cheshire Cat"
        imageUrl={CHARACTER_IMAGES[2]}
        summary="A mysterious cat with a distinctive grin who can appear and disappear at will."
        tags={['Mystery', 'Fantasy']}
        tokenCount={1800}
        updatedAt="3 days ago"
      />
      <CharacterCard
        name="Queen of Hearts"
        imageUrl={CHARACTER_IMAGES[3]}
        summary="The tyrannical ruler of Wonderland known for her temper."
        tags={['Villain', 'Royal']}
        tokenCount={900}
        updatedAt="5 days ago"
      />
      <CharacterCard
        name="White Rabbit"
        imageUrl={CHARACTER_IMAGES[4]}
        summary="A nervous rabbit always worried about being late."
        tags={['Fantasy', 'Guide']}
        tokenCount={750}
        updatedAt="Just now"
      />
    </Carousel>
  ),
};

// With SessionCards
export const WithSessionCards: Story = {
  args: {
    showArrows: true,
    showDots: true,
    gap: 16,
  },
  render: (args) => (
    <Carousel {...args} aria-label="Session cards carousel">
      <SessionCard
        title="Adventure in Wonderland"
        imageUrl={SESSION_COVERS[0]}
        messageCount={42}
        characterAvatars={[
          { name: 'Alice', avatarUrl: AVATAR_IMAGES[0] },
          { name: 'Hatter', avatarUrl: AVATAR_IMAGES[1] },
        ]}
      />
      <SessionCard
        title="Tea Party Chaos"
        imageUrl={SESSION_COVERS[1]}
        messageCount={128}
        characterAvatars={[
          { name: 'Hatter', avatarUrl: AVATAR_IMAGES[1] },
          { name: 'March Hare', avatarUrl: AVATAR_IMAGES[2] },
        ]}
      />
      <SessionCard
        title="Court of the Queen"
        imageUrl={SESSION_COVERS[2]}
        messageCount={256}
        characterAvatars={[
          { name: 'Queen', avatarUrl: AVATAR_IMAGES[0] },
        ]}
      />
      <SessionCard
        title="New Adventure"
        imageUrl={SESSION_COVERS[3]}
        messageCount={0}
        characterAvatars={[]}
      />
    </Carousel>
  ),
};

// Mixed content
export const MixedContent: Story = {
  args: {
    showArrows: true,
    showDots: true,
    gap: 20,
  },
  render: (args) => (
    <Carousel {...args} aria-label="Mixed content carousel">
      <CharacterCard
        name="Alice Wonderland"
        imageUrl={CHARACTER_IMAGES[0]}
        summary="A curious young girl who falls down a rabbit hole."
        tags={['Fantasy']}
        tokenCount={1523}
      />
      <SessionCard
        title="Adventure in Wonderland"
        imageUrl={SESSION_COVERS[0]}
        messageCount={42}
        characterAvatars={[
          { name: 'Alice', avatarUrl: AVATAR_IMAGES[0] },
        ]}
      />
      <CharacterCard
        name="Mad Hatter"
        imageUrl={CHARACTER_IMAGES[1]}
        summary="An eccentric character known for his tea parties."
        tags={['Comedy']}
        tokenCount={2100}
      />
      <SessionCard
        title="Tea Party"
        imageUrl={SESSION_COVERS[1]}
        messageCount={128}
        characterAvatars={[
          { name: 'Hatter', avatarUrl: AVATAR_IMAGES[1] },
        ]}
      />
    </Carousel>
  ),
};

// Without arrows (mobile-style)
export const MobileStyle: Story = {
  args: {
    showArrows: false,
    showDots: true,
    gap: 12,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile-optimized carousel with dots only. Swipe to navigate.',
      },
    },
  },
  render: (args) => (
    <Carousel {...args} aria-label="Mobile carousel">
      <CharacterCard
        name="Alice"
        imageUrl={CHARACTER_IMAGES[0]}
        summary="A curious young girl."
        tags={['Fantasy']}
        tokenCount={1523}
      />
      <CharacterCard
        name="Hatter"
        imageUrl={CHARACTER_IMAGES[1]}
        summary="Tea party host."
        tags={['Comedy']}
        tokenCount={2100}
      />
      <CharacterCard
        name="Cat"
        imageUrl={CHARACTER_IMAGES[2]}
        summary="Mysterious feline."
        tags={['Mystery']}
        tokenCount={1800}
      />
    </Carousel>
  ),
};

// Without dots
export const ArrowsOnly: Story = {
  args: {
    showArrows: true,
    showDots: false,
    gap: 16,
    scrollCount: 2,
  },
  render: (args) => (
    <Carousel {...args} aria-label="Arrows only carousel">
      <CharacterCard
        name="Alice"
        imageUrl={CHARACTER_IMAGES[0]}
        summary="A curious young girl."
        tags={['Fantasy']}
        tokenCount={1523}
      />
      <CharacterCard
        name="Hatter"
        imageUrl={CHARACTER_IMAGES[1]}
        summary="Tea party host."
        tags={['Comedy']}
        tokenCount={2100}
      />
      <CharacterCard
        name="Cat"
        imageUrl={CHARACTER_IMAGES[2]}
        summary="Mysterious feline."
        tags={['Mystery']}
        tokenCount={1800}
      />
      <CharacterCard
        name="Queen"
        imageUrl={CHARACTER_IMAGES[3]}
        summary="Ruler of Wonderland."
        tags={['Villain']}
        tokenCount={900}
      />
    </Carousel>
  ),
};

// Wide gap
export const WideGap: Story = {
  args: {
    showArrows: true,
    showDots: false,
    gap: 32,
  },
  render: (args) => (
    <Carousel {...args} aria-label="Wide gap carousel">
      <SessionCard
        title="Session One"
        imageUrl={SESSION_COVERS[0]}
        messageCount={10}
        characterAvatars={[{ name: 'Alice', avatarUrl: AVATAR_IMAGES[0] }]}
      />
      <SessionCard
        title="Session Two"
        imageUrl={SESSION_COVERS[1]}
        messageCount={25}
        characterAvatars={[{ name: 'Bob', avatarUrl: AVATAR_IMAGES[1] }]}
      />
      <SessionCard
        title="Session Three"
        imageUrl={SESSION_COVERS[2]}
        messageCount={50}
        characterAvatars={[{ name: 'Cat', avatarUrl: AVATAR_IMAGES[2] }]}
      />
    </Carousel>
  ),
};
