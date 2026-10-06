<?php

namespace App\Filament\Resources;

use App\Filament\Resources\RoomResource\Pages;
use App\Models\Room;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class RoomResource extends Resource
{
    protected static ?string $model = Room::class;

    protected static ?string $navigationIcon = 'heroicon-o-building-office';

    protected static ?string $modelLabel = 'Ruangan';

    protected static ?string $pluralModelLabel = 'Ruangan';

    protected static ?string $navigationLabel = 'Ruangan';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('room_name')
                    ->label('Nama Ruangan')
                    ->required()
                    ->maxLength(100),

                Forms\Components\TextInput::make('building')
                    ->label('Gedung')
                    ->required()
                    ->maxLength(100),

                Forms\Components\TextInput::make('floor')
                    ->label('Lantai')
                    ->required()
                    ->maxLength(20),

                Forms\Components\TextInput::make('capacity')
                    ->label('Kapasitas (orang)')
                    ->numeric()
                    ->minValue(1)
                    ->required(),

                Forms\Components\TagsInput::make('facilities')
                    ->label('Fasilitas')
                    ->suggestions(['Proyektor', 'TV', 'Whiteboard', 'Video Conference', 'Sound System', 'AC'])
                    ->placeholder('Ketik lalu tekan Enter')
                    ->columnSpanFull(),

                Forms\Components\Toggle::make('is_active')
                    ->label('Aktif')
                    ->helperText('Matikan untuk menonaktifkan ruangan (tidak muncul di pilihan booking). Booking lama tetap tersimpan.')
                    ->default(true),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('room_name')
                    ->label('Ruangan')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('building')
                    ->label('Gedung')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('floor')
                    ->label('Lantai'),

                Tables\Columns\TextColumn::make('capacity')
                    ->label('Kapasitas')
                    ->sortable(),

                Tables\Columns\TextColumn::make('facilities')
                    ->label('Fasilitas')
                    ->badge(),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('Aktif')
                    ->boolean(),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Status aktif'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->defaultSort('building');
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListRooms::route('/'),
            'create' => Pages\CreateRoom::route('/create'),
            'edit' => Pages\EditRoom::route('/{record}/edit'),
        ];
    }
}