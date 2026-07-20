import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X, Sparkles, Zap, RotateCcw } from 'lucide-react-native';
import { ReceiptPreview } from '../../components/ReceiptPreview';
import { uploadService } from '../../services/uploadService';
import { expenseService } from '../../services/expenseService';
import { useExpenses } from '../../context/ExpenseContext';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * UploadReceiptScreen
 *
 * 3-stage flow:
 *  1. 'camera'   — live viewfinder / gallery picker
 *  2. 'scanning' — spinner while OCR + Cloudinary run on the backend
 *  3. 'preview'  — ReceiptPreview shows extracted data; user can Save or Retake
 *
 * On Save:
 *  - Calls expenseService.create() to persist the expense in the DB
 *  - Calls addExpense() on ExpenseContext so Dashboard/ExpenseList update instantly
 *  - Navigates back
 */
export function UploadReceiptScreen({ navigation }) {
  const [stage, setStage] = useState('camera'); // 'camera' | 'scanning' | 'preview' | 'saving'
  const [receiptData, setReceiptData] = useState(null);
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const insets = useSafeAreaInsets();

  const { addExpense } = useExpenses();

  // ─── Gallery picker ───────────────────────────────────────────────────────
  const handleGalleryPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow access to your photo library to pick a receipt.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      await sendToBackend(asset.uri, asset.fileName || 'receipt.jpg', asset.mimeType || 'image/jpeg');
    }
  };

  // ─── Camera capture ───────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }

    if (!cameraRef.current) return;

    try {
      setStage('scanning');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        skipProcessing: false,
      });
      await sendToBackend(photo.uri, 'receipt.jpg', 'image/jpeg');
    } catch (err) {
      setStage('camera');
      Alert.alert('Camera Error', 'Could not take photo. Please try again.');
    }
  };

  // ─── Upload to backend (OCR) ───────────────────────────────────────────────
  const sendToBackend = async (uri, fileName, fileType) => {
    setStage('scanning');
    try {
      const response = await uploadService.uploadReceipt(uri, fileName, fileType);
      setReceiptData(response.data);
      setStage('preview');
    } catch (err) {
      setStage('camera');
      Alert.alert(
        'Upload Failed',
        err.message || 'Could not process the receipt. Please try again.',
      );
    }
  };

  // ─── Save expense to DB after OCR ─────────────────────────────────────────
  const handleSaveExpense = async () => {
    if (!receiptData) {
      // No OCR data — just go back
      navigation?.goBack();
      return;
    }

    setStage('saving');

    const rawCategory = receiptData.category?.toLowerCase() || 'other';
    const payload = {
      merchant: receiptData.merchant_name || 'Unknown Merchant',
      amount: Number(receiptData.amount) || 0,
      // Backend expects Title Case: Food, Transport, Shopping, Bills, Entertainment, Other
      category: rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1),
      date: receiptData.date || new Date().toISOString().split('T')[0],
      method: 'Receipt',
      notes: receiptData.image_url ? `Receipt: ${receiptData.image_url}` : '',
    };

    try {
      const response = await expenseService.create(payload);
      // Optimistically add to context so all screens update without re-fetching
      const created = response?.data ?? { id: Date.now().toString(), ...payload };
      addExpense(created);

      Alert.alert(
        'Expense Saved ✓',
        `"${payload.merchant}" for $${payload.amount.toFixed(2)} has been added.`,
        [{ text: 'OK', onPress: () => navigation?.goBack() }],
      );
    } catch (err) {
      setStage('preview');
      Alert.alert(
        'Save Failed',
        err.message || 'Could not save the expense. Please try again.',
      );
    }
  };

  // ─── Toggle front/back camera ─────────────────────────────────────────────
  const toggleFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  // ─── Preview stage ────────────────────────────────────────────────────────
  if (stage === 'preview' || stage === 'saving') {
    return (
      <ReceiptPreview
        data={receiptData}
        saving={stage === 'saving'}
        onClose={() => {
          setReceiptData(null);
          setStage('camera');
        }}
        onSave={handleSaveExpense}
      />
    );
  }

  // ─── Scanning overlay ─────────────────────────────────────────────────────
  if (stage === 'scanning') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingTitle}>Processing Receipt…</Text>
        <Text style={styles.loadingSubtitle}>
          OCR is reading your receipt. This may take a moment.
        </Text>
      </View>
    );
  }

  // ─── Camera permission not yet granted ────────────────────────────────────
  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Camera size={48} color={colors.gold} />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          Grant camera access to capture receipts, or use the Gallery button to pick an existing
          photo.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryFallbackBtn} onPress={handleGalleryPick}>
          <ImageIcon size={16} color={colors.gold} />
          <Text style={styles.galleryFallbackText}>Use Gallery Instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Live camera viewfinder ───────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

      {/* Overlay frame */}
      <View style={styles.overlay}>
        <View style={styles.receiptFrame}>
          {['tl', 'tr', 'bl', 'br'].map((c) => (
            <View
              key={c}
              style={[
                styles.corner,
                c === 'tl' && { top: 0, left: 0, borderLeftWidth: 4, borderTopWidth: 4, borderTopLeftRadius: 16 },
                c === 'tr' && { top: 0, right: 0, borderRightWidth: 4, borderTopWidth: 4, borderTopRightRadius: 16 },
                c === 'bl' && { bottom: 0, left: 0, borderLeftWidth: 4, borderBottomWidth: 4, borderBottomLeftRadius: 16 },
                c === 'br' && { bottom: 0, right: 0, borderRightWidth: 4, borderBottomWidth: 4, borderBottomRightRadius: 16 },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 24) + 8 }]}>
        <TouchableOpacity style={styles.topBtn} onPress={() => navigation?.goBack()}>
          <X size={16} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Receipt Scanner</Text>
        <View style={styles.aiBadge}>
          <Sparkles size={12} color={colors.gold} />
          <Text style={styles.aiText}>AI OCR</Text>
        </View>
      </View>

      {/* Hint */}
      <View style={styles.hint}>
        <Text style={styles.hintText}>Align receipt inside the frame</Text>
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { bottom: 40 + Math.max(insets.bottom, 16) }]}>
        {/* Gallery */}
        <TouchableOpacity style={styles.controlBtn} onPress={handleGalleryPick}>
          <View style={styles.controlIcon}>
            <ImageIcon size={20} color={colors.white} />
          </View>
          <Text style={styles.controlLabel}>Gallery</Text>
        </TouchableOpacity>

        {/* Capture */}
        <TouchableOpacity onPress={handleCapture} style={styles.captureBtn}>
          <View style={styles.captureRing} />
          <View style={styles.captureInner}>
            <Camera size={32} color={colors.black} strokeWidth={2.2} />
          </View>
        </TouchableOpacity>

        {/* Flip camera */}
        <TouchableOpacity style={styles.controlBtn} onPress={toggleFacing}>
          <View style={styles.controlIcon}>
            <RotateCcw size={20} color={colors.white} />
          </View>
          <Text style={styles.controlLabel}>Flip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  receiptFrame: {
    height: '60%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.4)',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.gold,
    zIndex: 2,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    zIndex: 10,
  },
  topBtn: {
    padding: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  topTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(250,204,21,0.2)',
  },
  aiText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold,
  },
  hint: {
    position: 'absolute',
    top: 56,
    left: '50%',
    transform: [{ translateX: -80 }],
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    zIndex: 10,
  },
  hintText: {
    fontSize: 11,
    color: colors.white,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 112,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  controlBtn: { alignItems: 'center', gap: 6 },
  controlIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  captureBtn: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(250,204,21,0.6)',
    opacity: 0.5,
  },
  captureInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // ─── Loading / scanning state ──────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginTop: 8,
  },
  loadingSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },

  // ─── Permission state ──────────────────────────────────────────────────
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginTop: 8,
  },
  permissionText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionBtn: {
    marginTop: 8,
    backgroundColor: colors.gold,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: borderRadius.full,
  },
  permissionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
  },
  galleryFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  galleryFallbackText: {
    fontSize: 13,
    color: colors.gold,
  },
});
