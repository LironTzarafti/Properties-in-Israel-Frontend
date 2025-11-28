// src/pages/Register/Register.jsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import { login as loginAction } from "../../../../store/userSlice";
import { useNavigate } from "react-router-dom";
import styles from "../../../../styles/Auth.module.css";
import { toast } from "react-toastify";
import { register as registerAPI } from "../../../../services/api";

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // State לשדות הטופס - מאחסן את הערכים שהמשתמש מקליד
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // פונקציה שמטפלת בשליחת הטופס
  const handleRegister = async (e) => {
    e.preventDefault(); // מונע רענון דף

    console.log("📝 [REGISTER] התחלת תהליך הרשמה");
    console.log("👤 [REGISTER] שם שהוזן:", name);
    console.log("📧 [REGISTER] Email שהוזן:", email);
    console.log("🔑 [REGISTER] Password שהוזן:", password);

    // בדיקה 1: האם כל השדות מלאים?
    if (!name || !email || !password) {
      console.warn("⚠️ [REGISTER] שדות חסרים - מבטל הרשמה");
      toast.error("נא למלא את כל השדות");
      return;
    }

    // בדיקה 2: האם הסיסמה ארוכה מספיק?
    if (password.length < 6) {
      console.warn("⚠️ [REGISTER] סיסמה קצרה מדי:", password.length, "תווים");
      toast.error("סיסמה חייבת להיות לפחות 6 תווים");
      return;
    }

    setIsLoading(true);

    try {
      // קריאה ל-API להרשמה
      console.log("🌐 [REGISTER] שולח בקשה לשרת...");
      const data = await registerAPI(name, email, password);
      
      console.log("✅ [REGISTER] הרשמה הצליחה!");
      console.log("👤 [REGISTER] פרטי משתמש:", { name: data.name, email: data.email });
      console.log("🔑 [REGISTER] Token נשמר ב-localStorage");

      // שמירת המשתמש המחובר ב-Redux (בלי הסיסמה!)
      dispatch(loginAction({ 
        _id: data._id,
        name: data.name, 
        email: data.email,
        role: data.role 
      }));
      
      console.log("🔐 [REGISTER] משתמש מחובר ב-Redux:", { name: data.name, email: data.email });

      // הודעת הצלחה וניווט ללוח הבקרה
      console.log("🎉 [REGISTER] הרשמה הצליחה! מנווט ל-Dashboard");
      toast.success("נרשמת בהצלחה!");
      navigate("/");
    } catch (error) {
      // ❌ שגיאה בהרשמה
      console.error("❌ [REGISTER] שגיאה בהרשמה:", error);
      toast.error(error.message || "שגיאה בהרשמה");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <h2>הרשמה</h2>
      <form onSubmit={handleRegister} className={styles.authForm}>
        {/* שדה שם */}
        <input
          type="text"
          placeholder="שם מלא"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        
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
          placeholder="סיסמה (לפחות 6 תווים)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {/* כפתור שליחה */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "נרשם..." : "הרשם"}
        </button>
      </form>
    </div>
  );
}

export default Register;
