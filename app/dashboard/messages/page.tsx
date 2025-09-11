"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, Search, Filter, User, Clock, Pin, MoreHorizontal, Plus, Archive, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface Message {
  id: string;
  sender?: {
    id: string;
    name: string;
    image?: string;
  };
  expediteur?: {
    id: string;
    name: string;
    image?: string;
  };
  expediteurId?: string;
  recipient: {
    id: string;
    name: string;
    image?: string;
  };
  subject?: string;
  content?: string;
  message?: string;
  isRead: boolean;
  isPinned: boolean;
  createdAt: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
  }[];
  chantier?: {
    id: string;
    nom: string;
  };
}

interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    image?: string;
  }[];
  lastMessage: {
    content: string;
    createdAt: string;
    sender: string;
  };
  unreadCount: number;
  chantier?: {
    id: string;
    nom: string;
  };
}

export default function MessagesPage() {
  const { user } = useAuth();
  const {
    conversations,
    messages,
    activeConversationId: selectedConversation,
    loading,
    error,
    sendMessage,
    setActiveConversation,
    fetchConversations,
    fetchMessages
  } = useMessages();

  // Helper pour récupérer l'expéditeur de manière sûre
  const getSender = (message: any) => {
    if (message.sender) return message.sender;
    if (message.expediteur) return message.expediteur;
    if (message.expediteurId) return { id: message.expediteurId, name: 'Utilisateur inconnu' };
    if (message.senderId) return { id: message.senderId, name: message.senderName || 'Utilisateur inconnu' };
    return { id: 'unknown', name: 'Utilisateur inconnu' };
  };

  // Helper pour récupérer le contenu du message
  const getMessageContent = (message: any) => {
    return message.content || message.message || '';
  };

  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "pinned" | "tous">("all");
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  // Charger les conversations au montage
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation, fetchMessages]);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !search || 
      conv.participants.some(p => p.name.toLowerCase().includes(search.toLowerCase()));
    
    const matchesFilter = 
      filter === "all" ? true :
      filter === "unread" ? conv.unreadCount > 0 :
      filter === "pinned" ? false : false; // TODO: implement pinned conversations
    
    return matchesSearch && matchesFilter;
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await sendMessage(newMessage.trim(), selectedConversation);
      setNewMessage("");
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  const handlePinConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/pin`, {
        method: 'POST',
      });

      if (response.ok) {
        // Recharger les conversations pour refléter le changement
        await fetchConversations();
      } else {
        console.error('Erreur lors de l\'épinglage de la conversation');
      }
    } catch (error) {
      console.error('Erreur lors de l\'épinglage:', error);
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    if (confirm('Êtes-vous sûr de vouloir archiver cette conversation ?')) {
      try {
        const response = await fetch(`/api/messages/conversations/${conversationId}/archive`, {
          method: 'POST',
        });

        if (response.ok) {
          // Recharger les conversations
          await fetchConversations();
          
          // Si c'était la conversation sélectionnée, la déselectionner
          if (selectedConversation === conversationId) {
            setActiveConversation(null);
          }
        } else {
          console.error('Erreur lors de l\'archivage de la conversation');
        }
      } catch (error) {
        console.error('Erreur lors de l\'archivage:', error);
      }
    }
  };

  const handleMoreOptions = (conversationId: string) => {
    const options = [
      'Marquer comme lu',
      'Supprimer',
      'Bloquer le contact',
      'Exporter la conversation'
    ];
    
    const choice = prompt(`Options pour la conversation:\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nEntrez le numéro de votre choix:`);
    
    if (choice) {
      const choiceNum = parseInt(choice);
      switch (choiceNum) {
        case 1:
          // Marquer comme lu
          fetch(`/api/messages/conversations/${conversationId}/mark-read`, {
            method: 'POST'
          }).then(() => fetchConversations());
          break;
        case 2:
          // Supprimer
          if (confirm('Supprimer définitivement cette conversation ?')) {
            fetch(`/api/messages/conversations/${conversationId}`, {
              method: 'DELETE'
            }).then(response => {
              if (response.ok) {
                fetchConversations();
                if (selectedConversation === conversationId) {
                  setActiveConversation(null);
                }
              }
            });
          }
          break;
        case 3:
          alert('Fonctionnalité de blocage en cours de développement');
          break;
        case 4:
          alert('Fonctionnalité d\'export en cours de développement');
          break;
        default:
          break;
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}min`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 border h-96"></div>
              <div className="lg:col-span-2 bg-white rounded-lg p-6 border h-96"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
            <p className="text-gray-500">
              Communiquez avec vos clients et votre équipe
            </p>
          </div>
          <Link href="/dashboard/messages/nouveau">
            <Button className="flex items-center gap-2">
              <Plus size={18} />
              Nouveau message
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des conversations */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Rechercher une conversation..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="all">Tous</option>
                  <option value="unread">Non lus</option>
                  <option value="pinned">Épinglés</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    setActiveConversation(conversation.id);
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {conversation.participants.find(p => p.id !== user?.id)?.name.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.participants.find(p => p.id !== user?.id)?.name || 'Utilisateur'}
                        </p>
                        <div className="flex items-center gap-2">
                          {conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {conversation.lastMessage?.time ? formatTime(conversation.lastMessage.time) : ''}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.text || ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zone de messages */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 flex flex-col">
            {selectedConversation ? (
              <>
                {/* En-tête de conversation */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        S
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Sophie Durand</h3>
                        <p className="text-sm text-gray-500">Villa Moderne</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handlePinConversation(selectedConversation || '')}>
                        <Pin size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleArchiveConversation(selectedConversation || '')}>
                        <Archive size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleMoreOptions(selectedConversation || '')}>
                        <MoreHorizontal size={16} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {messages.map((message) => {
                    const sender = getSender(message);
                    const content = getMessageContent(message);
                    const isMyMessage = sender.id === user?.id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          isMyMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs ${
                              isMyMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {message.timestamp ? formatTime(message.timestamp) : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Zone de saisie */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <Input
                      placeholder="Tapez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send size={18} />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune conversation sélectionnée</h3>
                  <p className="text-gray-500">
                    Sélectionnez une conversation pour commencer à discuter
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}