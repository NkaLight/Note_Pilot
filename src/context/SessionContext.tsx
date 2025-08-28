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

export const SessionProvider = ({children}: {children: ReactNode}) =>{
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);


    // On load, fetch the & validate current session from /api/session
    useEffect(()=>{
        const fetchSession = async ()=> {
            try{
                const res = await fetch("/api/validate_session")
                if (res.ok){
                    const respData = await res.json();
                    setUser(respData.user || null)
                }
            }catch(err){
                console.log("Error calling validate user", err)
                setUser(null)
            }finally{
                setLoading(false);
            }
        }
       fetchSession(); 
       console.log("USER:", user)
    }, [])

    return (
        <SessionContext.Provider value={{ user, setUser, loading }}>
        {children}
        </SessionContext.Provider>
    );
}