# Block League — Website Bracket Turnamen

Website bracket single-elimination yang bisa kamu kelola sendiri: publik cuma bisa **lihat**,
admin bisa **buat turnamen baru, atur jumlah tim (8/16/32), ubah nama & logo tim, dan
tentukan pemenang tiap pertandingan** — semua update muncul **real-time** di semua device
yang sedang membuka halaman bracket.

Stack: **Next.js** (di-deploy ke **Vercel**) + **Supabase** (database, auth admin, realtime,
dan storage untuk logo). Supabase dipakai di sini bukan sebagai "platform deploy" tambahan —
kodenya tetap 100% jalan di Vercel, Supabase cuma jadi database online-nya (gratis).

---

## 1. Siapkan Supabase (database + auth + realtime)

1. Buka https://supabase.com → daftar/login → **New project**.
   - Catat **Project URL** dan **anon public key**-nya (Settings → API). Akan dipakai di langkah 3.
2. Buka **SQL Editor** di dashboard Supabase → **New query**.
3. Copy-paste seluruh isi file `supabase/schema.sql` (ada di folder project ini) → klik **Run**.
   - Ini otomatis membuat semua tabel, aturan keamanan (RLS), mengaktifkan realtime, dan
     membuat storage bucket `logos` untuk upload logo tim.
4. Buat akun admin pertama:
   - Buka **Authentication → Users → Add user**.
   - Isi email + password, lalu **matikan opsi "Auto Confirm User"? Jangan dimatikan** —
     pastikan toggle **Auto Confirm User** dalam keadaan **ON** supaya admin bisa langsung
     login tanpa verifikasi email (karena project ini tidak mengirim email konfirmasi).
   - Ulangi untuk admin lain yang kamu mau tambahkan — **bisa banyak admin**, masing-masing
     tinggal dibuatkan satu user di sini. Login admin di website pakai email + password ini.

> Supabase Auth memang berbasis **email**, jadi "username" admin di website ini = email yang
> kamu daftarkan di sini. Kalau mau benar-benar pakai username pendek (bukan email), itu butuh
> sistem auth custom tambahan — kalau kamu mau saya buatkan versi itu, tinggal bilang saja.

---

## 2. Jalankan di komputer kamu dulu (opsional tapi disarankan)

```bash
npm install
cp .env.example .env.local
```

Isi `.env.local` dengan URL dan anon key dari Supabase (langkah 1):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi-anon-key-disini
```

Lalu jalankan:

```bash
npm run dev
```

Buka http://localhost:3000 (tampilan publik) dan http://localhost:3000/admin/login (login admin).

---

## 3. Deploy ke Vercel — Pilihan A: Vercel + GitHub (disarankan)

Cara ini bikin setiap kali kamu `git push`, Vercel otomatis build & deploy ulang. Paling enak
untuk maintenance jangka panjang.

1. Buat repo baru di GitHub (kosong, tanpa README).
2. Di folder project ini:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
3. Buka https://vercel.com → login (bisa pakai akun GitHub) → **Add New → Project**.
4. Pilih repo yang baru kamu push → **Import**.
5. Di bagian **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL` → URL Supabase kamu
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon key Supabase kamu
6. Klik **Deploy**. Tunggu 1–2 menit → selesai, kamu dapat URL `https://nama-project.vercel.app`.

Setiap kali mau update kode lagi: edit file → `git add . && git commit -m "update" && git push`
→ Vercel otomatis deploy ulang. Tidak perlu langkah manual lain.

---

## 4. Deploy ke Vercel — Pilihan B: Vercel CLI dari localhost (tanpa GitHub)

Cara ini deploy langsung dari komputer kamu tanpa repo GitHub. Cocok kalau mau cepat atau
belum mau pakai Git.

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Login:
   ```bash
   vercel login
   ```
3. Dari dalam folder project ini, jalankan:
   ```bash
   vercel
   ```
   Ikuti pertanyaannya (set up and deploy → Y, pilih scope/akun, link to existing project → N
   untuk pertama kali, isi nama project, terima setting default).
4. Set environment variables (cuma perlu sekali):
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
   (CLI akan minta kamu paste value-nya, dan pilih environment: pilih semua — Production,
   Preview, Development.)
5. Deploy ke production:
   ```bash
   vercel --prod
   ```

