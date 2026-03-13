import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

export default function RatesScreen() {
  const { checkRate } = useStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [result, setResult] = useState<{ country: string; rate_per_minute: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = async () => {
    if (!phoneNumber) return;
    
    setIsLoading(true);
    const rate = await checkRate(phoneNumber);
    setResult(rate);
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'التعرفة',
          headerStyle: { backgroundColor: '#1565C0' },
          headerTintColor: '#fff',
          headerBackTitle: 'رجوع',
        }}
      />

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>استعلام عن تعرفة رقم</Text>
          
          <TextInput
            style={styles.input}
            placeholder="أدخل الرقم (مثال: 967...)"
            placeholderTextColor="#999"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            textAlign="right"
          />

          <TouchableOpacity
            style={styles.checkBtn}
            onPress={handleCheck}
            disabled={isLoading || !phoneNumber}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkBtnText}>استعلام</Text>
            )}
          </TouchableOpacity>

          {result && (
            <View style={styles.resultContainer}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>الدولة:</Text>
                <Text style={styles.resultValue}>{result.country}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>سعر الدقيقة:</Text>
                <Text style={styles.rateValue}>${result.rate_per_minute.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.ratesCard}>
          <Text style={styles.ratesTitle}>أسعار الدول الرئيسية</Text>
          
          {[
            { country: 'اليمن', rate: '0.15' },
            { country: 'السعودية', rate: '0.08' },
            { country: 'الإمارات', rate: '0.10' },
            { country: 'مصر', rate: '0.07' },
            { country: 'أمريكا/كندا', rate: '0.05' },
          ].map((item) => (
            <View key={item.country} style={styles.rateRow}>
              <Text style={styles.countryName}>{item.country}</Text>
              <Text style={styles.countryRate}>${item.rate}/دقيقة</Text>
            </View>
          ))}
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  checkBtn: {
    backgroundColor: '#1565C0',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  checkBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  rateValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  ratesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ratesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  countryName: {
    fontSize: 15,
    color: '#333',
  },
  countryRate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1565C0',
  },
});
