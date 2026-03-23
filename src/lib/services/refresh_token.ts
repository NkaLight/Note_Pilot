import { prisma } from "@/lib/db";
import crypto from "crypto";
import { SignJWT } from "jose";
import { AUTH_POLICY, setAccessToken, setAuthCookies } from "../utils/auth";

/*Function should validate the refresh_token and return the new access_token */
export async function refreshLogic(curr_refresh_token:string){
    const session = await prisma.session.findUnique({
        where:{token:curr_refresh_token, is_used:false},
        include:{
            application_user:true
        }
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = new Date(session.expires_at);
    expiryDate.setHours(0, 0, 0, 0);

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    //If none exist
    if(!session) return null;

    //if refresh_token expired
    if (expiryDate < today) return null;

    //Replay attacks detection, this forces logout on all sessions.
    if(session.is_used === true){
        await prisma.session.updateMany({
            where:{
                family_id:session.family_id,
            },
            data:{
                is_used:true,
            }
        });
        console.error("Replay attack detected");
        return null; 
    }
    //If it expires today 
    if(expiryDate.getTime() - today.getTime() < ONE_DAY_MS){
        //Generate new access and refresh token
        const user = session.application_user;
        const access_token = await new SignJWT({id:user.user_id, email:user.email})
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime(AUTH_POLICY.access_expiry) 
                .sign(AUTH_POLICY.getAccessSecret());
        const new_refresh_token = crypto.randomBytes(32).toString("hex");
        try{
            console.error(session);
            await prisma.session.create({
                data: {
                    user_id: session.user_id,
                    token:new_refresh_token,
                    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // +7 days
                    last_active_at: new Date(),
                    family_id:session.family_id
                },
            });
            //Mark the current refresh_token as used.
            await prisma.session.update({
                where:{
                    token:curr_refresh_token,
                },
                data:{
                    is_used:true
                }
            });
            //Store in session cookie
            await setAuthCookies(access_token, new_refresh_token);
            return user;//Return the user object on complete
        }catch(error){
            console.error(error);
            return null;
        }

    }else if(expiryDate.getTime() >= today.getTime()){
        //just generate new access token
        console.error("we just generate access token");
        const user = session.application_user;
        const access_token = await new SignJWT({id:user.user_id, email:user.email})
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime(AUTH_POLICY.access_expiry) 
                .sign(AUTH_POLICY.getAccessSecret());
                
        await setAccessToken(access_token);
        return user;
    }else{
        //Using an expired token.
        return;
    }
}