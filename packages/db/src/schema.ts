import { integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const exampleTable = pgTable('example', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  name: varchar('name', { length: 255 }).notNull()
});
