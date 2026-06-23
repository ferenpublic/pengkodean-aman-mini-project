const serverPayload = window.voucherDemoData ?? {};

const fallbackCartItems = [
  { name: "Mechanical Keyboard", price: 450000, note: "Item utama pada simulasi checkout" },
  { name: "Gaming Headset", price: 350000, note: "Tetap sama di kedua skenario" },
  { name: "Wireless Mouse", price: 200000, note: "Subtotal dibuat pas Rp1.000.000" },
];

const cartItems = Array.isArray(serverPayload.cartItems)
  ? clone(serverPayload.cartItems)
  : fallbackCartItems;

const ADMIN_PIN = serverPayload.adminPin ?? "SAFEADMIN";

const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const nextMonth = new Date();
nextMonth.setMonth(nextMonth.getMonth() + 1);

const fallbackUnsafePromos = [
  { code: "DISC100", type: "fixed", amount: 100000, audience: "Semua user", note: "Penggunaan tidak dihitung, jadi bisa dipakai terus-menerus" },
  { code: "MEGA20", type: "percent", amount: 20, audience: "Semua user", note: "Bisa di-stack tanpa batas" },
  { code: "VIPFLASH", type: "fixed", amount: 250000, audience: "Harusnya VIP, tapi tidak dicek", note: "Eligibility tidak ditegakkan" },
];

const initialUnsafePromos = Array.isArray(serverPayload.unsafePromos)
  ? clone(serverPayload.unsafePromos)
  : fallbackUnsafePromos;

const fallbackSafePromos = [
  {
    code: "DISC100",
    type: "fixed",
    amount: 100000,
    minPurchase: 500000,
    maxUsage: 1,
    usageCount: 0,
    eligibleUsers: ["user-baru"],
    expiresAt: nextMonth.toISOString().slice(0, 10),
    note: "VoucherUsage membatasi satu kali pemakaian",
  },
  {
    code: "VIP20",
    type: "percent",
    amount: 20,
    minPurchase: 750000,
    maxUsage: 1,
    usageCount: 0,
    eligibleUsers: ["vip-01"],
    expiresAt: nextMonth.toISOString().slice(0, 10),
    note: "Hanya user VIP yang eligible",
  },
];

const initialSafePromos = Array.isArray(serverPayload.safePromos)
  ? clone(serverPayload.safePromos)
  : fallbackSafePromos;

const defaultSafeExpiry = serverPayload.defaults?.safeExpiresAt ?? tomorrow.toISOString().slice(0, 10);

const VoucherState = {
  UNUSED: "UNUSED",
  VALIDATED: "VALIDATED",
  APPLIED: "APPLIED",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
};

const state = {
  unsafe: buildUnsafeState(),
  safe: buildSafeState(),
  viewMode: "unsafe",
};

const els = {
  pageShell: document.querySelector("#page-shell"),
  toggleUnsafe: document.querySelector("#toggle-unsafe"),
  toggleSafe: document.querySelector("#toggle-safe"),
  unsafePanel: document.querySelector("#unsafe-panel"),
  safePanel: document.querySelector("#safe-panel"),
  unsafeSpotCard: document.querySelector("#unsafe-spot-card"),
  safeSpotCard: document.querySelector("#safe-spot-card"),
  unsafePromoList: document.querySelector("#unsafe-promo-list"),
  unsafeCartLines: document.querySelector("#unsafe-cart-lines"),
  unsafeAppliedPromos: document.querySelector("#unsafe-applied-promos"),
  unsafeTotal: document.querySelector("#unsafe-total"),
  unsafeLog: document.querySelector("#unsafe-log"),
  safePromoList: document.querySelector("#safe-promo-list"),
  safeCartLines: document.querySelector("#safe-cart-lines"),
  safeAppliedPromos: document.querySelector("#safe-applied-promos"),
  safeTotal: document.querySelector("#safe-total"),
  safeLog: document.querySelector("#safe-log"),
  safeSessionState: document.querySelector("#safe-session-state"),
};

