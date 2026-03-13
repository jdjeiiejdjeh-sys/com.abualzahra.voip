import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

export default function RatesScreen() {
  const { checkRate } = useStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [result, setResult] = useState<{ country: string; rate: number } | null>(null);

  const handleCheck = () => {
    if (!phoneNumber) return;
    const rate = checkRate(phoneNumber);
    setResult(rate);
  };

  const commonRates = [
    { country: 'اليمن', code: '967', rate: '0.15' },
    { country: 'السعودية', code: '966', rate: '0.08' },
    { country: 'الإمارات', code: '971', rate: '0.10' },
    { country: 'مصر', code: '20', rate: '0.07' },
    { country: 'الأردن', code: '962', rate: '0.09' },
    { country: 'لبنان', code: '961', rate: '0.12' },
    { country: 'فلسطين', code: '970', rate: '0.11' },
    { country: 'العراق', code: '964', rate: '0.14' },
    { country: 'سوريا', code: '963', rate: '0.16' },
    { country: 'أمريكا/كندا', code: '1', rate: '0.05' },
    { country: 'المملكة المتحدة', code: '44', rate: '0.06' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'استعلام التعرفة',
          headerStyle: { backgroundColor: '#0078D7' },
          headerTintColor: '#fff',
          headerBackTitle: 'رجوع',
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>استعلام عن سعر رقم</Text>
          
          <TextInput
            style={styles.input}
            placeholder="مثال: +967 777..."
            placeholderTextColor="#999"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            textAlign="right"
          />

          <TouchableOpacity
            style={styles.checkBtn}
            onPress={handleCheck}
          >
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.checkBtnText}>استعلام السعر</Text>
          </TouchableOpacity>

          {result && (
            <View style={styles.resultContainer}>
              <View style={styles.resultIcon}>
                <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
              </View>
              <Text style={styles.resultCountry}>{result.country}</Text>
              <Text style={styles.resultRate}>${result.rate.toFixed(2)}</Text>
              <Text style={styles.resultLabel}>للدقيقة الواحدة</Text>
            </View>
          )}
        </View>

        <View style={styles.ratesCard}>
          <Text style={styles.ratesTitle}>أسعار الدول الرئيسية</Text>
          
          {commonRates.map((item) => (
            <View key={item.code} style={styles.rateRow}>
              <View style={styles.rateInfo}>
                <Text style={styles.countryName}>{item.country}</Text>
                <Text style={styles.countryCode}>+{item.code}</Text>
              </View>
              <Text style={styles.countryRate}>${item.rate}/دقيقة</Text>
            </View>
          ))}
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
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
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
    flexDirection: 'row',
    backgroundColor: '#9C27B0',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  checkBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    alignItems: 'center',
  },
  resultIcon: {
    marginBottom: 10,
  },
  resultCountry: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  resultRate: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0078D7',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  ratesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
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
  rateInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  countryCode: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  countryRate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9C27B0',
  },
});
