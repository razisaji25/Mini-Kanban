# Spesifikasi Aplikasi Mini Kanban

Dokumen ini merangkum kebutuhan aplikasi papan kanban sederhana untuk pemakaian pribadi, dengan data disimpan sementara di browser (local storage).

---

## 1. Ringkasan

| Poin | Keterangan |
|---|---|
| Nama sementara | Mini Kanban (lihat usulan nama di bagian 10) |
| Jenis | Aplikasi web (berjalan di dalam browser) |
| Pengguna | Perorangan, satu orang saja |
| Tujuan | Mencatat dan memindahkan tugas antar kolom (misal: Rencana → Dikerjakan → Selesai) |
| Penyimpanan | Local storage browser (sementara, tanpa server dan tanpa login) |
| Perangkat | HP, tablet, dan komputer |
| Gaya tampilan | Unik, hangat, ramah, tidak kaku seperti aplikasi kantor |

---

## 2. Tujuan dan Batasan

### 2.1 Yang ingin dicapai
1. Membuat tugas baru dalam hitungan detik, tanpa banyak isian wajib.
2. Memindahkan tugas antar kolom dengan cara yang enak dipakai, baik lewat sentuhan jari maupun mouse.
3. Data tetap ada meskipun browser ditutup lalu dibuka lagi.
4. Bisa dipakai di HP tanpa terasa "versi kecil dari aplikasi desktop".

### 2.2 Yang tidak termasuk (untuk versi ini)
1. Tidak ada login, akun, atau multi-pengguna.
2. Tidak ada server dan tidak ada database.
3. Tidak ada kolaborasi, komentar, atau notifikasi.
4. Tidak ada sinkronisasi antar perangkat. Data di HP dan di laptop berdiri sendiri.

> Catatan penting: karena data disimpan di dalam browser, data bisa hilang jika riwayat browser dibersihkan atau aplikasi dibuka dalam mode penyamaran (incognito). Karena itu fitur cadangan (ekspor) di bagian 5.7 dibuat wajib ada.

---

## 3. Istilah yang Dipakai

| Istilah | Arti sederhana |
|---|---|
| Papan (board) | Satu halaman kerja yang berisi kumpulan kolom |
| Kolom (list) | Tahapan pekerjaan, contoh: Rencana, Dikerjakan, Selesai |
| Kartu (card) | Satu tugas atau catatan |
| Label | Penanda warna untuk mengelompokkan kartu |
| Local storage | Tempat penyimpanan kecil di dalam browser, mirip laci pribadi |

---

## 4. Alur Pemakaian

1. Pengguna membuka aplikasi. Jika baru pertama kali, aplikasi langsung menyiapkan satu papan contoh berisi tiga kolom.
2. Pengguna menekan tombol tambah di kolom mana pun, mengetik judul tugas, lalu menekan Enter.
3. Kartu muncul di kolom tersebut.
4. Pengguna menggeser kartu ke kolom lain ketika status pekerjaannya berubah.
5. Pengguna menekan kartu untuk membuka detail: catatan, label, tanggal target, dan daftar centang.
6. Semua perubahan langsung tersimpan otomatis. Tidak ada tombol "Simpan".

---

## 5. Daftar Fitur

### 5.1 Papan
1. Minimal satu papan, maksimal beberapa papan yang bisa diganti lewat menu pilihan di bagian atas.
2. Papan bisa diberi nama dan diganti namanya.
3. Papan bisa dihapus dengan konfirmasi terlebih dahulu.

### 5.2 Kolom
1. Tambah kolom baru.
2. Ganti nama kolom dengan cara menekan judulnya langsung.
3. Ubah urutan kolom dengan cara digeser.
4. Hapus kolom. Jika masih ada kartu di dalamnya, tampilkan konfirmasi.
5. Tampilkan jumlah kartu di sebelah nama kolom.
6. Opsional: batas jumlah kartu per kolom (WIP limit). Jika melebihi, warna judul kolom berubah sebagai pengingat halus, bukan larangan.

### 5.3 Kartu
1. Tambah cepat: cukup ketik judul, sisanya bisa diisi belakangan.
2. Detail kartu berisi:
   - Judul
   - Catatan (mendukung tulisan beberapa baris)
   - Label warna (boleh lebih dari satu)
   - Tanggal target
   - Daftar centang (checklist) beserta indikator kemajuan
3. Ubah urutan kartu di dalam satu kolom.
4. Pindah kartu antar kolom.
5. Duplikat kartu.
6. Arsipkan kartu (disembunyikan tapi tidak terhapus) dan hapus permanen.

