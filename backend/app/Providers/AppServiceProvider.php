<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Meeting;
use App\Models\ActionItem;
use App\Models\Room;
use App\Models\Division;
use App\Policies\MeetingPolicy;
use App\Policies\ActionItemPolicy;
use App\Policies\RoomPolicy;
use App\Policies\DivisionPolicy;
use App\Models\User;
use App\Policies\UserPolicy;
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
        Gate::policy(Meeting::class, MeetingPolicy::class);
        Gate::policy(ActionItem::class, ActionItemPolicy::class);
        Gate::policy(Room::class, RoomPolicy::class);
        Gate::policy(Division::class, DivisionPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
    }
}