import OpenAI from "openai";
import React, { useState, useEffect, useRef } from 'react';
import { View, Button, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraType, useCameraPermissions, CameraView } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import getEnvVars from '../environment';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function VerifyTransactionScreen() {
    const router = useRouter();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [photoBase64, setPhotoBase64] = useState<string | null>(null);
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const { transaction } = useLocalSearchParams();
    const parsedTransaction = transaction ? JSON.parse(transaction as string) : null;

    const cameraRef = useRef<CameraView | null>(null);

    const openai = new OpenAI({ apiKey: getEnvVars(__DEV__).openAiKey });
    const backEndAddress = getEnvVars(__DEV__).backEndAddress;

    useEffect(() => {
        (async () => {
            const { status } = await requestPermission();
            setHasPermission(status === 'granted');
        })();
    }, []);

    if (hasPermission === null) return <Text style={styles.message}>카메라 권한을 확인 중입니다...</Text>;
    if (hasPermission === false) return <Text style={styles.message}>카메라 사용 권한이 없습니다.</Text>;

    function toggleCameraFacing() {
        setFacing((current) => (current === 'back' ? 'front' : 'back'));
    }
    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ base64: true });
                if (!photo) {
                    console.error("사진 촬영에 실패했습니다.");
                    return;
                }

                const manipulatedImage = await manipulateAsync(
                    photo.uri,
                    [{ resize: { width: 1024 } }],
                    { compress: 0.5, format: SaveFormat.JPEG }
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
    const sendImageToOcr = async () => {
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
                { role: "system", content: "나는 영수증의 사진을 OCR로 텍스트화하고, 텍스트화된 결과물을 너에게 줄 거야. 너는 그 텍스트에서, 가장 먼저 구매한 점포명을 알려줘. 그 다음 , 으로 구분하고, 구매한 물건들의 이름을 알려줘. 여러 개일 경우에는 , 으로 구분해서 줘. 그 다음엔 총합 결제금액을 줘. 그 다음엔 결제한 날짜를 줘(년-월-일). 그냥 {점포명}, {물건1}, {물건2}, ..., {금액}, {날짜} 이런 식으로 줘. 그리고 금액에서 쉼표는 빼. 예를 들어 13820이면 13820이라고만 하고, 13,820 이렇게 하지 마. 참고로, 영수증에 가게나 업체 슬로건 같은 게 있을 수도 있어. 그거랑 점포명이랑 헷갈릴 수도 있거든? 잘 걸러서 점포명을 줘." },
                {
                    role: "user",
                    content: collection,
                },
            ],
        });
        const reply = completion.choices[0].message.content;
        console.log('ocr 텍스트를 gpt로 해석한 결과: ' + reply);
        if (reply) verifyPlaceAndItems(reply);
    }
    const verifyPlaceAndItems = async (reply: string) => {
        const replyList: string[] = reply.split(',').map(item => item.trim());
        const receiptPlace: string = replyList[0];
        const items: string[] = replyList.slice(1, replyList.length - 2);
        const amount: number = parseInt(replyList[replyList.length - 2], 10);
        const date: string = replyList[replyList.length - 1];
        const txPlace = parsedTransaction.place;

        const gptSendContent: string = receiptPlace + ', ' + txPlace;
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "나는 영수증 사진을 ocr로 텍스트화해서, 거기서 점포명을 추출했어. 그리고 내 DB에 많은 가게들의 점포명들을 가지고 있지. 이제 영수증 사진에서 뽑은 점포명과, DB에서 가져온 점포명을 너에게 쉼표로 구분해서 줄 거야. 같은 가게더라도 영수증에 표기된 점포명과 DB의 점포명은 조금 다를 수 있거든? 그러니까 너가 이 두 점포명이 같은 가게를 가리키는지 판단해서 동일하다면 Y, 틀리다면 N을 대답해줘." },
                {
                    role: "user",
                    content: gptSendContent,
                },
            ],
        });
        const placeMatch = completion.choices[0].message.content;
        console.log('영수증에 나온 장소가 구매한 장소가 맞는지 gpt에게 물어본 결과: ' + placeMatch);
        if (placeMatch == 'Y') {
            const transactionId = Number(parsedTransaction.id);
            const response = await fetch(backEndAddress + '/search/cigarette', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + await AsyncStorage.getItem('QP_ACCESSTOKEN'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transactionId, items }),
            });

            if (response.status === 200) {
                Alert.alert(
                    '결과',
                    '검증에 성공했습니다.',
                    [
                        {
                            text: '확인',
                            onPress: () => router.back()
                        }
                    ]
                );
            } else if (response.status === 202) {
                alert('담배가 있습니다...');
            } else {
                alert('오류입니다!!');
                console.error('Unexpected response:', response.status, response.statusText);
            }
        }
        else {
            console.log('gpt의 대답: ' + placeMatch);
            alert('영수증의 장소 정보가 일치하지 않습니다.');
        }
    }

    return (
        <View style={styles.container}>
            {parsedTransaction && (
                <View style={styles.transactionContainer}>
                    <Text style={styles.transactionText}>거래처: {parsedTransaction.place}</Text>
                    <Text style={styles.transactionText}>금액: {parsedTransaction.amount} 원</Text>
                    <Text style={styles.transactionText}>구매일: {parsedTransaction.purchaseDate}</Text>
                </View>
            )}

            {photoBase64 ? (
                <View style={styles.previewContainer}>
                    <Image
                        source={{ uri: `data:image/jpg;base64,${photoBase64}` }}
                        style={styles.previewImage}
                        resizeMode="contain"
                    />
                    <TouchableOpacity style={styles.button} onPress={() => setPhotoBase64(null)}>
                        <Text style={styles.buttonText}>다시 찍기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, { backgroundColor: '#1e90ff' }]} onPress={sendImageToOcr}>
                        <Text style={styles.buttonText}>이미지 전송</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.circleButton} onPress={toggleCameraFacing}>
                            <Text style={styles.text}>↔</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.captureButton} onPress={takePicture} />
                    </View>
                </CameraView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    message: {
        textAlign: 'center',
        marginVertical: 20,
        fontSize: 18,
        color: "#333",
    },
    transactionContainer: {
        padding: 15,
        backgroundColor: "#fff",
        margin: 20,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    transactionText: {
        fontSize: 16,
        color: "#333",
        marginBottom: 5,
    },
    previewContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    previewImage: {
        width: '100%',
        height: '60%',
        borderRadius: 10,
        marginBottom: 20,
    },
    camera: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: "#ff6347",
        borderRadius: 8,
        marginHorizontal: 5,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    circleButton: {
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        padding: 15,
        borderRadius: 50,
        marginHorizontal: 15,
    },
    captureButton: {
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: 50,
        width: 70,
        height: 70,
        alignSelf: 'center',
        marginVertical: 10,
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: "#333",
    },
});
