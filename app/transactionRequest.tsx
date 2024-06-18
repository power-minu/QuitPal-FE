import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, TextInput, StyleSheet, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Transaction {
    resAccountDesc1: string;
    resAccountDesc2: string;
    resAccountDesc3: string;
    resAccountDesc4: string;
    resAccountIn: string;
    resAccountOut: string;
    resAccountTrDate: string;
    resAccountTrTime: string;
    resAfterTranBalance: string;
    tranDesc: string;
}

export default function AfterLoginScreen() {
    const router = useRouter();

    const [birthDate, onChangeBirthDate] = React.useState('');
    const [account, onChangeAccount] = React.useState('');
    const [accountPassword, onChangeAccountPassword] = React.useState('');
    const [susHistory, onChangeSusHistory] = React.useState('');

    const getMyAccountTransactions = async () => {
        const now = new Date(Date.now())
        const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, now.getHours(), now.getMinutes())

        let today = '';
        if ((now.getMonth() + 1).toString().length == 1) {
            today = now.getFullYear().toString() + "0" + (now.getMonth() + 1).toString() + now.getDate().toString();
        }
        else today = now.getFullYear().toString() + (now.getMonth() + 1).toString() + now.getDate().toString();
        let weekAgoLet = '';
        if ((weekAgo.getMonth() + 1).toString().length == 1) {
            weekAgoLet = weekAgo.getFullYear().toString() + "0" + (weekAgo.getMonth() + 1).toString() + weekAgo.getDate().toString();
        }
        else weekAgoLet = weekAgo.getFullYear().toString() + (weekAgo.getMonth() + 1).toString() + weekAgo.getDate().toString();

        const organization = '0004'
        const startDate = weekAgoLet
        const endDate = today
        const orderBy = '0'
        const inquiryType = '0'

        const response = await fetch(
            'http://172.30.1.38:8080/trans',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + await AsyncStorage.getItem('QP_ACCESSTOKEN'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ organization, account, startDate, endDate, orderBy, inquiryType, accountPassword, birthDate })
            }
        );

        if (response.status === 200) {
            const responseJson = await response.json();

            const transactionList: Transaction[] = responseJson.data.resTrHistoryList

            transactionList.forEach((transaction: Transaction) => {
                console.log('금액 : ' + transaction.resAccountOut)
                if (transaction.resAccountDesc3.includes('씨유') && (transaction.resAccountOut == '4500' || transaction.resAccountOut == '5000' || transaction.resAccountOut == '5300')) {
                    onChangeSusHistory(susHistory + transaction.resAccountTrDate + '에, ' + transaction.resAccountDesc3 + ' 에서 ' + transaction.resAccountOut + '원 결제함\n');
                }
            });

            // console.log(JSON.stringify(responseJson))
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
            <TextInput
                style={styles.input}
                keyboardType='number-pad'
                maxLength={50}
                placeholder="생년월일(ex.000706)"
                value={birthDate}
                onChangeText={onChangeBirthDate}
            />
            <TextInput
                style={styles.input}
                keyboardType='number-pad'
                maxLength={50}
                placeholder="계좌번호"
                value={account}
                onChangeText={onChangeAccount}
            />
            <TextInput
                style={styles.input}
                keyboardType='default'
                secureTextEntry={true}
                maxLength={4}
                placeholder="계좌 비밀번호"
                value={accountPassword}
                onChangeText={onChangeAccountPassword}
            />
            <Button title="요청" onPress={getMyAccountTransactions}></Button>
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