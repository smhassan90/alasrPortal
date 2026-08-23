import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { Badge } from '../Badge/Badge';

export interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  onClick?: () => void;
  footer?: boolean;
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  menuItems,
  className = '',
}) => {
  const location = useLocation();

  const sidebarClasses = [
    styles.sidebar,
    !isOpen ? styles.closed : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const overlayClasses = [
    styles.overlay,
    !isOpen ? styles.closed : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleMenuClick = (item: MenuItem) => {
    if (item.onClick) {
      item.onClick();
    }
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  const renderItem = (item: MenuItem) => {
    const isActive = Boolean(item.path) && location.pathname === item.path;
    const itemClasses = [
      styles.menuItem,
      isActive ? styles.active : '',
    ]
      .filter(Boolean)
      .join(' ');

    const content = (
      <>
        <span className={styles.menuIcon}>{item.icon}</span>
        <span className={styles.menuLabel}>{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <div className={styles.menuBadge}>
            <Badge variant="error" size="small">
              {item.badge}
            </Badge>
          </div>
        )}
      </>
    );

    if (item.path) {
      return (
        <Link
          key={item.path}
          to={item.path}
          className={itemClasses}
          onClick={() => handleMenuClick(item)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.label}
        className={itemClasses}
        onClick={() => handleMenuClick(item)}
      >
        {content}
      </button>
    );
  };

  const mainItems = menuItems.filter((item) => !item.footer);
  const footerItems = menuItems.filter((item) => item.footer);

  return (
    <>
      <div className={overlayClasses} onClick={onClose} />
      <aside className={sidebarClasses}>
        <div className={styles.header}>
          <div className={styles.mark}>A</div>
          <div className={styles.brandMeta}>
            <h1 className={styles.brandName}>Al-Asr</h1>
            <span className={styles.brandHint}>Portal</span>
          </div>
        </div>
        <nav className={styles.menu}>{mainItems.map(renderItem)}</nav>
        {footerItems.length > 0 && (
          <div className={styles.footer}>{footerItems.map(renderItem)}</div>
        )}
      </aside>
    </>
  );
};
