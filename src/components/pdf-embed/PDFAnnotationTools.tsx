/*
Copyright 2020 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe.
*/

import { Component } from "react";
import ViewSDKClient from "./ViewSDKClient";
import type { ViewerConfig } from './types';
import './index.css';

interface PDFAnnotationToolsProps {
  className?: string;
  id?: string;
  onPDFLoaded?: () => void;
  onSave?: (metaData: any, content: any, options: any) => void;
}

class PDFAnnotationTools extends Component<PDFAnnotationToolsProps> {
  componentDidMount() {
    const viewSDKClient = new ViewSDKClient();
    viewSDKClient.ready().then(() => {
      /* Invoke file preview */
      const viewerConfig: ViewerConfig = {
        /* Control the viewer customization. */
        showAnnotationTools: true,
        enableFormFilling: true
      };
      
      viewSDKClient.previewFile("pdf-div", viewerConfig);
      /* Register Save API handler */
      viewSDKClient.registerSaveApiHandler();
      this.props.onPDFLoaded?.();
    });
  }

  render() {
    const { className = "full-window-div", id = "pdf-div" } = this.props;
    return (
      <div id={id} className={className}/>
    );
  }
}

export default PDFAnnotationTools;
