namespace Portal {
    //#region Utilities
    /**
     * A simple event dispatcher class.
     */
    export class Event<T extends (...args: any[]) => any> {
        protected handlers: T[] = [];

        public subscribe(handler: T): { unsubscribe: () => void } {
            if (!this.handlers.includes(handler)) {
                this.handlers.push(handler);
            }
            return { unsubscribe: () => this.unsubscribe(handler) };
        }

        public unsubscribe(handler: T): void {
            const index = this.handlers.indexOf(handler);
            if (index > -1) {
                this.handlers.splice(index, 1);
            }
        }

        public dispatch(...args: Parameters<T>): void {
            for (const handler of this.handlers) {
                try {
                    handler(...args);
                } catch (e) {
                    mod.SendErrorReport(mod.Message(`Error in event handler: ${e}`));
                }
            }
        }
    }
    //#endregion

    export type RuntimeSpawnable = mod.RuntimeSpawn_Common | mod.RuntimeSpawn_Abbasid | mod.RuntimeSpawn_Aftermath | mod.RuntimeSpawn_Badlands | mod.RuntimeSpawn_Battery | mod.RuntimeSpawn_Capstone | mod.RuntimeSpawn_Dumbo | mod.RuntimeSpawn_FireStorm | mod.RuntimeSpawn_Limestone | mod.RuntimeSpawn_Outskirts | mod.RuntimeSpawn_Tungsten;

    //#region GameObject
    export abstract class GameObject {
        protected _native: mod.Object;
        protected static instanceMap = new Map<number, GameObject>();

        protected constructor(native: mod.Object) {
            this._native = native;
            const id = mod.GetObjId(this._native);
            if (id !== -1 && !GameObject.instanceMap.has(id)) {
                GameObject.instanceMap.set(id, this);
            }
        }

        public static fromNative(native: mod.Object): GameObject {
            const id = mod.GetObjId(native);
            if (id !== -1 && GameObject.hasInstance(id)) {
                return GameObject.getInstance(id)!;
            }

            if (mod.IsType(native, mod.Types.Player)) {
                return Player.fromNative(native as mod.Player);
            }
            if (mod.IsType(native, mod.Types.Vehicle)) {
                return Vehicle.fromNative(native as mod.Vehicle);
            }
            if (mod.IsType(native, mod.Types.CapturePoint)) {
                return CapturePoint.fromNative(native as mod.CapturePoint);
            }
            if (mod.IsType(native, mod.Types.HQ)) {
                return HQ.fromNative(native as mod.HQ);
            }
            if (mod.IsType(native, mod.Types.Sector)) {
                return Sector.fromNative(native as mod.Sector);
            }
            if (mod.IsType(native, mod.Types.MCOM)) {
                return MCOM.fromNative(native as mod.MCOM);
            }
            if (mod.IsType(native, mod.Types.VFX)) {
                return VFX.fromNative(native as mod.VFX);
            }
            if (mod.IsType(native, mod.Types.SFX)) {
                return SFX.fromNative(native as mod.SFX);
            }
            if (mod.IsType(native, mod.Types.SpatialObject)) {
                return SpatialObject.fromNative(native as mod.SpatialObject);
            }
            if (mod.IsType(native, mod.Types.SpawnPoint)) {
                return SpawnPoint.fromNative(native as mod.SpawnPoint);
            }
            if (mod.IsType(native, mod.Types.AreaTrigger)) {
                return AreaTrigger.fromNative(native as mod.AreaTrigger);
            }
            if (mod.IsType(native, mod.Types.InteractPoint)) {
                return InteractPoint.fromNative(native as mod.InteractPoint);
            }
            if (mod.IsType(native, mod.Types.EmplacementSpawner)) {
                return EmplacementSpawner.fromNative(native as mod.EmplacementSpawner);
            }
            if (mod.IsType(native, mod.Types.LootSpawner)) {
                return LootSpawner.fromNative(native as mod.LootSpawner);
            }
            if (mod.IsType(native, mod.Types.Spawner)) {
                return Spawner.fromNative(native as mod.Spawner);
            }
            if (mod.IsType(native, mod.Types.WorldIcon)) {
                return WorldIcon.fromNative(native as mod.WorldIcon);
            }
            if (mod.IsType(native, mod.Types.RingOfFire)) {
                return RingOfFire.fromNative(native as mod.RingOfFire);
            }
            if (mod.IsType(native, mod.Types.ScreenEffect)) {
                return ScreenEffect.fromNative(native as mod.ScreenEffect);
            }
            if (mod.IsType(native, mod.Types.WaypointPath)) {
                return WaypointPath.fromNative(native as mod.WaypointPath);
            }

            // Fallback for unknown types
            return new (class extends GameObject { })(native);
        }

        public static getInstance(id: number): GameObject | undefined {
            return GameObject.instanceMap.get(id);
        }

        public static hasInstance(id: number): boolean {
            return GameObject.instanceMap.has(id);
        }

        public static removeInstance(id: number): void {
            GameObject.instanceMap.delete(id);
        }

        protected static createObject<T extends GameObject>(
            prefab: RuntimeSpawnable,
            position: Vector,
            rotation: Vector = Vector.Zero,
            scale: Vector = Vector.One
        ): T | null {
            const native = mod.SpawnObject(prefab, position.native, rotation.native, scale.native);
            if (native) {
                const id = mod.GetObjId(native);
                if (id !== -1) {
                    return GameObject.fromNative(native) as T;
                }
            }
            return null;
        }

        public get native(): mod.Object {
            return this._native;
        }

        public get id(): number {
            return mod.GetObjId(this._native);
        }

        public get position(): Vector {
            return Vector.fromNative(mod.GetObjectPosition(this._native));
        }

        public set position(value: Vector) {
            this.moveBy(value.subtract(this.position));
        }

        public get rotation(): Vector {
            return Vector.fromNative(mod.GetObjectRotation(this._native));
        }

        public set rotation(value: Vector) {
            this.rotateBy(value.subtract(this.rotation));
        }

        public get transform(): mod.Transform {
            return mod.GetObjectTransform(this._native);
        }

        public set transform(value: mod.Transform) {
            mod.SetObjectTransform(this._native, value);
        }

        public destroy(): void {
            mod.UnspawnObject(this._native);
            GameObject.removeInstance(this.id);
        }

        /**
         * Moves the object by a relative position and rotation delta over a specified time.
         * @param positionDelta The relative change in position.
         * @param rotationDelta The relative change in rotation (Euler angles).
         * @param time The duration of the movement in seconds.
         * @param shouldLoop Whether the movement should loop.
         * @param shouldReverse Whether the movement should reverse at the end of each loop.
         */
        public moveOverTime(positionDelta: Vector, rotationDelta: Vector, time: number, shouldLoop: boolean = false, shouldReverse: boolean = false): void {
            mod.MoveObjectOverTime(this._native, positionDelta.native, rotationDelta.native, time, shouldLoop, shouldReverse);
        }

        /**
         * Orbits the object around a central point.
         * @param orbitCenter The transform of the central point to orbit.
         * @param time The duration of one full orbit in seconds.
         * @param radius The radius of the orbit.
         * @param shouldLoop Whether the orbit should loop.
         * @param shouldReverse Whether the orbit direction should reverse at the end of each loop.
         * @param clockwise Whether the orbit should be clockwise.
         * @param orbitAxis An optional axis for the orbit; defaults to the up vector of the orbitCenter transform.
         */
        public orbitOverTime(orbitCenter: mod.Transform, time: number, radius: number, shouldLoop: boolean = false, shouldReverse: boolean = false, clockwise: boolean = true, orbitAxis?: Vector): void {
            if (orbitAxis) {
                mod.OrbitObjectOverTime(this._native, orbitCenter, time, radius, shouldLoop, shouldReverse, clockwise, orbitAxis.native);
            } else {
                mod.OrbitObjectOverTime(this._native, orbitCenter, time, radius, shouldLoop, shouldReverse, clockwise);
            }
        }

        /**
         * Instantly moves the object by a relative position and rotation delta.
         * @param positionDelta The relative change in position.
         * @param rotationDelta An optional relative change in rotation (Euler angles).
         */
        public moveBy(positionDelta: Vector, rotationDelta?: Vector): void {
            if (rotationDelta) {
                mod.MoveObject(this._native, positionDelta.native, rotationDelta.native);
            } else {
                mod.MoveObject(this._native, positionDelta.native);
            }
        }

        /**
         * Instantly rotates the object by a relative rotation delta.
         * @param rotationDelta The relative change in rotation (Euler angles).
         */
        public rotateBy(rotationDelta: Vector): void {
            mod.RotateObject(this._native, rotationDelta.native);
        }

        /**
         * Moves the object to a new transform over a specified time.
         * @param transform The target transform (position and rotation).
         * @param time The duration of the movement in seconds.
         * @param shouldLoop Whether the movement should loop.
         * @param shouldReverse Whether the movement should reverse at the end of each loop.
         */
        public setTransformOverTime(transform: mod.Transform, time: number, shouldLoop: boolean = false, shouldReverse: boolean = false): void {
            mod.SetObjectTransformOverTime(this._native, transform, time, shouldLoop, shouldReverse);
        }

        /**
         * Plays a sound from an SFX object, optionally restricted to a specific audience.
         * @param sound The SFX object to play.
         * @param amplitude The volume of the sound (0.0 to 1.0).
         * @param location The position to play the sound at. Defaults to the object's current position.
         * @param attenuationRange The distance over which the sound attenuates.
         * @param restrictTo An optional player, squad, or team to restrict the sound to.
         */
        public playSound(sound: SFX, amplitude: number = 1.0, location?: Vector, attenuationRange: number = 100, restrictTo?: Player | Squad | Team): void {
            const pos = location ?? this.position;
            if (restrictTo) {
                mod.PlaySound(sound.native, amplitude, pos.native, attenuationRange, restrictTo.native as any);
            } else {
                mod.PlaySound(sound.native, amplitude, pos.native, attenuationRange);
            }
        }

        /**
         * Plays a voice-over event associated with this object.
         * @param event The voice-over event to play.
         * @param flag A flag to specify variations of the voice-over.
         * @param restrictTo An optional player, squad, or team to restrict the voice-over to.
         */
        public playVoiceOver(event: mod.VoiceOverEvents2D, flag: mod.VoiceOverFlags, restrictTo?: Player | Squad | Team): void {
            if (restrictTo) {
                mod.PlayVO(this.id, event, flag, restrictTo.native as any);
            } else {
                mod.PlayVO(this.id, event, flag);
            }
        }

        public stopMovement(): void {
            mod.StopActiveMovementForObject(this._native);
        }
    }
    //#endregion

    //#region Player
    export class InputRestrictions {
        private player: Player;
        private restrictions = new Map<mod.RestrictedInputs, boolean>();

        constructor(player: Player) {
            this.player = player;
        }

        private setRestriction(input: mod.RestrictedInputs, value: boolean) {
            this.restrictions.set(input, value);
            mod.EnableInputRestriction(this.player.native, input, value);
        }

        private getRestriction(input: mod.RestrictedInputs): boolean {
            return this.restrictions.get(input) ?? false;
        }

        public set all(value: boolean) {
            mod.EnableAllInputRestrictions(this.player.native, value);
            Object.values(mod.RestrictedInputs).forEach(input => {
                if (typeof input === 'number') { // Enums have reverse mappings
                    this.restrictions.set(input as mod.RestrictedInputs, value);
                }
            });
        }

        public get cameraPitch(): boolean { return this.getRestriction(mod.RestrictedInputs.CameraPitch); }
        public set cameraPitch(value: boolean) { this.setRestriction(mod.RestrictedInputs.CameraPitch, value); }

        public get cameraYaw(): boolean { return this.getRestriction(mod.RestrictedInputs.CameraYaw); }
        public set cameraYaw(value: boolean) { this.setRestriction(mod.RestrictedInputs.CameraYaw, value); }

        public get crouch(): boolean { return this.getRestriction(mod.RestrictedInputs.Crouch); }
        public set crouch(value: boolean) { this.setRestriction(mod.RestrictedInputs.Crouch, value); }

        public get cycleFire(): boolean { return this.getRestriction(mod.RestrictedInputs.CycleFire); }
        public set cycleFire(value: boolean) { this.setRestriction(mod.RestrictedInputs.CycleFire, value); }

        public get cyclePrimary(): boolean { return this.getRestriction(mod.RestrictedInputs.CyclePrimary); }
        public set cyclePrimary(value: boolean) { this.setRestriction(mod.RestrictedInputs.CyclePrimary, value); }

        public get fireWeapon(): boolean { return this.getRestriction(mod.RestrictedInputs.FireWeapon); }
        public set fireWeapon(value: boolean) { this.setRestriction(mod.RestrictedInputs.FireWeapon, value); }

        public get interact(): boolean { return this.getRestriction(mod.RestrictedInputs.Interact); }
        public set interact(value: boolean) { this.setRestriction(mod.RestrictedInputs.Interact, value); }

