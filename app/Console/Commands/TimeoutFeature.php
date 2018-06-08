<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Feature;
use App\Models\CollectionFeature;
use App\Models\Collection;

class TimeoutFeature extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'feature:timeout {action}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Add or remove the experimental, admin-only set feature to impose a timeout when students have made too many attempts in a short period of time (indicating they are clicking mindlessly through answers). Use the "add" argument to add the feature to all sets, or the "remove" argument to remove from all sets.';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $action = $this->argument('action');
        if ($action === 'remove') {
            $this->removeFeature();
            return;
        }

        $this->addFeature();
        return;
    }

    private function addFeature() {
        $this->info('Adding feature...');

        $feature = Feature::create([
            'name' => config('constants.features.ATTEMPT_TIMEOUT'),
            'description' => 'When the system detects excessive attempts made by a student (more than 5 attempts in 5 minutes, where at least one question has been answered per attempt, and before the due date), the student will receive a 1 minute timeout.',
            'default_state' => 'false',
            'admin_only' => 'true'
        ]);

        Collection::all()->each(function ($collection, $key) use ($feature) {
            $collectionFeature = new CollectionFeature();
            $collectionFeature->addFeature($collection->id, $feature);
        });

        $this->info('Feature added!');
    }

    private function removeFeature() {
        $this->info('Removing feature...');
        //collection feature will cascade on delete, so just delete the single Feature
        $name = config('constants.features.ATTEMPT_TIMEOUT');
        $feature = Feature::where('name', '=', $name)->firstOrFail();
        $feature->delete();
        $this->info('Feature removed.');
    }
}
