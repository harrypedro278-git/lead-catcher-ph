-- I-run mo to sa Supabase > SQL Editor > New Query > Run
create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null,
  service text not null,
  source text default 'Public Form',
  budget numeric,
  notes text default '',
  status text default 'Bagong Inquiry',
  created_at timestamptz default now()
);
alter table leads enable row level security;
-- Public form can INSERT, everyone can read for this simple V2 (PIN protects dashboard in UI)
create policy "public insert" on leads for insert with check (true);
create policy "public read" on leads for select using (true);
create policy "public update" on leads for update using (true);
create policy "public delete" on leads for delete using (true);
-- Para sa realtime:
alter publication supabase_realtime add table leads;
