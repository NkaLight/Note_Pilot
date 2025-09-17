"use client"

import { createContext, useContext, useState, useEffect, ReactNode} from "react"

type User = {
    user_id: number;
    email: string;
    username: string;

}

type SessionContextType = {
    user: User | null
    setUser: (user: User | null) => void;
    loading: boolean
}

const SessionContext = createContext<SessionContextType>({
    user: null,
    setUser: ()=>{},
    loading:true,

});

export const useSession = ()=> useContext(SessionContext);

// 1. Accept 'initialUser' as a prop
export const SessionProvider = ({
        children,
        initialUser,
    }: {
        children: ReactNode;
        initialUser?: User | null; // The prop can be optional or null
    }) => {
        const [user, setUser] = useState<User | null>(initialUser || null);
        const [loading, setLoading] = useState(false);

        return (
            <SessionContext.Provider value={{ user, setUser, loading }}>
            {children}
            </SessionContext.Provider>
        );
    }