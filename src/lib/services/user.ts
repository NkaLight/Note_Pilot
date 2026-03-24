import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getResetToken } from "../db_access/reset_token";
import { setNewPassword } from "../db_access/user";


export async function resetPassword(token:string, newPassword:string){
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await getResetToken(tokenHash);
    await setNewPassword(hashedPassword, user.application_user.user_id);
}