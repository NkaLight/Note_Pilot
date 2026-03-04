import crypto from "crypto";
import { getResetToken } from "../db_access/reset_token";


export async function resetPassword(token:string, newPassword:string){
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = getResetToken(tokenHash);
    

}