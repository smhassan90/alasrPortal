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
    // Close sidebar on mobile after clicking
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  return (
    <>
      <div className={overlayClasses} onClick={onClose} />
      <aside className={sidebarClasses}>
        <div className={styles.header}>
          <div className={styles.logo}>🕌</div>
          <h1 className={styles.brandName}>Al-Asr Portal</h1>
        </div>
        <nav className={styles.menu}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const itemClasses = [
              styles.menuItem,
              isActive ? styles.active : '',
            ]
              .filter(Boolean)
              .join(' ');

            if (item.path) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={itemClasses}
                  onClick={() => handleMenuClick(item)}
                >
                  <span className={styles.menuIcon}>{item.icon}</span>
                  <span className={styles.menuLabel}>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <div className={styles.menuBadge}>
                      <Badge variant="error" size="small">
                        {item.badge}
                      </Badge>
                    </div>
                  )}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                className={itemClasses}
                onClick={() => handleMenuClick(item)}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span className={styles.menuLabel}>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <div className={styles.menuBadge}>
                    <Badge variant="error" size="small">
                      {item.badge}
                    </Badge>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

