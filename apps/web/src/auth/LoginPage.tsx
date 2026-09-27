import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Identity + the offline grant the app needs: calendar (week events) and the two
// Gemini scopes (per-user receipt ingestion). These match the server's
// GoogleAuthService.SCOPES exactly so the stored refresh token covers both —
// requesting a subset would store a token Gemini later rejects.
const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/generative-language.retriever',
].join(' ');

export default function LoginPage() {
  const { loginWithAuthCode, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Auth-code flow (not the ID-token widget): yields a serverAuthCode the server
  // exchanges for identity + an offline refresh token in one consent.
  const signIn = useGoogleLogin({
    flow: 'auth-code',
    scope: SCOPES,
    onSuccess: async (codeResponse) => {
      await loginWithAuthCode(codeResponse.code);
      navigate('/', { replace: true });
    },
    onError: () => console.error('Google login failed'),
  });

  // Dev-only shortcut: real Google login can't complete locally (the auth-code
  // exchange needs the real client secret; the local stack uses a dummy), so the
  // localdev-only /auth/dev-login endpoint is the way in. Stripped from prod
  // builds by the import.meta.env.DEV guard.
  const devLogin = async () => {
    await fetch(`${import.meta.env.VITE_REPOSITORY_URL}/auth/dev-login?email=dev@local`, {
      method: 'POST',
      credentials: 'include',
    });
    await refreshUser();
    navigate('/', { replace: true });
  };

  return (
    <div className="login-page">
      <img className="logo" src="/grub_logo.svg" alt="" />
      <h1 className="brand">
        Grub<span className="full-stop">.</span>
      </h1>
      <p className="strapline">the kitchen journal</p>
      <button className="pill primary" onClick={() => signIn()}>
        continue with Google
      </button>
      {import.meta.env.DEV && (
        <button className="pill" onClick={devLogin}>
          dev login (local)
        </button>
      )}
      <div className="rule" />
      <p className="smallcaps">plan the week, keep the receipts</p>
    </div>
  );
}
