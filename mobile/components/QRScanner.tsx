import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Zap } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ visible, onScan, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible && !permission?.granted) requestPermission();
    if (visible) setScanned(false);
  }, [visible]);

  const handleScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    // Extract phone number from QR (format: "pocket://pay/01XXXXXXXXX" or just "01XXXXXXXXX")
    const phone = data.replace('pocket://pay/', '').replace(/[^0-9]/g, '').slice(0, 11);
    onScan(phone);
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={s.root}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <X size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.title}>Scan QR Code</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Camera */}
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleScan}
          />
        ) : (
          <View style={s.noPermission}>
            <Text style={s.noPermText}>Camera permission required</Text>
            <TouchableOpacity onPress={requestPermission} style={s.permBtn}>
              <Text style={s.permBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Overlay frame */}
        <View style={s.overlay}>
          <View style={s.frameRow}>
            <View style={s.frameSide} />
            <View style={s.frame}>
              <View style={[s.corner, s.tl]} />
              <View style={[s.corner, s.tr]} />
              <View style={[s.corner, s.bl]} />
              <View style={[s.corner, s.br]} />
              {scanned && (
                <View style={s.scannedBadge}>
                  <Zap size={20} color="#fff" fill="#fff" />
                  <Text style={s.scannedText}>Detected!</Text>
                </View>
              )}
            </View>
            <View style={s.frameSide} />
          </View>
          <Text style={s.hint}>Point camera at a Pocket QR code</Text>
        </View>
      </View>
    </Modal>
  );
}

const FRAME = 240;
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 24 },
  frameRow: { flexDirection: 'row', alignItems: 'center' },
  frameSide: { flex: 1, height: FRAME, backgroundColor: 'rgba(0,0,0,0.55)' },
  frame: { width: FRAME, height: FRAME, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: '#22C55E', borderWidth: 3 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  scannedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#16A34A', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  scannedText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center' },
  noPermission: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  noPermText: { color: '#fff', fontSize: 16 },
  permBtn: { backgroundColor: '#166534', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permBtnText: { color: '#fff', fontWeight: '700' },
});
