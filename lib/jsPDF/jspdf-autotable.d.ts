// jspdf-autotable.d.ts
declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  export type ThemeType = 'striped' | 'grid' | 'plain' | 'css';

  export interface AutoTableOptions {
    startY?: number;
    margin?: { left?: number; right?: number; top?: number; bottom?: number };
    head?: string[][];
    body?: any[][];
    foot?: string[][];
    headStyles?: Record<string, any>;
    bodyStyles?: Record<string, any>;
    footStyles?: Record<string, any>;
    alternateRowStyles?: Record<string, any>;
    columnStyles?: Record<string, any>;
    styles?: Record<string, any>;
    didParseCell?: (data: any) => void;
    didDrawCell?: (data: any) => void;
    didDrawPage?: (data: any) => void;
    theme?: ThemeType | 'striped' | 'grid' | 'plain' | 'css';
    tableWidth?: 'auto' | 'wrap' | number;
    columnStyles?: {
      [key: string | number]: {
        cellWidth?: 'auto' | 'wrap' | number;
      };
    };
  }

  export interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
    lastAutoTable?: { finalY?: number };
  }

  const autoTable: (doc: jsPDF, options: AutoTableOptions) => jsPDF;
  export default autoTable;
}