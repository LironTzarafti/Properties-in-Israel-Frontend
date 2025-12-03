// ========================================
// API Service - שירות לתקשורת עם השרת
// ========================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://properties-in-israel-backend.onrender.com/api';

// ========================================
// ✅ מערכת רענון אוטומטי של טוקן
// ========================================
let isRefreshing = false;
let refreshSubscribers = [];

// פונקציה להוספת בקשות שמחכות לרענון
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// פונקציה לעדכון כל הבקשות שחיכו עם הטוקן החדש
const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

// פונקציה לרענון הטוקן
const refreshAccessToken = async () => {
  try {
    console.log('🔄 [API] מנסה לרענן Access Token...');
    
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // ✅ חשוב! שולח את הקוקי
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Refresh נכשל');
    }
    
    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      console.log('✅ [API] Access Token רוענן בהצלחה');
      return data.token;
    }
    
    throw new Error('לא התקבל טוקן חדש');
  } catch (error) {
    console.error('❌ [API] שגיאה ברענון טוקן:', error);
    // במקרה של כשלון - מנקים הכל ומנתקים
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw error;
  }
};

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
// ✅ פונקציה משופרת לטיפול בתגובות עם רענון אוטומטי
// ========================================
const handleResponse = async (response, originalRequest) => {
  // אם הבקשה הצליחה - פשוט נחזיר את הנתונים
  if (response.ok) {
    return await response.json();
  }
  
  // ✅ אם קיבלנו 401 (Unauthorized) - ננסה לרענן
  if (response.status === 401 && originalRequest) {
    console.warn('⚠️ [API] קיבלתי 401 - מנסה רענון אוטומטי...');
    
    // אם כבר יש תהליך רענון בעבודה - נמתין לו
    if (isRefreshing) {
      console.log('⏳ [API] כבר יש רענון בעבודה, ממתין...');
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          // לאחר הרענון - ננסה שוב את הבקשה המקורית
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          resolve(fetch(originalRequest.url, originalRequest).then(r => r.json()));
        });
      });
    }
    
    // אם זה הניסיון הראשון - נתחיל רענון
    isRefreshing = true;
    
    try {
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      
      // עדכון כל הבקשות שחיכו
      onTokenRefreshed(newToken);
      
      // ניסיון חוזר של הבקשה המקורית
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(originalRequest.url, originalRequest);
      return await retryResponse.json();
      
    } catch (refreshError) {
      isRefreshing = false;
      refreshSubscribers = [];
      throw new Error('נדרשת התחברות מחדש');
    }
  }
  
  // שגיאות אחרות
  const data = await response.json().catch(() => ({ message: 'שגיאה בשרת' }));
  throw new Error(data.message || 'שגיאה בשרת');
};

// ========================================
// ✅ פונקציה עזר לביצוע fetch עם טיפול חכם בשגיאות
// ========================================
const fetchWithAutoRefresh = async (url, options = {}) => {
  const requestStartTime = Date.now();
  
  try {
    const response = await fetch(url, options);
    
    // ✅ אם הבקשה לקחה יותר מ-5 שניות (השרת התעורר)
    const requestDuration = Date.now() - requestStartTime;
    if (requestDuration > 5000) {
      console.log('☕ [API] הבקשה לקחה', Math.round(requestDuration / 1000), 'שניות - השרת התעורר');
    }
    
    return await handleResponse(response, options);
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
    credentials: 'include', // ✅ חשוב! מקבל את הקוקי
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
    credentials: 'include', // ✅ חשוב! מקבל את הקוקי
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
  return fetchWithAutoRefresh(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include',
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
      credentials: 'include', // ✅ חשוב! מוחק את הקוקי
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
  return fetchWithAutoRefresh(`${API_BASE_URL}/properties/public`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
};

export const getProperties = async () => {
  return fetchWithAutoRefresh(`${API_BASE_URL}/properties`, {
    method: 'GET',
    credentials: 'include',
    headers: getAuthHeaders()
  });
};

export const getPropertyById = async (id) => {
  return fetchWithAutoRefresh(`${API_BASE_URL}/properties/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: getAuthHeaders()
  });
};

export const createProperty = async (propertyData) => {
  return fetchWithAutoRefresh(`${API_BASE_URL}/properties`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(propertyData)
  });
};

export const updateProperty = async (id, propertyData) => {
  return fetchWithAutoRefresh(`${API_BASE_URL}/properties/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(propertyData)
  });
};

export const deleteProperty = async (id) => {
  return fetchWithAutoRefresh(`${API_BASE_URL}/properties/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders()
  });
};

export const updatePropertyStatus = async (id, status) => {
  return fetchWithAutoRefresh(`${API_BASE_URL}/properties/${id}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
};

// ========================================
// Favorites API
// ========================================

export const getFavorites = async () => {
  return fetchWithAutoRefresh(`${API_BASE_URL}/favorites`, {
    method: 'GET',
    credentials: 'include',
    headers: getAuthHeaders()
  });
};

export const toggleFavoriteAPI = async (propertyId) => {
  return fetchWithAutoRefresh(`${API_BASE_URL}/favorites/${propertyId}`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders()
  });
};

// ========================================
// Notifications API
// ========================================
let notificationsRequestInProgress = false;
let retryCount = 0;
const MAX_RETRIES = 2;
const POLLING_INTERVAL = 60000; // 60 שניות

let pollingTimer = null;

// פונקציה חכמה לטעינת התראות
export const getNotifications = async () => {
  if (notificationsRequestInProgress) {
    console.log("⏳ [Notifications] בקשה כבר פעילה, מחכה להשלמתה");
    return;
  }

  notificationsRequestInProgress = true;

  try {
    const response = await fetchWithAutoRefresh(`${API_BASE_URL}/notifications`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });

    notificationsRequestInProgress = false;
    retryCount = 0;
    return response;

  } catch (error) {
    notificationsRequestInProgress = false;

    if (error?.response?.status === 429 && retryCount < MAX_RETRIES) {
      retryCount++;
      const waitTime = Math.pow(2, retryCount) * 1000; // exponential backoff
      console.warn(`⚠️ [Notifications] 429 – מחכה ${waitTime / 1000} שניות לפני retry #${retryCount}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return getNotifications();
    }

    console.error("❌ [Notifications] שגיאה בטעינת התראות:", error);
    return null; // לא לזרוק שגיאה שתשבור את האפליקציה
  }
};

// פונקציה להפעלה של polling חכם
export const startNotificationsPolling = () => {
  if (pollingTimer) return; // אם כבר פועל – אל תפעיל שוב

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



// ========================================
// Users API
// ========================================

export const deleteAccount = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/account`, {
    method: 'DELETE',
    credentials: 'include',
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