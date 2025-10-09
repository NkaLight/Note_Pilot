import { prisma } from "@/lib/db";

type Session = {
  token: string;
  expires_at: Date;
  is_used: boolean;
  application_user: any;
  last_active_at: Date;
};


const sessionCache = new Map<string, Session>();

export async function clearCache(){
    sessionCache.clear();
    return sessionCache.size == 0 ? true : false; //clear cache on logout.
}

export async function  validateSession(token: string){
    let session = sessionCache.get(token);
    if(!session){ 
        //fetch DB
        const sessionDb = await prisma.session.findFirst({
            where:{
                token, 
                expires_at:{gt: new Date()}, //check is still valid
                is_used: false,
            },
            include:{
                application_user: true,
            },
        });
        if(!sessionDb) return null;
        //add session to sessionCache
        sessionCache.set(sessionDb.token, sessionDb);
        return sessionDb;
    }else{
        //check if valid or used
        if(session.expires_at <= new Date() || session.is_used == true){
            sessionCache.delete(session.token);
            return null
        }
        const newExpiry = new Date(Date.now() + 5 * 60 * 1000); // add an extra 5min
        session.expires_at = newExpiry;
        sessionCache.set(session.token, session); //update in cache

        if(Date.now() - session.last_active_at.getTime() <= 60_000 ){ //avoid race conditions.
            prisma.session.update({
                where: { token: session.token },
                data: { 
                    expires_at: newExpiry,
                    last_active_at: new Date(),
                },
            })
            .catch((err) => {
                console.error("Failed to extend session expiry in DB", err);
            });
        }
        
        return session;
    }
}

export async function getUserFromToken(token: string): Promise<SessionUser | null> {
  const session = await validateSession(token);
  if (!session) return null;

  return {
    user_id: session.application_user.user_id,
    username: session.application_user.username,
    email: session.application_user.email,
  };
}

export type SessionUser = {
  user_id: number;
  username: string;
  email: string;
};