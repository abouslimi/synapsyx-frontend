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

interface InLineProps {
  className?: string;
  containerClassName?: string;
  id?: string;
}

class InLine extends Component<InLineProps> {
  componentDidMount() {
    const viewSDKClient = new ViewSDKClient();
    viewSDKClient.ready().then(() => {
      /* Invoke file preview */
      viewSDKClient.previewFile("pdf-div", {
        /* Pass the embed mode option here */
        embedMode: "IN_LINE"
      });
    });
  }

  render() {
    const { 
      className = "in-line-div", 
      containerClassName = "in-line-container",
      id = "pdf-div" 
    } = this.props;
    
    return (
      <div className={containerClassName}>
        <div id={id} className={className}/>
      </div>
    );
  }
}

export default InLine;
