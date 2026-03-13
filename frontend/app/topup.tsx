import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useStore } from '../store/useStore';

const PAYPAL_CLIENT_ID = 'AX77yPd3nZvqVsQtTKLAUXVLk9ieO71wvjDk2m3alQcG7ft_J6EOGlacBjrcOvAVghFiYWwPee2S3sfg';

const AMOUNTS = [
  { value: 0.99, label: '$0.99' },
  { value: 4.99, label: '$4.99' },
  { value: 9.99, label: '$9.99' },
  { value: 24.99, label: '$24.99' },
  { value: 49.99, label: '$49.99 + مكافأة $10', bonus: true },
];

const generatePayPalHTML = (amount: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
      padding: 20px;
      direction: rtl;
      background: #f8f9fa;
    }
    .amount-display {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      color: #003087;
      margin-bottom: 20px;
    }
    #paypal-button-container {
      min-height: 150px;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="amount-display">المبلغ: $${amount.toFixed(2)}</div>
  <div id="paypal-button-container">
    <div class="loading">جاري تحميل PayPal...</div>
  </div>
  
  <script src="https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD"></script>
  <script>
    paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'pay'
      },
      createOrder: function(data, actions) {
        return actions.order.create({
          purchase_units: [{
            amount: { value: '${amount.toFixed(2)}' }
          }]
        });
      },
      onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'success',
            amount: ${amount},
            orderId: data.orderID
          }));
        });
      },
      onCancel: function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'cancel' }));
      },
      onError: function(err) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.toString() }));
      }
    }).render('#paypal-button-container');
  </script>
</body>
</html>
`;

export default function TopupScreen() {
  const router = useRouter();
  const { updateBalance, user, balance } = useStore();
  const [selectedAmount, setSelectedAmount] = useState(0.99);
  const [isLoading, setIsLoading] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const handlePayPalMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'success') {
        setShowPayPal(false);
        setIsLoading(true);
        
        // Add balance
        const bonus = selectedAmount >= 49.99 ? 10 : 0;
        await updateBalance(selectedAmount + bonus);
        
        setIsLoading(false);
        Alert.alert(
          'تم الشحن بنجاح! ✓',
          `تم إضافة $${(selectedAmount + bonus).toFixed(2)} إلى رصيدك`,
          [{ text: 'حسناً', onPress: () => router.back() }]
        );
      } else if (data.type === 'cancel') {
        setShowPayPal(false);
        Alert.alert('إلغاء', 'تم إلغاء عملية الدفع');
      } else if (data.type === 'error') {
        setShowPayPal(false);
        Alert.alert('خطأ', 'حدث خطأ أثناء الدفع');
      }
    } catch (e) {
      console.error('PayPal message error:', e);
    }
  };

  const openPayPal = () => {
    setShowPayPal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'شحن الرصيد',
          headerStyle: { backgroundColor: '#0078D7' },
          headerTintColor: '#fff',
          headerBackTitle: 'رجوع',
        }}
      />

      <View style={styles.content}>
        <View style={styles.balanceCard}>
          <Ionicons name="wallet" size={40} color="#0078D7" />
          <Text style={styles.currentBalanceLabel}>رصيدك الحالي</Text>
          <Text style={styles.currentBalance}>${balance.toFixed(2)}</Text>
        </View>

        <Text style={styles.sectionTitle}>اختر القيمة المناسبة</Text>

        <View style={styles.amountsGrid}>
          {AMOUNTS.map((amount) => (
            <TouchableOpacity
              key={amount.value}
              style={[
                styles.amountBtn,
                selectedAmount === amount.value && styles.amountBtnSelected,
                amount.bonus && styles.amountBtnBonus,
              ]}
              onPress={() => setSelectedAmount(amount.value)}
            >
              <Text
                style={[
                  styles.amountText,
                  selectedAmount === amount.value && styles.amountTextSelected,
                ]}
              >
                {amount.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.payButton}
          onPress={openPayPal}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-paypal" size={24} color="#fff" />
              <Text style={styles.payButtonText}>الدفع عبر PayPal</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.noteText}>
          ملاحظة: سيتم إضافة الرصيد فوراً بعد إتمام الدفع
        </Text>
      </View>

      {/* PayPal WebView Modal */}
      <Modal
        visible={showPayPal}
        animationType="slide"
        onRequestClose={() => setShowPayPal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPayPal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>الدفع عبر PayPal</Text>
            <View style={{ width: 28 }} />
          </View>
          
          <WebView
            ref={webViewRef}
            source={{ html: generatePayPalHTML(selectedAmount) }}
            onMessage={handlePayPalMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color="#003087" />
                <Text style={styles.loadingText}>جاري تحميل PayPal...</Text>
              </View>
            )}
            style={styles.webview}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentBalanceLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  currentBalance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0078D7',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  amountBtn: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  amountBtnSelected: {
    borderColor: '#0078D7',
    backgroundColor: '#e3f2fd',
  },
  amountBtnBonus: {
    width: '100%',
    borderColor: '#FFC107',
    backgroundColor: '#FFF8E1',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  amountTextSelected: {
    color: '#0078D7',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#003087',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    gap: 10,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noteText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003087',
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
});
