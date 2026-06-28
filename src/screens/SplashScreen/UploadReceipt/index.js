import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera, Image as ImageIcon, X, Sparkles, Zap } from 'lucide-react-native';
import { ReceiptPreview } from '../../components/ReceiptPreview';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

export function UploadReceiptScreen({ navigation }) {
  const [stage, setStage] = useState('camera');

  if (stage === 'preview') {
    return (
      <ReceiptPreview
        onClose={() => setStage('camera')}
        onSave={() => {
          setStage('camera');
          navigation?.goBack();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.viewfinder}>
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

          <View style={styles.fauxContent}>
            <View style={styles.fauxLine1} />
            <View style={styles.fauxLine2} />
            <View style={styles.fauxItems}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={styles.fauxItem}>
                  <View style={styles.fauxItemLeft} />
                  <View style={styles.fauxItemRight} />
                </View>
              ))}
            </View>
          </View>

          {stage === 'scanning' && <View style={styles.scanLine} />}
        </View>
      </View>

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBtn}>
          <X size={16} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Receipt Scanner</Text>
        <View style={styles.aiBadge}>
          <Sparkles size={12} color={colors.gold} />
          <Text style={styles.aiText}>AI OCR</Text>
        </View>
      </View>

      <View style={styles.hint}>
        <Text style={styles.hintText}>
          {stage === 'scanning' ? 'Reading line items...' : 'Align receipt inside the frame'}
        </Text>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.controlBtn}>
          <View style={styles.controlIcon}>
            <ImageIcon size={20} color={colors.white} />
          </View>
          <Text style={styles.controlLabel}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setStage('scanning');
            setTimeout(() => setStage('preview'), 1800);
          }}
          style={styles.captureBtn}
        >
          <View style={styles.captureRing} />
          <View style={styles.captureInner}>
            <Camera size={32} color={colors.black} strokeWidth={2.2} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn}>
          <View style={styles.controlIcon}>
            <Zap size={20} color={colors.white} />
          </View>
          <Text style={styles.controlLabel}>Auto</Text>
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
  viewfinder: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  receiptFrame: {
    height: '60%',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(250,204,21,0.8)',
    overflow: 'hidden',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.gold,
    zIndex: 2,
  },
  fauxContent: {
    position: 'absolute',
    inset: 24,
    gap: 8,
  },
  fauxLine1: {
    height: 12,
    width: '75%',
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  fauxLine2: {
    height: 8,
    width: '50%',
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  fauxItems: {
    marginTop: 12,
    gap: 6,
  },
  fauxItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fauxItemLeft: {
    height: 8,
    width: '33%',
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  fauxItemRight: {
    height: 8,
    width: 48,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.gold,
    opacity: 0.8,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
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
  controlBtn: {
    alignItems: 'center',
    gap: 6,
  },
  controlIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
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
});
