import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { logout as logoutAction } from "../../store/userSlice";
import { clearFavorites } from "../../store/propertySlice";
import { logout as logoutAPI } from "../../services/api";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function useTokenWatcher() {
  const dispatch = useDispatch();
  const warnToastId = useRef(null);
  const timersRef = useRef({ warnTimer: null, expireTimer: null });

  const clearTimers = () => {
    if (timersRef.current.warnTimer) clearTimeout(timersRef.current.warnTimer);
    if (timersRef.current.expireTimer) clearTimeout(timersRef.current.expireTimer);
  };

  const handleLogout = async () => {
    try {
      console.log("🔐 [TOKEN] מתנתק מהמערכת...");
      
      dispatch(logoutAction());
      dispatch(clearFavorites());
      
      await logoutAPI();
      
      if (warnToastId.current) {
        toast.dismiss(warnToastId.current);
      }
      
      toast.info("התנתקת מהמערכת - הפג תוקף החיבור", {
        position: "top-center",
        autoClose: 3000,
      });
      
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
      
    } catch (error) {
      console.error("❌ [TOKEN] שגיאה בהתנתקות:", error);
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  const setupTokenTimers = () => {
    clearTimers();

    const token = localStorage.getItem("token");
    if (!token) return;

    let payload;
    try {
      payload = JSON.parse(atob(token.split(".")[1]));
    } catch {
      console.error("❌ [TOKEN] טוקן לא תקין");
      handleLogout();
      return;
    }

    const expMs = payload.exp * 1000;
    const now = Date.now();
    const timeLeft = expMs - now;

    console.log(`⏰ [TOKEN] Access Token - זמן שנותר: ${Math.floor(timeLeft / 1000 / 60)} דקות`);

    // ✅ במקום התראה - פשוט לוג שהרענון יקרה אוטומטית
    if (timeLeft <= 0) {
      console.log("🔄 [TOKEN] Access Token פג - הרענון יקרה אוטומטית בבקשה הבאה");
      return; // לא מנתקים! הרענון יקרה אוטומטית
    }

    // ✅ התראה רק 1 דקה לפני פקיעה (אופציונלי - יותר לדיבוג)
    const oneMinuteBefore = timeLeft - 60_000;
    if (oneMinuteBefore > 0 && oneMinuteBefore < timeLeft) {
      timersRef.current.warnTimer = setTimeout(() => {
        console.log("ℹ️ [TOKEN] Access Token יפוג בעוד דקה - רענון אוטומטי יבוצע בבקשה הבאה");
        
        // ✅ הודעה ידידותית (אופציונלי - אפשר להסיר)
        toast.info(
          "🔄 החיבור שלך יתחדש אוטומטית בפעולה הבאה",
          {
            position: "top-center",
            autoClose: 5000,
            closeButton: false
          }
        );
      }, oneMinuteBefore);
    }

    // ✅ אם עבר הרבה זמן (מעל 15 דקות) - סימן שהשרת היה ישן
    // הרענון יקרה אוטומטית בבקשה הבאה
  };

  useEffect(() => {
    console.log("🚀 [TOKEN] מפעיל Token Watcher (רענון אוטומטי)");
    setupTokenTimers();

    const handleStorageChange = (e) => {
      if (e.key === "token") {
        console.log("🔄 [TOKEN] זוהה שינוי ב-token - מרענן טיימרים");
        setupTokenTimers();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);

    return () => {
      console.log("🛑 [TOKEN] מנקה Token Watcher");
      clearTimers();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
}