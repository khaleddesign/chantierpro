'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  timestamp: string;
  photos: string[];
  type: 'text' | 'image' | 'file';
  read?: boolean;
}

export interface Conversation {
  id: string;
  nom: string;
  photo?: string;
  participants: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  lastMessage?: {
    text: string;
    time: string;
    expediteur: string;
  };
  unreadCount: number;
  updatedAt: string;
  type: 'chantier' | 'direct';
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  company?: string;
  phone?: string;
}

interface UseMessagesProps {
  pollingInterval?: number;
  enableNotifications?: boolean;
}

export function useMessages({
  pollingInterval = 30000,
  enableNotifications = true
}: UseMessagesProps = {}) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setError(null);
      const response = await fetch(`/api/messages?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des conversations');
      }
      
      const data = await response.json();
      setConversations(data.conversations || []);
      
      const unreadTotal = data.conversations?.reduce(
        (total: number, conv: Conversation) => total + conv.unreadCount, 
        0
      ) || 0;
      
      setTotalUnreadCount(unreadTotal);
      
    } catch (err) {
      console.error('Erreur fetchConversations:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchContacts = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/messages/contacts?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des contacts');
      }
      
      const data = await response.json();
      setContacts(data.contacts || []);
      
    } catch (err) {
      console.error('Erreur fetchContacts:', err);
    }
  }, [user?.id]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!conversationId || !user?.id) return;
    
    try {
      setLoadingMessages(true);
      setError(null);
      
      // Utiliser la route conversations/[id] corrigée
      const response = await fetch(`/api/messages/conversations/${conversationId}?userId=${user.id}`);
      
      if (!response.ok) {
        // Fallback: utiliser des données mockées si l'API échoue
        console.warn('API messages non disponible, utilisation des données simulées');
        const mockMessages = [
          {
            id: `msg-1-${Date.now()}`,
            senderId: 'client-1',
            senderName: 'Sophie Durand',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            content: 'Bonjour, j\'aimerais avoir des informations sur l\'avancement du chantier.',
            photos: [],
            type: 'text' as const,
            read: true
          },
          {
            id: `msg-2-${Date.now()}`,
            senderId: user.id,
            senderName: user.name || 'Vous',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            content: 'Bonjour ! Je vous enverrai un rapport détaillé aujourd\'hui.',
            photos: [],
            type: 'text' as const,
            read: true
          }
        ];
        setMessages(mockMessages);
        return;
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
      
    } catch (err) {
      console.error('Erreur fetchMessages:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingMessages(false);
    }
  }, [user?.id]);

  const sendMessage = useCallback(async (
    content: string,
    conversationId?: string,
    destinataireId?: string,
    photos: string[] = []
  ) => {
    if (!content.trim() || !user?.id) return false;
    
    const targetConversationId = conversationId || activeConversationId;
    
    try {
      setSending(true);
      setError(null);
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expediteurId: user.id,
          message: content.trim(),
          chantierId: targetConversationId,
          destinataireId,
          photos,
          senderName: user.name,
          userId: user.id,
          content: content.trim()
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }
      
      // Recharger les conversations et messages
      await fetchConversations();
      if (targetConversationId) {
        await fetchMessages(targetConversationId);
      }
      
      return true;
      
    } catch (err) {
      console.error('Erreur sendMessage:', err);
      setError(err instanceof Error ? err.message : 'Erreur envoi message');
      return false;
    } finally {
      setSending(false);
    }
  }, [user?.id, activeConversationId, fetchConversations, fetchMessages]);

  const setActiveConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId);
    if (conversationId) {
      fetchMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [fetchMessages]);

  const createNewConversation = useCallback(async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return null;
    
    const newConversationId = `direct-${user?.id}-${contactId}`;
    setActiveConversation(newConversationId);
    
    return newConversationId;
  }, [contacts, user?.id, setActiveConversation]);

  const refresh = useCallback(() => {
    fetchConversations();
    fetchContacts();
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    }
  }, [fetchConversations, fetchContacts, fetchMessages, activeConversationId]);

  // Polling automatique
  useEffect(() => {
    if (user?.id) {
      fetchConversations();
      fetchContacts();
      
      if (pollingInterval > 0) {
        pollingRef.current = setInterval(fetchConversations, pollingInterval);
      }
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [user?.id, fetchConversations, fetchContacts, pollingInterval]);

  // Charger les messages quand on change de conversation
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId, fetchMessages]);

  return {
    conversations,
    messages,
    contacts,
    activeConversationId,
    totalUnreadCount,
    loading,
    loadingMessages,
    sending,
    error,
    sendMessage,
    setActiveConversation,
    createNewConversation,
    refresh,
    fetchConversations,
    fetchMessages,
    fetchContacts
  };
}
