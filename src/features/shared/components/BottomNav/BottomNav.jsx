import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./BottomNav.module.css";

function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { path: "/", icon: "🏠", label: t("Home") },
    { path: "/dashboard", icon: "📊", label: t("Dashboard") },
    { path: "/loan-calculator", icon: "🧮", label: t("Loan Calculator") }
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`${styles.navItem} ${
            location.pathname === item.path ? styles.active : ""
          }`}
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default BottomNav;