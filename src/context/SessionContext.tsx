"use client";

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { createContext, ReactNode, useContext, useState, useRef, useMemo, useEffect } from "react";

type User = {
    name:string;
    email: string;
    aiLevel?: string;
}

//user: { id: user.user_id, email: user.email, username : user.username }
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
        const [loading, setLoading] = useState(!initialUser);

        useEffect(()=>{
            if(initialUser) return; 
            //Run on mount when there is no user
            setLoading(true);

            const loadSession = async() =>{
                try{
                    const res =  await fetchWithAuth("/api/auth/me");
                    if(res.ok){
                        const data = await res.json();
                        setUser(data.user);
                    }else{
                        setUser(null);
                    }
                }catch{
                    setUser(null);
                }finally{
                    setLoading(false);
                }
            };
            loadSession();
        }, []);

        const intervalRef = useRef<number | null>(null);
        useEffect(()=>{
            if(!user) return;

            const REFRESH_INTERVAL = 13 * 60 * 1000; //At 13min refresh silently
        
            intervalRef.current = window.setInterval(async()=>{
                try{
                    const res = await fetchWithAuth("/api/refresh_token", {
                        method:"POST", 
                        credentials:"include"
                    });
                    if(res.ok){
                         const data = await res.json();
                         setUser(data.user);
                    }else{
                        setUser(null);
                    }
                }catch{
                    setUser(null);
                }
            }, REFRESH_INTERVAL);
            return ()=>{
                if(intervalRef.current) window.clearInterval(intervalRef.current);
            };
        }, [user]);


        const contextValue = useMemo(() => ({ 
        user, 
        setUser, 
        loading 
    }), [user, loading]);

        return (
            <SessionContext.Provider value={contextValue}>
            {children}
            </SessionContext.Provider>
        );
    };