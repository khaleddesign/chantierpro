// Force Node.js runtime for NextAuth
export const runtime = 'nodejs'

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { withNextAuthRateLimit } from "@/lib/nextauth-rate-limiter";

const handler = NextAuth(authOptions);

// 🔒 SÉCURITÉ : Appliquer le rate limiting à NextAuth
export const GET = withNextAuthRateLimit(handler);
export const POST = withNextAuthRateLimit(handler);