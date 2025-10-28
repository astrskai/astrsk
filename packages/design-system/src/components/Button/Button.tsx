import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  className,
  ...props
}: ButtonProps) => {
  const isIconOnly = icon && !children;

  return (
    <button
      type='button'
      className={cn(
        `btn btn-${variant} btn-${size}`,
        isIconOnly && 'btn-icon-only',
        className
      )}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className='btn-icon' aria-hidden={!isIconOnly}>
          {icon}
        </span>
      )}

      {children}

      {icon && iconPosition === 'right' && (
        <span className='btn-icon' aria-hidden={!isIconOnly}>
          {icon}
        </span>
      )}
    </button>
  );
};
