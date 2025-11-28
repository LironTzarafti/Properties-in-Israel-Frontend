import { Routes, Route } from 'react-router-dom';
import Home from '../features/public/pages/Home/Home';
import Login from '../features/public/pages/Login/Login';
import Register from '../features/public/pages/Register/Register';
import Dashboard from '../features/authenticated/pages/Dashboard/Dashboard';
import Profile from '../features/authenticated/pages/Profile/Profile';
import Settings from '../features/authenticated/pages/Settings/Settings';
import LoanCalculator from '../features/shared/components/LoanCalculator/LoanCalculator';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/loan-calculator" element={<LoanCalculator />} />
    </Routes>
  );
}

export default AppRoutes;
