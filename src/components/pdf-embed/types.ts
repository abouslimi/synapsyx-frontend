/*
Copyright 2020 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe.
*/

// Adobe PDF Embed API Type Definitions
declare global {
  interface Window {
    AdobeDC: any;
  }
}

export interface AdobeDCView {
  previewFile(config: PreviewFileConfig, viewerConfig?: ViewerConfig): Promise<any>;
  registerCallback(type: any, handler: any, options?: any): void;
}

export interface PreviewFileConfig {
  content: {
    location?: {
      url: string;
      headers?: Array<{ key: string; value: string }>;
    };
    promise?: Promise<ArrayBuffer>;
  };
  metaData: {
    fileName: string;
    id?: string;
  };
}

export interface ViewerConfig {
  embedMode?: 'IN_LINE' | 'FULL_WINDOW' | 'LIGHT_BOX' | 'SIZED_CONTAINER';
  enableAnnotationAPIs?: boolean;
  showAnnotationTools?: boolean;
  showDownloadPDF?: boolean;
  showPrintPDF?: boolean;
  showLeftHandPanel?: boolean;
  showPageControls?: boolean;
  showZoomControl?: boolean;
  defaultViewMode?: 'FIT_PAGE' | 'FIT_WIDTH' | 'FIT_HEIGHT';
  enableFormFilling?: boolean;
  showCommentsPanel?: boolean;
  downloadWithAnnotations?: boolean;
  printWithAnnotations?: boolean;
  includePDFAnnotations?: boolean;
  [key: string]: any;
}

export interface AnnotationManager {
  addAnnotations(annotations: Annotation[]): Promise<void>;
  getAnnotations(): Promise<Annotation[]>;
  deleteAnnotations(filter: AnnotationFilter): Promise<void>;
  updateAnnotation(annotation: Annotation): Promise<void>;
}

export interface Annotation {
  id: string;
  type: string;
  pageNumber: number;
  bodyValue?: string;
  [key: string]: any;
}

export interface AnnotationFilter {
  annotationIds?: string[];
  pageRange?: {
    startPage: number;
    endPage: number;
  };
}

export interface SaveApiResponse {
  code: number;
  data: {
    metaData: any;
  };
}

export interface PDFEvent {
  type: string;
  data: any;
}
