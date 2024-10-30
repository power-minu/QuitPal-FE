import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, Button, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import getEnvVars from '../environment';

interface QuitPalTransaction {
    id: number;
    place: string;
    amount: number;
    purchaseDate: string;
    checked: boolean;
    expired: boolean;
}

export default function QuitPalTransactionScreen() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<QuitPalTransaction[]>([]);
    const [triggerEffect, setTriggerEffect] = useState(false);
    const backEndAddress = getEnvVars(__DEV__).backEndAddress;

    useFocusEffect(
        useCallback(() => {
          setTriggerEffect(prev => !prev); // 상태를 반전시켜 useEffect 트리거
        }, [])
      );
    useEffect(() => { getMyQuitPalTransactions(); }, [triggerEffect]);

    const getMyQuitPalTransactions = async () => {
        const response = await fetch(
            backEndAddress + '/transaction/my',
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + await AsyncStorage.getItem('QP_ACCESSTOKEN'),
                    'Content-Type': 'application/json'
                }
            }
        );
        if (response.status === 200) {
            const transactionList: QuitPalTransaction[] = await response.json();
            const filteredTransactions = transactionList.filter(
                (transaction: QuitPalTransaction) => !transaction.checked && !transaction.expired
            );
            setTransactions(filteredTransactions);
            // transactionList.forEach((transaction: QuitPalTransaction) => {
            //     onChangeSusHistory(
            //         prevHistory => prevHistory
            //         + transaction.place + ', '
            //         + transaction.amount + '원, '
            //         + transaction.purchaseDate + '\n'
            //         + 'checked: ' + transaction.checked + ', '
            //         + 'expired: ' + transaction.expired
            //         + '\n\n'
            //     );
            // });
        } else {
            return 0;
        }
    }
    const navigateToVerifyScreen = (transaction: QuitPalTransaction) => {
        router.push({
            pathname: '/verifyTransaction',
            params: { transaction: JSON.stringify(transaction) }
        });
    };

    // return (
    //     <SafeAreaView
    //         style={{
    //             flex: 1,
    //             justifyContent: "center",
    //             alignItems: "center",
    //             padding: 10
    //         }}
    //     >
    //         <ScrollView>
    //             {transactions.length > 0 ? (
    //                 transactions.map((transaction, index) => (
    //                     <View key={index} style={{ marginBottom: 20 }}>
    //                         <Text>
    //                             {transaction.place}, {transaction.amount}원, {transaction.purchaseDate}
    //                         </Text>
    //                         <Button
    //                             title="검증하기"
    //                             onPress={() => navigateToVerifyScreen(transaction)} // 검증 화면으로 이동
    //                         />
    //                     </View>
    //                 ))
    //             ) : (
    //                 <Text>검증할 결제 내역이 없습니다.</Text>
    //             )}
    //         </ScrollView>
    //     </SafeAreaView>
    // );


    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: "#f5f5f5", // 배경 색상 추가
                padding: 20,
            }}
        >
            <ScrollView contentContainerStyle={{ alignItems: "center" }}>
                {transactions.length > 0 ? (
                    transactions.map((transaction, index) => (
                        <View
                            key={index}
                            style={{
                                width: "90%",
                                backgroundColor: "#fff",
                                borderRadius: 10,
                                padding: 15,
                                marginVertical: 10,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 5, // 안드로이드 그림자 효과
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}>
                                {transaction.place}
                            </Text>
                            <Text style={{ fontSize: 14, color: "#555", marginBottom: 10 }}>
                                {transaction.amount}원
                            </Text>
                            <Text style={{ fontSize: 12, color: "#888", marginBottom: 15 }}>
                                {transaction.purchaseDate}
                            </Text>
                            <Button
                                title="검증하기"
                                color="#1e90ff"
                                onPress={() => navigateToVerifyScreen(transaction)}
                            />
                        </View>
                    ))
                ) : (
                    <Text style={{ fontSize: 16, color: "#333" }}>검증할 결제 내역이 없습니다.</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );

}