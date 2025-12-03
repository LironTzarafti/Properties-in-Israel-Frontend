import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from '../features/public/components/Header/Header';
import AppRoutes from './routes';
import { AuthProvider } from './providers/AuthProvider';
import "../store/i18n";
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/userSlice';
import { setFavorites, clearFavorites } from '../store/propertySlice';
import { getMe, getFavorites, isAuthenticated } from '../services/api';

import BottomNav from "../features/shared/components/BottomNav/BottomNav";
import { useIsMobile } from "../features/hooks/useIsMobile";

import useTokenWatcher from "../features/hooks/useTokenWatcher";  

function App() {
  useTokenWatcher();   // ← הפעלת המעקב אחרי תוקף הטוקן

  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user?.currentUser);
  const isMobile = useIsMobile(768);

  
  // טעינת נתוני משתמש ומועדפים בעת טעינת האפליקציה
  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated() && !currentUser) {
        try {
          const userData = await getMe();
          dispatch(login(userData));
          console.log("✅ [APP] נתוני משתמש נטענו:", userData);

          try {
            const favoritesData = await getFavorites();
            dispatch(setFavorites(favoritesData.favoriteIds || []));
            console.log("✅ [APP] מועדפים נטענו:", favoritesData.favoriteIds?.length || 0);
          } catch (favError) {
            console.warn("⚠️ [APP] לא הצלחנו לטעון מועדפים:", favError);
          }

        } catch (error) {
          console.warn("⚠️ [APP] לא הצלחנו לטעון נתוני משתמש:", error);
          localStorage.removeItem('token');
          dispatch(clearFavorites());
        }
      } else if (!isAuthenticated()) {
        dispatch(clearFavorites());
      }
    };

    loadUserData();
  }, []);

  // טעינת מועדפים כשמשתמש מתחבר/מתנתק
  useEffect(() => {
    const loadFavorites = async () => {
      if (currentUser && isAuthenticated()) {
        try {
          const favoritesData = await getFavorites();
          dispatch(setFavorites(favoritesData.favoriteIds || []));
          console.log("✅ [APP] מועדפים נטענו לאחר התחברות:", favoritesData.favoriteIds?.length || 0);
        } catch (error) {
          console.warn("⚠️ [APP] שגיאה בטעינת מועדפים:", error);
        }
      } else if (!currentUser) {
        dispatch(clearFavorites());
      }
    };

    loadFavorites();
  }, [currentUser, dispatch]);

  return (
    <Router>
      <AuthProvider>
        <Header />

        {/* padding bottom רק אם יש בר תחתון */}
        <div style={{ paddingBottom: isMobile && !currentUser ? "70px" : "0" }}>
          <AppRoutes />
        </div>

        {/* בר תחתון מוצג רק במובייל + אורח */}
        {isMobile && !currentUser && <BottomNav />}

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={true}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
