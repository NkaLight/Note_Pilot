import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma"; 
import { email, z } from "zod";  
import { useContext } from "react";
import { useSession } from "@/context/SessionContext";

const validate_session_schema = z.object({
    token: z.string()
})

export async function GET(){
    try{
        //Get token from the user
        const token = (await cookies()).get("session_token")?.value;
        if(!token) return NextResponse.json({user:null});
        
        //Validate token
        validate_session_schema.parse({token});

        const {user} = useSession();
        console.log("Remove/session: ", user)

        // //Check in DB
        // if(token){
        //     await prisma.session.update({
        //         where:{
        //             token: token
        //         },
        //         data: {is_used: false}
        //     });
        // };
        const session = await prisma.session.findFirst({
            where:{
                token, 
                expires_at:{gt: new Date()}, //check is still valid
                is_used: false,
            },
            include:{
                application_user: true,
            },
        });

        //Update session

        return NextResponse.json({user: user}) //Return the user object
    }catch (err){
        console.log(err)
        return NextResponse.json({user: null}) //Return null 
    }
}