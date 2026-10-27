# Product Requirements Document (PRD)

## BizFlow --- Multi-Brand Business & Finance Management Web App

**Dokumen:** PRD untuk implementasi awal melalui Google AI Studio\
**Status:** Draft awal untuk MVP\
**Bahasa antarmuka:** Bahasa Indonesia\
**Platform:** Web app responsif (desktop, tablet, dan mobile)

------------------------------------------------------------------------

## 1. Ringkasan Produk

BizFlow adalah platform web untuk mengelola keuangan, operasional, dan
perkembangan beberapa brand dalam satu aplikasi. Sistem menggunakan
fondasi yang sama untuk seluruh brand, tetapi fitur tracking dapat
disesuaikan berdasarkan kategori dan kebutuhan masing-masing bisnis.

Aplikasi memiliki tiga jenis akun: 1. **Ika** --- hanya dapat mengakses
brand Tirama dan CHEMI. 2. **Redi** --- hanya dapat mengakses brand BYE,
Metamorph, dan Presta Media. 3. **Admin Baliyoutevolution** --- dapat
melihat alur kas dan laporan Ika serta Redi untuk kebutuhan
transparansi, tetapi bersifat **read-only** dan tidak boleh menambah,
mengubah, atau menghapus data keuangan.

Login dilakukan menggunakan email dan kata sandi. Sistem menentukan
dashboard dan hak akses berdasarkan akun yang telah terdaftar, bukan
berdasarkan pilihan nama pengguna yang dapat dipilih bebas.

> Nama "BizFlow" adalah nama kerja sementara dan dapat diganti.

## 2. Tujuan Produk

-   Menyatukan pencatatan keuangan dan tracking bisnis beberapa brand
    dalam satu web app.
-   Memudahkan pemantauan saldo, pemasukan, pengeluaran, pembelian, dan
    performa bisnis.
-   Menyesuaikan tracking dengan jenis bisnis, produk, dan operasional
    setiap brand.
-   Menyediakan modul tambahan yang dapat diaktifkan sesuai kebutuhan
    pengguna.
-   Menyediakan laporan yang dapat diekspor ke Excel.
-   Menyediakan transparansi bagi admin yang ditunjuk tanpa memberi
    akses edit keuangan.
-   Mengurangi pencatatan ganda dan membantu menjaga konsistensi data.

## 3. Prinsip Produk

1.  **Satu platform, banyak brand.** Semua brand menggunakan fondasi
    data dan sistem keuangan yang konsisten.
2.  **Privasi berdasarkan akun.** Ika dan Redi tidak dapat melihat data
    privat satu sama lain.
3.  **Admin transparansi hanya melihat.** Admin dapat memeriksa data
    yang diizinkan, tetapi tidak dapat mengubah data client.
4.  **Modular.** Pengguna dapat mengaktifkan atau menonaktifkan modul
    tambahan di ruang kerja sendiri.
5.  **Tracking menyesuaikan bisnis.** Kategori bisnis menentukan
    rekomendasi field, kategori transaksi, dan modul yang relevan;
    pengguna dapat menyesuaikannya.
6.  **Data keuangan dapat diaudit.** Transaksi memiliki identitas
    pembuat dan riwayat perubahan.
7.  **Database sebagai sumber utama.** Excel digunakan untuk ekspor atau
    integrasi, bukan sebagai sumber saldo utama.
8.  **Responsif dan mudah digunakan.** Navigasi jelas, formulir efisien,
    dan dashboard tidak terlalu padat.

## 4. Peran dan Hak Akses

### 4.1 Ika --- Client

Brand yang dapat diakses: - Tirama - CHEMI

Hak akses: - Melihat dan mengelola dashboard serta data keuangan brand
miliknya. - Menambah pemasukan, pengeluaran, pembelian, transfer, dan
transaksi lainnya. - Mengelola produk, kategori, aset, dan sumber dana
untuk brand miliknya. - Melihat laporan, statistik, notifikasi, dan
riwayat transaksi. - Mengekspor data ke Excel. - Mengaktifkan atau
menonaktifkan modul tambahan di ruang kerja miliknya. - Mengatur
kategori bisnis dan konfigurasi tracking brand sesuai izin.

