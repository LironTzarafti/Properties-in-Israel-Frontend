// src/features/public/pages/Home/Home.jsx
import { useTranslation } from "react-i18next";
import styles from "./Home.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import PropertyCard from "../../../authenticated/components/PropertyCard/PropertyCard";
import { useState, useEffect } from "react";
import { getPublicProperties as getPublicPropertiesAPI, getProperties as getPropertiesAPI } from "../../../../services/api";
import { setProperties } from "../../../../store/propertySlice";
import TermsModal from "../../components/modals/TermsModal";

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user?.currentUser);
  const properties = useSelector((state) => state.property?.properties || []);
  const userFavorites = useSelector((state) => state.property?.userFavorites || []);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false); // מצב להצגת המודל

  // בדיקה האם המשתמש כבר הסכים לתנאי שימוש
  useEffect(() => {
    if (currentUser && currentUser.email) {
      const agreedUsers = JSON.parse(localStorage.getItem("agreedUsers")) || {};
      if (!agreedUsers[currentUser.email]) {
        setShowTerms(true);
      }
    }
  }, [currentUser]);

  // טעינת נכסים מה-API כשהקומפוננטה נטענת
  useEffect(() => {
    const loadProperties = async () => {
      setIsLoading(true);
      try {
        let data;

        if (currentUser) {
          // משתמש מחובר - טוען את כל הנכסים הציבוריים + הנכסים שלו
          data = await getPublicPropertiesAPI();

          try {
            const myData = await getPropertiesAPI();
            const myPropertyIds = myData.properties.map(p => p._id.toString());
            const publicPropertyIds = data.properties.map(p => p._id.toString());

            const privateProperties = myData.properties.filter(p => !publicPropertyIds.includes(p._id.toString()));
            data.properties = [...data.properties, ...privateProperties];
            data.count = data.properties.length;
          } catch (error) {
            console.warn("⚠️ לא הצלחנו לטעון נכסים פרטיים:", error);
          }
        } else {
          // משתמש אורח - טוען נכסים ציבוריים בלבד
          data = await getPublicPropertiesAPI();
        }

        const formattedProperties = data.properties.map(prop => ({
          id: prop._id,
          title: prop.title,
          description: prop.description,
          price: prop.price,
          status: prop.status === 'available' ? 'זמין' : prop.status === 'sold' ? 'נמכר' : prop.status === 'unavailable' ? 'לא זמין' : prop.status,
          location: prop.location,
          city: prop.location,
          address: prop.location,
          ownerId: prop.owner?.email || prop.owner?._id?.toString() || 'unknown',
          owner: prop.owner,
          isPublic: prop.isPublic !== undefined ? prop.isPublic : true,
          phone: prop.phone || '',
          rooms: prop.rooms || undefined,
          size: prop.size || undefined,
          type: prop.type || '',
          parking: prop.parking || false,
          elevator: prop.elevator || false,
          balcony: prop.balcony || false,
          furnished: prop.furnished || false,
          pets: prop.pets || false,
          airConditioner: prop.airConditioner || false,
          renovated: prop.renovated || false,
          accessibility: prop.accessibility || false,
          createdAt: prop.createdAt,
          ...prop
        }));

        dispatch(setProperties(formattedProperties));
      } catch (error) {
        console.error("❌ שגיאה בטעינת נכסים:", error);
        toast.error(error.message || "שגיאה בטעינת נכסים");
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, [currentUser, dispatch]);

  const getFeaturedProperties = () => {
    const allPublicProperties = properties.filter(p => p.isPublic === true);
    const availableProperties = allPublicProperties.filter(p => 
      p.status === 'זמין' || p.status === 'available'
    );

    let propertiesToShow = availableProperties;

    if (currentUser && currentUser.preferences) {
      const preferences = currentUser.preferences;
      const matchedProperties = [];
      const otherProperties = [];

      propertiesToShow.forEach(property => {
        let matches = false;

        if (preferences.preferredCities && preferences.preferredCities.length > 0) {
          const cityMatch = preferences.preferredCities.some(city => 
            property.location && property.location.includes(city)
          );
          if (cityMatch) matches = true;
        }

        if (preferences.preferredPropertyTypes && preferences.preferredPropertyTypes.length > 0) {
          const typeMatch = preferences.preferredPropertyTypes.includes(property.type);
          if (typeMatch) matches = true;
        }

        if (matches) matchedProperties.push(property);
        else otherProperties.push(property);
      });

      propertiesToShow = [...matchedProperties, ...otherProperties];
    }

    return propertiesToShow
      .sort((a, b) => {
        const aMatches = currentUser?.preferences ? (
          (currentUser.preferences.preferredCities?.some(city => a.location?.includes(city)) ||
           currentUser.preferences.preferredPropertyTypes?.includes(a.type))
        ) : false;
        const bMatches = currentUser?.preferences ? (
          (currentUser.preferences.preferredCities?.some(city => b.location?.includes(city)) ||
           currentUser.preferences.preferredPropertyTypes?.includes(b.type))
        ) : false;

        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return Math.random() - 0.5;
      })
      .slice(0, 6);
  };

  const featuredProperties = getFeaturedProperties();

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate("/dashboard", { 
        state: { 
          viewMode: "all",
          initialSearch: searchTerm 
        } 
      });
    } else {
      navigate("/dashboard", { state: { viewMode: "all" } });
    }
  };

  const handlePropertyManagement = () => {
    if (currentUser) {
      navigate("/dashboard", { state: { viewMode: "myProperties" } });
    } else {
      toast.info("אנא הירשם או התחבר כדי לנהל נכסים");
      navigate("/login");
    }
  };

  const handlePropertyStatus = () => {
    if (currentUser) {
      navigate("/dashboard", { state: { viewMode: "favorites" } });
    } else {
      toast.info("אנא התחבר כדי לצפות בנכסים המועדפים שלך");
      navigate("/login");
    }
  };

  const handleAllProperties = () => {
    navigate("/dashboard", { state: { viewMode: "all" } });
  };

  const handleEdit = () => {};

  return (
    <div className={styles.homeContainer}>
      {/* הצגת TermsModal אם צריך */}
      {showTerms && currentUser && (
        <TermsModal
          userEmail={currentUser.email}
          onAgree={() => {
            const agreedUsers = JSON.parse(localStorage.getItem("agreedUsers")) || {};
            agreedUsers[currentUser.email] = true;
            localStorage.setItem("agreedUsers", JSON.stringify(agreedUsers));
            setShowTerms(false);
          }}
        />
      )}

      {/* שאר תוכן הבית */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>
           {t("Welcome to Real Estate Management App")}
           </h1>
            <p className={styles.heroSubtitle}>
            {t("Manage properties, check statuses and use loan calculators.")}
           </p>

          {currentUser && (
             <div className={styles.welcomeMessage}>
             <p>{t("Hello")} {currentUser.name}! 👋</p>
              </div>
                )}

          <form className={styles.searchForm} onSubmit={handleQuickSearch}>
          <input
            type="text"
              placeholder={t("Search by city, property type or description...")}
                value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className={styles.searchInput}
                    />
               <button type="submit" className={styles.searchButton}>
               🔍 {t("Search")}
               </button>
          </form>
        </div>
      </section>

      {/* נכסים מומלצים */}
      {isLoading ? (
        <section className={styles.featuredSection}>
          <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>🔥 {t("Featured Properties")}</h2>
            <p className={styles.sectionSubtitle}>טוען נכסים...</p>
          </div>
        </section>
      ) : featuredProperties.length > 0 ? (
        <section className={styles.featuredSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🔥 נכסים מומלצים</h2>
            <p className={styles.sectionSubtitle}>בדוק את הנכסים המדהימים הזמינים כעת</p>
          </div>

          <div className={styles.propertyGrid}>
            {featuredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={handleEdit}
                currentUser={currentUser}
                isFavorite={userFavorites.includes(property.id)}
                showEditButtons={false}
                showPhoneDirectly={false}
              />
            ))}
          </div>

          <div className={styles.viewAllContainer}>
            <button onClick={handleAllProperties} className={styles.viewAllButton}>
            {t("View all properties")} →
            </button>
          </div>
        </section>
      ) : (
        <section className={styles.featuredSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🔥 נכסים מומלצים</h2>
            <p className={styles.sectionSubtitle}>אין נכסים ציבוריים זמינים כרגע</p>
          </div>
        </section>
      )}

      {/* קריאה לפעולה למשתמשים לא מחוברים */}
      {!currentUser && (
        <section className={styles.callToAction}>
          <div className={styles.ctaCard}>
            <h3>🚀 התחל עכשיו!</h3>
            <p>הצטרף לאלפים שמנהלים את הנכסים שלהם באתר</p>
            <div className={styles.ctaButtons}>
              <Link to="/register" className={styles.ctaButton}>הרשמה חינמית</Link>
              <Link to="/login" className={styles.ctaButtonSecondary}>יש לי כבר חשבון</Link>
            </div>
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <p>© 2025 נכסים בישראל. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}

export default Home;
