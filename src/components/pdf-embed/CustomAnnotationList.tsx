import React, { useState } from 'react';
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
  EyeOff,
  Reply,
  AlertTriangle
} from 'lucide-react';
import { type PdfAnnotationResponse } from '@/lib/pdfAnnotationService';

// Utility functions for translating annotation values
const translateMotivation = (motivation?: string): string => {
  switch (motivation) {
    case 'replying':
      return 'réponse';
    case 'commenting':
      return 'commentaire';
    default:
      return motivation || 'annotation';
  }
};

const translateSubtype = (subtype?: string): string => {
  switch (subtype) {
    case 'note':
      return 'note';
    case 'highlight':
      return 'surlignage';
    case 'shape':
      return 'forme';
    case 'underline':
      return 'soulignement';
    case 'strikeout':
      return 'barré';
    case 'freetext':
      return 'texte libre';
    default:
      return subtype || 'annotation';
  }
};

// Utility function to group annotations with their replies
const groupAnnotationsWithReplies = (annotations: PdfAnnotationResponse[]) => {
  const annotationMap = new Map<string, PdfAnnotationResponse>();
  const replyMap = new Map<string, PdfAnnotationResponse[]>();
  const topLevelAnnotations: PdfAnnotationResponse[] = [];
  const orphanedAnnotations: PdfAnnotationResponse[] = [];

  // First pass: create annotation map and identify all annotation IDs
  annotations.forEach(annotation => {
    annotationMap.set(annotation.annotation_id, annotation);
  });

  // Second pass: identify replies and top-level annotations
  annotations.forEach(annotation => {
    const targetSource = annotation.annotation.target?.source;
    
    // Check if this annotation is a reply to another annotation
    // A reply has target.source pointing to another annotation's ID
    const isReply = targetSource && annotation.annotation.motivation === 'replying';
    
    if (isReply) {
      if (annotationMap.has(targetSource)) {
        // This is a reply to an existing annotation
        if (!replyMap.has(targetSource)) {
          replyMap.set(targetSource, []);
        }
        replyMap.get(targetSource)!.push(annotation);
      } else {
        // This is an orphaned reply - parent annotation doesn't exist
        console.warn(`Orphaned reply annotation found: ${annotation.annotation_id} references non-existent parent: ${targetSource}`);
        orphanedAnnotations.push(annotation);
        // Treat orphaned replies as top-level annotations for display purposes
        topLevelAnnotations.push(annotation);
      }
    } else {
      // This is a top-level annotation
      topLevelAnnotations.push(annotation);
    }
  });

  // Sort top-level annotations by creation date
  topLevelAnnotations.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Sort replies by creation date
  replyMap.forEach(replies => {
    replies.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  });

  return { topLevelAnnotations, replyMap, orphanedAnnotations };
};

interface AnnotationItemProps {
  annotation: PdfAnnotationResponse;
  onEdit: (annotationId: string, newBodyValue: string) => void;
  onDelete: (annotationId: string) => void;
  onSelect?: (annotationId: string) => void;
  isSelected?: boolean;
  replies?: PdfAnnotationResponse[];
  isReply?: boolean;
  selectedAnnotationId?: string;
  isOrphaned?: boolean;
}

