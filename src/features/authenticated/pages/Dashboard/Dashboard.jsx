import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import styles from "./Dashboard.module.css";
import PropertyCard from "../../components/PropertyCard/PropertyCard";
import PropertyForm from "../../../shared/components/PropertyForm/PropertyForm";
import AdvancedFilters from "../../../public/components/AdvancedFilters/AdvancedFilters";
import { getProperties as getPropertiesAPI, getPublicProperties as getPublicPropertiesAPI } from "../../../../services/api";
import { setProperties } from "../../../../store/propertySlice";
import { toast } from "react-toastify";

function Dashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const properties = useSelector((state) => state.property?.properties || []);
  const userFavorites = useSelector((state) => state.property?.userFavorites || []);
  const currentUser = useSelector((state) => state.user?.currentUser);
  
  const [isLoading, setIsLoading] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState("all");
  
  // State לפילטרים המתקדמים
  const [filters, setFilters] = useState({
    searchTerm: "",
    status: "הכל",
    type: "הכל",
    city: "הכל",
    minPrice: "",
    maxPrice: "",
    minRooms: "",
    maxRooms: "",
    minSize: "",
    maxSize: "",
    parking: false,
    elevator: false,
    balcony: false,
    furnished: false,
    pets: false,
    airConditioner: false,
    renovated: false,
    accessibility: false,
    sortBy: "createdAt-desc",
  });

  // טעינת נכסים מה-API כשהקומפוננטה נטענת
  useEffect(() => {
    const loadProperties = async () => {
      setIsLoading(true);
      try {
        let data;
        
        if (currentUser) {
          // משתמש מחובר - טוען את הנכסים שלו + נכסים ציבוריים
          console.log("🌐 [DASHBOARD] טוען נכסים מהשרת (משתמש מחובר)...");
          
          // נטען נכסים ציבוריים
          data = await getPublicPropertiesAPI();
          
          // נטען גם את הנכסים הפרטיים שלו
          try {
            const myData = await getPropertiesAPI();
            // נמזג את שני הרשימות (בלי כפילויות)
            const publicPropertyIds = data.properties.map(p => p._id.toString());
            
            // נוסיף נכסים פרטיים שלא נמצאים ברשימה הציבורית
            const privateProperties = myData.properties.filter(
              p => !publicPropertyIds.includes(p._id.toString())
            );
            
            data.properties = [...data.properties, ...privateProperties];
            data.count = data.properties.length;
          } catch (error) {
            console.warn("⚠️ [DASHBOARD] לא הצלחנו לטעון נכסים פרטיים:", error);
          }
        } else {
          // משתמש אורח - טוען נכסים ציבוריים בלבד
          console.log("🌐 [DASHBOARD] טוען נכסים ציבוריים מהשרת (אורח)...");
          data = await getPublicPropertiesAPI();
        }
        
        console.log("✅ [DASHBOARD] נכסים נטענו:", data.count);
        
        // המרת הנכסים מהפורמט של השרת לפורמט של הקליינט
        const formattedProperties = data.properties.map(prop => ({
          id: prop._id,
          title: prop.title,
          description: prop.description,
          price: prop.price,
          status: prop.status,
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
        }));
        
        dispatch(setProperties(formattedProperties));
      } catch (error) {
        console.error("❌ [DASHBOARD] שגיאה בטעינת נכסים:", error);
        toast.error(error.message || "שגיאה בטעינת נכסים");
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, [currentUser, dispatch]);

  const handleEdit = (property) => {
    setEditingProperty(property);
    setShowForm(true);
  };
  
  const handleAdd = () => {
    setEditingProperty(null);
    setShowForm(true);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProperty(null);
  };

  // פונקציה לקבלת פילטרים מהקומפוננטה
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // פונקציה עזר להמרת סטטוס לעברית
  const getStatusInHebrew = (status) => {
    if (status === 'available' || status === 'Available') return 'זמין';
    if (status === 'sold' || status === 'Sold') return 'נמכר';
    if (status === 'unavailable' || status === 'Unavailable') return 'לא זמין';
    return status;
  };

  // לוגיקת סינון וחיפוש מתקדמת
  const filteredAndSortedProperties = useMemo(() => {
    let filtered = properties;

    // 1. סינון לפי מצב תצוגה
    if (currentUser) {
      if (viewMode === "myProperties") {
        filtered = properties.filter(p => p.ownerId === currentUser.email);
      } else if (viewMode === "favorites") {
        filtered = properties.filter(p => userFavorites.includes(p.id));
      } else {
        // all - מציג נכסים ציבוריים או שלי
        filtered = properties.filter(p => p.isPublic === true || p.ownerId === currentUser.email);
      }
    } else {
      // אורח - רק ציבוריים
      filtered = properties.filter(p => p.isPublic === true);
    }

    // 2. חיפוש טקסט חופשי
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.address?.toLowerCase().includes(searchLower)
      );
    }

    // 3. סינון לפי סטטוס
    if (filters.status !== "הכל") {
      filtered = filtered.filter(p => getStatusInHebrew(p.status) === filters.status);
    }

    // 4. סינון לפי סוג נכס
    if (filters.type !== "הכל") {
      filtered = filtered.filter(p => p.type === filters.type);
    }

    // 5. סינון לפי עיר
    if (filters.city !== "הכל") {
      filtered = filtered.filter(p => {
        const propertyCity = p.city || p.location || "";
        return propertyCity === filters.city;
      });
    }

    // 6. סינון לפי טווח מחירים
    if (filters.minPrice) {
      filtered = filtered.filter(p => p.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.price <= Number(filters.maxPrice));
    }

    // 7. סינון לפי מספר חדרים
    if (filters.minRooms) {
      filtered = filtered.filter(p => p.rooms >= Number(filters.minRooms));
    }
    if (filters.maxRooms) {
      filtered = filtered.filter(p => p.rooms <= Number(filters.maxRooms));
    }

    // 8. סינון לפי שטח
    if (filters.minSize) {
      filtered = filtered.filter(p => p.size >= Number(filters.minSize));
    }
    if (filters.maxSize) {
      filtered = filtered.filter(p => p.size <= Number(filters.maxSize));
    }

    // 9. סינון לפי תכונות
    if (filters.parking) filtered = filtered.filter(p => p.parking === true);
    if (filters.elevator) filtered = filtered.filter(p => p.elevator === true);
    if (filters.balcony) filtered = filtered.filter(p => p.balcony === true);
    if (filters.furnished) filtered = filtered.filter(p => p.furnished === true);
    if (filters.pets) filtered = filtered.filter(p => p.pets === true);
    if (filters.airConditioner) filtered = filtered.filter(p => p.airConditioner === true);
    if (filters.renovated) filtered = filtered.filter(p => p.renovated === true);
    if (filters.accessibility) filtered = filtered.filter(p => p.accessibility === true);

    // 10. מיון
    const [sortField, sortDirection] = filters.sortBy.split("-");
    
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case "price":
          aVal = a.price || 0;
          bVal = b.price || 0;
          break;
        case "size":
          aVal = a.size || 0;
          bVal = b.size || 0;
          break;
        case "rooms":
          aVal = a.rooms || 0;
          bVal = b.rooms || 0;
          break;
        case "createdAt":
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }

      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [properties, currentUser, userFavorites, viewMode, filters]);

  const visiblePropertiesCount = useMemo(() => {
    if (currentUser) {
      return properties.filter(p => p.isPublic === true || p.ownerId === currentUser.email).length;
    }
    return properties.filter(p => p.isPublic === true).length;
  }, [properties, currentUser]);

  const myPropertiesCount = useMemo(() => {
    return currentUser ? properties.filter(p => p.ownerId === currentUser.email).length : 0;
  }, [properties, currentUser]);

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>
          {currentUser ? `${t("Dashboard")} - ${currentUser.name}` : t("Properties in Israel")}
        </h1>
        <p>
          {currentUser 
            ? t("Manage your properties and add new ones") 
            : t("Browse public properties in the system")
          }
        </p>
      </header>

      {currentUser && (
        <section className={styles.actions}>
          <button className={styles.addPropertyButton} onClick={handleAdd}>
            + {t("Add New Property")}
          </button>
          <div className={styles.viewModeButtons}>
            <button
              className={viewMode === "all" ? styles.active : ""}
              onClick={() => setViewMode("all")}
            >
              {t("All Properties")} ({visiblePropertiesCount})
            </button>
            <button
              className={viewMode === "myProperties" ? styles.active : ""}
              onClick={() => setViewMode("myProperties")}
            >
              {t("My Properties")} ({myPropertiesCount})
            </button>
            <button
              className={viewMode === "favorites" ? styles.active : ""}
              onClick={() => setViewMode("favorites")}
            >
              {t("Favorites")} ({userFavorites.length})
            </button>
          </div>
        </section>
      )}

      <AdvancedFilters 
        onFiltersChange={handleFiltersChange}
        propertiesCount={filteredAndSortedProperties.length}
      />

      {!currentUser && (
        <div className={styles.guestMessage}>
          <p>
            🔍 {t("You see only public properties")} ({properties.filter(p => p.isPublic === true).length} {t("properties")})
          </p>
          <p>
            {t("To add and save favorites")} - <a href="/login">{t("Login")}</a> {t("or")} <a href="/register">{t("Register")}</a>
          </p>
        </div>
      )}

      {showForm && currentUser && (
        <PropertyForm
          property={editingProperty}
          onClose={handleCloseForm}
          currentUser={currentUser}
        />
      )}

      {isLoading ? (
        <div className={styles.loading}>
          <p>{t("Loading properties...")}</p>
        </div>
      ) : (
        <section className={styles.propertyList}>
          {filteredAndSortedProperties.length > 0 ? (
            filteredAndSortedProperties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onEdit={handleEdit}
                currentUser={currentUser}
                isFavorite={userFavorites.includes(p.id)}
              />
            ))
          ) : (
            <div className={styles.noProperties}>
              <p>{t("No properties found for selected criteria")}</p>
              {!currentUser && <p>{t("Properties may be private - log in to see more")}</p>}
            </div>
          )}
        </section>
      )}

      {currentUser && (
        <section className={styles.stats}>
          <div className={styles.statCard}>
            <h3>{t("My Properties")}</h3>
            <p>{myPropertiesCount}</p>
          </div>
          <div className={styles.statCard}>
            <h3>{t("Favorites")}</h3>
            <p>{userFavorites.length}</p>
          </div>
          <div className={styles.statCard}>
            <h3>{t("Available Properties")}</h3>
            <p>{filteredAndSortedProperties.filter(p => getStatusInHebrew(p.status) === "זמין").length}</p>
          </div>
        </section>
      )}
    </div>
  );
}

export default Dashboard;