function buildUnsafeState() {
  return {
    promos: clone(initialUnsafePromos),
    applied: [],
    total: subtotal,
    user: "guest-01",
    logs: [
      "Panel ini sengaja rentan: penggunaan voucher tidak dihitung, promo tidak punya batas usage, tidak ada validasi eligibility, dan stacking diizinkan.",
    ],
  };
}

function buildSafeState() {
  return {
    promos: clone(initialSafePromos).map((promo) => ({
      ...promo,
      usedBy: [],
    })),
    applied: [],
    total: subtotal,
    user: "guest-01",
    sessionState: VoucherState.UNUSED,
    logs: [
      "Panel aman mengikuti laporan: VoucherUsage, validasi membership, no stacking, dan state machine UNUSED -> VALIDATED -> APPLIED -> COMPLETED dengan REJECTED sebagai terminal state.",
    ],
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPromoValue(promo) {
  return promo.type === "percent"
    ? `${promo.amount}%`
    : formatCurrency(Number(promo.amount || 0));
}

function renderCart(target) {
  const element = target === "unsafe" ? els.unsafeCartLines : els.safeCartLines;
  element.innerHTML = "";

  cartItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-line";
    row.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <small>${item.note}</small>
      </div>
      <strong>${formatCurrency(item.price)}</strong>
    `;
    element.appendChild(row);
  });

  const subtotalRow = document.createElement("div");
  subtotalRow.className = "cart-line";
  subtotalRow.innerHTML = `
    <div>
      <strong>Subtotal order</strong>
      <small>Dipertahankan sama agar perbandingan adil</small>
    </div>
    <strong>${formatCurrency(subtotal)}</strong>
  `;
  element.appendChild(subtotalRow);
}

function renderUnsafePromos() {
  els.unsafePromoList.innerHTML = "";

  state.unsafe.promos.forEach((promo) => {
    const item = document.createElement("div");
    item.className = "promo-item";
    item.innerHTML = `
      <strong>${promo.code}</strong>
      <p>${promo.note}</p>
      <div class="promo-meta">
        <span class="mini-pill">Diskon ${formatPromoValue(promo)}</span>
        <span class="mini-pill">Audience: ${promo.audience || "Siapa pun"}</span>
        <span class="mini-pill">Stacking: diizinkan</span>
      </div>
    `;
    els.unsafePromoList.appendChild(item);
  });
}

function renderSafePromos() {
  els.safePromoList.innerHTML = "";

  state.safe.promos.forEach((promo) => {
    const usageLeft = Math.max(0, promo.maxUsage - promo.usageCount);
    const eligibility = promo.eligibleUsers.includes("all")
      ? "Semua user"
      : promo.eligibleUsers.join(", ");

    const item = document.createElement("div");
    item.className = "promo-item";
    item.innerHTML = `
      <strong>${promo.code}</strong>
      <p>${promo.note}</p>
      <div class="promo-meta">
        <span class="mini-pill">Diskon ${formatPromoValue(promo)}</span>
        <span class="mini-pill">Min belanja ${formatCurrency(promo.minPurchase)}</span>
        <span class="mini-pill">Eligible: ${eligibility}</span>
        <span class="mini-pill">VoucherUsage: ${promo.usageCount}/${promo.maxUsage}</span>
        <span class="mini-pill">Sisa usage: ${usageLeft}</span>
        <span class="mini-pill">Expired: ${promo.expiresAt}</span>
        <span class="mini-pill">Stacking: ditolak</span>
      </div>
    `;
    els.safePromoList.appendChild(item);
  });
}

function renderUnsafeSummary() {
  els.unsafeAppliedPromos.textContent = state.unsafe.applied.length
    ? state.unsafe.applied.map((entry) => `${entry.code} (${entry.label})`).join(", ")
    : "Belum ada";

  els.unsafeTotal.textContent = formatCurrency(state.unsafe.total);
  els.unsafeTotal.classList.toggle("negative-total", state.unsafe.total < 0);
}

function renderSafeSummary() {
  els.safeAppliedPromos.textContent = state.safe.applied.length
    ? state.safe.applied.map((entry) => `${entry.code} (${entry.label})`).join(", ")
    : "Belum ada";

  els.safeTotal.textContent = formatCurrency(state.safe.total);
  els.safeSessionState.textContent = state.safe.sessionState;
}

function renderLogs(target) {
  const source = target === "unsafe" ? state.unsafe.logs : state.safe.logs;
  const element = target === "unsafe" ? els.unsafeLog : els.safeLog;
  element.innerHTML = "";

  if (!source.length) {
    const empty = document.createElement("li");
    empty.className = "log-empty";
    empty.textContent = "Belum ada aktivitas.";
    element.appendChild(empty);
    return;
  }

  source.slice().reverse().forEach((message, index) => {
    const item = document.createElement("li");
    item.className = "log-item";
    item.innerHTML = `<strong>#${source.length - index}</strong>${message}`;
    element.appendChild(item);
  });
}

