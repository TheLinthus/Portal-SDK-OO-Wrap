# [Release] Object-Oriented TypeScript Wrapper for Battlefield Portal - Write Cleaner, Better Code

**Hello Battlefield Portal Community!**

I've been working on a project to drastically improve the developer experience for creating custom Portal experiences, and I'm excited to share the **Battlefield Portal TypeScript OO Wrapper**.

## 🛑 The Problem
If you've written complex logic using the standard `mod.d.ts` API, you know it can get messy. The native API is procedural, meaning you're constantly passing IDs and objects into global functions (e.g., `mod.Kill(player)`, `mod.SetPosition(player, pos)`). Managing state, handling events for specific entities, and keeping your code organized becomes a massive challenge as your game mode grows.

## 🚀 The Solution
This wrapper encapsulates the native API in a modern, **Object-Oriented** layer. It transforms the way you write Portal logic—instead of writing scripts, you're building structured software.

### Key Advantages:

1.  **Object-Oriented Entities**
    Stop juggling IDs. Work with rich classes like `Player`, `Vehicle`, `CapturePoint`, and `UIWidget`.
    *   *Native:* `mod.SetHealth(player, 100)`
    *   *Wrapper:* `myPlayer.currentHealth = 100` or `myPlayer.heal(100)`

2.  **Event-Driven Architecture**
    Subscribe to events directly on the objects they belong to. No more massive global rule loops or checking context.
    *   **Example:** `myPlayer.onEarnedKill.subscribe((victim) => { ... })`
    *   **Cleanup:** Subscriptions return an `unsubscribe()` function, making it trivial to clean up logic when a player dies or a mode changes.

3.  **Fluent Builders**
    Construct complex objects with readable, chainable methods.
    *   **Weapons:** `new Portal.Weapon(mod.Weapons.M4A1).addAttachment(...).addAttachment(...)`
    *   **UI:** `new Portal.UI.TextBuilder().text("Hello").textColor(white).build()`

4.  **State Management**
    The wrapper classes are designed to be extended. You can add your own properties (like `money`, `killStreak`, `customClass`) directly to your Player objects and access them anywhere.

5.  **Powerful Subsystems**
    *   **Inventory Manager:** Easily swap slots, set ammo, and manage loadouts with a dedicated manager.
    *   **Input Restrictions:** Type-safe control over player inputs: `player.inputRestrictions.jump = false`.
    *   **AI Management:** Define `AIPersonality` blueprints and spawn bots with specific behaviors and loadouts.
    *   **Music Controller:** Orchestrate dynamic music events for specific players or teams.

## ⚠️ Current State & Disclaimer
**This is currently in a "Beta" state.**

While the wrapper covers the vast majority of the API, **it has not been battle-tested yet.** I am releasing this now because I need **YOU**—the community—to help test it, break it, and find the bugs.

### Roadmap
*   **Feature Freeze:** There are currently **no new features planned** for the wrapper itself. The feature set is considered complete for the current API capabilities.
*   **Maintenance:** I intend to keep the wrapper updated with any future official SDK/API updates from DICE.
*   **Community Driven:** Since I cannot test every edge case alone, I am relying on community feedback to stabilize the code.

## 🔗 How to Get Started
1.  Download the `wrapper.ts` file.
2.  Include it in your TypeScript project.
3.  Start using the `Portal` namespace!

Check out the included `README` for a comprehensive "Juggernaut" example that demonstrates how to combine Inventory, Input Restrictions, and Events to create a custom game mechanic in just a few lines of code.

Let's build some amazing things together! Feedback and bug reports are highly appreciated.
