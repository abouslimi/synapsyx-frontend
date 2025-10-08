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
import ViewSDKClient from "../../ViewSDKClient";
import CustomRHP from "./CustomRHP";
import "./CustomUI.css";
import type { ViewerConfig, AnnotationManager } from '../../types';
import '../../index.css';

interface UIConfigurationsProps {
  className?: string;
  id?: string;
  onPDFLoaded?: () => void;
  onAnnotationManagerReady?: (manager: AnnotationManager) => void;
}

interface UIConfigurationsState {
  annotationManager?: AnnotationManager;
}

class UIConfigurations extends Component<UIConfigurationsProps, UIConfigurationsState> {
  private viewerConfig: ViewerConfig = {
    /* Enable commenting APIs */
    enableAnnotationAPIs: true,  /* Default value is false */
    /* Set UI configurations */
    showCommentsPanel: false,  /* Default value is true */
    downloadWithAnnotations: true,  /* Default value is false */
    printWithAnnotations: true,  /* Default value is false */
  };
  private previewFilePromise?: Promise<any>;

  constructor(props: UIConfigurationsProps) {
    super(props);
    this.state = {
      annotationManager: undefined
    };
  }

  setAnnotationManager = (annotManager: AnnotationManager) => {
    this.setState({
      annotationManager: annotManager
    });
    this.props.onAnnotationManagerReady?.(annotManager);
  }

  componentDidMount() {
    const viewSDKClient = new ViewSDKClient();
    viewSDKClient.ready().then(() => {
      /* Invoke the file preview and get the Promise object */
      this.previewFilePromise = viewSDKClient.previewFile("pdf-div", this.viewerConfig);
      /* Use the annotation manager interface to invoke the commenting APIs */ 
      this.previewFilePromise.then(adobeViewer => {
        adobeViewer.getAnnotationManager().then((annotManager: AnnotationManager) => {
          this.setAnnotationManager(annotManager);
        });
        this.props.onPDFLoaded?.();
      });
    });
  }

  render() {
    const { className = "container", id = "pdf-div" } = this.props;
    
    return (
      <div className={className}>
        <div id={id} className="pdf-view" />
        {
          this.state.annotationManager &&
          <CustomRHP
            annotationManager={this.state.annotationManager}
          />
        }
      </div>
    );
  }
}

export default UIConfigurations;
