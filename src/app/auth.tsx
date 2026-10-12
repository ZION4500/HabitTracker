import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { cssInterop } from "nativewind";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

cssInterop(TextInput, {
  className: "style",
});

cssInterop(Text, {
  className: "style",
});

export default function AuthScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    if (isSignUp) {
      const message = await signUp(email, password);
      if (message) {
        setError(message);
        return;
      }
    } else {
      const message = await signIn(email, password);
      if (message) {
        setError(message);
        return;
      }
      router.replace("/");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#f5f5f5]"
    >
      <View className="flex-1 p-4 justify-center">
        <Text className="text-center mb-6 text-3xl">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </Text>

        <TextInput
          label="Email"
          placeholder="john@gmail.com"
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          className="mb-4"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          label="Password"
          autoCapitalize="none"
          secureTextEntry
          mode="outlined"
          className="mb-4"
          value={password}
          onChangeText={setPassword}
        />
        {error && <Text className="text-red-500 mb-4">{error}</Text>}
        <Button mode="contained" className="mb-2" onPress={handleAuth}>
          {isSignUp ? "Sign up" : "Log In"}
        </Button>

        <Button
          mode="text"
          onPress={() => setIsSignUp(!isSignUp)}
          className="mt-4"
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "Dont have an account. Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
