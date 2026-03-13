import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';

export default function DialerScreen() {
  const router = useRouter();
  const { user, initiateCall, refreshUser, activeCall } = useStore();
  const [dialNumber, setDialNumber] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [aliasName, setAliasName] = useState('');
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [callStatus, setCallStatus] = useState('جاري الاتصال...');
  const [showDTMF, setShowDTMF] = useState(false);
  const [dtmfDigits, setDtmfDigits] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  useEffect(() => {
    refreshUser();
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

  const handleLongPressZero = () => {
    if (dialNumber.length < 15) {
      setDialNumber((prev) => prev + '+');
    }
  };

  const handleCall = async () => {
    if (!dialNumber && !isAnonymous) {
      Alert.alert('خطأ', 'يرجى إدخال رقم الهاتف');
      return;
    }

    if ((user?.balance || 0) < 0.05) {
      Alert.alert('رصيد غير كافٍ', 'يرجى شحن رصيدك للمتابعة');
      return;
    }

    setShowCallScreen(true);
    setCallTimer(0);
    setCallStatus('جاري الاتصال...');

    const callSid = await initiateCall(dialNumber, isRecording, isAnonymous, aliasName);
    
    if (callSid) {
      setTimeout(() => {
        setCallStatus('متصل');
      }, 2000);
    } else {
      Alert.alert('خطأ', 'تعذر إجراء المكالمة');
      setShowCallScreen(false);
    }
  };

  const handleEndCall = async () => {
    if (activeCall?.callSid) {
      const { endCall } = useStore.getState();
      await endCall(activeCall.callSid);
    }
    setShowCallScreen(false);
    setCallTimer(0);
    setCallStatus('جاري الاتصال...');
    setDialNumber('');
    refreshUser();
  };

  const handleDTMF = (digit: string) => {
    setDtmfDigits((prev) => prev + digit);
    // In production, send DTMF to Twilio
  };

  const renderKeypad = (onPress: (digit: string) => void, style?: object) => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['*', '0', '#'],
    ];
    const subLabels: { [key: string]: string } = {
      '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL',
      '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ', '0': '+'
    };

    return (
      <View style={[styles.keypadGrid, style]}>
        {keys.flat().map((key) => (
          <TouchableOpacity
            key={key}
            style={styles.keyBtn}
            onPress={() => onPress(key)}
            onLongPress={key === '0' ? handleLongPressZero : undefined}
          >
            <Text style={styles.keyText}>{key}</Text>
            {subLabels[key] && <Text style={styles.keySub}>{subLabels[key]}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCallScreen = () => (
    <Modal visible={showCallScreen} animationType="slide">
      <View style={styles.callScreen}>
        <SafeAreaView style={styles.callContent}>
          <View style={styles.callInfo}>
            <View style={styles.callerAvatar}>
              <Ionicons name="person" size={50} color="#fff" />
            </View>
            <Text style={styles.callerName}>
              {isAnonymous ? (aliasName || 'مجهول') : dialNumber}
            </Text>
            <Text style={styles.callerNumber}>
              {isAnonymous ? 'رقم مخفي' : dialNumber}
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
                  <Ionicons name="close" size={24} color="#fff" />
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
                style={styles.dtmfBackspace}
                onPress={() => setDtmfDigits((prev) => prev.slice(0, -1))}
              >
                <Ionicons name="backspace" size={24} color="#fff" />
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
                size={24}
                color={isMuted ? '#1565C0' : '#fff'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctrlBtn, showDTMF && styles.ctrlBtnActive]}
              onPress={() => setShowDTMF(!showDTMF)}
            >
              <Ionicons
                name="keypad"
                size={24}
                color={showDTMF ? '#1565C0' : '#fff'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctrlBtn, isSpeaker && styles.ctrlBtnActive]}
              onPress={() => setIsSpeaker(!isSpeaker)}
            >
              <Ionicons
                name={isSpeaker ? 'volume-high' : 'volume-medium'}
                size={24}
                color={isSpeaker ? '#1565C0' : '#fff'}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
            <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
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
          <Text style={styles.headerTitle}>أبو الزهراء</Text>
          <View style={styles.statusDot} />
        </View>
        <TouchableOpacity
          style={styles.balanceBtn}
          onPress={() => router.push('/topup')}
        >
          <Ionicons name="wallet" size={16} color="#fff" />
          <Text style={styles.balanceText}>${(user?.balance || 0).toFixed(2)}</Text>
        </TouchableOpacity>
      </View>

      {/* Dialer Display */}
      <View style={styles.displayArea}>
        <Text style={styles.dialNumber}>{dialNumber || ''}</Text>
        
        {isAnonymous && (
          <TextInput
            style={styles.aliasInput}
            placeholder="اكتب الاسم البديل هنا..."
            placeholderTextColor="#1565C0"
            value={aliasName}
            onChangeText={setAliasName}
            textAlign="center"
          />
        )}

        <View style={styles.toggleRow}>
          <View style={styles.toggleItem}>
            <Switch
              value={isRecording}
              onValueChange={setIsRecording}
              trackColor={{ false: '#ccc', true: '#1565C0' }}
              thumbColor="#fff"
            />
            <Text style={styles.toggleLabel}>تسجيل</Text>
          </View>
          <View style={styles.toggleItem}>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: '#ccc', true: '#1565C0' }}
              thumbColor="#fff"
            />
            <Text style={styles.toggleLabel}>إخفاء الرقم</Text>
          </View>
        </View>
      </View>

      {/* Keypad */}
      {renderKeypad(dialDigit)}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.addContactBtn}
          onPress={() => {
            if (dialNumber) {
              router.push({ pathname: '/add-contact', params: { phone: dialNumber } });
            }
          }}
        >
          <Ionicons name="person-add" size={22} color="#1565C0" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
          <Ionicons name="call" size={28} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deleteBtn} onPress={deleteDigit}>
          <Ionicons name="backspace" size={24} color="#F44336" />
        </TouchableOpacity>
      </View>

      {renderCallScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1565C0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  balanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  balanceText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },
  displayArea: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  dialNumber: {
    fontSize: 32,
    color: '#333',
    minHeight: 45,
    letterSpacing: 2,
  },
  aliasInput: {
    width: '80%',
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    padding: 10,
    marginTop: 10,
    color: '#1565C0',
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginTop: 15,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 13,
    color: '#666',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 10,
    gap: 15,
  },
  keyBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  keyText: {
    fontSize: 28,
    color: '#333',
  },
  keySub: {
    fontSize: 10,
    color: '#888',
    marginTop: -3,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 25,
    marginTop: 10,
    paddingBottom: 20,
  },
  addContactBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  callBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  deleteBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  // Call Screen Styles
  callScreen: {
    flex: 1,
    backgroundColor: '#0d47a1',
  },
  callContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  callInfo: {
    alignItems: 'center',
  },
  callerAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  callerName: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  callerNumber: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },
  callStatusText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 15,
  },
  callTimerText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '300',
    marginTop: 10,
  },
  callControls: {
    flexDirection: 'row',
    gap: 30,
  },
  ctrlBtn: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  ctrlBtnActive: {
    backgroundColor: '#fff',
  },
  endCallBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#d32f2f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  // DTMF Styles
  dtmfContainer: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 20,
  },
  dtmfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dtmfTitle: {
    color: '#fff',
    fontSize: 16,
  },
  dtmfDisplay: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    minHeight: 50,
  },
  dtmfDigits: {
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 3,
  },
  dtmfKeypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  dtmfKey: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dtmfKeyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  dtmfBackspace: {
    alignSelf: 'center',
    marginTop: 15,
    padding: 10,
  },
});
