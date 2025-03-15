import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    Button,
    Linking,
    SafeAreaView,
    ActivityIndicator,
    Platform,
    Image,
} from "react-native";
import { Camera } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";

// We'll use a different approach for web QR scanning

export default function App() {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [scannedData, setScannedData] = useState("");
    const [image, setImage] = useState(null);
    const isWeb = Platform.OS === "web";

    useEffect(() => {
        if (!isWeb) {
            (async () => {
                const { status } = await Camera.requestCameraPermissionsAsync();
                setHasPermission(status === "granted");
            })();
        }
    }, [isWeb]);

    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        setScannedData(data);
        console.log(
            `Bar code with type ${type} and data ${data} has been scanned!`
        );
    };

    const handleOpenLink = () => {
        if (scannedData && Linking.canOpenURL(scannedData)) {
            Linking.openURL(scannedData);
        }
    };

    const takePhoto = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status === "granted") {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            // Check if the user canceled the image picker
            if (!result.canceled) {
                // Set the image state with the selected image URI
                setImage(result.assets[0].uri);
                // TODO: Add QR code detection from image
                // For now, we'll just show a message
                setScanned(true);
                setScannedData("QR code detection from images coming soon!");
            }
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        // Check if the user canceled the image picker
        if (!result.canceled) {
            // Set the image state with the selected image URI
            setImage(result.assets[0].uri);
            // TODO: Add QR code detection from image
            // For now, we'll just show a message
            setScanned(true);
            setScannedData("QR code detection from images coming soon!");
        }
    };

    // Web platform UI
    if (isWeb) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />
                <Text style={styles.title}>QR Code Scanner</Text>

                <View style={styles.webMessage}>
                    <Text style={styles.permissionText}>
                        For the best experience, please use this app on a mobile
                        device.
                    </Text>
                </View>

                <View style={styles.webImageContainer}>
                    {image ? (
                        <Image
                            source={{ uri: image }}
                            style={styles.webPreviewImage}
                        />
                    ) : (
                        <View style={styles.webPlaceholder}>
                            <Text style={styles.webPlaceholderText}>
                                No image selected
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.buttonContainer}>
                    <Button title="Upload Image" onPress={pickImage} />
                </View>

                {scanned && (
                    <View style={styles.resultContainer}>
                        <Text style={styles.resultText}>Scanned Data:</Text>
                        <Text style={styles.resultData}>{scannedData}</Text>
                        {scannedData.startsWith("http") && (
                            <Button
                                title="Open Link"
                                onPress={handleOpenLink}
                            />
                        )}
                        <Button
                            title="Scan Again"
                            onPress={() => {
                                setScanned(false);
                                setImage(null);
                            }}
                        />
                    </View>
                )}
            </SafeAreaView>
        );
    }

    // Mobile platform permission handling
    if (hasPermission === null) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.permissionText}>
                    Requesting camera permission...
                </Text>
            </SafeAreaView>
        );
    }

    if (hasPermission === false) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.permissionText}>No access to camera</Text>
                <Button
                    title="Request Permission Again"
                    onPress={async () => {
                        const { status } =
                            await Camera.requestCameraPermissionsAsync();
                        setHasPermission(status === "granted");
                    }}
                />
            </SafeAreaView>
        );
    }

    // Mobile platform UI
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <Text style={styles.title}>QR Code Scanner</Text>

            <View style={styles.scannerContainer}>
                {!scanned && (
                    <>
                        <Camera
                            style={styles.scanner}
                            onBarCodeScanned={handleBarCodeScanned}
                        />
                        <View style={styles.scanOverlay}>
                            <View style={styles.scanFrame} />
                        </View>
                    </>
                )}
            </View>

            <View style={styles.buttonContainer}>
                <Button title="Take Photo" onPress={takePhoto} />
                <View style={{ width: 20 }} />
                <Button title="Pick from Gallery" onPress={pickImage} />
            </View>

            {scanned && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultText}>Scanned Data:</Text>
                    <Text style={styles.resultData}>{scannedData}</Text>
                    {scannedData.startsWith("http") && (
                        <Button title="Open Link" onPress={handleOpenLink} />
                    )}
                    <Button
                        title="Scan Again"
                        onPress={() => setScanned(false)}
                    />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#121212",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 20,
    },
    scannerContainer: {
        width: "100%",
        aspectRatio: 1,
        overflow: "hidden",
        borderRadius: 10,
        marginBottom: 20,
    },
    scanner: {
        width: "100%",
        height: "100%",
    },
    resultContainer: {
        width: "100%",
        backgroundColor: "#2a2a2a",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
    },
    resultText: {
        fontSize: 16,
        color: "#fff",
        marginBottom: 5,
    },
    resultData: {
        fontSize: 14,
        color: "#4caf50",
        marginBottom: 15,
        textAlign: "center",
    },
    permissionText: {
        fontSize: 18,
        color: "#fff",
        marginBottom: 20,
        textAlign: "center",
    },
    scanOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
    },
    scanFrame: {
        width: 200,
        height: 200,
        borderWidth: 2,
        borderColor: "#4caf50",
        borderRadius: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.7)",
    },
    loadingText: {
        color: "#fff",
        marginTop: 10,
        fontSize: 16,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 20,
    },
});
