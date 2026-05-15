import { drizzle } from "drizzle-orm/node-postgres";
import { newDb } from "pg-mem";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const useMemoryDb =
  process.env.DATABASE_URL === "memory" || process.env.USE_MEMORY_DB === "1";

function createMemoryPool() {
  const memoryDb = newDb({ autoCreateForeignKeyIndices: true });

  memoryDb.public.none(`
    create table users (
      id serial primary key,
      username text not null unique,
      password_hash text not null,
      role text not null,
      full_name text not null,
      email text,
      phone text,
      profile_image_url text,
      created_at timestamptz not null default now()
    );

    create table classes (
      id serial primary key,
      name text not null,
      grade text not null,
      teacher_id integer references users(id),
      created_at timestamptz not null default now()
    );

    create table learners (
      id serial primary key,
      user_id integer references users(id),
      admission_number text not null unique,
      full_name text not null,
      grade text not null,
      class_id integer references classes(id),
      parent_id integer references users(id),
      date_of_birth text,
      gender text,
      created_at timestamptz not null default now()
    );

    create table subjects (
      id serial primary key,
      name text not null,
      code text not null,
      grade text not null,
      teacher_id integer references users(id),
      created_at timestamptz not null default now()
    );

    create table attendance (
      id serial primary key,
      learner_id integer not null references learners(id),
      class_id integer references classes(id),
      date text not null,
      status text not null,
      remarks text,
      recorded_by integer references users(id),
      created_at timestamptz not null default now()
    );

    create table marks (
      id serial primary key,
      learner_id integer not null references learners(id),
      subject_id integer not null references subjects(id),
      assessment_type text not null,
      assessment_name text not null,
      score numeric(10, 2) not null,
      max_score numeric(10, 2) not null,
      percentage numeric(10, 2) not null,
      term integer not null,
      grade text,
      recorded_by integer references users(id),
      created_at timestamptz not null default now()
    );

    create table notifications (
      id serial primary key,
      title text not null,
      message text not null,
      type text not null,
      target_role text,
      target_user_id integer references users(id),
      is_read boolean not null default false,
      sent_by integer references users(id),
      created_at timestamptz not null default now()
    );

    create table fees (
      id serial primary key,
      learner_id integer not null references learners(id),
      description text not null,
      total_amount numeric(12, 2) not null,
      amount_paid numeric(12, 2) not null default 0,
      due_date text not null,
      status text not null default 'outstanding',
      term integer not null,
      year integer not null,
      created_at timestamptz not null default now()
    );

    create table payments (
      id serial primary key,
      fee_id integer not null references fees(id),
      learner_id integer not null references learners(id),
      amount numeric(12, 2) not null,
      payment_method text not null,
      reference_number text not null unique,
      status text not null default 'completed',
      processed_at timestamptz,
      created_at timestamptz not null default now()
    );

    create table timetable (
      id serial primary key,
      class_id integer not null references classes(id),
      subject_id integer not null references subjects(id),
      teacher_id integer references users(id),
      day_of_week text not null,
      start_time text not null,
      end_time text not null,
      room text,
      created_at timestamptz not null default now()
    );

    create table materials (
      id serial primary key,
      title text not null,
      description text,
      type text not null,
      subject_id integer references subjects(id),
      class_id integer references classes(id),
      grade text,
      file_url text,
      uploaded_by integer references users(id),
      created_at timestamptz not null default now()
    );

    create table virtual_classes (
      id serial primary key,
      title text not null,
      description text,
      teacher_id integer not null references users(id),
      class_id integer references classes(id),
      subject_id integer references subjects(id),
      meeting_url text not null,
      scheduled_at timestamptz not null,
      duration_minutes integer not null default 45,
      status text not null default 'scheduled',
      created_at timestamptz not null default now()
    );
  `);

  const { Pool: MemoryPool } = memoryDb.adapters.createPg();
  const memoryPoolProto = MemoryPool.prototype as {
    adaptQuery?: (query: unknown, values?: unknown[]) => unknown;
    adaptResults?: (query: unknown, result: { fields?: { name: string }[]; rows: unknown[] }) => unknown;
  };
  const adaptQuery = memoryPoolProto.adaptQuery;
  const adaptResults = memoryPoolProto.adaptResults;

  if (adaptQuery) {
    memoryPoolProto.adaptQuery = function adaptMemoryQuery(
      query: string | { types?: unknown },
      values?: unknown[],
    ) {
      return adaptQuery.call(
        this,
        typeof query === "string" ? query : { ...query, types: undefined },
        values,
      );
    };
  }

  if (adaptResults) {
    memoryPoolProto.adaptResults = function adaptMemoryResults(
      query: { rowMode?: string },
      result: { fields?: { name: string }[]; rows: Record<string, unknown>[] },
    ) {
      const adapted = adaptResults.call(this, { ...query, rowMode: undefined }, result) as {
        rows: Record<string, unknown>[];
      };

      if (query.rowMode === "array") {
        const columnNames = result.fields?.map((field) => field.name) ?? [];
        return {
          ...adapted,
          rows: adapted.rows.map((row) => columnNames.map((name) => row[name])),
        };
      }

      return adapted;
    };
  }

  return new MemoryPool();
}

if (!process.env.DATABASE_URL && !useMemoryDb) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = useMemoryDb
  ? createMemoryPool()
  : new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
