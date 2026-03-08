import {test, expect} from "@playwright/test";

test.describe("API endpoints unauthenticated", ()=>{
    test("GET /api/papers", async ({request}) =>{
        const res = await request.get("/api/papers");
        const data = await res.json();
        expect(res.status()).toBe(401);
    });
    test("POST /api/papers", async ({request})=>{
        const res = await request.post("/api/papers", {
            data: { name: 'test', code: 'TEST101', descr: 'test' }
        });
        expect(res.status()).toBe(401);
    });
    test("PUT /api/papers", async ({request})=>{
        const res = await request.post("/api/papers", {
            data: { name: 'testEdit', code: 'TEST101', descr: 'test', paper_id: 1 }
        });
        expect(res.status()).toBe(401);
    });
    test("DELETE /api/papers", async ({request})=>{
        const res = await request.post("/api/papers", {
            data: { paper_id: 1 }
        });
        expect(res.status()).toBe(401);
    });

    test("GET /api/flashcards", async ({request}) =>{
        expect((await request.get("/api/papers?uploadId=9")).status()).toBe(401);
    });
    test("POST /api/flashcards", async ({request}) =>{
        expect((await request.get("/api/papers", {data: {uploadId:9}})).status()).toBe(401);
    });

    test("GET /api/generateContent", async ({request}) =>{
        expect((await request.get("/api/generateContent?uploadId=9")).status()).toBe(401);
    });
    test("POST /api/generateContent", async ({request}) =>{
        expect((await request.get("/api/generateContent", {data: {uploadId:9}})).status()).toBe(401);
    });

    test("GET /api/problemsets", async ({request}) =>{
        expect((await request.get("/api/problemsets?uploadId=9")).status()).toBe(401);
    });
    test("POST /api/problemsets", async ({request}) =>{
        expect((await request.get("/api/problemsets", {data: {uploadId:9}})).status()).toBe(401);
    });
});
