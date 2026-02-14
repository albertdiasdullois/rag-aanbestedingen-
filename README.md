# Aanbestedingen RAG Systeem

Een complete RAG (Retrieval-Augmented Generation) applicatie voor het doorzoeken van aanbestedingsdocumenten met AI. Ondersteunt PDF, Word (.docx) en Excel (.xlsx) bestanden.

## 🚀 Features

- ✅ **Multi-format support**: PDF, Word, Excel documenten
- ✅ **Vector Search**: Semantisch zoeken met embeddings
- ✅ **AI Antwoorden**: GPT-4 gegenereerde antwoorden met bronvermelding
- ✅ **Document Management**: Upload, bekijk en verwijder documenten
- ✅ **Real-time Processing**: Automatische verwerking en indexering
- ✅ **Cloud-native**: Volledig serverless op Vercel + Supabase

## 📋 Vereisten

- Supabase account (gratis tier is voldoende)
- OpenAI API key
- Vercel account (gratis tier is voldoende)

## 🔧 Installatie & Deployment

### Stap 1: Supabase Database Setup

1. Log in op [Supabase Dashboard](https://supabase.com/dashboard)
2. Ga naar je project
3. Open **SQL Editor**
4. Run de SQL uit het bestand `supabase-schema.sql` (zie hieronder)

### Stap 2: Vercel Deployment

#### Optie A: Deploy via Vercel Dashboard (Makkelijkst)

1. **Upload je project naar GitHub:**
   - Maak een nieuw GitHub repository
   - Upload alle bestanden uit deze folder
   - Push naar GitHub

2. **Connect met Vercel:**
   - Ga naar [vercel.com](https://vercel.com)
   - Klik op "New Project"
   - Import je GitHub repository
   - Vercel detecteert automatisch Next.js

3. **Voeg Environment Variables toe:**
   In Vercel project settings → Environment Variables:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=jouw-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key
   SUPABASE_SERVICE_ROLE_KEY=jouw-service-role-key
   OPENAI_API_KEY=jouw-openai-key
   ```

4. **Deploy:**
   - Klik op "Deploy"
   - Wacht 2-3 minuten
   - Je krijgt een URL: `jouw-project.vercel.app`

#### Optie B: Deploy via Vercel CLI

```bash
# Installeer Vercel CLI (eenmalig)
npm i -g vercel

# Deploy
vercel

# Volg de prompts en voeg environment variables toe
```

### Stap 3: Waar vind je je keys?

**Supabase Keys:**
1. Ga naar Supabase Dashboard
2. Klik op je project
3. Ga naar Settings → API
4. Kopieer:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

**OpenAI API Key:**
1. Ga naar [platform.openai.com](https://platform.openai.com)
2. Klik rechtsboven op je profiel
3. Klik op "View API Keys"
4. Maak een nieuwe key → `OPENAI_API_KEY`

## 📊 Supabase Database Schema

Run deze SQL in je Supabase SQL Editor:

```sql
-- Activeer pgvector extension
create extension if not exists vector;

-- Maak documents tabel
create table documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  file_name text not null,
  file_type text not null,
  file_path text,
  file_size bigint,
  upload_date timestamp default now(),
  metadata jsonb default '{}'::jsonb,
  processed boolean default false
);

-- Maak document_chunks tabel met embeddings
create table document_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  chunk_index integer,
  page_number integer,
  sheet_name text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp default now()
);

-- Indexen voor snellere queries
create index on document_chunks using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create index on document_chunks(document_id);
create index on documents(file_type);
create index on documents(upload_date desc);

-- Functie voor similarity search
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_file_type text default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float,
  file_name text,
  file_type text,
  page_number integer,
  sheet_name text
)
language sql stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.file_name,
    d.file_type,
    dc.page_number,
    dc.sheet_name
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where 1 - (dc.embedding <=> query_embedding) > match_threshold
    and (filter_file_type is null or d.file_type = filter_file_type)
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- Storage bucket voor bestanden
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict do nothing;

-- Storage policies
create policy "Enable read access for authenticated users"
on storage.objects for select
using (bucket_id = 'documents');

create policy "Enable upload for authenticated users"
on storage.objects for insert
with check (bucket_id = 'documents');
```

## 🎯 Gebruik

1. **Upload Documenten:**
   - Klik op "Selecteer een bestand"
   - Kies een PDF, Word of Excel bestand
   - Klik op "Upload Document"
   - Wacht tot "Verwerkt" status verschijnt

2. **Zoeken:**
   - Typ je vraag in de zoekbalk
   - Bijvoorbeeld: "Wat zijn de belangrijkste voorwaarden?"
   - Krijg een AI-gegenereerd antwoord met bronnen

3. **Documenten Beheren:**
   - Bekijk alle geüploade documenten
   - Verwijder documenten die je niet meer nodig hebt

## 💰 Kosten (Gratis Tier)

- **Vercel**: Gratis (100GB bandwidth/maand)
- **Supabase**: Gratis (500MB database, 1GB storage)
- **OpenAI**: Pay-as-you-go (~$0.10 per 1000 embeddings)

## 🐛 Troubleshooting

**"Missing environment variables"**
- Check of alle 4 environment variables zijn ingesteld in Vercel
- Redeploy na toevoegen van variables

**"Document wordt niet verwerkt"**
- Check Vercel logs voor errors
- Controleer of OpenAI API key geldig is
- Check of Supabase storage bucket bestaat

**"Zoeken werkt niet"**
- Check of documenten "Verwerkt" status hebben
- Controleer of pgvector extension geactiveerd is
- Check Supabase logs voor errors

## 📚 Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI (Embeddings + GPT-4)
- **Document Processing**: pdf-parse, mammoth, xlsx
- **Hosting**: Vercel (Serverless)

## 🔒 Beveiliging

- Environment variables worden nooit naar de client gestuurd
- Service role key alleen op server-side
- Storage buckets zijn standaard private
- CORS is geconfigureerd in Supabase

## 📖 Meer Info

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Vercel Docs](https://vercel.com/docs)

## ✨ Credits

Gebouwd met ❤️ voor Nederlandse aanbestedingen
