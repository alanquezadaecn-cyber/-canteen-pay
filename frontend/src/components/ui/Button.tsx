import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
  {
    variants: {
      variant: {
        // Primary - Emerald (main CTA)
        primary: `
          bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg
          dark:bg-emerald-500 dark:hover:bg-emerald-600
          focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400
        `,

        // Success - Teal (positive actions)
        success: `
          bg-teal-600 text-white hover:bg-teal-700 hover:shadow-lg
          dark:bg-teal-500 dark:hover:bg-teal-600
          focus-visible:ring-teal-500 dark:focus-visible:ring-teal-400
        `,

        // Cashier - Amber (cashier panel)
        cashier: `
          bg-amber-600 text-white hover:bg-amber-700 hover:shadow-lg
          dark:bg-amber-500 dark:hover:bg-amber-600
          focus-visible:ring-amber-500 dark:focus-visible:ring-amber-400
        `,

        // Admin - Violet (admin panel)
        admin: `
          bg-violet-600 text-white hover:bg-violet-700 hover:shadow-lg
          dark:bg-violet-500 dark:hover:bg-violet-600
          focus-visible:ring-violet-500 dark:focus-visible:ring-violet-400
        `,

        // Secondary - Slate (default alternative)
        secondary: `
          bg-slate-200 text-slate-900 hover:bg-slate-300
          dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600
          focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600
        `,

        // Outline - Border only
        outline: `
          border border-slate-300 text-slate-900 hover:bg-slate-50 hover:border-slate-400
          dark:border-slate-600 dark:text-slate-50 dark:hover:bg-slate-800 dark:hover:border-slate-500
          focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600
        `,

        // Ghost - No background
        ghost: `
          text-slate-700 hover:bg-slate-100
          dark:text-slate-300 dark:hover:bg-slate-800
          focus-visible:ring-slate-300 dark:focus-visible:ring-slate-700
        `,

        // Danger - Red (destructive)
        danger: `
          bg-red-600 text-white hover:bg-red-700 hover:shadow-lg
          dark:bg-red-500 dark:hover:bg-red-600
          focus-visible:ring-red-500 dark:focus-visible:ring-red-400
        `,

        // Link - Text only
        link: `
          text-emerald-600 hover:text-emerald-700 underline
          dark:text-emerald-400 dark:hover:text-emerald-300
          focus-visible:ring-emerald-300 dark:focus-visible:ring-emerald-700
        `,
      },

      size: {
        xs: 'h-8 px-3 text-xs',
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10 p-0',
        iconSm: 'h-8 w-8 p-0',
        iconLg: 'h-12 w-12 p-0',
      },

      fullWidth: {
        true: 'w-full',
        false: '',
      },

      // Loading state
      isLoading: {
        true: 'relative text-transparent',
        false: '',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      isLoading: false,
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  showLoadingSpinner?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading,
      showLoadingSpinner = true,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      className={cn(
        buttonVariants({
          variant,
          size,
          fullWidth,
          isLoading,
          className,
        })
      )}
      disabled={isLoading || disabled}
      ref={ref}
      {...props}
    >
      {isLoading && showLoadingSpinner && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg
            className="h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}
      {children}
    </button>
  )
);

Button.displayName = 'Button';

export { Button, buttonVariants };
