"use client";

import { useRouter } from "next/navigation";
import { createContext, ReactNode, useContext, useState, useRef, useMemo, useEffect } from "react";

type User = {
    user_id: number;
    email: string;
    username: string;
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
        const isRefreshing = useRef(false);
        const router = useRouter();

        useEffect(()=>{
            //Run on mount when there is no user
            if(!user && !isRefreshing.current){
                const silentRefresh = async ()=>{
                    isRefreshing.current = true;
                    try{
                        const res = await fetch("/api/refresh_token", {
                            method:"POST",
                        });
                        if(res.ok){
                            const data = await res.json();
                            console.log(data);
                            console.log(data.user);
                            console.log(data.error);
                            console.log(data.application_user);
                            router.refresh();
                            setUser(data.user);
                            
                        }else{
                            setUser(null);
                        }
                    }catch(error){
                        setUser(null);

                    }finally{
                        setLoading(false);
                        isRefreshing.current = false;
                    }
                };
                silentRefresh();       
            }else{
                setLoading(false);
            }
        }, []);

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