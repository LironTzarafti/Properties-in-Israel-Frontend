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

function App() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user?.currentUser);

  // טעינת נתוני משתמש ומועדפים בעת טעינת האפליקציה
  useEffect(() => {
    const loadUserData = async () => {
      // אם יש token אבל אין נתוני משתמש, נטען מחדש
      if (isAuthenticated() && !currentUser) {
        try {
          const userData = await getMe();
          dispatch(login(userData));
          console.log("✅ [APP] נתוני משתמש נטענו:", userData);
          
          // 🆕 טעינת מועדפים של המשתמש
          try {
            const favoritesData = await getFavorites();
            dispatch(setFavorites(favoritesData.favoriteIds || []));
            console.log("✅ [APP] מועדפים נטענו:", favoritesData.favoriteIds?.length || 0);
          } catch (favError) {
            console.warn("⚠️ [APP] לא הצלחנו לטעון מועדפים:", favError);
          }
          
        } catch (error) {
          console.warn("⚠️ [APP] לא הצלחנו לטעון נתוני משתמש:", error);
          // אם יש שגיאה (למשל token לא תקין), נמחק את ה-token
          localStorage.removeItem('token');
          dispatch(clearFavorites()); // 🆕 ניקוי מועדפים
        }
      } else if (!isAuthenticated()) {
        // 🆕 אם אין token - ננקה את המועדפים
        dispatch(clearFavorites());
      }
    };

    loadUserData();
  }, []); // רק פעם אחת בטעינת האפליקציה

  // 🆕 טעינת מועדפים כשמשתמש מתחבר
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
        // כשמשתמש מתנתק - ננקה מועדפים
        dispatch(clearFavorites());
      }
    };

    loadFavorites();
  }, [currentUser, dispatch]);

  return (
    <Router>
      <AuthProvider>
        <Header />
        <AppRoutes />
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