        public get jump(): boolean { return this.getRestriction(mod.RestrictedInputs.Jump); }
        public set jump(value: boolean) { this.setRestriction(mod.RestrictedInputs.Jump, value); }

        public get moveForwardBack(): boolean { return this.getRestriction(mod.RestrictedInputs.MoveForwardBack); }
        public set moveForwardBack(value: boolean) { this.setRestriction(mod.RestrictedInputs.MoveForwardBack, value); }

        public get moveLeftRight(): boolean { return this.getRestriction(mod.RestrictedInputs.MoveLeftRight); }
        public set moveLeftRight(value: boolean) { this.setRestriction(mod.RestrictedInputs.MoveLeftRight, value); }

        public get prone(): boolean { return this.getRestriction(mod.RestrictedInputs.Prone); }
        public set prone(value: boolean) { this.setRestriction(mod.RestrictedInputs.Prone, value); }

        public get reload(): boolean { return this.getRestriction(mod.RestrictedInputs.Reload); }
        public set reload(value: boolean) { this.setRestriction(mod.RestrictedInputs.Reload, value); }

        public get selectCharacterGadget(): boolean { return this.getRestriction(mod.RestrictedInputs.SelectCharacterGadget); }
        public set selectCharacterGadget(value: boolean) { this.setRestriction(mod.RestrictedInputs.SelectCharacterGadget, value); }

        public get selectMelee(): boolean { return this.getRestriction(mod.RestrictedInputs.SelectMelee); }
        public set selectMelee(value: boolean) { this.setRestriction(mod.RestrictedInputs.SelectMelee, value); }

        public get selectOpenGadget(): boolean { return this.getRestriction(mod.RestrictedInputs.SelectOpenGadget); }
        public set selectOpenGadget(value: boolean) { this.setRestriction(mod.RestrictedInputs.SelectOpenGadget, value); }

        public get selectPrimary(): boolean { return this.getRestriction(mod.RestrictedInputs.SelectPrimary); }
        public set selectPrimary(value: boolean) { this.setRestriction(mod.RestrictedInputs.SelectPrimary, value); }

        public get selectSecondary(): boolean { return this.getRestriction(mod.RestrictedInputs.SelectSecondary); }
        public set selectSecondary(value: boolean) { this.setRestriction(mod.RestrictedInputs.SelectSecondary, value); }

        public get selectThrowable(): boolean { return this.getRestriction(mod.RestrictedInputs.SelectThrowable); }
        public set selectThrowable(value: boolean) { this.setRestriction(mod.RestrictedInputs.SelectThrowable, value); }

        public get sprint(): boolean { return this.getRestriction(mod.RestrictedInputs.Sprint); }
        public set sprint(value: boolean) { this.setRestriction(mod.RestrictedInputs.Sprint, value); }

        public get zoom(): boolean { return this.getRestriction(mod.RestrictedInputs.Zoom); }
        public set zoom(value: boolean) { this.setRestriction(mod.RestrictedInputs.Zoom, value); }
    }

    export class Weapon {
        public readonly type: mod.Weapons;
        private attachments: mod.WeaponAttachments[] = [];

        /** @internal */
        public _inventoryManager: InventoryManager | null = null;
        /** @internal */
        public _inventorySlot: mod.InventorySlots | null = null;

        constructor(type: mod.Weapons) {
            this.type = type;
        }

        public addAttachment(attachment: mod.WeaponAttachments): this {
            const getSlot = (att: mod.WeaponAttachments) => (mod.WeaponAttachments[att] as string).split('_')[0];
            const newSlot = getSlot(attachment);

            // Remove any existing attachment in the same slot
            const existingIndex = this.attachments.findIndex(existing => getSlot(existing) === newSlot);
            if (existingIndex > -1) {
                // If the exact same attachment is already there, do nothing.
                if (this.attachments[existingIndex] === attachment) {
                    return this;
                }
                this.attachments.splice(existingIndex, 1);
            }

            this.attachments.push(attachment);

            // If this weapon is equipped, trigger an update
            if (this._inventoryManager && this._inventorySlot) {
                this._inventoryManager._updateWeapon(this._inventorySlot, this);
            }

            return this;
        }

        public removeAttachment(attachment: mod.WeaponAttachments): this {
            const index = this.attachments.indexOf(attachment);
            if (index > -1) {
                this.attachments.splice(index, 1);
                if (this._inventoryManager && this._inventorySlot) {
                    this._inventoryManager._updateWeapon(this._inventorySlot, this);
                }
            }
            return this;
        }

        /** @internal */
        public _buildPackage(): mod.WeaponPackage {
            const weaponPackage = mod.CreateNewWeaponPackage();
            for (const attachment of this.attachments) {
                mod.AddAttachmentToWeaponPackage(attachment, weaponPackage);
            }
            return weaponPackage;
        }
    }

    export class InventoryManager {
        private player: Player;
        private inventory = new Map<mod.InventorySlots, Weapon | mod.Weapons | mod.Gadgets | mod.ArmorTypes | null>();

        constructor(player: Player) {
            this.player = player;
        }

        /** @internal */
        public _updateWeapon(slot: mod.InventorySlots, weapon: Weapon) {
            this.setSlot(slot, weapon);
        }

        private setSlot(slot: mod.InventorySlots, item: Weapon | mod.Weapons | mod.Gadgets | mod.ArmorTypes | null) {
            // If the old item was a weapon, clear its inventory links
            const oldItem = this.inventory.get(slot);
            if (oldItem instanceof Weapon) {
                oldItem._inventoryManager = null;
                oldItem._inventorySlot = null;
            }

            this.inventory.set(slot, item);

            // Always remove the equipment from the slot first to ensure it's clear.
            mod.RemoveEquipment(this.player.native, slot);

            if (item) {
                if (item instanceof Weapon) {
                    // Link the new weapon to this inventory
                    item._inventoryManager = this;
                    item._inventorySlot = slot;

                    const weaponPackage = item._buildPackage();
                    mod.AddEquipment(this.player.native, item.type, weaponPackage, slot);
                } else {
                    mod.AddEquipment(this.player.native, item as any, slot);
                }
            }
        }

        private getSlot(slot: mod.InventorySlots): Weapon | mod.Weapons | mod.Gadgets | mod.ArmorTypes | null {
            return this.inventory.get(slot) ?? null;
        }

        public get primary(): Weapon | mod.Weapons | null { return this.getSlot(mod.InventorySlots.PrimaryWeapon) as any; }
        public set primary(item: Weapon | mod.Weapons | null) { this.setSlot(mod.InventorySlots.PrimaryWeapon, item); }

        public get secondary(): Weapon | mod.Weapons | null { return this.getSlot(mod.InventorySlots.SecondaryWeapon) as any; }
        public set secondary(item: Weapon | mod.Weapons | null) { this.setSlot(mod.InventorySlots.SecondaryWeapon, item); }

        public get gadget1(): mod.Gadgets | null { return this.getSlot(mod.InventorySlots.GadgetOne) as any; }
        public set gadget1(item: mod.Gadgets | null) { this.setSlot(mod.InventorySlots.GadgetOne, item); }

        public get gadget2(): mod.Gadgets | null { return this.getSlot(mod.InventorySlots.GadgetTwo) as any; }
        public set gadget2(item: mod.Gadgets | null) { this.setSlot(mod.InventorySlots.GadgetTwo, item); }

        public get throwable(): mod.Gadgets | null { return this.getSlot(mod.InventorySlots.Throwable) as any; }
        public set throwable(item: mod.Gadgets | null) { this.setSlot(mod.InventorySlots.Throwable, item); }

        public get melee(): mod.Weapons | null { return this.getSlot(mod.InventorySlots.MeleeWeapon) as any; }
        public set melee(item: mod.Weapons | null) { this.setSlot(mod.InventorySlots.MeleeWeapon, item); }

        public get characterGadget(): mod.Gadgets | null { return this.getSlot(mod.InventorySlots.ClassGadget) as any; }
        public set characterGadget(item: mod.Gadgets | null) { this.setSlot(mod.InventorySlots.ClassGadget, item); }

        public get miscGadget(): mod.Gadgets | null { return this.getSlot(mod.InventorySlots.MiscGadget) as any; }
        public set miscGadget(item: mod.Gadgets | null) { this.setSlot(mod.InventorySlots.MiscGadget, item); }

        public get callins(): any | null { return this.getSlot(mod.InventorySlots.Callins) as any; }
        public set callins(item: any | null) { this.setSlot(mod.InventorySlots.Callins, item); }

        public setAmmo(slot: mod.InventorySlots, ammo: number): void {
            mod.SetInventoryAmmo(this.player.native, slot, ammo);
        }

        public setMagazineAmmo(slot: mod.InventorySlots, magAmmo: number): void {
            mod.SetInventoryMagazineAmmo(this.player.native, slot, magAmmo);
        }

        public switchTo(slot: mod.InventorySlots): void {
            mod.ForceSwitchInventory(this.player.native, slot);
        }
    }

    export class Player extends GameObject {
        protected declare _native: mod.Player;
        public readonly inputRestrictions: InputRestrictions;
        public readonly inventory: InventoryManager;

        protected constructor(native: mod.Player) {
            super(native);
            this.inputRestrictions = new InputRestrictions(this);
            this.inventory = new InventoryManager(this);
        }

        public static fromNative(native: mod.Player): Player {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as Player;
            }

            const isAI = mod.GetSoldierState(native, mod.SoldierStateBool.IsAISoldier);
            if (isAI) {
                return new AIPlayer(native);
            }
            return new Player(native);
        }

        public get native(): mod.Player {
            return this._native;
        }

        public get isAISoldier(): boolean {
            return mod.GetSoldierState(this._native, mod.SoldierStateBool.IsAISoldier);
        }

        public asAI(): AIPlayer | null {
            if (this.isAISoldier) {
                return this as unknown as AIPlayer;
            }
            return null;
        }

        public get currentHealth(): number {
            return mod.GetSoldierState(this._native, mod.SoldierStateNumber.CurrentHealth);
        }

        public set currentHealth(value: number) {
            let currentHealth = this.currentHealth;
            if (value > currentHealth) {
                this.heal(value - currentHealth);
            } else {
                this.damage(currentHealth - value);
            }
        }

        public get maxHealth(): number {
            return mod.GetSoldierState(this._native, mod.SoldierStateNumber.MaxHealth);
        }

        public set maxHealth(value: number) {
            mod.SetPlayerMaxHealth(this._native, value);
        }

        public get isAlive(): boolean {
            return mod.GetSoldierState(this._native, mod.SoldierStateBool.IsAlive);
        }

        public kill(): void {
            mod.Kill(this._native);
        }

        public spot(duration: number, spotStatus: mod.SpotStatus, spotter?: Player): void {
            if (spotter) {
                mod.SpotTarget(this.native, spotter.native, duration, spotStatus);
            } else {
                mod.SpotTarget(this.native, duration, spotStatus);
            }
        }

        public teleport(destination: Vector, orientation?: number): void {
            mod.Teleport(this.native, destination.native, orientation ?? 0);
        }

        public set skipManDown(value: boolean) {
            mod.SkipManDown(this.native, value);
        }

        public forceRevive(): void {
            mod.ForceRevive(this.native);
        }

        public forceManDown(): void {
            mod.ForceManDown(this.native);
        }

        public resupply(type: mod.ResupplyTypes): void {
            mod.Resupply(this.native, type);
        }

        public set movementSpeedMultiplier(value: number) {
            mod.SetPlayerMovementSpeedMultiplier(this.native, value);
        }

        public setTeam(team: Team): void {
            mod.SetTeam(this.native, team.native);
        }

        public deploy(): void {
            mod.DeployPlayer(this.native);
        }

        public undeploy(): void {
            mod.UndeployPlayer(this.native);
        }

        public setDeployAllowed(allowed: boolean): void {
            mod.EnablePlayerDeploy(this.native, allowed);
        }

        public setRedeployTime(time: number): void {
            mod.SetRedeployTime(this.native, time);
        }

        public setScoreboardValues(values: number[]): void {
            Scoreboard.setPlayerValues(this, values);
        }

        public setGameScore(score: number): void {
            Scoreboard.setGameScore(this, score);
        }

        public unspot(spotter?: Player): void {
            if (spotter) {
                mod.SpotTarget(this.native, spotter.native, 0, mod.SpotStatus.Unspot);
            } else {
                mod.SpotTarget(this.native, 0, mod.SpotStatus.Unspot);
            }
        }

        public heal(amount: number): void {
            mod.Heal(this.native, amount);
        }

        public damage(amount: number): void {
            mod.DealDamage(this.native, amount);
        }

        public enableScreenEffect(effect: mod.ScreenEffects, enable: boolean): void {
            mod.EnableScreenEffect(this.native, effect, enable);
        }

