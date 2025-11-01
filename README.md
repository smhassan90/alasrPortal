# SalaahManager Admin Portal

A comprehensive Super Admin Dashboard for managing the SalaahManager API system. Built with React 18, TypeScript, and modern web technologies.

## Features

- **Authentication & Authorization**: Secure JWT-based authentication with token refresh
- **Dashboard**: Real-time metrics, charts, and activity feeds
- **User Management**: Full CRUD operations for users with role-based permissions
- **Masajid Management**: Complete masjid management with member assignments and permissions
- **Questions Overview**: View and manage questions from all masajids
- **Analytics & Reports**: Visual analytics with data export capabilities
- **Settings**: System configuration and user profile management
- **Responsive Design**: Fully responsive across mobile, tablet, and desktop

## Tech Stack

- **React 18+** with TypeScript
- **Vite** - Fast build tool
- **Redux Toolkit** - State management
- **React Router v6** - Routing
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **React Toastify** - Notifications
- **CSS Modules** - Scoped styling

## Prerequisites

- Node.js 16+ and npm

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd salaahmanager-portal
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your API base URL:
```
VITE_API_BASE_URL=https://your-api-url.com/api/v1
```

## Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── Button/
│   ├── Card/
│   ├── Input/
│   ├── Table/
│   └── ...
├── layouts/           # Layout components
│   ├── MainLayout/
│   └── DashboardLayout/
├── pages/             # Page components
│   ├── Dashboard/
│   ├── Users/
│   ├── Masajids/
│   ├── Questions/
│   ├── Analytics/
│   └── Settings/
├── redux/             # Redux store and slices
│   ├── store.ts
│   ├── authSlice.ts
│   ├── usersSlice.ts
│   └── masjidsSlice.ts
├── services/          # API services
│   ├── api.ts
│   ├── authService.ts
│   ├── userService.ts
│   └── masjidService.ts
├── theme/             # Theme configuration
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
├── App.tsx            # Main app component
└── main.tsx           # Entry point
```

## Authentication

The portal requires super admin access. Only users with `is_super_admin: true` can log in.

### Login Credentials
Use your super admin credentials to access the portal.

## API Integration

The application integrates with the SalaahManager API. All API calls include:
- JWT token authentication
- Automatic token refresh
- Error handling and retry logic

### Available Endpoints

**Authentication**
- POST `/auth/login` - Login
- POST `/auth/refresh-token` - Refresh token
- POST `/auth/logout` - Logout

**Users**
- GET `/super-admin/users` - Get all users
- PUT `/super-admin/users/:id/promote` - Promote to super admin
- PUT `/super-admin/users/:id/demote` - Demote from super admin
- PUT `/super-admin/users/:id/activate` - Activate user
- PUT `/super-admin/users/:id/deactivate` - Deactivate user

**Masajids**
- GET `/masajids` - Get all masajids
- POST `/masajids` - Create masjid
- GET `/masajids/:id` - Get masjid details
- PUT `/masajids/:id` - Update masjid
- DELETE `/masajids/:id` - Delete masjid
- GET `/masajids/:id/members` - Get masjid members
- POST `/masajids/:id/users` - Add member to masjid

**Questions**
- GET `/questions/masjid/:masjidId` - Get questions by masjid
- DELETE `/questions/:id` - Delete question

## Features Overview

### Dashboard
- Total metrics cards (Masajids, Users, Questions, Pending)
- Registration trend charts
- Questions statistics
- User distribution
- Recent activity feed

### User Management
- View all users in a table
- Search and filter capabilities
- Create/Edit users
- Promote/Demote super admin privileges
- Activate/Deactivate users
- View user details

### Masajid Management
- View all masajids
- Create/Edit masajids
- Manage masjid members
- Assign roles (Admin/Imam)
- Set granular permissions
- Delete masajids

### Questions Overview
- View all questions across masajids
- Filter by status (New/Replied)
- Search by title, user, or masjid
- View question details and replies
- Delete questions

### Analytics & Reports
- Visual charts and graphs
- User growth trends
- Active masajids statistics
- Export data (PDF, Excel, CSV)
- Real-time system metrics

### Settings
- Update profile information
- Change password
- System configuration
- Notification preferences

## Theme Customization

The application uses a consistent theme system. To customize:

1. Edit theme files in `src/theme/`:
   - `colors.ts` - Color palette
   - `typography.ts` - Font settings
   - `spacing.ts` - Spacing scale
   - `shadows.ts` - Shadow styles
   - `borderRadius.ts` - Border radius values

2. Colors are defined in `colors.ts`:
```typescript
export const colors = {
  primary: '#007F5F',
  secondary: '#FFD700',
  // ... more colors
};
```

## Security Features

- JWT token authentication
- Automatic token refresh
- Super admin role verification
- Protected routes
- Secure API communication
- Auto-logout on token expiry
- Input sanitization

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For support, contact the development team or open an issue in the repository.

---

Built with ❤️ for SalaahManager
