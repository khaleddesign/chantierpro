"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import UserAvatar from '@/components/messages/UserAvatar';

interface SearchResult {
  type: 'message' | 'contact' | 'file';
  id: string;
  title: string;
  content: string;
  timestamp: string;
  relevanceScore: number;
  metadata: {
    expediteur?: {
      id: string;
      name: string;
      role: string;
    };
    chantier?: {
      id: string;
      nom: string;
    };
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;
  };
}

interface SearchFilters {
  dateRange: 'today' | 'week' | 'month' | 'all';
  person: string;
  chantier: string;
  fileType: 'image' | 'document' | 'all';
  messageType: 'DIRECT' | 'CHANTIER' | 'GROUPE' | 'all';
}

function RecherchePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: 'all',
    person: '',
    chantier: '',
    fileType: 'all',
    messageType: 'all'
  });

  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [availableChantiers, setAvailableChantiers] = useState<any[]>([]);

  // Grouper les résultats par type
  const groupedResults = useMemo(() => {
    const grouped = {
      messages: results.filter(r => r.type === 'message'),
      contacts: results.filter(r => r.type === 'contact'),
      files: results.filter(r => r.type === 'file')
    };
    return grouped;
  }, [results]);

  // Charger les données pour les filtres
  useEffect(() => {
    loadFilterData();
    loadSearchHistory();
  }, []);

  // Effectuer la recherche initiale si query présent
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const loadFilterData = async () => {
    try {
      const response = await fetch('/api/messages/contacts');
      if (response.ok) {
        const data = await response.json();
        setAvailableContacts(data.users || []);
        setAvailableChantiers(data.chantiers || []);
      }
    } catch (error) {
      console.error('Erreur chargement données filtres:', error);
    }
  };

  const loadSearchHistory = () => {
    const history = localStorage.getItem('search-history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (error) {
        console.warn('Historique de recherche corrompu, suppression:', error);
        localStorage.removeItem('search-history');
        setSearchHistory([]);
      }
    }
  };

  const saveToSearchHistory = (searchQuery: string) => {
    const updated = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(updated);
    localStorage.setItem('search-history', JSON.stringify(updated));
  };

  const performSearch = useCallback(async (searchQuery: string, newPage = 1) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      return;
    }

    setLoading(true);
    setPage(newPage);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: newPage.toString(),
        limit: '20'
      });

      // Ajouter les filtres
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/messages/search?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setTotalResults(data.pagination?.total || 0);
        setSuggestions(data.suggestions || []);
        
        // Sauvegarder dans l'historique
        saveToSearchHistory(searchQuery);
        
        // Sauvegarder côté serveur
        fetch('/api/messages/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'test-client-123',
            query: searchQuery,
            resultCount: data.results?.length || 0
          })
        }).catch(console.error);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchHistory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
      // Mettre à jour l'URL
      router.push(`/dashboard/messages/recherche?q=${encodeURIComponent(query)}`);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Re-lancer la recherche avec les nouveaux filtres
    if (query.trim()) {
      performSearch(query, 1);
    }
  };

  const clearFilters = () => {
    setFilters({
      dateRange: 'all',
      person: '',
      chantier: '',
      fileType: 'all',
      messageType: 'all'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${kb.toFixed(0)} KB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Il y a moins d\'1h';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'message':
        // Naviguer vers la conversation contenant ce message
        const chantierId = result.metadata.chantier?.id;
        if (chantierId) {
          router.push(`/dashboard/messages?conversation=${chantierId}&highlight=${result.id}`);
        } else {
          router.push(`/dashboard/messages?highlight=${result.id}`);
        }
        break;
      
      case 'contact':
        // Ouvrir une nouvelle conversation avec ce contact
        router.push(`/dashboard/messages/nouveau?contact=${result.id}`);
        break;
      
      case 'file':
        // Ouvrir le fichier ou naviguer vers le message contenant le fichier
        if (result.metadata.fileUrl) {
          window.open(result.metadata.fileUrl, '_blank');
        }
        break;
    }
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'all' && v !== '').length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        
        {/* Navigation */}
        <nav style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
            <Link href="/dashboard" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              Dashboard
            </Link>
            <span>›</span>
            <Link href="/dashboard/messages" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              Messages
            </Link>
            <span>›</span>
            <span style={{ color: '#1e293b', fontWeight: '500' }}>Recherche</span>
          </div>
        </nav>

        {/* Header avec barre de recherche */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', margin: '0 0 1rem 0' }}>
            🔍 Recherche Globale
          </h1>
          
          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="🔍 Rechercher messages, contacts, fichiers..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    background: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  autoFocus
                />
                <div style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none',
                  fontSize: '1.25rem'
                }}>
                  🔍
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="btn-primary"
                style={{
                  padding: '0.75rem 1.5rem',
                  opacity: loading || !query.trim() ? 0.5 : 1,
                  cursor: loading || !query.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '⏳ Recherche...' : 'Rechercher'}
              </button>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  background: showFilters ? '#f0f9ff' : 'white',
                  color: showFilters ? '#3b82f6' : '#64748b',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                🎛️ Filtres
                {activeFiltersCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.75rem',
                    borderRadius: '50%',
                    width: '1.25rem',
                    height: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Suggestions & Historique */}
            {!loading && query.trim() === '' && (searchHistory.length > 0 || suggestions.length > 0) && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                marginTop: '0.5rem',
                zIndex: 10,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {searchHistory.length > 0 && (
                  <div>
                    <p style={{ 
                      margin: 0, 
                      padding: '0.75rem 1rem 0.5rem', 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      color: '#64748b' 
                    }}>
                      Recherches récentes:
                    </p>
                    {searchHistory.slice(0, 5).map((term, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setQuery(term);
                          performSearch(term);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.5rem 1rem',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#1e293b',
                          borderBottom: index < searchHistory.length - 1 ? '1px solid #f1f5f9' : 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        🕒 {term}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Filtres */}
        {showFilters && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                🎛️ Filtres de recherche
              </h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  style={{
                    color: '#ef4444',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    textDecoration: 'underline'
                  }}
                >
                  Effacer les filtres
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {/* Filtre Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  📅 Période:
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    background: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">Toutes les dates</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                </select>
              </div>

              {/* Filtre Personne */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  👤 Personne:
                </label>
                <select
                  value={filters.person}
                  onChange={(e) => handleFilterChange('person', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    background: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Toutes les personnes</option>
                  {availableContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} ({contact.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Chantier */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  🏗️ Chantier:
                </label>
                <select
                  value={filters.chantier}
                  onChange={(e) => handleFilterChange('chantier', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    background: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Tous les chantiers</option>
                  {availableChantiers.map((chantier) => (
                    <option key={chantier.id} value={chantier.id}>
                      {chantier.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Type de fichier */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  📁 Type de fichier:
                </label>
                <select
                  value={filters.fileType}
                  onChange={(e) => handleFilterChange('fileType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    background: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">Tous les types</option>
                  <option value="image">Images</option>
                  <option value="document">Documents</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Résultats */}
        {query && !loading && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                Résultats pour "{query}" 
                <span style={{ color: '#64748b', fontWeight: '400' }}>
                  ({totalResults} résultat{totalResults > 1 ? 's' : ''})
                </span>
              </h2>
              
              {suggestions.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Suggestions:</span>
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(suggestion);
                        performSearch(suggestion);
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        color: '#3b82f6',
                        cursor: 'pointer'
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Onglets de résultats */}
            <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              {[
                { key: 'all', label: 'Tout', count: totalResults },
                { key: 'messages', label: 'Messages', count: groupedResults.messages.length },
                { key: 'contacts', label: 'Contacts', count: groupedResults.contacts.length },
                { key: 'files', label: 'Fichiers', count: groupedResults.files.length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  style={{
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'none',
                    color: '#64748b',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    borderBottom: '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span style={{
                      background: '#e2e8f0',
                      color: '#64748b',
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '1rem'
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Liste des résultats */}
            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Aucun résultat trouvé</h3>
                <p>Essayez avec d'autres termes ou modifiez vos filtres</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    style={{
                      background: 'white',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      {/* Icône type */}
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.5rem',
                        background: result.type === 'message' ? '#f0f9ff' : 
                                   result.type === 'contact' ? '#f0fdf4' : '#fdf2f8',
                        color: result.type === 'message' ? '#3b82f6' : 
                               result.type === 'contact' ? '#22c55e' : '#ec4899',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        flexShrink: 0
                      }}>
                        {result.type === 'message' && '💬'}
                        {result.type === 'contact' && '👤'}
                        {result.type === 'file' && '📁'}
                      </div>

                      {/* Contenu */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h3 
                            style={{ 
                              margin: 0, 
                              fontSize: '1.125rem', 
                              fontWeight: '600', 
                              color: '#1e293b',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            dangerouslySetInnerHTML={{ __html: result.title }}
                          />
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#94a3b8',
                            flexShrink: 0,
                            marginLeft: '1rem'
                          }}>
                            {formatDate(result.timestamp)}
                          </span>
                        </div>

                        <p 
                          style={{ 
                            margin: '0 0 0.75rem 0', 
                            color: '#64748b', 
                            lineHeight: 1.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                          dangerouslySetInnerHTML={{ __html: result.content }}
                        />

                        {/* Métadonnées */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          {result.metadata.expediteur && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <UserAvatar user={result.metadata.expediteur} size="sm" />
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {result.metadata.expediteur.name}
                              </span>
                            </div>
                          )}

                          {result.metadata.chantier && (
                            <div style={{ 
                              background: '#f0f9ff', 
                              color: '#3b82f6', 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '1rem', 
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              🏗️ {result.metadata.chantier.nom}
                            </div>
                          )}

                          {result.metadata.fileSize && (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              📊 {formatFileSize(result.metadata.fileSize)}
                            </span>
                          )}

                          {/* Score de pertinence (mode debug) */}
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#94a3b8',
                            marginLeft: 'auto'
                          }}>
                            Score: {Math.round(result.relevanceScore * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message d'aide initial */}
        {!query && !loading && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
              Recherche dans ChantierPro
            </h2>
            <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>
              Trouvez rapidement vos messages, contacts et fichiers.<br />
              Utilisez les filtres pour affiner vos résultats.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💬</div>
                <strong>Messages</strong>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                  Recherche dans le contenu de tous vos messages
                </p>
              </div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👥</div>
                <strong>Contacts</strong>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                  Trouvez vos collègues et clients
                </p>
              </div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📁</div>
                <strong>Fichiers</strong>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                  Photos et documents partagés
                </p>
              </div>
            </div>

            {/* Exemples de recherche */}
            {searchHistory.length === 0 && (
              <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
                  💡 Exemples de recherche :
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    'plans villa',
                    'Pierre Maçon',
                    'carrelage',
                    'photos avant',
                    'devis 2024'
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(example);
                        performSearch(example);
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '0.5rem',
                        background: 'none',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#3b82f6'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      🔍 "{example}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Raccourcis clavier */}
        <div style={{ 
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          display: query ? 'block' : 'none'
        }}>
          <strong>Raccourcis :</strong> Ctrl+K pour recherche globale
        </div>
      </div>
    </div>
  );
}

export default function RecherchePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RecherchePageContent />
    </Suspense>
  );
}