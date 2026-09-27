import { AuthenticationApi, AppUserDto } from '@elliotJHarding/meals-api';
import { axiosInstance, baseUrl, configuration } from './client';

const api = new AuthenticationApi(configuration, baseUrl, axiosInstance);

export async function login(googleCredential: string): Promise<AppUserDto | null> {
  // The login response shape varies (session vs token clients); the session
  // cookie is what matters here, so fetch the user via whoAmI afterwards
  await api.login({ token: googleCredential } as never);
  return whoAmI();
}

export async function whoAmI(): Promise<AppUserDto | null> {
  try {
    const response = await api.whoAmI();
    return response.data;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 401 || status === 403) {
      return null;
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  // The server's Spring Security logout filter clears the session and then
  // 302-redirects to /api/login?logout, which 401s on the secured API. axios
  // follows that redirect and rejects — but the session is already gone by
  // then, so logout is best-effort: swallow the redirect-landing error.
  try {
    await api.logout();
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status !== 401 && status !== 403) {
      throw error;
    }
  }
}
