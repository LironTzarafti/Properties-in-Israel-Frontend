// src/features/public/components/modals/TermsModal.jsx
import { useState } from "react";
import styles from "./TermsModal.module.css";

export default function TermsModal({ userEmail, onAgree }) {
  const [checked, setChecked] = useState(false);

  const handleAgree = () => {
    const agreedUsers = JSON.parse(localStorage.getItem("agreedUsers")) || {};
    agreedUsers[userEmail] = true;
    localStorage.setItem("agreedUsers", JSON.stringify(agreedUsers));
    onAgree();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>תנאי שימוש</h2>
        <p>
          ברוכים הבאים למערכת ניהול נכסי נדל"ן. עליך לקרוא ולהסכים לתנאי השימוש לפני שתמשיך.
          <br /><br />
          1. המערכת מיועדת לניהול נכסים בלבד.<br />
          2. אין להשתמש במערכת לפעילויות בלתי חוקיות.<br />
          3. כל מידע אישי נשמר לפי מדיניות הפרטיות.
        </p>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          אני מסכים/מה לתנאי השימוש
        </label>
        <button
          className={styles.agreeBtn}
          onClick={handleAgree}
          disabled={!checked}
        >
          הסכמה
        </button>
      </div>
    </div>
  );
}