Setiap kali mau update: edit kode di komputer → jalankan `vercel --prod` lagi. Tidak ada
auto-deploy seperti Pilihan A, jadi kamu yang trigger manual tiap update.

> Bisa juga gabungan: pakai GitHub untuk simpan kode (backup/version control), tapi tetap
> deploy manual lewat CLI dari localhost. Dua pilihan ini tidak saling eksklusif.

---

## 5. Memastikan real-time benar-benar jalan di device lain

1. Buka URL Vercel kamu di HP, lalu juga di laptop (dua device berbeda, dua browser berbeda).
2. Di laptop, buka `/admin/login`, login, lalu di Dashboard klik nama tim di salah satu
   pertandingan untuk menandai pemenang.
3. Lihat HP kamu — bracket di HP akan otomatis ter-update **dalam hitungan detik**, tanpa
   perlu refresh. Itu berkat Supabase Realtime yang sudah diaktifkan di langkah 1.

Kalau update di device lain **tidak** muncul otomatis, cek:
- Apakah langkah `alter publication supabase_realtime add table ...` di `schema.sql` sudah
  benar-benar ke-run (cek di Supabase: **Database → Replication**, tabel `tournaments`,
  `teams`, `matches` harus tercentang).
- Apakah environment variable di Vercel sudah benar (Settings → Environment Variables).

---

## 6. Cara pakai dashboard admin

- **Buat Turnamen Baru**: isi nama liga, season, pilih jumlah tim (8/16/32) → klik
  **Buat Bracket**. Tim otomatis dibuat dengan nama "Team 1", "Team 2", dst — tinggal kamu
  ganti nama & upload logo masing-masing.
- **Jadikan Aktif (Publish)**: turnamen yang sedang di-draft tidak otomatis publik. Klik
  tombol ini supaya turnamen tersebut yang tampil di halaman utama (`/`). Hanya satu turnamen
  yang bisa aktif/publik dalam satu waktu.
- **Edit nama & logo tim**: di bagian "Tim", klik kotak logo untuk upload gambar, atau edit
  langsung nama di kolom teks (tersimpan otomatis saat kamu klik keluar dari kolom).
- **Tentukan pemenang**: di bagian "Bracket", klik nama tim yang menang pada tiap kotak
  pertandingan. Tim itu otomatis maju ke babak berikutnya. Klik lagi nama yang sama untuk
  membatalkan keputusan itu.
- **Hapus turnamen**: tombol "Hapus" di pemilih turnamen — akan menghapus turnamen itu beserta
  semua tim & datanya secara permanen.

---

## 7. Hal yang perlu kamu tahu (batasan versi ini)

- Kalau kamu mengubah pemenang suatu pertandingan padahal babak setelahnya sudah ada hasil
  lanjutan, hasil di babak lanjutan itu **tidak otomatis ter-reset** — kamu perlu mengedit
  ulang manual babak berikutnya juga.
- Jumlah tim dibatasi ke 8 / 16 / 32 (kelipatan dua, biar struktur bracket-nya rapi tanpa bye).
- Login admin pakai email Supabase, bukan username pendek (lihat catatan di langkah 1).
- Tier gratis Supabase & Vercel sudah lebih dari cukup untuk skala turnamen komunitas biasa.

---

## Struktur Project

```
bracket-app/
├─ middleware.js              # melindungi /admin agar hanya bisa diakses setelah login
├─ supabase/schema.sql        # jalankan ini sekali di Supabase SQL Editor
├─ src/
│  ├─ app/
│  │  ├─ page.js              # halaman publik (bracket, read-only, realtime)
│  │  └─ admin/
│  │     ├─ login/page.js     # halaman login admin
│  │     └─ page.js           # dashboard admin (kelola turnamen/tim/bracket)
│  ├─ components/
│  │  ├─ BracketView.js       # render bracket + garis penghubung otomatis
│  │  └─ MatchBox.js          # satu kotak pertandingan (2 tim)
│  └─ lib/
│     ├─ supabaseClient.js    # koneksi Supabase sisi browser
│     ├─ supabaseServer.js    # koneksi Supabase untuk middleware
│     ├─ bracketLogic.js      # logika generate bracket & pelabelan babak
│     ├─ useTournamentData.js # hook fetch + realtime subscription
│     └─ adminActions.js      # semua aksi tulis (create/update/upload/dll)
```
