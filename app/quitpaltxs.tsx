import { useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, Button, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
    const segments = useSegments();
    const router = useRouter();
    const [transactions, setTransactions] = useState<QuitPalTransaction[]>([]);
    const [triggerEffect, setTriggerEffect] = useState(false);
    const backEndAddress = getEnvVars(__DEV__).backEndAddress;

    // Fetch transactions whenever `triggerEffect` changes
    useEffect(() => {
        getMyQuitPalTransactions();
    }, [triggerEffect]);

    // Trigger effect when the current segment is "quitpaltxs"
    useEffect(() => {
        const currentSegment = segments[segments.length - 1];
        if (currentSegment === "quitpaltxs") {
            setTriggerEffect(prev => !prev);
        }
    }, [segments]);

    const getMyQuitPalTransactions = async () => {
        try {
            const token = await AsyncStorage.getItem("QP_ACCESSTOKEN");
            if (!token) throw new Error("Access token is missing.");

            const response = await fetch(`${backEndAddress}/transaction/my`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200) {
                const transactionList: QuitPalTransaction[] = await response.json();
                setTransactions(transactionList.filter(tx => !tx.checked && !tx.expired));
            } else {
                console.error(`Failed to fetch transactions. Status: ${response.status}`);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        }
    };

    const navigateToVerifyScreen = (transaction: QuitPalTransaction) => {
        router.push({
            pathname: '/verifyTransaction',
            params: { transaction: JSON.stringify(transaction) },
        });
    };

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: "#f5f5f5",
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
                                elevation: 5,
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