        public static getAll(): Player[] {
            const allPlayersNative = mod.AllPlayers();
            const count = mod.CountOf(allPlayersNative);
            const players: Player[] = [];
            for (let i = 0; i < count; i++) {
                const playerNative = mod.ValueInArray(allPlayersNative, i) as mod.Player;
                players.push(Player.fromNative(playerNative));
            }
            return players;
        }

        public static getClosestTo(position: Vector, team?: Team): Player | null {
            const playerNative = team ? mod.ClosestPlayerTo(position.native, team.native) : mod.ClosestPlayerTo(position.native);
            if (mod.IsPlayerValid(playerNative)) {
                return Player.fromNative(playerNative);
            }
            return null;
        }

        public static getFarthestFrom(position: Vector, team?: Team): Player | null {
            const playerNative = team ? mod.FarthestPlayerFrom(position.native, team.native) : mod.FarthestPlayerFrom(position.native);
            if (mod.IsPlayerValid(playerNative)) {
                return Player.fromNative(playerNative);
            }
            return null;
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
        public onPlayerDied = new Event<(killer: Player, deathType: mod.DeathType, weapon: mod.WeaponUnlock) => Promise<void>>();
        public onPlayerDamaged = new Event<(damager: Player, damageType: mod.DamageType, weapon: mod.WeaponUnlock) => Promise<void>>();
        public onPlayerEnterVehicle = new Event<(vehicle: Vehicle) => Promise<void>>();
        public onPlayerExitVehicle = new Event<(vehicle: Vehicle) => Promise<void>>();
        public onEnterCapturePoint = new Event<(capturePoint: CapturePoint) => Promise<void>>();
        public onExitCapturePoint = new Event<(capturePoint: CapturePoint) => Promise<void>>();
        public onEnterAreaTrigger = new Event<(areaTrigger: AreaTrigger) => Promise<void>>();
        public onExitAreaTrigger = new Event<(areaTrigger: AreaTrigger) => Promise<void>>();
        public onInteract = new Event<(interactPoint: InteractPoint) => Promise<void>>();
        public onManDown = new Event<(killer: Player | null) => Promise<void>>();
        public onDeployed = new Event<() => Promise<void>>();
        public onEarnedKill = new Event<(victim: Player, deathType: mod.DeathType, weapon: mod.WeaponUnlock) => Promise<void>>();
        public onEarnedKillAssist = new Event<(victim: Player) => Promise<void>>();
        public onEnterVehicleSeat = new Event<(vehicle: Vehicle, seat: number) => Promise<void>>();
        public onExitVehicleSeat = new Event<(vehicle: Vehicle, seat: number) => Promise<void>>();
        public onPlayerRejoinGame = new Event<() => Promise<void>>();
        public onSwitchTeam = new Event<(newTeam: Team) => Promise<void>>();
        public onUndeploy = new Event<() => Promise<void>>();
        public onRevived = new Event<(reviver: Player) => Promise<void>>();

        public get team(): Team {
            return Team.fromNative(mod.GetTeam(this.native));
        }

        public get squad(): Squad {
            return Squad.fromNative(mod.GetSquad(this.native));
        }
    }

    export class AIPlayer extends Player {
        constructor(native: mod.Player) {
            super(native);
        }

        public setBehavior(behavior: 'battlefield' | 'idle' | 'parachute'): void {
            if (behavior === 'battlefield') mod.AIBattlefieldBehavior(this.native);
            else if (behavior === 'idle') mod.AIIdleBehavior(this.native);
            else if (behavior === 'parachute') mod.AIParachuteBehavior(this.native);
        }

        public moveTo(position: Vector, isLOS: boolean = false): void {
            if (isLOS) {
                mod.AILOSMoveToBehavior(this.native, position.native);
            } else {
                mod.AIMoveToBehavior(this.native, position.native);
            }
        }

        // AI specific events
        public onAIMoveToFailed = new Event<() => Promise<void>>();
        public onAIMoveToRunning = new Event<() => Promise<void>>();
        public onAIMoveToSucceeded = new Event<() => Promise<void>>();
        public onAIParachuteRunning = new Event<() => Promise<void>>();
        public onAIParachuteSucceeded = new Event<() => Promise<void>>();
        public onAIWaypointIdleFailed = new Event<() => Promise<void>>();
        public onAIWaypointIdleRunning = new Event<() => Promise<void>>();
        public onAIWaypointIdleSucceeded = new Event<() => Promise<void>>();

        public personality: AIPersonality | null = null;

        private _currentPath: Vector[] | null = null;
        private _currentWaypointIndex: number = 0;

        /**
         * Instructs the AI to follow a dynamic path of waypoints.
         * The AI will move to each waypoint in sequence, looping when the end is reached.
         * @param path An array of Vector positions or WaypointPath objects to follow.
         * @param startIndex The index of the waypoint to start from.
         */
        public followPath(path: (Vector | WaypointPath)[], startIndex: number = 0): void {
            if (path.length > 0 && path[0] instanceof WaypointPath) {
                this._currentPath = (path as WaypointPath[]).map(wp => wp.position);
            } else {
                this._currentPath = path as Vector[];
            }

            this._currentWaypointIndex = startIndex;

            if (this._currentPath && this._currentPath.length > 0) {
                const targetWaypoint = this._currentPath[this._currentWaypointIndex];
                if (targetWaypoint) {
                    this.moveTo(targetWaypoint);
                }
            }
        }

        /**
         * Stops the AI from following its current path.
         */
        public stopFollowingPath(): void {
            this._currentPath = null;
            this._currentWaypointIndex = 0;
            this.setBehavior('idle'); // Or another default behavior
        }

        /** @internal */
        public _onMoveToSucceeded(): void {
            if (this._currentPath && this._currentPath.length > 0) {
                this._currentWaypointIndex++;
                // Loop back to the start if we've completed the path
                if (this._currentWaypointIndex >= this._currentPath.length) {
                    this._currentWaypointIndex = 0;
                }

                const nextWaypoint = this._currentPath[this._currentWaypointIndex];
                if (nextWaypoint) {
                    this.moveTo(nextWaypoint);
                }
            }
        }

        public defendPosition(position: Vector, minDistance: number, maxDistance: number): void {
            mod.AIDefendPositionBehavior(this.native, position.native, minDistance, maxDistance);
        }

        public validatedMoveTo(position: Vector): void {
            mod.AIValidatedMoveToBehavior(this.native, position.native);
        }

        public patrolWaypoint(waypointPath: WaypointPath): void {
            mod.AIWaypointIdleBehavior(this.native, waypointPath.native);
        }

        public enableShooting(enable: boolean): void {
            mod.AIEnableShooting(this.native, enable);
        }

        public enableTargeting(enable: boolean): void {
            mod.AIEnableTargeting(this.native, enable);
        }

        public forceFire(duration: number): void {
            mod.AIForceFire(this.native, duration);
        }

        public setFocusPoint(point: Vector, isTarget: boolean): void {
            mod.AISetFocusPoint(this.native, point.native, isTarget);
        }

        public setMoveSpeed(speed: mod.MoveSpeed): void {
            mod.AISetMoveSpeed(this.native, speed);
        }

        public setStance(stance: mod.Stance): void {
            mod.AISetStance(this.native, stance);
        }

        public setTarget(target: Player | null): void {
            if (target) {
                mod.AISetTarget(this.native, target.native);
            } else {
                mod.AISetTarget(this.native);
            }
        }

        public startUsingGadget(gadget: mod.OpenGadgets, target: Vector | Player): void {
            if (target instanceof Vector) {
                mod.AIStartUsingGadget(this.native, gadget, target.native);
            } else {
                mod.AIStartUsingGadget(this.native, gadget, target.native);
            }
        }

        public stopUsingGadget(): void {
            mod.AIStopUsingGadget(this.native);
        }
    }
    //#endregion

    //#region Vehicle
    export class Vehicle extends GameObject {
        protected declare _native: mod.Vehicle;

        protected constructor(native: mod.Vehicle) {
            super(native);
        }

        public static fromNative(native: mod.Vehicle): Vehicle {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as Vehicle;
            }
            return new Vehicle(native);
        }

        public get native(): mod.Vehicle {
            return this._native;
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
        public onPlayerEnterVehicle = new Event<(player: Player) => Promise<void>>();
        public onPlayerExitVehicle = new Event<(player: Player) => Promise<void>>();
        public onVehicleDestroyed = new Event<() => Promise<void>>();
        public onEnterVehicleSeat = new Event<(player: Player, seat: number) => Promise<void>>();
        public onExitVehicleSeat = new Event<(player: Player, seat: number) => Promise<void>>();
    }
    //#endregion

    //#region Objectives
    export abstract class Objective extends GameObject {
        protected constructor(native: mod.Object) {
            super(native);
        }

        public set isEnabled(value: boolean) {
            mod.EnableGameModeObjective(this.native as mod.CapturePoint | mod.HQ | mod.Sector | mod.MCOM, value);
        }
    }

    export class CapturePoint extends Objective {
        protected declare _native: mod.CapturePoint;

        private constructor(native: mod.CapturePoint) {
            super(native);
        }

        public static create(position: Vector, rotation: Vector = Vector.Zero, scale: Vector = Vector.One): CapturePoint | null {
            return GameObject.createObject<CapturePoint>(mod.RuntimeSpawn_Common.CapturePoint, position, rotation, scale);
        }

        public static fromNative(native: mod.CapturePoint): CapturePoint {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as CapturePoint;
            }
            return new CapturePoint(native);
        }

        public get native(): mod.CapturePoint {
            return this._native;
        }

        public get captureProgress(): number {
            return mod.GetCaptureProgress(this._native);
        }

        public get owner(): mod.Team {
            return mod.GetCurrentOwnerTeam(this._native);
        }

        public set owner(team: mod.Team) {
            mod.SetCapturePointOwner(this._native, team);
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
        public onCaptured = new Event<() => Promise<void>>();
        public onCapturing = new Event<() => Promise<void>>();
        public onLost = new Event<() => Promise<void>>();
        public onPlayerEnter = new Event<(player: Player) => Promise<void>>();
        public onPlayerExit = new Event<(player: Player) => Promise<void>>();
    }

    export class MCOM extends Objective {
        protected declare _native: mod.MCOM;

        private constructor(native: mod.MCOM) {
            super(native);
        }

        public static create(position: Vector, rotation: Vector = Vector.Zero, scale: Vector = Vector.One): MCOM | null {
            return GameObject.createObject<MCOM>(mod.RuntimeSpawn_Common.MCOM, position, rotation, scale);
        }

        public static fromNative(native: mod.MCOM): MCOM {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as MCOM;
            }
            return new MCOM(native);
        }

        public get native(): mod.MCOM {
            return this._native;
        }

        public set fuseTime(time: number) {
            mod.SetMCOMFuseTime(this._native, time);
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
        public onArmed = new Event<() => Promise<void>>();
        public onDefused = new Event<() => Promise<void>>();
        public onDestroyed = new Event<() => Promise<void>>();
    }

    export class HQ extends Objective {
        protected declare _native: mod.HQ;

        private constructor(native: mod.HQ) {
            super(native);
        }

        public static create(position: Vector, rotation: Vector = Vector.Zero, scale: Vector = Vector.One): HQ | null {
            return GameObject.createObject<HQ>(mod.RuntimeSpawn_Common.HQ_PlayerSpawner, position, rotation, scale);
        }

        public static fromNative(native: mod.HQ): HQ {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as HQ;
            }
            return new HQ(native);
        }

        public get native(): mod.HQ {
            return this._native;
        }

        public set team(team: mod.Team) {
            mod.SetHQTeam(this._native, team);
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
    }

    export class Sector extends Objective {
        protected declare _native: mod.Sector;

        private constructor(native: mod.Sector) {
            super(native);
        }

        public static create(position: Vector, rotation: Vector = Vector.Zero, scale: Vector = Vector.One): Sector | null {
            return GameObject.createObject<Sector>(mod.RuntimeSpawn_Common.Sector, position, rotation, scale);
        }

        public static fromNative(native: mod.Sector): Sector {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as Sector;
            }
            return new Sector(native);
        }

        public get native(): mod.Sector {
            return this._native;
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
    }
    //#endregion

    //#region Game
    export abstract class Game {
        // Static Global Events
        public static onGoing = new Event<() => Promise<void>>();
        public static onGameModeStarted = new Event<() => Promise<void>>();
        public static onGameModeEnding = new Event<() => Promise<void>>();
        public static onTimeLimitReached = new Event<() => Promise<void>>();
        public static onVehicleSpawned = new Event<(vehicle: Vehicle) => Promise<void>>();
        public static onPlayerJoined = new Event<(player: Player) => Promise<void>>();
        public static onPlayerLeft = new Event<(playerId: number) => Promise<void>>();

        // Static Global Functions
        public static end(winner?: Player | mod.Team): void {
            if (winner) {
                if (winner instanceof Player) {
                    mod.EndGameMode(winner.native);
                } else {
                    mod.EndGameMode(winner);
                }
            } else {
                // Ends in a draw
                mod.EndGameMode(mod.GetTeam(0));
            }
        }

