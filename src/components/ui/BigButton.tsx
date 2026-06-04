import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface BigButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'sm';
  children: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: '',
  secondary: 'big-btn--secondary',
  danger: 'big-btn--danger',
  ghost: 'big-btn--ghost',
};

export function BigButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: BigButtonProps) {
  const classes = [
    'big-btn',
    variantClass[variant],
    size === 'sm' ? 'big-btn--sm' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
