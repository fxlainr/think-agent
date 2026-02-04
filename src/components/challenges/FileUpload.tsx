'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react';
import { uploadSolutionFile, type UploadedFile } from '@/lib/supabase/storage';

interface FileUploadProps {
  userId: string;
  challengeId: string;
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/markdown',
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) {
    return <Image className="h-4 w-4" />;
  }
  return <FileText className="h-4 w-4" />;
}

export function FileUpload({
  userId,
  challengeId,
  onFilesChange,
  maxFiles = 5,
  maxSizeMB = 10,
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    // Vérifications
    if (uploadedFiles.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} fichiers autorisés`);
      return;
    }

    const invalidType = files.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalidType) {
      setError(`Type non supporté: ${invalidType.name}. Utilisez PNG, JPG, GIF, PDF ou TXT.`);
      return;
    }

    const tooLarge = files.find((f) => f.size > maxSizeMB * 1024 * 1024);
    if (tooLarge) {
      setError(`Fichier trop volumineux: ${tooLarge.name} (max ${maxSizeMB} MB)`);
      return;
    }

    // Upload
    setIsUploading(true);
    const newFiles: UploadedFile[] = [];

    for (const file of files) {
      const result = await uploadSolutionFile(userId, challengeId, file);
      if (result) {
        newFiles.push(result);
      }
    }

    const allFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(allFiles);
    onFilesChange(allFiles);
    setIsUploading(false);

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-4">
      {/* Zone de drop / bouton */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent-cyan transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-accent-cyan" />
            <p className="text-sm text-muted-foreground">Upload en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Clique ou glisse des fichiers ici
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF, PDF, TXT • Max {maxSizeMB} MB • {maxFiles} fichiers max
            </p>
          </div>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Liste des fichiers uploadés */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Fichiers joints ({uploadedFiles.length}/{maxFiles})</p>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={file.path}
                className="flex items-center justify-between gap-2 p-3 rounded-lg bg-card border border-border"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(file.name)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="shrink-0 text-muted-foreground hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
