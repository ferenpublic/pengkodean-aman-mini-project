<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>Mini Project Voucher Abuse Laravel</title>
  <link rel="stylesheet" href="{{ asset('demo.css') }}?v={{ filemtime(public_path('demo.css')) }}">
</head>
<body>
  <div class="page-shell" id="page-shell" data-mode="unsafe">
    <header class="hero reveal">
      <div class="hero-copy">
        <p class="eyebrow">Mini Project Pengkodean Aman</p>
        <h1>Simulasi Pembelian dan Penambahan Promo</h1>
        <p class="intro">
          Halaman ini membandingkan dua pendekatan modul voucher e-commerce berdasarkan laporan:
          versi <strong>tidak aman</strong> yang membiarkan abuse promo terjadi, dan versi
          <strong>sudah diamankan</strong> yang memaksa aturan domain sejak awal.
        </p>
      </div>
      <div class="hero-badges">
        <span class="badge badge-danger">Voucher berulang</span>
        <span class="badge badge-danger">Voucher stacking</span>
        <span class="badge badge-danger">User tidak berhak</span>
        <span class="badge badge-safe">State machine</span>
        <span class="badge badge-safe">VoucherUsage</span>
      </div>
    </header>

    <section class="mode-switch reveal" aria-label="Pilih kategori tampilan">
      <div class="mode-switch-copy">
        <p class="spot-label">Pilih Kategori</p>
        <h2>Tampilkan satu skenario dalam satu waktu</h2>
        <p>
          Gunakan tombol ini untuk berpindah antara demonstrasi sistem voucher yang tidak aman
          dan sistem voucher yang sudah diamankan.
        </p>
      </div>
      <div class="mode-switch-actions">
        <button type="button" class="mode-button mode-button-danger is-active" id="toggle-unsafe" data-target-mode="unsafe" aria-pressed="true">
          Mode Tidak Aman
        </button>
        <button type="button" class="mode-button mode-button-safe" id="toggle-safe" data-target-mode="safe" aria-pressed="false">
          Mode Aman Sesuai Laporan
        </button>
      </div>
    </section>

    <section class="spotlight reveal">
      <article class="spot-card danger-tone" id="unsafe-spot-card">
        <p class="spot-label">Versi Tidak Aman</p>
        <h2>Promo bisa ditambah dan dipakai tanpa pagar</h2>
        <p>
          Siapa saja bisa menambah promo, promo yang sama bisa dipakai berkali-kali, dan lebih dari
          satu voucher bisa ditumpuk dalam satu transaksi.
        </p>
      </article>
      <article class="spot-card safe-tone" id="safe-spot-card">
        <p class="spot-label">Versi Sudah Diamankan</p>
        <h2>Promo tunduk pada aturan domain yang eksplisit</h2>
        <p>
          Penambahan promo butuh akses admin, penggunaan dibatasi satu kali, user harus eligible,
          dan alur voucher dipaksa melalui state machine.
        </p>
      </article>
    </section>

    <main class="panel-grid">
      <section class="demo-panel unsafe-panel reveal" id="unsafe-panel" data-panel-mode="unsafe">
        <div class="panel-header">
          <div>
            <p class="panel-tag">Tidak Aman</p>
            <h2>Voucher Abuse Playground</h2>
          </div>
          <button type="button" class="ghost-button" id="unsafe-reset-all">Reset Demo</button>
        </div>

        <section class="report-grid">
          <article class="report-card report-card-danger">
            <p class="card-kicker">State Berbahaya</p>
            <h3>Yang masih bisa direpresentasikan</h3>
            <ul class="report-list">
              <li>Penggunaan voucher tidak dihitung, sehingga kode yang sama bisa di-apply terus-menerus.</li>
              <li>Voucher stacking pada satu transaksi tetap diizinkan.</li>
              <li>Voucher dipakai oleh user yang tidak berhak.</li>
            </ul>
          </article>
          <article class="report-card report-card-danger">
            <p class="card-kicker">Root Cause</p>
            <h3>Kenapa desain ini rawan</h3>
            <ul class="report-list">
              <li>Tidak ada domain primitive seperti <strong>VoucherUsage</strong> untuk menghitung dan membatasi penggunaan.</li>
              <li>Tidak ada trust boundary antara user berhak dan tidak berhak.</li>
              <li>Voucher langsung diproses tanpa validasi domain yang eksplisit.</li>
            </ul>
          </article>
        </section>

        <div class="panel-stack">
          <article class="card">
            <div class="card-head">
              <div>
                <p class="card-kicker">Promo Aktif</p>
                <h3>Daftar promo tanpa kontrol</h3>
              </div>
              <span class="chip chip-danger">Semua orang bisa pakai</span>
            </div>
            <div id="unsafe-promo-list" class="promo-list"></div>
          </article>

          <article class="card">
            <div class="card-head">
              <div>
                <p class="card-kicker">Tambah Promo</p>
                <h3>Form rawan tanpa validasi admin</h3>
              </div>
            </div>
            <form id="unsafe-create-form" class="form-grid">
              <label>
                <span>Kode promo</span>
                <input type="text" name="code" placeholder="Contoh: BONUS500">
              </label>
              <label>
                <span>Tipe diskon</span>
                <select name="type">
                  <option value="fixed">Potongan nominal</option>
                  <option value="percent">Potongan persen</option>
                </select>
              </label>
              <label>
                <span>Nilai diskon</span>
                <input type="number" name="amount" min="0" step="1" value="50000">
              </label>
              <label>
                <span>Audience</span>
                <input type="text" name="audience" placeholder="Semua user, VIP, siapa pun">
              </label>
              <button type="submit" class="action-button action-danger">Tambah promo rentan</button>
            </form>
          </article>

          <article class="card">
            <div class="card-head">
              <div>
                <p class="card-kicker">Pembelian</p>
                <h3>Checkout yang mudah dieksploitasi</h3>
              </div>
              <span class="chip chip-danger">Stacking diizinkan</span>
            </div>

            <div class="cart-lines" id="unsafe-cart-lines"></div>

            <form id="unsafe-checkout-form" class="form-grid">
              <label>
                <span>User</span>
                <select name="user">
                  <option value="guest-01">guest-01</option>
                  <option value="user-baru">user-baru</option>
                  <option value="vip-01">vip-01</option>
                </select>
              </label>
              <label class="wide-field">
                <span>Kode promo</span>
                <input type="text" name="code" placeholder="Contoh: DISC100">
              </label>
              <div class="button-row wide-field">
                <button type="submit" class="action-button action-danger">Apply promo</button>
                <button type="button" class="ghost-button" id="unsafe-abuse">Simulasi abuse x3</button>
                <button type="button" class="ghost-button" id="unsafe-complete-order">Selesaikan order</button>
                <button type="button" class="ghost-button" id="unsafe-reset-order">Reset order</button>
              </div>
            </form>

            <div class="summary-box">
              <div class="summary-line">
                <span>Promo terpasang</span>
                <strong id="unsafe-applied-promos">Belum ada</strong>
              </div>
              <div class="summary-line">
                <span>Total akhir</span>
                <strong id="unsafe-total">Rp0</strong>
              </div>
            </div>
          </article>

          <article class="card">
            <div class="card-head">
              <div>
                <p class="card-kicker">Jejak Eksploitasi</p>
                <h3>Log tindakan</h3>
              </div>
            </div>
            <ul id="unsafe-log" class="log-list"></ul>
          </article>
        </div>
      </section>

      <section class="demo-panel safe-panel reveal is-hidden" id="safe-panel" data-panel-mode="safe" hidden>
        <div class="panel-header">
          <div>
            <p class="panel-tag">Sudah Diamankan</p>
            <h2>Secure Voucher Flow</h2>
          </div>
          <button type="button" class="ghost-button" id="safe-reset-all">Reset Demo</button>
        </div>

        <section class="report-grid">
          <article class="report-card report-card-safe">
            <p class="card-kicker">Invariant Domain</p>
            <h3>Aturan yang dipaksa sejak awal</h3>
            <ul class="report-list">
              <li><strong>Numeric:</strong> usage tidak boleh melebihi <code>maxUsage</code>.</li>
              <li><strong>Membership:</strong> voucher hanya untuk user yang eligible.</li>
              <li><strong>Temporal:</strong> voucher hanya dipakai satu kali.</li>
              <li><strong>Business Rule:</strong> voucher stacking ditolak.</li>
            </ul>
          </article>
          <article class="report-card report-card-safe">
            <p class="card-kicker">Temporal Invariant</p>
            <h3>Urutan state sesuai laporan</h3>
            <ul class="report-list">
              <li><strong>TL-1:</strong> voucher harus <code>VALIDATED</code> sebelum <code>APPLIED</code>.</li>
              <li><strong>TL-2:</strong> voucher hanya dapat digunakan satu kali.</li>
              <li><strong>TL-3:</strong> <code>REJECTED</code> adalah terminal state.</li>
              <li><strong>TL-4:</strong> <code>APPLIED</code> harus menuju <code>COMPLETED</code>.</li>
            </ul>
          </article>
        </section>

        <div class="panel-stack">
          <article class="card">
            <div class="card-head">
              <div>
                <p class="card-kicker">Promo Aktif</p>
                <h3>Daftar promo dengan pembatasan</h3>
              </div>
              <span class="chip chip-safe">Eligible user dicek</span>
            </div>
            <div id="safe-promo-list" class="promo-list"></div>
          </article>

          <article class="card">
            <div class="card-head">
              <div>
                <p class="card-kicker">Tambah Promo</p>
                <h3>Form promo yang punya trust boundary</h3>
              </div>
              <span class="chip chip-safe">Butuh admin</span>
            </div>
            <form id="safe-create-form" class="form-grid">
              <label>
                <span>Role</span>
                <select name="role">
                  <option value="viewer">viewer</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              <label>
                <span>Admin pin</span>
                <input type="password" name="pin" placeholder="SAFEADMIN">
              </label>
              <label>
                <span>Kode promo</span>
                <input type="text" name="code" placeholder="Contoh: NEW10">
              </label>
              <label>
                <span>Tipe diskon</span>
                <select name="type">
                  <option value="fixed">Potongan nominal</option>
                  <option value="percent">Potongan persen</option>
                </select>
              </label>
              <label>
                <span>Nilai diskon</span>
                <input type="number" name="amount" min="1" step="1" value="50000">
              </label>
              <label>
                <span>Minimum belanja</span>
                <input type="number" name="minPurchase" min="0" step="1" value="300000">
              </label>
              <label>
                <span>Maksimal pemakaian</span>
                <input type="number" name="maxUsage" min="1" step="1" value="1">
              </label>
              <label>
                <span>Eligible user</span>
                <select name="eligibleUser">
                  <option value="all">Semua user</option>
                  <option value="user-baru">user-baru</option>
                  <option value="vip-01">vip-01</option>
                </select>
              </label>
              <label class="wide-field">
                <span>Tanggal kedaluwarsa</span>
                <input type="date" name="expiresAt">
              </label>
              <button type="submit" class="action-button action-safe wide-field">Tambah promo aman</button>
            </form>
          </article>

          <article class="card">
            <div class="card-head">
              <div>
                <p class="card-kicker">Pembelian</p>
                <h3>Checkout dengan state machine</h3>
              </div>
              <span class="chip chip-safe" id="safe-session-state">UNUSED</span>
            </div>

            <div class="cart-lines" id="safe-cart-lines"></div>

            <form id="safe-checkout-form" class="form-grid">
              <label>
                <span>User</span>
                <select name="user">
                  <option value="guest-01">guest-01</option>
                  <option value="user-baru">user-baru</option>
                  <option value="vip-01">vip-01</option>
                </select>
              </label>
              <label class="wide-field">
                <span>Kode promo</span>
                <input type="text" name="code" placeholder="Contoh: DISC100">
              </label>
              <div class="button-row wide-field">
                <button type="submit" class="action-button action-safe">Validate &amp; apply</button>
                <button type="button" class="ghost-button" id="safe-complete-order">Selesaikan order</button>
                <button type="button" class="ghost-button" id="safe-reset-session">Reset session</button>
              </div>
            </form>

            <div class="summary-box">
              <div class="summary-line">
                <span>Promo terpasang</span>
                <strong id="safe-applied-promos">Belum ada</strong>
              </div>
              <div class="summary-line">
                <span>Total akhir</span>
                <strong id="safe-total">Rp0</strong>
              </div>
            </div>
          </article>

          <article class="card">
            <div class="card-head">
              <div>
                <p class="card-kicker">Jejak Validasi</p>
                <h3>Log state machine</h3>
              </div>
            </div>
            <ul id="safe-log" class="log-list"></ul>
          </article>
        </div>
      </section>
    </main>
  </div>

  <script>
    window.voucherDemoData = @json($demoData ?? []);
  </script>
  <script src="{{ asset('demo.js') }}?v={{ filemtime(public_path('demo.js')) }}"></script>
</body>
</html>
