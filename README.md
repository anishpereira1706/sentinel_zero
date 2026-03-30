# 🦾 SENTINEL ZERO | 2D Cyberpunk Shooter

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live-brightgreen?logo=vercel)](https://sentinelzero-nine.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Tech-HTML5_Canvas_|_Vanilla_JS-blue?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

**SENTINEL ZERO** is a high-octane, side-scrolling browser shooter set in a neon-drenched dystopian metropolis. You take on the role of the city's final line of defense against an onslaught of mutated monsters and advanced undead warriors.

---

## 🎮 Game Features

- **Cyberpunk Aesthetics**: Immersive neon cityscapes with layered parallax backgrounds.
- **Dynamic Combat**: Fast-paced shooting, jumping, and dashing mechanics.
- **Monstrous Bestiary**:
  - **Goblins**: Fast melee rushers that lob bombs.
  - **Mushrooms**: Ranged snipers that fire toxic spores.
  - **Skeletons**: Heavy warriors that throw spinning blades.
  - **Flying Eyes**: Aerial enemies that strafe with eye-beams.
- **Boss Battles**: Survive waves of enemies to face the **Undead Lord**, a massive 3x scale boss skeleton with 600 HP.
- **Smooth Animations**: Per-monster frame-accurate animation system.

---

## ⌨️ Controls

| Task | Command |
| :--- | :--- |
| **Move** | `A` / `D` or `←` / `→` |
| **Jump** | `W` or `↑` or `Space` |
| **Shoot** | `Left Mouse Button` |
| **Dash** | `Space` while in-air |
| **Reload** | `R` (Automatic when empty) |
| **Pause** | `Esc` |

---

## 🛠️ Technical Details

- **Built With**: Pure Vanilla JavaScript and HTML5 Canvas API (No external libraries).
- **Asset System**: Custom root-relative asset loader for high-quality pixel art.
- **Physics**: Custom gravity and collision engine for seamless movement and grounding.
- **State Management**: Robust game-state loop for loading, menu, combat, and game-over phases.

---

## 🚀 Local Setup

1. **Clone the Repo**:
   ```bash
   git clone https://github.com/anishpereira1706/sentinel-zero.git
   ```
2. **Open index.html**: Because of the relative asset paths, you can simply open the `index.html` in any browser, or use a local dev server like `serve`.

---

## 🌐 Deployment

This game is optimized for one-click hosting on **Vercel**. 

- **Link Your Repo**: Simply import the repository in Vercel.
- **Auto-Detect**: Because `index.html` is at the root, no build steps are required.

---

## 📜 Credits

- **Developer**: [anishpereira1706](https://github.com/anishpereira1706)
- **Art Assets**: High-quality pixel art monsters and cyberpunk backgrounds.

---

© 2026 Sentinel Zero - All Rights Reserved.
