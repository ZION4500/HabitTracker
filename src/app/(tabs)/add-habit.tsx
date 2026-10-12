import { DATABASE_ID, databases, HABITS_TABLE_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { cssInterop } from "nativewind";
import { useState } from "react";
import { View } from "react-native";
import { ID } from "react-native-appwrite";
import { Button, SegmentedButtons, Text, TextInput } from "react-native-paper";

const FREQUENCIES = ["daily", "weekly", "monthly"];
type frequency = (typeof FREQUENCIES)[number];

cssInterop(SegmentedButtons, {
  className: "style",
});
cssInterop(Text, {
  className: "style",
});

const AddHabitScreen = () => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [frequency, setFrequency] = useState<frequency>("daily");
  const [error, setError] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();
  async function handleSubmit() {
    if (!user) return;
    try {
      await databases.createDocument(
        DATABASE_ID,
        HABITS_TABLE_ID,
        ID.unique(),
        {
          user_id: user.$id,
          title,
          description,
          frequency,
          streak_count: 0,
          last_completed: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      );
      setTitle("");
      setDescription("");
      router.back();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        return;
      } else {
        setError("There was an Error creating the habit");
        return;
      }
    }
  }

  return (
    <View className="flex-1 p-4 bg-[#F5F5F5] justify-center">
      <TextInput
        label="Title"
        mode="outlined"
        className="bg-[#F5F5F5] mb-4"
        textColor="black"
        value={title}
        onChangeText={setTitle}
      ></TextInput>
      <TextInput
        label="Description"
        mode="outlined"
        className="bg-[#F5F5F5] mb-4"
        textColor="black"
        value={description}
        onChangeText={setDescription}
      ></TextInput>
      <View className="mb-2">
        <SegmentedButtons
          value={frequency}
          onValueChange={(value) => setFrequency(value)}
          buttons={FREQUENCIES.map((freq) => ({
            value: freq,
            label: freq.charAt(0).toUpperCase() + freq.slice(1),
          }))}
        />
      </View>
      <Button
        mode="contained"
        className="mt-2"
        disabled={!title || !description}
        onPress={handleSubmit}
      >
        Add Habit
      </Button>
      {error && <Text className="text-red-500 mb-4">{error}</Text>}
    </View>
  );
};

export default AddHabitScreen;
