// main.jsx – נקודת הכניסה לאפליקציה
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux'; // מחבר את Redux לאפליקציה
import { PersistGate } from 'redux-persist/integration/react'; // שומר state בין רענונים
import store, { persistor } from './store'; // ה-store וה-persistor שיצרנו
import App from './app/App';
import './index.css'; // CSS עולמי

// יצירת root של React (Vite דורש React 18+)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Provider מחבר את Redux לכל האפליקציה */}
    <Provider store={store}>
      {/* PersistGate ממתין עד שה-state נטען מ-localStorage */}
      <PersistGate loading={null} persistor={persistor}>
      <Suspense fallback={<div>Loading translations...</div>}>
        <App />
        </Suspense>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);