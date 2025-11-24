# Battlefield Portal TypeScript OO Wrapper

This repository contains a comprehensive, object-oriented (OO) TypeScript wrapper for the Battlefield Portal API. It is designed to provide a more intuitive, powerful, and developer-friendly environment for creating custom game experiences in Battlefield Portal.

## The Motivation

The standard Battlefield Portal API is powerful but procedural. As game logic becomes more complex, managing state and orchestrating events can become challenging. This wrapper was created to:

-   **Simplify Development:** Abstract away verbose API calls into clean, readable methods on objects (e.g., `player.kill()` instead of `mod.Kill(playerObject)`).
-   **Improve State Management:** Work with `Player`, `Vehicle`, and `CapturePoint` objects that manage their own state and events.
-   **Enable Modern Programming:** Leverage the power of TypeScript's object-oriented features, including classes, inheritance, and type safety.
-   **Promote Code Reusability:** Create modular and reusable components, such as custom AI behaviors and player classes.

## Core Features

-   **Complete Type Safety:** Full TypeScript definitions for all major game entities.
-   **Object-Oriented Design:** Classes for `GameObject`, `Player`, `AIPlayer`, `Vehicle`, `CapturePoint`, `MCOM`, `UIWidget`, and more.
-   **Event-Driven Architecture:** Subscribe to events directly on game objects (e.g., `myPlayer.onPlayerDied.subscribe(...)`).
-   **Fluent UI Builder:** Programmatically construct complex user interfaces with a clear, chainable builder pattern.
-   **Powerful AI Management:**
    -   Define `AIPersonality` blueprints with unique behaviors (`onSpawn`, `onDeath`, `onGoing`) and attributes (health, speed, class).
    -   Use the `AIManager` to easily spawn and manage AI with specific personalities.
-   **Dynamic Inventory Control:** A robust `InventoryManager` allows you to add, remove, and modify weapons, attachments, and gadgets for any player at runtime.
-   **Music Controller:** A dedicated `Music` class to easily load, play, and stop music events, as well as control music parameters for specific players, squads, or teams.
-   **Vector Math Library:** A full `Vector` class with common mathematical operations.
-   **Full API Coverage:** Wraps all major functions and events from the `mod.d.ts` API definition.

## How to Use

The current Battlefield Portal toolset requires all script logic to be contained within a **single file**.

1.  **Copy the Code:** Copy the entire contents of `wrapper.ts` into your experience's main script file.
2.  **Start Building:** You can now use the `Portal` namespace to access all the wrapper's features.

### Example: Creating a Juggernaut

```typescript
// Your game logic file (with the wrapper code included)

// Modify their properties
myPlayer.maxHealth = 500;
myPlayer.movementSpeedMultiplier = 0.8;
myPlayer.heal(500); // Heal to full

// Set weapon
const lmg = new Portal.Weapon(mod.Weapons.LMG_M250);
lmg.addAttachment(mod.WeaponAttachments.Top_120_mW_Blue)
   .addAttachment(mod.WeaponAttachments.Right_Flashlight)
   .addAttachment(mod.WeaponAttachments.Barrel_556mm_Prototype)
   .addAttachment(mod.WeaponAttachments.Muzzle_Compensated_Brake)
   .addAttachment(mod.WeaponAttachments.Bottom_Classic_Vertical);

myPlayer.inventory.primary = lmg;
myPlayer.inventory.switchTo(mod.InventorySlots.PrimaryWeapon);

// Apply Input Restrictions
myPlayer.inputRestrictions.jump = true;
myPlayer.inputRestrictions.zoom = true;
// Prevent switching to other slots
myPlayer.inputRestrictions.selectSecondary = true;
myPlayer.inputRestrictions.selectThrowable = true;
myPlayer.inputRestrictions.selectMelee = true;
myPlayer.inputRestrictions.selectOpenGadget = true;
myPlayer.inputRestrictions.selectCharacterGadget = true;

// Subscribe to an event
const killSubscription = myPlayer.onEarnedKill.subscribe(async (victim, deathType, weapon) => {
    // Give the Juggernaut 50 health back on a kill
    mod.Heal(myPlayer.native, 50);
    Portal.UI.DisplayNotificationMessage(mod.Message("Juggernaut kill! +50 HP"));
});

// Keep ammo full
const ongoingSubscription = myPlayer.onGoing.subscribe(async () => {
    myPlayer.inventory.setAmmo(mod.InventorySlots.PrimaryWeapon, 50);
});

// Remove Juggernaut properties and events, on player died
const deathSubscription = myPlayer.onPlayerDied.subscribe(async (victim, deathType, weapon) => {
    myPlayer.maxHealth = 100;
    myPlayer.movementSpeedMultiplier = 1.0;
    
    // Reset restrictions
    myPlayer.inputRestrictions.all = false;

    // Unsubscribe from events
    killSubscription.unsubscribe();
    ongoingSubscription.unsubscribe();
    deathSubscription.unsubscribe();
});
```

## Customization

Because the wrapper is included directly in your project, you are free to modify and extend it. For example, you could add custom properties to the `Player` class to track game-specific data:

```typescript
// Inside the wrapper.ts code, modify the Player class
export class Player extends GameObject {
    // ... existing code ...
    public money: number = 0;
    // ... existing code ...
}

// In your game logic
const myPlayer = Portal.Player.fromNative(event.player);
myPlayer.money += 100; // Now you can track custom stats!
```

This project aims to make developing for Battlefield Portal faster, cleaner, and more fun. Enjoy!
