import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

export default function ReportsScreen() {
  const { transactions, loadTransactions } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'topup':
      case 'bonus':
        return { name: 'card', color: '#4CAF50' };
      case 'call':
        return { name: 'call', color: '#F44336' };
      case 'sms':
        return { name: 'chatbubble', color: '#FF9800' };
      case 'transfer_out':
        return { name: 'arrow-forward', color: '#F44336' };
      default:
        return { name: 'receipt', color: '#666' };
    }
  };

  const renderItem = ({ item }: { item: typeof transactions[0] }) => {
    const icon = getIcon(item.type);
    const isPositive = item.amount > 0;

    return (
      <View style={styles.listItem}>
        <View style={styles.itemLeft}>
          <View style={[styles.iconCircle, { backgroundColor: `${icon.color}15` }]}>
            <Ionicons name={icon.name as any} size={20} color={icon.color} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemDesc}>{item.description}</Text>
            <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        <Text style={[styles.amount, isPositive ? styles.amountPositive : styles.amountNegative]}>
          {isPositive ? '+' : ''}{item.amount.toFixed(2)}$
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'التقارير',
          headerStyle: { backgroundColor: '#1565C0' },
          headerTintColor: '#fff',
          headerBackTitle: 'رجوع',
        }}
      />

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>لا توجد معاملات</Text>
          </View>
        }
        contentContainerStyle={transactions.length === 0 && styles.emptyList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountPositive: {
    color: '#4CAF50',
  },
  amountNegative: {
    color: '#F44336',
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
