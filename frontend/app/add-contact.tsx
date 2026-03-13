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
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

export default function AddContactScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addContact } = useStore();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState((params.phone as string) || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !phoneNumber) {
      Alert.alert('خطأ', 'يرجى إدخال جميع البيانات');
      return;
    }

    setIsLoading(true);
    const success = await addContact(name, phoneNumber);
    setIsLoading(false);

    if (success) {
      Alert.alert('تمت الإضافة!', `تمت إضافة ${name} إلى جهات الاتصال`, [
        { text: 'حسناً', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('خطأ', 'تعذرت إضافة جهة الاتصال');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'إضافة جهة اتصال',
          headerStyle: { backgroundColor: '#1565C0' },
          headerTintColor: '#fff',
          headerBackTitle: 'رجوع',
        }}
      />

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person-add" size={40} color="#1565C0" />
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="الاسم"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="رقم الهاتف"
            placeholderTextColor="#999"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            textAlign="right"
          />

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={22} color="#fff" />
                <Text style={styles.saveBtnText}>حفظ</Text>
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
