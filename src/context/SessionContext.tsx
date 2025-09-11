"use client"

import { createContext, useContext, useState, useEffect, ReactNode} from "react"

type User = {
    user_id: number;
    email: string;
    username: string;
    darkMode?: boolean;
    preferences?: {
        darkMode?: boolean;
    }

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
            }catch(err: unknown){
                if (err instanceof Error) {
                    console.log("Error calling validate user", err.message)
                    setUser(null)
                } else {
                    console.log("Error calling validate user", String(err))
                }
            }finally{
                setLoading(false);
            }
        }
       fetchSession(); 
       console.log("USER:", user)
       // eslint-disable-next-line react-hooks/exhaustive-deps
       // disabled because unsure if 
    }, [])

    return (
        <SessionContext.Provider value={{ user, setUser, loading }}>
        {children}
        </SessionContext.Provider>
    );
}