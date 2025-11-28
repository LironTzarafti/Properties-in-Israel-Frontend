import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  setNotifications,
  updateNotification,
} from "../../../../store/userSlice";
import { useTranslation } from "react-i18next";
import styles from "./NotificationDropdown.module.css";
import {
  getNotifications,
  markNotificationAsRead as markNotificationAsReadAPI,
  markAllNotificationsAsRead as markAllNotificationsAsReadAPI,
  deleteNotificationAPI,
} from "../../../../services/api";
import { toast } from "react-toastify";

function NotificationDropdown() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.user.notifications);
  const unreadCount = useSelector((state) => state.user.unreadCount);
  const currentUser = useSelector((state) => state.user.currentUser);

  // טעינת התראות מהשרת
  useEffect(() => {
    const loadNotifications = async () => {
      if (currentUser) {
        try {
          setIsLoading(true);
          const data = await getNotifications();
          dispatch(setNotifications(data));
        } catch (error) {
          console.error("שגיאה בטעינת התראות:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadNotifications();
    
    // רענון אוטומטי כל 10 שניות (real-time)
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [currentUser, dispatch]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleNotificationClick = async (notificationId) => {
    try {
      await markNotificationAsReadAPI(notificationId);
      dispatch(markNotificationAsRead(notificationId));
      // רענון התראות מהשרת
      const data = await getNotifications();
      dispatch(setNotifications(data));
    } catch (error) {
      console.error("שגיאה בסימון התראה כנקראה:", error);
      toast.error("שגיאה בסימון התראה");
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsReadAPI();
      dispatch(markAllNotificationsAsRead());
      // רענון התראות מהשרת
      const data = await getNotifications();
      dispatch(setNotifications(data));
    } catch (error) {
      console.error("שגיאה בסימון כל ההתראות:", error);
      toast.error("שגיאה בסימון התראות");
    }
  };
  
  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await deleteNotificationAPI(notificationId);
      dispatch(deleteNotification(notificationId));
      // רענון התראות מהשרת
      const data = await getNotifications();
      dispatch(setNotifications(data));
    } catch (error) {
      console.error("שגיאה במחיקת התראה:", error);
      toast.error("שגיאה במחיקת התראה");
    }
  };
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return t("Just now");
    if (diffMins < 60) return t("Before {{count}} minutes", { count: diffMins });
    if (diffHours < 24) return t("Before {{count}} hours", { count: diffHours });
    return t("Before {{count}} days", { count: diffDays });
  };
  const getNotificationIcon = (type) => {
    switch (type) {
      case "new_property":
        return "🏠";
      case "property_match":
        return "✨";
      case "property_update":
        return "🔄";
      case "inquiry":
        return "📩";
      case "update":
        return "🔔";
      case "alert":
        return "⚠️";
      default:
        return "📢";
    }
  };
  return (
    <div className={styles.notificationContainer} ref={dropdownRef}>
      <button className={styles.notificationBtn} onClick={toggleDropdown}>
        🔔
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>{t("Notifications")}</h3>
            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={handleMarkAllAsRead}>
                {t("Mark all as read")}
              </button>
            )}
          </div>
          <div className={styles.notificationList}>
            {isLoading ? (
              <div className={styles.emptyState}>
                <p>טוען התראות...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <p>{t("No new notifications")}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id || n.id}
                  className={`${styles.notificationItem} ${!n.read ? styles.unread : ""}`}
                  onClick={() => handleNotificationClick(n._id || n.id)}
                >
                  <div className={styles.notificationIcon}>{getNotificationIcon(n.type)}</div>
                  <div className={styles.notificationContent}>
                    <h4>{n.title}</h4>
                    <p>{n.message}</p>
                    <span className={styles.timestamp}>{formatTime(n.timestamp || n.createdAt)}</span>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteNotification(e, n._id || n.id)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
