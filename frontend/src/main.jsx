import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

const rawGoogleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
const isPlaceholderOrMissing =
  !rawGoogleClientId ||
  rawGoogleClientId.includes('your_google_client_id_placeholder');

const googleClientId = isPlaceholderOrMissing
  ? 'missing-google-client-id-not-configured'
  : rawGoogleClientId;

if (isPlaceholderOrMissing && import.meta.env.DEV) {
  console.warn(
    '[Warranty Wallet] VITE_GOOGLE_CLIENT_ID is missing or still using the placeholder value. ' +
      'Google sign-in is disabled. Set VITE_GOOGLE_CLIENT_ID in your frontend environment, ' +
      'restart Vite, and ensure the backend GOOGLE_CLIENT_ID uses the same value.'
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
