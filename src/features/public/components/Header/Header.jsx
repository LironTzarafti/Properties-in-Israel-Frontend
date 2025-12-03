import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "../../../hooks/useIsMobile";
import NotificationDropdown from "../NotificationDropdown/NotificationDropdown";
import ProfileDropdown from "../ProfileDropdown/ProfileDropdown";
import styles from "./Header.module.css";

function Header() {
  const { t } = useTranslation();
  const currentUser = useSelector((state) => state.user.currentUser);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile(768);

  const handleBack = () => {
    navigate(-1);
  };

  const showBackButton = location.pathname !== "/";

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.rightLinks}>
          {currentUser ? (
            <div className={styles.userControls}>
              <NotificationDropdown />
              <ProfileDropdown />
            </div>
          ) : (
            <>
              <Link to="/login" className={styles.authLink}>
                {t("Login")}
              </Link>
              <Link to="/register" className={styles.authLink}>
                {t("Register")}
              </Link>
            </>
          )}
        </div>
      </div>
      <div className={styles.mainNav}>
        {/* {showBackButton && (
          <button
            className={styles.backBtn}
            onClick={handleBack}
            aria-label={t("Back")}
          >
            ← {t("Back")}
          </button>
        )} */}

        <h1 className={styles.logo}>🏠 {t("Properties in Israel")}</h1>
        
        {/* הצגת navLinks רק בדסקטופ או במובייל למשתמש מחובר */}
        {(!isMobile || currentUser) && (
          <nav className={styles.navLinks}>
            <Link to="/" className={styles.navLink}>
              {t("Home")}
            </Link>
            <Link to="/dashboard" className={styles.navLink}>
              {t("Dashboard")}
            </Link>
            <Link to="/loan-calculator" className={styles.navLink}>
              {t("Loan Calculator")}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;