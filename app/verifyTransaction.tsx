import React, { useState, useEffect, useRef } from 'react';
import { View, Button, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import getEnvVars from '../environment';

export default function VerifyTransactionScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [photoBase64, setPhotoBase64] = useState<string | null>(null);
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const { transaction } = useLocalSearchParams(); // 쿼리로 전달된 transaction 데이터 받기
    const parsedTransaction = transaction ? JSON.parse(transaction as string) : null; // JSON으로 파싱

    const cameraRef = useRef<CameraView | null>(null);

    useEffect(() => {
        (async () => {
            const { status } = await requestPermission();
            setHasPermission(status === 'granted');
        })();
        console.log(getEnvVars(__DEV__).ocrUrl);
    }, []);

    if (hasPermission === null) {
        return <Text>카메라 권한을 확인 중입니다...</Text>;
    }
    if (hasPermission === false) {
        return <Text>카메라 사용 권한이 없습니다.</Text>;
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ base64: true }); // base64 인코딩

                if (!photo) {
                    console.error("사진 촬영에 실패했습니다.");
                    return;
                }

                const manipulatedImage = await manipulateAsync(
                    photo.uri, // 촬영한 사진의 URI
                    [{ resize: { width: 1024 } }], // 원하는 크기로 조정 (가로 1024px)
                    { compress: 0.5, format: SaveFormat.JPEG } // JPEG 포맷으로 압축
                );

                const complete = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                setPhotoBase64(complete);
            } catch (error) {
                console.error("사진 촬영 중 오류 발생:", error);
            }
        } else {
            console.error("카메라 참조가 유효하지 않습니다.");
        }
    };
    const sendImageToServer = async () => {
        if (photoBase64) {
            try {
                const requestBody = {
                    images: [
                        {
                            format: "jpeg",
                            name: "medium",
                            data: photoBase64,
                            url: null
                        }
                    ],
                    lang: "ko",
                    requestId: "string",   // 필요한 대로 값 설정
                    resultType: "string",  // 필요한 대로 값 설정
                    timestamp: Date.now(), // 현재 시간의 타임스탬프
                    version: "V1"
                };
                const response = await fetch(getEnvVars(__DEV__).ocrUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-OCR-SECRET': getEnvVars(__DEV__).ocrKey
                    },
                    body: JSON.stringify(requestBody),
                })

                if (response.ok) {
                    response.json().then(data => {
                        data.images[0].fields.forEach((element: any) => {
                            console.log(element.inferText);
                        })
                    });

                    Alert.alert('성공', '이미지가 성공적으로 전송되었습니다.');
                    setPhotoBase64(null);
                } else {
                    Alert.alert('오류', '이미지 전송에 실패했습니다. ' + response.status);
                    console.log(response.body);
                    setPhotoBase64(null);
                }
            } catch (error) {
                Alert.alert('오류', '서버와의 연결에 문제가 발생했습니다.');
                setPhotoBase64(null);
            }
        }
    };


    return (
        <View style={{ flex: 1, padding: 20 }}>
            {parsedTransaction && (
                <View style={{ marginBottom: 20 }}>
                    <Text>거래처: {parsedTransaction.place}</Text>
                    <Text>금액: {parsedTransaction.amount} 원</Text>
                    <Text>구매일: {parsedTransaction.purchaseDate}</Text>
                </View>
            )}

            {photoBase64 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                        source={{ uri: `data:image/jpg;base64,${photoBase64}` }}
                        style={{ width: 300, height: 400 }}
                    />
                    <Button title="다시 찍기" onPress={() => setPhotoBase64(null)} />
                    <Button title="이미지 전송" onPress={sendImageToServer} />
                </View>
            ) : (
                <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                            <Text style={styles.text}>Flip Camera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={takePicture}>
                            <Text style={styles.text}>촬영</Text>
                        </TouchableOpacity>
                    </View>
                </CameraView>
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        margin: 64,
    },
    button: {
        flex: 1,
        alignSelf: 'flex-end',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
});
