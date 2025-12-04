// ========================================
// API Service - שירות לתקשורת עם השרת
// ========================================

import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://properties-in-israel-backend.onrender.com/api';


// ========================================
// פונקציה עזר ליצירת headers עם token
// ========================================
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// ========================================
// ✅ פונקציה פשוטה לטיפול בתגובות
// ========================================
const handleResponse = async (response) => {
  // אם הבקשה הצליחה - נחזיר את הנתונים
  if (response.ok) {
    return await response.json();
  }
  
  // ✅ אם קיבלנו 401 - מציג הודעה ידידותית ומנתק
  if (response.status === 401) {
    console.warn('⚠️ [API] קיבלתי 401 - הטוקן פג תוקף, מנתק...');
    
    // ✅ הודעה ידידותית למשתמש
    toast.info('⏰ פג תוקף החיבור - נא להתחבר מחדש', {
      position: 'top-center',
      autoClose: 3000,
      hideProgressBar: false,
      closeButton: true,
      pauseOnHover: true,
    });
    
    localStorage.removeItem('token');
    
    // ✅ המתנה קצרה כדי שהמשתמש יראה את ההודעה
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
    
    throw new Error('נדרשת התחברות מחדש');
  }
  
  // שגיאות אחרות
  const data = await response.json().catch(() => ({ message: 'שגיאה בשרת' }));
  throw new Error(data.message || 'שגיאה בשרת');
};

// ========================================
// ✅ פונקציה פשוטה לביצוע fetch
// ========================================
const simpleFetch = async (url, options = {}) => {
  const requestStartTime = Date.now();
  
  try {
    const response = await fetch(url, options);
    
    // ✅ אם הבקשה לקחה יותר מ-5 שניות (השרת התעורר מ-sleep)
    const requestDuration = Date.now() - requestStartTime;
    if (requestDuration > 5000) {
      console.log('☕ [API] הבקשה לקחה', Math.round(requestDuration / 1000), 'שניות - השרת התעורר מ-sleep');
    }
    
    return await handleResponse(response);
  } catch (error) {
    throw error;
  }
};

// ========================================
// Authentication API
// ========================================

/**
 * התחברות משתמש
 */
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await handleResponse(response);
  
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  
  return data;
};

/**
 * הרשמת משתמש חדש
 */
export const register = async (name, email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  
  const data = await handleResponse(response);
  
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  
  return data;
};

/**
 * קבלת פרטי המשתמש המחובר
 */
export const getMe = async () => {
  return simpleFetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
};

/**
 * התנתקות
 */
export const logout = async () => {
  console.log("🔐 [API] מבצע logout בשרת...");
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    const data = await handleResponse(response);
    console.log("✅ [API] logout הושלם בשרת");
    return data;
  } catch (error) {
    console.warn("⚠️ [API] שגיאה ב-logout בשרת:", error);
    throw error;
  } finally {
    localStorage.removeItem('token');
    console.log("🗑️ [API] Token נמחק מ-localStorage");
  }
};

// ========================================
// Properties API
// ========================================

export const getPublicProperties = async () => {
  return simpleFetch(`${API_BASE_URL}/properties/public`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
};

export const getProperties = async () => {
  return simpleFetch(`${API_BASE_URL}/properties`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
};

export const getPropertyById = async (id) => {
  return simpleFetch(`${API_BASE_URL}/properties/${id}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
};

export const createProperty = async (propertyData) => {
  return simpleFetch(`${API_BASE_URL}/properties`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(propertyData)
  });
};

export const updateProperty = async (id, propertyData) => {
  return simpleFetch(`${API_BASE_URL}/properties/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(propertyData)
  });
};

export const deleteProperty = async (id) => {
  return simpleFetch(`${API_BASE_URL}/properties/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
};

export const updatePropertyStatus = async (id, status) => {
  return simpleFetch(`${API_BASE_URL}/properties/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
};

// ========================================
// Favorites API
// ========================================

export const getFavorites = async () => {
  return simpleFetch(`${API_BASE_URL}/favorites`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
};

export const toggleFavoriteAPI = async (propertyId) => {
  return simpleFetch(`${API_BASE_URL}/favorites/${propertyId}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
};

// ==========================
// Notification Service
// ==========================

let notificationsRequestInProgress = false;
let retryCount = 0;
const MAX_RETRIES = 2;
const POLLING_INTERVAL = 60000; // 60 שניות

let pollingTimer = null;

// פונקציה חכמה לטעינת התראות
export const getNotifications = async () => {
  if (notificationsRequestInProgress) {
    console.log("⏳ [Notifications] בקשה כבר פעילה, מחכה להשלמתה");
    return null;
  }

  notificationsRequestInProgress = true;

  try {
    const response = await simpleFetch(`${API_BASE_URL}/notifications`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    notificationsRequestInProgress = false;
    retryCount = 0;
    return response;

  } catch (error) {
    notificationsRequestInProgress = false;

    // טיפול ב-429 – Too Many Requests
    if (error?.response?.status === 429 && retryCount < MAX_RETRIES) {
      retryCount++;
      const waitTime = Math.pow(2, retryCount) * 1000;
      console.warn(`⚠️ [Notifications] 429 – מחכה ${waitTime / 1000} שניות לפני retry #${retryCount}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return getNotifications();
    }

    console.error("❌ [Notifications] שגיאה בטעינת התראות:", error);
    return null;
  }
};

// פונקציה להפעלה של polling חכם
export const startNotificationsPolling = () => {
  if (pollingTimer) return;

  pollingTimer = setInterval(async () => {
    const data = await getNotifications();
    if (data) {
      console.log(`✅ [Notifications] התראות עודכנו: ${data.notifications?.length || 0}`);
    }
  }, POLLING_INTERVAL);
};

// פונקציה לעצירת ה-polling
export const stopNotificationsPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

// ==========================
// פונקציות נוספות לניהול התראות
// ==========================

export const markNotificationAsRead = async (notificationId) => {
  return simpleFetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
};

export const markAllNotificationsAsRead = async () => {
  return simpleFetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
};

export const deleteNotificationAPI = async (notificationId) => {
  return simpleFetch(`${API_BASE_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
};

// ========================================
// Users API
// ========================================

export const deleteAccount = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/account`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  const data = await handleResponse(response);
  
  localStorage.removeItem('token');
  localStorage.removeItem('userSettings');
  
  return data;
};

// ========================================
// Helper Functions
// ========================================

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const getToken = () => {
  return localStorage.getItem('token');
};
