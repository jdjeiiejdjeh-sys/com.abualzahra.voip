import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  SafeAreaView,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';

export default function MessagesScreen() {
  const router = useRouter();
  const { messages, loadMessages, sendMessage, getConversation, balance } = useStore();
  const [activeTab, setActiveTab] = useState<'notifications' | 'sms'>('notifications');
  const [refreshing, setRefreshing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatNumber, setChatNumber] = useState('');
  const [chatName, setChatName] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  // Group messages by phone number to get conversations
  const getConversations = () => {
    const convMap = new Map<string, any>();
    messages.forEach((msg) => {
      if (!convMap.has(msg.number)) {
        convMap.set(msg.number, {
          number: msg.number,
          lastMessage: msg.text,
          timestamp: msg.timestamp,
          name: msg.name || msg.number,
        });
      } else {
        const existing = convMap.get(msg.number);
        if (msg.timestamp > existing.timestamp) {
          convMap.set(msg.number, {
            ...existing,
            lastMessage: msg.text,
            timestamp: msg.timestamp,
          });
        }
      }
    });
    return Array.from(convMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  };

  const openChat = (number: string, name: string) => {
    setChatNumber(number);
    setChatName(name);
    const msgs = getConversation(number);
    setChatMessages(msgs);
    setShowChat(true);
  };

  const handleSendChatMessage = async () => {
    if (!newMessage.trim()) return;
    
    if (balance < 0.02) {
      return;
    }

    const success = await sendMessage(chatNumber, newMessage);
    if (success) {
      // Add to local state immediately for better UX
      const newMsg = {
        id: Date.now().toString(),
        number: chatNumber,
        text: newMessage,
        type: 'sent',
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, newMsg]);
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const notifications = [
    {
      id: '1',
      title: 'مرحباً بك!',
      body: 'أهلاً بك في تطبيق أبو الزهراء. استمتع برصيدك المجاني!',
      time: 'الآن',
      icon: 'gift',
    },
  ];

  const renderNotification = ({ item }: { item: typeof notifications[0] }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationIcon}>
        <Ionicons name={item.icon as any} size={22} color="#FF9800" />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
    </View>
  );

  const renderConversation = ({ item }: { item: ReturnType<typeof getConversations>[0] }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => openChat(item.number, item.name)}
    >
      <View style={styles.itemLeft}>
        <View style={styles.avatarCircle}>
          <Ionicons name="chatbubble" size={20} color="#0078D7" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemBody} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
      </View>
      <Text style={styles.itemTime}>{formatDate(item.timestamp)}</Text>
    </TouchableOpacity>
  );

  const renderChatMessage = ({ item }: { item: any }) => (
    <View
      style={[
        styles.messageBubble,
        item.type === 'sent' ? styles.msgSent : styles.msgReceived,
      ]}
    >
      <Text style={[
        styles.messageText,
        item.type === 'sent' && styles.messageTextSent
      ]}>
        {item.text}
      </Text>
      <Text style={[
        styles.messageTime,
        item.type === 'sent' && styles.messageTimeSent
      ]}>
        {formatDate(item.timestamp)}
      </Text>
    </View>
  );

  const renderChatModal = () => (
    <Modal visible={showChat} animationType="slide">
      <SafeAreaView style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setShowChat(false)}>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>{chatName}</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView
          style={styles.chatContent}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderChatMessage}
            contentContainerStyle={styles.chatMessages}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.chatInputArea}>
            <TextInput
              style={styles.chatInput}
              placeholder="اكتب رسالة..."
              placeholderTextColor="#999"
              value={newMessage}
              onChangeText={setNewMessage}
              textAlign="right"
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSendChatMessage}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الرسائل</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
          onPress={() => setActiveTab('notifications')}
        >
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
            الإشعارات
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sms' && styles.tabActive]}
          onPress={() => setActiveTab('sms')}
        >
          <Text style={[styles.tabText, activeTab === 'sms' && styles.tabTextActive]}>
            SMS
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'notifications' ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>لا توجد إشعارات</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={getConversations()}
          keyExtractor={(item) => item.number}
          renderItem={renderConversation}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>لا توجد رسائل</Text>
            </View>
          }
          contentContainerStyle={getConversations().length === 0 && styles.emptyList}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/compose-message')}
      >
        <Ionicons name="create" size={24} color="#fff" />
      </TouchableOpacity>

      {renderChatModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#0078D7',
    padding: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0078D7',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0078D7',
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  notificationBody: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E1F5FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  itemBody: {
    fontSize: 13,
    color: '#888',
    marginTop: 3,
  },
  itemTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  emptyList: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 85,
    left: 20,
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#0078D7',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  // Chat Modal Styles
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatHeader: {
    backgroundColor: '#0078D7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  chatHeaderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatContent: {
    flex: 1,
  },
  chatMessages: {
    padding: 15,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  msgSent: {
    backgroundColor: '#0078D7',
    alignSelf: 'flex-start',
    borderBottomRightRadius: 2,
    marginRight: 'auto',
  },
  msgReceived: {
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-end',
    borderBottomLeftRadius: 2,
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  messageTextSent: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
    textAlign: 'left',
  },
  messageTimeSent: {
    color: 'rgba(255,255,255,0.7)',
  },
  chatInputArea: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0078D7',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