        public static DisablePlayerJoin(): void {
            mod.DisablePlayerJoin();
        }

        public static pauseTimer(shouldPause: boolean): void {
            mod.PauseGameModeTime(shouldPause);
        }

        public static setFriendlyFire(enabled: boolean): void {
            mod.SetFriendlyFire(enabled);
        }

        public static get matchTimeElapsed(): number {
            return mod.GetMatchTimeElapsed();
        }

        public static get matchTimeRemaining(): number {
            return mod.GetMatchTimeRemaining();
        }

        public static resetTimer(): void {
            mod.ResetGameModeTime();
        }

        public static setTargetScore(score: number): void {
            mod.SetGameModeTargetScore(score);
        }

        public static setTimeLimit(seconds: number): void {
            mod.SetGameModeTimeLimit(seconds);
        }

        public static deployAllPlayers(): void {
            mod.DeployAllPlayers();
        }

        public static undeployAllPlayers(): void {
            mod.UndeployAllPlayers();
        }

        public static enableAllPlayerDeploy(enabled: boolean): void {
            mod.EnableAllPlayerDeploy(enabled);
        }

        public static setAIToHumanDamageModifier(multiplier: number): void {
            mod.SetAIToHumanDamageModifier(multiplier);
        }

        public static setCameraTypeForAll(cameraType: mod.Cameras, cameraIndex?: number): void {
            if (cameraIndex !== undefined) {
                mod.SetCameraTypeForAll(cameraType, cameraIndex);
            } else {
                mod.SetCameraTypeForAll(cameraType);
            }
        }

        private static raycastCallbacks = new Map<number, {
            onHit: (position: Vector, normal: Vector, hitPlayer: Player | null, hitVehicle: Vehicle | null) => void;
            onMiss: () => void;
        }>();

        /**
         * Performs a raycast and executes a callback on hit or miss.
         * @param player The player initiating the raycast. Used to identify the callback.
         * @param start The starting position of the raycast.
         * @param stop The ending position of the raycast.
         * @param onHit The function to call if the raycast hits something.
         * @param onMiss The function to call if the raycast misses.
         */
        public static raycast(
            player: Player,
            start: Vector,
            stop: Vector,
            onHit: (position: Vector, normal: Vector, hitPlayer: Player | null, hitVehicle: Vehicle | null) => void,
            onMiss: () => void
        ): void {
            this.raycastCallbacks.set(player.id, { onHit, onMiss });
            mod.RayCast(player.native, start.native, stop.native);
        }

        /** @internal */
        public static _handleRaycastHit(eventPlayer: mod.Player, eventPosition: mod.Vector, eventNormal: mod.Vector, eventHitPlayer: mod.Player, eventHitVehicle: mod.Vehicle): void {
            const playerId = mod.GetObjId(eventPlayer);
            const callbacks = this.raycastCallbacks.get(playerId);
            if (callbacks) {
                const hitPlayer = eventHitPlayer ? Player.fromNative(eventHitPlayer) : null;
                const hitVehicle = eventHitVehicle ? Vehicle.fromNative(eventHitVehicle) : null;
                callbacks.onHit(Vector.fromNative(eventPosition), Vector.fromNative(eventNormal), hitPlayer, hitVehicle);
                this.raycastCallbacks.delete(playerId);
            }
        }

        /** @internal */
        public static _handleRaycastMiss(eventPlayer: mod.Player): void {
            const playerId = mod.GetObjId(eventPlayer);
            const callbacks = this.raycastCallbacks.get(playerId);
            if (callbacks) {
                callbacks.onMiss();
                this.raycastCallbacks.delete(playerId);
            }
        }
    }
    //#endregion

    //#region Music
    export abstract class Music {
        /**
         * Plays a music event, optionally loading a music package first.
         * @param event The music event to play.
         * @param musicPackage The music package to load before playing (optional).
         * @param target The specific player, squad, or team to play the music for (optional).
         */
        public static play(event: mod.MusicEvents, musicPackage?: mod.MusicPackages, target?: Player | Squad | Team): void {
            if (musicPackage !== undefined) {
                mod.LoadMusic(musicPackage);
            }

            if (target) {
                mod.PlayMusic(event, target.native as any);
            } else {
                mod.PlayMusic(event);
            }
        }

        /**
         * Stops music by unloading a package or playing a stop event.
         * Note: mod.StopMusic does not exist in the current SDK, so this method wraps mod.UnloadMusic or mod.PlayMusic depending on arguments.
         * @param event A specific stop event to play (optional).
         * @param musicPackage The music package to unload (optional).
         */
        public static stop(event?: mod.MusicEvents, musicPackage?: mod.MusicPackages): void {
            if (event !== undefined) {
                mod.PlayMusic(event);
            }
            if (musicPackage !== undefined) {
                mod.UnloadMusic(musicPackage);
            }
        }

        /**
         * Sets a parameter for the music system.
         * @param parameter The parameter to set.
         * @param value The value to set.
         * @param target The specific player, squad, or team to set the parameter for (optional).
         */
        public static setParameter(parameter: mod.MusicParams, value: number, target?: Player | Squad | Team): void {
            if (target) {
                mod.SetMusicParam(parameter, value, target.native as any);
            } else {
                mod.SetMusicParam(parameter, value);
            }
        }
    }
    //#endregion

    //#region UI
    export namespace UI {
        export abstract class UIWidget {
            protected _native: mod.UIWidget;
            protected static widgetMap = new Map<string, UIWidget>();
            public readonly name: string;

            protected constructor(name: string, findNative: boolean = true) {
                this.name = name;
                if (findNative) {
                    const native = mod.FindUIWidgetWithName(name);
                    if (!native) {
                        throw new Error(`UIWidget with name "${name}" not found.`);
                    }
                    this._native = native as mod.UIWidget;
                } else {
                    // The native object will be set by the builder
                    this._native = null as any;
                }
                UIWidget.widgetMap.set(name, this);
            }

            public static fromNative(native: mod.UIWidget): UIWidget | undefined {
                const name = mod.GetUIWidgetName(native);
                return UIWidget.widgetMap.get(name);
            }

            public static find(name: string): UIWidget | undefined {
                return UIWidget.widgetMap.get(name);
            }

            public get native(): mod.UIWidget {
                return this._native;
            }

            public set visible(value: boolean) {
                mod.SetUIWidgetVisible(this._native, value);
            }

            public get visible(): boolean {
                return mod.GetUIWidgetVisible(this._native);
            }

            public destroy(): void {
                mod.DeleteUIWidget(this._native);
                UIWidget.widgetMap.delete(this.name);
            }
        }

        export class TextWidget extends UIWidget {
            constructor(name: string) {
                super(name);
            }

            public get text(): mod.Message {
                // The API does not provide a getter for the text label
                throw new Error("Getting text from a TextWidget is not supported by the API.");
            }

            public set text(value: string | mod.Message) {
                mod.SetUITextLabel(this._native, typeof value === 'string' ? mod.Message(value) : value);
            }
        }

        export class UIEvent<T extends (...args: any[]) => any> extends Event<T> {
            private widget: mod.UIWidget;
            private eventType: mod.UIButtonEvent;
            private enabled = false;

            constructor(widget: mod.UIWidget, eventType: mod.UIButtonEvent) {
                super();
                this.widget = widget;
                this.eventType = eventType;
            }

            public subscribe(handler: T): { unsubscribe: () => void } {
                if (this.handlers.length === 0 && !this.enabled) {
                    mod.EnableUIButtonEvent(this.widget, this.eventType, true);
                    this.enabled = true;
                }
                return super.subscribe(handler);
            }

            public unsubscribe(handler: T): void {
                super.unsubscribe(handler);
                if (this.handlers.length === 0 && this.enabled) {
                    mod.EnableUIButtonEvent(this.widget, this.eventType, false);
                    this.enabled = false;
                }
            }
        }

        export class ButtonWidget extends UIWidget {
            constructor(name: string) {
                super(name);
                this.onButtonDown = new UIEvent(this._native, mod.UIButtonEvent.ButtonDown);
                this.onButtonUp = new UIEvent(this._native, mod.UIButtonEvent.ButtonUp);
                this.onFocusIn = new UIEvent(this._native, mod.UIButtonEvent.FocusIn);
                this.onFocusOut = new UIEvent(this._native, mod.UIButtonEvent.FocusOut);
                this.onHoverIn = new UIEvent(this._native, mod.UIButtonEvent.HoverIn);
                this.onHoverOut = new UIEvent(this._native, mod.UIButtonEvent.HoverOut);
            }

            public onButtonDown: UIEvent<(player: Player) => Promise<void>>;
            public onButtonUp: UIEvent<(player: Player) => Promise<void>>;
            public onFocusIn: UIEvent<(player: Player) => Promise<void>>;
            public onFocusOut: UIEvent<(player: Player) => Promise<void>>;
            public onHoverIn: UIEvent<(player: Player) => Promise<void>>;
            public onHoverOut: UIEvent<(player: Player) => Promise<void>>;

            public set enabled(value: boolean) {
                mod.SetUIButtonEnabled(this._native, value);
            }

            public get enabled(): boolean {
                return mod.GetUIButtonEnabled(this._native);
            }
        }

        abstract class UIWidgetBuilder<TBuilder extends UIWidgetBuilder<TBuilder, TWidget>, TWidget extends UIWidget> {
            protected params: any = {};
            protected children: UIWidgetBuilder<any, any>[] = [];

            constructor(name: string) {
                this.params.name = name;
                this.params.parent = mod.GetUIRoot(); // Default parent
            }

            public position(pos: Vector): TBuilder {
                this.params.position = pos.native;
                return this as unknown as TBuilder;
            }

            public size(size: Vector): TBuilder {
                this.params.size = size.native;
                return this as unknown as TBuilder;
            }

            public anchor(anchor: mod.UIAnchor): TBuilder {
                this.params.anchor = anchor;
                return this as unknown as TBuilder;
            }

            public parent(parent: UIWidget): TBuilder {
                this.params.parent = parent.native;
                return this as unknown as TBuilder;
            }

            public visible(visible: boolean): TBuilder {
                this.params.visible = visible;
                return this as unknown as TBuilder;
            }

            public restrictTo(target: Player | mod.Team): TBuilder {
                if (target instanceof Player) {
                    this.params.playerId = target.native;
                } else {
                    this.params.teamId = target;
                }
                return this as unknown as TBuilder;
            }

            public addChild(childBuilder: UIWidgetBuilder<any, any>): TBuilder {
                this.children.push(childBuilder);
                return this as unknown as TBuilder;
            }

            protected abstract buildInternal(): TWidget;

            public build(): TWidget {
                const widget = this.buildInternal();
                this.children.forEach(childBuilder => {
                    childBuilder.params.parent = widget.native;
                    childBuilder.build();
                });
                return widget;
            }
        }

        export class TextBuilder extends UIWidgetBuilder<TextBuilder, TextWidget> {
            constructor(name: string) {
                super(name);
                this.params.type = 'Text';
            }

            public text(text: string | mod.Message): TextBuilder {
                this.params.textLabel = typeof text === 'string' ? mod.Message(text) : text;
                return this;
            }

            public textSize(size: number): TextBuilder {
                this.params.textSize = size;
                return this;
            }

            public textColor(color: Vector): TextBuilder {
                this.params.textColor = color.native;
                return this;
            }

            protected buildInternal(): TextWidget {
                ParseUI(this.params);
                return new TextWidget(this.params.name);
            }
        }

        export class ButtonBuilder extends UIWidgetBuilder<ButtonBuilder, ButtonWidget> {
            constructor(name: string) {
                super(name);
                this.params.type = 'Button';
            }

            public enabled(isEnabled: boolean): ButtonBuilder {
                this.params.buttonEnabled = isEnabled;
                return this;
            }

            protected buildInternal(): ButtonWidget {
                ParseUI(this.params);
                return new ButtonWidget(this.params.name);
            }
        }

        function __asModVector(param: number[] | mod.Vector) {
            if (Array.isArray(param)) return mod.CreateVector(param[0], param[1], param.length == 2 ? 0 : param[2]);
            else return param;
        }

        function __asModMessage(param: string | mod.Message) {
            if (typeof param === 'string') return mod.Message(param);
            return param;
        }

        function __fillInDefaultArgs(params: any) {
            if (!params.hasOwnProperty('name')) params.name = '';
            if (!params.hasOwnProperty('position')) params.position = mod.CreateVector(0, 0, 0);
            if (!params.hasOwnProperty('size')) params.size = mod.CreateVector(100, 100, 0);
            if (!params.hasOwnProperty('anchor')) params.anchor = mod.UIAnchor.TopLeft;
            if (!params.hasOwnProperty('parent')) params.parent = mod.GetUIRoot();
            if (!params.hasOwnProperty('visible')) params.visible = true;
            if (!params.hasOwnProperty('padding')) params.padding = params.type == 'Container' ? 0 : 8;
            if (!params.hasOwnProperty('bgColor')) params.bgColor = mod.CreateVector(0.25, 0.25, 0.25);
            if (!params.hasOwnProperty('bgAlpha')) params.bgAlpha = 0.5;
            if (!params.hasOwnProperty('bgFill')) params.bgFill = mod.UIBgFill.Solid;
        }

