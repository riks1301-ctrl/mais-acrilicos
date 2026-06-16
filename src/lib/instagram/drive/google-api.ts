import { google } from "googleapis";

export type DriveFileRecord = {
  driveFileId: string;
  filename: string;
  mimeType: string;
  driveFolderPath: string;
  thumbnailUrl: string | null;
  webViewLink: string | null;
  webContentLink: string | null;
  previewUrl: string;
};

function getServiceAccountCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) as {
      client_email: string;
      private_key: string;
    };
    return { clientEmail: parsed.client_email, privateKey: parsed.private_key };
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    throw new Error(
      "Google Drive API não configurada. Defina GOOGLE_SERVICE_ACCOUNT_JSON ou GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY."
    );
  }
  return { clientEmail, privateKey };
}

async function getDriveClient() {
  const { clientEmail, privateKey } = getServiceAccountCredentials();
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return google.drive({ version: "v3", auth });
}

function isImageMime(mime: string | null | undefined): boolean {
  return !!mime?.startsWith("image/");
}

function toPreviewUrl(file: { id?: string | null; thumbnailLink?: string | null }): string {
  if (file.thumbnailLink) return file.thumbnailLink.replace(/=s\d+/, "=s800");
  if (file.id) return `https://drive.google.com/uc?export=view&id=${file.id}`;
  return "";
}

export async function listDriveImagesRecursive(rootFolderId: string): Promise<DriveFileRecord[]> {
  const drive = await getDriveClient();
  const results: DriveFileRecord[] = [];

  async function walk(folderId: string, folderPath: string) {
    let pageToken: string | undefined;
    do {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: "nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink, webContentLink)",
        pageSize: 200,
        pageToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      for (const file of res.data.files ?? []) {
        if (!file.id || !file.name) continue;

        if (file.mimeType === "application/vnd.google-apps.folder") {
          await walk(file.id, folderPath ? `${folderPath}/${file.name}` : file.name);
          continue;
        }

        if (!isImageMime(file.mimeType)) continue;

        results.push({
          driveFileId: file.id,
          filename: file.name,
          mimeType: file.mimeType ?? "image/jpeg",
          driveFolderPath: folderPath || "Raiz",
          thumbnailUrl: file.thumbnailLink ?? null,
          webViewLink: file.webViewLink ?? null,
          webContentLink: file.webContentLink ?? null,
          previewUrl: toPreviewUrl(file),
        });
      }

      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
  }

  await walk(rootFolderId, "");
  return results;
}

export async function testDriveConnection(folderId: string): Promise<{ ok: boolean; fileCount: number; message: string }> {
  const files = await listDriveImagesRecursive(folderId);
  return {
    ok: true,
    fileCount: files.length,
    message: `Conexão OK — ${files.length} imagem(ns) encontrada(s) na pasta.`,
  };
}

export async function downloadDriveFile(driveFileId: string): Promise<Buffer> {
  const drive = await getDriveClient();
  const res = await drive.files.get({ fileId: driveFileId, alt: "media" }, { responseType: "arraybuffer" });
  return Buffer.from(res.data as ArrayBuffer);
}