Tidak dapat mengakses data privat Redi.

### 4.2 Redi --- Client

Brand yang dapat diakses: - BYE - Metamorph - Presta Media

Hak akses sama seperti Ika, tetapi terbatas pada brand milik Redi.

Tidak dapat mengakses data privat Ika.

### 4.3 Admin Baliyoutevolution --- Read-only

Hak akses: - Melihat ringkasan alur kas Ika dan Redi. - Membuka detail
transaksi, kategori, brand, saldo, dan laporan yang diizinkan. -
Memfilter laporan berdasarkan pengguna, brand, tanggal, dan jenis
transaksi. - Melihat perbandingan atau ringkasan gabungan dengan tetap
membedakan saldo setiap client. - Mengekspor laporan transparansi jika
diizinkan oleh konfigurasi sistem. - Melihat log akses admin.

Larangan: - Tidak dapat menambah, mengubah, atau menghapus transaksi. -
Tidak dapat mengubah saldo, kategori, aset, konfigurasi, atau data brand
milik client. - Tidak dapat mengaktifkan fitur pada workspace client. -
Tidak dapat menyamar sebagai Ika atau Redi. - Tidak dapat mengubah atau
menghapus audit log.

Hak read-only wajib diterapkan di backend/database, bukan sekadar
menyembunyikan tombol pada UI.

### 4.4 Pendaftaran dan login

-   Login dengan email dan kata sandi.
-   Akun dibuat atau disetujui oleh mekanisme administrasi yang aman.
-   Email terdaftar dipetakan ke peran dan workspace yang sesuai.
-   Akun yang tidak terdaftar atau tidak aktif ditolak.
-   Sediakan logout dan alur pemulihan kata sandi.
-   Jangan menggunakan email hardcoded sebagai satu-satunya mekanisme
    keamanan di frontend.

## 5. Struktur Brand Awal

  Pemilik   Brand          Keterangan
  --------- -------------- -------------------------------------
  Ika       Tirama         Kategori bisnis dapat dikonfigurasi
  Ika       CHEMI          Handmade keepsake jewelry/aksesori
  Redi      BYE            Youth event/program
  Redi      Metamorph      Kategori bisnis dapat dikonfigurasi
  Redi      Presta Media   Media/promosi/talent platform

Sistem harus memungkinkan brand dan kategori bisnis ditambahkan di masa
depan melalui alur administrasi yang aman.

## 6. Kategori Bisnis dan Tracking Dinamis

Saat membuat atau mengatur brand, pengguna memilih kategori bisnis.
Contoh kategori awal: - Aksesori/perhiasan handmade - Fashion -
Skincare/kecantikan - Retail/reseller - Workshop/kursus -
Event/organisasi - Media/marketing/agency - Jasa/proyek - Lainnya/custom

Kategori digunakan untuk merekomendasikan modul dan field yang relevan,
bukan untuk mengunci sistem secara kaku.

### 6.1 Contoh konfigurasi kategori aksesori/perhiasan

Field dan modul yang disarankan: - Produk dan variasi - Bahan baku -
Pembelian bahan - Stok bahan dan produk jadi - Biaya produksi - HPP per
produk - Harga jual - Diskon - Komisi penjualan - Biaya kemasan - Biaya
pengiriman - Pendapatan penjualan - Laba kotor dan margin

### 6.2 Contoh kategori event

Field dan modul yang disarankan: - Nama event/proyek - Anggaran dan
realisasi biaya - Sponsor dan pemasukan sponsor - Penjualan tiket -
Venue dan vendor - Perlengkapan - Honorarium/komisi - Biaya promosi -
Pendapatan, biaya, dan hasil akhir per event

### 6.3 Contoh kategori media/marketing

Field dan modul yang disarankan: - Klien/proyek - Pendapatan jasa -
Biaya operasional - Anggaran marketing - Kanal pemasaran - Kampanye -
Leads dan konversi - Biaya per lead - ROAS/ROI jika data tersedia

