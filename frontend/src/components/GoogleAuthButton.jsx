
import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const GoogleAuthButton = ({ onError, label = 'Continue with Google' }) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const rawGoogleClientId = (
    import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  ).trim();

  const isGoogleConfigured =
    Boolean(rawGoogleClientId) &&
    !rawGoogleClientId.includes('your_google_client_id_placeholder');

  const redirectPath = location.state?.from?.pathname || '/';

  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      onError?.('Google authentication failed. No credential returned.');
      return;
    }

    try {
      setLoading(true);

      const res = await loginWithGoogle(credentialResponse.credential);

      if (res.success) {
        navigate(redirectPath, { replace: true });
      } else {
        onError?.(res.message || 'Google authentication failed.');
      }
    } catch (err) {
      console.error('Google Auth Handler Error:', err);
      onError?.(
        err.response?.data?.message ||
          'Google authentication failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    onError?.('Google sign-in was cancelled or encountered an error.');
  };

  if (!isGoogleConfigured) {
    return (
      <p className="text-sm text-red-500">
        Google sign-in is not configured. Please check the frontend
        VITE_GOOGLE_CLIENT_ID setting.
      </p>
    );
  }

  return (
    <div className="flex justify-center w-full">
      {loading ? (
        <button
          type="button"
          disabled
          className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-dark-700 text-sm font-semibold opacity-50"
        >
          Connecting with Google...
        </button>
      ) : (
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          text="continue_with"
          theme="outline"
          size="large"
          width="320"
        />
      )}
    </div>
  );
};

export default GoogleAuthButton;
