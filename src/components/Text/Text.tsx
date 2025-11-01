import React from 'react';
import styles from './Text.module.css';

export interface TextProps {
  children: React.ReactNode;
  variant?: 'regular' | 'medium' | 'semiBold' | 'bold';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'huge';
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'regular',
  size = 'md',
  color = '#222222',
  align = 'left',
  as: Component = 'p',
  className = '',
}) => {
  const textClasses = [
    styles.text,
    styles[variant],
    styles[size],
    styles[align],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={textClasses} style={{ color }}>
      {children}
    </Component>
  );
};

