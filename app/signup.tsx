import { useRouter } from "expo-router";
import React from "react";
import { Text, View, TextInput, StyleSheet, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const router = useRouter();

  const [email, onChangeEmail] = React.useState('');
  const [password, onChangePassword] = React.useState('');
  const [result, onChangeResult] = React.useState('');

  const signUpRequest = async () => {
    const response = await fetch(
      'http://172.30.1.38:8080/auth/signup',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email, password})
      }
    );

    if (response.status === 200) {
      const responseJson = await response.json();
      console.log(responseJson);
      onChangeResult('회원가입 성공: ' + responseJson.email);
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
      }}
    >
      <TextInput
        style={styles.input}
        keyboardType="email-address"
        maxLength={50}
        placeholder="email"
        value={email}
        onChangeText={onChangeEmail}
      />
      <TextInput
        style={styles.input}
        keyboardType="visible-password"
        maxLength={50}
        placeholder="password"
        secureTextEntry={true}
        value={password}
        onChangeText={onChangePassword}
      />
      <Button
        title="회원가입"
        onPress={signUpRequest}
      >
      </Button>
      <Text>{result}</Text>
      <Button title="Home" onPress={() => router.dismiss()}></Button>
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