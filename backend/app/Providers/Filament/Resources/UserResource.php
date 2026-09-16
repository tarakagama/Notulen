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

            Forms\Components\Toggle::make('is_admin')
                ->label('Admin'),

            Forms\Components\TextInput::make('division')
                ->label('Divisi')
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

            Tables\Columns\IconColumn::make('is_admin')
                ->label('Admin')
                ->boolean(),

            Tables\Columns\TextColumn::make('division')
                ->label('Divisi'),

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