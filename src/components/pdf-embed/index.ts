/*
Copyright 2020 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe.
*/

// Main PDF Embed Component
export { default as PDFEmbed } from './PDFEmbed';
export type { PDFEmbedProps } from './PDFEmbed';

// Individual Embed Mode Components
export { default as InLine } from './Embed Modes/InLine';
export { default as FullWindow } from './Embed Modes/FullWindow';
export { default as Lightbox } from './Embed Modes/Lightbox';
export { default as SizedContainer } from './Embed Modes/SizedContainer';

// Specialized Components
export { default as CaptureViewSDKEvents } from './CaptureViewSDKEvents';
export { default as LocalPDFFilePreview } from './LocalPDFFilePreview';
export { default as ViewerCustomization } from './ViewerCustomization';
export { default as PDFAnnotationTools } from './PDFAnnotationTools';

// Annotation API Components
export { default as CRUDAPIs } from './PDF Annotation APIs/CRUDAPIs';
export { default as HandlingAnnotationsInPDF } from './PDF Annotation APIs/HandlingAnnotationsInPDF';
export { default as CaptureEvents } from './PDF Annotation APIs/CaptureEvents';
export { default as UIConfigurations } from './PDF Annotation APIs/UIConfigurations/UIConfigurations';
export { default as CustomRHP } from './PDF Annotation APIs/UIConfigurations/CustomRHP';

// Core SDK Client
export { default as ViewSDKClient } from './ViewSDKClient';

// Types
export type {
  AdobeDCView,
  PreviewFileConfig,
  ViewerConfig,
  AnnotationManager,
  Annotation,
  AnnotationFilter,
  SaveApiResponse,
  PDFEvent
} from './types';

// Sample Data
export { annotations } from './PDF Annotation APIs/Sample Annotation List/annotationList';

// Example Component
export { default as PDFViewerExample } from './PDFViewerExample';