function setViewMode(mode) {
  const resolvedMode = mode === "safe" ? "safe" : "unsafe";
  state.viewMode = resolvedMode;

  const unsafeActive = resolvedMode === "unsafe";
  const safeActive = resolvedMode === "safe";

  els.pageShell.dataset.mode = resolvedMode;

  els.unsafePanel.hidden = !unsafeActive;
  els.safePanel.hidden = !safeActive;
  els.unsafePanel.classList.toggle("is-hidden", !unsafeActive);
  els.safePanel.classList.toggle("is-hidden", !safeActive);

  els.toggleUnsafe.classList.toggle("is-active", unsafeActive);
  els.toggleSafe.classList.toggle("is-active", safeActive);
  els.toggleUnsafe.setAttribute("aria-pressed", String(unsafeActive));
  els.toggleSafe.setAttribute("aria-pressed", String(safeActive));

  els.unsafeSpotCard.classList.toggle("is-focus", unsafeActive);
  els.unsafeSpotCard.classList.toggle("is-hidden", !unsafeActive);
  els.safeSpotCard.classList.toggle("is-focus", safeActive);
  els.safeSpotCard.classList.toggle("is-hidden", !safeActive);
}

function addLog(target, message) {
  const bucket = target === "unsafe" ? state.unsafe.logs : state.safe.logs;
  bucket.push(message);
  if (bucket.length > 10) {
    bucket.shift();
  }
  renderLogs(target);
}

function discountLabel(promo, discountAmount) {
  return `${formatPromoValue(promo)} -> potong ${formatCurrency(discountAmount)}`;
}

function findUnsafePromo(code) {
  const normalized = code.trim().toUpperCase();
  return state.unsafe.promos.find((promo) => promo.code.toUpperCase() === normalized);
}

function findSafePromo(code) {
  const normalized = code.trim().toUpperCase();
  return state.safe.promos.find((promo) => promo.code.toUpperCase() === normalized);
}

function computeDiscount(currentTotal, promo) {
  if (promo.type === "percent") {
    return Math.round((currentTotal * promo.amount) / 100);
  }
  return Number(promo.amount || 0);
}

function applyUnsafePromo(code, user, sourceLabel = "manual") {
  const promo = findUnsafePromo(code);
  if (!promo) {
    addLog("unsafe", `User ${user} mencoba kode ${code || "-"}, tetapi sistem hanya menolak karena kode tidak ditemukan.`);
    return;
  }

  const discountAmount = computeDiscount(state.unsafe.total, promo);
  state.unsafe.total -= discountAmount;
  state.unsafe.user = user;
  state.unsafe.applied.push({
    code: promo.code,
    label: discountLabel(promo, discountAmount),
  });

  addLog(
    "unsafe",
    `Promo ${promo.code} dipasang oleh ${user} lewat ${sourceLabel}. Tidak ada cek eligibility, max usage, atau stacking. Total jadi ${formatCurrency(state.unsafe.total)}.`
  );

  renderUnsafeSummary();
}

