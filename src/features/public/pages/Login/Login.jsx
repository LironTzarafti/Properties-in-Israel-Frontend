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
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    console.log("🔐 [LOGIN] התחלת תהליך התחברות");
    console.log("📧 [LOGIN] Email שהוזן:", email);

    if (!email || !password) {
      console.warn("⚠️ [LOGIN] שדות חסרים - מבטל התחברות");
      toast.error("נא למלא את כל השדות");
      return;
    }

    setIsLoading(true);
    
    // ✅ הוספת מד זמן להצגת הודעת "מתעורר"
    const loginStartTime = Date.now();
    let wakeUpToastId = null;

    try {
      console.log("🌐 [LOGIN] שולח בקשה לשרת...");
      
      // ✅ אם הבקשה לוקחת יותר מ-5 שניות - נציג הודעה
      const wakeUpTimer = setTimeout(() => {
        const elapsed = Math.floor((Date.now() - loginStartTime) / 1000);
        wakeUpToastId = toast.info(
          `☕ השרת מתעורר מ'שינה'... (${elapsed} שניות)`,
          {
            position: "top-center",
            autoClose: false,
            closeButton: false
          }
        );
      }, 5000);
      
      const data = await loginAPI(email, password);
      
      // ביטול הטיימר וסגירת ההודעה אם היא הוצגה
      clearTimeout(wakeUpTimer);
      if (wakeUpToastId) {
        toast.dismiss(wakeUpToastId);
      }
      
      console.log("✅ [LOGIN] התחברות הצליחה!");
      console.log("👤 [LOGIN] פרטי משתמש:", { name: data.name, email: data.email });
      console.log("🔑 [LOGIN] Access Token נשמר, Refresh Token בקוקי");

      // טעינת כל נתוני המשתמש כולל העדפות
      try {
        const fullUserData = await getMe();
        console.log("✅ [LOGIN] נתוני משתמש מלאים נטענו:", fullUserData);
        
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
      console.error("❌ [LOGIN] שגיאה בהתחברות:", error);
      
      // סגירת הודעת "מתעורר" אם היא עדיין פתוחה
      if (wakeUpToastId) {
        toast.dismiss(wakeUpToastId);
      }
      
      toast.error(error.message || "אימייל או סיסמה שגויים");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <h2>התחברות</h2>
      <form onSubmit={handleLogin} className={styles.authForm}>
        <input
          type="email"
          placeholder="אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? "מתחבר..." : "התחבר"}
        </button>
      </form>
    </div>
  );
}

export default Login;