import React from 'react';
import styles from './DashboardLayout.module.css';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  className = '',
}) => {
  const layoutClasses = [styles.dashboardLayout, className]
    .filter(Boolean)
    .join(' ');

  return <div className={layoutClasses}>{children}</div>;
};

export const StatsGrid: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div className={styles.statsGrid}>{children}</div>;
};

export const ChartsGrid: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div className={styles.chartsGrid}>{children}</div>;
};

