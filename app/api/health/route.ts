import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const healthStatus = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || "unknown",
      database: "connected",
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error("Health check failed:", error);
    
    const errorStatus = {
      status: "error",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    };

    return NextResponse.json(errorStatus, { status: 503 });
  }
}