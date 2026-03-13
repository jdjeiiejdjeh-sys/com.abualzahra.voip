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
  const { user, balance, transferBalance } = useStore();
  const [receiverUid, setReceiverUid] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async () => {
    if (!receiverUid || !amount) {
      Alert.alert('خطأ', 'يرجى إدخال جميع البيانات');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    if (amountNum > balance) {
      Alert.alert('خطأ', 'رصيد غير كافٍ');
      return;
    }

    if (receiverUid === user?.uid) {
      Alert.alert('خطأ', 'لا يمكنك التحويل لنفسك');
      return;
    }

    setIsLoading(true);
    const success = await transferBalance(receiverUid, amountNum);
    setIsLoading(false);

    if (success) {
      Alert.alert('تم التحويل بنجاح!', `تم تحويل $${amountNum.toFixed(2)} إلى ${receiverUid}`, [
        { text: 'حسناً', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('خطأ', 'تعذر إتمام التحويل. تأكد من صحة UID المستلم');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'تحويل رصيد',
          headerStyle: { backgroundColor: '#0078D7' },
          headerTintColor: '#fff',
          headerBackTitle: 'رجوع',
        }}
      />

      <View style={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>رصيدك الحالي</Text>
          <Text style={styles.balanceValue}>${balance.toFixed(2)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>رقم حساب المستلم (UID)</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل UID المستلم"
            placeholderTextColor="#999"
            value={receiverUid}
            onChangeText={setReceiverUid}
            textAlign="right"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>المبلغ ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
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

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#0078D7" />
          <Text style={styles.infoText}>
            يمكنك الحصول على UID الخاص بك من قسم "حسابي"
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  content: {
    padding: 15,
  },
  balanceCard: {
    backgroundColor: '#9C27B0',
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
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  transferBtn: {
    flexDirection: 'row',
    backgroundColor: '#9C27B0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  transferBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0078D7',
    lineHeight: 20,
  },
});
