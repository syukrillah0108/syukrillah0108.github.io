# Monitoring Penanganan Sampah (versi GitHub Pages)

Gabungan dari `src/main.py` (pengambil data) dan `monitoring-sampah/` (tampilan monitoring),
ditulis ulang hanya dengan HTML, CSS, dan JavaScript. Tidak butuh Python, Node.js, maupun MySQL.

## Cara kerja

1. Browser mengunduh Google Spreadsheet sebagai Excel (`olah-data.js`).
2. Sheet `Form Responses 4`, `Data Mahasiswa`, dan `Time Line` diolah menjadi tabel
   Kehadiran, Kegiatan, dan Kendala, dengan aturan yang sama seperti `main.py`.
3. Hasilnya ditampilkan dengan tabel, filter, unduh CSV, dan dashboard grafik (`app.js`).

Data selalu terbaru setiap kali halaman dibuka atau tombol **Segarkan** ditekan.

## Syarat

- Spreadsheet harus dibagikan: **Bagikan → Siapa saja yang memiliki link → Viewer**.
- Jika data gagal diambil otomatis, unduh spreadsheet secara manual
  (**File → Download → Microsoft Excel (.xlsx)**), lalu buka lewat tombol **📂 Buka Excel**.

## Deploy ke GitHub Pages

1. Push repository ini ke GitHub.
2. Buka **Settings → Pages**.
3. Pada **Build and deployment**, pilih **Deploy from a branch**, branch `main`, folder `/docs`.
4. Tunggu sekitar 1 menit. Situs tersedia di `https://<username>.github.io/<nama-repo>/`.

## Coba di komputer sendiri

```bash
cd docs
python3 -m http.server 8000
# buka http://localhost:8000
```

## Mengganti spreadsheet

Ubah `SPREADSHEET_ID` di bagian atas `olah-data.js`.
