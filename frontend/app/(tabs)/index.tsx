import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Switch,
  Alert,
  Modal,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';

export default function DialerScreen() {
  const router = useRouter();
  const { user, balance, initiateCall, endCall, activeCall, logCall, updateBalance, loadContacts, loadCallLogs, loadMessages } = useStore();
  const [dialNumber, setDialNumber] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isHideId, setIsHideId] = useState(false);
  const [aliasName, setAliasName] = useState('');
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [callStatus, setCallStatus] = useState('جاري الاتصال...');
  const [showDTMF, setShowDTMF] = useState(false);
  const [dtmfDigits, setDtmfDigits] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadContacts();
    loadCallLogs();
    loadMessages();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showCallScreen && callStatus === 'متصل') {
      interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showCallScreen, callStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const dialDigit = (digit: string) => {
    if (dialNumber.length < 15) {
      setDialNumber((prev) => prev + digit);
    }
  };

  const deleteDigit = () => {
    setDialNumber((prev) => prev.slice(0, -1));
  };

  const startPressZero = () => {
    pressTimerRef.current = setTimeout(() => {
      dialDigit('+');
      pressTimerRef.current = null;
    }, 800);
  };

  const endPressZero = () => {
    if (pressTimerRef.current) {
      dialDigit('0');
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleCall = async () => {
    if (!dialNumber && !isHideId) {
      Alert.alert('خطأ', 'يرجى إدخال رقم الهاتف');
      return;
    }

    if (balance < 0.05) {
      Alert.alert('رصيد غير كافٍ', 'يرجى شحن رصيدك للمتابعة');
      return;
    }

    setShowCallScreen(true);
    setCallTimer(0);
    setCallStatus('جاري الاتصال...');
    setShowDTMF(false);
    setDtmfDigits('');

    const displayName = isHideId ? (aliasName || 'مجهول') : dialNumber;
    
    // Initiate the call
    await initiateCall(dialNumber, displayName, isRecording);

    // Simulate connection after 2 seconds
    setTimeout(() => {
      setCallStatus('متصل');
    }, 2000);
  };

  const handleEndCall = async () => {
    // Log the call
    await logCall(dialNumber, 'outgoing', 0.05, formatTime(callTimer));
    
    // Update balance
    await updateBalance(-0.05);
    
    endCall();
    setShowCallScreen(false);
    setCallTimer(0);
    setCallStatus('جاري الاتصال...');
    setDialNumber('');
  };

  const handleDTMF = (digit: string) => {
    setDtmfDigits((prev) => prev + digit);
  };

  const openAddContact = () => {
    if (dialNumber) {
      router.push({ pathname: '/add-contact', params: { phone: dialNumber } });
    } else {
      router.push('/add-contact');
    }
  };

  const renderKey = (digit: string, sub?: string, isZero?: boolean) => (
    <TouchableOpacity
      key={digit}
      style={styles.key}
      onPress={isZero ? undefined : () => dialDigit(digit)}
      onPressIn={isZero ? startPressZero : undefined}
      onPressOut={isZero ? endPressZero : undefined}
      activeOpacity={0.7}
    >
      <Text style={styles.keyText}>{digit}</Text>
      {sub && <Text style={styles.keySub}>{sub}</Text>}
    </TouchableOpacity>
  );

  const renderCallScreen = () => (
    <Modal visible={showCallScreen} animationType="slide">
      <View style={styles.callScreen}>
        <SafeAreaView style={styles.callContent}>
          <View style={styles.callInfo}>
            <View style={styles.callerAvatar}>
              <Ionicons name="person" size={60} color="#fff" />
            </View>
            <Text style={styles.callerName}>
              {isHideId ? (aliasName || 'مجهول') : dialNumber}
            </Text>
            <Text style={styles.callerNumber}>
              {isHideId ? 'رقم مخفي' : dialNumber}
            </Text>
            <Text style={styles.callStatusText}>{callStatus}</Text>
            {callStatus === 'متصل' && (
              <Text style={styles.callTimerText}>{formatTime(callTimer)}</Text>
            )}
          </View>

          {showDTMF && (
            <View style={styles.dtmfContainer}>
              <View style={styles.dtmfHeader}>
                <Text style={styles.dtmfTitle}>لوحة الأرقام</Text>
                <TouchableOpacity onPress={() => setShowDTMF(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.dtmfDisplay}>
                <Text style={styles.dtmfDigits}>{dtmfDigits}</Text>
              </View>
              <View style={styles.dtmfKeypad}>
                {['1','2','3','4','5','6','7','8','9','*','0','#'].map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.dtmfKey}
                    onPress={() => handleDTMF(key)}
                  >
                    <Text style={styles.dtmfKeyText}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.dtmfCloseBtn}
                onPress={() => setShowDTMF(false)}
              >
                <Text style={styles.dtmfCloseBtnText}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.callControls}>
            <TouchableOpacity
              style={[styles.ctrlBtn, isMuted && styles.ctrlBtnActive]}
              onPress={() => setIsMuted(!isMuted)}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={26}
                color={isMuted ? '#0078D7' : '#fff'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctrlBtn, showDTMF && styles.ctrlBtnActive]}
              onPress={() => setShowDTMF(!showDTMF)}
            >
              <Ionicons
                name="keypad"
                size={26}
                color={showDTMF ? '#0078D7' : '#fff'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctrlBtn, isSpeaker && styles.ctrlBtnActive]}
              onPress={() => setIsSpeaker(!isSpeaker)}
            >
              <Ionicons
                name={isSpeaker ? 'volume-high' : 'volume-medium'}
                size={26}
                color={isSpeaker ? '#0078D7' : '#fff'}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
            <Text style={styles.endCallBtnText}>إنهاء المكالمة</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.statusDot} />
          <Text style={styles.headerTitle}>أبو الزهراء</Text>
        </View>
        <TouchableOpacity
          style={styles.balanceBtn}
          onPress={() => router.push('/topup')}
        >
          <Ionicons name="wallet" size={16} color="#fff" />
          <Text style={styles.balanceText}>${balance.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>

      {/* Dialer Display */}
      <View style={styles.displayArea}>
        <Text style={styles.dialNumber}>{dialNumber || ''}</Text>
        
        {isHideId && (
          <View style={styles.aliasContainer}>
            <TextInput
              style={styles.aliasInput}
              placeholder="اسم المتصل البديل (عنوان SIP)"
              placeholderTextColor="#0078D7"
              value={aliasName}
              onChangeText={setAliasName}
              textAlign="center"
            />
          </View>
        )}

        <View style={styles.toggleRow}>
          <View style={styles.toggleItem}>
            <Switch
              value={isRecording}
              onValueChange={setIsRecording}
              trackColor={{ false: '#ccc', true: '#0078D7' }}
              thumbColor="#fff"
            />
            <Text style={styles.toggleLabel}>تسجيل</Text>
          </View>
          <View style={styles.toggleItem}>
            <Switch
              value={isHideId}
              onValueChange={setIsHideId}
              trackColor={{ false: '#ccc', true: '#0078D7' }}
              thumbColor="#fff"
            />
            <Text style={styles.toggleLabel}>إخفاء الرقم</Text>
          </View>
        </View>
      </View>

      {/* Keypad */}
      <View style={styles.keypadGrid}>
        {renderKey('1')}
        {renderKey('2', 'ABC')}
        {renderKey('3', 'DEF')}
        {renderKey('4', 'GHI')}
        {renderKey('5', 'JKL')}
        {renderKey('6', 'MNO')}
        {renderKey('7', 'PQRS')}
        {renderKey('8', 'TUV')}
        {renderKey('9', 'WXYZ')}
        {renderKey('*')}
        {renderKey('0', '+', true)}
        {renderKey('#')}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addContactBtn} onPress={openAddContact}>
          <Ionicons name="person-add" size={24} color="#0078D7" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
          <Ionicons name="call" size={32} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deleteBtn} onPress={deleteDigit}>
          <Ionicons name="backspace" size={26} color="#d32f2f" />
        </TouchableOpacity>
      </View>

      {renderCallScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#0078D7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00E676',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  balanceText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  displayArea: {
    backgroundColor: '#fff',
    padding: 30,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  dialNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0078D7',
    minHeight: 50,
    letterSpacing: 2,
  },
  aliasContainer: {
    width: '100%',
    marginTop: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  aliasInput: {
    padding: 12,
    fontSize: 14,
    color: '#0078D7',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginTop: 20,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#555',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 20,
    gap: 20,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,120,215,0.05)',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0078D7',
  },
  keySub: {
    fontSize: 10,
    color: '#0078D7',
    opacity: 0.6,
    marginTop: -4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 25,
    paddingBottom: 20,
  },
  addContactBtn: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBtn: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#0078D7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Call Screen Styles
  callScreen: {
    flex: 1,
    backgroundColor: '#004e92',
  },
  callContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  callInfo: {
    alignItems: 'center',
  },
  callerAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 25,
  },
  callerName: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  callerNumber: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  callStatusText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 15,
  },
  callTimerText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: '300',
    marginTop: 20,
    fontFamily: 'monospace',
  },
  callControls: {
    flexDirection: 'row',
    gap: 30,
  },
  ctrlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctrlBtnActive: {
    backgroundColor: '#fff',
  },
  endCallBtn: {
    width: 200,
    paddingVertical: 16,
    backgroundColor: '#A80000',
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 30,
  },
  endCallBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // DTMF Styles
  dtmfContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
  },
  dtmfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dtmfTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dtmfDisplay: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    minHeight: 50,
  },
  dtmfDigits: {
    fontSize: 22,
    color: '#333',
    textAlign: 'center',
    letterSpacing: 3,
  },
  dtmfKeypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  dtmfKey: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E1F5FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dtmfKeyText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0078D7',
  },
  dtmfCloseBtn: {
    backgroundColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  dtmfCloseBtnText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  },
});
