import * as React from 'react';
import { cn } from '../../lib/utils';
import { inputBaseStyles } from './input-styles';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        data-slot='input'
        className={cn(inputBaseStyles, 'px-3', className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
