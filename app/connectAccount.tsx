import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, View, TextInput, StyleSheet, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AntDesign } from "@expo/vector-icons";

export default function ConnectAccountScreen() {
    const bankData = [
        { label: 'KB 국민은행', value: '1' },
        { label: '대구은행', value: '2' },
        { label: '추가 예정', value: '3' },
    ];

    const [bank, setBank] = React.useState<String | null>(null);
    const [isBankFocus, setIsBankFocus] = React.useState(false);
    const [bankId, onChangeBankId] = React.useState('');
    const [bankPassword, onChangeBankPassword] = React.useState('');
    const [birthDate, onChangeBirthDate] = React.useState('');
    const [result, onChangeResult] = React.useState('');

    const router = useRouter();

    useEffect(() => {
        // console.log(bank);
    }, [bank]);

    const addAccountRequest = async () => {
        console.log('sending bank : ' + bank);

        const countryCode = 'KR'
        const businessType = 'BK'
        const clientType = 'P'
        const loginType = '1'

        var organization = '0000';
        if (bank == '1') organization = '0004';

        const id = bankId
        const password = bankPassword

        const response = await fetch(
            'http://192.168.0.8:8080/connected-id',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + await AsyncStorage.getItem('QP_ACCESSTOKEN'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    { countryCode, businessType, clientType, organization, loginType, id, password, birthDate }
                )
            }
        );

        const responseJson = await response.json();
        onChangeResult(String(responseJson.data.connectedId));
        // router.dismiss();
    }

    return (
        <SafeAreaView
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <View style={styles.container}>
                <Dropdown
                    style={[styles.dropdown, isBankFocus && { borderColor: 'blue' }]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={bankData}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={
                        isBankFocus
                            ?
                            (
                                bank == null
                                    ?
                                    'Select Item'
                                    :
                                    String(bank)
                            )
                            :
                            'Select Item'
                    }
                    value={String(bank)}
                    onFocus={() => setIsBankFocus(true)}
                    onBlur={() => setIsBankFocus(false)}
                    onChange={item => {
                        setBank(item.value);
                        setIsBankFocus(false);
                    }}
                />
            </View>
            <TextInput
                style={styles.input}
                keyboardType="default"
                maxLength={50}
                placeholder="은행 ID"
                value={bankId}
                onChangeText={onChangeBankId}
            />
            <TextInput
                style={styles.input}
                keyboardType='visible-password'
                maxLength={50}
                secureTextEntry={true}
                placeholder="은행 ID 로그인 비밀번호"
                value={bankPassword}
                onChangeText={onChangeBankPassword}
            />
            <TextInput
                style={styles.input}
                keyboardType="default"
                maxLength={50}
                placeholder="생년월일 (ex.970615)"
                value={birthDate}
                onChangeText={onChangeBirthDate}
            />
            <Button
                title="제출"
                onPress={addAccountRequest}
            >
            </Button>
            <Text>{result}</Text>
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
    dropdown: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
        width: 250
    },
    icon: {
        marginRight: 5,
    },
    label: {
        position: 'absolute',
        backgroundColor: 'white',
        left: 22,
        top: 8,
        zIndex: 999,
        paddingHorizontal: 8,
        fontSize: 14,
    },
    container: {
        padding: 16,
    },
    placeholderStyle: {
        fontSize: 16,
    },
    selectedTextStyle: {
        fontSize: 16,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
    },
});