function resetUnsafeOrder() {
  state.unsafe.applied = [];
  state.unsafe.total = subtotal;
  renderUnsafeSummary();
  addLog("unsafe", "Order tidak aman di-reset. Inventory promo tetap dibiarkan apa adanya.");
}

function completeUnsafeOrder() {
  if (!state.unsafe.applied.length) {
    addLog(
      "unsafe",
      "Order tidak aman diselesaikan tanpa voucher. Sistem tetap tidak memiliki pencatatan usage atau state checkout yang ketat."
    );
    return;
  }

  const completedCodes = state.unsafe.applied.map((entry) => entry.code).join(", ");
  const completedTotal = state.unsafe.total;

  state.unsafe.applied = [];
  state.unsafe.total = subtotal;
  renderUnsafeSummary();
  addLog(
    "unsafe",
    `Order tidak aman selesai dengan promo ${completedCodes}. Total checkout ${formatCurrency(completedTotal)}. Penggunaan voucher tidak dihitung, jadi kode yang sama masih bisa di-apply terus-menerus pada order berikutnya.`
  );
}

function resetSafeSession() {
  state.safe.applied = [];
  state.safe.total = subtotal;
  state.safe.sessionState = VoucherState.UNUSED;
  renderSafeSummary();
  addLog("safe", "Session voucher di-reset ke UNUSED. Inventory promo aman tetap dipertahankan.");
}

function startFreshSafeSession(reason) {
  state.safe.applied = [];
  state.safe.total = subtotal;
  state.safe.sessionState = VoucherState.UNUSED;
  renderSafeSummary();
  addLog("safe", reason);
}

function moveSafeState(nextState, reason) {
  state.safe.sessionState = nextState;
  renderSafeSummary();
  addLog("safe", `${nextState}: ${reason}`);
}

