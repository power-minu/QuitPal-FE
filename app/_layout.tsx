import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack initialRouteName="index">
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
        name="afterLogin"
        options={{
          headerShown: false,
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
        name="quitpaltxs"
        options={{
          headerShown: true,
          title: "등록된 거래내역"
        }}
      />
      <Stack.Screen
        name="verifyTransaction"
        options={{
          headerShown: true,
          title: "결제내역 검증하기"
        }}
      />
    </Stack>
  );
}
