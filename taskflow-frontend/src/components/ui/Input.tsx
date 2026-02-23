// src/components/ui/Input.tsx
import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium mb-1.5 tracking-wide"
            style={{ color: 'var(--ink-soft)', letterSpacing: '.01em' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-3 rounded-[10px] border-[1.5px]
            font-dm text-sm
            transition-all duration-200 outline-none
            placeholder:text-ink-muted/40
            ${error
              ? 'border-error focus:border-error focus:ring-4 focus:ring-[rgba(231,76,60,.1)]'
              : 'border-ink/12 focus:border-amber focus:ring-4 focus:ring-[rgba(232,145,58,.1)]'
            }
            ${className}
          `}
          style={{ background: 'var(--surface)', color: 'var(--ink)' }}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs" style={{ color: 'var(--error)' }}>{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';