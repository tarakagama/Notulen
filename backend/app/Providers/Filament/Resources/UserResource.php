public static function form(Form $form): Form
{
    return $form
        ->schema([
            Forms\Components\TextInput::make('full_name')
                ->label('Nama Lengkap')
                ->required()
                ->maxLength(150),

            Forms\Components\TextInput::make('email')
                ->email()
                ->required()
                ->unique(ignoreRecord: true)
                ->maxLength(150),

            Forms\Components\TextInput::make('password')
                ->password()
                ->required(fn (string $context): bool => $context === 'create')
                ->dehydrated(fn ($state) => filled($state))
                ->maxLength(255),

            Forms\Components\Select::make('global_role')
                ->label('Role')
                ->options([
                    'SuperAdmin' => 'Super Admin',
                    'AdminDivisi' => 'Admin Divisi',
                    'User' => 'User',
                    'Viewer' => 'Viewer',
                ])
                ->default('User')
                ->required(),

            Forms\Components\Select::make('division_id')
                ->label('Divisi')
                ->options(fn () => \App\Models\Division::orderBy('division_name')->pluck('division_name', 'id'))
                ->searchable(),

            Forms\Components\TextInput::make('division')
                ->label('Divisi (teks lama)')
                ->maxLength(100),

            Forms\Components\TextInput::make('position_title')
                ->label('Jabatan')
                ->maxLength(100),

            Forms\Components\Toggle::make('is_active')
                ->label('Aktif')
                ->default(true),
        ]);
}

public static function table(Table $table): Table
{
    return $table
        ->columns([
            Tables\Columns\TextColumn::make('full_name')
                ->label('Nama Lengkap')
                ->searchable(),

            Tables\Columns\TextColumn::make('email')
                ->searchable(),

            Tables\Columns\TextColumn::make('global_role')
                ->label('Role')
                ->badge(),

            Forms\Components\Toggle::make('can_manage_rooms')
                ->label('Pengelola ruangan (PIC GA)')
                ->helperText('Boleh menyetujui booking & mengelola ruangan. Tidak memberi akses ke notulen.'),

            Tables\Columns\TextColumn::make('division')
                ->label('Divisi (teks lama)'),

            Tables\Columns\IconColumn::make('is_active')
                ->label('Aktif')
                ->boolean(),

            Tables\Columns\TextColumn::make('created_at')
                ->dateTime()
                ->sortable()
                ->toggleable(isToggledHiddenByDefault: true),
        ])
        ->filters([
            //
        ])
        ->actions([
            Tables\Actions\EditAction::make(),
        ])
        ->bulkActions([
            Tables\Actions\BulkActionGroup::make([
                Tables\Actions\DeleteBulkAction::make(),
            ]),
        ]);
}