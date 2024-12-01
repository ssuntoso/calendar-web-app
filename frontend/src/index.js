import React from 'react';
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google"
import './index.css';
import Calendar from './pages/Calendar';
import Layout from './pages/Layout'
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import ImportCSV from './pages/ImportCSV';
import Verification from './pages/Verification';
import CheckEmail from './pages/CheckEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPasswordPage from './pages/Reset';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Calendar />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="import-csv" element={<ImportCSV />} />
          <Route path="verify" element={<Verification />} />
          <Route path="check-email" element={<CheckEmail />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset" element={<ResetPasswordPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </GoogleOAuthProvider>
);
