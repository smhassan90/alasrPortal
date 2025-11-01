import React from 'react';
import styles from './Header.module.css';

export interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
  avatar?: string;
  userName?: string;
  notifications?: number;
  onNotificationClick?: () => void;
  onUserClick?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onMenuClick,
  avatar,
  userName = 'Admin',
  notifications = 0,
  onNotificationClick,
  onUserClick,
  className = '',
}) => {
  const headerClasses = [styles.header, className].filter(Boolean).join(' ');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className={headerClasses}>
      <div className={styles.left}>
        {onMenuClick && (
          <button className={styles.menuButton} onClick={onMenuClick}>
            ☰
          </button>
        )}
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.right}>
        <button className={styles.notificationButton} onClick={onNotificationClick}>
          🔔
          {notifications > 0 && <span className={styles.notificationBadge} />}
        </button>
        <div className={styles.userInfo} onClick={onUserClick}>
          {avatar ? (
            <img src={avatar} alt={userName} className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>{getInitials(userName)}</div>
          )}
          <span className={styles.userName}>{userName}</span>
        </div>
      </div>
    </header>
  );
};

