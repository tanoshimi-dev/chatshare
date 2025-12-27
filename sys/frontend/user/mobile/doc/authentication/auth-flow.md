## Auth Flow

The authentication flow for accessing the API is as follows:

User registered Firebase

> Task :react-native-worklets:signingReport
> Variant: debugAndroidTest
> Config: debug
> Store: C:\Users\rehop\.android\debug.keystore
> Alias: AndroidDebugKey
> MD5: AD:06:9F:94:D2:EA:8B:F2:B3:3B:C5:3C:77:BD:FD:EF
> SHA1: 57:23:FC:5E:20:92:F5:61:1C:90:A5:38:E3:E3:3F:47:35:98:32:10
> SHA-256: E5:CF:0F:F2:C6:F0:7B:76:F1:A5:EE:76:B7:31:DF:05:F2:51:BD:17:DA:4F:56:D8:92:5D:9E:4F:3E:30:7A:92
> Valid until: 2055 年 7 月 26 日月曜日

---

KEY Point Information:

- Not saved user password directly in our database

Sign in flow

1. Google Sign-In
2. Get ID Token from Google Sign-In
3. Authenticate with Firebase using the ID Token
4. Get Firebase JWT Token
5. Use Firebase JWT Token to access the API
6. API verifies the Firebase JWT Token
7. If valid, API grants access to the requested resources
