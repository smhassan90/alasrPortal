import React from 'react';
import styles from './StatCard.module.css';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = '#007F5F',
  onClick,
  className = '',
}) => {
  const statCardClasses = [
    styles.statCard,
    onClick ? styles.clickable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const backgroundColor = color + '26'; // Add opacity

  return (
    <div className={statCardClasses} onClick={onClick}>
      {icon && (
        <div className={styles.iconContainer} style={{ backgroundColor }}>
          <div className={styles.icon} style={{ color }}>
            {icon}
          </div>
        </div>
      )}
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <h2 className={styles.value}>{value}</h2>
        {trend && (
          <div className={`${styles.trend} ${trend.isPositive ? styles.positive : styles.negative}`}>
            <span className={styles.trendIcon}>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}% this month</span>
          </div>
        )}
      </div>
    </div>
  );
};

