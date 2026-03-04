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
                TextPart: 'Dear passenger, welcome to Mailjet! May the delivery force be with you!'
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
    const loginUrl = `${baseUrl}/auth/confirming?token=${rawToken}`;
    const html =`<div>
                    <a href="${loginUrl}">Login link</a>
                 </div>`;
    const subject = "login";
    try{
        await sendMailService(recipientEmail, html, subject);
    }catch (error) {
        console.error(error);
        throw error;
    }
}
