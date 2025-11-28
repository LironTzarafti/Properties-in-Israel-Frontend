import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout as logoutAction } from "../../../../store/userSlice";
import { logout as logoutAPI } from "../../../../services/api";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import styles from "./ProfileDropdown.module.css";

function ProfileDropdown() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.currentUser);
  
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

  const handleLogout = async () => {
    try {
      await logoutAPI();
      dispatch(logoutAction());
      toast.info(t("You have been logged out successfully"));
      navigate("/");
      setIsOpen(false);
    } catch (error) {
      console.error("❌ [PROFILE_DROPDOWN] שגיאה בהתנתקות:", error);
      // גם אם יש שגיאה, נריץ logout מקומי
      dispatch(logoutAction());
      toast.info(t("You have been logged out successfully"));
      navigate("/");
      setIsOpen(false);
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setIsOpen(false);
  };

  const handleDashboardClick = () => {
    navigate("/dashboard");
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    navigate("/settings");
    setIsOpen(false);
  };

  // קבלת ראשי התיבות של השם
  const getInitials = (name) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className={styles.profileContainer} ref={dropdownRef}>
      <button className={styles.profileBtn} onClick={toggleDropdown}>
        <div className={styles.avatar}>
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt={currentUser.name} />
          ) : (
            <span>{getInitials(currentUser?.name)}</span>
          )}
        </div>
        <span className={styles.chevron}>▼</span>
      </button>
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <div className={styles.avatarLarge}>
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} />
              ) : (
                <span>{getInitials(currentUser?.name)}</span>
              )}
            </div>
            <div className={styles.userDetails}>
              <h4>{currentUser?.name}</h4>
              <p>{currentUser?.email}</p>
            </div>
          </div>
          <div className={styles.divider}></div>
          <div className={styles.menuItems}>
            <button className={styles.menuItem} onClick={handleProfileClick}>
              <span className={styles.icon}>👤</span>
              <span>{t("My Profile")}</span>
            </button>
            <button className={styles.menuItem} onClick={() => { navigate("/"); setIsOpen(false); }}>
             <span className={styles.icon}>🏠</span>
             <span>{t("Home")}</span>
            </button>
            <button className={styles.menuItem} onClick={handleDashboardClick}>
              <span className={styles.icon}>📊</span>
              <span>{t("Dashboard")}</span>
            </button>
            <button className={styles.menuItem} onClick={() => { navigate("/loan-calculator"); setIsOpen(false); }}>
             <span className={styles.icon}>🧮</span>
             <span>{t("Loan Calculator")}</span>
            </button>
            <button className={styles.menuItem} onClick={handleSettingsClick}>
              <span className={styles.icon}>⚙️</span>
              <span>{t("Settings")}</span>
            </button>
          </div>
          <div className={styles.divider}></div>
          <button className={styles.logoutItem} onClick={handleLogout}>
            <span className={styles.icon}>🚪</span>
            <span>{t("Log out")}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;





