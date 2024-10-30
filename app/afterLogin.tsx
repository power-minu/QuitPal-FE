import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, TextInput, StyleSheet, Button, TouchableOpacity, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import getEnvVars from '../environment';

export default function AfterLoginScreen() {
    const router = useRouter();

    const backEndAddress = getEnvVars(__DEV__).backEndAddress;
    const [myInfo, onChangeMyInfo] = React.useState('');

    const signout = async () => {
        await AsyncStorage.removeItem('QP_ACCESSTOKEN');
        await AsyncStorage.removeItem('QP_ACCESSTOKEN_EXPIRES');

        router.dismiss();
    }

    const getMyInfo = async () => {
        const response = await fetch(
            backEndAddress + '/user/me',
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + await AsyncStorage.getItem('QP_ACCESSTOKEN'),
                }
            }
        );
        const responseJson = await response.json();
        onChangeMyInfo(String(responseJson.email));
    }

    useEffect(() => {
        getMyInfo();
    }, [])

    // return (
    //     <SafeAreaView
    //         style={{
    //             flex: 1,
    //             justifyContent: "center",
    //             alignItems: "center",
    //             padding: 10
    //         }}
    //     >
    //         <Text>{myInfo}로 로그인되었습니다.</Text>
    //         <Button title="은행계좌 연결하기" onPress={() => router.push("/connectAccount")}></Button>
    //         <Button title="QuitPal에 등록된 거래내역들 보기" onPress={() => { router.push("/quitpaltxs") }}></Button>
    //         <Button title="Sign Out" onPress={signout}></Button>
    //     </SafeAreaView>
    // );

    return (
        <SafeAreaView
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
                backgroundColor: "#f0f4f8"
            }}
        >
            <Image
                source={require('../imgs/logo.png')}
                style={{
                    width: 100,
                    height: 100,
                    marginBottom: 30
                }}
            />
            <Text style={{ fontSize: 18, color: "#374151", marginBottom: 20 }}>
                {myInfo}로 로그인되었습니다.
            </Text>
            <TouchableOpacity
                style={{
                    width: "100%",
                    padding: 15,
                    backgroundColor: "#1e90ff",
                    borderRadius: 10,
                    alignItems: "center",
                    marginBottom: 10
                }}
                onPress={() => router.push("/connectAccount")}
            >
                <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "bold" }}>
                    은행계좌 연결하기
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    width: "100%",
                    padding: 15,
                    backgroundColor: "#4ade80",
                    borderRadius: 10,
                    alignItems: "center",
                    marginBottom: 10
                }}
                onPress={() => router.push("/quitpaltxs")}
            >
                <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "bold" }}>
                    QuitPal에 등록된 거래내역들 보기
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    width: "100%",
                    padding: 15,
                    backgroundColor: "#ef4444",
                    borderRadius: 10,
                    alignItems: "center"
                }}
                onPress={signout}
            >
                <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "bold" }}>
                    Sign Out
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );

}