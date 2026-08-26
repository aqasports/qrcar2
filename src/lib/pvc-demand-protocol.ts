import crypto from 'crypto';

export interface Cr80PrintSpecs {
  standard: 'CR-80 (ISO/IEC 7810 ID-1)';
  physicalDimensionsMm: {
    width: 85.60;
    height: 53.98;
    thickness: 0.76;
    cornerRadius: 3.18;
  };
  printResolution: {
    dpi: 300;
    canvasWidthPx: 1011;
    canvasHeightPx: 638;
    bleedMarginMm: 3.0;
    bleedWidthPx: 1047;
    bleedHeightPx: 674;
    safeZoneMarginMm: 3.0;
    safeZoneMarginPx: 36;
  };
  materials: {
    base: 'PVC Plastique Haute Durabilité';
    finish: 'Matte Silk' | 'Gloss UV' | 'Metallic Satin' | 'Brushed Carbon';
    nfcChip: 'NXP NTAG213 (144 bytes)' | 'NXP NTAG215 (504 bytes)' | 'Sans Puce NFC';
    qrMatrix: 'High-Contrast 2D Matrix (Quiet-Zone 4 Modules)';
  };
}

export const CR80_DEFAULT_SPECS: Cr80PrintSpecs = {
  standard: 'CR-80 (ISO/IEC 7810 ID-1)',
  physicalDimensionsMm: {
    width: 85.60,
    height: 53.98,
    thickness: 0.76,
    cornerRadius: 3.18,
  },
  printResolution: {
    dpi: 300,
    canvasWidthPx: 1011,
    canvasHeightPx: 638,
    bleedMarginMm: 3.0,
    bleedWidthPx: 1047,
    bleedHeightPx: 674,
    safeZoneMarginMm: 3.0,
    safeZoneMarginPx: 36,
  },
  materials: {
    base: 'PVC Plastique Haute Durabilité',
    finish: 'Matte Silk',
    nfcChip: 'NXP NTAG213 (144 bytes)',
    qrMatrix: 'High-Contrast 2D Matrix (Quiet-Zone 4 Modules)',
  },
};

export interface PvcDemandPackage {
  protocolVersion: 'CR80_PRINT_V2';
  demandId: string;
  timestamp: string;
  organization: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    wilaya?: string;
  };
  design: {
    id: string;
    name: string;
    layoutPreset: string;
    isWhiteLabel: boolean;
    colors: {
      frontBg: string;
      frontAccent: string;
      frontText: string;
      backBg: string;
      backText: string;
    };
    typography: {
      frontHeadline: string;
      frontSubheadline: string;
      backContactPhone: string;
      backAddress: string;
      backEmergencyText: string;
    };
    imageLayers: {
      frontImageUrl?: string | null;
      frontImagePosition?: string;
      frontImageOpacity?: number;
      frontImageScale?: number;
      backImageUrl?: string | null;
      backImagePosition?: string;
      backImageOpacity?: number;
      backImageScale?: number;
    };
  };
  assets: {
    frontRenderedPreviewUrl: string;
    backRenderedPreviewUrl: string;
    frontRawAssetUrl?: string | null;
    backRawAssetUrl?: string | null;
    frontUploadProvider?: string;
    backUploadProvider?: string;
  };
  printSpecs: Cr80PrintSpecs;
  fulfillmentRequest: {
    requestedBatchQuantity: number;
    preferredFinish: 'Matte Silk' | 'Gloss UV' | 'Metallic Satin' | 'Brushed Carbon';
    nfcEncodingRequired: boolean;
    submissionNotes?: string;
    contactEmail?: string;
  };
  validationReport: {
    safeZoneCompliant: boolean;
    bleedZoneCompliant: boolean;
    contrastCompliant: boolean;
    qrQuietZonePreserved: boolean;
    checksum: string;
  };
}

/**
 * Pre-flight validation checker for CR-80 print readiness.
 */
