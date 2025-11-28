// src/pages/Login/Login.jsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import { login as loginAction, setNotifications } from "../../../../store/userSlice";
import { useNavigate } from "react-router-dom";
import styles from "../../../../styles/Auth.module.css";
import { toast } from "react-toastify";
import { login as loginAPI, getMe, getNotifications } from "../../../../services/api";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // State לשדות הטופס - מאחסן את הערכים שהמשתמש מקליד
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // פונקציה שמטפלת בשליחת הטופס
  const handleLogin = async (e) => {
    e.preventDefault(); // מונע רענון דף

    console.log("🔐 [LOGIN] התחלת תהליך התחברות");
    console.log("📧 [LOGIN] Email שהוזן:", email);
    console.log("🔑 [LOGIN] Password שהוזן:", password);

    // בדיקה 1: האם כל השדות מלאים?
    if (!email || !password) {
      console.warn("⚠️ [LOGIN] שדות חסרים - מבטל התחברות");
      toast.error("נא למלא את כל השדות");
      return;
    }

    setIsLoading(true);

    try {
      // קריאה ל-API להתחברות
      console.log("🌐 [LOGIN] שולח בקשה לשרת...");
      const data = await loginAPI(email, password);
      
      console.log("✅ [LOGIN] התחברות הצליחה!");
      console.log("👤 [LOGIN] פרטי משתמש:", { name: data.name, email: data.email });
      console.log("🔑 [LOGIN] Token נשמר ב-localStorage");

      // טעינת כל נתוני המשתמש כולל העדפות
      try {
        const fullUserData = await getMe();
        console.log("✅ [LOGIN] נתוני משתמש מלאים נטענו:", fullUserData);
        
        // שמירת המשתמש המחובר ב-Redux עם כל הנתונים (בלי הסיסמה!)
        dispatch(loginAction(fullUserData));
        
        // טעינת התראות מהשרת
        try {
          const notificationsData = await getNotifications();
          dispatch(setNotifications(notificationsData));
          console.log("✅ [LOGIN] התראות נטענו:", notificationsData.unreadCount, "לא נקראו");
        } catch (notifError) {
          console.warn("⚠️ [LOGIN] לא הצלחנו לטעון התראות:", notifError);
        }
      } catch (error) {
        console.warn("⚠️ [LOGIN] לא הצלחנו לטעון נתונים מלאים, משתמשים בנתונים בסיסיים:", error);
        // אם יש שגיאה, נשתמש בנתונים הבסיסיים
        dispatch(loginAction({ 
          _id: data._id,
          name: data.name, 
          email: data.email,
          role: data.role 
        }));
      }
      
      console.log("🎉 [LOGIN] התחברות הצליחה! מנווט ל-Dashboard");
      toast.success(`ברוך הבא, ${data.name}!`);
      navigate("/");
    } catch (error) {
      // ❌ שגיאה בהתחברות
      console.error("❌ [LOGIN] שגיאה בהתחברות:", error);
      toast.error(error.message || "אימייל או סיסמה שגויים");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <h2>התחברות</h2>
      <form onSubmit={handleLogin} className={styles.authForm}>
        {/* שדה אימייל */}
        <input
          type="email"
          placeholder="אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        {/* שדה סיסמה */}
        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {/* כפתור שליחה */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "מתחבר..." : "התחבר"}
        </button>
      </form>
    </div>
  );
}

export default Login;
