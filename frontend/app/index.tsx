import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login, signup, loadToken, isLoading } = useStore();
  const [mode, setMode] = useState<'options' | 'login' | 'signup'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const isAuthenticated = await loadToken();
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    const success = await login(email, password);
    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('خطأ', 'بيانات الدخول غير صحيحة');
    }
  };

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى إدخال جميع البيانات');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمات المرور غير متطابقة');
      return;
    }

    if (password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    const success = await signup(email, password);
    if (success) {
      Alert.alert('مبروك!', 'تم إنشاء حسابك ومنحك رصيد 1$ مجاناً!', [
        { text: 'حسناً', onPress: () => router.replace('/(tabs)') }
      ]);
    } else {
      Alert.alert('خطأ', 'البريد الإلكتروني مسجل مسبقاً');
    }
  };

  const renderOptions = () => (
    <View style={styles.optionsContainer}>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => setMode('login')}>
        <Text style={styles.primaryBtnText}>تسجيل الدخول</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setMode('signup')}>
        <Text style={styles.secondaryBtnText}>إنشاء حساب جديد</Text>
      </TouchableOpacity>
    </View>
  );

  const renderForm = () => (
    <View style={styles.formContainer}>
      <TextInput
        style={styles.input}
        placeholder="البريد الإلكتروني"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        textAlign="right"
      />
      
      <View style={styles.passwordContainer}>
        <TouchableOpacity 
          style={styles.eyeIcon} 
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons 
            name={showPassword ? 'eye-off' : 'eye'} 
            size={22} 
            color="#666" 
          />
        </TouchableOpacity>
        <TextInput
          style={styles.passwordInput}
          placeholder="كلمة المرور"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          textAlign="right"
        />
      </View>

      {mode === 'signup' && (
        <TextInput
          style={styles.input}
          placeholder="تأكيد كلمة المرور"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          textAlign="right"
        />
      )}

      <TouchableOpacity 
        style={styles.primaryBtn} 
        onPress={mode === 'login' ? handleLogin : handleSignup}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#1565C0" />
        ) : (
          <Text style={styles.primaryBtnText}>
            {mode === 'login' ? 'دخول' : 'تسجيل'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setMode('options')}>
        <Text style={styles.secondaryBtnText}>عودة</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="call" size={40} color="#fff" />
          </View>
          <Text style={styles.title}>أبو الزهراء</Text>
          <Text style={styles.subtitle}>تطبيق الاتصال الآمن والمجاني</Text>
        </View>

        {mode === 'options' ? renderOptions() : renderForm()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1565C0',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 300,
  },
  formContainer: {
    width: '100%',
    maxWidth: 300,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 15,
  },
  primaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#1565C0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