### 6.4 Kategori dan field custom

Pengguna dapat menambah kategori transaksi dan field custom yang
relevan, dengan validasi agar field keuangan penting seperti nominal,
tanggal, brand, jenis transaksi, dan sumber dana tetap terstruktur.

## 7. Modul Inti

### 7.1 Dashboard

Tampilkan: - Saldo total brand yang dimiliki pengguna. - Saldo per
brand. - Total pemasukan, pengeluaran, dan selisih arus kas untuk
periode terpilih. - Grafik pemasukan vs pengeluaran. - Transaksi
terbaru. - Kategori pengeluaran terbesar. - Notifikasi dan peringatan. -
Filter tanggal dan brand.

Dashboard admin menampilkan data Ika dan Redi secara terpisah, serta
ringkasan gabungan bila relevan. Hindari menyamakan uang kedua client
sebagai satu kas.

### 7.2 Transaksi Keuangan

Jenis transaksi: - Pemasukan - Pengeluaran - Pembelian - Transfer
antar-aset/kas - Pengembalian dana/refund - Penyesuaian saldo dengan
alasan dan audit trail

Field transaksi minimum: - Tanggal dan waktu - Pemilik/workspace -
Brand - Jenis transaksi - Kategori - Produk/proyek terkait (opsional) -
Deskripsi - Nominal - Sumber dana/aset - Metode pembayaran - Pihak
terkait/vendor/pelanggan (opsional) - Bukti transaksi (opsional) -
Catatan - Pembuat dan waktu pembuatan - Riwayat perubahan

Aturan: - Semua nominal disimpan sebagai angka desimal/tipe uang yang
aman, bukan teks berformat. - Validasi nominal harus lebih besar dari
nol kecuali transaksi penyesuaian yang dirancang khusus. - Transfer
antar-aset mengurangi saldo sumber dan menambah saldo tujuan, bukan
dihitung sebagai pemasukan/pengeluaran bisnis. - Refund dan pembatalan
harus mempertahankan jejak transaksi. - Mengedit atau menghapus
transaksi harus tercatat pada audit log; utamakan soft delete atau
reversal untuk data keuangan. - Saldo dihitung dari saldo awal ditambah
pemasukan, dikurangi pengeluaran, serta mutasi aset yang valid.

### 7.3 Aset dan Sumber Dana

Jenis aset: - Kas tunai - Rekening bank - E-wallet - Kartu/akun
pembayaran - Aset lain yang dapat dikonfigurasi

Fitur: - Saldo awal dan saldo berjalan. - Riwayat mutasi. - Transfer
antar-aset. - Rekonsiliasi saldo manual dengan catatan alasan. -
Pemisahan aset per brand; transfer antar-brand harus dicatat sebagai
transaksi keluar dan masuk yang saling terkait jika memang terjadi.

### 7.4 Produk, Kategori, dan Stok

-   Daftar produk dan layanan per brand.
-   Kategori dan variasi produk.
-   Harga jual.
-   Bahan baku dan biaya terkait.
-   Stok masuk, stok keluar, dan penyesuaian stok.
-   Riwayat pembelian dan pemasok.
-   Modul stok dapat dinonaktifkan jika tidak relevan.
-   Stok tidak boleh diwajibkan untuk brand jasa atau event yang tidak
    membutuhkannya.

### 7.5 HPP (Harga Pokok Produksi/Penjualan)

Untuk produk yang relevan, dukung: - Bahan baku per produk. - Kuantitas
dan biaya bahan. - Tenaga kerja langsung. - Kemasan dan biaya produksi
langsung lain. - Alokasi overhead yang opsional. - HPP per unit. - Harga
jual, laba kotor, dan margin.

Gunakan rumus yang sesuai konfigurasi produk. Jangan menganggap seluruh
pengeluaran bisnis sebagai HPP. Pisahkan HPP, biaya operasional, biaya
marketing, komisi, dan biaya lain.

### 7.6 Komisi

-   Pencatatan komisi berdasarkan transaksi, penjualan, proyek, atau
    aturan persentase.
