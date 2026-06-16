import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production-min-32-chars"
);

export async function signPublicMediaToken(imageId: string): Promise<string> {
  return new SignJWT({ imageId, purpose: "ig-media" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyPublicMediaToken(imageId: string, token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.imageId === imageId && payload.purpose === "ig-media";
  } catch {
    return false;
  }
}

export async function publicMediaUrl(imageId: string): Promise<string> {
  const { resolveSiteUrl } = await import("./blob");
  const token = await signPublicMediaToken(imageId);
  return `${resolveSiteUrl()}/api/instagram/media/${imageId}?t=${encodeURIComponent(token)}`;
}
