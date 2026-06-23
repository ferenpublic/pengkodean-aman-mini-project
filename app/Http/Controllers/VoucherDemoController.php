<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class VoucherDemoController extends Controller
{
    public function __invoke(): View
    {
        return view('voucher-demo', [
            'demoData' => [
                'adminPin' => 'SAFEADMIN',
                'cartItems' => [
                    [
                        'name' => 'Mechanical Keyboard',
                        'price' => 450000,
                        'note' => 'Item utama pada simulasi checkout',
                    ],
                    [
                        'name' => 'Gaming Headset',
                        'price' => 350000,
                        'note' => 'Tetap sama di kedua skenario',
                    ],
                    [
                        'name' => 'Wireless Mouse',
                        'price' => 200000,
                        'note' => 'Subtotal dibuat pas Rp1.000.000',
                    ],
                ],
                'unsafePromos' => [
                    [
                        'code' => 'DISC100',
                        'type' => 'fixed',
                        'amount' => 100000,
                        'audience' => 'Semua user',
                        'note' => 'Penggunaan tidak dihitung, jadi bisa dipakai terus-menerus',
                    ],
                    [
                        'code' => 'MEGA20',
                        'type' => 'percent',
                        'amount' => 20,
                        'audience' => 'Semua user',
                        'note' => 'Bisa di-stack tanpa batas',
                    ],
                    [
                        'code' => 'VIPFLASH',
                        'type' => 'fixed',
                        'amount' => 250000,
                        'audience' => 'Harusnya VIP, tapi tidak dicek',
                        'note' => 'Eligibility tidak ditegakkan',
                    ],
                ],
                'safePromos' => [
                    [
                        'code' => 'DISC100',
                        'type' => 'fixed',
                        'amount' => 100000,
                        'minPurchase' => 500000,
                        'maxUsage' => 1,
                        'usageCount' => 0,
                        'eligibleUsers' => ['user-baru'],
                        'expiresAt' => now()->addMonth()->toDateString(),
                        'note' => 'VoucherUsage membatasi satu kali pemakaian',
                    ],
                    [
                        'code' => 'VIP20',
                        'type' => 'percent',
                        'amount' => 20,
                        'minPurchase' => 750000,
                        'maxUsage' => 1,
                        'usageCount' => 0,
                        'eligibleUsers' => ['vip-01'],
                        'expiresAt' => now()->addMonth()->toDateString(),
                        'note' => 'Hanya user VIP yang eligible',
                    ],
                ],
                'defaults' => [
                    'safeExpiresAt' => now()->addDay()->toDateString(),
                ],
            ],
        ]);
    }
}
