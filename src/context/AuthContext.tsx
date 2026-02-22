'use client';

import React, { createContext, ReactNode, useContext, useState } from 'react';

type AuthStatus = "signUp" | "signIn" | "";

type AuthContextType = {
  // New state for this context
  activeForm: AuthStatus
  setActiveForm: React.Dispatch<React.SetStateAction<AuthStatus>>;
//   chosenAuthType: string | null;
//   setChosenAuthType: React.Dispatch<React.SetStateAction<string | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthContextProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
  // Allow the initial state to be passed in, defaulting to empty string
  initialAuth?: AuthStatus;
}

export const AuthContextProvider = ({
    children, 
    initialAuth = "" 
}: AuthProviderProps) => {
  // 3. Explicitly type the useState hook with the union
  const [activeForm, setActiveForm] = useState<AuthStatus>(initialAuth);

  return (
    <AuthContext.Provider 
      value={{ 
        activeForm, 
        setActiveForm
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
