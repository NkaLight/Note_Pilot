const VERIFIED_EMAIL = process.env.Verified_Email_Sender as string;
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
import { Client, SendEmailV3_1, LibraryResponse } from 'node-mailjet';
const mailjet = new Client({
  apiKey: process.env.MJ_API_KEY_PUBLIC,
  apiSecret: process.env.MJ_API_KEY_PRIVATE
});

async function sendMailService(recipientEmail:string, html:string, subject:string){
    const data: SendEmailV3_1.Body = {
        Messages:[
            {
                From:{
                    Email:VERIFIED_EMAIL
                },
                To:[
                    {
                        Email:recipientEmail,
                    },
                ],
                Subject: subject,
                HTMLPart: html,
                TextPart: 'Hey please find the reset link here. Valid for 5 minutes'
            }
        ]
    };
    try{    
        const result = await mailjet.post('send', { version: 'v3.1' }).request(data);
        return result.body;
    } catch (error){
        console.error(error);
        throw error;
    }
} 


export async function sendResetLink(recipientEmail:string, rawToken:string){
    const resetUrl = `${baseUrl}/auth/reset_password?token=${rawToken}`;
    const html =`<div>
                    <a href="${resetUrl}">Reset Password</a>
                 </div>`;
    const subject = "login";
     await sendMailService(recipientEmail, html, subject);
}
