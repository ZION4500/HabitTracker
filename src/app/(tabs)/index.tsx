import {
  client,
  COMPLETIONS_TABLE_ID,
  DATABASE_ID,
  databases,
  HABITS_TABLE_ID,
  RealtimeResponse,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Completions, Habit } from "@/types/database.type";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Link } from "expo-router";
import { cssInterop } from "nativewind";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { Button, Surface, Text } from "react-native-paper";

cssInterop(Link, { className: "style" });
cssInterop(Text, { className: "style" });
cssInterop(Surface, { className: "style" });

export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>();
  const [completions, setCompletions] = useState<string[]>();

  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  const fetchHabits = useCallback(async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        HABITS_TABLE_ID,
        [Query.equal("user_id", user?.$id ?? "")],
      );
      setHabits(response.documents as Habit[]);
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  const fetchTodayCompletions = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMPLETIONS_TABLE_ID,
        [
          Query.equal("user_id", user?.$id ?? ""),
          Query.greaterThanEqual("completed_at", today.toISOString()),
        ],
      );
      const completions = response.documents as Completions[];
      setCompletions(completions.map((c) => c.habit_id));
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = `databases.${DATABASE_ID}.collections.${HABITS_TABLE_ID}.documents`;
    const completeChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_TABLE_ID}.documents`;

    const habitsSubscription = client.subscribe(
      channel,
      (response: RealtimeResponse) => {
        const isDocChange = response.events.some(
          (event) =>
            event.includes(".create") ||
            event.includes(".update") ||
            event.includes(".delete"),
        );

        if (isDocChange) {
          fetchHabits();
        }
      },
    );

    const CompleteSubscription = client.subscribe(
      completeChannel,
      (response: RealtimeResponse) => {
        const isDocChange = response.events.some(
          (event) =>
            event.endsWith(".create") ||
            event.endsWith(".update") ||
            event.endsWith(".delete") ||
            event.includes(".create") ||
            event.includes(".update") ||
            event.includes(".delete"),
        );

        if (isDocChange) {
          fetchTodayCompletions();
        }
      },
    );

    fetchHabits();
    fetchTodayCompletions();

    return () => {
      habitsSubscription();
      CompleteSubscription();
    };
  }, [user]);

  const handleDeleteHabit = async (id: string) => {
    try {
      await databases.deleteDocument(DATABASE_ID, HABITS_TABLE_ID, id);
    } catch (error) {
      console.error(error);
    }
  };
  const handleCompleteHabit = async (id: string) => {
    if (!user || completions?.includes(id)) return;
    try {
      const currentDate = new Date().toISOString();

      await databases.createDocument(
        DATABASE_ID,
        COMPLETIONS_TABLE_ID,
        ID.unique(),
        {
          habit_id: id,
          user_id: user?.$id,
          completed_at: currentDate,
        },
      );

      const habit = habits?.find((h) => h.$id === id);
      if (!habit) return;

      await databases.updateDocument(DATABASE_ID, HABITS_TABLE_ID, id, {
        streak_count: habit.streak_count + 1,
        last_completed: currentDate,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const isHabitCompleted = (id: string) => completions?.includes(id);

  const renderLeftActions = () => (
    <View className="bg-['#e53935'] justify-center flex-1 items-start rounded-2xl mb-[18] mt-[2] pl-4">
      <MaterialCommunityIcons
        name="trash-can-outline"
        size={32}
        color={"#fff"}
      />
    </View>
  );

  const renderRightActions = (id: string) => (
    <View className="bg-['#4caf50'] justify-center flex-1 items-end mb-[18] mt-[2] pr-4 rounded-2xl">
      {isHabitCompleted(id) ? (
        <Text style={{ color: "#fff" }}>Completed</Text>
      ) : (
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={32}
          color={"#fff"}
        />
      )}
    </View>
  );

  return (
    <View className="flex-1 p-4 bg-[#f5f5f5]">
      <View className="flex-row justify-between items-center mb-6">
        <Text
          variant="headlineSmall"
          style={{
            fontWeight: "bold",
          }}
        >
          Today's Habits
        </Text>
        <Button mode="text" icon={"logout"} onPress={signOut}>
          Sign out
        </Button>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {habits?.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text
              style={{
                color: "#666666",
              }}
            >
              No habits yet. Add your first habit
            </Text>
          </View>
        ) : (
          habits?.map((habit, key) => (
            <Swipeable
              ref={(ref) => {
                swipeableRefs.current[habit.$id] = ref;
              }}
              key={key}
              overshootLeft={true}
              overshootRight={false}
              renderLeftActions={renderLeftActions}
              renderRightActions={() => renderRightActions(habit.$id)}
              onSwipeableOpen={(direction) => {
                if (direction === "left") {
                  handleDeleteHabit(habit.$id);
                } else {
                  handleCompleteHabit(habit.$id);
                }
                swipeableRefs.current[habit.$id]?.close();
              }}
            >
              <Surface
                elevation={0}
                className={
                  isHabitCompleted(habit.$id)
                    ? "opacity-60 bg-[#f7f2fa] mb-5 rounded-2xl"
                    : "mb-5 rounded-2xl bg-[#f7f2fa]"
                }
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View className="p-5">
                  <Text
                    className="mb-1"
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#22223b",
                    }}
                  >
                    {habit.title}
                  </Text>
                  <Text
                    className="mb-4"
                    style={{
                      fontSize: 15,
                      color: "#6c6c80",
                    }}
                  >
                    {habit.description}
                  </Text>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row self-center bg-[#fff3e0] rounded-xl px-3 py-1">
                      <MaterialCommunityIcons
                        name="fire"
                        size={18}
                        color={"#ff9800"}
                      />
                      <Text
                        className="ml-[6]"
                        style={{
                          color: "#ff9800",
                          fontWeight: "bold",
                          fontSize: 14,
                        }}
                      >
                        {habit.streak_count} day streak
                      </Text>
                    </View>
                    <View className=" bg-[#ede7f6] rounded-xl px-3 py-1">
                      <Text
                        style={{
                          color: "#7c4dff",
                          fontWeight: "bold",
                          fontSize: 14,
                        }}
                      >
                        {habit.frequency.charAt(0).toUpperCase() +
                          habit.frequency.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Surface>
            </Swipeable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
