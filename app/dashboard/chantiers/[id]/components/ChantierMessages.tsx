'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, User, Calendar, Image, Paperclip } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToasts } from '@/hooks/useToasts';

interface Message {
  id: string;
  message: string;
  photos: string[];
  createdAt: string;
  expediteur: {
    id: string;
    name: string;
    role: string;
  };
}

interface ChantierMessagesProps {
  chantierId: string;
  initialMessages?: Message[];
}

export default function ChantierMessages({ chantierId, initialMessages = [] }: ChantierMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { success, error } = useToasts();

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chantiers/${chantierId}/messages`);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        console.error('Erreur chargement messages:', response.status);
      }
    } catch (err) {
      console.error('Erreur messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Si pas de données initiales, charger depuis l'API
    if (initialMessages.length === 0) {
      fetchMessages();
    }
  }, [chantierId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      error('Erreur', 'Seules les images sont autorisées dans les messages');
    }
    
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (!user) return;

    setSending(true);
    try {
      // Upload des photos d'abord si nécessaire
      let photoUrls: string[] = [];
      
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('chantierId', chantierId);
          formData.append('dossier', 'Messages');
          formData.append('type', 'PHOTO');

          const uploadResponse = await fetch('/api/documents', {
            method: 'POST',
            body: formData
          });

          if (uploadResponse.ok) {
            const doc = await uploadResponse.json();
            photoUrls.push(doc.url);
          }
        }
      }

      // Envoyer le message
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chantierId,
          message: newMessage.trim(),
          photos: photoUrls
        })
      });

      if (response.ok) {
        const createdMessage = await response.json();
        setMessages(prev => [...prev, createdMessage]);
        setNewMessage('');
        setSelectedFiles([]);
        success('Envoyé', 'Message envoyé avec succès');
      } else {
        const errorData = await response.json();
        error('Erreur', errorData.error || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      console.error('Erreur envoi message:', err);
      error('Erreur', 'Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return 'Hier ' + date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CLIENT':
        return 'bg-purple-100 text-purple-800';
      case 'OUVRIER':
        return 'bg-blue-100 text-blue-800';
      case 'COMMERCIAL':
        return 'bg-green-100 text-green-800';
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm h-[600px] flex flex-col">
        <div className="animate-pulse flex-1">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm h-[600px] flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Messages du chantier</h3>
            <p className="text-sm text-gray-500">
              {messages.length} message{messages.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <MessageSquare size={24} />
            </div>
            <p className="text-gray-900 font-medium mb-2">Aucun message</p>
            <p className="text-sm text-gray-500">Commencez la conversation pour ce chantier</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = user?.id === message.expediteur.id;
            const showHeader = index === 0 || messages[index - 1].expediteur.id !== message.expediteur.id;
            
            return (
              <div key={message.id} className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                {showHeader && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User size={14} className="text-gray-600" />
                    </div>
                  </div>
                )}
                {!showHeader && <div className="w-8"></div>}
                
                <div className={`flex-1 max-w-md ${isCurrentUser ? 'text-right' : ''}`}>
                  {showHeader && (
                    <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                      <span className="text-sm font-medium text-gray-900">
                        {message.expediteur.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(message.expediteur.role)}`}>
                        {message.expediteur.role}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  )}
                  
                  <div className={`inline-block p-3 rounded-2xl ${
                    isCurrentUser 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {message.message && (
                      <p className="text-sm">{message.message}</p>
                    )}
                    
                    {message.photos && message.photos.length > 0 && (
                      <div className={`grid gap-2 ${message.photos.length > 1 ? 'grid-cols-2' : ''} ${message.message ? 'mt-2' : ''}`}>
                        {message.photos.map((photo, photoIndex) => (
                          <img
                            key={photoIndex}
                            src={photo}
                            alt={`Photo ${photoIndex + 1}`}
                            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(photo, '_blank')}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="p-4 border-t border-gray-200">
        {selectedFiles.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          
          <button
            onClick={handleFileSelect}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Joindre une image"
          >
            <Image size={20} />
          </button>
          
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tapez votre message..."
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              style={{ minHeight: '40px', maxHeight: '120px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={sending || (!newMessage.trim() && selectedFiles.length === 0)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}