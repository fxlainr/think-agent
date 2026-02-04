import { createClient } from './client';

const supabase = createClient();
const BUCKET_NAME = 'solutions';

export interface UploadedFile {
  path: string;
  url: string;
  name: string;
  size: number;
}

/**
 * Upload un fichier dans le bucket solutions
 * Structure: solutions/{userId}/{challengeId}/{filename}
 */
export async function uploadSolutionFile(
  userId: string,
  challengeId: string,
  file: File
): Promise<{ file: UploadedFile | null; error: string | null }> {
  // Générer un nom unique pour éviter les collisions
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${userId}/${challengeId}/${timestamp}_${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading file:', error);
    return { file: null, error: error.message };
  }

  // URL publique (bucket est public)
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    file: {
      path: data.path,
      url: urlData.publicUrl,
      name: file.name,
      size: file.size,
    },
    error: null,
  };
}

/**
 * Upload plusieurs fichiers
 */
export async function uploadSolutionFiles(
  userId: string,
  challengeId: string,
  files: File[]
): Promise<UploadedFile[]> {
  const results = await Promise.all(
    files.map((file) => uploadSolutionFile(userId, challengeId, file))
  );
  return results
    .map((r) => r.file)
    .filter((f): f is UploadedFile => f !== null);
}

/**
 * Supprimer un fichier
 */
export async function deleteSolutionFile(path: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error('Error deleting file:', error);
    return false;
  }
  return true;
}

/**
 * Obtenir une URL signée pour un fichier existant
 */
export async function getSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, 60 * 60 * 24); // 24h

  if (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Lister les fichiers d'une solution
 */
export async function listSolutionFiles(
  userId: string,
  challengeId: string
): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`${userId}/${challengeId}`);

  if (error) {
    console.error('Error listing files:', error);
    return [];
  }
  return data.map((f) => `${userId}/${challengeId}/${f.name}`);
}
