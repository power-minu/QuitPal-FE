import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, Button, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface QuitPalTransaction {
    place: string;
    amount: number;
    purchaseDate: string;
    checked: boolean;
    expired: boolean;
}

export default function QuitPalTransactionScreen() {

    const router = useRouter();
    const [transactions, setTransactions] = useState<QuitPalTransaction[]>([]);
    useEffect(() => { getMyQuitPalTransactions(); }, []);

    const getMyQuitPalTransactions = async () => {
        const response = await fetch(
            'http://192.168.0.8:8080/transaction/my',
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

    return (
        <SafeAreaView
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 10
            }}
        >
            <ScrollView>
                {transactions.length > 0 ? (
                    transactions.map((transaction, index) => (
                        <View key={index} style={{ marginBottom: 20 }}>
                            <Text>
                                {transaction.place}, {transaction.amount}원, {transaction.purchaseDate}
                            </Text>
                            <Button
                                title="검증하기"
                                onPress={() => navigateToVerifyScreen(transaction)} // 검증 화면으로 이동
                            />
                        </View>
                    ))
                ) : (
                    <Text>검증할 결제 내역이 없습니다.</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );

}