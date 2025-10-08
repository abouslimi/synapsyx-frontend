/*
Copyright 2020 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe.
*/

import { useState } from 'react';
import { PDFEmbed } from './index';
import type { PDFEmbedProps } from './index';

interface PDFViewerExampleProps {
  /** Custom PDF URL */
  pdfUrl?: string;
  /** Custom PDF file name */
  fileName?: string;
}

const PDFViewerExample: React.FC<PDFViewerExampleProps> = ({ 
  pdfUrl = "https://acrobatservices.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf",
  fileName = "Bodea Brochure.pdf"
}) => {
  const [embedMode, setEmbedMode] = useState<PDFEmbedProps['embedMode']>('FULL_WINDOW');
  const [enableAnnotations, setEnableAnnotations] = useState(false);
  const [showTools, setShowTools] = useState(true);

  const handlePDFLoaded = () => {
    console.log('PDF loaded successfully');
  };

  const handlePDFError = (error: any) => {
    console.error('PDF loading error:', error);
  };

  return (
    <div className="pdf-viewer-example">
      <div className="controls" style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>PDF Viewer Controls</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            Embed Mode:
            <select 
              value={embedMode} 
              onChange={(e) => setEmbedMode(e.target.value as PDFEmbedProps['embedMode'])}
              style={{ marginLeft: '10px' }}
            >
              <option value="FULL_WINDOW">Full Window</option>
              <option value="IN_LINE">In Line</option>
              <option value="SIZED_CONTAINER">Sized Container</option>
              <option value="LIGHT_BOX">Light Box</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>
            <input 
              type="checkbox" 
              checked={enableAnnotations}
              onChange={(e) => setEnableAnnotations(e.target.checked)}
            />
            Enable Annotations
          </label>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>
            <input 
              type="checkbox" 
              checked={showTools}
              onChange={(e) => setShowTools(e.target.checked)}
            />
            Show Tools
          </label>
        </div>
      </div>

      <PDFEmbed
        pdfUrl={pdfUrl}
        fileName={fileName}
        embedMode={embedMode}
        enableAnnotations={enableAnnotations}
        showAnnotationTools={showTools}
        showDownloadPDF={showTools}
        showPrintPDF={showTools}
        showLeftHandPanel={showTools}
        showPageControls={showTools}
        showZoomControl={showTools}
        onPDFLoaded={handlePDFLoaded}
        onPDFError={handlePDFError}
        className={embedMode === 'IN_LINE' ? 'in-line-container' : undefined}
        width={embedMode === 'SIZED_CONTAINER' ? 800 : undefined}
        height={embedMode === 'SIZED_CONTAINER' ? 600 : undefined}
      />
    </div>
  );
};

export default PDFViewerExample;
