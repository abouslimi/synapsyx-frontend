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
import ViewSDKClient from '../ViewSDKClient';
import '../index.css';

interface SizedContainerProps {
  className?: string;
  id?: string;
  width?: number;
  height?: number;
}

class SizedContainer extends Component<SizedContainerProps> {
  componentDidMount() {
    const viewSDKClient = new ViewSDKClient();
    viewSDKClient.ready().then(() => {
      /* Invoke file preview */
      viewSDKClient.previewFile("pdf-div", {
        /* Pass the embed mode option here */
        embedMode: "SIZED_CONTAINER"
      });
    });
  }

  render() {
    const { 
      className = "sized-container-div", 
      id = "pdf-div",
      width = 600,
      height = 476 
    } = this.props;
    
    const containerStyle = {
      width: `${width}px`,
      height: `${height}px`,
    };
    
    return <div id={id} className={className} style={containerStyle}/>;
  }
}

export default SizedContainer;
