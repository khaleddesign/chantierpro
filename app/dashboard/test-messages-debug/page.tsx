"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestMessagesDebugPage() {
  const { data: session, status } = useSession();
  const { user } = useAuth();
  const { sendMessage, messages, conversations } = useMessages();
  const [testResult, setTestResult] = useState<string>('');

  const runDebugTest = async () => {
    if (!user) {
      setTestResult('❌ Aucun utilisateur connecté');
      return;
    }

    let debugInfo = '🔍 DIAGNOSTIC DES NOMS D\'UTILISATEURS\n';
    debugInfo += '=====================================\n\n';
    
    // 1. Informations de session NextAuth
    debugInfo += '1️⃣ SESSION NEXTAUTH:\n';
    debugInfo += `- Status: ${status}\n`;
    debugInfo += `- User ID: ${session?.user?.id || 'N/A'}\n`;
    debugInfo += `- User Name: "${session?.user?.name || 'N/A'}"\n`;
    debugInfo += `- User Email: ${session?.user?.email || 'N/A'}\n`;
    debugInfo += `- User Role: ${session?.user?.role || 'N/A'}\n\n`;
    
    // 2. Informations du hook useAuth
    debugInfo += '2️⃣ HOOK useAuth:\n';
    debugInfo += `- User ID: ${user?.id || 'N/A'}\n`;
    debugInfo += `- User Name: "${user?.name || 'N/A'}"\n`;
    debugInfo += `- User Email: ${user?.email || 'N/A'}\n`;
    debugInfo += `- User Role: ${user?.role || 'N/A'}\n`;
    debugInfo += `- User Company: ${user?.company || 'N/A'}\n\n`;
    
    // 3. Test de la fonction getSafeUserName
    debugInfo += '3️⃣ TEST getSafeUserName:\n';
    
    // Simuler la fonction getSafeUserName
    const getSafeUserName = (user: any): string => {
      console.log('🔍 Debug getSafeUserName - user object:', {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        company: user?.company
      });
      
      if (user?.name && user.name.trim() && user.name !== 'Utilisateur') {
        console.log('✅ Utilisation du nom:', user.name);
        return user.name;
      }
      
      if (user?.email) {
        const emailName = user.email.split('@')[0];
        const capitalizedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        console.log('✅ Utilisation de l\'email comme nom:', capitalizedName);
        return capitalizedName;
      }
      
      console.log('⚠️ Utilisation du nom par défaut: Utilisateur');
      return 'Utilisateur';
    };
    
    const safeName = getSafeUserName(user);
    debugInfo += `- Résultat getSafeUserName: "${safeName}"\n\n`;
    
    // 4. Test d'envoi de message
    debugInfo += '4️⃣ TEST ENVOI MESSAGE:\n';
    try {
      const testMessage = `Message de test - ${new Date().toLocaleTimeString()}`;
      const success = await sendMessage(testMessage, 'test-conversation');
      debugInfo += `- Envoi réussi: ${success ? '✅' : '❌'}\n`;
    } catch (error) {
      debugInfo += `- Erreur envoi: ${error}\n`;
    }
    
    // 5. Messages existants
    debugInfo += '\n5️⃣ MESSAGES EXISTANTS:\n';
    if (messages.length > 0) {
      messages.slice(0, 3).forEach((msg, index) => {
        debugInfo += `- Message ${index + 1}: "${msg.content}"\n`;
        debugInfo += `  - Expéditeur: "${msg.senderName}" (ID: ${msg.senderId})\n`;
        debugInfo += `  - Rôle: ${msg.senderRole || 'N/A'}\n`;
        debugInfo += `  - Timestamp: ${msg.timestamp}\n`;
      });
    } else {
      debugInfo += '- Aucun message trouvé\n';
    }
    
    // 6. Conversations
    debugInfo += '\n6️⃣ CONVERSATIONS:\n';
    if (conversations.length > 0) {
      conversations.slice(0, 2).forEach((conv, index) => {
        debugInfo += `- Conversation ${index + 1}: "${conv.nom}"\n`;
        debugInfo += `  - Participants: ${conv.participants.map(p => p.name).join(', ')}\n`;
        debugInfo += `  - Dernier message: ${conv.lastMessage?.text || 'N/A'}\n`;
      });
    } else {
      debugInfo += '- Aucune conversation trouvée\n';
    }
    
    setTestResult(debugInfo);
  };

  useEffect(() => {
    if (status === 'authenticated' && user) {
      runDebugTest();
    }
  }, [status, user]);

  if (status === 'loading') {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  if (!session) {
    return <div className="p-8 text-center text-red-500">Veuillez vous connecter pour tester les messages.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Test Debug Messages</h1>
      
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations de Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Status:</strong> {status}</p>
              <p><strong>User ID:</strong> {session?.user?.id || 'N/A'}</p>
              <p><strong>User Name:</strong> "{session?.user?.name || 'N/A'}"</p>
              <p><strong>User Email:</strong> {session?.user?.email || 'N/A'}</p>
              <p><strong>User Role:</strong> {session?.user?.role || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Button onClick={runDebugTest} className="w-full">
          Relancer le Test Debug
        </Button>
      </div>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Résultat du Diagnostic</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-4 rounded-md overflow-auto">
              {testResult}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
