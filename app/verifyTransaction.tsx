import OpenAI from "openai";
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

    const openai = new OpenAI({ apiKey: getEnvVars(__DEV__).openAiKey });

    useEffect(() => {
        (async () => {
            const { status } = await requestPermission();
            setHasPermission(status === 'granted');
        })();
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
                    const data = await response.json();

                    // 모든 inferText를 띄어쓰기로 구분해 합치기
                    const collection = data.images[0].fields
                        .map((element: any) => element.inferText)
                        .join(' ');

                    // 합친 문자열을 sendToAi 함수에 전달
                    sendTextToAi(collection);
                    // console.log(collection);

                    Alert.alert('성공', '텍스트 인식이 성공했습니다.');
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
    const sendTextToAi = async (collection: string) => {
        console.log(collection + ' 을 gpt에게 보내겠습니다.');
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "나는 영수증의 사진을 OCR로 텍스트화하고, 텍스트화된 결과물을 너에게 줄 거야. 너는 그 텍스트에서, 구매한 물건들의 이름만 알려주면 돼. 여러 개일 경우에는 , 으로 구분해서 줘." },
                {
                    role: "user",
                    content: collection,
                },
            ],
        });
        console.log(completion.choices[0].message.content);
    }

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
