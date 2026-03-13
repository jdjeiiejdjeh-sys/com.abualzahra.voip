import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

const AMOUNTS = [
  { value: 0.99, label: '$0.99' },
  { value: 4.99, label: '$4.99' },
  { value: 9.99, label: '$9.99' },
  { value: 24.99, label: '$24.99' },
  { value: 49.99, label: '$49.99 + مكافأة $10', bonus: true },
];

export default function TopupScreen() {
  const router = useRouter();
  const { topupBalance, user } = useStore();
  const [selectedAmount, setSelectedAmount] = useState(0.99);
  const [isLoading, setIsLoading] = useState(false);

  const handleTopup = async () => {
    setIsLoading(true);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const success = await topupBalance(selectedAmount);
    setIsLoading(false);
    
    if (success) {
      const bonus = selectedAmount >= 49.99 ? 10 : 0;
      Alert.alert(
        'تم الشحن بنجاح!',
        `تم إضافة $${(selectedAmount + bonus).toFixed(2)} إلى رصيدك`,
        [{ text: 'حسناً', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('خطأ', 'تعذر إتمام عملية الشحن');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'شحن الرصيد',
          headerStyle: { backgroundColor: '#1565C0' },
          headerTintColor: '#fff',
          headerBackTitle: 'رجوع',
        }}
      />

      <View style={styles.content}>
        <View style={styles.balanceCard}>
          <Ionicons name="wallet" size={40} color="#1565C0" />
          <Text style={styles.currentBalanceLabel}>رصيدك الحالي</Text>
          <Text style={styles.currentBalance}>${(user?.balance || 0).toFixed(2)}</Text>
        </View>

        <Text style={styles.sectionTitle}>اختر القيمة المناسبة</Text>

        <View style={styles.amountsGrid}>
          {AMOUNTS.map((amount) => (
            <TouchableOpacity
              key={amount.value}
              style={[
                styles.amountBtn,
                selectedAmount === amount.value && styles.amountBtnSelected,
                amount.bonus && styles.amountBtnBonus,
              ]}
              onPress={() => setSelectedAmount(amount.value)}
            >
              <Text
                style={[
                  styles.amountText,
                  selectedAmount === amount.value && styles.amountTextSelected,
                ]}
              >
                {amount.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.payButton}
          onPress={handleTopup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="card" size={22} color="#fff" />
              <Text style={styles.payButtonText}>شحن الآن</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.noteText}>
          ملاحظة: سيتم إضافة الرصيد فوراً بعد الدفع
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentBalanceLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  currentBalance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1565C0',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  amountBtn: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  amountBtnSelected: {
    borderColor: '#1565C0',
    backgroundColor: '#e3f2fd',
  },
  amountBtnBonus: {
    width: '100%',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  amountTextSelected: {
    color: '#1565C0',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#003087',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    gap: 10,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noteText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
  },
});
