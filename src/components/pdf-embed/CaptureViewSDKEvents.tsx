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
import './index.css';

interface CaptureViewSDKEventsProps {
  className?: string;
  id?: string;
}

class CaptureViewSDKEvents extends Component<CaptureViewSDKEventsProps> {
  componentDidMount() {
    const viewSDKClient = new ViewSDKClient();
    viewSDKClient.ready().then(() => {
      /* Invoke file preview */
      viewSDKClient.previewFile("pdf-div", {});
      /* Register the callback to receive the events */
      viewSDKClient.registerEventsHandler();
    });
  }

  render() {
    const { className = "full-window-div", id = "pdf-div" } = this.props;
    return <div id={id} className={className}/>;
  }
}

export default CaptureViewSDKEvents;
