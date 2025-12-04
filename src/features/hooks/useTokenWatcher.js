import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// ========================================
// ✅ Hook מעקב אחרי תוקף הטוקן עם לוגים טובים
// ========================================

export default function useTokenWatcher() {
  const hasShownWarning = useRef(false);

  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("ℹ️ [TOKEN WATCHER] אין טוקן - משתמש לא מחובר");
        return;
      }

      let payload;
      try {
        payload = JSON.parse(atob(token.split(".")[1]));
      } catch {
        console.error("❌ [TOKEN WATCHER] טוקן לא תקין - מנקה");
        localStorage.removeItem("token");
        return;
      }

      const expMs = payload.exp * 1000;
      const now = Date.now();
      const timeLeft = expMs - now;
      
      // ✅ חישוב זמן שנותר בפורמט קריא
      const daysLeft = Math.floor(timeLeft / 1000 / 60 / 60 / 24);
      const hoursLeft = Math.floor((timeLeft / 1000 / 60 / 60) % 24);
      const minutesLeft = Math.floor((timeLeft / 1000 / 60) % 60);

      // ✅ לוג מפורט - מעולה לדיבאג!
      if (daysLeft > 1) {
        console.log(`✅ [TOKEN WATCHER] טוקן תקף - נשארו ${daysLeft} ימים`);
      } else if (daysLeft === 1) {
        console.log(`⚠️ [TOKEN WATCHER] טוקן תקף - נשאר יום אחד (${hoursLeft} שעות)`);
      } else if (hoursLeft > 0) {
        console.log(`⚠️ [TOKEN WATCHER] טוקן תקף - נשארו ${hoursLeft} שעות ו-${minutesLeft} דקות`);
      } else if (minutesLeft > 0) {
        console.log(`🚨 [TOKEN WATCHER] טוקן עומד לפוג - נשארו ${minutesLeft} דקות!`);
      }

      // ✅ התראה ידידותית כשנשאר יום אחד
      if (daysLeft === 1 && !hasShownWarning.current) {
        hasShownWarning.current = true;
        toast.info(
          "💡 החיבור שלך יפוג מחר - מומלץ להתחבר מחדש",
          {
            position: "top-center",
            autoClose: 7000,
            closeButton: true
          }
        );
        console.log("📢 [TOKEN WATCHER] הודעה נשלחה למשתמש - נשאר יום אחד");
      }

      // ✅ אם הטוקן פג - ננקה אותו (הניתוק יקרה ב-api.js בבקשה הבאה)
      if (timeLeft <= 0) {
        console.log("⏰ [TOKEN WATCHER] הטוכן פג תוקף - מנקה מ-localStorage");
        console.log("ℹ️ [TOKEN WATCHER] הניתוק יקרה אוטומטית בבקשה הבאה");
        localStorage.removeItem("token");
        // ✅ לא מנתקים כאן - נותנים ל-api.js לטפל בזה
      }
    };

    // ✅ בדיקה ראשונית
    console.log("🚀 [TOKEN WATCHER] מפעיל מעקב אחרי תוקף טוקן");
    checkTokenExpiry();

    // ✅ בדיקה כל שעה
    const interval = setInterval(checkTokenExpiry, 60 * 60 * 1000);

    return () => {
      console.log("🛑 [TOKEN WATCHER] מפסיק מעקב");
      clearInterval(interval);
    };
  }, []);
}

