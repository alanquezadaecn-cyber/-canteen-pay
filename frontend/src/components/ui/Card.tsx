import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const cardVariants = cva(
  'rounded-md border transition-all duration-200',
  {
    variants: {
      variant: {
        // Default - Glassmorphism
        default: `
          glass shadow-sm
          dark:glass
        `,

        // Elevated - More prominent
        elevated: `
          glass shadow-md hover:shadow-lg
          dark:glass
        `,

        // Interactive - Hover effects
        interactive: `
          glass shadow-sm hover:shadow-lg hover:scale-[1.02] cursor-pointer
          dark:glass
        `,

        // Flat - Minimal shadows
        flat: `
          bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700
          shadow-sm
        `,

        // Neumorphic - Inset shadows
        neumorphic: `
          bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600
          shadow-md shadow-inset
        `,

        // Gradient - With background gradient
        gradient: `
           dark:from-slate-900/80 dark:to-slate-950/80
          border-white/20 dark:border-white/10
          backdrop-blur-xl shadow-sm
        `,
      },

      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },

      hover: {
        true: 'hover:elevation-lg',
        false: '',
      },
    },

    defaultVariants: {
      variant: 'default',
      size: 'md',
      hover: false,
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  animate?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className, variant, size, hover, animate, ...props },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, size, hover }),
        animate && 'animate-fade-in',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  borderBottom?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, borderBottom = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1.5 p-6',
        borderBottom && 'border-b border-slate-200 dark:border-slate-700',
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 'h1' | 'h2' | 'h3' | 'h4';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, level = 'h2', ...props }, ref) => {
    const Component = level;
    return (
      <Component
        ref={ref}
        className={cn(
          'text-xl font-semibold leading-tight tracking-tight',
          'text-slate-900 dark:text-slate-50',
          className
        )}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'text-sm text-slate-600 dark:text-slate-400 mt-1',
        className
      )}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  borderTop?: boolean;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, borderTop = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center p-6 pt-0',
        borderTop && 'border-t border-slate-200 dark:border-slate-700 mt-4 pt-6',
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export {
  Card,
  cardVariants,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
