<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response
            ->assertStatus(200)
            ->assertSee('Simulasi Pembelian dan Penambahan Promo')
            ->assertSee('Voucher Abuse Playground')
            ->assertSee('Secure Voucher Flow')
            ->assertSee('State Berbahaya')
            ->assertSee('TL-1');
    }
}
