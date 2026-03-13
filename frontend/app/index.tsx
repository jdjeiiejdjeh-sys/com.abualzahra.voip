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
  const { login, register, initAuthListener, isAuthenticated, isLoading } = useStore();
  const [mode, setMode] = useState<'start' | 'welcome' | 'login' | 'register'>('start');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLocalLoading(true);
    const success = await login(email, password);
    setLocalLoading(false);
    
    if (!success) {
      Alert.alert('خطأ', 'بيانات الدخول غير صحيحة');
    }
  };

  const handleRegister = async () => {
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

    setLocalLoading(true);
    const success = await register(email, password);
    setLocalLoading(false);
    
    if (success) {
      Alert.alert('مبروك!', 'تم إنشاء حسابك ومنحك رصيد $0.63 مجاناً!');
    } else {
      Alert.alert('خطأ', 'تعذر إنشاء الحساب. ربما البريد مسجل مسبقاً');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  const renderStart = () => (
    <View style={styles.startContainer}>
      <View style={styles.logoCircle}>
        <Ionicons name="call" size={50} color="#fff" />
      </View>
      <Text style={styles.title}>أبو الزهراء</Text>
      <TouchableOpacity style={styles.startBtn} onPress={() => setMode('welcome')}>
        <Text style={styles.startBtnText}>دخول / تسجيل</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeIcon}>
        <Ionicons name="person-circle" size={80} color="#fff" />
      </View>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => setMode('login')}>
        <Text style={styles.primaryBtnText}>تسجيل الدخول</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setMode('register')}>
        <Text style={styles.secondaryBtnText}>حساب جديد</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoginForm = () => (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>مرحباً بعودتك</Text>
      
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

      <TouchableOpacity 
        style={styles.submitBtn} 
        onPress={handleLogin}
        disabled={localLoading}
      >
        {localLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>دخول</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setMode('welcome')}>
        <Text style={styles.backBtnText}>الرجوع</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRegisterForm = () => (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>حساب جديد</Text>
      
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
      
      <TextInput
        style={styles.input}
        placeholder="كلمة المرور"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        textAlign="right"
      />

      <TextInput
        style={styles.input}
        placeholder="تأكيد كلمة المرور"
        placeholderTextColor="#999"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showPassword}
        textAlign="right"
      />

      <TouchableOpacity 
        style={styles.submitBtn} 
        onPress={handleRegister}
        disabled={localLoading}
      >
        {localLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>إنشاء الحساب</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setMode('welcome')}>
        <Text style={styles.backBtnText}>الرجوع</Text>
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
        {mode === 'start' && renderStart()}
        {mode === 'welcome' && renderWelcome()}
        {mode === 'login' && renderLoginForm()}
        {mode === 'register' && renderRegisterForm()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0078D7',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 15,
    fontSize: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  startContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 50,
    letterSpacing: 1,
  },
  startBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
  },
  startBtnText: {
    color: '#0078D7',
    fontSize: 18,
    fontWeight: 'bold',
  },
  welcomeContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  welcomeIcon: {
    marginBottom: 40,
  },
  primaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  primaryBtnText: {
    color: '#0078D7',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    width: '100%',
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 350,
    padding: 30,
    borderRadius: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0078D7',
    textAlign: 'center',
    marginBottom: 25,
  },
  input: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 14,
  },
  submitBtn: {
    backgroundColor: '#0078D7',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  backBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  backBtnText: {
    color: '#888',
    fontSize: 15,
  },
});
