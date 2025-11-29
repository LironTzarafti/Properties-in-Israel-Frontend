import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./PropertyCard.module.css";
import { useDispatch } from "react-redux";
import { deleteProperty, toggleFavoriteLocal } from "../../../../store/propertySlice";
import { toast } from "react-toastify";
import { useTranslation } from 'react-i18next';
import { deleteProperty as deletePropertyAPI, toggleFavoriteAPI } from "../../../../services/api";

function PropertyCard({ property, onEdit, currentUser, isFavorite = false, showEditButtons = true, showPhoneDirectly = false }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק את הנכס הזה?")) {
      return;
    }

    setIsDeleting(true);
    try {
      // תמיכה בשני פורמטים של ID: property._id או property.id
      const propertyId = property._id || property.id;
      console.log("🗑️ [PROPERTY_CARD] מוחק נכס:", propertyId);
      await deletePropertyAPI(propertyId);
      
      console.log("✅ [PROPERTY_CARD] נכס נמחק בהצלחה");
      dispatch(deleteProperty(propertyId));
      toast.success("הנכס נמחק בהצלחה!");
    } catch (error) {
      console.error("❌ [PROPERTY_CARD] שגיאה במחיקת נכס:", error);
      toast.error(error.message || "שגיאה במחיקת הנכס");
    } finally {
      setIsDeleting(false);
    }
  };

  // 🆕 פונקציה מעודכנת לטיפול במועדפים
  const handleToggleFavorite = async (event) => {
    event.stopPropagation();
    
    // אם המשתמש לא מחובר, נפנה אותו להתחברות
    if (!currentUser) {
      toast.info(t("Please login to add properties to favorites"));
      window.location.href = "/login";
      return;
    }
    
    try {
      // עדכון אופטימיסטי (מיידי ב-UI)
      const propertyId = property.id || property._id;
      dispatch(toggleFavoriteLocal(propertyId));
      
      // שליחה לשרת
      const result = await toggleFavoriteAPI(propertyId);
      
      // הודעה למשתמש
      toast.success(result.action === 'added' ? t("Added to favorites") : t("Removed from favorites"));
      
    } catch (error) {
      // במקרה של שגיאה - מחזיר את המצב הקודם
      const propertyId = property.id || property._id;
      dispatch(toggleFavoriteLocal(propertyId));
      toast.error(error.message || "שגיאה בעדכון מועדפים");
      console.error("❌ [PROPERTY_CARD] שגיאה בעדכון מועדפים:", error);
    }
  };

  const isOwner = currentUser && property.ownerId === currentUser.email;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // המרת סטטוס מאנגלית לעברית לתצוגה
  const getStatusInHebrew = (status) => {
    if (status === 'available' || status === 'Available') return 'זמין';
    if (status === 'sold' || status === 'Sold') return 'נמכר';
    if (status === 'unavailable' || status === 'Unavailable') return 'לא זמין';
    return status; // אם כבר בעברית או לא מזוהה, מחזיר כמו שהוא
  };

  const getStatusClass = (status) => {
    const hebrewStatus = getStatusInHebrew(status);
    switch (hebrewStatus) {
      case 'זמין': return styles.statusAvailable;
      case 'נמכר': return styles.statusSold;
      case 'לא זמין': return styles.statusUnavailable;
      default: return styles.statusDefault;
    }
  };

  return (
    <div className={styles.propertyCard}>

      {/* ⭐️ אייקון מועדפים - כוכב קטן בצד שמאל עליון (גם לאורחים - יפנה להתחברות) */}
      <div 
        className={`${styles.favoriteIconContainer} ${isFavorite ? styles.favoriteIconActive : ''} ${!currentUser ? styles.favoriteIconGuest : ''}`}
        onClick={handleToggleFavorite}
        title={currentUser 
          ? (isFavorite ? t("Remove from favorites") : t("Add to favorites"))
          : t("Login to add to favorites")
        }
      >
        {/* שימוש באימוג'י כוכב מלא (★) כשהוא אקטיבי, וריק (☆) כשהוא לא */}
        <span className={styles.favoriteIcon}>
          {isFavorite ? '★' : '☆'}
        </span>
      </div>

      {/* כותרת + סטטוס */}
      <div className={styles.cardHeader}>
        <div className={styles.headerContent}>
          <h3 className={styles.propertyTitle}>{property.title}</h3>
          {property.type && <span className={styles.propertyType}>{property.type}</span>}
        </div>
        <span className={`${styles.statusBadge} ${getStatusClass(property.status)}`}>
          {getStatusInHebrew(property.status)}
        </span>
      </div>

      {/* תיאור */}
      {property.description && <p className={styles.description}>{property.description}</p>}

      {/* מיקום */}
      {(property.location || property.city || property.address) && (
        <div className={styles.location}>
          <span className={styles.locationIcon}>📍</span>
          <span className={styles.locationText}>
            {(() => {
              // נציג את המיקום רק פעם אחת - priority: location > city > address
              // אם יש location, נשתמש בו
              if (property.location) {
                return property.location;
              }
              // אם יש city, נשתמש בו
              if (property.city) {
                return property.city;
              }
              // אחרת נשתמש ב-address
              return property.address;
            })()}
          </span>
        </div>
      )}

      {/* מחיר */}
      <div className={styles.priceSection}>
        <span className={styles.priceLabel}>{t("Price")}:</span>
        <span className={styles.priceValue}>{formatPrice(property.price)}</span>
      </div>

      {/* מפרט טכני */}
      <div className={styles.specs}>
        {property.rooms && (
          <div className={styles.specItem}>
            <span className={styles.specIcon}>🛏️</span>
            <span className={styles.specText}>{property.rooms} חדרים</span>
          </div>
        )}
        {property.bedrooms && (
          <div className={styles.specItem}>
            <span className={styles.specIcon}>🚪</span>
            <span className={styles.specText}>{property.bedrooms} שינה</span>
          </div>
        )}
        {property.bathrooms && (
          <div className={styles.specItem}>
            <span className={styles.specIcon}>🚿</span>
            <span className={styles.specText}>{property.bathrooms} אמבטיות</span>
          </div>
        )}
        {property.size && (
          <div className={styles.specItem}>
            <span className={styles.specIcon}>📐</span>
            <span className={styles.specText}>{property.size} מ"ר</span>
          </div>
        )}
        {property.floor !== undefined && (
          <div className={styles.specItem}>
            <span className={styles.specIcon}>🏢</span>
            <span className={styles.specText}>
              קומה {property.floor}
              {property.totalFloors && ` מתוך ${property.totalFloors}`}
            </span>
          </div>
        )}
      </div>

      {/* תכונות נוספות */}
      <div className={styles.features}>
        {property.parking && <span className={styles.featureTag}>🚗 חניה</span>}
        {property.elevator && <span className={styles.featureTag}>🛗 מעלית</span>}
        {property.balcony && <span className={styles.featureTag}>🏖️ מרפסת</span>}
        {property.furnished && <span className={styles.featureTag}>🛋️ מרוהט</span>}
        {property.airConditioner && <span className={styles.featureTag}>❄️ מיזוג</span>}
        {property.renovated && <span className={styles.featureTag}>✨ משופץ</span>}
        {property.accessibility && <span className={styles.featureTag}>♿ נגיש</span>}
        {property.pets && <span className={styles.featureTag}>🐕 מותר חיות מחמד</span>}
      </div>

      {/* מידע בעלות */}
      {property.ownerId && currentUser && (
        <div className={styles.ownerInfo}>
          <span className={isOwner ? styles.myProperty : styles.otherProperty}>
            {isOwner ? t("Your Property") : t("Property of another user")}
          </span>
        </div>
      )}

      {/* כפתורי פעולה - כולל כפתור הצג מספר טלפון הגדול */}
      <div className={styles.cardActions}>
        
        {/* 📞 הצגת מספר טלפון - ישירות או דרך כפתור */}
        {property.phone && showPhoneDirectly ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px" }}>
            <span>📞</span>
            <a href={`tel:${property.phone}`} style={{ color: "#3b82f6", textDecoration: "none", fontWeight: "600" }}>
              {property.phone}
            </a>
            <a 
              href={`https://wa.me/${property.phone.replace(/\D/g,'')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: "#25D366", textDecoration: "none", marginRight: "8px" }}
            >
              WhatsApp
            </a>
          </div>
        ) : property.phone && !showPhoneDirectly ? (
          <button 
            className={styles.showPhoneBtn} 
            onClick={() => setShowPhonePopup(true)}
          >
            📞 הצג מספר טלפון
          </button>
        ) : null}

        {currentUser && showEditButtons ? (
          <div className={styles.actionButtons}>
            {/* כפתורי ערוך/מחק קטנים */}
            {isOwner && (
              <div className={styles.ownerActions}>
              <button onClick={() => onEdit(property)} className={styles.editBtn}>
                ✏️ {t("Edit")}
              </button>
              <button 
                onClick={handleDelete} 
                className={styles.deleteBtn}
                disabled={isDeleting}
              >
                🗑️ {isDeleting ? t("Deleting...") : t("Delete")}
              </button>
            </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Popup מספר טלפון פר כרטיס */}
      {showPhonePopup && (
        <div className={styles.phonePopupOverlay}>
          <div className={styles.phonePopup}>
            <h2>{property.phone}</h2>
            <div className={styles.popupActions}>
              <a href={`tel:${property.phone}`} className={styles.popupBtn}>חייג</a>
              <a href={`https://wa.me/${property.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className={styles.popupBtn}>WhatsApp</a>
            </div>
            <button className={styles.closePopup} onClick={() => setShowPhonePopup(false)}>סגור</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyCard;