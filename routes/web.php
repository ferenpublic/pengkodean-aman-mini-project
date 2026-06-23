<?php

use App\Http\Controllers\VoucherDemoController;
use Illuminate\Support\Facades\Route;

Route::get('/', VoucherDemoController::class)->name('voucher-demo');