### 5.4 Memindahkan Kartu
1. Di komputer: geser dan lepas (drag and drop) menggunakan mouse.
2. Di HP dan tablet: tekan agak lama lalu geser. Sediakan juga cara cadangan berupa menu "Pindahkan ke..." di dalam kartu, karena menggeser di layar kecil sering meleset.
3. Sediakan pula cara lewat papan ketik: pilih kartu, lalu gunakan tombol panah dengan penekan tombol tertentu.

### 5.5 Pencarian dan Penyaringan
1. Kotak pencarian berdasarkan judul dan isi catatan.
2. Saring berdasarkan label.
3. Saring kartu yang tanggal targetnya sudah lewat atau jatuh tempo hari ini.

### 5.6 Tampilan
1. Mode terang dan mode gelap, mengikuti pengaturan perangkat, tetapi bisa diganti manual.
2. Pilihan tema warna (minimal tiga pilihan) agar terasa personal.
3. Animasi ringan saat kartu dipindahkan, tidak berlebihan.

### 5.7 Cadangan Data
1. Ekspor seluruh data ke satu berkas JSON.
2. Impor kembali dari berkas JSON, dengan pilihan: gabungkan atau ganti seluruhnya.
3. Tombol "Hapus semua data" dengan konfirmasi ganda.
4. Pengingat sederhana: jika data belum pernah diekspor selama 30 hari, tampilkan saran halus di pojok layar.

---

## 6. Kebutuhan Tampilan

### 6.1 Prinsip rasa
1. Ramah, bukan formal. Gunakan sudut membulat, bayangan lembut, dan jarak antar elemen yang lapang.
2. Unik tapi tidak mengganggu. Ciri khas cukup datang dari satu atau dua hal saja, misalnya bentuk kartu yang menyerupai kertas tempel dan pilihan huruf yang berkarakter.
3. Isi kartu harus tetap mudah dibaca. Hiasan tidak boleh mengalahkan tulisan.
4. Keadaan kosong (belum ada kartu) diisi ilustrasi atau kalimat pendek yang mengajak, bukan halaman putih polos.

### 6.2 Perilaku di tiap ukuran layar

| Ukuran layar | Perilaku |
|---|---|
| HP (di bawah 640 px) | Satu kolom tampil penuh layar. Pindah kolom dengan geser ke kiri/kanan. Ada indikator titik di bawah menunjukkan posisi kolom. Tombol tambah mengambang di pojok kanan bawah. |
| Tablet (640–1024 px) | Dua sampai tiga kolom terlihat bersamaan, sisanya digeser mendatar. |
| Komputer (di atas 1024 px) | Semua kolom terlihat mendatar dengan gulir horizontal. Detail kartu dibuka sebagai panel di sisi kanan, bukan jendela penuh. |

### 6.3 Kemudahan pakai
1. Area yang bisa ditekan minimal 44 × 44 piksel agar nyaman di layar sentuh.
2. Perbedaan warna teks dan latar mengikuti standar keterbacaan (rasio minimal 4.5:1).
3. Warna label selalu disertai nama label, supaya tetap terbaca oleh pengguna yang sulit membedakan warna.
4. Bisa dijalankan penuh dengan papan ketik.

---

## 7. Kebutuhan Teknis

### 7.1 Susunan teknologi yang disarankan
1. Satu berkas `index.html` yang berisi HTML, CSS, dan JavaScript sekaligus, supaya mudah dibuka langsung tanpa proses pemasangan.
2. Tanpa kerangka kerja besar. JavaScript biasa sudah cukup untuk kebutuhan sebesar ini.
3. Jika nanti berkembang, baru dipecah menjadi beberapa berkas atau dipindah ke React.

### 7.2 Cara penyimpanan
1. Gunakan `localStorage` dengan satu kunci utama, misalnya `minikanban.v1`.
2. Simpan seluruh isi aplikasi sebagai satu objek JSON.
3. Penyimpanan dilakukan dengan jeda singkat (sekitar 300 milidetik setelah perubahan terakhir) agar tidak menulis terlalu sering.
4. Sertakan nomor versi data, supaya nanti mudah dipindahkan bila strukturnya berubah.
5. Jika data gagal dibaca atau rusak, jangan langsung menimpanya. Simpan salinan yang rusak ke kunci cadangan lalu mulai dari papan kosong dengan pemberitahuan.

### 7.3 Bentuk data

```json
{
  "version": 1,
  "activeBoardId": "b1",
  "settings": {
    "theme": "auto",
    "accent": "hijau",
    "lastExportAt": "2026-09-14T08:00:00.000Z"
  },
  "labels": [
    { "id": "l1", "name": "Penting", "color": "#E8584F" },
    { "id": "l2", "name": "Belajar", "color": "#3B82F6" }
  ],
  "boards": [
    {
      "id": "b1",
      "title": "Pekerjaan Pribadi",
      "createdAt": "2026-09-14T08:00:00.000Z",
      "columns": [
        {
          "id": "c1",
          "title": "Rencana",
          "wipLimit": null,
          "cards": [
            {
              "id": "k1",
              "title": "Susun jadwal minggu ini",
              "notes": "Fokus ke tiga hal utama.",
              "labelIds": ["l1"],
              "dueDate": "2026-09-17",
              "checklist": [
                { "id": "ck1", "text": "Tulis daftar", "done": true }
              ],
              "archived": false,
              "createdAt": "2026-09-14T08:01:00.000Z",
              "updatedAt": "2026-09-14T08:01:00.000Z"
            }
          ]
        }
      ]
    }
  ]
}
```

