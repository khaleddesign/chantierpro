import { Role } from "@prisma/client";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: Role;
      company?: string;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: Role;
    company?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    company?: string;
  }
}