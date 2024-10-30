import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, View, TextInput, StyleSheet, Button, Keyboard, TouchableWithoutFeedback, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";
import getEnvVars from '../environment';

export default function ConnectAccountScreen() {
    const bankData = [
        { label: 'KB 국민은행', value: '1' },
        { label: '추가 예정', value: '2' },
    ];

    const [bank, setBank] = React.useState<String | null>(null);
    const [isBankFocus, setIsBankFocus] = React.useState(false);
    const [bankId, onChangeBankId] = React.useState('');
    const [bankPassword, onChangeBankPassword] = React.useState('');
    const [accountNumber, onChangeAccountNumber] = React.useState('');
    const [accountPassword, onChangeAccountPassword] = React.useState('');

    const backEndAddress = getEnvVars(__DEV__).backEndAddress;
    const router = useRouter();

    useEffect(() => {
    }, [bank]);

    const addAccountRequest = async () => {
        const countryCode = 'KR'
        const businessType = 'BK'
        const clientType = 'P'
        const loginType = '1'

        var organization = '0000';
        if (bank == '1') organization = '0004';

        const id = bankId
        const password = bankPassword

        const response = await fetch(
            backEndAddress + '/codef/connected-id',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + await AsyncStorage.getItem('QP_ACCESSTOKEN'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    { countryCode, businessType, clientType, organization, loginType, id, password, accountNumber, accountPassword }
                )
            }
        );

        const responseJson = await response.json();
        if (response.status === 200) {
            Alert.alert(
                '계좌 등록',
                '등록에 성공했습니다.',
                [
                    {
                        text: '확인',
                        onPress: () => router.back()
                    }
                ]
            );
        }
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 16,
                    backgroundColor: '#f5f5f5',
                }}
            >

                <View style={styles.inputContainer}>
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
                                        '은행을 선택하세요'
                                        :
                                        String(bank)
                                )
                                :
                                '은행을 선택하세요'
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

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>은행 ID</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="default"
                        maxLength={50}
                        placeholder="은행 ID"
                        value={bankId}
                        onChangeText={onChangeBankId}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>은행 ID 로그인 비밀번호</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType='visible-password'
                        maxLength={50}
                        secureTextEntry={true}
                        placeholder="로그인 비밀번호"
                        value={bankPassword}
                        onChangeText={onChangeBankPassword}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>계좌번호</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="decimal-pad"
                        maxLength={50}
                        placeholder="계좌번호"
                        value={accountNumber}
                        onChangeText={onChangeAccountNumber}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>계좌비밀번호</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="decimal-pad"
                        maxLength={50}
                        placeholder="계좌비밀번호"
                        secureTextEntry={true}
                        value={accountPassword}
                        onChangeText={onChangeAccountPassword}
                    />
                </View>

                <Button
                    title="제출"
                    onPress={addAccountRequest}
                    color="#4CAF50"
                />
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        width: '100%',
    },
    label: {
        flex: 0.5,
        fontSize: 16,
        color: '#333',
        paddingRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f2f2f2',
        borderRadius: 6,
    },
    resultText: {
        marginTop: 16,
        fontSize: 16,
        color: '#4CAF50',
    },
    dropdown: {
        flex: 1,
        height: 40,
        backgroundColor: '#f2f2f2',
        borderRadius: 6,
        paddingHorizontal: 12,
    },
    icon: {
        marginRight: 5,
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
