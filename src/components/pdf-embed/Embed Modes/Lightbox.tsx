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
import ViewSDKClient from "../ViewSDKClient";
import '../index.css';

interface LightboxProps {
  className?: string;
  containerClassName?: string;
  buttonText?: string;
  onPreview?: () => void;
}

class Lightbox extends Component<LightboxProps> {
  private viewSDKClient: ViewSDKClient;

  constructor(props: LightboxProps) {
    super(props);
    this.viewSDKClient = new ViewSDKClient();
  }

  previewFile = () => {
    this.viewSDKClient.ready().then(() => {
      /* Invoke file preview */
      this.viewSDKClient.previewFile("", {
        /* Pass the embed mode option here */
        embedMode: "LIGHT_BOX"
      });
      this.props.onPreview?.();
    });
  }

  render() {
    const { 
      className = "light-box-container", 
      containerClassName = "container",
      buttonText = "View PDF" 
    } = this.props;
    
    return (
      <div id={containerClassName} className={className}>
        <button onClick={this.previewFile} className="lb-view-file-btn">
          {buttonText}
        </button>
      </div>
    );
  }
}

export default Lightbox;
