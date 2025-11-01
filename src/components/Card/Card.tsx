import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  hoverable?: boolean;
  onClick?: () => void;
  headerAction?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  padding = 'medium',
  shadow = 'small',
  hoverable = false,
  onClick,
  headerAction,
  className = '',
}) => {
  const cardClasses = [
    styles.card,
    styles[`shadow${shadow.charAt(0).toUpperCase()}${shadow.slice(1)}`],
    hoverable ? styles.hoverable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const contentClasses = [
    styles.content,
    styles[`${padding}Padding`],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses} onClick={onClick}>
      {(title || subtitle || headerAction) && (
        <div className={styles.header}>
          <div>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={contentClasses}>{children}</div>
    </div>
  );
};

