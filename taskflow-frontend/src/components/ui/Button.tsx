// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variantClasses: Record<string, string> = {
  primary:   'bg-ink text-paper hover:bg-ink-soft hover:-translate-y-0.5 hover:shadow-lg',
  secondary: 'bg-ink-soft text-paper hover:bg-ink hover:-translate-y-0.5',
  outline:   'border border-ink/15 text-ink-soft bg-transparent hover:bg-cream',
  danger:    'bg-error text-white hover:opacity-90 hover:-translate-y-0.5',
  amber:     'bg-amber text-white hover:bg-[#d4742a] hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(232,145,58,.35)] hover:shadow-[0_8px_32px_rgba(232,145,58,.4)]',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', isLoading, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          font-syne font-bold rounded-[10px] tracking-tight
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber/50
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Cargando...</span>
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';