-   Mendukung nominal tetap maupun persentase.
-   Menyimpan penerima, dasar perhitungan, nilai, status pembayaran, dan
    tanggal.
-   Komisi yang belum dibayar ditampilkan sebagai kewajiban, bukan
    langsung mengurangi kas jika belum dibayar.
-   Cegah komisi dihitung dua kali untuk transaksi yang sama.

### 7.7 Lembar Kerja / Worksheet

Pengguna dapat membuat lembar kerja untuk tracking yang lebih khusus
tanpa harus membangun aplikasi terpisah.

Kemampuan awal: - Membuat worksheet dengan nama, deskripsi, brand,
periode, dan status. - Memilih template worksheet. - Menambahkan kolom
sederhana: teks, angka, mata uang, tanggal, pilihan, checkbox, dan
status. - Menghubungkan worksheet dengan transaksi, produk, kampanye
marketing, atau proyek jika relevan. - Filter, pencarian, pengurutan,
dan ringkasan. - Menyimpan konfigurasi worksheet per
pengguna/workspace. - Menentukan apakah worksheet hanya untuk tracking
atau juga memengaruhi data keuangan.

Aturan penting: - Worksheet custom tidak otomatis mengubah saldo. -
Hanya transaksi keuangan yang valid yang memengaruhi saldo. - Jika
worksheet mengirim data keuangan, gunakan pemetaan eksplisit dan
validasi sebelum membuat transaksi. - Untuk MVP, sediakan template dasar
dan kolom custom sederhana; jangan membangun no-code builder kompleks
sebelum fondasi stabil.

Contoh worksheet: - Tracking produksi - Tracking proyek/event - Daftar
pembayaran - Target penjualan - Tracking stok - Daftar tugas
operasional - Tracking klien

### 7.8 Marketing Tracking

Sediakan modul marketing yang dapat diaktifkan sesuai kebutuhan: - Nama
kampanye - Brand dan proyek terkait - Kanal: Instagram, TikTok, Google,
referral, event, dan custom - Periode kampanye - Anggaran yang
direncanakan - Pengeluaran aktual - Leads - Konversi -
Penjualan/pendapatan yang teratribusi - Cost per lead (CPL) - Conversion
rate - ROAS/ROI jika data pendukung tersedia - Catatan dan status
kampanye

Rumus yang digunakan harus dijelaskan: - CPL = biaya marketing / jumlah
leads, jika leads \> 0. - Conversion rate = jumlah konversi / jumlah
leads × 100%, jika leads \> 0. - ROAS = pendapatan yang teratribusi /
biaya iklan, jika biaya iklan \> 0. - ROI = (hasil bersih yang dapat
diatribusikan - biaya investasi) / biaya investasi × 100%, jika biaya
investasi \> 0.

Bedakan ROAS dari ROI. Jangan tampilkan angka performa yang menyesatkan
jika data belum lengkap. Pengeluaran marketing yang dibayar harus
tercatat sebagai transaksi keuangan atau terhubung ke transaksi agar
tidak terjadi pencatatan ganda.

### 7.9 Laporan dan Statistik

-   Laporan arus kas.
-   Laporan pemasukan dan pengeluaran.
-   Ringkasan laba kotor dan laba operasional jika data memadai.
-   Laporan per brand, kategori, produk, proyek, dan periode.
-   Laporan HPP dan margin.
-   Laporan komisi.
-   Laporan marketing.
-   Perbandingan anggaran vs realisasi.
-   Filter harian, mingguan, bulanan, tahunan, dan rentang tanggal.
-   Grafik dan tabel yang bisa difilter.

Jangan menyebut selisih pemasukan-pengeluaran sebagai laba bersih jika
HPP, kewajiban, dan biaya lain belum diperhitungkan secara lengkap.

### 7.10 Ekspor Excel

-   Ekspor `.xlsx` berdasarkan brand, periode, kategori, dan jenis
    laporan.
-   Ekspor daftar transaksi dan ringkasan.
-   Ekspor produk/stok, HPP, komisi, worksheet, dan marketing jika modul
    terkait aktif.
