import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import styles from "./AdvancedFilters.module.css";
import { sortedCities as israelCities } from "../../../../utils/israelCities";

function AdvancedFilters({ onFiltersChange, propertiesCount }) {
  const { t } = useTranslation();
  const properties = useSelector((state) => state.property?.properties || []);
  
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

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
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
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const propertyTypes = [
    "הכל",
    "דירה",
    "בית",
    "פנטהאוז",
    "דופלקס",
    "משרד",
    "מגרש",
    "מחסן",
    "חנות",
    "וילה",
    "קוטג'",
  ];

  const statuses = ["הכל", "זמין", "נמכר", "לא זמין"];

  // חילוץ ערים ייחודיות מהנכסים ומיזוג עם רשימת הערים הקבועה
  const allCities = useMemo(() => {
    // חילוץ ערים מהנכסים (city או location)
    const citiesFromProperties = properties
      .map(prop => prop.city || prop.location)
      .filter(city => city && city.trim() !== "" && city !== "other");
    
    // יצירת Set של ערים ייחודיות
    const uniqueCities = new Set([...israelCities, ...citiesFromProperties]);
    
    // המרה ל-array ומיון לפי א-ב
    return Array.from(uniqueCities).sort((a, b) => a.localeCompare(b, "he"));
  }, [properties]);

  const sortOptions = [
    { value: "createdAt-desc", label: "מהחדש לישן" },
    { value: "createdAt-asc", label: "מהישן לחדש" },
    { value: "price-asc", label: "מחיר: נמוך לגבוה" },
    { value: "price-desc", label: "מחיר: גבוה לנמוך" },
    { value: "size-asc", label: "שטח: קטן לגדול" },
    { value: "size-desc", label: "שטח: גדול לקטן" },
    { value: "rooms-asc", label: "חדרים: מעט להרבה" },
    { value: "rooms-desc", label: "חדרים: הרבה למעט" },
  ];

  return (
    <div className={styles.filtersContainer}>
      {/* שורה ראשונה - חיפוש + פילטרים בסיסיים */}
      <div className={styles.basicFilters}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            placeholder="🔍 חפש נכס לפי כותרת..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>📍 מיקום</label>
          <select
            value={filters.city}
            onChange={(e) => handleFilterChange("city", e.target.value)}
            className={styles.select}
          >
            <option value="הכל">הכל</option>
            {allCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>🏠 סוג נכס</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className={styles.select}
          >
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>⚡ סטטוס</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className={styles.select}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <button
         className={styles.advancedToggle}
            onClick={() => setShowAdvanced(!showAdvanced)}
             >
            {showAdvanced ? `▲ ${t("Close")}` : `▼ ${t("Advanced")}`}
             </button>
           </div>

      {/* פילטרים מתקדמים */}
      {showAdvanced && (
        <div className={styles.advancedFilters}>
          {/* טווח מחירים */}
          <div className={styles.rangeFilter}>
            <label>💰 מחיר</label>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                placeholder="מינימום"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange("minPrice", e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="מקסימום"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
              />
            </div>
          </div>

          {/* מספר חדרים */}
          <div className={styles.rangeFilter}>
            <label>🛏️ חדרים</label>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                placeholder="מינימום"
                value={filters.minRooms}
                onChange={(e) => handleFilterChange("minRooms", e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="מקסימום"
                value={filters.maxRooms}
                onChange={(e) => handleFilterChange("maxRooms", e.target.value)}
              />
            </div>
          </div>

          {/* שטח במ"ר */}
          <div className={styles.rangeFilter}>
            <label>📐 שטח (מ"ר)</label>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                placeholder="מינימום"
                value={filters.minSize}
                onChange={(e) => handleFilterChange("minSize", e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="מקסימום"
                value={filters.maxSize}
                onChange={(e) => handleFilterChange("maxSize", e.target.value)}
              />
            </div>
          </div>

          {/* תכונות נוספות */}
          <div className={styles.features}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={filters.parking}
                onChange={(e) => handleFilterChange("parking", e.target.checked)}
              />
              🚗 חניה
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={filters.elevator}
                onChange={(e) => handleFilterChange("elevator", e.target.checked)}
              />
              🛗 מעלית
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={filters.balcony}
                onChange={(e) => handleFilterChange("balcony", e.target.checked)}
              />
              🏖️ מרפסת
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={filters.furnished}
                onChange={(e) => handleFilterChange("furnished", e.target.checked)}
              />
              🛋️ מרוהט
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={filters.airConditioner}
                onChange={(e) => handleFilterChange("airConditioner", e.target.checked)}
              />
              ❄️ מיזוג אוויר
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={filters.renovated}
                onChange={(e) => handleFilterChange("renovated", e.target.checked)}
              />
              ✨ משופץ
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={filters.accessibility}
                onChange={(e) => handleFilterChange("accessibility", e.target.checked)}
              />
              ♿ נגיש
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={filters.pets}
                onChange={(e) => handleFilterChange("pets", e.target.checked)}
              />
              🐕 מותר חיות מחמד
            </label>
          </div>
        </div>
      )}

      {/* שורת מיון ותוצאות */}
      <div className={styles.sortBar}>
        <div className={styles.resultsCount}>
          <strong>{propertiesCount}</strong> נכסים נמצאו
        </div>

        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          className={styles.sortSelect}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              מיין לפי: {option.label}
            </option>
          ))}
        </select>

        <button onClick={handleReset} className={styles.resetButton}>
           🔄 {t("Clear filters")}
         </button>
      </div>
    </div>
  );
}

export default AdvancedFilters;