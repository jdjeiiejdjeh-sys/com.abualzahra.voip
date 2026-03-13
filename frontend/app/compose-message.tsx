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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

export default function ComposeMessageScreen() {
  const router = useRouter();
  const { sendMessage, user } = useStore();
  const [toNumber, setToNumber] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!toNumber || !body) {
      Alert.alert('خطأ', 'يرجى إدخال جميع البيانات');
      return;
    }

    if ((user?.balance || 0) < 0.02) {
      Alert.alert('رصيد غير كافٍ', 'يرجى شحن رصيدك لإرسال الرسائل');
      return;
    }

    setIsLoading(true);
    const success = await sendMessage(toNumber, body);
    setIsLoading(false);

    if (success) {
      Alert.alert('تم الإرسال!', 'تم إرسال رسالتك بنجاح', [
        { text: 'حسناً', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('خطأ', 'تعذر إرسال الرسالة');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'رسالة جديدة',
          headerStyle: { backgroundColor: '#1565C0' },
          headerTintColor: '#fff',
          headerBackTitle: 'رجوع',
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.costInfo}>
            <Ionicons name="information-circle" size={18} color="#1565C0" />
            <Text style={styles.costText}>تكلفة الرسالة: $0.02</Text>
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
              style={[styles.input, styles.textArea]}
              placeholder="نص الرسالة..."
              placeholderTextColor="#999"
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              textAlign="right"
            />

            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSend}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.sendBtnText}>إرسال</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 15,
  },
  costInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  costText: {
    fontSize: 14,
    color: '#1565C0',
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
  textArea: {
    minHeight: 120,
  },
  sendBtn: {
    flexDirection: 'row',
    backgroundColor: '#1565C0',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
