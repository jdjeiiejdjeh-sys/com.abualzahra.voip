import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '../store/useStore';

export default function ProfileScreen() {
  const { user, balance } = useStore();

  const copyUid = async () => {
    if (user?.uid) {
      await Clipboard.setStringAsync(user.uid);
      Alert.alert('تم النسخ', 'تم نسخ رقم UID إلى الحافظة');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'حسابي',
          headerStyle: { backgroundColor: '#0078D7' },
          headerTintColor: '#fff',
          headerBackTitle: 'رجوع',
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="shield-checkmark" size={50} color="#0078D7" />
          </View>
          <Text style={styles.userName}>أبو الزهراء VIP</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>رقم الحساب (UID)</Text>
            <TouchableOpacity onPress={copyUid} style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={18} color="#0078D7" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={copyUid} style={styles.uidBox}>
            <Text style={styles.uidText} selectable>
              {user?.uid || '...'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الرصيد الحالي</Text>
            <Text style={styles.balanceValue}>${balance.toFixed(2)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>البريد الإلكتروني</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>نسخة التطبيق</Text>
            <Text style={styles.versionValue}>3.9.60</Text>
          </View>
        </View>

        <View style={styles.helpCard}>
          <View style={styles.helpIcon}>
            <Ionicons name="help-circle" size={24} color="#FF9800" />
          </View>
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>كيفية تحويل الرصيد</Text>
            <Text style={styles.helpText}>
              شارك رقم UID الخاص بك مع الشخص الذي يريد تحويل الرصيد إليك
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  content: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E1F5FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  copyBtn: {
    padding: 5,
  },
  uidBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  uidText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  versionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0078D7',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  helpCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  helpIcon: {
    marginTop: 2,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});
