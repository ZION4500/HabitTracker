import React, { createContext, useContext, useEffect, useState } from "react";
import { ID, Models } from "react-native-appwrite";
import { account } from "./appwrite";

type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  isLoadingUser: boolean;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null,
  );
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const session = await account.get();
      setUser(session);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const newAccount = await account.create({
        userId: ID.unique(),
        email: email,
        password: password,
      });
      await signIn(email, password);
      return null;
    } catch (error) {
      if (error instanceof Error) {
        return error.message;
      }

      return "An Error occured during sign up";
    }
  };
  const signIn = async (email: string, password: string) => {
    try {
      const Account = await account.createEmailPasswordSession({
        email: email,
        password: password,
      });
      const session = await account.get();
      setUser(session)
      return null;
    } catch (error) {
      if (error instanceof Error) {
        return error.message;
      }

      return "An Error occured during sign in";
    }
  };
  const signOut = async () => {
    try {
      await account.deleteSession({
        sessionId: "current",
      });
      setUser(null);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoadingUser, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw Error("useAuth must be in the auth provider");
  }
  return context;
}
