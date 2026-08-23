import React from 'react';

interface IconProps {
  size?: number;
}

const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({
  size = 18,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const IconGrid = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Svg>
);

export const IconUsers = (props: IconProps) => (
  <Svg {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9.5" cy="7" r="3" />
    <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 4.13a3 3 0 0 1 0 5.75" />
  </Svg>
);

export const IconMosque = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 20h16" />
    <path d="M6 20V10l6-5 6 5v10" />
    <path d="M10 20v-5h4v5" />
    <path d="M12 5V3" />
  </Svg>
);

export const IconHelp = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.8.4-1.4 1-1.4 1.7V14" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconList = (props: IconProps) => (
  <Svg {...props}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconChart = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M8 16v-5" />
    <path d="M12 16V8" />
    <path d="M16 16v-8" />
  </Svg>
);

export const IconSettings = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </Svg>
);

export const IconSliders = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
    <circle cx="8" cy="7" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="16" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="11" cy="17" r="1.6" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconLogout = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9 6H5v12h4" />
    <path d="M10 12h10" />
    <path d="M16 8l4 4-4 4" />
  </Svg>
);

export const IconMenu = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconBell = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 16h12l-1.2-2.2a6 6 0 0 1-.8-3.1V9a5 5 0 0 1 10 0v1.7c0 1.1-.3 2.1-.8 3.1L18 16" />
    <path d="M10 16v1a2 2 0 0 0 4 0v-1" />
  </Svg>
);

export const IconClock = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v5l3 2" />
  </Svg>
);

export const IconUser = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="8" r="3" />
    <path d="M5 19a7 7 0 0 1 14 0" />
  </Svg>
);

export const IconCheck = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 12.5 10 17l9-10" />
  </Svg>
);

export const IconTrend = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 16l5-5 4 3 7-8" />
    <path d="M15 6h5v5" />
  </Svg>
);
