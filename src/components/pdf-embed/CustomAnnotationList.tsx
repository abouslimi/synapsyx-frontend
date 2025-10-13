import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Edit2, 
  Trash2, 
  MessageSquare, 
  FileText, 
  Calendar,
  User,
  Eye,
  EyeOff
} from 'lucide-react';
import { pdfAnnotationService, type PdfAnnotationResponse } from '@/lib/pdfAnnotationService';

interface AnnotationItemProps {
  annotation: PdfAnnotationResponse;
  onEdit: (annotationId: string, newBodyValue: string) => void;
  onDelete: (annotationId: string) => void;
  onSelect?: (annotationId: string) => void;
  isSelected?: boolean;
}

const AnnotationItem: React.FC<AnnotationItemProps> = ({
  annotation,
  onEdit,
  onDelete,
  onSelect,
  isSelected = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(annotation.annotation.bodyValue || '');

  const handleEdit = () => {
    if (isEditing) {
      onEdit(annotation.annotation_id, editValue);
      setIsEditing(false);
    } else {
      setEditValue(annotation.annotation.bodyValue || '');
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(annotation.annotation.bodyValue || '');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAnnotationTypeIcon = (subtype?: string) => {
    switch (subtype) {
      case 'highlight':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'freetext':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAnnotationTypeColor = (subtype?: string) => {
    switch (subtype) {
      case 'highlight':
        return 'bg-yellow-50 border-yellow-200';
      case 'freetext':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card 
      className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      } ${getAnnotationTypeColor(annotation.annotation.target?.selector?.subtype)}`}
      onClick={() => onSelect?.(annotation.annotation_id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getAnnotationTypeIcon(annotation.annotation.target?.selector?.subtype)}
            <CardTitle className="text-sm font-medium">
              Page {isNaN(annotation.annotation.pageNumber) ? 'Unknown' : annotation.annotation.pageNumber}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {annotation.annotation.target?.selector?.subtype || 'annotation'}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(annotation.annotation_id);
              }}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter annotation text..."
              className="text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEdit} className="h-7 text-xs">
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} className="h-7 text-xs">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-700 leading-relaxed">
              {annotation.annotation.bodyValue || 'No text content'}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(annotation.created_at)}
              </div>
              {annotation.annotation.creator?.name && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {annotation.annotation.creator.name}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface CustomAnnotationListProps {
  annotations: PdfAnnotationResponse[];
  onEditAnnotation: (annotationId: string, newBodyValue: string) => void;
  onDeleteAnnotation: (annotationId: string) => void;
  onAnnotationSelect?: (annotationId: string) => void;
  selectedAnnotationId?: string;
  className?: string;
}

const CustomAnnotationList: React.FC<CustomAnnotationListProps> = ({
  annotations,
  onEditAnnotation,
  onDeleteAnnotation,
  onAnnotationSelect,
  selectedAnnotationId,
  className = ''
}) => {
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  console.log('CustomAnnotationList received annotations:', annotations);
  console.log('CustomAnnotationList annotations length:', annotations?.length);
  console.log('Sample annotation pageNumber:', annotations?.[0]?.annotation?.pageNumber);
  console.log('Sample annotation pageNumber type:', typeof annotations?.[0]?.annotation?.pageNumber);
  console.log('Sample annotation:', annotations?.[0]);

  // Filter annotations based on search term
  const filteredAnnotations = (annotations || []).filter(annotation =>
    annotation.annotation.bodyValue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    annotation.annotation.target?.selector?.subtype?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('Filtered annotations:', filteredAnnotations);

  // Group annotations by page
  const annotationsByPage = filteredAnnotations.reduce((acc, annotation) => {
    const page = parseInt(annotation.annotation.pageNumber?.toString() || '1', 10);
    const validPage = isNaN(page) ? 1 : page;
    console.log('Processing annotation:', annotation.annotation.id, 'pageNumber:', annotation.annotation.pageNumber, 'parsed:', page, 'validPage:', validPage);
    if (!acc[validPage]) {
      acc[validPage] = [];
    }
    acc[validPage].push(annotation);
    return acc;
  }, {} as Record<number, PdfAnnotationResponse[]>);

  const sortedPages = Object.keys(annotationsByPage)
    .map(Number)
    .sort((a, b) => a - b);

  console.log('annotationsByPage:', annotationsByPage);
  console.log('sortedPages:', sortedPages);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Annotations</h3>
          <Badge variant="secondary">{annotations?.length || 0}</Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAnnotations(!showAnnotations)}
          className="h-8 w-8 p-0"
        >
          {showAnnotations ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <Input
          placeholder="Search annotations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Annotations List */}
      <ScrollArea className="flex-1 p-4">
        {!showAnnotations ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <EyeOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Annotations are hidden</p>
            </div>
          </div>
        ) : filteredAnnotations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No annotations match your search' : 'No annotations yet'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm ? 'Try a different search term' : 'Add annotations by highlighting text in the PDF viewer'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPages.map(pageNumber => (
              <div key={pageNumber}>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <h4 className="text-sm font-medium text-gray-700">
                    Page {isNaN(pageNumber) ? 'Unknown' : pageNumber}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {annotationsByPage[pageNumber]?.length || 0} annotation{(annotationsByPage[pageNumber]?.length || 0) !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {(annotationsByPage[pageNumber] || []).map(annotation => (
                    <AnnotationItem
                      key={annotation.annotation_id}
                      annotation={annotation}
                      onEdit={onEditAnnotation}
                      onDelete={onDeleteAnnotation}
                      onSelect={onAnnotationSelect}
                      isSelected={selectedAnnotationId === annotation.annotation_id}
                    />
                  ))}
                </div>
                {sortedPages.length > 0 && pageNumber < sortedPages[sortedPages.length - 1] && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default CustomAnnotationList;
