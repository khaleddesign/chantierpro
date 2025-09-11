interface StoredMessage {
 id: string;
 content: string;
 senderId: string;
 senderName: string;
 conversationId: string;
 timestamp: string;
 type: 'text' | 'image' | 'file';
 photos: string[];
}

class MessageStore {
 private messages: Map<string, StoredMessage[]> = new Map();

 addMessage(conversationId: string, message: StoredMessage) {
   if (!this.messages.has(conversationId)) {
     this.messages.set(conversationId, []);
   }
   
   const conversation = this.messages.get(conversationId)!;
   conversation.push(message);
   
   console.log(`Message ajouté à la conversation ${conversationId}:`, message.content);
 }

 getMessages(conversationId: string): StoredMessage[] {
   return this.messages.get(conversationId) || [];
 }

 getAllConversations(): string[] {
   return Array.from(this.messages.keys());
 }

 getMessageCount(conversationId: string): number {
   return this.messages.get(conversationId)?.length || 0;
 }

 clearConversation(conversationId: string) {
   this.messages.delete(conversationId);
 }

 clearAll() {
   this.messages.clear();
 }
}

export const messageStore = new MessageStore();

messageStore.addMessage('1', {
 id: '1',
 content: 'Bonjour ! Comment avance le projet de rénovation ?',
 senderId: 'comm-1',
 senderName: 'Marie Commercial',
 conversationId: '1',
 timestamp: '14:20',
 type: 'text',
 photos: []
});

messageStore.addMessage('1', {
 id: '2',
 content: 'Tout se passe très bien ! L équipe est sur site.',
 senderId: 'client-1',
 senderName: 'Pierre Dubois',
 conversationId: '1',
 timestamp: '14:25',
 type: 'text',
 photos: []
});

messageStore.addMessage('2', {
 id: '3',
 content: 'L extension peut-elle commencer ?',
 senderId: 'client-2',
 senderName: 'Sophie Martin',
 conversationId: '2',
 timestamp: '10:15',
 type: 'text',
 photos: []
});
