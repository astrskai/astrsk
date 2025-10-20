import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      type='button'
      className={cn(`btn btn-${variant} btn-${size}`, className)}
      {...props}
    >
      {children}
    </button>
  );
};
