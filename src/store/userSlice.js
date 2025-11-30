// Importים נדרשים מ־Redux Toolkit
import { createSlice } from "@reduxjs/toolkit";

// Initial state – מציין שהמשתמש כרגע לא מחובר
const initialState = {
  currentUser: null, // null = אין משתמש מחובר
  notifications: [], // רשימת התראות
  unreadCount: 0, // מספר התראות שלא נקראו
};

// יצירת Slice של Redux
export const userSlice = createSlice({
  name: "user", // שם ה-slice
  initialState,
  reducers: {
    // Action ל-login – נשתמש בנתונים מהמוקדמים (dummy)
    login: (state, action) => {
      // action.payload יכיל את המידע על המשתמש
      state.currentUser = action.payload;
      // התראות יטענו מהשרת בנפרד
    },
    
    // Action ל-logout – מאפס את המשתמש
    logout: (state) => {
      state.currentUser = null;
      state.notifications = [];
      state.unreadCount = 0;
       // איפוס השפה
     if (typeof window !== 'undefined' && window.i18next) {
      window.i18next.changeLanguage('he');
     }
    },
    
    // עדכון פרטי משתמש
    updateUserProfile: (state, action) => {
      if (state.currentUser) {
        state.currentUser = {
          ...state.currentUser,
          ...action.payload,
        };
      }
    },
    
    // סימון התראה כנקראה
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(
        (n) => n._id === action.payload || n.id === action.payload
      );
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    // סימון כל ההתראות כנקראו
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach((n) => (n.read = true));
      state.unreadCount = 0;
    },
    
    // הוספת התראה חדשה
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    
    // מחיקת התראה
    deleteNotification: (state, action) => {
      const index = state.notifications.findIndex(
        (n) => n._id === action.payload || n.id === action.payload
      );
      if (index !== -1) {
        if (!state.notifications[index].read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    
    // טעינת התראות מהשרת
    setNotifications: (state, action) => {
      // action.payload צריך להיות { notifications: [...], unreadCount: number }
      state.notifications = action.payload.notifications.map(n => ({
        _id: n._id,
        id: n._id, // גם id וגם _id לתאימות
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        timestamp: n.createdAt || n.timestamp,
        property: n.property
      }));
      state.unreadCount = action.payload.unreadCount || 0;
    },
    
    // עדכון התראה בודדת (לאחר סימון כנקראה)
    updateNotification: (state, action) => {
      const notification = state.notifications.find(
        (n) => n._id === action.payload._id || n.id === action.payload._id
      );
      if (notification) {
        notification.read = action.payload.read;
        if (action.payload.read && !notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }
    },
  },
});

// Export של ה-actions כדי שנוכל להשתמש ב־components
export const {
  login,
  logout,
  updateUserProfile,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  addNotification,
  deleteNotification,
  setNotifications,
  updateNotification,
} = userSlice.actions;

// Export של reducer לשימוש ב-store
export default userSlice.reducer;