function validateSafePromo(promo, user) {
  if (state.safe.sessionState === VoucherState.REJECTED) {
    return { ok: false, reason: "State REJECTED adalah terminal state. Session harus di-reset sebelum dipakai lagi." };
  }

  if (state.safe.sessionState !== VoucherState.UNUSED) {
    return { ok: false, reason: "State saat ini bukan UNUSED. Satu session hanya boleh melalui urutan yang valid." };
  }

  if (!promo) {
    return { ok: false, reason: "Kode promo tidak ditemukan." };
  }

  if (!promo.eligibleUsers.includes("all") && !promo.eligibleUsers.includes(user)) {
    return { ok: false, reason: `User ${user} tidak termasuk eligible user untuk promo ${promo.code}.` };
  }

  if (promo.usedBy.includes(user)) {
    return { ok: false, reason: `User ${user} sudah pernah memakai promo ${promo.code}.` };
  }

  if (promo.usageCount >= promo.maxUsage) {
    return { ok: false, reason: `VoucherUsage menolak increment karena promo ${promo.code} sudah mencapai maxUsage.` };
  }

  if (state.safe.applied.length > 0) {
    return { ok: false, reason: "Voucher stacking ditolak. Hanya satu promo untuk satu transaksi." };
  }

  if (subtotal < promo.minPurchase) {
    return { ok: false, reason: `Subtotal belum memenuhi minimum belanja ${formatCurrency(promo.minPurchase)}.` };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (promo.expiresAt < today) {
    return { ok: false, reason: `Promo ${promo.code} sudah kedaluwarsa pada ${promo.expiresAt}.` };
  }

  return { ok: true };
}

function applySafePromo(code, user) {
  const promo = findSafePromo(code);
  const verdict = validateSafePromo(promo, user);

  if (!verdict.ok) {
    state.safe.sessionState = VoucherState.REJECTED;
    renderSafeSummary();
    addLog("safe", `REJECTED: ${verdict.reason}`);
    return;
  }

  moveSafeState(VoucherState.VALIDATED, `TL-1 terpenuhi. User ${user} lolos validasi untuk promo ${promo.code}.`);

  const discountAmount = computeDiscount(state.safe.total, promo);
  state.safe.total -= discountAmount;
  state.safe.user = user;
  state.safe.applied = [
    {
      code: promo.code,
      label: discountLabel(promo, discountAmount),
    },
  ];

  moveSafeState(VoucherState.APPLIED, `Promo ${promo.code} diterapkan sekali dengan potongan ${formatCurrency(discountAmount)}. TL-2 dijaga oleh VoucherUsage. Total jadi ${formatCurrency(state.safe.total)}.`);
  renderSafeSummary();
}

function completeSafeOrder() {
  if (state.safe.sessionState === VoucherState.REJECTED) {
    addLog("safe", "Order tidak bisa diselesaikan karena session sudah REJECTED. Reset session diperlukan.");
    return;
  }

  if (state.safe.sessionState === VoucherState.UNUSED) {
    moveSafeState(VoucherState.COMPLETED, "Order selesai tanpa voucher. Jalur voucher tidak dipakai.");
    return;
  }

  if (state.safe.sessionState !== VoucherState.APPLIED) {
    addLog("safe", "Order belum bisa diselesaikan karena promo belum berada pada state APPLIED.");
    return;
  }

  const appliedPromo = state.safe.applied[0];
  const promo = state.safe.promos.find((entry) => entry.code === appliedPromo.code);
  if (!promo) {
    state.safe.sessionState = VoucherState.REJECTED;
    renderSafeSummary();
    addLog("safe", "REJECTED: Entitas promo tidak ditemukan saat finalisasi order.");
    return;
  }

  promo.usageCount += 1;
  promo.usedBy.push(state.safe.user);
  moveSafeState(
    VoucherState.COMPLETED,
    `TL-4 terpenuhi. Order selesai dan promo ${promo.code} dicatat untuk ${state.safe.user}, usage sekarang ${promo.usageCount}/${promo.maxUsage}.`
  );
  renderSafePromos();
}

function renderUnsafe() {
  renderCart("unsafe");
  renderUnsafePromos();
  renderUnsafeSummary();
  renderLogs("unsafe");
}

function renderSafe() {
  renderCart("safe");
  renderSafePromos();
  renderSafeSummary();
  renderLogs("safe");
}

function seedSafeExpiryInput() {
  const input = document.querySelector('#safe-create-form input[name="expiresAt"]');
  input.value = defaultSafeExpiry;
}

document.querySelector("#unsafe-create-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const code = (form.get("code") || "").toString().trim().toUpperCase() || `PROMO${state.unsafe.promos.length + 1}`;
  const promo = {
    code,
    type: (form.get("type") || "fixed").toString(),
    amount: Number(form.get("amount") || 0),
    audience: (form.get("audience") || "").toString().trim() || "Siapa pun",
    note: "Dibuat tanpa pemeriksaan admin dan tanpa validasi domain",
  };

  state.unsafe.promos.unshift(promo);
  renderUnsafePromos();
  addLog("unsafe", `Promo ${promo.code} ditambahkan tanpa login admin. Duplicate code, expiry, dan max usage tidak dicek.`);
  event.currentTarget.reset();
});

document.querySelector("#unsafe-checkout-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const user = (form.get("user") || "guest-01").toString();
  const code = (form.get("code") || "").toString();
  applyUnsafePromo(code, user, "form checkout");
});

document.querySelector("#unsafe-abuse").addEventListener("click", () => {
  const form = document.querySelector("#unsafe-checkout-form");
  const user = form.elements.user.value;
  const code = form.elements.code.value.trim() || "DISC100";

  for (let i = 1; i <= 3; i += 1) {
    applyUnsafePromo(code, user, `simulasi abuse ke-${i}`);
  }
});

document.querySelector("#unsafe-complete-order").addEventListener("click", () => {
  completeUnsafeOrder();
});

document.querySelector("#unsafe-reset-order").addEventListener("click", () => {
  resetUnsafeOrder();
});