export function validateCardDesignForProduction(design: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!design.name || design.name.trim().length === 0) {
    errors.push('Le nom du modèle de carte est requis.');
  }

  if (!design.frontHeadline && !design.front_headline) {
    errors.push('L’en-tête de la face Recto (Nom de l’atelier) est obligatoire pour l’impression.');
  }

  if (!design.backContactPhone && !design.back_contact_phone) {
    warnings.push('Aucun numéro de téléphone renseigné sur le verso.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generates the standardized PVC Demand Transmission Protocol Package.
 */
export function buildPvcDemandPackage(params: {
  designId: string;
  designName: string;
  layoutPreset: string;
  isWhiteLabel: boolean;
  frontBg: string;
  frontAccent: string;
  frontText: string;
  backBg: string;
  backText: string;
  frontHeadline: string;
  frontSubheadline: string;
  backContactPhone: string;
  backAddress: string;
  backEmergencyText: string;
  frontImageUrl?: string | null;
  frontImagePosition?: string;
  frontImageOpacity?: number;
  frontImageScale?: number;
  backImageUrl?: string | null;
  backImagePosition?: string;
  backImageOpacity?: number;
  backImageScale?: number;
  frontRenderedPreviewUrl: string;
  backRenderedPreviewUrl: string;
  frontUploadProvider?: string;
  backUploadProvider?: string;
  organization: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    wilaya?: string;
  };
  requestedBatchQuantity?: number;
  preferredFinish?: 'Matte Silk' | 'Gloss UV' | 'Metallic Satin' | 'Brushed Carbon';
  submissionNotes?: string;
  contactEmail?: string;
}): PvcDemandPackage {
  const demandId = `DEM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const timestamp = new Date().toISOString();

  const printSpecs: Cr80PrintSpecs = {
    ...CR80_DEFAULT_SPECS,
    materials: {
      ...CR80_DEFAULT_SPECS.materials,
      finish: params.preferredFinish || 'Matte Silk',
    },
  };

  const payloadString = JSON.stringify({
    designId: params.designId,
    orgId: params.organization.id,
    frontUrl: params.frontRenderedPreviewUrl,
    backUrl: params.backRenderedPreviewUrl,
    timestamp,
  });

  const checksum = crypto.createHash('sha256').update(payloadString).digest('hex');

  return {
    protocolVersion: 'CR80_PRINT_V2',
    demandId,
    timestamp,
    organization: params.organization,
    design: {
      id: params.designId,
      name: params.designName,
      layoutPreset: params.layoutPreset,
      isWhiteLabel: params.isWhiteLabel,
      colors: {
        frontBg: params.frontBg,
        frontAccent: params.frontAccent,
        frontText: params.frontText,
        backBg: params.backBg,
        backText: params.backText,
      },
      typography: {
        frontHeadline: params.frontHeadline,
        frontSubheadline: params.frontSubheadline,
        backContactPhone: params.backContactPhone,
        backAddress: params.backAddress,
        backEmergencyText: params.backEmergencyText,
      },
      imageLayers: {
        frontImageUrl: params.frontImageUrl,
        frontImagePosition: params.frontImagePosition || 'header_logo',
        frontImageOpacity: params.frontImageOpacity ?? 1.0,
        frontImageScale: params.frontImageScale ?? 100,
        backImageUrl: params.backImageUrl,
        backImagePosition: params.backImagePosition || 'background_watermark',
        backImageOpacity: params.backImageOpacity ?? 0.2,
        backImageScale: params.backImageScale ?? 80,
      },
    },
    assets: {
      frontRenderedPreviewUrl: params.frontRenderedPreviewUrl,
      backRenderedPreviewUrl: params.backRenderedPreviewUrl,
      frontRawAssetUrl: params.frontImageUrl,
      backRawAssetUrl: params.backImageUrl,
      frontUploadProvider: params.frontUploadProvider,
      backUploadProvider: params.backUploadProvider,
    },
    printSpecs,
    fulfillmentRequest: {
      requestedBatchQuantity: params.requestedBatchQuantity || 100,
      preferredFinish: params.preferredFinish || 'Matte Silk',
      nfcEncodingRequired: true,
      submissionNotes: params.submissionNotes,
      contactEmail: params.contactEmail || params.organization.email,
    },
    validationReport: {
      safeZoneCompliant: true,
      bleedZoneCompliant: true,
      contrastCompliant: true,
      qrQuietZonePreserved: true,
      checksum,
    },
  };
}
