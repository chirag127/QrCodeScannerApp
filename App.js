import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert
} from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { isWeb } from './utils';

// App.js
export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setScanned(false);
      setScannedData(null);
      return () => {};
    }, [])
  );

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setScannedData({ type, data });

    // Provide haptic feedback on successful scan
    if (!isWeb()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      setIsLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync();
        // Process the image for QR code
        await processImageForQRCode(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const pickImage = async () => {
    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processImageForQRCode(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processImageForQRCode = async (imageUri) => {
    try {
      const scanResults = await BarCodeScanner.scanFromURLAsync(imageUri);
      if (scanResults.length > 0) {
        const { type, data } = scanResults[0];
        setScanned(true);
        setScannedData({ type, data });
        if (!isWeb()) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        Alert.alert('No QR Code Found', 'The selected image doesn\'t contain a valid QR code.');
      }
    } catch (error) {
      console.error('Error scanning image:', error);
      Alert.alert('Scanning Error', 'Failed to scan the selected image.');
    }
  };

  const openURL = async (url) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Cannot open this URL: ' + url);
    }
  };

  const isValidURL = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const scanAgain = () => {
    setScanned(false);
    setScannedData(null);
  };

  const toggleCameraType = () => {
    setType(
      type === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  const toggleFlash = () => {
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.torch
        : Camera.Constants.FlashMode.off
    );
  };

  // Render loader
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00b894" />
        <Text style={styles.loadingText}>Processing...</Text>
      </View>
    );
  }

  // Render permission request
  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00b894" />
        <Text style={styles.loadingText}>Requesting camera permissions...</Text>
      </View>
    );
  }

  // Render permission denied
  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="no-photography" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>Camera permission not granted</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render results view
  if (scanned && scannedData) {
    return (
      <SafeAreaView style={styles.resultContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2d3436" />
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>Scan Result</Text>
        </View>

        <View style={styles.resultContent}>
          <View style={styles.resultTypeContainer}>
            <Text style={styles.resultTypeLabel}>Type:</Text>
            <Text style={styles.resultTypeValue}>{scannedData.type}</Text>
          </View>

          <View style={styles.resultDataContainer}>
            <Text style={styles.resultDataLabel}>Data:</Text>
            <Text style={styles.resultDataValue} selectable>{scannedData.data}</Text>
          </View>

          {isValidURL(scannedData.data) && (
            <TouchableOpacity
              style={styles.openUrlButton}
              onPress={() => openURL(scannedData.data)}
            >
              <MaterialIcons name="open-in-browser" size={24} color="white" />
              <Text style={styles.openUrlButtonText}>Open URL</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.scanAgainButton} onPress={scanAgain}>
          <MaterialIcons name="qr-code-scanner" size={24} color="white" />
          <Text style={styles.scanAgainButtonText}>Scan Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Render scanner view
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2d3436" />
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={type}
        flashMode={flashMode}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        onCameraReady={handleCameraReady}
        ratio="16:9"
      >
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.focusedContainer}>
              {/* QR Frame corners */}
              <View style={[styles.topLeftCorner, styles.corner]} />
              <View style={[styles.topRightCorner, styles.corner]} />
              <View style={[styles.bottomLeftCorner, styles.corner]} />
              <View style={[styles.bottomRightCorner, styles.corner]} />
            </View>
            <View style={styles.unfocusedContainer}></View>
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.headerControls}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraType}>
              <Ionicons name="camera-reverse" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
              <Ionicons
                name={flashMode === Camera.Constants.FlashMode.off ? "flash-off" : "flash"}
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <MaterialIcons name="photo-library" size={30} color="white" />
              <Text style={styles.buttonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.helpButton} onPress={() => Alert.alert(
              'QR Scanner Help',
              'Position a QR code within the green frame to scan. You can also take a photo or select an image from your gallery.'
            )}>
              <MaterialIcons name="help" size={30} color="white" />
              <Text style={styles.buttonText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Camera>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const qrSize = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2d3436',
  },
  camera: {
    flex: 1,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 10,
  },
  errorText: {
    color: 'white',
    fontSize: 20,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: '#00b894',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Camera overlay styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  middleContainer: {
    flexDirection: 'row',
    flex: 2,
  },
  focusedContainer: {
    flex: 6,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    borderColor: '#00b894',
    width: 20,
    height: 20,
  },
  topLeftCorner: {
    top: 0,
    left: 0,
    borderLeftWidth: 4,
    borderTopWidth: 4,
  },
  topRightCorner: {
    top: 0,
    right: 0,
    borderRightWidth: 4,
    borderTopWidth: 4,
  },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
  },
  bottomRightCorner: {
    bottom: 0,
    right: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },

  // Controls styles
  controlsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Constants.statusBarHeight,
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 50,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  galleryButton: {
    alignItems: 'center',
  },
  helpButton: {
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'white',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },

  // Result view styles
  resultContainer: {
    flex: 1,
    backgroundColor: '#2d3436',
  },
  resultHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#636e72',
  },
  resultTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: Constants.statusBarHeight,
  },
  resultContent: {
    flex: 1,
    padding: 20,
  },
  resultTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  resultTypeLabel: {
    color: '#b2bec3',
    fontSize: 16,
    marginRight: 10,
    fontWeight: 'bold',
  },
  resultTypeValue: {
    color: 'white',
    fontSize: 16,
  },
  resultDataContainer: {
    marginBottom: 30,
  },
  resultDataLabel: {
    color: '#b2bec3',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  resultDataValue: {
    color: 'white',
    fontSize: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 15,
    borderRadius: 8,
    marginTop: 5,
    overflow: 'hidden',
  },
  openUrlButton: {
    backgroundColor: '#00b894',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  openUrlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  scanAgainButton: {
    backgroundColor: '#0984e3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    margin: 20,
  },
  scanAgainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});