import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import styles from './MainLayout.module.css';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import type { MenuItem } from '../../components/Sidebar/Sidebar';
import { Header } from '../../components/Header/Header';

export interface MainLayoutProps {
  menuItems: MenuItem[];
  title: string;
  userName?: string;
  avatar?: string;
  notifications?: number;
  onNotificationClick?: () => void;
  onUserClick?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  menuItems,
  title,
  userName,
  avatar,
  notifications,
  onNotificationClick,
  onUserClick,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const mainClasses = [
    styles.main,
    !sidebarOpen ? styles.fullWidth : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.layout}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        menuItems={menuItems}
      />
      <div className={mainClasses}>
        <Header
          title={title}
          onMenuClick={toggleSidebar}
          userName={userName}
          avatar={avatar}
          notifications={notifications}
          onNotificationClick={onNotificationClick}
          onUserClick={onUserClick}
        />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

