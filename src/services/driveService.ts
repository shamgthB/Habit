import { getAccessToken, requestWorkspaceAccess } from './authService';

export interface DriveBackupFile {
  id: string;
  name: string;
  size?: string;
  createdTime: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * Uploads an AuraHabit backup JSON file directly to the user's personal Google Drive
 */
export const uploadBackupToGoogleDrive = async (
  backupData: object,
  customName?: string
): Promise<DriveBackupFile> => {
  let token = await getAccessToken();
  if (!token) {
    try {
      token = await requestWorkspaceAccess();
    } catch {
      throw new Error('Please sign in with Google to access Google Drive.');
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = customName || `AuraHabit-backup-${timestamp}.json`;
  const fileContent = JSON.stringify(backupData, null, 2);

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: `AuraHabit full data backup generated on ${new Date().toLocaleString()}`,
  };

  const boundary = '-------AuraHabitBoundary' + Math.random().toString(36).substring(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const message = errorJson.error?.message || `Failed to backup to Google Drive (Status ${res.status})`;
    throw new Error(message);
  }

  return await res.json();
};

/**
 * Lists previous AuraHabit backup files stored in Google Drive
 */
export const listGoogleDriveBackups = async (): Promise<DriveBackupFile[]> => {
  const token = await getAccessToken();
  if (!token) return [];

  const query = encodeURIComponent("name contains 'AuraHabit-backup' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,size,createdTime,modifiedTime,webViewLink)&orderBy=createdTime desc&pageSize=10`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.files || [];
};

/**
 * Downloads backup JSON data from Google Drive
 */
export const downloadGoogleDriveBackup = async (fileId: string): Promise<any> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in to Google Drive to download backups.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to retrieve backup file from Google Drive.');
  }

  return await res.json();
};
