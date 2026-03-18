import { getUserByEmail } from "../db_access/user";
import {storeResetTokenHash} from "../db_access/reset_token";
import crypto from "crypto";

export async function createResetToken(email:string){
    const user = await getUserByEmail(email);
    if(!user) throw new Error("User does not exist");
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await storeResetTokenHash(tokenHash, user);
    return rawToken;
}
