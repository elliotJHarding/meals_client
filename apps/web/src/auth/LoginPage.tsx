import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <img className="logo" src="/grub_logo.svg" alt="" />
      <h1 className="brand">
        Grub<span className="full-stop">.</span>
      </h1>
      <p className="strapline">the kitchen journal</p>
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          if (credentialResponse.credential) {
            await login(credentialResponse.credential);
            navigate('/', { replace: true });
          }
        }}
        onError={() => console.error('Google login failed')}
      />
      <div className="rule" />
      <p className="smallcaps">plan the week, keep the receipts</p>
    </div>
  );
}
