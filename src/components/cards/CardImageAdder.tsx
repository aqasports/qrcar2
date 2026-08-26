'use client';

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Spinner } from '@/components/ui';

export interface CardImageSettings {
  url: string | null;
  position: 'header_logo' | 'top_right' | 'center_emblem' | 'background_watermark' | 'custom_badge';
  opacity: number;
  scale: number;
  uploadProvider?: string;
  filename?: string;
}

interface CardImageAdderProps {
  side: 'front' | 'back';
  title: string;
  description?: string;
  imageSettings: CardImageSettings;
  onChange: (settings: CardImageSettings) => void;
  disabled?: boolean;
}

export function CardImageAdder({
  side,
  title,
  description,
  imageSettings,
  onChange,
  disabled = false,
}: CardImageAdderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner un fichier image valide (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('L’image ne doit pas dépasser 10 Mo.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      // 1. Read file as Base64 Data URL for instant local feedback
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      // 2. Call our secure server-side upload API which targets third-party host (ImgBB / Cloudinary / Blobs)
      const res = await fetch('/api/cards/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data,
          filename: file.name,
          mimeType: file.type,
          tags: ['card_studio', side, 'logo'],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Échec du téléversement vers le serveur distant.');
      }

      // 3. Update settings with permanent third-party CDN URL
      onChange({
        ...imageSettings,
        url: data.url,
        uploadProvider: data.provider,
        filename: file.name,
      });
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setUploadError(err.message || 'Erreur lors du téléversement de l’image.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleRemove = () => {
    onChange({
      ...imageSettings,
      url: null,
      uploadProvider: undefined,
      filename: undefined,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getProviderBadge = (provider?: string) => {
    switch (provider) {
      case 'imgbb':
        return <Badge variant="info">Hébergé ImgBB CDN</Badge>;
      case 'cloudinary':
        return <Badge variant="info">Cloudinary CDN</Badge>;
      case 'netlify-blobs':
        return <Badge variant="info">Netlify Blobs Store</Badge>;
      default:
        return <Badge variant="neutral">Serveur Image Dédié</Badge>;
    }
  };

  return (
    <Card className="border border-border-default font-sans overflow-hidden">
      <CardHeader className="pb-3 border-b border-border-subtle bg-surface-raised/40">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {title}
            </CardTitle>
            {description && <p className="text-[11px] text-text-muted mt-0.5">{description}</p>}
          </div>

          {imageSettings.url && getProviderBadge(imageSettings.uploadProvider)}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {uploadError && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
            {uploadError}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          disabled={disabled || uploading}
        />

        {!imageSettings.url ? (
          /* Dropzone */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
            className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-accent bg-accent/10 shadow-lg'
                : 'border-border-default hover:border-accent/50 bg-surface-base hover:bg-surface-hover'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-2">
                <Spinner size="md" />
                <span className="text-xs text-accent font-bold">
                  Téléversement vers le serveur d'images en cours...
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-center text-accent">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-xs font-bold text-text-primary">
                  Cliquez ou glissez-déposez le logo / image de l'atelier
                </div>
                <p className="text-[10px] text-text-muted">
                  Formats supportés : PNG transparent, SVG vectoriel, JPG haute résolution (max 10 Mo)
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Active Image Settings */
          <div className="space-y-4">
            {/* Image Preview Row */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-base border border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-surface-raised border border-border-default overflow-hidden flex items-center justify-center p-1 relative">
                  <img
                    src={imageSettings.url}
                    alt="Aperçu Logo"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-text-primary block truncate max-w-[200px]">
                    {imageSettings.filename || 'Visuel Personnalisé'}
                  </span>
                  <span className="text-[10px] font-mono text-text-muted block">
                    Conforme gabarit CR-80
                  </span>
                </div>
              </div>

              {!disabled && (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    Remplacer
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="xs"
                    onClick={handleRemove}
                    disabled={uploading}
                  >
                    Retirer
                  </Button>
                </div>
              )}
            </div>

            {/* Position & Placement Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Disposition sur la Carte
                </label>
                <select
                  value={imageSettings.position}
                  onChange={(e) =>
                    onChange({
                      ...imageSettings,
                      position: e.target.value as any,
                    })
                  }
                  disabled={disabled}
                  className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="header_logo">En-tête Haut Gauche (Logo classique)</option>
                  <option value="top_right">Haut Droite (Puce opposée)</option>
                  <option value="center_emblem">Emblème Central</option>
                  <option value="background_watermark">Filigrane Pleine Carte (Arrière-plan)</option>
                  <option value="custom_badge">Badge Bas Droite</option>
                </select>
              </div>

              {/* Opacity Slider */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  <span>Opacité</span>
                  <span className="font-mono text-accent">
                    {Math.round(imageSettings.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="1.00"
                  step="0.05"
                  value={imageSettings.opacity}
                  onChange={(e) =>
                    onChange({
                      ...imageSettings,
                      opacity: parseFloat(e.target.value),
                    })
                  }
                  disabled={disabled}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Scale / Size Slider */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                <span>Échelle / Taille du Visuel</span>
                <span className="font-mono text-accent">{imageSettings.scale}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="180"
                step="5"
                value={imageSettings.scale}
                onChange={(e) =>
                  onChange({
                    ...imageSettings,
                    scale: parseInt(e.target.value, 10),
                  })
                }
                disabled={disabled}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
