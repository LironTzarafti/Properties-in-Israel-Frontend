import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { updateUserProfile } from "../../../../store/userSlice";
import { toast } from "react-toastify";
import styles from "./Profile.module.css";
import { sortedCities as israelCities } from "../../../../utils/israelCities";
import { useTranslation } from "react-i18next";

function Profile() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.currentUser);
  const properties = useSelector((state) => state.property?.properties || []);
  const userFavorites = useSelector((state) => state.property?.userFavorites || []);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
  });
  
  // הגדרות התאמה אישית
  const [preferredCities, setPreferredCities] = useState([]);
  const [preferredPropertyTypes, setPreferredPropertyTypes] = useState([]);
  const [userType, setUserType] = useState("private");
  const [isRealtor, setIsRealtor] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    newProperties: true,
    propertyMatches: true,
    propertyUpdates: true,
  });
  
  const propertyTypes = ["דירה","וילה","קוטג'", "בית", "פנטהאוז", "דופלקס", "משרד", "מגרש", "חנות"];

  // בדיקה אם המשתמש מחובר
  useEffect(() => {
    if (!currentUser) {
      toast.error("עליך להתחבר כדי לצפות בפרופיל");
      navigate("/login");
      return;
    }

    // טעינת נתוני המשתמש לטופס
    setFormData({
      name: currentUser.name || "",
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      address: currentUser.address || "",
      bio: currentUser.bio || "",
    });
    
    // טען העדפות מהמשתמש (אם יש)
    if (currentUser?.preferences) {
      setPreferredCities(currentUser.preferences.preferredCities || []);
      setPreferredPropertyTypes(currentUser.preferences.preferredPropertyTypes || []);
      setUserType(currentUser.preferences.userType || "private");
      setIsRealtor(currentUser.preferences.isRealtor || false);
      if (currentUser.preferences.notificationSettings) {
        setNotificationSettings(currentUser.preferences.notificationSettings);
      }
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ולידציה בסיסית
    if (!formData.name.trim()) {
      toast.error("שם מלא הוא שדה חובה");
      return;
    }

    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("אנא הזן כתובת אימייל תקינה");
      return;
    }

    try {
      // עדכון העדפות ב-DB
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          bio: formData.bio,
          preferences: {
            preferredCities,
            preferredPropertyTypes,
            userType,
            isRealtor,
            notificationSettings
          }
        })
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        // עדכון הפרופיל ב-Redux עם כל הנתונים מהשרת
        dispatch(updateUserProfile(updatedUser));
        setIsEditing(false);
        toast.success("הפרופיל עודכן בהצלחה!");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "שגיאה בעדכון הפרופיל");
      }
    } catch (error) {
      console.error("שגיאה בעדכון פרופיל:", error);
      toast.error("שגיאה בעדכון הפרופיל");
    }
  };
  
  const handleCityToggle = (city) => {
    setPreferredCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };
  
  const handlePropertyTypeToggle = (type) => {
    setPreferredPropertyTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleCancel = () => {
    // איפוס הטופס לערכים המקוריים
    setFormData({
      name: currentUser.name || "",
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      address: currentUser.address || "",
      bio: currentUser.bio || "",
    });
    
    // איפוס העדפות לערכים המקוריים
    if (currentUser?.preferences) {
      setPreferredCities(currentUser.preferences.preferredCities || []);
      setPreferredPropertyTypes(currentUser.preferences.preferredPropertyTypes || []);
      setUserType(currentUser.preferences.userType || "private");
      setIsRealtor(currentUser.preferences.isRealtor || false);
      if (currentUser.preferences.notificationSettings) {
        setNotificationSettings(currentUser.preferences.notificationSettings);
      }
    }
    
    setIsEditing(false);
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

  if (!currentUser) {
    return null;
  }

  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        <div className={styles.profileHeader}>
          <h1>הפרופיל שלי</h1>
          {!isEditing && (
            <button
            className={styles.editBtn}
            onClick={() => setIsEditing(true)}
          >
            ✏️ {t ? t("Edit profile") : "Edit profile"}
          </button>
          )}
        </div>

        <div className={styles.profileContent}>
          {/* צד שמאל - תמונת פרופיל ומידע כללי */}
          <div className={styles.sidebar}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarLarge}>
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} />
                ) : (
                  <span>{getInitials(currentUser.name)}</span>
                )}
              </div>
               {/* isEditing && (
                <button className={styles.changeAvatarBtn}>
                  📷 שנה תמונה
                </button>
              ) */}
            </div>

            <div className={styles.userStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {properties.filter(p => p.ownerId === currentUser.email).length}
                </span>
                <span className={styles.statLabel}>נכסים</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {userFavorites.length}
                </span>
                <span className={styles.statLabel}>מועדפים</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {new Date(currentUser.createdAt || Date.now()).toLocaleDateString('he-IL')}
                </span>
                <span className={styles.statLabel}>תאריך הצטרפות</span>
              </div>
            </div>
          </div>

          {/* צד ימין - פרטי המשתמש */}
          <div className={styles.mainContent}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formSection}>
                <h2>פרטים אישיים</h2>

                <div className={styles.formGroup}>
                  <label htmlFor="name">שם מלא *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={isEditing ? styles.inputEditing : ""}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">אימייל *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={isEditing ? styles.inputEditing : ""}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone">טלפון</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="050-1234567"
                    className={isEditing ? styles.inputEditing : ""}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="address">כתובת</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="עיר, רחוב ומספר"
                    className={isEditing ? styles.inputEditing : ""}
                  />
                </div>
              </div>

              <div className={styles.formSection}>
                <h2>אודות</h2>
                <div className={styles.formGroup}>
                  <label htmlFor="bio">תיאור אישי</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows="4"
                    placeholder="ספר קצת על עצמך..."
                    className={isEditing ? styles.inputEditing : ""}
                  />
                </div>
              </div>

              {/* התאמה אישית */}
              <div className={styles.formSection}>
                <h2>🎯 התאמה אישית</h2>
                
                {/* ערים מועדפות */}
                <div className={styles.formGroup}>
                  <label>ערים מועדפות</label>
                  <p style={{ fontSize: "0.9em", color: "#666", marginBottom: "8px" }}>
                    בחר ערים שאתה מחפש נכסים בהן
                  </p>
                  <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px" }}>
                      {israelCities.map((city) => (
                      <label key={city} style={{ display: "block", padding: "4px", cursor: isEditing ? "pointer" : "default" }}>
                        <input
                          type="checkbox"
                          checked={preferredCities.includes(city)}
                          onChange={() => handleCityToggle(city)}
                          disabled={!isEditing}
                          style={{ marginLeft: "8px" }}
                        />
                        {city}
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* סוגי נכסים מועדפים */}
                <div className={styles.formGroup}>
                  <label>סוגי נכסים מועדפים</label>
                  <p style={{ fontSize: "0.9em", color: "#666", marginBottom: "8px" }}>
                    בחר סוגי נכסים שמעניינים אותך
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {propertyTypes.map((type) => (
                      <label key={type} style={{ display: "flex", alignItems: "center", cursor: isEditing ? "pointer" : "default", padding: "4px 8px", border: "1px solid #e5e7eb", borderRadius: "4px" }}>
                        <input
                          type="checkbox"
                          checked={preferredPropertyTypes.includes(type)}
                          onChange={() => handlePropertyTypeToggle(type)}
                          disabled={!isEditing}
                          style={{ marginLeft: "4px" }}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* סוג משתמש */}
                <div className={styles.formGroup}>
                  <label htmlFor="userType">סוג משתמש</label>
                  <select
                    id="userType"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? styles.inputEditing : ""}
                  >
                    <option value="private">אדם פרטי</option>
                    <option value="business">עסקי</option>
                  </select>
                </div>
                
                {/* נדלן/מפרסם */}
                <div className={styles.formGroup}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: isEditing ? "pointer" : "default" }}>
                    <input
                      type="checkbox"
                      checked={isRealtor}
                      onChange={(e) => setIsRealtor(e.target.checked)}
                      disabled={!isEditing}
                    />
                    נדלן/מפרסם
                  </label>
                  <p style={{ fontSize: "0.9em", color: "#666", marginTop: "4px" }}>
                    האם אתה נדלן או מפרסם נכסים?
                  </p>
                </div>
              </div>

              {/* הגדרות התראות מותאמות */}
              <div className={styles.formSection}>
                <h2>🔔 התראות מותאמות</h2>
                
                <div className={styles.formGroup}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: isEditing ? "pointer" : "default" }}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.newProperties}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, newProperties: e.target.checked }))}
                      disabled={!isEditing}
                    />
                    התראות על נכסים חדשים
                  </label>
                  <p style={{ fontSize: "0.9em", color: "#666", marginTop: "4px" }}>
                    קבל התראות כשנוספים נכסים חדשים התואמים להעדפותיך
                  </p>
                </div>
                
                <div className={styles.formGroup}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: isEditing ? "pointer" : "default" }}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.propertyMatches}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, propertyMatches: e.target.checked }))}
                      disabled={!isEditing}
                    />
                    התראות על התאמות
                  </label>
                  <p style={{ fontSize: "0.9em", color: "#666", marginTop: "4px" }}>
                    קבל התראות על נכסים התואמים בדיוק להעדפותיך
                  </p>
                </div>
                
                <div className={styles.formGroup}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: isEditing ? "pointer" : "default" }}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.propertyUpdates}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, propertyUpdates: e.target.checked }))}
                      disabled={!isEditing}
                    />
                    עדכוני נכסים
                  </label>
                  <p style={{ fontSize: "0.9em", color: "#666", marginTop: "4px" }}>
                    קבל התראות על עדכונים בנכסים שאתה עוקב אחריהם
                  </p>
                </div>
              </div>

              {isEditing && (
                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveBtn}>
                    💾 שמור שינויים
                  </button>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={handleCancel}
                  >
                    ✕ ביטול
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
