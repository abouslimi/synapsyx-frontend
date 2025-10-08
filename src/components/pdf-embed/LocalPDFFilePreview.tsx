/*
Copyright 2020 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe.
*/

import React, { Component } from "react";
import ViewSDKClient from "./ViewSDKClient";
import './index.css';

interface LocalPDFFilePreviewProps {
  className?: string;
  id?: string;
  onFileLoad?: (fileName: string) => void;
}

class LocalPDFFilePreview extends Component<LocalPDFFilePreviewProps> {
  private viewSDKClient: ViewSDKClient;

  constructor(props: LocalPDFFilePreviewProps) {
    super(props);
    this.viewSDKClient = new ViewSDKClient();
  }

  /* Helper function to check if selected file is PDF or not. */
  isValidPDF = (file: File): boolean => {
    if (file.type === "application/pdf") {
      return true;
    }
    if (file.type === "" && file.name) {
      const fileName = file.name;
      const lastDotIndex = fileName.lastIndexOf(".");
      if (lastDotIndex === -1 || fileName.substr(lastDotIndex).toUpperCase() !== "PDF") return false;
      return true;
    }
    return false;
  };

  /* Helper function to be executed on file upload
  * for creating Promise which resolve to ArrayBuffer of file data.
  **/
  onFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.persist();
    this.viewSDKClient.ready().then(() => {
      const files = event.target.files;
      if (files && files.length > 0 && this.isValidPDF(files[0])) {
        const fileName = files[0].name;
        const reader = new FileReader();
        reader.onloadend = (e) => {
          const filePromise = Promise.resolve(e.target?.result as ArrayBuffer);
          /* Helper function to render the file using PDF Embed API. */
          this.viewSDKClient.previewFileUsingFilePromise("pdf-div", filePromise, fileName);
          this.props.onFileLoad?.(fileName);
        };
        reader.readAsArrayBuffer(files[0]);
      }
    });
  }

  render() {
    const { className = "full-window-div", id = "pdf-div" } = this.props;
    
    return (
      <div id={id} className={className}>
        <div style={{ margin: "50px" }}>
          <label htmlFor="file-picker" className="file-picker">Choose PDF File</label>
          {/* Listen for file upload */}
          <input 
            onChange={this.onFileUpload} 
            type="file" 
            id="file-picker" 
            name="file-picker"
            accept="application/pdf" 
            className="file-input"
          />
        </div>
      </div>
    );
  }
}

export default LocalPDFFilePreview;