-   Admin dapat mengekspor laporan transparansi sesuai izin.
-   Pastikan ekspor mengikuti hak akses yang sama dengan tampilan
    aplikasi.
-   Gunakan database sebagai sumber data utama.

Sinkronisasi otomatis ke Excel Online dapat menjadi tahap lanjutan dan
bukan syarat MVP.

### 7.11 Notifikasi

Contoh notifikasi: - Saldo di bawah batas minimum. - Transaksi baru. -
Pengeluaran melebihi ambang batas. - Tagihan atau komisi mendekati jatuh
tempo. - Stok rendah jika modul stok aktif. - Kampanye mendekati batas
anggaran. - Target worksheet atau proyek mendekati tenggat.

Notifikasi harus menghormati hak akses. Ika tidak boleh menerima
notifikasi yang membocorkan data privat Redi, dan sebaliknya.

### 7.12 Modul Tambahan

Setiap client dapat mengaktifkan/menonaktifkan modul yang tersedia di
ruang kerja sendiri, misalnya: - Manajemen stok - Kalender pembayaran -
Manajemen proyek - Tracking tugas - Anggaran dan target - Manajemen
pelanggan/klien - Marketing - HPP - Komisi

Fitur inti keuangan, autentikasi, dan keamanan tidak dapat dihapus.
Konfigurasi modul Ika dan Redi harus independen.

## 8. Struktur Navigasi

### Client (Ika/Redi)

Sidebar desktop: 1. Dashboard 2. Transaksi 3. Produk & Kategori 4. Stok
(jika aktif) 5. Aset 6. HPP (jika aktif) 7. Komisi (jika aktif) 8.
Lembar Kerja 9. Marketing (jika aktif) 10. Laporan 11. Notifikasi 12.
Pengaturan 13. Brand Saya

Navigasi dapat disesuaikan agar modul nonaktif tidak tampil di sidebar.

### Admin Baliyoutevolution

Sidebar: 1. Dashboard Transparansi 2. Alur Kas Ika 3. Alur Kas Redi 4.
Laporan Gabungan 5. Riwayat Akses 6. Pengaturan akun admin

Admin tidak mendapat menu edit transaksi, produk, aset, atau konfigurasi
client.

## 9. Desain UI/UX

Gunakan referensi visual yang diberikan pengguna: - Nuansa ungu,
lavender, dan putih. - Sidebar ungu tua. - Latar putih atau lavender
sangat muda. - Card membulat dengan bayangan lembut. - Grafik
garis/batang/donut. - Tabel data modern dengan filter dan pencarian. -
Ikon minimalis dan konsisten. - Tipografi jelas dan hierarki visual
kuat. - Dashboard padat informasi tetapi tetap mudah dipindai. -
Responsif untuk desktop, tablet, dan ponsel. - Bahasa antarmuka Bahasa
Indonesia. - Gunakan warna status secara konsisten: pemasukan,
pengeluaran, peringatan, dan status selesai. - Hindari meniru logo atau
identitas merek pihak lain; nama BizFlow sementara dan dapat diganti.

Halaman utama yang perlu dibuat: 1. Login. 2. Dashboard Ika. 3.
Dashboard Redi. 4. Dashboard transparansi admin. 5. Daftar transaksi. 6.
Form tambah/edit transaksi. 7. Produk dan kategori bisnis. 8. Aset dan
sumber dana. 9. HPP. 10. Komisi. 11. Worksheet. 12. Marketing. 13.
Laporan dan ekspor Excel. 14. Notifikasi. 15. Pengaturan brand dan
modul.

## 10. Model Data Tingkat Tinggi

