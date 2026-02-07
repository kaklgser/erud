export type LayoutType = 'standard' | 'compact' | 'ats-optimized';
export type PaperSize = 'a4' | 'letter';

export interface ExportOptions {
  layoutType: LayoutType;
  paperSize: PaperSize;
  fontFamily: string;
  nameSize: number;
  sectionHeaderSize: number;
  subHeaderSize: number;
  bodyTextSize: number;
  sectionSpacing: number; // in mm
  entrySpacing: number; // in mm (spacing between items in a list, e.g., bullets)
}

// Default export options - Standard
export const defaultExportOptions: ExportOptions = {
  layoutType: 'standard',
  paperSize: 'a4',
  fontFamily: 'Calibri',
  nameSize: 22,
  sectionHeaderSize: 13,
  subHeaderSize: 11,
  bodyTextSize: 11,
  sectionSpacing: 4,
  entrySpacing: 2.5,
};

// Layout configurations
export const layoutConfigs = {
  'ats-optimized': {
    name: 'ATS Optimized',
    description: 'Maximum ATS compatibility with audit-compliant formatting',
    margins: { top: 17.78, bottom: 17.78, left: 17.78, right: 17.78 },
    spacing: { section: 4, entry: 2.5 },
    recommended: true
  },
  standard: {
    name: 'Standard',
    description: 'Professional layout with optimal spacing',
    margins: { top: 15, bottom: 10, left: 20, right: 20 },
    spacing: { section: 4, entry: 2.5 },
    recommended: false
  },
  compact: {
    name: 'Compact',
    description: 'Condensed layout for more content',
    margins: { top: 10, bottom: 5, left: 15, right: 15 },
    spacing: { section: 2.5, entry: 1.5 },
    recommended: false
  }
};

// Paper size configurations
export const paperSizeConfigs = {
  a4: {
    name: 'A4 (8.27" x 11.69")',
    width: 210, // mm
    height: 297 // mm
  },
  letter: {
    name: 'Letter (8.5" x 11")',
    width: 216, // mm
    height: 279 // mm
  }
};
