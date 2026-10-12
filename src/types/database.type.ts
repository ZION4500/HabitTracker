import { Models } from "react-native-appwrite";

export interface Habit extends Models.Document {
  user_id: string;
  title: string;
  description: string;
  frequency: string;
  streak_count: string;
  last_completed: string;
  created_at: string;
}

export interface Completions extends Models.Document {
  habit_id: string,
  user_id: string,
  completed_at: string
}