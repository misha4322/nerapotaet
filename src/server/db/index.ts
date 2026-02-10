import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";


const queryClient = postgres(process.env.DATABASE_URL!, {
max: 10,
ssl: process.env.NODE_ENV === "production" ? "require" : false,
});


export const db = drizzle(queryClient, { schema });