import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../../store/userSlice";
import { deleteAccount } from "../../../../services/api";
import styles from "./Settings.module.css";

function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // קבלת המשתמש המחובר מה-Redux
  const currentUser = useSelector((state) => state.user?.currentUser);
  const userId = currentUser?.id || currentUser?.email || null;

  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [language, setLanguage] = useState("he");
  const [modalContent, setModalContent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // פונקציה לקבלת מפתח ייעודי למשתמש
  const getUserSettingsKey = () => {
    if (!userId) return null;
    return `userSettings_${userId}`;
  };

  // טעינת הגדרות ספציפיות למשתמש בלבד
  useEffect(() => {
    const loadSettings = () => {
      // אם אין משתמש מחובר - עברית דיפולט
      if (!userId) {
        setLanguage("he");
        i18n.changeLanguage("he");
        return;
      }

      const settingsKey = getUserSettingsKey();
      const savedSettings = localStorage.getItem(settingsKey);
      
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setNotifications(parsed.notifications ?? true);
          setEmailUpdates(parsed.emailUpdates ?? true);
          setLanguage(parsed.language || "he");
          
          // שינוי שפה רק אם שונה מהנוכחית
          if (i18n.language !== (parsed.language || "he")) {
            i18n.changeLanguage(parsed.language || "he");
          }
        } catch (error) {
          console.error("Error loading settings:", error);
          // במקרה של שגיאה - חזרה לעברית
          setLanguage("he");
          i18n.changeLanguage("he");
        }
      } else {
        // אם אין הגדרות שמורות - עברית דיפולט
        setLanguage("he");
        i18n.changeLanguage("he");
      }
    };
    
    loadSettings();
  }, [userId, i18n]);

  const handleLanguageChange = (lng) => {
    setLanguage(lng);
  };

  // שמירה ספציפית למשתמש
  const handleSave = () => {
    if (!userId) {
      alert(t("You must be logged in to save settings"));
      return;
    }

    const settings = {
      notifications,
      emailUpdates,
      language,
    };
    
    const settingsKey = getUserSettingsKey();
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    
    i18n.changeLanguage(language);
    
    alert(t("Settings saved!"));
  };

  const handleBack = () => window.history.back();

  const openModal = (content) => setModalContent(content);
  const closeModal = () => setModalContent(null);

  // מחיקת חשבון - מוחק רק את ההגדרות של המשתמש הנוכחי
  const handleDeleteAccount = async () => {
    const firstConfirm = window.confirm(
      t("Are you sure you want to delete your account? This action cannot be undone!")
    );
    
    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      t("Final warning! All your data will be permanently deleted. Continue?")
    );

    if (!secondConfirm) return;

    setIsDeleting(true);

    try {
      await deleteAccount();
      
      // מחיקת ההגדרות של המשתמש הספציפי בלבד
      const settingsKey = getUserSettingsKey();
      if (settingsKey) {
        localStorage.removeItem(settingsKey);
      }
      
      // ניקוי Redux Store
      dispatch(logout());
      
      // איפוס לשפה דיפולט
      i18n.changeLanguage("he");
      
      // ניווט לדף הבית
      navigate("/", { replace: true });
      
    } catch (error) {
      console.error("Error deleting account:", error);
      alert(t("Error deleting account: ") + error.message);
      setIsDeleting(false);
    }
  };

  const defaultPrivacyText = `
  מדיניות פרטיות - ניהול נכסים:
  אנו אוספים מידע אודות הנכסים, משתמשים ופעולות באפליקציה על מנת לייעל את הניהול, להבטיח אבטחה ולשפר את חוויית המשתמש.
  כל המידע נשמר בצורה מוצפנת ואינו מועבר לצד שלישי ללא הסכמה.
  `;

  const defaultTermsText = `
  תנאי שימוש:
  השימוש באפליקציה מותנה בקבלת התנאים המפורטים כאן. 
  המשתמש מתחייב להשתמש במידע שנאסף אך ורק לניהול הנכסים האישיים שלו. 
  אין לבצע פעולות מזיקות או שיתוף מידע לצדדים שאינם מורשים.
  `;

  // אם אין משתמש מחובר - הצג הודעה
  if (!userId) {
    return (
      <div className={styles.settingsContainer}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={handleBack}>
            ← {t("Back")}
          </button>
          <h1>{t("Settings")}</h1>
        </div>
        <div className={styles.content}>
          <p style={{ textAlign: "center", padding: "2rem" }}>
            {t("Please log in to access settings")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack}>
          ← {t("Back")}
        </button>
        <h1>{t("Settings")}</h1>
      </div>

      <div className={styles.content}>

        {/* התראות */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🔔 {t("Notifications")}</h2>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>{t("Browser notifications")}</label>
              <p>{t("Get notified about important activities")}</p>
            </div>
            <label className={styles.switch}>
              <input 
                type="checkbox" 
                checked={notifications} 
                onChange={(e) => setNotifications(e.target.checked)} 
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>{t("Email updates")}</label>
              <p>{t("Receive weekly email updates")}</p>
            </div>
            <label className={styles.switch}>
              <input 
                type="checkbox" 
                checked={emailUpdates} 
                onChange={(e) => setEmailUpdates(e.target.checked)} 
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        </section>

        {/* שפה */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🌐 {t("Language & Region")}</h2>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>{t("Interface language")}</label>
              <p>{t("Choose your app language")}</p>
            </div>
            <select 
              className={styles.select} 
              value={language} 
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="he">{t("Hebrew")}</option>
              <option value="en">{t("English")}</option>
              <option value="ar">{t("Arabic")}</option>
            </select>
          </div>
        </section>

        {/* פרטיות */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🔒 {t("Privacy & Security")}</h2>

          <button 
            className={styles.linkButton} 
            onClick={() => openModal(defaultPrivacyText)}
          >
            <span>{t("Privacy Policy")}</span>
            <span>→</span>
          </button>

          <button 
            className={styles.linkButton} 
            onClick={() => openModal(defaultTermsText)}
          >
            <span>{t("Terms of Use")}</span>
            <span>→</span>
          </button>

          <button
            className={styles.linkButton}
            onClick={handleDeleteAccount}
            disabled={isDeleting}
          >
            <span style={{ color: "#dc2626" }}>
              {isDeleting ? t("Deleting...") : t("Delete account")}
            </span>
            <span>→</span>
          </button>
        </section>

        <div className={styles.saveSection}>
          <button className={styles.saveBtn} onClick={handleSave}>
            💾 {t("Save Settings")}
          </button>
        </div>

      </div>

      {modalContent && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={closeModal}>×</button>
            <div style={{ whiteSpace: "pre-line" }}>{modalContent}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;