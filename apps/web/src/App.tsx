import { Routes, Route } from 'react-router-dom';
import RequireAuth from './auth/RequireAuth';
import LoginPage from './auth/LoginPage';
import WeekView from './week/WeekView';
import LibraryView from './library/LibraryView';
import ShopView from './shop/ShopView';
import ProfileView from './profile/ProfileView';
import CalendarLinkCallback from './profile/CalendarLinkCallback';
import JoinGroup from './profile/JoinGroup';
import BottomNav from './components/BottomNav';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <WeekView />
            <BottomNav />
          </RequireAuth>
        }
      />
      <Route
        path="/library"
        element={
          <RequireAuth>
            <LibraryView />
            <BottomNav />
          </RequireAuth>
        }
      />
      <Route
        path="/shop"
        element={
          <RequireAuth>
            <ShopView />
            <BottomNav />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfileView />
            <BottomNav />
          </RequireAuth>
        }
      />
      <Route
        path="/calendar/link"
        element={
          <RequireAuth>
            <CalendarLinkCallback />
          </RequireAuth>
        }
      />
      <Route
        path="/join/:uuid"
        element={
          <RequireAuth>
            <JoinGroup />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
