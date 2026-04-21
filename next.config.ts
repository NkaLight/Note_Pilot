import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],

  async rewrites(){
    return [
      {
        source:"/api/py/:path",
        destination: process.env.NODE_ENV === "production" ? 
            "http://serviceUrl/:path" :
            "http://localhost:8000/:path*",
      }
    ]; 
  }
};

export default nextConfig;