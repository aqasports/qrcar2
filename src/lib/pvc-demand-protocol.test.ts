import { describe, it, expect } from 'vitest';
import {
  CR80_DEFAULT_SPECS,
  buildPvcDemandPackage,
  validateCardDesignForProduction,
} from './pvc-demand-protocol';

describe('PVC Demand Transmission Protocol Engine', () => {
  it('enforces CR-80 physical dimensions and 300 DPI print resolution standards', () => {
    expect(CR80_DEFAULT_SPECS.standard).toBe('CR-80 (ISO/IEC 7810 ID-1)');
    expect(CR80_DEFAULT_SPECS.physicalDimensionsMm.width).toBe(85.60);
    expect(CR80_DEFAULT_SPECS.physicalDimensionsMm.height).toBe(53.98);
    expect(CR80_DEFAULT_SPECS.printResolution.dpi).toBe(300);
    expect(CR80_DEFAULT_SPECS.printResolution.canvasWidthPx).toBe(1011);
    expect(CR80_DEFAULT_SPECS.printResolution.canvasHeightPx).toBe(638);
    expect(CR80_DEFAULT_SPECS.printResolution.safeZoneMarginMm).toBe(3.0);
  });

  it('validates incomplete card designs and returns actionable errors', () => {
    const invalidDesign = {
      name: '',
      front_headline: '',
    };

    const res = validateCardDesignForProduction(invalidDesign);
    expect(res.isValid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('validates correct card design for production', () => {
    const validDesign = {
      name: 'Passeport Client Or',
      front_headline: 'GARAGE AUTO EXPERT',
      back_contact_phone: '0555 12 34 56',
    };

    const res = validateCardDesignForProduction(validDesign);
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it('builds full standardized PVC Demand Package with SHA-256 validation checksum', () => {
    const pkg = buildPvcDemandPackage({
      designId: 'cd_99182',
      designName: 'Modèle Pro Alerte',
      layoutPreset: 'carbon_fiber',
      isWhiteLabel: false,
      frontBg: '#18181b',
      frontAccent: '#ef4444',
      frontText: '#f4f4f5',
      backBg: '#18181b',
      backText: '#a1a1aa',
      frontHeadline: 'ATELIER MECANIQUE GT',
      frontSubheadline: 'Diagnostic et Entretien',
      backContactPhone: '0550 00 11 22',
      backAddress: 'Route Nationale 1, Blida',
      backEmergencyText: 'Assistance 24/7',
      frontImageUrl: 'https://i.ibb.co/example/logo.png',
      frontImagePosition: 'header_logo',
      frontImageOpacity: 1.0,
      frontImageScale: 100,
      frontRenderedPreviewUrl: 'https://i.ibb.co/example/front_render.png',
      backRenderedPreviewUrl: 'https://i.ibb.co/example/back_render.png',
      frontUploadProvider: 'imgbb',
      backUploadProvider: 'imgbb',
      organization: {
        id: 'org_881',
        name: 'Atelier Mécanique GT',
        phone: '0550 00 11 22',
        email: 'contact@gtmecanique.dz',
        wilaya: 'Blida',
      },
      requestedBatchQuantity: 250,
      preferredFinish: 'Metallic Satin',
      submissionNotes: 'Logo en haute définition avec vernis sélectif si possible.',
    });

    expect(pkg.protocolVersion).toBe('CR80_PRINT_V2');
    expect(pkg.demandId).toMatch(/^DEM-[A-F0-9]{8}$/);
    expect(pkg.assets.frontRenderedPreviewUrl).toBe('https://i.ibb.co/example/front_render.png');
    expect(pkg.assets.backRenderedPreviewUrl).toBe('https://i.ibb.co/example/back_render.png');
    expect(pkg.fulfillmentRequest.requestedBatchQuantity).toBe(250);
    expect(pkg.fulfillmentRequest.preferredFinish).toBe('Metallic Satin');
    expect(pkg.validationReport.checksum).toHaveLength(64);
    expect(pkg.validationReport.safeZoneCompliant).toBe(true);
  });
});
