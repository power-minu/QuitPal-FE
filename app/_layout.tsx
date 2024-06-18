import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack initialRouteName="login">
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: "로그인"
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          headerShown: true,
          title: "회원가입"
        }}
      />
      <Stack.Screen
        name="after"
        options={{
          headerShown: true,
          title: "로그인 성공"
        }}
      />
      <Stack.Screen
        name="connectAccount"
        options={{
          headerShown: true,
          title: "계좌 연결"
        }}
      />
      <Stack.Screen
        name="transactionRequest"
        options={{
          headerShown: true,
          title: "계좌 거래내역 요청"
        }}
      />
    </Stack>
  );
}
