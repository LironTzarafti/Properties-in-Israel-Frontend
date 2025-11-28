// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // שימוש ב-localStorage
import { combineReducers } from "@reduxjs/toolkit";

import userReducer from "./userSlice";
import propertyReducer from "./propertySlice";

// הגדרת Redux Persist - מה נשמור ב-localStorage
const persistConfig = {
  key: "root", // מפתח ראשי ב-localStorage
  storage, // שימוש ב-localStorage של הדפדפן
  whitelist: ["user", "property"], // רק אלה יישמרו (user ו-property)
};

// שילוב כל ה-reducers לאחד
const rootReducer = combineReducers({
  user: userReducer,
  property: propertyReducer,
});

// יצירת persistedReducer - זה reducer עם יכולת שמירה
const persistedReducer = persistReducer(persistConfig, rootReducer);

// יצירת ה-Store עם ה-persistedReducer
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Redux Persist צריך להתעלם מ-actions מסוימים
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

// יצירת persistor - מנהל את השמירה/טעינה
export const persistor = persistStore(store);

export default store;