document.querySelector("#unsafe-reset-all").addEventListener("click", () => {
  state.unsafe = buildUnsafeState();
  renderUnsafe();
  setViewMode("unsafe");
});

document.querySelector("#safe-create-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const role = (form.get("role") || "").toString();
  const pin = (form.get("pin") || "").toString();
  const code = (form.get("code") || "").toString().trim().toUpperCase();
  const type = (form.get("type") || "fixed").toString();
  const amount = Number(form.get("amount") || 0);
  const minPurchase = Number(form.get("minPurchase") || 0);
  const maxUsage = Number(form.get("maxUsage") || 0);
  const eligibleUser = (form.get("eligibleUser") || "all").toString();
  const expiresAt = (form.get("expiresAt") || "").toString();

  if (role !== "admin" || pin !== ADMIN_PIN) {
    addLog("safe", "REJECTED: Penambahan promo ditolak karena trust boundary admin tidak terpenuhi.");
    return;
  }

  if (!/^[A-Z0-9]{4,12}$/.test(code)) {
    addLog("safe", "REJECTED: Format kode promo harus uppercase alfanumerik 4-12 karakter.");
    return;
  }

  if (state.safe.promos.some((promo) => promo.code === code)) {
    addLog("safe", `REJECTED: Kode promo ${code} sudah ada sehingga duplicate code tidak diizinkan.`);
    return;
  }

  if (amount <= 0 || (type === "percent" && amount > 90)) {
    addLog("safe", "REJECTED: Nilai promo tidak valid. Potongan harus positif dan persen tidak boleh berlebihan.");
    return;
  }

  if (!Number.isInteger(maxUsage) || maxUsage < 1) {
    addLog("safe", "REJECTED: maxUsage harus bilangan bulat minimal 1.");
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  if (!expiresAt || expiresAt <= today) {
    addLog("safe", "REJECTED: Tanggal kedaluwarsa harus di masa depan.");
    return;
  }

  const promo = {
    code,
    type,
    amount,
    minPurchase: Math.max(0, minPurchase),
    maxUsage,
    usageCount: 0,
    eligibleUsers: [eligibleUser],
    expiresAt,
    usedBy: [],
    note: "Promo baru lolos validasi admin, format, usage, dan expiry",
  };

  state.safe.promos.unshift(promo);
  renderSafePromos();
  addLog("safe", `Promo ${promo.code} berhasil dibuat lewat jalur admin. Domain rule langsung dicatat sejak objek dibuat.`);
  event.currentTarget.reset();
  seedSafeExpiryInput();
});

document.querySelector("#safe-checkout-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const user = (form.get("user") || "guest-01").toString();
  const code = (form.get("code") || "").toString();

  if (state.safe.sessionState === VoucherState.REJECTED || state.safe.sessionState === VoucherState.COMPLETED) {
    startFreshSafeSession(
      `Session baru dibuat karena transaksi sebelumnya berakhir di ${state.safe.sessionState}. Terminal state tetap dihormati, lalu sistem memulai session baru untuk percobaan berikutnya.`
    );
  }

  if (state.safe.sessionState === VoucherState.APPLIED) {
    addLog("safe", "Session saat ini sudah APPLIED. Selesaikan order atau reset session sebelum memulai validasi baru.");
    return;
  }

  applySafePromo(code, user);
});

document.querySelector("#safe-complete-order").addEventListener("click", () => {
  completeSafeOrder();
});

document.querySelector("#safe-reset-session").addEventListener("click", () => {
  resetSafeSession();
});

document.querySelector("#safe-reset-all").addEventListener("click", () => {
  state.safe = buildSafeState();
  renderSafe();
  seedSafeExpiryInput();
  setViewMode("safe");
});

els.toggleUnsafe.addEventListener("click", () => {
  setViewMode("unsafe");
});

els.toggleSafe.addEventListener("click", () => {
  setViewMode("safe");
});

renderUnsafe();
renderSafe();
seedSafeExpiryInput();
setViewMode(state.viewMode);
