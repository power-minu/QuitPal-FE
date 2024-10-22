import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, TextInput, StyleSheet, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface QuitPalTransaction {
    place: string;
    amount: number;
    purchaseDate: string;
    checked: boolean;
    expired: boolean;
}

export default function QuitPalTransactionScreen() {
    const [susHistory, onChangeSusHistory] = React.useState('');

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
            transactionList.forEach((transaction: QuitPalTransaction) => {
                onChangeSusHistory(
                    prevHistory => prevHistory
                    + transaction.place + ', '
                    + transaction.amount + '원, '
                    + transaction.purchaseDate + '\n'
                    + 'checked: ' + transaction.checked + ', '
                    + 'expired: ' + transaction.expired
                    + '\n\n'
                );
            });
        } else {
            return 0;
        }
    }

    return (
        <SafeAreaView
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 10
            }}
        >
            <Button title="요청" onPress={getMyQuitPalTransactions}></Button>
            <Text>
                {susHistory}
            </Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        width: 250
    },
});