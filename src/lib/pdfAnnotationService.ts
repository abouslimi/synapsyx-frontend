// PDF Annotation API Service
// This service handles all CRUD operations for PDF annotations

import { buildApiUrl } from './apiConfig';

// Types based on the API specification
export interface AnnotationData {
  "@context"?: string[];
  type: string;
  id: string;
  pageNumber: number;
  bodyValue?: string;
  motivation?: string;
  target: {
    source: string;
    selector: {
      node?: {
        index: number;
      };
      opacity?: number;
      subtype?: string;
      boundingBox?: number[];
      quadPoints?: number[];
      strokeColor?: string;
      strokeWidth?: number;
      type: string;
    };
  };
  creator?: {
    type: string;
    name: string;
  };
  created?: string;
  modified?: string;
  [key: string]: any;
}

export interface PdfAnnotationCreateRequest {
  course_section_id?: string | null;
  summary_id?: string | null;
  is_summary?: boolean;
  annotation: AnnotationData;
}

export interface PdfAnnotationUpdateRequest {
  annotation: AnnotationData;
}

export interface PdfAnnotationBulkCreateRequest {
  course_section_id?: string | null;
  summary_id?: string | null;
  annotations: AnnotationData[];
}

export interface PdfAnnotationBulkUpdateRequest {
  annotations: Array<{
    annotation_id: string;
    annotation: AnnotationData;
  }>;
}

export interface PdfAnnotationResponse {
  annotation_id: string;
  user_id: string;
  course_section_id?: string | null;
  summary_id?: string | null;
  annotation: AnnotationData;
  created_at: string;
  updated_at: string;
}

export interface PdfAnnotationListResponse {
  annotations: PdfAnnotationResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

class PdfAnnotationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = buildApiUrl('/api/pdf-annotations');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private getAuthHeaders(accessToken?: string): Record<string, string> {
    if (!accessToken) {
      throw new Error('Access token is required for PDF annotation operations');
    }
    return {
      'Authorization': `Bearer ${accessToken}`,
    };
  }

  // Create a single annotation
  async createAnnotation(
    request: PdfAnnotationCreateRequest,
    accessToken: string
  ): Promise<PdfAnnotationResponse> {
    return this.makeRequest<PdfAnnotationResponse>('', {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(request),
    });
  }

  // Get annotations with optional filtering
  async getAnnotations(
    params: {
      course_section_id?: string;
      summary_id?: string;
      is_summary?: boolean;
      page?: number;
      per_page?: number;
    } = {},
    accessToken: string
  ): Promise<PdfAnnotationListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.course_section_id) {
      searchParams.append('course_section_id', params.course_section_id);
    }
    if (params.summary_id) {
      searchParams.append('summary_id', params.summary_id);
    }
    if (params.is_summary !== undefined) {
      searchParams.append('is_summary', params.is_summary.toString());
    }
    if (params.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params.per_page) {
      searchParams.append('per_page', params.per_page.toString());
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `?${queryString}` : '';

    return this.makeRequest<PdfAnnotationListResponse>(endpoint, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    });
  }

  // Get a specific annotation by ID
  async getAnnotationById(
    annotationId: string,
    accessToken: string
  ): Promise<PdfAnnotationResponse> {
    return this.makeRequest<PdfAnnotationResponse>(`/${annotationId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    });
  }

  // Update an annotation
  async updateAnnotation(
    annotationId: string,
    request: PdfAnnotationUpdateRequest,
    accessToken: string
  ): Promise<PdfAnnotationResponse> {
    return this.makeRequest<PdfAnnotationResponse>(`/${annotationId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(request),
    });
  }

  // Delete an annotation
  async deleteAnnotation(
    annotationId: string,
    accessToken: string
  ): Promise<SuccessResponse> {
    return this.makeRequest<SuccessResponse>(`/${annotationId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(accessToken),
    });
  }

  // Bulk create annotations
  async bulkCreateAnnotations(
    request: PdfAnnotationBulkCreateRequest,
    accessToken: string
  ): Promise<PdfAnnotationResponse[]> {
    return this.makeRequest<PdfAnnotationResponse[]>('/bulk', {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(request),
    });
  }

  // Bulk update annotations
  async bulkUpdateAnnotations(
    request: PdfAnnotationBulkUpdateRequest,
    accessToken: string
  ): Promise<PdfAnnotationResponse[]> {
    return this.makeRequest<PdfAnnotationResponse[]>('/bulk', {
      method: 'PUT',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(request),
    });
  }

  // Bulk delete annotations
  async bulkDeleteAnnotations(
    annotationIds: string[],
    accessToken: string
  ): Promise<SuccessResponse> {
    return this.makeRequest<SuccessResponse>('/bulk', {
      method: 'DELETE',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(annotationIds),
    });
  }

  // Clean up orphaned annotations (replies with missing parents)
  async cleanupOrphanedAnnotations(
    annotations: PdfAnnotationResponse[],
    accessToken: string
  ): Promise<SuccessResponse> {
    const annotationMap = new Set(annotations.map(ann => ann.annotation_id));
    const orphanedAnnotationIds: string[] = [];

    annotations.forEach(annotation => {
      const targetSource = annotation.annotation.target?.source;
      const isReply = targetSource && annotation.annotation.motivation === 'replying';
      
      if (isReply && !annotationMap.has(targetSource)) {
        orphanedAnnotationIds.push(annotation.annotation_id);
      }
    });

    if (orphanedAnnotationIds.length === 0) {
      return { success: true, message: 'No orphaned annotations found' };
    }

    console.log(`Cleaning up ${orphanedAnnotationIds.length} orphaned annotations:`, orphanedAnnotationIds);
    return this.bulkDeleteAnnotations(orphanedAnnotationIds, accessToken);
  }

  // Helper method to convert Adobe annotation to API format
  convertAdobeAnnotationToApi(
    adobeAnnotation: any,
    _courseSectionId?: string,
    _summaryId?: string
  ): AnnotationData {
    // Ensure @context is properly formatted as an array
    const context = adobeAnnotation["@context"];
    const contextArray = Array.isArray(context) 
      ? context 
      : [
          "https://www.w3.org/ns/anno.jsonld",
          "https://comments.acrobat.com/ns/anno.jsonld"
        ];

    return {
      "@context": contextArray,
      type: adobeAnnotation.type || "Annotation",
      id: adobeAnnotation.id,
      pageNumber: adobeAnnotation.pageNumber,
      bodyValue: adobeAnnotation.bodyValue,
      motivation: adobeAnnotation.motivation || "commenting",
      target: adobeAnnotation.target,
      creator: adobeAnnotation.creator,
      created: adobeAnnotation.created,
      modified: adobeAnnotation.modified,
    };
  }

  // Helper method to convert API annotation to Adobe format
  convertApiAnnotationToAdobe(apiAnnotation: PdfAnnotationResponse): any {
    const annotation = apiAnnotation.annotation;
    
    // Ensure @context is properly formatted as an array for Adobe
    const adobeAnnotation = {
      ...annotation,
      "@context": Array.isArray(annotation["@context"]) 
        ? annotation["@context"] 
        : [
            "https://www.w3.org/ns/anno.jsonld",
            "https://comments.acrobat.com/ns/anno.jsonld"
          ],
      // Ensure the annotation has the correct structure for Adobe
      pageNumber: annotation.pageNumber,
    };
    
    return adobeAnnotation;
  }
}

// Export singleton instance
export const pdfAnnotationService = new PdfAnnotationService();
export default pdfAnnotationService;