        function __setNameAndGetWidget(uniqueName: any, params: any) {
            let widget = mod.FindUIWidgetWithName(uniqueName) as mod.UIWidget;
            mod.SetUIWidgetName(widget, params.name);
            return widget;
        }

        const __cUniqueName = '----uniquename----';

        function __addUIContainer(params: any) {
            __fillInDefaultArgs(params);
            let restrict = params.teamId ?? params.playerId;
            if (restrict) {
                mod.AddUIContainer(
                    __cUniqueName,
                    __asModVector(params.position),
                    __asModVector(params.size),
                    params.anchor,
                    params.parent,
                    params.visible,
                    params.padding,
                    __asModVector(params.bgColor),
                    params.bgAlpha,
                    params.bgFill,
                    restrict
                );
            } else {
                mod.AddUIContainer(
                    __cUniqueName,
                    __asModVector(params.position),
                    __asModVector(params.size),
                    params.anchor,
                    params.parent,
                    params.visible,
                    params.padding,
                    __asModVector(params.bgColor),
                    params.bgAlpha,
                    params.bgFill
                );
            }
            let widget = __setNameAndGetWidget(__cUniqueName, params);
            if (params.children) {
                params.children.forEach((childParams: any) => {
                    childParams.parent = widget;
                    __addUIWidget(childParams);
                });
            }
            return widget;
        }

        function __fillInDefaultTextArgs(params: any) {
            if (!params.hasOwnProperty('textLabel')) params.textLabel = '';
            if (!params.hasOwnProperty('textSize')) params.textSize = 0;
            if (!params.hasOwnProperty('textColor')) params.textColor = mod.CreateVector(1, 1, 1);
            if (!params.hasOwnProperty('textAlpha')) params.textAlpha = 1;
            if (!params.hasOwnProperty('textAnchor')) params.textAnchor = mod.UIAnchor.CenterLeft;
        }

        function __addUIText(params: any) {
            __fillInDefaultArgs(params);
            __fillInDefaultTextArgs(params);
            let restrict = params.teamId ?? params.playerId;
            if (restrict) {
                mod.AddUIText(
                    __cUniqueName,
                    __asModVector(params.position),
                    __asModVector(params.size),
                    params.anchor,
                    params.parent,
                    params.visible,
                    params.padding,
                    __asModVector(params.bgColor),
                    params.bgAlpha,
                    params.bgFill,
                    __asModMessage(params.textLabel),
                    params.textSize,
                    __asModVector(params.textColor),
                    params.textAlpha,
                    params.textAnchor,
                    restrict
                );
            } else {
                mod.AddUIText(
                    __cUniqueName,
                    __asModVector(params.position),
                    __asModVector(params.size),
                    params.anchor,
                    params.parent,
                    params.visible,
                    params.padding,
                    __asModVector(params.bgColor),
                    params.bgAlpha,
                    params.bgFill,
                    __asModMessage(params.textLabel),
                    params.textSize,
                    __asModVector(params.textColor),
                    params.textAlpha,
                    params.textAnchor
                );
            }
            return __setNameAndGetWidget(__cUniqueName, params);
        }

        function __fillInDefaultImageArgs(params: any) {
            if (!params.hasOwnProperty('imageType')) params.imageType = mod.UIImageType.None;
            if (!params.hasOwnProperty('imageColor')) params.imageColor = mod.CreateVector(1, 1, 1);
            if (!params.hasOwnProperty('imageAlpha')) params.imageAlpha = 1;
        }

        function __addUIImage(params: any) {
            __fillInDefaultArgs(params);
            __fillInDefaultImageArgs(params);
            let restrict = params.teamId ?? params.playerId;
            if (restrict) {
                mod.AddUIImage(
                    __cUniqueName,
                    __asModVector(params.position),
                    __asModVector(params.size),
                    params.anchor,
                    params.parent,
                    params.visible,
                    params.padding,
                    __asModVector(params.bgColor),
                    params.bgAlpha,
                    params.bgFill,
                    params.imageType,
                    __asModVector(params.imageColor),
                    params.imageAlpha,
                    restrict
                );
            } else {
                mod.AddUIImage(
                    __cUniqueName,
                    __asModVector(params.position),
                    __asModVector(params.size),
                    params.anchor,
                    params.parent,
                    params.visible,
                    params.padding,
                    __asModVector(params.bgColor),
                    params.bgAlpha,
                    params.bgFill,
                    params.imageType,
                    __asModVector(params.imageColor),
                    params.imageAlpha
                );
            }
            return __setNameAndGetWidget(__cUniqueName, params);
        }

        function __fillInDefaultButtonArgs(params: any) {
            if (!params.hasOwnProperty('buttonEnabled')) params.buttonEnabled = true;
            if (!params.hasOwnProperty('buttonColorBase')) params.buttonColorBase = mod.CreateVector(0.7, 0.7, 0.7);
            if (!params.hasOwnProperty('buttonAlphaBase')) params.buttonAlphaBase = 1;
            if (!params.hasOwnProperty('buttonColorDisabled')) params.buttonColorDisabled = mod.CreateVector(0.2, 0.2, 0.2);
            if (!params.hasOwnProperty('buttonAlphaDisabled')) params.buttonAlphaDisabled = 0.5;
            if (!params.hasOwnProperty('buttonColorPressed')) params.buttonColorPressed = mod.CreateVector(0.25, 0.25, 0.25);
            if (!params.hasOwnProperty('buttonAlphaPressed')) params.buttonAlphaPressed = 1;
            if (!params.hasOwnProperty('buttonColorHover')) params.buttonColorHover = mod.CreateVector(1, 1, 1);
            if (!params.hasOwnProperty('buttonAlphaHover')) params.buttonAlphaHover = 1;
            if (!params.hasOwnProperty('buttonColorFocused')) params.buttonColorFocused = mod.CreateVector(1, 1, 1);
            if (!params.hasOwnProperty('buttonAlphaFocused')) params.buttonAlphaFocused = 1;
        }

        function __addUIButton(params: any) {
            __fillInDefaultArgs(params);
            __fillInDefaultButtonArgs(params);
            let restrict = params.teamId ?? params.playerId;
            if (restrict) {
                mod.AddUIButton(
                    __cUniqueName,
                    __asModVector(params.position),
                    __asModVector(params.size),
                    params.anchor,
                    params.parent,
                    params.visible,
                    params.padding,
                    __asModVector(params.bgColor),
                    params.bgAlpha,
                    params.bgFill,
                    params.buttonEnabled,
                    __asModVector(params.buttonColorBase),
                    params.buttonAlphaBase,
                    __asModVector(params.buttonColorDisabled),
                    params.buttonAlphaDisabled,
                    __asModVector(params.buttonColorPressed),
                    params.buttonAlphaPressed,
                    __asModVector(params.buttonColorHover),
                    params.buttonAlphaHover,
                    __asModVector(params.buttonColorFocused),
                    params.buttonAlphaFocused,
                    restrict
                );
            } else {
                mod.AddUIButton(
                    __cUniqueName,
                    __asModVector(params.position),
                    __asModVector(params.size),
                    params.anchor,
                    params.parent,
                    params.visible,
                    params.padding,
                    __asModVector(params.bgColor),
                    params.bgAlpha,
                    params.bgFill,
                    params.buttonEnabled,
                    __asModVector(params.buttonColorBase),
                    params.buttonAlphaBase,
                    __asModVector(params.buttonColorDisabled),
                    params.buttonAlphaDisabled,
                    __asModVector(params.buttonColorPressed),
                    params.buttonAlphaPressed,
                    __asModVector(params.buttonColorHover),
                    params.buttonAlphaHover,
                    __asModVector(params.buttonColorFocused),
                    params.buttonAlphaFocused
                );
            }
            return __setNameAndGetWidget(__cUniqueName, params);
        }

        function __addUIWidget(params: any) {
            if (params == null) return undefined;
            if (params.type == 'Container') return __addUIContainer(params);
            else if (params.type == 'Text') return __addUIText(params);
            else if (params.type == 'Image') return __addUIImage(params);
            else if (params.type == 'Button') return __addUIButton(params);
            return undefined;
        }

        export function ParseUI(...params: any[]) {
            let widget: mod.UIWidget | undefined;
            for (let a = 0; a < params.length; a++) {
                widget = __addUIWidget(params[a]);
            }
            return widget;
        }
    }
    //#endregion

    //#region Vector
    export class Vector {
        private _native: mod.Vector;

        constructor(x: number, y: number, z: number) {
            this._native = mod.CreateVector(x, y, z);
        }

        public static fromNative(native: mod.Vector): Vector {
            const vec = new Vector(0, 0, 0);
            vec._native = native;
            return vec;
        }

        public get native(): mod.Vector {
            return this._native;
        }

        public get x(): number { return mod.XComponentOf(this._native); }
        public get y(): number { return mod.YComponentOf(this._native); }
        public get z(): number { return mod.ZComponentOf(this._native); }

        public set x(value: number) { this._native = mod.CreateVector(value, this.y, this.z); }
        public set y(value: number) { this._native = mod.CreateVector(this.x, value, this.z); }
        public set z(value: number) { this._native = mod.CreateVector(this.x, this.y, value); }

        // Static properties
        public static get Zero(): Vector { return new Vector(0, 0, 0); }
        public static get One(): Vector { return new Vector(1, 1, 1); }
        public static get Up(): Vector { return new Vector(0, 1, 0); }
        public static get Down(): Vector { return new Vector(0, -1, 0); }
        public static get Forward(): Vector { return new Vector(0, 0, 1); }
        public static get Back(): Vector { return new Vector(0, 0, -1); }
        public static get Left(): Vector { return new Vector(-1, 0, 0); }
        public static get Right(): Vector { return new Vector(1, 0, 0); }

        // Methods
        public add(other: Vector): Vector {
            return Vector.fromNative(mod.Add(this._native, other.native));
        }

        public subtract(other: Vector): Vector {
            return Vector.fromNative(mod.Subtract(this._native, other.native));
        }

        public multiply(scalar: number): Vector {
            return Vector.fromNative(mod.Multiply(this._native, scalar));
        }

        public divide(scalar: number): Vector {
            return Vector.fromNative(mod.Divide(this._native, scalar));
        }

        public dotProduct(other: Vector): number {
            return mod.DotProduct(this._native, other.native);
        }

        public crossProduct(other: Vector): Vector {
            return Vector.fromNative(mod.CrossProduct(this._native, other.native));
        }

        public distanceTo(other: Vector): number {
            return mod.DistanceBetween(this._native, other.native);
        }

        public get magnitude(): number {
            return Math.sqrt(mod.DotProduct(this._native, this._native));
        }

        public normalize(): Vector {
            return Vector.fromNative(mod.Normalize(this._native));
        }

        public toString(): string {
            return `Vector(${this.x}, ${this.y}, ${this.z})`;
        }
    }
    //#endregion

    //#region Spawners
    export class Spawner extends GameObject {
        protected declare _native: mod.Spawner;

        private constructor(native: mod.Spawner) {
            super(native);
        }

        public static create(position: Vector, rotation: Vector = Vector.Zero, scale: Vector = Vector.One): Spawner | null {
            return GameObject.createObject<Spawner>(mod.RuntimeSpawn_Common.AI_Spawner, position, rotation, scale);
        }

        public static fromNative(native: mod.Spawner): Spawner {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as Spawner;
            }
            return new Spawner(native);
        }

        public get native(): mod.Spawner {
            return this._native;
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
        public onSpawned = new Event<(player: AIPlayer) => Promise<void>>();
    }

    export class VehicleSpawner extends GameObject {
        protected declare _native: mod.VehicleSpawner;

        private constructor(native: mod.VehicleSpawner) {
            super(native);
        }

        public static create(position: Vector, rotation: Vector = Vector.Zero, scale: Vector = Vector.One): VehicleSpawner | null {
            return GameObject.createObject<VehicleSpawner>(mod.RuntimeSpawn_Common.VehicleSpawner, position, rotation, scale);
        }

        public static fromNative(native: mod.VehicleSpawner): VehicleSpawner {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as VehicleSpawner;
            }
            return new VehicleSpawner(native);
        }

        public get native(): mod.VehicleSpawner {
            return this._native;
        }

        public forceSpawn(): void {
            mod.ForceVehicleSpawnerSpawn(this._native);
        }

        public set autoSpawn(enabled: boolean) {
            mod.SetVehicleSpawnerAutoSpawn(this._native, enabled);
        }

        public set respawnTime(time: number) {
            mod.SetVehicleSpawnerRespawnTime(this._native, time);
        }

        public set vehicleType(vehicle: mod.VehicleList) {
            mod.SetVehicleSpawnerVehicleType(this._native, vehicle);
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
    }

    export class EmplacementSpawner extends GameObject {
        protected declare _native: mod.EmplacementSpawner;

        private constructor(native: mod.EmplacementSpawner) {
            super(native);
        }

        public static fromNative(native: mod.EmplacementSpawner): EmplacementSpawner {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as EmplacementSpawner;
            }
            return new EmplacementSpawner(native);
        }

        public get native(): mod.EmplacementSpawner {
            return this._native;
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
    }

    export class LootSpawner extends GameObject {
        protected declare _native: mod.LootSpawner;

        private constructor(native: mod.LootSpawner) {
            super(native);
        }

        public static create(position: Vector, rotation: Vector = Vector.Zero, scale: Vector = Vector.One): LootSpawner | null {
            return GameObject.createObject<LootSpawner>(mod.RuntimeSpawn_Common.LootSpawner, position, rotation, scale);
        }

        public static fromNative(native: mod.LootSpawner): LootSpawner {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as LootSpawner;
            }
            return new LootSpawner(native);
        }

        public get native(): mod.LootSpawner {
            return this._native;
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
    }

    export class SpawnPoint extends GameObject {
        protected declare _native: mod.SpawnPoint;

        private constructor(native: mod.SpawnPoint) {
            super(native);
        }

        public static create(position: Vector, rotation: Vector = Vector.Zero, scale: Vector = Vector.One): SpawnPoint | null {
            return GameObject.createObject<SpawnPoint>(mod.RuntimeSpawn_Common.PlayerSpawner, position, rotation, scale);
        }

        public static fromNative(native: mod.SpawnPoint): SpawnPoint {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as SpawnPoint;
            }
            return new SpawnPoint(native);
        }

        public get native(): mod.SpawnPoint {
            return this._native;
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
    }
    //#endregion

    //#region Interactions
    export class AreaTrigger extends GameObject {
        protected declare _native: mod.AreaTrigger;

        private constructor(native: mod.AreaTrigger) {
            super(native);
        }

        public static create(position: Vector, rotation: Vector = Vector.Zero, scale: Vector = Vector.One): AreaTrigger | null {
            return GameObject.createObject<AreaTrigger>(mod.RuntimeSpawn_Common.AreaTrigger, position, rotation, scale);
        }

        public static fromNative(native: mod.AreaTrigger): AreaTrigger {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as AreaTrigger;
            }
            return new AreaTrigger(native);
        }

        public get native(): mod.AreaTrigger {
            return this._native;
        }

        public static getById(id: number): AreaTrigger | null {
            const native = mod.GetAreaTrigger(id);
            if (native) {
                return AreaTrigger.fromNative(native);
            }
            if (GameObject.hasInstance(id)) {
                GameObject.removeInstance(id);
            }
            return null;
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
        public onPlayerEnter = new Event<(player: Player) => Promise<void>>();
        public onPlayerExit = new Event<(player: Player) => Promise<void>>();
    }

    export class InteractPoint extends GameObject {
        protected declare _native: mod.InteractPoint;

        private constructor(native: mod.InteractPoint) {
            super(native);
        }

        public static create(position: Vector, rotation: Vector = Vector.Zero, scale: Vector = Vector.One): InteractPoint | null {
            return GameObject.createObject<InteractPoint>(mod.RuntimeSpawn_Common.InteractPoint, position, rotation, scale);
        }

        public static fromNative(native: mod.InteractPoint): InteractPoint {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as InteractPoint;
            }
            return new InteractPoint(native);
        }

        public get native(): mod.InteractPoint {
            return this._native;
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
        public onPlayerInteract = new Event<(player: Player) => Promise<void>>();
    }
    //#endregion

    //#region Spatial
    export class SpatialObject extends GameObject {
        protected declare _native: mod.SpatialObject;

        private constructor(native: mod.SpatialObject) {
            super(native);
        }

        public static fromNative(native: mod.SpatialObject): SpatialObject {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as SpatialObject;
            }
            return new SpatialObject(native);
        }

