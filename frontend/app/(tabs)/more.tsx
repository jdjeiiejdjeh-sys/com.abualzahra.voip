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
  const { user, logout } = useStore();

  const menuItems = [
    {
      id: 'topup',
      title: 'شحن الرصيد',
      icon: 'card',
      iconBg: '#e3f2fd',
      iconColor: '#1565C0',
      route: '/topup',
    },
    {
      id: 'rates',
      title: 'التعرفة',
      icon: 'search',
      iconBg: '#e8f5e9',
      iconColor: '#2e7d32',
      route: '/rates',
    },
    {
      id: 'reports',
      title: 'التقارير',
      icon: 'document-text',
      iconBg: '#fff3e0',
      iconColor: '#ef6c00',
      route: '/reports',
    },
    {
      id: 'profile',
      title: 'حسابي',
      icon: 'person-circle',
      iconBg: '#f3e5f5',
      iconColor: '#7b1fa2',
      route: '/profile',
    },
    {
      id: 'transfer',
      title: 'تحويل الرصيد',
      icon: 'swap-horizontal',
      iconBg: '#ffebee',
      iconColor: '#c62828',
      route: '/transfer',
    },
    {
      id: 'support',
      title: 'الدعم',
      icon: 'logo-whatsapp',
      iconBg: '#e0f2f1',
      iconColor: '#00695c',
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
            >
              <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon as any} size={26} color={item.iconColor} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#F44336" />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    padding: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
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
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutText: {
    color: '#F44336',
    fontSize: 15,
    fontWeight: '600',
  },
});