const AnnotationItem: React.FC<AnnotationItemProps> = ({
  annotation,
  onEdit,
  onDelete,
  onSelect,
  isSelected = false,
  replies = [],
  isReply = false,
  selectedAnnotationId,
  isOrphaned = false
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
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAnnotationTypeIcon = (subtype?: string, motivation?: string) => {
    if (motivation === 'replying') {
      return <Reply className="h-4 w-4 text-green-500" />;
    }
    switch (subtype) {
      case 'highlight':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'freetext':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAnnotationTypeColor = (subtype?: string, strokeColor?: string, motivation?: string) => {
    // If strokeColor is provided, use it as background
    if (strokeColor) {
      return `border-[${strokeColor}]`;
    }
    
    if (motivation === 'replying') {
      return 'bg-green-50 border-green-200';
    }
    
    switch (subtype) {
      case 'highlight':
        return 'bg-yellow-50 border-yellow-200';
      case 'freetext':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const strokeColor = annotation.annotation.target?.selector?.strokeColor;
  const cardStyle = strokeColor ? { backgroundColor: strokeColor + '20' } : {};
  
  return (
    <div>
      <Card 
        className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        } ${getAnnotationTypeColor(annotation.annotation.target?.selector?.subtype, strokeColor, annotation.annotation.motivation)}`}
        style={cardStyle}
        onClick={() => onSelect?.(annotation.annotation_id)}
      >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getAnnotationTypeIcon(annotation.annotation.target?.selector?.subtype, annotation.annotation.motivation)}
            <CardTitle className="text-sm font-medium">
              {isOrphaned ? 'Réponse orpheline' : isReply ? 'Réponse' : `Page ${(annotation.annotation.target?.selector?.node?.index || 0) + 1}`}
            </CardTitle>
            <Badge variant={isOrphaned ? "destructive" : "outline"} className="text-xs">
              {isOrphaned ? 'orpheline' :
               annotation.annotation.motivation === 'replying' ? 'réponse' : 
               annotation.annotation.motivation === 'commenting' ? 'commentaire' :
               annotation.annotation.motivation || 'annotation'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {annotation.annotation.target?.selector?.subtype === 'note' ? 'note' :
               annotation.annotation.target?.selector?.subtype === 'highlight' ? 'surlignage' :
               annotation.annotation.target?.selector?.subtype === 'shape' ? 'forme' :
               annotation.annotation.target?.selector?.subtype === 'underline' ? 'soulignement' :
               annotation.annotation.target?.selector?.subtype === 'strikeout' ? 'barré' :
               annotation.annotation.target?.selector?.subtype === 'freetext' ? 'texte libre' :
               annotation.annotation.target?.selector?.subtype || 'annotation'}
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
              placeholder="Saisir le texte d'annotation..."
              className="text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEdit} className="h-7 text-xs">
                Enregistrer
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} className="h-7 text-xs">
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-700 leading-relaxed">
              {annotation.annotation.bodyValue || 'Aucun contenu texte'}
            </p>
            {isOrphaned && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                <strong>Attention:</strong> Cette réponse fait référence à une annotation parent qui n'existe plus.
              </div>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(annotation.created_at)}
              </div>
              {annotation.annotation.creator?.name && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {annotation.annotation.creator.name == "Guest" ? "Invité" : annotation.annotation.creator.name}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    
    {/* Render replies */}
    {replies.length > 0 && (
      <div className="mt-2 ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
        {replies.map(reply => (
          <AnnotationItem
            key={reply.annotation_id}
            annotation={reply}
            onEdit={onEdit}
            onDelete={onDelete}
            onSelect={onSelect}
            isSelected={selectedAnnotationId === reply.annotation_id}
            isReply={true}
            selectedAnnotationId={selectedAnnotationId}
          />
        ))}
      </div>
    )}
  </div>
  );
};

interface CustomAnnotationListProps {
  annotations: PdfAnnotationResponse[];
  onEditAnnotation: (annotationId: string, newBodyValue: string) => void;
  onDeleteAnnotation: (annotationId: string) => void;
  onAnnotationSelect?: (annotationId: string) => void;
  selectedAnnotationId?: string;
  className?: string;
  onCleanupOrphaned?: (orphanedIds: string[]) => void;
  accessToken?: string;
  annotationType?: 'course' | 'summary';
}

const CustomAnnotationList: React.FC<CustomAnnotationListProps> = ({
  annotations,
  onEditAnnotation,
  onDeleteAnnotation,
  onAnnotationSelect,
  selectedAnnotationId,
  className = '',
  onCleanupOrphaned,
  accessToken,
  annotationType = 'course'
}) => {
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  console.log('CustomAnnotationList received annotations:', annotations);
  console.log('CustomAnnotationList annotations length:', annotations?.length);
  console.log('Sample annotation pageNumber:', annotations?.[0]?.annotation?.pageNumber);
  console.log('Sample annotation pageNumber type:', typeof annotations?.[0]?.annotation?.pageNumber);
  console.log('Sample annotation:', annotations?.[0]);

  // Filter annotations based on search term (including translated values)
  const filteredAnnotations = (annotations || []).filter(annotation => {
    const searchLower = searchTerm.toLowerCase();
    
    // Search in body value
    const bodyValueMatch = annotation.annotation.bodyValue?.toLowerCase().includes(searchLower);
    
    // Search in original subtype
    const originalSubtypeMatch = annotation.annotation.target?.selector?.subtype?.toLowerCase().includes(searchLower);
    
    // Search in translated subtype
    const translatedSubtypeMatch = translateSubtype(annotation.annotation.target?.selector?.subtype).toLowerCase().includes(searchLower);
    
    // Search in original motivation
    const originalMotivationMatch = annotation.annotation.motivation?.toLowerCase().includes(searchLower);
    
    // Search in translated motivation
    const translatedMotivationMatch = translateMotivation(annotation.annotation.motivation).toLowerCase().includes(searchLower);
    
    return bodyValueMatch || originalSubtypeMatch || translatedSubtypeMatch || originalMotivationMatch || translatedMotivationMatch;
  });

  console.log('Filtered annotations:', filteredAnnotations);

  // Group annotations with their replies
  const { topLevelAnnotations, replyMap, orphanedAnnotations } = groupAnnotationsWithReplies(filteredAnnotations);

  // Group top-level annotations by page
  const annotationsByPage = topLevelAnnotations.reduce((acc, annotation) => {
    const page = parseInt(annotation.annotation.pageNumber?.toString() || '1', 10);
    const validPage = isNaN(page) ? 1 : page;
    console.log('Processing annotation:', annotation.annotation.id, 'pageNumber:', annotation.annotation.pageNumber, 'parsed:', page, 'validPage:', validPage);
    if (!acc[validPage]) {
      acc[validPage] = [];
    }
    acc[validPage].push(annotation);
    return acc;
  }, {} as Record<number, PdfAnnotationResponse[]>);

  // Create a set of orphaned annotation IDs for quick lookup
  const orphanedAnnotationIds = new Set(orphanedAnnotations.map(ann => ann.annotation_id));

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
          <h3 className="text-lg font-semibold">
            Annotations {annotationType === 'summary' ? 'du résumé' : 'du cours'}
          </h3>
          <Badge variant="secondary">{annotations?.length || 0}</Badge>
          <Badge variant={annotationType === 'summary' ? 'default' : 'outline'} className="text-xs">
            {annotationType === 'summary' ? 'Résumé' : 'Cours'}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {orphanedAnnotations.length > 0 && onCleanupOrphaned && accessToken && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const orphanedIds = orphanedAnnotations.map(ann => ann.annotation_id);
                onCleanupOrphaned(orphanedIds);
              }}
              className="h-8 px-2 text-xs"
              title={`Nettoyer ${orphanedAnnotations.length} annotation(s) orpheline(s)`}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Nettoyer ({orphanedAnnotations.length})
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAnnotations(!showAnnotations)}
            className="h-8 w-8 p-0"
          >
            {showAnnotations ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <Input
          placeholder="Rechercher des annotations (texte, surlignage, commentaire, réponse...)"
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
              <p className="text-muted-foreground">Les annotations sont masquées</p>
            </div>
          </div>
        ) : filteredAnnotations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Aucune annotation ne correspond à votre recherche' : 'Aucune annotation pour le moment'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm ? 'Essayez un autre terme de recherche' : 'Ajoutez des annotations en surlignant le texte dans la visionneuse PDF'}
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
                      replies={replyMap.get(annotation.annotation_id) || []}
                      selectedAnnotationId={selectedAnnotationId}
                      isOrphaned={orphanedAnnotationIds.has(annotation.annotation_id)}
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
