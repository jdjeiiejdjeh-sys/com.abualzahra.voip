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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import {
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';

// Configure Google Sign-In with Web Client ID from Firebase
const GOOGLE_WEB_CLIENT_ID = '982107544824-jbl3da73lr9h7il169onbl4ftrkmhvaj.apps.googleusercontent.com';

// Initialize Google Sign-In
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, loginWithGoogle, initAuthListener, isAuthenticated, isLoading } = useStore();
  const [mode, setMode] = useState<'start' | 'login'>('start');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleGoogleSignIn = async () => {
    setLocalLoading(true);
    try {
      // Check if Play Services are available (Android only)
      await GoogleSignin.hasPlayServices();
      
      // Sign in with Google - This shows the native account picker
      const response = await GoogleSignin.signIn();
      
      if (isSuccessResponse(response)) {
        const { data } = response;
        const userEmail = data.user.email;
        const userId = data.user.id;
        const userName = data.user.name || undefined;
        
        console.log('Google Sign-In successful:', userEmail);
        
        // Login with Google credentials to our store
        const success = await loginWithGoogle(userEmail, userId, userName);
        if (!success) {
          Alert.alert('خطأ', 'تعذر تسجيل الدخول عبر Google');
        }
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            // Operation is already in progress
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert('خطأ', 'خدمات Google Play غير متوفرة');
            break;
          case statusCodes.SIGN_IN_CANCELLED:
            // User cancelled the sign-in flow
            console.log('User cancelled Google sign-in');
            break;
          default:
            Alert.alert('خطأ', 'تعذر تسجيل الدخول عبر Google');
        }
      } else {
        // For web platform, show a message
        if (Platform.OS === 'web') {
          Alert.alert('تنبيه', 'تسجيل الدخول بـ Google يعمل على الجهاز المحمول فقط. استخدم البريد الإلكتروني وكلمة المرور للدخول.');
        } else {
          Alert.alert('خطأ', 'تعذر تسجيل الدخول عبر Google');
        }
      }
    }
    setLocalLoading(false);
  };

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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  // شاشة البداية - الترحيب
  const renderStart = () => (
    <View style={styles.startContainer}>
      <View style={styles.logoCircle}>
        <Ionicons name="call" size={60} color="#fff" />
      </View>
      <Text style={styles.title}>أبو الزهراء</Text>
      <Text style={styles.subtitle}>تطبيق الاتصال الآمن</Text>
      
      <View style={styles.startBtnGroup}>
        <TouchableOpacity 
          style={styles.startBtnWhite} 
          onPress={() => setMode('login')}
        >
          <Text style={styles.startBtnWhiteText}>دخول / تسجيل</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // شاشة تسجيل الدخول
  const renderLogin = () => (
    <View style={styles.loginContainer}>
      <TouchableOpacity 
        style={styles.backArrow} 
        onPress={() => setMode('start')}
      >
        <Ionicons name="arrow-forward" size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.loginHeader}>
        <View style={styles.loginIcon}>
          <Ionicons name="person-circle" size={80} color="rgba(255,255,255,0.9)" />
        </View>
        <Text style={styles.loginTitle}>مرحباً بك</Text>
      </View>

      <View style={styles.formCard}>
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
          style={styles.loginBtn} 
          onPress={handleLogin}
          disabled={localLoading}
        >
          {localLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>أو</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity 
          style={styles.googleBtn} 
          onPress={handleGoogleSignIn}
          disabled={localLoading}
        >
          <View style={styles.googleIconContainer}>
            <Text style={styles.googleIcon}>G</Text>
          </View>
          <Text style={styles.googleBtnText}>تسجيل عبر Google</Text>
        </TouchableOpacity>
      </View>
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
        {mode === 'login' && renderLogin()}
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
  
  // شاشة البداية
  startContainer: {
    alignItems: 'center',
    width: '100%',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 60,
  },
  startBtnGroup: {
    width: '100%',
    maxWidth: 280,
  },
  startBtnWhite: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  startBtnWhiteText: {
    color: '#0078D7',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // شاشة تسجيل الدخول
  loginContainer: {
    width: '100%',
    alignItems: 'center',
  },
  backArrow: {
    position: 'absolute',
    top: -40,
    right: 0,
    padding: 10,
    zIndex: 10,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  loginIcon: {
    marginBottom: 15,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  formCard: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 350,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 16,
  },
  loginBtn: {
    backgroundColor: '#0078D7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    paddingHorizontal: 15,
    color: '#999',
    fontSize: 14,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  googleIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleBtnText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
