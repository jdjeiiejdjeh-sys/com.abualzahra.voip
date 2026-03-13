import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';

export default function MessagesScreen() {
  const router = useRouter();
  const { messages, loadMessages, refreshUser } = useStore();
  const [activeTab, setActiveTab] = useState<'notifications' | 'sms'>('sms');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    await refreshUser();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: typeof messages[0] }) => (
    <TouchableOpacity style={styles.listItem}>
      <View style={styles.itemLeft}>
        <View style={styles.avatarCircle}>
          <Ionicons name="chatbubble" size={20} color="#1565C0" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.to_number}</Text>
          <Text style={styles.itemBody} numberOfLines={1}>
            {item.body}
          </Text>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemTime}>{formatDate(item.created_at)}</Text>
        <View style={[
          styles.statusDot,
          item.status === 'sent' ? styles.statusSent : styles.statusFailed
        ]} />
      </View>
    </TouchableOpacity>
  );

  const notifications = [
    {
      id: '1',
      title: 'مرحباً بك!',
      body: 'تم إنشاء حسابك بنجاح. استمتع برصيدك المجاني!',
      time: 'الآن',
    },
  ];

  const renderNotification = ({ item }: { item: typeof notifications[0] }) => (
    <View style={styles.notificationItem}>
      <View style={[styles.avatarCircle, styles.notificationAvatar]}>
        <Ionicons name="notifications" size={20} color="#FF9800" />
      </View>
      <View style={styles.notificationInfo}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
    </View>
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

      {activeTab === 'sms' ? (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>لا توجد رسائل</Text>
            </View>
          }
          contentContainerStyle={messages.length === 0 && styles.emptyList}
        />
      ) : (
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
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/compose-message')}
      >
        <Ionicons name="create" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1565C0',
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
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1565C0',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#1565C0',
    fontWeight: 'bold',
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
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    gap: 3,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  itemBody: {
    fontSize: 13,
    color: '#888',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  itemTime: {
    fontSize: 12,
    color: '#999',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusSent: {
    backgroundColor: '#4CAF50',
  },
  statusFailed: {
    backgroundColor: '#F44336',
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationAvatar: {
    backgroundColor: '#fff3e0',
  },
  notificationInfo: {
    flex: 1,
    gap: 5,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  notificationBody: {
    fontSize: 13,
    color: '#666',
  },
  notificationTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 5,
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
    bottom: 20,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});
