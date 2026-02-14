# ✅ SNELLE CHECKLIST - Print deze uit!

## 📋 VOOR JE BEGINT:

Heb je:
- [ ] Je oude GitHub repository verwijderd
- [ ] De NIEUWE ZIP gedownload en uitgepakt
- [ ] Je Supabase keys bij de hand
- [ ] Je OpenAI key bij de hand

---

## 🔄 STAPPEN:

### 1️⃣ NIEUWE GITHUB REPOSITORY
- [ ] Ga naar https://github.com/new
- [ ] Naam: aanbestedingen-rag
- [ ] NIETS aanvinken (geen README, geen gitignore)
- [ ] Klik "Create repository"

### 2️⃣ BESTANDEN UPLOADEN
- [ ] Pak ZIP uit
- [ ] Open folder "aanbestedingen-rag-fresh"
- [ ] Selecteer ALLES (Ctrl+A of Cmd+A)
- [ ] In GitHub klik "uploading an existing file"
- [ ] Sleep alle bestanden naar GitHub
- [ ] Commit changes

### 3️⃣ VERIFIEER
Check of je deze bestanden ziet in GitHub root:
- [ ] package.json (open en check voor "next": "14.1.0")
- [ ] vercel.json (NIEUW BESTAND! Moet er zijn!)
- [ ] next.config.js
- [ ] src/ folder

### 4️⃣ DEPLOY OP VERCEL
- [ ] Ga naar https://vercel.com
- [ ] Add New → Project
- [ ] Selecteer je repository
- [ ] Check: Framework = Next.js ✅
- [ ] Voeg 4 environment variables toe:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] OPENAI_API_KEY
- [ ] Klik Deploy
- [ ] Wacht 2-3 minuten ☕

### 5️⃣ TEST
- [ ] Open je Vercel URL
- [ ] Upload een test document
- [ ] Wacht tot "Verwerkt"
- [ ] Stel een vraag
- [ ] Krijg een antwoord!

---

## 🚨 ALS HET NOG NIET WERKT:

Stuur screenshots van:
1. Je GitHub repository hoofdpagina
2. Inhoud van package.json in GitHub
3. Inhoud van vercel.json in GitHub
4. Vercel import scherm

---

## 🎉 SUCCESS!

Als alles werkt, heb je nu:
✅ Een werkende RAG applicatie in de cloud
✅ Upload PDF, Word, Excel documenten
✅ Stel vragen en krijg AI antwoorden
✅ Gratis gehost op Vercel!

Veel succes! 🚀
