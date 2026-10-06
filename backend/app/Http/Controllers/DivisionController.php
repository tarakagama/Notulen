<?php

namespace App\Http\Controllers;

use App\Models\Division;
use Illuminate\Http\Request;

class DivisionController extends Controller
{
    public function index()
    {
        return Division::orderBy('division_name')->get();
    }

    public function store(Request $request)
    {
        $this->authorize('manage', Division::class);

        $data = $request->validate([
            'division_name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:20', 'unique:divisions,code'],
        ]);

        return response()->json(Division::create($data), 201);
    }

    public function update(Request $request, Division $division)
    {
        $this->authorize('manage', Division::class);

        $data = $request->validate([
            'division_name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:20', 'unique:divisions,code,' . $division->id],
        ]);

        $division->update($data);

        return $division->fresh();
    }

    public function destroy(Division $division)
    {
        $this->authorize('manage', Division::class);

        abort_if($division->users()->exists(), 422, 'Tidak bisa menghapus divisi yang masih punya user.');

        $division->delete();

        return response()->noContent();
    }
}