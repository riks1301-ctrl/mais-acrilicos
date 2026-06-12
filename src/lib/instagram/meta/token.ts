/**
 * Renovação de long-lived token (opcional).
 * Requer META_APP_ID + META_APP_SECRET + token atual no .env.
 */
export async function refreshLongLivedToken(): Promise<{ accessToken: string; expiresIn: number } | null> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const token = process.env.META_ACCESS_TOKEN;

  if (!appId || !appSecret || !token) return null;

  const url = new URL("https://graph.facebook.com/v23.0/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", token);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok || data.error) return null;

  return { accessToken: data.access_token, expiresIn: data.expires_in };
}
