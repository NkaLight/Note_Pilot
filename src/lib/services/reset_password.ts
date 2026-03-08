import crypto from "crypto";
import { getUserByEmail } from "../db_access/user";

export async function createPasswordResetToken(email:string){
    const rawToken = crypto.randomBytes(32).toString("hex");
    // const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // const user = await getUserByEmail(email);

    return null;
}