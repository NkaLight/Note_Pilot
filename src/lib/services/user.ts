import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getUserFromTokenHash } from "../db_access/reset_token";
import { setNewPassword } from "../db_access/user";
import { ServiceError, ServiceType } from "../error";

export async function resetPassword(rawToken:string, newPassword:string){
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await getUserFromTokenHash(tokenHash);
    if(!user) throw new ServiceError("Link invalid or expired", ServiceType.USER_ACC, 404);
    await setNewPassword(hashedPassword, user.application_user.user_id);
}