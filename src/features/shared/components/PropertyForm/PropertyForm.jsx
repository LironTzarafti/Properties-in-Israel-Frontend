import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addProperty, updateProperty } from "../../../../store/propertySlice";
import { setNotifications } from "../../../../store/userSlice";
import { useTranslation } from "react-i18next";
import styles from "./PropertyForm.module.css";
import { toast } from "react-toastify";
import { 
  createProperty as createPropertyAPI, 
  updateProperty as updatePropertyAPI,
  getNotifications
} from "../../../../services/api";
import { sortedCities as israelCities } from "../../../../utils/israelCities";

function PropertyForm({ property, onClose, currentUser }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    status: "זמין",
    type: "",
    city: "",
    newCity: "", // עבור "אחר"
    rooms: "",
    size: "",
    phone: "",
    parking: false,
    elevator: false,
    balcony: false,
    furnished: false,
    pets: false,
    airConditioner: false,
    renovated: false,
    accessibility: false,
    isPublic: true,
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) {
      toast.error(t("Please log in to add a property"));
      onClose();
      return;
    }
  }, [currentUser, onClose, t]);

  useEffect(() => {
    if (property) {
      const propertyCity = property.city || property.location || "";
      // בדיקה אם העיר נמצאת ברשימת הערים הקבועה
      const isCityInList = israelCities.includes(propertyCity);
      
      setFormData({
        ...formData,
        title: property.title || "",
        description: property.description || "",
        price: property.price || "",
        location: property.location || property.city || "",
        status: property.status === 'available' ? 'זמין' : property.status === 'sold' ? 'נמכר' : property.status === 'unavailable' ? 'לא זמין' : property.status || "זמין",
        type: property.type || "",
        city: isCityInList ? propertyCity : (propertyCity ? "other" : ""),
        newCity: isCityInList ? "" : propertyCity,
        rooms: property.rooms || "",
        size: property.size || "",
        phone: property.phone || "",
        parking: property.parking || false,
        elevator: property.elevator || false,
        balcony: property.balcony || false,
        furnished: property.furnished || false,
        pets: property.pets || false,
        airConditioner: property.airConditioner || false,
        renovated: property.renovated || false,
        accessibility: property.accessibility || false,
        isPublic: property.isPublic !== undefined ? property.isPublic : true,
      });
    }
  }, [property]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error(t("Please log in to add a property"));
      onClose();
      return;
    }

    // בחר עיר חדשה אם קיימת
    const finalCity = formData.city === "other" ? formData.newCity.trim() : formData.city;

    // בדיקות חובה
    if (!formData.title || !formData.price || !finalCity || !formData.phone) {
      toast.error("אנא מלא את כל השדות הנדרשים");
      setError("אנא מלא את כל השדות הנדרשים (כותרת, מחיר, מיקום, טלפון)");
      return;
    }

    // בדיקת מספר טלפון - 9-10 ספרות בלבד
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 9 || phoneDigits.length > 10) {
      toast.error("מספר טלפון חייב להכיל 9-10 ספרות");
      setError("מספר טלפון חייב להכיל 9-10 ספרות");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const statusMap = {
        'זמין': 'available',
        'Available': 'available',
        'נמכר': 'sold',
        'Sold': 'sold',
        'לא זמין': 'unavailable',
        'Unavailable': 'unavailable'
      };
      
      const propertyData = {
        title: formData.title,
        description: formData.description || "",
        price: Number(formData.price),
        location: finalCity,
        status: statusMap[formData.status] || formData.status || 'available',
        isPublic: formData.isPublic !== undefined ? formData.isPublic : true,
        phone: phoneDigits,
        rooms: formData.rooms ? Number(formData.rooms) : undefined,
        size: formData.size ? Number(formData.size) : undefined,
        type: formData.type || "",
        parking: formData.parking || false,
        elevator: formData.elevator || false,
        balcony: formData.balcony || false,
        furnished: formData.furnished || false,
        pets: formData.pets || false,
        airConditioner: formData.airConditioner || false,
        renovated: formData.renovated || false,
        accessibility: formData.accessibility || false,
      };

      if (property && (property.id || property._id)) {
        const propertyId = property._id || property.id;
        const updatedProperty = await updatePropertyAPI(propertyId, propertyData);
        dispatch(updateProperty({
          ...updatedProperty,
          id: updatedProperty._id || updatedProperty.id,
          status: updatedProperty.status === 'available' ? 'זמין' : updatedProperty.status === 'sold' ? 'נמכר' : updatedProperty.status === 'unavailable' ? 'לא זמין' : updatedProperty.status,
          ownerId: currentUser.email,
        }));
        toast.success("הנכס עודכן בהצלחה!");
      } else {
        const newProperty = await createPropertyAPI(propertyData);
        dispatch(addProperty({
          ...newProperty,
          id: newProperty._id || newProperty.id,
          status: newProperty.status === 'available' ? 'זמין' : newProperty.status === 'sold' ? 'נמכר' : newProperty.status === 'unavailable' ? 'לא זמין' : newProperty.status,
          city: finalCity,
          location: finalCity,
          ownerId: currentUser.email,
        }));
        toast.success("הנכס נוסף בהצלחה!");
      }
      
      // רענון התראות אחרי יצירה/עדכון נכס (real-time)
      try {
        const notificationsData = await getNotifications();
        dispatch(setNotifications(notificationsData));
        console.log("✅ [PROPERTY_FORM] התראות עודכנו:", notificationsData.unreadCount, "לא נקראו");
      } catch (notifError) {
        console.warn("⚠️ [PROPERTY_FORM] לא הצלחנו לרענן התראות:", notifError);
      }
      
      onClose();
    } catch (error) {
      console.error("❌ [PROPERTY_FORM] Error:", error);
      setError(error.message || "אירעה שגיאה");
      toast.error(error.message || "אירעה שגיאה");
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) return null;

    
  const propertyTypes = ["דירה","וילה","קוטג'", "בית", "פנטאהוז", "דופלקס", "משרד", "מגרש", "חנות"];

  return (
    <div className={styles.formOverlay}>
      <form className={styles.propertyForm} onSubmit={handleSubmit}>
        <h2>{property ? "ערוך נכס" : "הוסף נכס חדש"}</h2>
        {error && <p className={styles.error}>{error}</p>}

        <input
          type="text"
          placeholder="שם הנכס"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          required
        />

        <textarea
          placeholder="תיאור הנכס"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
        />

        <input
          type="number"
          placeholder="מחיר (₪)"
          value={formData.price}
          onChange={(e) => handleChange("price", e.target.value)}
          required
        />

        {/* עיר עם אפשרות "אחר" */}
        <select 
          value={formData.city} 
          onChange={(e) => handleChange("city", e.target.value)}
          required
        >
          <option value="">בחר עיר/ישוב</option>
          {israelCities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
          <option value="other">אחר</option>
        </select>

        {formData.city === "other" && (
          <input
            type="text"
            placeholder="הקלד עיר חדשה"
            value={formData.newCity}
            onChange={(e) => handleChange("newCity", e.target.value)}
            required
          />
        )}

        <input
          type="text"
          placeholder="מספר טלפון נייד (9-10 ספרות)"
          value={formData.phone}
          onChange={(e) => {
            // מאפשר רק ספרות
            const value = e.target.value.replace(/\D/g, "");
            if (value.length <= 10) {
              handleChange("phone", value);
            }
          }}
          maxLength={10}
          required
        />
        {formData.phone && (formData.phone.replace(/\D/g, "").length < 9 || formData.phone.replace(/\D/g, "").length > 10) && (
          <p className={styles.error} style={{ fontSize: "0.85em", color: "red", marginTop: "-12px", marginBottom: "0" }}>
            מספר טלפון חייב להכיל 9-10 ספרות
          </p>
        )}

        <select value={formData.status} onChange={(e) => handleChange("status", e.target.value)}>
          <option value="זמין">זמין</option>
          <option value="נמכר">נמכר</option>
          <option value="לא זמין">לא זמין</option>
        </select>

        <select value={formData.type} onChange={(e) => handleChange("type", e.target.value)}>
          <option value="">בחר סוג נכס</option>
          {propertyTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="🛏️ מספר חדרים"
          value={formData.rooms}
          onChange={(e) => handleChange("rooms", e.target.value)}
        />

        <input
          type="number"
          placeholder="📐 גודל במ״ר"
          value={formData.size}
          onChange={(e) => handleChange("size", e.target.value)}
        />

        <div className={styles.features}>
          <label><input type="checkbox" checked={formData.parking} onChange={(e) => handleChange("parking", e.target.checked)} /> 🚗 חניה</label>
          <label><input type="checkbox" checked={formData.elevator} onChange={(e) => handleChange("elevator", e.target.checked)} /> 🛗 מעלית</label>
          <label><input type="checkbox" checked={formData.balcony} onChange={(e) => handleChange("balcony", e.target.checked)} /> 🏖️ מרפסת</label>
          <label><input type="checkbox" checked={formData.furnished} onChange={(e) => handleChange("furnished", e.target.checked)} /> 🛋️ מרוהט</label>
          <label><input type="checkbox" checked={formData.airConditioner} onChange={(e) => handleChange("airConditioner", e.target.checked)} /> ❄️ מיזוג אוויר</label>
          <label><input type="checkbox" checked={formData.renovated} onChange={(e) => handleChange("renovated", e.target.checked)} /> ✨ משופץ</label>
          <label><input type="checkbox" checked={formData.accessibility} onChange={(e) => handleChange("accessibility", e.target.checked)} /> ♿ נגיש</label>
          <label><input type="checkbox" checked={formData.pets} onChange={(e) => handleChange("pets", e.target.checked)} /> 🐕 מותר חיות מחמד</label>
        </div>

        <label className={styles.checkboxLabel}>
         <input
            type="checkbox"
            checked={formData.isPublic}
            onChange={(e) => handleChange("isPublic", e.target.checked)}
              />
               {t("Show this property to all users (public)")}
             </label>

             <div className={styles.actions}>
              <button type="submit" disabled={isLoading}>
                {isLoading ? t("Saving...") : (property ? t("Save") : t("Add"))}
                </button>
                 <button type="button" onClick={onClose} disabled={isLoading}>
                   {t("Cancel")}
                </button>
                 </div>
             </form>
          </div>
         );
       }

export default PropertyForm;
