'use client';
import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  iconPosition?: 'top' | 'left' | 'right' | 'bottom';
  className?: string;
  ariaLabel?: string;
}

// Static styles
const baseStyles =
  'py-2 px-4 rounded-md transition-colors duration-300 flex items-center justify-center bg-[var(--button-background)] text-[var(--button-text)] whitespace-nowrap';
const hoverStyles = 'hover:opacity-70';
const disabledStyles = 'opacity-20 cursor-not-allowed';

// Button component
const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  href,
  disabled = false,
  icon,
  type = 'button',
  iconPosition = 'top',
  className = '',
  ariaLabel,
}) => {
  // Determine flex direction based on icon position
  let flexDirection = 'flex-col';

  switch (iconPosition) {
    case 'left':
      flexDirection = 'flex-row';
      break;
    case 'right':
      flexDirection = 'flex-row-reverse';
      break;
    case 'bottom':
      flexDirection = 'flex-col-reverse';
      break;
  }

  const contentStyles = `flex ${flexDirection} items-center gap-2 justify-center`;

  // Ensure w-full is only applied when no width is manually set
  const combinedStyles = `${baseStyles} ${!disabled ? hoverStyles : ''} ${disabled ? disabledStyles : ''} ${className.includes('w-') ? '' : 'w-full'} ${className}`;

  // Button content structure
  const ButtonContent = (
    <div className={`${contentStyles} flex items-center justify-center`}>
        {icon && <span className="flex items-center justify-center">{icon}</span>}
      {children && <span>{children}</span>}
    </div>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={combinedStyles} aria-label={ariaLabel}>
        {ButtonContent}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={combinedStyles} disabled={disabled} type={type} aria-label={ariaLabel}>
      {ButtonContent}
    </button>
  );
};

export default Button;