        public get native(): mod.SpatialObject {
            return this._native;
        }
    }
    //#endregion

    //#region Team & Squad
    export class Team extends GameObject {
        protected declare _native: mod.Team;

        private constructor(native: mod.Team) {
            super(native);
        }

        public static fromNative(native: mod.Team): Team {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as Team;
            }
            return new Team(native);
        }

        public get native(): mod.Team {
            return this._native;
        }

        public get players(): Player[] {
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            const players: Player[] = [];
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (mod.GetTeam(player) === this.native) {
                    players.push(Player.fromNative(player));
                }
            }
            return players;
        }

        public setGameScore(score: number): void {
            Scoreboard.setGameScore(this, score);
        }

        public isFaction(faction: mod.Factions): boolean {
            return mod.IsFaction(this._native, faction);
        }

        public getSquad(id: number): Squad | null {
            const squad = mod.GetSquad(this.id, id);
            return Squad.fromNative(squad);
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
        public onPlayerSwitchIn = new Event<(player: Player) => Promise<void>>();
    }

    export class Squad {
        protected _native: mod.Squad;
        protected static squadInstanceMap = new Map<number, Squad>();

        private constructor(native: mod.Squad) {
            this._native = native;
        }

        public static fromNative(native: mod.Squad): Squad {
            // The API does not provide a direct way to get a unique ID for a squad as it isn't part of mod.Object type.
            // We'll use the object ID of the first player in the squad as a proxy for the squad's identity.
            // This is a workaround and might not be perfectly stable if squad compositions change rapidly.
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            let representativeId = -1;

            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (mod.GetSquad(player) === native) {
                    representativeId = mod.GetObjId(player);
                    break;
                }
            }

            if (representativeId !== -1 && Squad.squadInstanceMap.has(representativeId)) {
                return Squad.squadInstanceMap.get(representativeId)!;
            }

            const newSquad = new Squad(native);
            if (representativeId !== -1) {
                Squad.squadInstanceMap.set(representativeId, newSquad);
            }
            return newSquad;
        }

        public get native(): mod.Squad {
            return this._native;
        }

        /*
        public get id(): number {
            return mod.GetObjId(this._native);
        }
        */

        public get team(): Team | null {
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (mod.GetSquad(player) === this.native) {
                    return Team.fromNative(mod.GetTeam(player));
                }
            }
            return null;
        }

        public get players(): Player[] {
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            const players: Player[] = [];
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (mod.GetSquad(player) === this.native) {
                    players.push(Player.fromNative(player));
                }
            }
            return players;
        }
    }
    //#endregion

    //#region AI
    /**
     * Defines a set of optional attributes for an AI personality.
     */
    export interface AIOptions {
        health?: number;
        speedMultiplier?: number;
        stance?: mod.Stance;
        moveSpeed?: mod.MoveSpeed;
        soldierClass?: mod.SoldierClass;
        name?: string;
        behaviorTickInterval?: number;
    }

    /**
     * Defines the behavior contract for an AI, with methods for lifecycle events.
     */
    export interface AIBehavior {
        onSpawn(player: AIPlayer): void;
        onDamaged(player: AIPlayer, damager: Player, damage: number, weapon: mod.WeaponUnlock): void;
        onDeath(player: AIPlayer, killer: Player, deathType: mod.DeathType, weapon: mod.WeaponUnlock): void;
        onGoing?(player: AIPlayer): void;
    }

    /**
     * Represents an AI's blueprint, combining a behavior with specific options.
     */
    export class AIPersonality {
        constructor(public behavior: AIBehavior, public options: AIOptions = {}) { }
    }

    /**
     * Manages the lifecycle and behavior assignment for AI players.
     */
    export abstract class AIManager {
        private static pendingPersonalities = new Map<number, AIPersonality>(); // spawnerId -> personality
        private static activeAIs = new Map<number, AIPlayer>(); // aiPlayerId -> AIPlayer

        /**
         * Spawns an AI with a specific personality from a given spawner.
         * @param personality The personality defining the AI's behavior and attributes.
         * @param spawner The spawner to use for creating the AI.
         * @param team The team to assign the AI to.
         */
        public static spawn(personality: AIPersonality, spawner: Spawner, team?: Team): void {
            const spawnerId = spawner.id;
            // Store the personality, so we can retrieve it when the OnSpawnerSpawned event fires.
            this.pendingPersonalities.set(spawnerId, personality);

            AISpawner.spawnAIFromSpawner(spawner, personality.options.soldierClass, personality.options.name, team);
        }

        /**
         * Called by the OnSpawnerSpawned event handler to assign a personality to a newly spawned AI.
         * @internal
         */
        public static _assignPersonality(player: AIPlayer, spawner: Spawner): void {
            const spawnerId = spawner.id;
            const personality = this.pendingPersonalities.get(spawnerId);

            if (personality) {
                player.personality = personality;
                this.activeAIs.set(player.id, player);

                // Apply options from the personality
                if (personality.options.health) {
                    player.maxHealth = personality.options.health;
                    mod.Heal(player.native, personality.options.health); // Heal to full health on spawn
                }
                if (personality.options.speedMultiplier) {
                    mod.SetPlayerMovementSpeedMultiplier(player.native, personality.options.speedMultiplier);
                }
                if (personality.options.stance) {
                    player.setStance(personality.options.stance);
                }
                if (personality.options.moveSpeed) {
                    player.setMoveSpeed(personality.options.moveSpeed);
                }

                // Trigger the behavior's spawn logic
                personality.behavior.onSpawn(player);

                // Start the onGoing loop if it exists
                if (personality.behavior.onGoing) {
                    this.startOnGoingLoop(player, personality);
                }

                // Clean up the pending personality for this spawner to avoid re-assigning it
                this.pendingPersonalities.delete(spawnerId);
            }
        }

        private static async startOnGoingLoop(player: AIPlayer, personality: AIPersonality) {
            const tickInterval = personality.options.behaviorTickInterval ?? 1.0;
            while (mod.IsPlayerValid(player.native) && player.isAlive) {
                try {
                    personality.behavior.onGoing!(player);
                } catch (e) {
                    mod.SendErrorReport(mod.Message(`Error in AI onGoing behavior: ${e}`));
                }
                await mod.Wait(tickInterval);
            }
        }

        /**
         * Called by the OnPlayerDamaged event handler to delegate to the AI's behavior.
         * @internal
         */
        public static _handleDamage(victim: AIPlayer, damager: Player, damage: number, weapon: mod.WeaponUnlock): void {
            if (victim.personality) {
                victim.personality.behavior.onDamaged(victim, damager, damage, weapon);
            }
        }

        /**
         * Called by the OnPlayerDied event handler to delegate to the AI's behavior and clean up.
         * @internal
         */
        public static _handleDeath(victim: AIPlayer, killer: Player, deathType: mod.DeathType, weapon: mod.WeaponUnlock): void {
            if (this.activeAIs.has(victim.id)) {
                if (victim.personality) {
                    victim.personality.behavior.onDeath(victim, killer, deathType, weapon);
                }
                this.activeAIs.delete(victim.id);
            }
        }
    }
    //#endregion

    //#region Scoreboard
    export interface ScoreboardColumn {
        name: string | mod.Message;
        width: number;
    }

    export interface ScoreboardConfig {
        type: mod.ScoreboardType;
        header?: string | mod.Message | { team1: string | mod.Message; team2: string | mod.Message };
        columns: ScoreboardColumn[];
        sorting?: {
            columnIndex: number;
            reverse: boolean;
        };
    }

    export abstract class Scoreboard {
        public static create(config: ScoreboardConfig): void {
            mod.SetScoreboardType(config.type);

            if (config.header) {
                this.setHeader(config.header);
            }

            if (config.columns) {
                this.setColumns(config.columns);
            }

            if (config.sorting) {
                mod.SetScoreboardSorting(config.sorting.columnIndex, config.sorting.reverse);
            }
        }

        public static setHeader(header: string | mod.Message | { team1: string | mod.Message; team2: string | mod.Message }): void {
            if (typeof header === 'object' && 'team1' in header) {
                const team1Msg = typeof header.team1 === 'string' ? mod.Message(header.team1) : header.team1;
                const team2Msg = typeof header.team2 === 'string' ? mod.Message(header.team2) : header.team2;
                mod.SetScoreboardHeader(team1Msg, team2Msg);
            } else {
                const headerMsg = typeof header === 'string' ? mod.Message(header as string) : header as mod.Message;
                mod.SetScoreboardHeader(headerMsg);
            }
        }

        public static setColumns(columns: ScoreboardColumn[]): void {
            const names = columns.map(c => typeof c.name === 'string' ? mod.Message(c.name) : c.name);
            const widths = columns.map(c => c.width);

            switch (columns.length) {
                case 1:
                    mod.SetScoreboardColumnNames(names[0]);
                    mod.SetScoreboardColumnWidths(widths[0]);
                    break;
                case 2:
                    mod.SetScoreboardColumnNames(names[0], names[1]);
                    mod.SetScoreboardColumnWidths(widths[0], widths[1]);
                    break;
                case 3:
                    mod.SetScoreboardColumnNames(names[0], names[1], names[2]);
                    mod.SetScoreboardColumnWidths(widths[0], widths[1], widths[2]);
                    break;
                case 4:
                    mod.SetScoreboardColumnNames(names[0], names[1], names[2], names[3]);
                    mod.SetScoreboardColumnWidths(widths[0], widths[1], widths[2], widths[3]);
                    break;
                case 5:
                    mod.SetScoreboardColumnNames(names[0], names[1], names[2], names[3], names[4]);
                    mod.SetScoreboardColumnWidths(widths[0], widths[1], widths[2], widths[3], widths[4]);
                    break;
                default:
                    // It's good practice to handle cases where the array size is out of bounds.
                    mod.SendErrorReport(mod.Message(`Scoreboard: Invalid number of columns. Expected 1-5, got ${columns.length}.`));
                    break;
            }
        }

        public static setPlayerValues(player: Player, values: number[]): void {
            switch (values.length) {
                case 1:
                    mod.SetScoreboardPlayerValues(player.native, values[0]);
                    break;
                case 2:
                    mod.SetScoreboardPlayerValues(player.native, values[0], values[1]);
                    break;
                case 3:
                    mod.SetScoreboardPlayerValues(player.native, values[0], values[1], values[2]);
                    break;
                case 4:
                    mod.SetScoreboardPlayerValues(player.native, values[0], values[1], values[2], values[3]);
                    break;
                case 5:
                    mod.SetScoreboardPlayerValues(player.native, values[0], values[1], values[2], values[3], values[4]);
                    break;
            }
        }

        public static setGameScore(target: Player | Team, score: number): void {
            if (target instanceof Player) {
                mod.SetGameModeScore(target.native, score);
            } else {
                mod.SetGameModeScore(target.native, score);
            }
        }

        public static setTargetScore(score: number): void {
            mod.SetGameModeTargetScore(score);
        }
    }
    //#endregion

    //region World Icons
    export class WorldIcon extends GameObject {
        protected declare _native: mod.WorldIcon;

        private constructor(native: mod.WorldIcon) {
            super(native);
        }

        public static create(position: Vector, rotation: Vector = Vector.Zero, scale: Vector = Vector.One): WorldIcon | null {
            return GameObject.createObject<WorldIcon>(mod.RuntimeSpawn_Common.WorldIcon, position, rotation, scale);
        }

        public static fromNative(native: mod.WorldIcon): WorldIcon {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as WorldIcon;
            }
            return new WorldIcon(native);
        }

        public get native(): mod.WorldIcon {
            return this._native;
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
    }
    //#endregion

    //#region VFX & SFX
    export class VFX extends GameObject {
        protected declare _native: mod.VFX;

        protected constructor(native: mod.VFX) {
            super(native);
        }

        public static fromNative(native: mod.VFX): VFX {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as VFX;
            }
            return new VFX(native);
        }

        public get native(): mod.VFX {
            return this._native;
        }

        public static getById(id: number): VFX | null {
            const native = mod.GetVFX(id);
            if (native) {
                return VFX.fromNative(native);
            }
            if (GameObject.hasInstance(id)) {
                GameObject.removeInstance(id);
            }
            return null;
        }

        public set enabled(value: boolean) {
            mod.EnableVFX(this.native, value);
        }

        public set color(color: Vector) {
            mod.SetVFXColor(this.native, color.native);
        }

        public set speed(speed: number) {
            mod.SetVFXSpeed(this.native, speed);
        }

        public set scale(scale: number) {
            mod.SetVFXScale(this.native, scale);
        }
    }

    export class SFX extends GameObject {
        protected declare _native: mod.SFX;

        protected constructor(native: mod.SFX) {
            super(native);
        }

        public static fromNative(native: mod.SFX): SFX {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as SFX;
            }
            return new SFX(native);
        }

        public get native(): mod.SFX {
            return this._native;
        }

        /**
         * Plays the sound associated with this SFX object.
         * @param amplitude The volume of the sound.
         * @param location The position to play the sound at. Defaults to the object's position.
         * @param attenuationRange The range at which the sound attenuates.
         * @param restrictTo An optional player, squad, or team to restrict the sound to.
         */
        public play(amplitude: number = 1.0, location?: Vector, attenuationRange: number = 100, restrictTo?: Player | Squad | Team): void {
            const pos = location ?? this.position;
            if (restrictTo) {
                mod.PlaySound(this.native, amplitude, pos.native, attenuationRange, restrictTo.native as any);
            } else {
                mod.PlaySound(this.native, amplitude, pos.native, attenuationRange);
            }
        }

        /**
         * Stops the sound associated with this SFX object.
         * @param restrictTo An optional player, squad, or team to stop the sound for.
         */
        public stop(restrictTo?: Player | Squad | Team): void {
            if (restrictTo) {
                mod.StopSound(this.native, restrictTo.native as any);
            } else {
                mod.StopSound(this.native);
            }
        }
    }
    //#endregion

    //#region WaypointPath
    export class WaypointPath extends GameObject {
        protected declare _native: mod.WaypointPath;

        private constructor(native: mod.WaypointPath) {
            super(native);
        }

        public static create(position: Vector, rotation: Vector = Vector.Zero, scale: Vector = Vector.One): WaypointPath | null {
            return GameObject.createObject<WaypointPath>(mod.RuntimeSpawn_Common.AI_WaypointPath, position, rotation, scale);
        }

        public static fromNative(native: mod.WaypointPath): WaypointPath {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as WaypointPath;
            }
            return new WaypointPath(native);
        }

        public get native(): mod.WaypointPath {
            return this._native;
        }

        public static getById(id: number): WaypointPath | null {
            const native = mod.GetWaypointPath(id);
            if (native) {
                return WaypointPath.fromNative(native);
            }
            if (GameObject.hasInstance(id)) {
                GameObject.removeInstance(id);
            }
            return null;
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
    }
    //#endregion

    //#region Royale
    export class RingOfFire extends GameObject {
        protected declare _native: mod.RingOfFire;

        private constructor(native: mod.RingOfFire) {
            super(native);
        }

        public static create(position: Vector, rotation: Vector = Vector.Zero, scale: Vector = Vector.One): RingOfFire | null {
            return GameObject.createObject<RingOfFire>(mod.RuntimeSpawn_Common.RingOfFire, position, rotation, scale);
        }

        public static fromNative(native: mod.RingOfFire): RingOfFire {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as RingOfFire;
            }
            return new RingOfFire(native);
        }

        public get native(): mod.RingOfFire {
            return this._native;
        }

        public static getById(id: number): RingOfFire | null {
            const native = mod.GetRingOfFire(id);
            if (native) {
                return RingOfFire.fromNative(native);
            }
            if (GameObject.hasInstance(id)) {
                GameObject.removeInstance(id);
            }
            return null;
        }

        // Events
        public onGoing = new Event<() => Promise<void>>();
        public onZoneSizeChanged = new Event<(eventNumber: number) => Promise<void>>();
    }
    //#endregion

    //#region Effects
    export class ScreenEffect extends GameObject {
        protected declare _native: mod.ScreenEffect;

        private constructor(native: mod.ScreenEffect) {
            super(native);
        }

        public static fromNative(native: mod.ScreenEffect): ScreenEffect {
            const id = mod.GetObjId(native);
            if (GameObject.hasInstance(id)) {
                return GameObject.getInstance(id) as ScreenEffect;
            }
            return new ScreenEffect(native);
        }

        public get native(): mod.ScreenEffect {
            return this._native;
        }
    }
    //#endregion

    //#region AISpawner
    export abstract class AISpawner {
        public static setUnspawnOnDead(spawner: Spawner, enable: boolean): void {
            mod.AISetUnspawnOnDead(spawner.native, enable);
        }

        public static setUnspawnDelay(spawner: Spawner, delay: number): void {
            mod.SetUnspawnDelayInSeconds(spawner.native, delay);
        }

        public static spawnAIFromSpawner(spawner: Spawner, soldierClass?: mod.SoldierClass, name?: string, team?: Team): void {
            if (soldierClass && name && team) {
                mod.SpawnAIFromAISpawner(spawner.native, soldierClass, mod.Message(name), team.native);
            } else if (soldierClass && team) {
                mod.SpawnAIFromAISpawner(spawner.native, soldierClass, team.native);
            } else if (soldierClass && name) {
                mod.SpawnAIFromAISpawner(spawner.native, soldierClass, mod.Message(name));
            } else if (name && team) {
                mod.SpawnAIFromAISpawner(spawner.native, mod.Message(name), team.native);
            } else if (soldierClass) {
                mod.SpawnAIFromAISpawner(spawner.native, soldierClass);
            } else if (name) {
                mod.SpawnAIFromAISpawner(spawner.native, mod.Message(name));
            } else if (team) {
                mod.SpawnAIFromAISpawner(spawner.native, team.native);
            } else {
                mod.SpawnAIFromAISpawner(spawner.native);
            }
        }

        public static unspawnAllAIsFromSpawner(spawner: Spawner): void {
            mod.UnspawnAllAIsFromAISpawner(spawner.native);
        }
    }
    //#endregion
}

//#region Event Handlers

export function OngoingGlobal() {

}

export function OngoingAreaTrigger(eventAreaTrigger: mod.AreaTrigger) {
    const area = Portal.AreaTrigger.fromNative(eventAreaTrigger);
    area.onGoing.dispatch();
}

export function OngoingCapturePoint(eventCapturePoint: mod.CapturePoint) {
    const cp = Portal.CapturePoint.fromNative(eventCapturePoint);
    cp.onGoing.dispatch();
}

export function OngoingEmplacementSpawner(eventEmplacementSpawner: mod.EmplacementSpawner) {
    const spawner = Portal.EmplacementSpawner.fromNative(eventEmplacementSpawner);
    spawner.onGoing.dispatch();
}

export function OngoingHQ(eventHQ: mod.HQ) {
    const hq = Portal.HQ.fromNative(eventHQ);
    hq.onGoing.dispatch();
}

export function OngoingInteractPoint(eventInteractPoint: mod.InteractPoint) {
    const interactPoint = Portal.InteractPoint.fromNative(eventInteractPoint);
    interactPoint.onGoing.dispatch();
}

export function OngoingLootSpawner(eventLootSpawner: mod.LootSpawner) {
    const lootSpawner = Portal.LootSpawner.fromNative(eventLootSpawner);
    lootSpawner.onGoing.dispatch();
}

export function OngoingMCOM(eventMCOM: mod.MCOM) {
    const mcom = Portal.MCOM.fromNative(eventMCOM);
    mcom.onGoing.dispatch();
}

export function OngoingPlayer(eventPlayer: mod.Player) {
    const player = Portal.Player.fromNative(eventPlayer);
    player.onGoing.dispatch();
}

export function OngoingRingOfFire(eventRingOfFire: mod.RingOfFire) {
    const ringOfFire = Portal.RingOfFire.fromNative(eventRingOfFire);
    ringOfFire.onGoing.dispatch();
}

export function OngoingSector(eventSector: mod.Sector) {
    const sector = Portal.Sector.fromNative(eventSector);
    sector.onGoing.dispatch();
}

export function OngoingSpawner(eventSpawner: mod.Spawner) {
    const spawner = Portal.Spawner.fromNative(eventSpawner);
    spawner.onGoing.dispatch();
}

export function OngoingSpawnPoint(eventSpawnPoint: mod.SpawnPoint) {
    const spawnPoint = Portal.SpawnPoint.fromNative(eventSpawnPoint);
    spawnPoint.onGoing.dispatch();
}

export function OngoingTeam(eventTeam: mod.Team) {
    const team = Portal.Team.fromNative(eventTeam);
    team.onGoing.dispatch();
}

export function OngoingVehicle(eventVehicle: mod.Vehicle) {
    const vehicle = Portal.Vehicle.fromNative(eventVehicle);
    vehicle.onGoing.dispatch();
}

export function OngoingVehicleSpawner(eventVehicleSpawner: mod.VehicleSpawner) {
    const vehicleSpawner = Portal.VehicleSpawner.fromNative(eventVehicleSpawner);
    vehicleSpawner.onGoing.dispatch();
}

export function OngoingWaypointPath(eventWaypointPath: mod.WaypointPath) {
    const waypointPath = Portal.WaypointPath.fromNative(eventWaypointPath);
    waypointPath.onGoing.dispatch();
}

export function OngoingWorldIcon(eventWorldIcon: mod.WorldIcon) {
    const worldIcon = Portal.WorldIcon.fromNative(eventWorldIcon);
    worldIcon.onGoing.dispatch();
}

