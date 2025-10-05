import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth"; 


export async function POST(req: Request){
    try{
        const user = getSessionUser();
        if(!user){
            return new NextResponse("Unathorized", {status: 404,}) 
        }

        const form = await req.formData();
        const file = form.get("file") as File | null;
        if(!file){
            return new NextResponse("File could not be processed", {status: 500,}) 
        }

        const processFormData = new FormData();
        processFormData.append("file", file)

        const serviceUrl = "http://localhost:8080/process-pdf";

        const proceResp = await fetch(serviceUrl, {
            method: "POST",
            body: processFormData,
        });

        //Catch Python service errors
        if(!proceResp.ok){
            return new NextResponse("Error processing the file in the Python service", {status:500});
        }

        //Success
        const result = await proceResp.json();
        return NextResponse.json(result)

    }catch (err: any) {
        console.error("Forwarding API error:", err);
        return NextResponse.json(
            { error: err?.message || "An internal server error occurred" },
            { status: 500 }
        );
    }
}