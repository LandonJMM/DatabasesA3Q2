import {date, integer, pgTable, text, varchar} from "drizzle-orm/pg-core";

export const studentTable = pgTable("students", {
    student_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    first_name: text().notNull(),
    last_name: text().notNull(),
    email: text().notNull().unique(),
    enrollment_date: date(),
});