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
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';

export default function RecentsScreen() {
  const { callLogs, loadCallLogs, refreshUser } = useStore();
  const [activeTab, setActiveTab] = useState<'all' | 'recordings'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCallLogs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCallLogs();
    await refreshUser();
    setRefreshing(false);
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'لم يرد';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredLogs = activeTab === 'recordings'
    ? callLogs.filter((log) => log.recording_url)
    : callLogs;

  const renderItem = ({ item }: { item: typeof callLogs[0] }) => (
    <TouchableOpacity style={styles.listItem}>
      <View style={styles.itemLeft}>
        <View style={[
          styles.avatarCircle,
          item.recording_url && styles.recordingAvatar
        ]}>
          <Ionicons
            name={item.recording_url ? 'play' : 'call'}
            size={20}
            color={item.recording_url ? '#2e7d32' : '#1565C0'}
          />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>
            {item.is_anonymous ? (item.alias_name || 'مجهول') : item.to_number}
          </Text>
          <Text style={styles.itemSub}>
            {item.to_number} • {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
        {item.cost > 0 && (
          <Text style={styles.cost}>${item.cost.toFixed(2)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>سجل المكالمات</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            كل المكالمات
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recordings' && styles.tabActive]}
          onPress={() => setActiveTab('recordings')}
        >
          <Text style={[styles.tabText, activeTab === 'recordings' && styles.tabTextActive]}>
            التسجيلات
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="call-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>
              {activeTab === 'recordings' ? 'لا توجد تسجيلات' : 'لا توجد سجلات'}
            </Text>
          </View>
        }
        contentContainerStyle={filteredLogs.length === 0 && styles.emptyList}
      />
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
  recordingAvatar: {
    backgroundColor: '#e8f5e9',
  },
  itemInfo: {
    gap: 3,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemSub: {
    fontSize: 12,
    color: '#888',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  duration: {
    fontSize: 14,
    color: '#666',
  },
  cost: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 3,
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
});
