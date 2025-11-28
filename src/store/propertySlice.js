import { createSlice } from "@reduxjs/toolkit";

// Initial state - נכסים יטענו מה-API ולא מה-initial state
const initialState = {
  properties: [],
  userFavorites: [], // רשימת IDs של מועדפים
  isLoadingFavorites: false,
};

const propertySlice = createSlice({
  name: "property",
  initialState,
  reducers: {
    // הגדרת רשימת נכסים מה-API
    setProperties: (state, action) => {
      state.properties = action.payload;
    },
    
    // 🆕 הגדרת מועדפים מהשרת
    setFavorites: (state, action) => {
      state.userFavorites = action.payload;
      state.isLoadingFavorites = false;
    },
    
    // 🆕 הגדרת סטטוס טעינה של מועדפים
    setLoadingFavorites: (state, action) => {
      state.isLoadingFavorites = action.payload;
    },
    
    addProperty: (state, action) => {
      const newProperty = {
        ...action.payload,
        id: action.payload.id || action.payload._id || Date.now(),
        createdAt: action.payload.createdAt || new Date().toISOString(),
        ownerId: action.payload.ownerId,
        isPublic: action.payload.isPublic !== undefined ? action.payload.isPublic : true,
        // ברירות מחדל לשדות חדשים
        images: action.payload.images || [],
        parking: action.payload.parking !== undefined ? action.payload.parking : false,
        elevator: action.payload.elevator !== undefined ? action.payload.elevator : false,
        balcony: action.payload.balcony !== undefined ? action.payload.balcony : false,
        furnished: action.payload.furnished !== undefined ? action.payload.furnished : false,
        airConditioner: action.payload.airConditioner !== undefined ? action.payload.airConditioner : false,
        renovated: action.payload.renovated !== undefined ? action.payload.renovated : false,
        accessibility: action.payload.accessibility !== undefined ? action.payload.accessibility : false,
        pets: action.payload.pets !== undefined ? action.payload.pets : true,
      };
      state.properties.push(newProperty);
    },

    updateProperty: (state, action) => {
      const propertyId = action.payload.id || action.payload._id;
      const index = state.properties.findIndex(p => (p.id === propertyId || p._id === propertyId));
      if (index !== -1) {
        state.properties[index] = {
          ...action.payload,
          id: propertyId,
          ownerId: state.properties[index].ownerId,
          createdAt: state.properties[index].createdAt,
        };
      }
    },

    deleteProperty: (state, action) => {
      const propertyId = action.payload;
      state.properties = state.properties.filter(p => (p.id !== propertyId && p._id !== propertyId));
      state.userFavorites = state.userFavorites.filter(fav => fav !== propertyId);
    },

    // 🆕 עדכון מקומי של מועדפים (אחרי קריאה לשרת)
    toggleFavoriteLocal: (state, action) => {
      const propertyId = action.payload;
      const isFavorite = state.userFavorites.includes(propertyId);
      
      if (isFavorite) {
        state.userFavorites = state.userFavorites.filter(fav => fav !== propertyId);
      } else {
        state.userFavorites.push(propertyId);
      }
    },

    clearFavorites: (state) => {
      state.userFavorites = [];
    },
  },
});

export const { 
  setProperties,
  setFavorites,
  setLoadingFavorites,
  addProperty, 
  updateProperty, 
  deleteProperty, 
  toggleFavoriteLocal,
  clearFavorites 
} = propertySlice.actions;

export default propertySlice.reducer;