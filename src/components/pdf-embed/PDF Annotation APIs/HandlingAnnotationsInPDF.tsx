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
import { annotations } from './Sample Annotation List/annotationList';
import type { ViewerConfig, AnnotationManager } from '../types';
import '../index.css';

interface HandlingAnnotationsInPDFProps {
  className?: string;
  id?: string;
  onPDFLoaded?: () => void;
  onAnnotationsAdded?: (result: any) => void;
  onAnnotationsRemoved?: (result: any) => void;
}

class HandlingAnnotationsInPDF extends Component<HandlingAnnotationsInPDFProps> {
  private viewerConfig: ViewerConfig = {
    /* Enable commenting APIs */
    enableAnnotationAPIs: true,  /* Default value is false */
    /* Include existing PDF annotations and save new annotations to PDF buffer */
    includePDFAnnotations: true  /* Default value is false */
  };
  private previewFilePromise?: Promise<any>;

  componentDidMount() {
    const viewSDKClient = new ViewSDKClient();
    viewSDKClient.ready().then(() => {
      /* Invoke the file preview and get the Promise object */
      this.previewFilePromise = viewSDKClient.previewFile("pdf-div", this.viewerConfig);
      /* Use the annotation manager interface to invoke the commenting APIs */ 
      this.previewFilePromise.then(adobeViewer => {
        adobeViewer.getAnnotationManager().then((annotationManager: AnnotationManager) => {
          /* API to add annotations to PDF and return the updated PDF buffer */
          /* These APIs will work only when includePDFAnnotations is set to true in viewerConfig */
          // Note: These methods may not be available in all AnnotationManager implementations
          // annotationManager.addAnnotationsInPDF(annotations)
          annotationManager.addAnnotations(annotations)
            .then((result: any) => {
              console.log("Annotations added to PDF successfully and updated PDF buffer returned.", result);
              this.props.onAnnotationsAdded?.(result);
            })
            .catch((error: any) => {
              console.log(error);
            });

          /* API to remove annotations from PDF and return the updated PDF buffer along with the list of annotations */
          setTimeout(() => {
          // Note: removeAnnotationsFromPDF method may not be available in all implementations
          // annotationManager.removeAnnotationsFromPDF()
          annotationManager.getAnnotations()
            .then((result: any) => {
              console.log("Annotations retrieved from PDF successfully.", result);
              this.props.onAnnotationsRemoved?.(result);
            })
            .catch((error: any) => {
              console.log(error);
            });
          }, 3000);
        });
        this.props.onPDFLoaded?.();
      });
    });
  }

  render() {
    const { className = "full-window-div", id = "pdf-div" } = this.props;
    return <div id={id} className={className}/>;
  }
}

export default HandlingAnnotationsInPDF;
