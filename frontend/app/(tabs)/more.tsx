import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout, balance } = useStore();

  const menuItems = [
    {
      id: 'topup',
      title: 'إعادة الشحن',
      icon: 'card',
      iconBg: '#FF9800',
      route: '/topup',
    },
    {
      id: 'rates',
      title: 'التعرفة',
      icon: 'search',
      iconBg: '#9C27B0',
      route: '/rates',
    },
    {
      id: 'reports',
      title: 'التقارير',
      icon: 'document-text',
      iconBg: '#607D8B',
      route: '/reports',
    },
    {
      id: 'profile',
      title: 'حسابي',
      icon: 'id-card',
      iconBg: '#4CAF50',
      route: '/profile',
    },
    {
      id: 'transfer',
      title: 'تحويل الرصيد',
      icon: 'swap-horizontal',
      iconBg: '#F44336',
      route: '/transfer',
    },
    {
      id: 'support',
      title: 'الدعم',
      icon: 'logo-whatsapp',
      iconBg: '#25D366',
      action: () => Linking.openURL('https://wa.me/967784702352'),
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'خروج',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المزيد</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() => {
                if (item.action) {
                  item.action();
                } else if (item.route) {
                  router.push(item.route as any);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon as any} size={24} color="#fff" />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#666" />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 25,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 25,
    marginTop: 10,
    gap: 8,
  },
  logoutText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
});
