import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

export default function TransferScreen() {
  const router = useRouter();
  const { user, transferBalance } = useStore();
  const [toNumber, setToNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async () => {
    if (!toNumber || !amount) {
      Alert.alert('خطأ', 'يرجى إدخال جميع البيانات');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    if (amountNum > (user?.balance || 0)) {
      Alert.alert('خطأ', 'رصيد غير كافٍ');
      return;
    }

    setIsLoading(true);
    const success = await transferBalance(toNumber, amountNum);
    setIsLoading(false);

    if (success) {
      Alert.alert('تم التحويل بنجاح!', `تم تحويل $${amountNum.toFixed(2)} إلى ${toNumber}`, [
        { text: 'حسناً', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('خطأ', 'تعذر إتمام التحويل');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'تحويل الرصيد',
          headerStyle: { backgroundColor: '#1565C0' },
          headerTintColor: '#fff',
          headerBackTitle: 'رجوع',
        }}
      />

      <View style={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>رصيدك الحالي</Text>
          <Text style={styles.balanceValue}>${(user?.balance || 0).toFixed(2)}</Text>
        </View>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="رقم المستلم"
            placeholderTextColor="#999"
            value={toNumber}
            onChangeText={setToNumber}
            keyboardType="phone-pad"
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="المبلغ"
            placeholderTextColor="#999"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            textAlign="right"
          />

          <TouchableOpacity
            style={styles.transferBtn}
            onPress={handleTransfer}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="swap-horizontal" size={22} color="#fff" />
                <Text style={styles.transferBtnText}>تأكيد التحويل</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    padding: 15,
  },
  balanceCard: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  transferBtn: {
    flexDirection: 'row',
    backgroundColor: '#1565C0',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  transferBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
