"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Save, Users, Search, X, Plus, FileText, Clock, Star, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserAvatar from '@/components/messages/UserAvatar';
import MessageInput from '@/components/messages/MessageInput';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'COMMERCIAL' | 'OUVRIER' | 'CLIENT';
  company?: string;
  image?: string;
  online?: boolean;
}

interface Chantier {
  id: string;
  nom: string;
  adresse?: string;
  statut: string;
}

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  icon: string;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'rdv-client',
    title: 'Demande de RDV client',
    content: 'Bonjour,\n\nJ\'aimerais planifier un rendez-vous pour discuter de votre projet. \n\nQuand seriez-vous disponible cette semaine ?\n\nCordialement',
    category: 'Commercial',
    icon: '📅'
  },
  {
    id: 'devis-pret',
    title: 'Devis prêt',
    content: 'Bonjour,\n\nVotre devis est maintenant prêt. Vous pouvez le consulter dans votre espace client.\n\nN\'hésitez pas si vous avez des questions.\n\nCordialement',
    category: 'Commercial',
    icon: '📄'
  },
  {
    id: 'debut-travaux',
    title: 'Début des travaux',
    content: 'Bonjour,\n\nLes travaux commenceront comme prévu le [DATE] à [HEURE].\n\nNous vous tiendrons informés de l\'avancement.\n\nCordialement',
    category: 'Chantier',
    icon: '🏗️'
  },
  {
    id: 'livraison',
    title: 'Livraison matériel',
    content: 'Bonjour,\n\nLa livraison de matériel est prévue pour [DATE] entre [HEURE] et [HEURE].\n\nMerci de prévoir un accès pour la réception.\n\nCordialement',
    category: 'Logistique',
    icon: '🚚'
  },
  {
    id: 'fin-travaux',
    title: 'Fin des travaux',
    content: 'Bonjour,\n\nLes travaux sont maintenant terminés. Nous aimerions planifier la réception avec vous.\n\nQuand seriez-vous disponible pour valider les travaux ?\n\nCordialement',
    category: 'Chantier',
    icon: '✅'
  }
];

function NouveauMessagePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [recipients, setRecipients] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [selectedChantier, setSelectedChantier] = useState<string>('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('TOUS');
  const [showTemplates, setShowTemplates] = useState(false);
  
  const [messageData, setMessageData] = useState({
    subject: '',
    message: '',
    photos: [] as string[],
    isImportant: false,
    isDraft: false
  });
  
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Initialisation avec paramètres URL
  useEffect(() => {
    const clientId = searchParams.get('clientId');
    const chantierId = searchParams.get('chantierId');
    
    if (chantierId) {
      setSelectedChantier(chantierId);
    }
    
    fetchAvailableUsers();
    fetchChantiers();
    
    // Pré-sélection du client si fourni
    if (clientId && availableUsers.length > 0) {
      const client = availableUsers.find(u => u.id === clientId);
      if (client) {
        setRecipients([client]);
      }
    }
  }, [searchParams, availableUsers.length]);

  const fetchAvailableUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChantiers = async () => {
    try {
      const response = await fetch('/api/chantiers');
      if (response.ok) {
        const data = await response.json();
        setChantiers(data.chantiers || []);
      }
    } catch (error) {
      console.error('Erreur chargement chantiers:', error);
    }
  };

  // Filtrage des utilisateurs
  const filteredUsers = availableUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.company && user.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'TOUS' || user.role === roleFilter;
    
    const notAlreadySelected = !recipients.some(r => r.id === user.id);
    
    return matchesSearch && matchesRole && notAlreadySelected;
  });

  const handleAddRecipient = (user: User) => {
    setRecipients(prev => [...prev, user]);
    setSearchTerm('');
  };

  const handleRemoveRecipient = (userId: string) => {
    setRecipients(prev => prev.filter(r => r.id !== userId));
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    setMessageData(prev => ({
      ...prev,
      message: template.content,
      subject: prev.subject || template.title
    }));
    setShowTemplates(false);
  };

  const handleSendMessage = useCallback(async (text: string, photos: string[]) => {
    setMessageData(prev => ({
      ...prev,
      message: text,
      photos: photos
    }));
    return true;
  }, []);

  const handleFinalSend = async () => {
    if (!messageData.message.trim() || recipients.length === 0) {
      alert('Veuillez saisir un message et sélectionner au moins un destinataire');
      return;
    }

    setSending(true);
    try {
      // Envoyer le message à chaque destinataire individuellement
      let successCount = 0;
      const errors = [];
      
      for (const recipient of recipients) {
        try {
          const messagePayload = {
            destinataireId: recipient.id,
            message: `${messageData.subject ? `**${messageData.subject}**\n\n` : ''}${messageData.message}`,
            chantierId: selectedChantier || undefined,
            typeMessage: 'DIRECT'
          };

          const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(messagePayload)
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            errors.push(`${recipient.name}: ${errorData.error}`);
          }
        } catch (err) {
          errors.push(`${recipient.name}: Erreur de connexion`);
        }
      }

      if (successCount > 0) {
        alert(`Message envoyé avec succès à ${successCount} destinataire(s)${errors.length > 0 ? `. Erreurs: ${errors.join(', ')}` : ''}`);
        router.push('/dashboard/messages');
      } else {
        throw new Error(`Aucun message envoyé. Erreurs: ${errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    // Sauvegarde en brouillon
    setMessageData(prev => ({ ...prev, isDraft: true }));
    // TODO: Implémenter la sauvegarde en base
    alert('Message sauvegardé en brouillon');
  };

  const getStatusColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700';
      case 'COMMERCIAL': return 'bg-blue-100 text-blue-700';
      case 'OUVRIER': return 'bg-green-100 text-green-700';
      case 'CLIENT': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const canSend = recipients.length > 0 && messageData.message.trim().length > 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/dashboard/messages"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Retour aux messages</span>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={!messageData.message.trim()}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              Brouillon
            </Button>
            
            <Button
              onClick={handleFinalSend}
              disabled={!canSend || sending}
              className="flex items-center gap-2"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Envoyer
            </Button>
          </div>
        </div>

        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouveau Message</h1>
          <p className="text-gray-500">
            Créez et envoyez des messages à vos contacts
          </p>
        </div>

        {/* Interface principale */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar gauche - Contacts */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-indigo-600" />
                <h2 className="font-semibold text-gray-900">Contacts</h2>
              </div>
              
              {/* Filtres */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher..."
                    className="pl-9 text-sm"
                  />
                </div>
                
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="TOUS">Tous les rôles</option>
                  <option value="CLIENT">Clients</option>
                  <option value="COMMERCIAL">Commerciaux</option>
                  <option value="OUVRIER">Ouvriers</option>
                  <option value="ADMIN">Admins</option>
                </select>
              </div>

              {/* Liste des utilisateurs */}
              <div className="max-h-96 overflow-y-auto space-y-1">
                {loading ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <Clock size={20} className="mx-auto mb-2 text-gray-400" />
                    Chargement...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Aucun contact trouvé
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleAddRecipient(user)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <UserAvatar user={user} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.role.toLowerCase()}
                          {user.company && ` • ${user.company}`}
                        </p>
                      </div>
                      <Plus size={16} className="text-indigo-500 flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Zone principale - Rédaction */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              
              {/* Destinataires sélectionnés */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Destinataires ({recipients.length})
                </label>
                
                {recipients.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                    <Users size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Sélectionnez des destinataires dans la liste de gauche</p>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {recipients.map((recipient) => (
                      <div
                        key={recipient.id}
                        className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-full text-sm"
                      >
                        <UserAvatar user={recipient} size="sm" />
                        <span className="font-medium">{recipient.name}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(recipient.role)}`}>
                          {recipient.role.toLowerCase()}
                        </span>
                        <button
                          onClick={() => handleRemoveRecipient(recipient.id)}
                          className="text-indigo-500 hover:text-indigo-700 ml-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Options du message */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet (optionnel)
                  </label>
                  <Input
                    value={messageData.subject}
                    onChange={(e) => setMessageData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Objet du message..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chantier associé (optionnel)
                  </label>
                  <select
                    value={selectedChantier}
                    onChange={(e) => setSelectedChantier(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Aucun chantier</option>
                    {chantiers.map((chantier) => (
                      <option key={chantier.id} value={chantier.id}>
                        {chantier.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Options avancées */}
              <div className="flex items-center gap-6 mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={messageData.isImportant}
                    onChange={(e) => setMessageData(prev => ({ ...prev, isImportant: e.target.checked }))}
                    className="rounded"
                  />
                  <Star size={16} className="text-yellow-500" />
                  <span className="text-sm text-gray-700">Message important</span>
                </label>

                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <FileText size={16} />
                  Templates
                </button>
              </div>

              {/* Templates */}
              {showTemplates && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-medium text-gray-900 mb-3">Templates de messages</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {MESSAGE_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleUseTemplate(template)}
                        className="flex items-start gap-3 p-3 bg-white rounded-lg border hover:border-indigo-300 hover:shadow-sm transition-all text-left"
                      >
                        <span className="text-xl">{template.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{template.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{template.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Zone de rédaction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Message *
                </label>
                <MessageInput
                  onSendMessage={handleSendMessage}
                  placeholder="Écrivez votre message... 
                  
Utilisez Maj + Entrée pour une nouvelle ligne."
                  disabled={sending}
                  showUpload={true}
                  maxLength={2000}
                />
              </div>
            </div>

            {/* Aperçu du message (si contenu) */}
            {(messageData.message.trim() || messageData.photos.length > 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-indigo-600" />
                  Aperçu du message
                </h3>

                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {/* En-tête */}
                  <div className="flex justify-between items-center mb-4 pb-3 border-b">
                    <div>
                      <p className="text-sm text-gray-600">
                        <strong>De:</strong> Vous
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Pour:</strong> {recipients.map(r => r.name).join(', ') || 'Aucun destinataire'}
                      </p>
                      {selectedChantier && (
                        <p className="text-sm text-gray-600">
                          <strong>Chantier:</strong> {chantiers.find(c => c.id === selectedChantier)?.nom}
                        </p>
                      )}
                    </div>
                    {messageData.isImportant && (
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                        <Star size={12} className="inline mr-1" />
                        Important
                      </span>
                    )}
                  </div>

                  {/* Sujet */}
                  {messageData.subject && (
                    <h4 className="font-semibold text-gray-900 mb-3">
                      {messageData.subject}
                    </h4>
                  )}

                  {/* Contenu */}
                  <div className="bg-white p-4 rounded border whitespace-pre-wrap text-gray-900 leading-relaxed">
                    {messageData.message || 'Contenu du message...'}
                  </div>

                  {/* Photos */}
                  {messageData.photos.length > 0 && (
                    <div className="mt-4 flex gap-2 flex-wrap">
                      {messageData.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-4 flex justify-between text-sm text-gray-500">
                  <span>
                    {recipients.length} destinataire{recipients.length > 1 ? 's' : ''}
                  </span>
                  <span>
                    {messageData.message.length}/2000 caractères
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NouveauMessagePage() {
  return (
    <Suspense fallback={
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <NouveauMessagePageContent />
    </Suspense>
  );
}