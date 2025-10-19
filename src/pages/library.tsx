import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_ENDPOINTS, type SimilaritySearchRequest, type SimilaritySearchResponse } from "@/lib/apiConfig";
import { authenticatedApiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth as useOIDCAuth } from "react-oidc-context";
import { Search, ExternalLink, BookOpen, GraduationCap, Tag, Hash } from "lucide-react";

// List of universities with full names as labels and short codes as values
const UNIVERSITIES = [
  { label: "F.M.Tunis", value: "fmt" },
  { label: "F.M.Sousse", value: "fms" },
  { label: "F.M.Monastir", value: "fmm" },
  { label: "F.M.Sfax", value: "fmsfax" }
];

export default function Bibliotheque() {
  const { user } = useAuth();
  const oidcAuth = useOIDCAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState(user?.university?.toLowerCase() || "fmt");
  const [maxResults, setMaxResults] = useState(5);
  const [includeImages, setIncludeImages] = useState(true);
  const [searchResults, setSearchResults] = useState<SimilaritySearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un terme de recherche",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    try {
      const requestBody: SimilaritySearchRequest = {
        query_text: searchQuery,
        top_k: Math.min(maxResults, 30),
        include_images: includeImages,
        index_name: selectedUniversity
      };

      console.log('Making similarity search request:', requestBody);
      const response = await authenticatedApiRequest("POST", API_ENDPOINTS.AI_SIMILARITY_SEARCH, requestBody, oidcAuth.user?.access_token);

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SimilaritySearchResponse = await response.json();
      setSearchResults(data);
      
      toast({
        title: "Recherche terminée",
        description: `${data.total_matches} résultats trouvés`,
      });
    } catch (error: any) {
      console.error("Search error:", error);
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Redirection...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Erreur de recherche",
        description: "Impossible d'effectuer la recherche. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatTextWithHighlight = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    // Split query by spaces and filter out empty strings
    const queryWords = query.trim().split(/\s+/).filter(word => word.length > 0);
    
    if (queryWords.length === 0) return text;
    
    // Create a regex that matches any of the query words (case insensitive)
    const escapedWords = queryWords.map(word => 
      word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
    
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <strong key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  const getCourseLink = (courseSection: any, page: number=1) => {
    if (!courseSection) return "#";
    return `/courses/${courseSection.course_id}/${courseSection.section_id}?page=${page}`;
  };

  return (
    <div className="py-6" data-testid="bibliotheque-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary to-accent rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Bibliothèque</h1>
                <p className="text-lg opacity-90">
                  Recherchez dans la base de connaissances de votre université
                </p>
              </div>
              <div className="hidden md:block">
                <BookOpen className="w-24 h-24 opacity-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recherche dans la bibliothèque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* University Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Université</label>
                <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une université" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIVERSITIES.map((university) => (
                      <SelectItem key={university.value} value={university.value}>
                        {university.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Input */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Terme de recherche</label>
                <div className="flex items-center space-x-3">
                  <Input
                    type="text"
                    placeholder="Saisissez votre recherche..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-images"
                      checked={includeImages}
                      onCheckedChange={(checked) => setIncludeImages(checked as boolean)}
                    />
                    <label
                      htmlFor="include-images"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Inclure images
                    </label>
                  </div>
                </div>
              </div>

              {/* Max Results */}
              <div>
                <label className="block text-sm font-medium mb-2">Résultats max</label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={maxResults}
                  onChange={(e) => setMaxResults(Math.min(30, Math.max(1, parseInt(e.target.value) || 5)))}
                />
              </div>
            </div>

            <div className="mt-4">
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchQuery.trim()}
                className="w-full md:w-auto"
              >
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? "Recherche en cours..." : "Rechercher"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Résultats de recherche ({searchResults.total_matches})
              </h2>
              <Badge variant="secondary">
                {searchResults.search_time_ms ? `${(searchResults.search_time_ms / 1000).toFixed(2)}s` : "Recherche terminée"}
              </Badge>
            </div>

            <div className="space-y-4">
              {searchResults.matches.map((match, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          Score: {(match.score * 100).toFixed(1)}%
                        </Badge>
                        {match.metadata.course_section?.course?.theme && (
                          <Badge variant="secondary" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {match.metadata.course_section.course.theme}
                          </Badge>
                        )}
                        {match.metadata.course_section?.course?.cls && (
                          <Badge variant="outline" className="text-xs">
                            <Hash className="w-3 h-3 mr-1" />
                            {match.metadata.course_section.course.cls}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Page {match.metadata.page || 1}
                      </div>
                    </div>

                    {/* Content Display */}
                    <div className="mb-4">
                      {match.metadata.type === "text+image" ? (
                        <div className="space-y-3">
                          <img 
                            src={match.metadata.image_presigned_url} 
                            alt="Document content"
                            className="max-w-full h-auto rounded-lg border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="prose max-w-none">
                          <p className="text-sm leading-relaxed">
                            {match.metadata.text ? formatTextWithHighlight(match.metadata.text, searchQuery) : 'No text content available'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Course Information */}
                    {match.metadata.course_section && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {match.metadata.course_section.course?.course_name}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {match.metadata.course_section.section_name}
                            </div>
                          </div>
                          <Button 
                            asChild
                            size="sm"
                            className="ml-4"
                          >
                            <a 
                              href={getCourseLink(match.metadata.course_section, match.metadata.page || 1)}
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Ouvrir dans le cours
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {searchResults.matches.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucun résultat trouvé</h3>
                  <p className="text-muted-foreground">
                    Essayez avec d'autres termes de recherche ou changez d'université.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!searchResults && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Commencez votre recherche</h3>
              <p className="text-muted-foreground">
                Utilisez le formulaire ci-dessus pour rechercher dans la bibliothèque de votre université.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
