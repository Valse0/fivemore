# FIVEMORE game design

## Run structure

- A standard run lasts five minutes. A new enemy wave begins every 30 seconds.
- The boss arrives at 5:00.
- After defeating the boss, the player can leave with the run rewards or choose
  **Five more?** to continue for another five minutes. The extra time brings
  harder enemies and a gold multiplier. The multiplier value is still to be
  tuned.
- If the player dies during the extra five minutes, the continuation bonus is
  lost. The normal death payout rule still applies to the gold earned.
- On death, the player keeps 50% of the gold earned during that run.

## Experience and cards

- Zombies drop XP gems. Collecting enough gems levels the player up.
- Each level-up presents three random cards; the player chooses one.
- Card categories:
  - **Upgrades:** fire rate, damage, piercing bullets, bullet speed, move speed,
    and maximum HP.
  - **Weapons:** pistol, melee and close-range weapons, with other weapons to be
    decided.
  - **Weapon modifiers:** planned for a later design pass.

## Enemies

- **Walker:** medium HP and medium speed.
- **Runner:** low HP and very high speed; appears in groups.
- **Tank:** high HP and slow movement.
- **Spitter:** ranged attacker that keeps its distance.
- **Boss:** high HP, slow movement, appears at 5:00.

## Meta progression

- Runs award gold for permanent upgrades.
- Gold and permanent upgrade progress are stored in `localStorage`.
- On death, only 50% of run-earned gold is retained.
