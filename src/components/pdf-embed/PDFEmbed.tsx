/*
Copyright 2020 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe.
*/

import { Component } from 'react';
import ViewSDKClient from './ViewSDKClient';
import type { ViewerConfig, AnnotationManager } from './types';
import './index.css';

export interface PDFEmbedProps {
  /** The PDF file URL to display */
  pdfUrl?: string;
  /** The PDF file name */
  fileName?: string;
  /** The PDF file ID */
  fileId?: string;
  /** Embed mode for the PDF viewer */
  embedMode?: 'IN_LINE' | 'FULL_WINDOW' | 'LIGHT_BOX' | 'SIZED_CONTAINER';
  /** Enable annotation APIs */
  enableAnnotations?: boolean;
  /** Enable annotation APIs */
  enableAnnotationAPIs?: boolean;
  /** Show annotation tools */
  showAnnotationTools?: boolean;
  /** Show download PDF button */
  showDownloadPDF?: boolean;
  /** Show print PDF button */
  showPrintPDF?: boolean;
  /** Show left hand panel */
  showLeftHandPanel?: boolean;
  /** Show page controls */
  showPageControls?: boolean;
  /** Show zoom control */
  showZoomControl?: boolean;
  /** Default view mode */
  defaultViewMode?: 'FIT_PAGE' | 'FIT_WIDTH' | 'FIT_HEIGHT';
  /** Enable form filling */
  enableFormFilling?: boolean;
  /** Show comments panel */
  showCommentsPanel?: boolean;
  /** Download with annotations */
  downloadWithAnnotations?: boolean;
  /** Print with annotations */
  printWithAnnotations?: boolean;
  /** Include PDF annotations */
  includePDFAnnotations?: boolean;
  /** Enable PDF analytics */
  enablePDFAnalytics?: boolean;
  /** Custom CSS class name for the container */
  className?: string;
  /** Custom ID for the PDF container */
  id?: string;
  /** Width for sized container mode */
  width?: number;
  /** Height for sized container mode */
  height?: number;
  /** Callback when PDF is loaded */
  onPDFLoaded?: () => void;
  /** Callback when PDF fails to load */
  onPDFError?: (error: any) => void;
  /** Callback for annotation events */
  onAnnotationEvent?: (event: any) => void;
  /** Callback when annotation manager is ready */
  onAnnotationManagerReady?: (manager: any) => void;
  /** Custom headers for PDF URL */
  headers?: Array<{ key: string; value: string }>;
  /** Access token for authenticated requests */
  accessToken?: string;
}

class PDFEmbed extends Component<PDFEmbedProps> {
  private viewSDKClient: ViewSDKClient;
  private previewFilePromise?: Promise<any>;

  constructor(props: PDFEmbedProps) {
    super(props);
    this.viewSDKClient = new ViewSDKClient(props.accessToken);
  }

  componentDidMount() {
    this.loadPDF();
  }

  componentDidUpdate(prevProps: PDFEmbedProps) {
    if (prevProps.pdfUrl !== this.props.pdfUrl || 
        prevProps.fileName !== this.props.fileName ||
        prevProps.fileId !== this.props.fileId) {
      this.loadPDF();
    }
  }

  private loadPDF = () => {
    const {
      pdfUrl = "https://acrobatservices.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf",
      fileName = "Bodea Brochure.pdf",
      fileId = "6d07d124-ac85-43b3-a867-36930f502ac6",
      embedMode = "FULL_WINDOW",
      enableAnnotations = true,
      enableAnnotationAPIs = true,
      showAnnotationTools = true,
      showDownloadPDF = true,
      showPrintPDF = true,
      showLeftHandPanel = true,
      showPageControls = true,
      showZoomControl = true,
      defaultViewMode = "FIT_PAGE",
      enableFormFilling = true,
      showCommentsPanel = true,
      downloadWithAnnotations = true,
      printWithAnnotations = true,
      includePDFAnnotations = true,
      enablePDFAnalytics = true,
      headers
    } = this.props;

    this.viewSDKClient.ready().then(() => {
      const viewerConfig: ViewerConfig = {
        embedMode,
        enableAnnotationAPIs,
        showAnnotationTools,
        showDownloadPDF,
        showPrintPDF,
        showLeftHandPanel,
        showPageControls,
        showZoomControl,
        defaultViewMode,
        enableFormFilling,
        showCommentsPanel,
        downloadWithAnnotations,
        printWithAnnotations,
        includePDFAnnotations,
        enablePDFAnalytics,
      };

      // Create preview config
      const previewConfig = {
        content: {
          location: {
            url: pdfUrl,
            ...(headers && { headers })
          },
        },
        metaData: {
          fileName,
          id: fileId,
        }
      };

      try {
        this.previewFilePromise = this.viewSDKClient.previewFile("pdf-div", viewerConfig);
        
        // Override the default previewFile method to use our custom config
        // const originalPreviewFile = this.viewSDKClient.previewFile;
        this.viewSDKClient.previewFile = (divId: string, config?: ViewerConfig) => {
          // Get client ID from ViewSDKClient
          const clientId = (this.viewSDKClient as any).clientId || "8c0cd670273d451cbc9b351b11d22318";
          const adobeConfig = {
            clientId,
            locale: "fr-FR",
            ...(divId && { divId })
          };
          
          this.viewSDKClient['adobeDCView'] = new window.AdobeDC.View(adobeConfig);
          return this.viewSDKClient['adobeDCView']?.previewFile(previewConfig, config) || Promise.resolve();
        };

        this.previewFilePromise = this.viewSDKClient.previewFile("pdf-div", viewerConfig);
        
        this.previewFilePromise.then(async (adobeViewer) => {
          this.props.onPDFLoaded?.();
          
          // Register user profile callback if access token is provided
          if (this.props.accessToken) {
            try {
              this.viewSDKClient.registerUserProfileCallback();
            } catch (error) {
              console.warn('Failed to register user profile callback:', error);
            }
          }
          this.viewSDKClient.registerEventsHandler();
          
          // Register event handler if annotations are enabled
          if (enableAnnotations) {
            this.viewSDKClient.registerSaveApiHandler();
            
            // Get annotation manager and call callback
            adobeViewer.getAnnotationManager().then((annotationManager: AnnotationManager) => {
              this.props.onAnnotationManagerReady?.(annotationManager);
              annotationManager.registerEventListener(this.props.onAnnotationEvent, {listenOn: []});
            }).catch((error: any) => {
              console.warn('Failed to get annotation manager:', error);
            });
          }
        }).catch((error) => {
          console.error('PDF loading error:', error);
          this.props.onPDFError?.(error);
        });

      } catch (error) {
        console.error('PDF initialization error:', error);
        this.props.onPDFError?.(error);
      }
    });
  };

  render() {
    const {
      className = "full-window-div",
      id = "pdf-div",
      embedMode = "FULL_WINDOW",
      width = `100%`,
      height = `100%`
    } = this.props;

    // Determine container class based on embed mode
    let containerClass = className;
    if (embedMode === "IN_LINE") {
      containerClass = "in-line-div";
    } else if (embedMode === "SIZED_CONTAINER") {
      containerClass = "sized-container-div";
    } else if (embedMode === "LIGHT_BOX") {
      containerClass = "light-box-container";
    }

    const containerStyle = embedMode === "SIZED_CONTAINER" ? {
      width: width,
      height: height,
    } : {};

    return (
      <div 
        id={id} 
        className={containerClass}
        style={containerStyle}
      />
    );
  }
}

export default PDFEmbed;
