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
import type { ViewerConfig, AnnotationManager, AnnotationFilter } from '../types';
import '../index.css';

interface CRUDAPIsProps {
  className?: string;
  id?: string;
  onAnnotationAdded?: () => void;
  onAnnotationDeleted?: () => void;
  onAnnotationUpdated?: () => void;
}

class CRUDAPIs extends Component<CRUDAPIsProps> {
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
          const annotationsWithPageNumber = annotations.map(annotation => ({
            ...annotation,
            pageNumber: annotation.target?.selector?.node?.index || 0
          }));
          annotationManager.addAnnotations(annotationsWithPageNumber)
            .then(() => {
              console.log("Annotations added through API successfully");
              this.props.onAnnotationAdded?.();
            })
            .catch(error => {
              console.log(error);
            });

          /* API to get all annotations */
          annotationManager.getAnnotations()
            .then(result => {
              console.log("GET all annotations", result);
            })
            .catch(error => {
              console.log(error);
            });

          /* API to delete annotations based on annotation ID filter */
          let filter: AnnotationFilter = {
            annotationIds: ["3adeae16-a868-4653-960e-613c048dddc5", "079d66a4-5ec2-4703-ae9d-30ccbb1aa84c"]
          };
          annotationManager.deleteAnnotations(filter)
            .then(() => {
              console.log("Deleted annotations based on annotation ID filter.");
              this.props.onAnnotationDeleted?.();
            })
            .catch(error => {
              console.log(error);
            });

          /* API to delete annotations based on page range filter */
          filter = {
            pageRange: {
              startPage: 4,
              endPage: 6
            }
          };
          annotationManager.deleteAnnotations(filter)
            .then(() => {
              console.log("Deleted annotations based on page range filter");
              this.props.onAnnotationDeleted?.();
            })
            .catch(error => {
              console.log(error);
            });

          /* API to get annotations after deletion */
          annotationManager.getAnnotations()
            .then(result => {
              console.log("GET annotations result after deleting annotations", result);
            })
            .catch(error => {
              console.log(error);
            });

          /* API to update a single annotation */
          const newComment = "Preserving your legacy with Bodea life insurance plans.";
          setTimeout(() => {
            annotations[3].bodyValue = newComment;
            const updatedAnnotation = {
              ...annotations[3],
              pageNumber: annotations[3].target?.selector?.node?.index || 0
            };
            annotationManager.updateAnnotation(updatedAnnotation)
              .then(() => {
                console.log("Annotation updated through API successfully");
                this.props.onAnnotationUpdated?.();
              })
              .catch((error) => {
                console.log(error);
              });
          }, 3000);
        });
      });
    });
  }

  render() {
    const { className = "full-window-div", id = "pdf-div" } = this.props;
    return <div id={id} className={className}/>;
  }
}

export default CRUDAPIs;
