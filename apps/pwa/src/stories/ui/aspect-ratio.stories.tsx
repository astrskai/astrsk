import type { Meta, StoryObj } from "@storybook/react";
import { AspectRatio } from "@/components-v2/ui/aspect-ratio";

const meta = {
  title: "UI/AspectRatio",
  component: AspectRatio,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ratio: 16 / 9,
  },
  render: (args) => (
    <div className="w-[450px]">
      <AspectRatio {...args}>
        <img
          src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=300&dpr=2&q=80"
          alt="Landscape photograph by Tobias Tullius"
          className="h-full w-full rounded-md object-cover"
        />
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  args: {
    ratio: 1,
  },
  render: (args) => (
    <div className="w-[300px]">
      <AspectRatio {...args}>
        <img
          src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=300&dpr=2&q=80"
          alt="Landscape photograph"
          className="h-full w-full rounded-md object-cover"
        />
      </AspectRatio>
    </div>
  ),
};

export const Portrait: Story = {
  args: {
    ratio: 3 / 4,
  },
  render: (args) => (
    <div className="w-[300px]">
      <AspectRatio {...args}>
        <img
          src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=300&dpr=2&q=80"
          alt="Portrait photograph"
          className="h-full w-full rounded-md object-cover"
        />
      </AspectRatio>
    </div>
  ),
};

export const Video: Story = {
  args: {
    ratio: 16 / 9,
  },
  render: (args) => (
    <div className="w-[600px]">
      <AspectRatio {...args}>
        <iframe
          className="h-full w-full rounded-md"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </AspectRatio>
    </div>
  ),
};

export const CommonRatios: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-[800px]">
      <div className="space-y-2">
        <p className="text-sm font-medium">16:9 (Video)</p>
        <AspectRatio ratio={16 / 9}>
          <div className="h-full w-full rounded-md bg-slate-200 flex items-center justify-center">
            <span className="text-slate-600">16:9</span>
          </div>
        </AspectRatio>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">4:3 (Standard)</p>
        <AspectRatio ratio={4 / 3}>
          <div className="h-full w-full rounded-md bg-slate-200 flex items-center justify-center">
            <span className="text-slate-600">4:3</span>
          </div>
        </AspectRatio>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">1:1 (Square)</p>
        <AspectRatio ratio={1}>
          <div className="h-full w-full rounded-md bg-slate-200 flex items-center justify-center">
            <span className="text-slate-600">1:1</span>
          </div>
        </AspectRatio>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">3:2 (Photo)</p>
        <AspectRatio ratio={3 / 2}>
          <div className="h-full w-full rounded-md bg-slate-200 flex items-center justify-center">
            <span className="text-slate-600">3:2</span>
          </div>
        </AspectRatio>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">21:9 (Ultrawide)</p>
        <AspectRatio ratio={21 / 9}>
          <div className="h-full w-full rounded-md bg-slate-200 flex items-center justify-center">
            <span className="text-slate-600">21:9</span>
          </div>
        </AspectRatio>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">9:16 (Mobile)</p>
        <AspectRatio ratio={9 / 16}>
          <div className="h-full w-full rounded-md bg-slate-200 flex items-center justify-center">
            <span className="text-slate-600">9:16</span>
          </div>
        </AspectRatio>
      </div>
    </div>
  ),
};

export const PlaceholderContent: Story = {
  args: {
    ratio: 16 / 9,
  },
  render: (args) => (
    <div className="w-[450px]">
      <AspectRatio {...args}>
        <div className="h-full w-full rounded-md bg-muted flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-sm text-muted-foreground">Image placeholder</p>
          </div>
        </div>
      </AspectRatio>
    </div>
  ),
};

export const CardWithImage: Story = {
  render: () => (
    <div className="w-[350px] rounded-lg border bg-card">
      <AspectRatio ratio={16 / 9}>
        <img
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          alt="Gray concrete building"
          className="h-full w-full rounded-t-lg object-cover"
        />
      </AspectRatio>
      <div className="p-4">
        <h3 className="font-semibold">Modern Architecture</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Exploring contemporary building designs
        </p>
      </div>
    </div>
  ),
};

export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[600px]">
      {[1, 2, 3, 4].map((i) => (
        <AspectRatio key={i} ratio={1}>
          <img
            src={`https://picsum.photos/300?random=${i}`}
            alt={`Gallery image ${i}`}
            className="h-full w-full rounded-md object-cover"
          />
        </AspectRatio>
      ))}
    </div>
  ),
};

export const WithOverlay: Story = {
  args: {
    ratio: 16 / 9,
  },
  render: (args) => (
    <div className="w-[450px]">
      <AspectRatio {...args}>
        <img
          src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=300&dpr=2&q=80"
          alt="Landscape photograph"
          className="h-full w-full rounded-md object-cover"
        />
        <div className="absolute inset-0 bg-black/40 rounded-md flex items-center justify-center">
          <p className="text-white text-lg font-semibold">Overlay Content</p>
        </div>
      </AspectRatio>
    </div>
  ),
};

export const ResponsiveGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-[900px]">
      {Array.from({ length: 6 }).map((_, i) => (
        <AspectRatio key={i} ratio={4 / 3}>
          <div className="h-full w-full rounded-md bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <span className="text-white font-semibold">Item {i + 1}</span>
          </div>
        </AspectRatio>
      ))}
    </div>
  ),
};