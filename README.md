# Laravel Voucher Abuse Demo

Mini project Laravel ini dibuat untuk memperagakan dua skenario:

- `Tidak Aman`
- `Sudah Diamankan`

Keduanya mengikuti laporan tentang kerentanan `voucher abuse` pada sistem e-commerce.

## Menjalankan aplikasi

```powershell
php artisan serve
```

Buka:

```text
http://127.0.0.1:8000
```

## Isi demo

- penambahan promo tanpa kontrol vs dengan trust boundary admin
- pembelian dengan stacking dan reuse voucher vs pembelian dengan invariant domain
- state machine `UNUSED -> VALIDATED -> APPLIED -> COMPLETED`
- validasi eligibility user dan pembatasan usage voucher

## Demo aman

- role: `admin`
- pin: `SAFEADMIN`
"# pengkodean-aman-mini-project" 