export function Ongoing() {
    Portal.Game.onGoing.dispatch();
}

export function OnPlayerDied(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, eventDeathType: mod.DeathType, eventWeaponUnlock: mod.WeaponUnlock) {
    const victim = Portal.Player.fromNative(eventPlayer);
    const killer = Portal.Player.fromNative(eventOtherPlayer);
    victim.onPlayerDied.dispatch(killer, eventDeathType, eventWeaponUnlock);

    const aiVictim = victim.asAI();
    if (aiVictim) {
        Portal.AIManager._handleDeath(aiVictim, killer, eventDeathType, eventWeaponUnlock);
    }
}

export function OnPlayerDamaged(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, eventDamageType: mod.DamageType, eventWeaponUnlock: mod.WeaponUnlock) {
    const victim = Portal.Player.fromNative(eventPlayer);
    const damager = Portal.Player.fromNative(eventOtherPlayer);
    const damage = mod.GetSoldierState(victim.native, mod.SoldierStateNumber.CurrentHealth) - victim.currentHealth; // This is a workaround
    victim.onPlayerDamaged.dispatch(damager, eventDamageType, eventWeaponUnlock);

    const aiVictim = victim.asAI();
    if (aiVictim) {
        // The API does not provide the damage amount directly in this event.
        // A possible workaround is to get health before and after, but that's not reliable.
        // For now, we'll pass 0 and the behavior can calculate it if needed.
        Portal.AIManager._handleDamage(aiVictim, damager, 0, eventWeaponUnlock);
    }
}

export function OnPlayerEnterVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle) {
    const player = Portal.Player.fromNative(eventPlayer);
    const vehicle = Portal.Vehicle.fromNative(eventVehicle);
    player.onPlayerEnterVehicle.dispatch(vehicle);
    vehicle.onPlayerEnterVehicle.dispatch(player);
}

export function OnPlayerExitVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle) {
    const player = Portal.Player.fromNative(eventPlayer);
    const vehicle = Portal.Vehicle.fromNative(eventVehicle);
    player.onPlayerExitVehicle.dispatch(vehicle);
    vehicle.onPlayerExitVehicle.dispatch(player);
}

export function OnVehicleDestroyed(eventVehicle: mod.Vehicle) {
    const vehicle = Portal.Vehicle.fromNative(eventVehicle);
    vehicle.onVehicleDestroyed.dispatch();
}

export function OnAIMoveToFailed(eventPlayer: mod.Player) {
    const player = Portal.Player.fromNative(eventPlayer).asAI();
    if (player) {
        player.onAIMoveToFailed.dispatch();
    }
}

export function OnAIMoveToRunning(eventPlayer: mod.Player) {
    const player = Portal.Player.fromNative(eventPlayer).asAI();
    if (player) {
        player.onAIMoveToRunning.dispatch();
    }
}

export function OnAIMoveToSucceeded(eventPlayer: mod.Player) {
    const player = Portal.Player.fromNative(eventPlayer).asAI();
    if (player) {
        player._onMoveToSucceeded(); // Internal logic for path following
        player.onAIMoveToSucceeded.dispatch();
    }
}

export function OnAIParachuteRunning(eventPlayer: mod.Player) {
    const player = Portal.Player.fromNative(eventPlayer).asAI();
    if (player) {
        player.onAIParachuteRunning.dispatch();
    }
}

export function OnPlayerUIButtonEvent(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent) {
    const player = Portal.Player.fromNative(eventPlayer);
    const widget = Portal.UI.UIWidget.fromNative(eventUIWidget);

    if (widget && widget instanceof Portal.UI.ButtonWidget) {
        switch (eventUIButtonEvent) {
            case mod.UIButtonEvent.ButtonDown:
                widget.onButtonDown.dispatch(player);
                break;
            case mod.UIButtonEvent.ButtonUp:
                widget.onButtonUp.dispatch(player);
                break;
            case mod.UIButtonEvent.FocusIn:
                widget.onFocusIn.dispatch(player);
                break;
            case mod.UIButtonEvent.FocusOut:
                widget.onFocusOut.dispatch(player);
                break;
            case mod.UIButtonEvent.HoverIn:
                widget.onHoverIn.dispatch(player);
                break;
            case mod.UIButtonEvent.HoverOut:
                widget.onHoverOut.dispatch(player);
                break;
        }
    }
}

export function OnAIWaypointIdleFailed(eventPlayer: mod.Player) {
    const player = Portal.Player.fromNative(eventPlayer).asAI();
    if (player) {
        player.onAIWaypointIdleFailed.dispatch();
    }
}

export function OnAIWaypointIdleRunning(eventPlayer: mod.Player) {
    const player = Portal.Player.fromNative(eventPlayer).asAI();
    if (player) {
        player.onAIWaypointIdleRunning.dispatch();
    }
}

export function OnAIWaypointIdleSucceeded(eventPlayer: mod.Player) {
    const player = Portal.Player.fromNative(eventPlayer).asAI();
    if (player) {
        player.onAIWaypointIdleSucceeded.dispatch();
    }
}

export function OnSpawnerSpawned(eventPlayer: mod.Player, eventSpawner: mod.Spawner) {
    const spawner = Portal.Spawner.fromNative(eventSpawner);
    const player = Portal.Player.fromNative(eventPlayer).asAI();
    if (player) {
        spawner.onSpawned.dispatch(player);
        Portal.AIManager._assignPersonality(player, spawner);
    }
}

export function OnVehicleSpawned(eventVehicle: mod.Vehicle) {
    const vehicle = Portal.Vehicle.fromNative(eventVehicle);
    Portal.Game.onVehicleSpawned.dispatch(vehicle);
}

export function OnMandown(player: mod.Player, killer: mod.Player) {
    const aPlayer = Portal.GameObject.fromNative(player) as Portal.Player;
    const aKiller = killer ? Portal.GameObject.fromNative(killer) as Portal.Player : null;
    aPlayer.onManDown.dispatch(aKiller);
}

export function OnRayCastHit(eventPlayer: mod.Player, eventPosition: mod.Vector, eventNormal: mod.Vector, eventHitPlayer: mod.Player, eventHitVehicle: mod.Vehicle) {
    Portal.Game._handleRaycastHit(eventPlayer, eventPosition, eventNormal, eventHitPlayer, eventHitVehicle);
}

export function OnRayCastMissed(eventPlayer: mod.Player) {
    Portal.Game._handleRaycastMiss(eventPlayer);
}

export function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint) {
    const capturePoint = Portal.CapturePoint.fromNative(eventCapturePoint);
    capturePoint.onCaptured.dispatch();
}
export function OnPlayerEarnedKillAssist(player: mod.Player, victim: mod.Player) {
    const aPlayer = Portal.GameObject.fromNative(player) as Portal.Player;
    const aVictim = Portal.GameObject.fromNative(victim) as Portal.Player;
    aPlayer.onEarnedKillAssist.dispatch(aVictim);
}

export function OnCapturePointCapturing(eventCapturePoint: mod.CapturePoint) {
    const capturePoint = Portal.CapturePoint.fromNative(eventCapturePoint);
    capturePoint.onCapturing.dispatch();
}

export function OnCapturePointLost(eventCapturePoint: mod.CapturePoint) {
    const capturePoint = Portal.CapturePoint.fromNative(eventCapturePoint);
    capturePoint.onLost.dispatch();
}

export function OnPlayerEnterCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint) {
    const player = Portal.Player.fromNative(eventPlayer);
    const capturePoint = Portal.CapturePoint.fromNative(eventCapturePoint);
    player.onEnterCapturePoint.dispatch(capturePoint);
    capturePoint.onPlayerEnter.dispatch(player);
}

export function OnPlayerExitCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint) {
    const player = Portal.Player.fromNative(eventPlayer);
    const capturePoint = Portal.CapturePoint.fromNative(eventCapturePoint);
    player.onExitCapturePoint.dispatch(capturePoint);
    capturePoint.onPlayerExit.dispatch(player);
}

export function OnPlayerExitVehicleSeat(player: mod.Player, vehicle: mod.Vehicle, seat: number) {
    const aPlayer = Portal.GameObject.fromNative(player) as Portal.Player;
    const aVehicle = Portal.GameObject.fromNative(vehicle) as Portal.Vehicle;
    aPlayer.onExitVehicleSeat.dispatch(aVehicle, seat);
    aVehicle.onExitVehicleSeat.dispatch(aPlayer, seat);
}

export function OnPlayerEnterVehicleSeat(player: mod.Player, vehicle: mod.Vehicle, seat: number) {
    const aPlayer = Portal.GameObject.fromNative(player) as Portal.Player;
    const aVehicle = Portal.GameObject.fromNative(vehicle) as Portal.Vehicle;
    aPlayer.onEnterVehicleSeat.dispatch(aVehicle, seat);
    aVehicle.onEnterVehicleSeat.dispatch(aPlayer, seat);
}
export function OnPlayerSwitchTeam(player: mod.Player, team: mod.Team) {
    const aPlayer = Portal.GameObject.fromNative(player) as Portal.Player;
    const aTeam = Portal.Team.fromNative(team);
    aPlayer.onSwitchTeam.dispatch(aTeam);
    aTeam.onPlayerSwitchIn.dispatch(aPlayer);
}

export function OnMCOMArmed(eventMCOM: mod.MCOM) {
    const mcom = Portal.MCOM.fromNative(eventMCOM);
    mcom.onArmed.dispatch();
}

export function OnMCOMDefused(eventMCOM: mod.MCOM) {
    const mcom = Portal.MCOM.fromNative(eventMCOM);
    mcom.onDefused.dispatch();
}

export function OnMCOMDestroyed(eventMCOM: mod.MCOM) {
    const mcom = Portal.MCOM.fromNative(eventMCOM);
    mcom.onDestroyed.dispatch();
}

export function OnPlayerUndeploy(player: mod.Player) {
    const aPlayer = Portal.GameObject.fromNative(player) as Portal.Player;
    aPlayer.onUndeploy.dispatch();
}

export function OnPlayerDeployed(eventPlayer: mod.Player) {
    const aPlayer = Portal.GameObject.fromNative(eventPlayer) as Portal.Player;
    aPlayer.onDeployed.dispatch();
}

export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    const player = Portal.Player.fromNative(eventPlayer);
    const areaTrigger = Portal.AreaTrigger.fromNative(eventAreaTrigger);
    player.onEnterAreaTrigger.dispatch(areaTrigger);
    areaTrigger.onPlayerEnter.dispatch(player);
}

export function OnRevived(player: mod.Player, reviver: mod.Player) {
    const aPlayer = Portal.GameObject.fromNative(player) as Portal.Player;
    const aReviver = Portal.GameObject.fromNative(reviver) as Portal.Player;
    aPlayer.onRevived.dispatch(aReviver);
}

export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    const player = Portal.Player.fromNative(eventPlayer);
    const areaTrigger = Portal.AreaTrigger.fromNative(eventAreaTrigger);
    player.onExitAreaTrigger.dispatch(areaTrigger);
    areaTrigger.onPlayerExit.dispatch(player);
}
export function OnRingOfFireZoneSizeChange(ringOfFire: mod.RingOfFire, eventNumber: number) {
    const aRingOfFire = Portal.GameObject.fromNative(ringOfFire) as Portal.RingOfFire;
    aRingOfFire.onZoneSizeChanged.dispatch(eventNumber);
}

export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    const player = Portal.Player.fromNative(eventPlayer);
    const interactPoint = Portal.InteractPoint.fromNative(eventInteractPoint);
    player.onInteract.dispatch(interactPoint);
    interactPoint.onPlayerInteract.dispatch(player);
}

export function OnGameModeStarted() {
    Portal.Game.onGameModeStarted.dispatch();
}

export function OnGameModeEnding() {
    Portal.Game.onGameModeEnding.dispatch();
}

export function OnTimeLimitReached() {
    Portal.Game.onTimeLimitReached.dispatch();
}

export function OnPlayerJoinGame(player: mod.Player) {
    const aPlayer = Portal.Player.fromNative(player);
    Portal.Game.onPlayerJoined.dispatch(aPlayer);
}

export function OnPlayerLeaveGame(playerId: number) {
    Portal.Game.onPlayerLeft.dispatch(playerId);
    Portal.GameObject.removeInstance(playerId);
}

export function OnPlayerEarnedKill(player: mod.Player, victim: mod.Player, deathType: mod.DeathType, weapon: mod.WeaponUnlock) {
    const aPlayer = Portal.GameObject.fromNative(player) as Portal.Player;
    const aVictim = Portal.GameObject.fromNative(victim) as Portal.Player;
    aPlayer.onEarnedKill.dispatch(aVictim, deathType, weapon);
}

export function OnAIParachuteSucceeded(player: mod.Player) {
    const aPlayer = Portal.Player.fromNative(player).asAI();
    if (aPlayer) {
        aPlayer.onAIParachuteSucceeded.dispatch();
    }
}
//#endregion
