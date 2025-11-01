import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { store } from './redux/store';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { setUser, setLoading } from './redux/authSlice';
import authService from './services/authService';
import { MainLayout } from './layouts';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
import {
  Login,
  Dashboard,
  Users,
  Masajids,
  Questions,
  Analytics,
  Settings,
} from './pages';
import './App.css';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, user } = useAppSelector((state) => state.auth);
  const [pendingQuestionsCount, setPendingQuestionsCount] = useState(0);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      dispatch(setUser(currentUser));
    } else {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  // Fetch pending questions count
  useEffect(() => {
    if (user) {
      fetchPendingQuestionsCount();
      // Refresh count every 5 minutes (to match cache duration)
      const interval = setInterval(fetchPendingQuestionsCount, 300000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPendingQuestionsCount = async () => {
    try {
      const questionService = (await import('./services/questionService')).default;
      const questions = await questionService.getAllQuestions(true); // Use cache
      const pendingCount = questions.filter(q => q.status === 'New').length;
      setPendingQuestionsCount(pendingCount);
    } catch (error) {
      // Silently fail - badge will show previous count
      console.log('Unable to fetch pending questions count');
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  const menuItems = [
    { label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { label: 'Users', icon: '👥', path: '/users' },
    { label: 'Masajids', icon: '🕌', path: '/masajids' },
    { label: 'Questions', icon: '❓', path: '/questions', badge: pendingQuestionsCount || undefined },
    { label: 'Analytics', icon: '📈', path: '/analytics' },
    { label: 'Settings', icon: '⚙️', path: '/settings' },
    { label: 'Logout', icon: '🚪', path: '', onClick: handleLogout },
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '24px',
        color: '#007F5F',
      }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout
                menuItems={menuItems}
                title="Al-Asr Portal"
                userName={user?.name}
                notifications={pendingQuestionsCount}
              />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="masajids" element={<Masajids />} />
          <Route path="questions" element={<Questions />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Provider>
  );
}

export default App;