Entitas yang disarankan: - `users`: identitas pengguna, email, status,
dan role. - `workspaces`: ruang kerja client. - `workspace_members`:
pemetaan pengguna ke workspace dan hak akses. - `brands`: brand milik
workspace. - `business_categories`: daftar kategori bisnis. -
`brand_settings`: kategori dan konfigurasi brand. - `modules` dan
`workspace_modules`: katalog modul dan modul yang diaktifkan. -
`transactions`: catatan transaksi. - `transaction_audit_logs`: riwayat
perubahan transaksi. - `assets`: kas, bank, e-wallet, dan sumber dana. -
`asset_movements`: mutasi aset. - `products` dan `product_variants`:
produk/layanan. - `inventory_movements`: mutasi stok. - `materials` dan
`product_recipes`: bahan dan komposisi produk. - `commissions`: data
komisi. - `worksheets`, `worksheet_columns`, `worksheet_rows`:
konfigurasi dan isi lembar kerja. - `marketing_campaigns`: kampanye. -
`marketing_metrics`: metrik dan hasil kampanye. - `projects`:
proyek/event jika modul aktif. - `notifications`: notifikasi. -
`file_attachments`: bukti transaksi dan lampiran. - `audit_logs`:
aktivitas keamanan dan akses. - `export_jobs`: riwayat ekspor jika
diperlukan.

Setiap tabel yang berisi data privat harus memiliki hubungan kepemilikan
workspace/client yang jelas. Validasi akses dilakukan pada setiap
request dan operasi database.

## 11. Keamanan dan Privasi

-   Gunakan autentikasi nyata, bukan simulasi frontend saja.
-   Gunakan penyimpanan kata sandi yang aman melalui penyedia
    autentikasi; jangan menyimpan password sebagai teks biasa.
-   Terapkan role-based access control dan aturan akses database.
-   Terapkan isolasi workspace: Ika hanya mengakses workspace Ika, Redi
    hanya workspace Redi.
-   Admin hanya memiliki izin baca untuk data yang secara eksplisit
    diizinkan.
-   Validasi hak akses di server untuk membaca, menambah, mengubah,
    menghapus, dan mengekspor data.
-   Jangan menaruh secret/API key di kode frontend.
-   Audit perubahan transaksi, konfigurasi akses, dan aktivitas admin.
-   Gunakan soft delete/reversal untuk data keuangan agar histori tetap
    tersedia.
-   Lampiran harus memiliki kontrol akses dan tidak menggunakan URL
    publik permanen untuk dokumen sensitif.
-   Sediakan logout, pemulihan akun, dan penanganan sesi.
-   Jangan menggunakan data contoh sebagai saldo nyata; tandai jelas
    sebagai demo.
-   Jangan memberi admin kemampuan impersonasi tanpa proses terpisah dan
    audit eksplisit.

## 12. Integritas Keuangan dan Rumus

Definisi dasar: - Saldo aset = saldo awal + pemasukan ke aset -
pengeluaran dari aset + transfer masuk - transfer keluar. - Arus kas
bersih periode = total arus kas masuk - total arus kas keluar, dengan
transfer internal dikecualikan dari total pemasukan/pengeluaran
bisnis. - Laba kotor = pendapatan penjualan - HPP, apabila pendapatan
dan HPP tersedia. - Margin kotor = laba kotor / pendapatan penjualan ×
100%, jika pendapatan \> 0.

Ketentuan: - Jangan menghitung transfer internal sebagai pendapatan atau
biaya bisnis. - Pisahkan transaksi yang sudah dibayar dan kewajiban yang
belum dibayar. - Hindari duplikasi transaksi saat menghubungkan
marketing, komisi, pembelian, atau stok ke keuangan. - Gunakan satu
transaksi keuangan sebagai sumber nominal aktual, lalu tautkan modul
lain kepadanya. - Jelaskan asumsi perhitungan pada laporan.

## 13. Ruang Lingkup MVP

Prioritas implementasi tahap pertama: 1. Login email dan kata sandi
dengan role yang benar. 2. Isolasi data Ika, Redi, dan akses read-only
admin. 3. Manajemen brand. 4. Dashboard dengan ringkasan saldo dan
grafik dasar. 5. Pemasukan, pengeluaran, pembelian, dan transfer. 6.
Aset/sumber dana. 7. Kategori bisnis dan kategori transaksi. 8. Produk
sederhana. 9. Laporan dasar. 10. Ekspor Excel. 11. Notifikasi dasar. 12.
Modul tambahan yang dapat diaktifkan per workspace. 13. Tampilan
responsif dengan desain ungu/lavender.

