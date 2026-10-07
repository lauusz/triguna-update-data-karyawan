# Update Data Karyawan

Form update data karyawan dengan PIN server-side dan penyimpanan satu baris baru per pengiriman ke Google Spreadsheet.

## Menjalankan lokal

1. Untuk lokal, letakkan JSON service account sebagai `kunci_google.json` di root project **atau** isi `GOOGLE_SERVICE_ACCOUNT_EMAIL` dan `GOOGLE_PRIVATE_KEY` pada `.env`. Jika memakai nama file lain, isi `GOOGLE_SERVICE_ACCOUNT_FILE`. File credential dan `.env` sudah diabaikan Git.
2. Jalankan `pnpm install`.
3. Jalankan `pnpm dev` lalu buka alamat yang ditampilkan.

## Google Spreadsheet

1. Buat service account pada Google Cloud, aktifkan **Google Sheets API**, lalu buat private key JSON.
2. Salin nilai `client_email` ke `GOOGLE_SERVICE_ACCOUNT_EMAIL` dan `private_key` ke `GOOGLE_PRIVATE_KEY`. Untuk Vercel, simpan newline private key sebagai `\\n`.
3. Buka spreadsheet tujuan lalu bagikan sebagai **Editor** ke email service account tersebut.
4. Isi nama tab yang ingin dipakai pada `GOOGLE_SHEET_TAB` (ini adalah nama tab, bukan angka `gid`).
5. Tambahkan header berikut pada baris pertama tab tersebut:

   `Waktu kirim | Nama Lengkap | Domisili Saat ini | Nama keluarga yang dapat dihubungi | Hubungan | Nomor yang dapat dihubungi`

Setiap submit menambahkan baris baru dengan urutan kolom tersebut. Nomor telepon dikirim sebagai teks agar format seperti `+62 812-3456-7890` tidak berubah.

## Vercel

Tambahkan `FORM_PIN`, `GOOGLE_SPREADSHEET_ID`, `GOOGLE_SHEET_TAB`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, dan `GOOGLE_PRIVATE_KEY` ke **Project Settings → Environment Variables** untuk environment Production (dan Preview jika diperlukan). `api_key.json` hanya dipakai lokal dan tidak tersedia di Vercel. Jangan menambahkan `NEXT_PUBLIC_` pada nama variabel mana pun karena seluruh nilai ini harus tetap berada di server.

## Catatan keamanan

PIN hanya menjadi gerbang akses form, bukan pengganti autentikasi per-karyawan. Jangan gunakan aplikasi ini untuk data yang membutuhkan identitas pengguna individual atau hak akses terperinci.
