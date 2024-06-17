import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, TextInput, StyleSheet, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AfterLoginScreen() {
    const router = useRouter();

    const [myInfo, onChangeMyInfo] = React.useState('');

    const signout = async () => {
        await AsyncStorage.removeItem('QP_ACCESSTOKEN');
        await AsyncStorage.removeItem('QP_ACCESSTOKEN_EXPIRES');

        router.dismiss();
    }

    const getMyInfo = async () => {
        const response = await fetch(
            'http://172.30.1.38:8080/user/me',
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + await AsyncStorage.getItem('QP_ACCESSTOKEN'),
                }
            }
        )
        const responseJson = await response.json();
        onChangeMyInfo(String(responseJson.email));
    }

    useEffect(() => {
        getMyInfo();
    }, [])

    return (
        <SafeAreaView
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 10
            }}
        >
            <Text>{myInfo}로 로그인되었습니다.</Text>
            <Button title="은행계좌 연결하기" onPress={() => router.push("/connectAccount")}></Button>
            <Button title="(계좌)의심 거래내역 보기"></Button>
            <Button title="Sign Out" onPress={signout}></Button>
        </SafeAreaView>
    );
}