### 7.4 Kinerja
1. Aplikasi siap dipakai kurang dari 1 detik setelah dibuka.
2. Tetap lancar sampai sekitar 500 kartu dalam satu papan.
3. Ukuran berkas total di bawah 300 KB.

### 7.5 Dukungan browser
Chrome, Edge, Firefox, dan Safari versi dua tahun terakhir, di komputer maupun HP.

---

## 8. Kriteria Selesai

Versi pertama dianggap selesai jika seluruh hal berikut terpenuhi:

1. Bisa membuat, mengubah, memindahkan, dan menghapus kartu serta kolom.
2. Data tetap ada setelah browser ditutup dan dibuka kembali.
3. Memindahkan kartu berjalan baik dengan mouse maupun sentuhan jari.
4. Tampilan rapi di lebar layar 360 px, 768 px, dan 1440 px.
5. Ekspor dan impor JSON berfungsi bolak-balik tanpa kehilangan data.
6. Mode gelap berfungsi dan tulisan tetap terbaca.

---

## 9. Rencana Pengembangan

| Tahap | Isi |
|---|---|
| Tahap 1 | Papan, kolom, kartu, geser-pindah, penyimpanan lokal, tampilan responsif |
| Tahap 2 | Label, tanggal target, daftar centang, pencarian dan penyaringan |
| Tahap 3 | Banyak papan, arsip, tema warna, ekspor dan impor |
| Tahap 4 | Dijadikan aplikasi terpasang (PWA) agar bisa dibuka tanpa internet dan muncul ikon di layar utama |
| Tahap 5 (jika perlu) | Sinkronisasi antar perangkat, yang berarti butuh server dan akun |

---

## 10. Usulan Nama Aplikasi

### 1. Papanku
Berasal dari kata "papan" ditambah akhiran "-ku" yang berarti milik saya. Namanya langsung menjelaskan bentuk aplikasinya (papan kanban) sekaligus menegaskan sifatnya yang pribadi, sesuai dengan data yang disimpan hanya di perangkat sendiri. Mudah diucapkan, mudah diingat, dan terasa hangat, bukan seperti nama perangkat lunak kantor.

### 2. Lajur
"Lajur" berarti jalur atau kolom memanjang, yaitu bentuk dasar dari papan kanban. Namanya pendek, satu kata, dan terdengar bersih. Cocok untuk aplikasi yang ingin tampil sederhana namun punya karakter. Kelebihannya: nama ini jarang dipakai, jadi terasa unik.

### 3. Tempel
Mengambil gambaran kertas tempel (sticky note) yang ditempelkan di papan. Nama ini langsung memberi bayangan tampilan yang ingin dibuat: kartu berwarna seperti kertas catatan. Kesannya santai dan akrab, sangat cocok dengan permintaan tampilan yang ramah.

### 4. Kanbito
Gabungan dari "kanban" dan akhiran "-ito" yang dalam beberapa bahasa berarti kecil atau mungil. Artinya kurang lebih "kanban mungil", persis menggambarkan aplikasi mini ini. Terdengar main-main dan bersahabat, mudah dijadikan maskot atau ikon, serta enak dibaca oleh pengguna Indonesia maupun asing.

### 5. Alur
Berarti urutan atau perjalanan sebuah pekerjaan dari awal sampai selesai. Nama ini menekankan manfaat aplikasi, bukan sekadar bentuknya: membantu pekerjaan mengalir dari satu tahap ke tahap berikutnya. Cocok jika nanti aplikasi berkembang lebih dari sekadar papan kanban.

### Ringkasan pembanding

| Nama | Kesan | Paling cocok bila ingin menonjolkan |
|---|---|---|
| Papanku | Hangat, personal | Sifat pribadi dan kepemilikan data |
| Lajur | Bersih, minimalis | Kesederhanaan tampilan |
| Tempel | Santai, akrab | Nuansa kertas catatan berwarna |
| Kanbito | Lucu, mungil | Karakter unik dan ikon maskot |
| Alur | Tenang, dewasa | Manfaat dan kemungkinan berkembang |

Saran: jika nama akan dipakai untuk domain atau dibagikan ke orang lain, periksa dulu ketersediaan nama tersebut sebelum dipakai tetap.