Tahap berikutnya: - Stok lengkap. - HPP dan komposisi bahan. - Komisi. -
Worksheet custom yang lebih fleksibel. - Marketing tracking lanjutan. -
Proyek/event. - Sinkronisasi Excel Online. - Integrasi eksternal
lainnya.

HPP, komisi, worksheet, dan marketing tetap harus masuk ke rancangan
arsitektur awal agar dapat ditambahkan tanpa membangun ulang fondasi,
meskipun beberapa modul dikembangkan bertahap.

## 14. Kriteria Penerimaan

MVP dianggap memenuhi kebutuhan awal jika: - Login Ika membawa pengguna
ke workspace Ika. - Login Redi membawa pengguna ke workspace Redi. -
Akun tidak terdaftar tidak dapat masuk. - Ika tidak dapat membaca atau
mengubah data privat Redi melalui URL/API/database. - Redi tidak dapat
membaca atau mengubah data privat Ika. - Admin dapat membaca alur kas
kedua client tetapi semua operasi mutasi ditolak oleh
backend/database. - Transaksi pemasukan, pengeluaran, pembelian, dan
transfer memperbarui saldo dengan benar. - Transfer internal tidak
menambah pendapatan atau pengeluaran bisnis. - Filter brand dan periode
bekerja. - Ekspor Excel sesuai filter dan hak akses. - Modul yang
diaktifkan untuk Ika tidak otomatis aktif untuk Redi. - Data demo diberi
label dan tidak bercampur dengan data nyata. - Tampilan dapat digunakan
di desktop dan ponsel. - Kesalahan input menampilkan pesan yang jelas.

## 15. Instruksi Implementasi untuk Google AI Studio

Bangun aplikasi secara bertahap, dengan urutan: 1. Buat struktur halaman
dan design system berdasarkan referensi visual. 2. Buat navigasi, login,
role, dan workspace. 3. Implementasikan database dan kontrol akses. 4.
Implementasikan transaksi dan perhitungan saldo. 5. Tambahkan laporan
dan ekspor Excel. 6. Tambahkan modul produk, aset, dan konfigurasi
kategori. 7. Tambahkan modul HPP, komisi, worksheet, stok, dan marketing
secara bertahap. 8. Tambahkan notifikasi dan audit log. 9. Uji isolasi
data dan hak akses untuk semua role.

Jangan hanya membuat mockup statis. Komponen interaktif harus bekerja.
Jika kredensial layanan, database, atau integrasi belum tersedia, buat
struktur integrasi yang jelas dan tandai bagian yang membutuhkan
konfigurasi. Jangan berpura-pura bahwa autentikasi, database,
sinkronisasi, atau ekspor sudah berfungsi jika belum diimplementasikan.

Gunakan data demo yang realistis dan diberi label demo. Pisahkan kode
menjadi komponen yang dapat dirawat, gunakan validasi input, tangani
loading/error/empty states, dan prioritaskan keamanan data keuangan.

## 16. Keputusan yang Masih Dapat Dikonfigurasi

-   Nama final aplikasi dan logo.
-   Email yang terdaftar untuk Ika, Redi, dan admin.
-   Kategori bisnis final untuk Tirama dan Metamorph.
-   Apakah admin boleh mengekspor laporan transparansi.
-   Ambang batas notifikasi saldo dan pengeluaran.
-   Penyedia autentikasi/database.
-   Apakah Excel hanya diekspor atau juga disinkronkan otomatis.
-   Modul tambahan mana yang diaktifkan sejak MVP.

Jangan mengarang kredensial, saldo aktual, data pribadi, atau
konfigurasi integrasi. Gunakan konfigurasi placeholder sampai informasi
resmi disediakan.

------------------------------------------------------------------------

**Arah produk:** satu web app multi-brand, dua workspace client yang
privat, satu admin transparansi read-only, sistem keuangan terpusat per
workspace, dan modul tracking bisnis yang dapat disesuaikan.
