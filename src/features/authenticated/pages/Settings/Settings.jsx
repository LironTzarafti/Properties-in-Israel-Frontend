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
  const currentUser = useSelector(state => state.user.currentUser);

  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [language, setLanguage] = useState("he");
  const [modalContent, setModalContent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // מפתח שמירה ב-localStorage לפי המשתמש
  const userId = currentUser?.id || "guest";
  const storageKey = `userSettings_${userId}`;

  // טעינת הגדרות רק בהתחלה
  useEffect(() => {
    const savedSettings = localStorage.getItem(storageKey);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setNotifications(parsed.notifications ?? true);
        setEmailUpdates(parsed.emailUpdates ?? true);
        setLanguage(parsed.language || "he");
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    } else {
      // אם אין הגדרות, תמיד דיפולט עברית
      setLanguage("he");
      i18n.changeLanguage("he");
    }
  }, [storageKey, i18n]);

  const handleLanguageChange = (lng) => {
    setLanguage(lng); // משנה רק את state, לא את השפה מיד
  };

  const handleSave = () => {
    const settings = {
      notifications,
      emailUpdates,
      language,
    };
    localStorage.setItem(storageKey, JSON.stringify(settings));
    i18n.changeLanguage(language); // עכשיו השפה משתנה בפועל
    alert(t("Settings saved!"));
  };

  const handleBack = () => window.history.back();

  const openModal = (content) => setModalContent(content);
  const closeModal = () => setModalContent(null);

  const handleDeleteAccount = async () => {
    const firstConfirm = window.confirm(
      "האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו לא ניתנת לביטול!"
    );
    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "אזהרה אחרונה! כל הנתונים שלך יימחקו לצמיתות. להמשיך?"
    );
    if (!secondConfirm) return;

    setIsDeleting(true);
    try {
      await deleteAccount();
      dispatch(logout());
      // מחיקת כל הגדרות המשתמש מה-localStorage
      localStorage.removeItem(storageKey);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("שגיאה במחיקת החשבון: " + error.message);
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
