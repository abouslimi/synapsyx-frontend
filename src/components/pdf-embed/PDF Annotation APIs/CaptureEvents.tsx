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

interface CaptureEventsProps {
  className?: string;
  id?: string;
  onPDFLoaded?: () => void;
  onAnnotationEvent?: (event: any) => void;
  eventsToListen?: string[];
}

class CaptureEvents extends Component<CaptureEventsProps> {
  private viewerConfig: ViewerConfig = {
    /* Enable commenting APIs */
    enableAnnotationAPIs: true,  /* Default value is false */
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
          /* API to add annotations */
          // Ensure each annotation has a pageNumber property as required by Annotation type
          const annotationsWithPageNumber = annotations.map(annotation => ({
            ...annotation,
            pageNumber: annotation.target?.selector?.node?.index !== undefined
              ? annotation.target.selector.node.index + 1
              : 1, // Default to 1 if not found
          }));
          annotationManager.addAnnotations(annotationsWithPageNumber)
            .then(() => {
              console.log("Annotations added through API successfully");
            })
            .catch(error => {
              console.log(error);
            });

          /* API to register events listener */
          (annotationManager as any).registerEventListener(
            (event: any) => {
              console.log(event);
              this.props.onAnnotationEvent?.(event);
            },
            {
              /* Pass the list of events in listenOn. */
              /* If no event is passed in listenOn, then all the annotation events will be received. */
              listenOn: this.props.eventsToListen || [
                /* "ANNOTATION_ADDED", "ANNOTATION_CLICKED" */
              ]
            }
          );
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

export default CaptureEvents;
