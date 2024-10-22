import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, View, TextInput, StyleSheet, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from 'expo-notifications';

export default function IndexScreen() {
  const router = useRouter();

  const [signInEmail, onChangeSignInEmail] = React.useState('');
  const [signInPassword, onChangeSignInPassword] = React.useState('');
  const [accessToken, onChangeAccessToken] = React.useState('');
  const [accessTokenExpires, onChangeAccessTokenExpires] = React.useState('');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  const checkLoginStatus = async () => {
    const token = await AsyncStorage.getItem('QP_ACCESSTOKEN');
    const tokenExpires = await AsyncStorage.getItem('QP_ACCESSTOKEN_EXPIRES');

    if (token !== null && tokenExpires !== null) {
      const now = new Date(Date.now());
      const expiringTime = new Date(Number(tokenExpires));

      onChangeAccessToken(token);
      onChangeAccessTokenExpires(tokenExpires);

      if (expiringTime.getTime() > now.getTime() + 1000 * 60 * 30) {
        setTimeout(() => {
          router.push("./after");
        }, 0);
      }
    }
  };
  const loginRequest = async () => {
    const email = signInEmail
    const password = signInPassword
    const response = await fetch(
      'http://192.168.0.8:8080/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      }
    );

    if (response.status === 200) {
      const responseJson = await response.json();
      const newAccessToken = responseJson.accessToken;
      const newAccessTokenExpires = responseJson.tokenExpiresIn;

      await AsyncStorage.setItem('QP_ACCESSTOKEN', newAccessToken);
      await AsyncStorage.setItem('QP_ACCESSTOKEN_EXPIRES', String(newAccessTokenExpires));

      // Push Notification 토큰 가져오기
      const pushToken = (await Notifications.getExpoPushTokenAsync()).data;
      
      // 백엔드에 Push Token 업데이트 요청
      await fetch(`http://192.168.0.8:8080/user/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newAccessToken}`, // 토큰을 인증 헤더에 포함
        },
        body: JSON.stringify({ pushToken }),
      });

      onChangeAccessToken(newAccessToken);
      onChangeAccessTokenExpires(String(newAccessTokenExpires));
      router.push("/after");
    } else {
      return 0;
    }
  };

  useEffect(() => {
    checkLoginStatus();
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('알림 권한이 거부되었습니다!');
      }
    })();
  }, []);

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
        keyboardType="email-address"
        maxLength={50}
        placeholder="email"
        value={signInEmail}
        onChangeText={onChangeSignInEmail}
      />
      <TextInput
        style={styles.input}
        keyboardType="visible-password"
        maxLength={50}
        placeholder="password"
        secureTextEntry={true}
        value={signInPassword}
        onChangeText={onChangeSignInPassword}
      />
      <Text>{accessToken}</Text>
      <Text>{accessTokenExpires}</Text>
      <Button title="Sign In" onPress={loginRequest}></Button>
      <Button title="Sign Up" onPress={() => router.push("/signup")}></Button>
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