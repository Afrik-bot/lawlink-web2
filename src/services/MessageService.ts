import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  updateDoc,
  writeBatch,
  increment
} from 'firebase/firestore';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Timestamp;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: {
    content: string;
    timestamp: Timestamp;
    senderId: string;
  };
  unreadCount: { [userId: string]: number };
}

class MessageService {
  private messagesCollection = 'messages';
  private conversationsCollection = 'conversations';

  async sendMessage(senderId: string, receiverId: string, content: string): Promise<string> {
    try {
      // Get or create conversation
      const conversationId = await this.getOrCreateConversation(senderId, receiverId);

      // Add message to messages collection
      const messageRef = await addDoc(collection(db, this.messagesCollection), {
        conversationId,
        senderId,
        receiverId,
        content,
        timestamp: Timestamp.now(),
        read: false,
      });

      // Update conversation's last message
      await updateDoc(doc(db, this.conversationsCollection, conversationId), {
        lastMessage: {
          content,
          timestamp: Timestamp.now(),
          senderId,
        },
        [`unreadCount.${receiverId}`]: increment(1),
      });

      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getOrCreateConversation(user1Id: string, user2Id: string): Promise<string> {
    try {
      // Check if conversation exists
      const q = query(
        collection(db, this.conversationsCollection),
        where('participants', 'array-contains', user1Id)
      );
      
      const querySnapshot = await getDocs(q);
      const existingConversation = querySnapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(user2Id);
      });

      if (existingConversation) {
        return existingConversation.id;
      }

      // Create new conversation
      const conversationRef = await addDoc(collection(db, this.conversationsCollection), {
        participants: [user1Id, user2Id],
        lastMessage: null,
        unreadCount: {
          [user1Id]: 0,
          [user2Id]: 0,
        },
        createdAt: Timestamp.now(),
      });

      return conversationRef.id;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const q = query(
        collection(db, this.conversationsCollection),
        where('participants', 'array-contains', userId),
        orderBy('lastMessage.timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const q = query(
        collection(db, this.messagesCollection),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void): () => void {
    const q = query(
      collection(db, this.messagesCollection),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      callback(messages);
    });
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.messagesCollection),
        where('conversationId', '==', conversationId),
        where('receiverId', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();

      // Reset unread count for the user in the conversation
      await updateDoc(doc(db, this.conversationsCollection, conversationId), {
        [`unreadCount.${userId}`]: 0,
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }
}

const messageService = new MessageService();
export default messageService;
