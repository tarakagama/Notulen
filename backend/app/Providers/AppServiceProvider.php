<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Meeting;
use App\Models\ActionItem;
use App\Policies\MeetingPolicy;
use App\Policies\ActionItemPolicy;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        {
            Gate::policy(Meeting::class, MeetingPolicy::class);
            Gate::policy(ActionItem::class, ActionItemPolicy::class);
        }
    }
}
