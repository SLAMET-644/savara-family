# SAVARA FAMILY — Convex online database

Project ini mengubah penyimpanan SAVARA dari localStorage menjadi database Convex online.

## 1. Pasang di komputer / Codespaces

```bash
npm install
npx convex dev
```

Saat diminta login, login ke akun Convex yang memiliki deployment `combative-retriever-732`.

Untuk deploy production:

```bash
npx convex deploy
```

HTTP endpoint yang dipakai website adalah:
`https://combative-retriever-732.convex.site`

## 2. Deploy website ke Vercel

Build command: `npm run build`
Output directory: `dist`

Jika ingin mengganti URL backend, buat environment variable:
`VITE_CONVEX_HTTP_URL=https://combative-retriever-732.convex.site`

## Catatan penting

Backend ini sudah menyimpan Admin, Member, dan absensi secara online. Reset Admin dihitung per hari WIB dan Member per minggu (Senin–Minggu) WIB.

**Belum ada login/authentication admin.** Endpoint tulis saat ini bersifat terbuka. Untuk penggunaan publik, pasang autentikasi Convex sebelum link dibagikan luas.
