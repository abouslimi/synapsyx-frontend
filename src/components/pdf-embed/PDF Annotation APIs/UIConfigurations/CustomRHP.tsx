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
import type { Annotation, AnnotationManager } from "../../types";

interface ListItemProps {
  annotation: Annotation;
  selectedAnnotationId?: string;
  annotationManager: AnnotationManager;
}

interface ListItemState {
  inEditMode: boolean;
  editInputValue?: string;
}

class ListItem extends Component<ListItemProps, ListItemState> {
  constructor(props: ListItemProps) {
    super(props);
    this.state = {
      inEditMode: false,
      editInputValue: undefined
    };
  }

  /* Bind editAnnotation to edit button. */
  editButtonOnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    /* If in editMode */
    if (this.state.inEditMode) {
      this.editAnnotation(this.props.annotation);
      /* toggle editMode */
      this.setState({
        inEditMode: false
      });
    } else {
      /* Default input value */
      if (!this.state.editInputValue) {
        this.setState({
          editInputValue: this.props.annotation.bodyValue
        });
      }
      /* toggle editMode */
      this.setState({
        inEditMode: true
      });
    }
  };

  /* Bind deleteAnnotation to delete button. */
  deleteButtonOnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    this.deleteAnnotation(this.props.annotation.id);
  };

  listItemOnClick = () => {
    // Note: selectAnnotation method may not be available in all AnnotationManager implementations
    // this.props.annotationManager.selectAnnotation(this.props.annotation.id)
    //   .then(() => {})
    //   .catch((error: any) => {
    //     console.log(error);
    //   });
    console.log('Annotation clicked:', this.props.annotation.id);
  }

  editInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    this.setState({
      editInputValue: e.target.value
    });
  }

  /* Edit an existing annotation using Annotation API and update the list item as well. */
  editAnnotation = (annotation: Annotation) => {
    annotation.bodyValue = this.state.editInputValue;
    this.props.annotationManager.updateAnnotation(annotation)
      .then(() => {
        console.log("Annotation updated successfully.");
      })
      .catch(error => {
        console.log(error);
      });
  };

  /* Delete an existing annotation from Annotation API (the same will be removed from list as well) */
  deleteAnnotation = (annotationId: string) => {
    const filter = {
      annotationIds: [annotationId]
    };
    this.props.annotationManager.deleteAnnotations(filter)
      .then(() => {
        console.log("Annotation deleted successfully.");
      })
      .catch(error => {
        console.log(error);
      });
  };

  render() {
    const {
      inEditMode,
    } = this.state;

    const {
      annotation,
      selectedAnnotationId
    } = this.props;

    return (
      <li
        id={annotation.id}
        className={selectedAnnotationId === annotation.id ? "selected" : "unselected"}
        onClick={this.listItemOnClick}
      >
        {
          inEditMode ?
            <input type="text" defaultValue={annotation.bodyValue} onChange={this.editInputOnChange}/> :
            <label>{annotation.bodyValue}</label>
        }
        <button className="edit" onClick={this.editButtonOnClick}>{inEditMode ? "Save" : "Edit"}</button>
        <button className="delete" onClick={this.deleteButtonOnClick}>Delete</button>
      </li>
    );
  }
}

interface CustomRHPProps {
  annotationManager: AnnotationManager;
}

interface CustomRHPState {
  annotationListItems: Annotation[];
  selectedAnnotationId?: string;
}

class CustomRHP extends Component<CustomRHPProps, CustomRHPState> {
  state: CustomRHPState = {
    annotationListItems: [],
    selectedAnnotationId: undefined
  };

  componentDidMount() {
    /* API to register events listener - method may not be available in all implementations */
    // this.props.annotationManager.registerEventListener(this.annotationEventListener);
    console.log('CustomRHP mounted');
  }

  annotationEventListener = (event: any) => {
    if (event.type === "ANNOTATION_ADDED") {
      if (event.data.bodyValue) {
        this.onAnnotationAdded(event.data);
      } else {
        this.addCommentText(event.data);
      }
    }
    if (event.type === "ANNOTATION_DELETED") {
      this.onAnnotationDeleted(event.data.id);
    }
    if (event.type === "ANNOTATION_SELECTED") {
      this.toggleSelectedAnnotation(event.data.id);
    }
    if (event.type === "ANNOTATION_UNSELECTED") {
      this.toggleSelectedAnnotation();
    }
    if (event.type === "ANNOTATION_UPDATED" && event.data.target.selector.subtype === "freetext") {
      this.onTextAnnotationUpdated(event.data);
    }
    console.log(event);
  }

  /* This will add a new annotation list item to list maintained in state */
  onAnnotationAdded = (annotation: Annotation) => {
    this.setState({
      annotationListItems: [...this.state.annotationListItems, annotation]
    });
  };

  /* This will delete the annotation list item from list maintained in state */
  onAnnotationDeleted = (id: string) => {
    this.setState({
      annotationListItems: this.state.annotationListItems.filter(item => item.id !== id)
    });
  }

  /* This will set/unset selected annotation id in state */
  toggleSelectedAnnotation = (id?: string) => {
    this.setState({
      selectedAnnotationId: id
    });
  }

  /* This will update the text in the annotation list item when text annotation is updated from UI */
  onTextAnnotationUpdated = (annotation: Annotation) => {
    const index = this.state.annotationListItems.findIndex(item => item.id === annotation.id);
    if (index !== -1) {
      this.state.annotationListItems[index].bodyValue = annotation.bodyValue;
      this.setState({
        annotationListItems: this.state.annotationListItems
      });
    }
  }

  addCommentText = (annotation: Annotation) => {
    const type = annotation.target?.selector?.subtype || 'annotation';
    const comment = prompt("Enter the text associated with " + type, "Added a " + type) || "Added a " + type;
    annotation.bodyValue = comment;
    this.props.annotationManager.updateAnnotation(annotation)
      .then(() => {
        console.log("Annotation updated successfully.");
        this.onAnnotationAdded(annotation);
      })
      .catch(error => {
        console.log(error);
      });
  }

  render() {
    return (
      <div className="annotations-container">
        <h3>Annotations</h3>
        <ul id="annotations">
          {
            this.state.annotationListItems.map(listItem =>
              <ListItem
                key={listItem.id}
                annotation={listItem}
                selectedAnnotationId={this.state.selectedAnnotationId}
                annotationManager={this.props.annotationManager}
              />
            )
          }
        </ul>
      </div>
    );
  }
}

export default CustomRHP;
