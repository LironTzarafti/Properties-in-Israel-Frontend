// ========================================
// API Service - שירות לתקשורת עם השרת
// ========================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://properties-in-israel-backend.onrender.com/api;

// פונקציה עזר ליצירת headers עם token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// פונקציה עזר לטיפול בתגובות
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'שגיאה בשרת');
  }
  
  return data;
};

// ========================================
// Authentication API
// ========================================

/**
 * התחברות משתמש
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise} { _id, name, email, role, token }
 */
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await handleResponse(response);
  
  // שמירת ה-token ב-localStorage
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  
  return data;
};

/**
 * הרשמת משתמש חדש
 * @param {string} name 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise} { _id, name, email, role, token }
 */
export const register = async (name, email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  
  const data = await handleResponse(response);
  
  // שמירת ה-token ב-localStorage
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  
  return data;
};

/**
 * קבלת פרטי המשתמש המחובר
 * @returns {Promise} { _id, name, email, role, ... }
 */
export const getMe = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
};

/**
 * התנתקות
 * @returns {Promise} { message }
 */
export const logout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    await handleResponse(response);
  } finally {
    // תמיד נמחק את ה-token גם אם יש שגיאה
    localStorage.removeItem('token');
  }
};

// ========================================
// Properties API
// ========================================

/**
 * קבלת כל הנכסים הציבוריים (ללא authentication - לאורחים)
 * @returns {Promise} { count, properties: [...] }
 */
export const getPublicProperties = async () => {
  const response = await fetch(`${API_BASE_URL}/properties/public`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  
  return handleResponse(response);
};

/**
 * קבלת כל הנכסים של המשתמש המחובר (דורש authentication)
 * @returns {Promise} { count, properties: [...] }
 */
export const getProperties = async () => {
  const response = await fetch(`${API_BASE_URL}/properties`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
};

/**
 * קבלת נכס בודד לפי ID
 * @param {string} id 
 * @returns {Promise} { _id, title, description, ... }
 */
export const getPropertyById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
};

/**
 * יצירת נכס חדש
 * @param {Object} propertyData - { title, description, price, location, status? }
 * @returns {Promise} { _id, title, description, ... }
 */
export const createProperty = async (propertyData) => {
  const response = await fetch(`${API_BASE_URL}/properties`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(propertyData)
  });
  
  return handleResponse(response);
};

/**
 * עדכון נכס
 * @param {string} id 
 * @param {Object} propertyData - שדות לעדכון
 * @returns {Promise} { _id, title, description, ... }
 */
export const updateProperty = async (id, propertyData) => {
  const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(propertyData)
  });
  
  return handleResponse(response);
};

/**
 * מחיקת נכס
 * @param {string} id 
 * @returns {Promise} { message }
 */
export const deleteProperty = async (id) => {
  const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
};

/**
 * עדכון סטטוס נכס בלבד
 * @param {string} id 
 * @param {string} status - 'available' או 'sold'
 * @returns {Promise} { _id, status, ... }
 */
export const updatePropertyStatus = async (id, status) => {
  const response = await fetch(`${API_BASE_URL}/properties/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  
  return handleResponse(response);
};

// ========================================
// Favorites API
// ========================================

/**
 * קבלת כל המועדפים של המשתמש
 * @returns {Promise} { favorites: [...], favoriteIds: [...] }
 */
export const getFavorites = async () => {
  const response = await fetch(`${API_BASE_URL}/favorites`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
};

/**
 * הוספה/הסרה של נכס מהמועדפים (toggle)
 * @param {string} propertyId 
 * @returns {Promise} { message, favoriteIds, action }
 */
export const toggleFavoriteAPI = async (propertyId) => {
  const response = await fetch(`${API_BASE_URL}/favorites/${propertyId}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
};

// ========================================
// Notifications API
// ========================================

/**
 * קבלת כל ההתראות של המשתמש המחובר
 * @returns {Promise} { notifications: [...], unreadCount: number }
 */
export const getNotifications = async () => {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
};

/**
 * סימון התראה כנקראה
 * @param {string} notificationId 
 * @returns {Promise} { _id, read, ... }
 */
export const markNotificationAsRead = async (notificationId) => {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
};

/**
 * סימון כל ההתראות כנקראו
 * @returns {Promise} { message }
 */
export const markAllNotificationsAsRead = async () => {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
};

/**
 * מחיקת התראה
 * @param {string} notificationId 
 * @returns {Promise} { message }
 */
export const deleteNotificationAPI = async (notificationId) => {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
};

// ========================================
// Users API - 🆕 מחיקת חשבון
// ========================================

/**
 * מחיקת חשבון המשתמש המחובר
 * @returns {Promise} { message }
 */
export const deleteAccount = async () => {
  // שימוש בנתיב auth/account במקום users/:id
  const response = await fetch(`${API_BASE_URL}/auth/account`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  const data = await handleResponse(response);
  
  // מחיקת כל הנתונים המקומיים
  localStorage.removeItem('token');
  localStorage.removeItem('userSettings');
  
  return data;
};

// ========================================
// Helper Functions
// ========================================

/**
 * בדיקה אם יש token שמור
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * קבלת ה-token השמור
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem('token');
};