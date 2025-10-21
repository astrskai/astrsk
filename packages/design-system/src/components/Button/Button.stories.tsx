import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download, Upload, Trash2, Plus } from 'lucide-react';

import { Button } from './Button';

const iconOptions = {
  none: undefined,
  download: <Download size={16} />,
  upload: <Upload size={16} />,
  plus: <Plus size={16} />,
  trash: <Trash2 size={16} />,
};

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline'],
      description: 'Button style variant',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    icon: {
      control: 'select',
      options: Object.keys(iconOptions),
      mapping: iconOptions,
      description: 'Icon to display (example icons for preview)',
    },
    iconPosition: {
      control: 'radio',
      options: ['left', 'right'],
      description: 'Icon position',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button',
    },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  tags: ['!dev'],
  args: {
    variant: 'primary',
    children: 'Button',
  },
};

export const Variants: Story = {
  tags: ['!dev'],
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button variant='primary'>Primary</Button>
      <Button variant='secondary'>Secondary</Button>
      <Button variant='outline'>Outline</Button>
    </div>
  ),
};

export const Sizes: Story = {
  tags: ['!dev'],
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size='small'>Small</Button>
      <Button size='medium'>Medium</Button>
      <Button size='large'>Large</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  tags: ['!dev'],
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button icon={<Download size={16} />}>Download</Button>
      <Button icon={<Upload size={16} />} variant='secondary'>
        Upload
      </Button>
      <Button icon={<Plus size={16} />} variant='outline' iconPosition='right'>
        Add New
      </Button>
    </div>
  ),
};

export const IconOnly: Story = {
  tags: ['!dev'],
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button icon={<Download size={16} />} />
      <Button icon={<Upload size={16} />} variant='secondary' />
      <Button icon={<Plus size={16} />} variant='outline' />
      <Button icon={<Trash2 size={16} />} variant='outline' />
    </div>
  ),
};
