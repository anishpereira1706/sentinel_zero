/* ============================================
   SENTINEL ZERO - 2D SIDESCROLLER SHOOTER
   Game Engine - HTML5 Canvas
   ============================================ */

// ============ ASSET LOADER ============
const ASSET_BASE = './';
const ASSETS = {
    buildings: ASSET_BASE + 'Assets/Buildings.png',
    props: ASSET_BASE + 'Assets/Props-01.png',
    tiles: ASSET_BASE + 'Assets/Tiles.png',
    bgProps: ASSET_BASE + 'Assets/Background/Background%20Props.png',
    baseColor: ASSET_BASE + 'Assets/Background/Base%20Color.png',
    frontalFog: ASSET_BASE + 'Assets/Background/Frontal%20Fog.png',
    midFog: ASSET_BASE + 'Assets/Background/Mid%20Fog.png',
    // Player sprite sheets (Case-Sensitive for Vercel/Linux)
    playerIdle: ASSET_BASE + 'Assets/Player/PlayerIdle.png',
    playerRun: ASSET_BASE + 'Assets/Player/PlayerRun.png',
    playerJump: ASSET_BASE + 'Assets/Player/PlayerJump.png',
    playerFall: ASSET_BASE + 'Assets/Player/PlayerFall.png',
    playerDash: ASSET_BASE + 'Assets/Player/PlayerDash.png',
    playerDeath: ASSET_BASE + 'Assets/Player/PlayerDeath.png',
    // New enemy sprite sheets (Enemies_2)
    goblinAttack: ASSET_BASE + 'Assets/Enemies_2/Goblin/Attack3.png',
    goblinBomb: ASSET_BASE + 'Assets/Enemies_2/Goblin/Bomb_sprite.png',
    mushroomAttack: ASSET_BASE + 'Assets/Enemies_2/Mushroom/Attack3.png',
    mushroomProjectile: ASSET_BASE + 'Assets/Enemies_2/Mushroom/Projectile_sprite.png',
    skeletonAttack: ASSET_BASE + 'Assets/Enemies_2/Skeleton/Attack3.png',
    skeletonSword: ASSET_BASE + 'Assets/Enemies_2/Skeleton/Sword_sprite.png',
    flyingEyeAttack: ASSET_BASE + 'Assets/Enemies_2/Flying%20eye/Attack3.png',
    flyingEyeProjectile: ASSET_BASE + 'Assets/Enemies_2/Flying%20eye/projectile_sprite.png',
};



// Player sprite config: all sheets are 96px tall, horizontal strip
const PLAYER_SPRITE_SIZE = 96;
const PLAYER_SPRITES = {
    idle: { asset: 'playerIdle', frames: 4 },
    run: { asset: 'playerRun', frames: 6 },
    jump: { asset: 'playerJump', frames: 6 },
    fall: { asset: 'playerFall', frames: 3 },
    dash: { asset: 'playerDash', frames: 4 },
    death: { asset: 'playerDeath', frames: 13 },
};

// New enemy sprite configs: each monster has its own animated spritesheet
const ENEMY_SPRITE_FRAME = 150; // All attack sprites are 150x150 per frame
const ENEMY_SPRITES = {
    goblin: {
        asset: 'goblinAttack', frames: 12, frameW: 150, frameH: 150,
        projAsset: 'goblinBomb', projFrames: 19, projFrameW: 100, projFrameH: 100,
        // Pixel bounds within 150x150 frame for grounding
        feetY: 100, topY: 65, charW: 33, charH: 36,
    },
    mushroom: {
        asset: 'mushroomAttack', frames: 11, frameW: 150, frameH: 150,
        projAsset: 'mushroomProjectile', projFrames: 8, projFrameW: 50, projFrameH: 50,
        feetY: 100, topY: 64, charW: 25, charH: 37,
    },
    skeleton: {
        asset: 'skeletonAttack', frames: 6, frameW: 150, frameH: 150,
        projAsset: 'skeletonSword', projFrames: 7, projFrameW: 102, projFrameH: 102,
        feetY: 100, topY: 47, charW: 54, charH: 54,
    },
    flyingEye: {
        asset: 'flyingEyeAttack', frames: 6, frameW: 150, frameH: 150,
        projAsset: 'flyingEyeProjectile', projFrames: 8, projFrameW: 48, projFrameH: 48,
        feetY: 90, topY: 68, charW: 25, charH: 23,
    },
};

const images = {};
let assetsLoaded = 0;
const totalAssets = Object.keys(ASSETS).length;

function loadAssets() {
    return new Promise((resolve) => {
        const loaderBar = document.getElementById('loader-bar');
        const loaderText = document.getElementById('loader-text');
        const assetNames = Object.keys(ASSETS);

        assetNames.forEach((key) => {
            const img = new Image();
            img.onload = () => {
                images[key] = img;
                assetsLoaded++;
                const pct = (assetsLoaded / totalAssets) * 100;
                loaderBar.style.width = pct + '%';
                loaderText.textContent = `Loading ${key}... (${assetsLoaded}/${totalAssets})`;
                if (assetsLoaded === totalAssets) {
                    loaderText.textContent = 'Ready!';
                    setTimeout(resolve, 500);
                }
            };
            img.onerror = () => {
                console.warn(`Failed to load: ${key}`);
                assetsLoaded++;
                const pct = (assetsLoaded / totalAssets) * 100;
                loaderBar.style.width = pct + '%';
                if (assetsLoaded === totalAssets) {
                    loaderText.textContent = 'Ready!';
                    setTimeout(resolve, 500);
                }
            };
            img.src = ASSETS[key];
        });
    });
}

// ============ CANVAS SETUP ============
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ============ GAME STATE ============
const GameState = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover',
};

let gameState = GameState.LOADING;
let score = 0;
let kills = 0;
let wave = 1;
let waveTimer = 0;
let waveEnemiesRemaining = 0;
let waveCooldown = 0;
let deltaTime = 0;
let lastTime = 0;
let gameTime = 0;
let screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
let slowMotion = { active: false, factor: 1, duration: 0 };

// ============ INPUT ============
const keys = {};
const mouse = { x: 0, y: 0, down: false };

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'Escape' && gameState === GameState.PLAYING) {
        pauseGame();
    } else if (e.key === 'Escape' && gameState === GameState.PAUSED) {
        resumeGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
        crosshair.style.left = e.clientX + 'px';
        crosshair.style.top = e.clientY + 'px';
    }
});

document.addEventListener('mousedown', (e) => {
    if (e.button === 0) mouse.down = true;
});

document.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ============ CAMERA ============
const camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    smoothing: 0.08,

    update(targetX, targetY) {
        this.targetX = targetX - canvas.width / 2;
        this.targetY = targetY - canvas.height / 2;
        this.x += (this.targetX - this.x) * this.smoothing;
        this.y += (this.targetY - this.y) * this.smoothing;

        // Clamp camera
        this.x = Math.max(0, Math.min(this.x, WORLD_WIDTH - canvas.width));
        this.y = Math.max(0, Math.min(this.y, WORLD_HEIGHT - canvas.height));
    }
};

// ============ WORLD CONFIG ============
const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 900;
const GRAVITY = 0.6;
const TILE_SIZE = 32;
const GROUND_Y = WORLD_HEIGHT - 100;

// ============ PARALLAX LAYERS ============
class ParallaxLayer {
    constructor(image, speedFactor, yOffset, scale, tileX) {
        this.image = image;
        this.speedFactor = speedFactor;
        this.yOffset = yOffset;
        this.scale = scale;
        this.tileX = tileX;
    }

    draw(camX) {
        if (!this.image) return;
        const w = this.image.width * this.scale;
        const h = this.image.height * this.scale;
        const scrollX = camX * this.speedFactor;
        const startX = -(scrollX % w);

        if (this.tileX) {
            for (let x = startX - w; x < canvas.width + w; x += w) {
                ctx.drawImage(this.image, x, this.yOffset, w, h);
            }
        } else {
            ctx.drawImage(this.image, -scrollX, this.yOffset, w, h);
        }
    }
}

let parallaxLayers = [];

function createParallaxLayers() {
    const h = canvas.height;
    parallaxLayers = [
        new ParallaxLayer(images.baseColor, 0, 0, Math.max(canvas.width / (images.baseColor?.width || 320), canvas.height / (images.baseColor?.height || 180)), true),
        new ParallaxLayer(images.midFog, 0.1, h * 0.1, 4, true),
        new ParallaxLayer(images.bgProps, 0.2, h - (images.bgProps ? images.bgProps.height * 3 : 200), 3, true),
        new ParallaxLayer(images.frontalFog, 0.05, h * 0.4, 4, true),
    ];
}

// ============ PLATFORMS ============
let platforms = [];

function generatePlatforms() {
    platforms = [];

    // Ground
    for (let x = 0; x < WORLD_WIDTH; x += TILE_SIZE) {
        platforms.push({ x, y: GROUND_Y, w: TILE_SIZE, h: TILE_SIZE * 3, type: 'ground' });
    }

    // Elevated platforms
    const platformConfigs = [
        { x: 200, y: GROUND_Y - 120, w: 200 },
        { x: 500, y: GROUND_Y - 200, w: 150 },
        { x: 800, y: GROUND_Y - 160, w: 250 },
        { x: 1100, y: GROUND_Y - 250, w: 180 },
        { x: 1400, y: GROUND_Y - 140, w: 300 },
        { x: 1800, y: GROUND_Y - 220, w: 200 },
        { x: 2100, y: GROUND_Y - 180, w: 160 },
        { x: 2400, y: GROUND_Y - 280, w: 220 },
        { x: 2700, y: GROUND_Y - 150, w: 280 },
        { x: 3000, y: GROUND_Y - 240, w: 200 },
        { x: 3300, y: GROUND_Y - 130, w: 250 },
        { x: 3600, y: GROUND_Y - 200, w: 180 },
        // Higher tier
        { x: 350, y: GROUND_Y - 330, w: 120 },
        { x: 950, y: GROUND_Y - 370, w: 130 },
        { x: 1600, y: GROUND_Y - 350, w: 140 },
        { x: 2250, y: GROUND_Y - 400, w: 110 },
        { x: 2900, y: GROUND_Y - 380, w: 130 },
        { x: 3500, y: GROUND_Y - 340, w: 150 },
    ];

    platformConfigs.forEach((p) => {
        platforms.push({ x: p.x, y: p.y, w: p.w, h: 16, type: 'platform' });
    });
}

// ============ BUILDINGS (DECORATION) ============
let buildings = [];

function generateBuildings() {
    buildings = [];
    if (!images.buildings) return;

    // Place buildings in background at intervals
    for (let x = 0; x < WORLD_WIDTH; x += 300 + Math.random() * 200) {
        buildings.push({
            x: x,
            y: GROUND_Y - 180 - Math.random() * 120,
            w: 160 + Math.random() * 100,
            h: 180 + Math.random() * 120,
            srcX: Math.floor(Math.random() * 6) * 48,
            srcY: Math.floor(Math.random() * 3) * 48,
            srcW: 48,
            srcH: 48,
            depth: 0.4 + Math.random() * 0.2,
        });
    }
}

// ============ PROPS (DECORATION) ============
let props = [];

function generateProps() {
    props = [];
    if (!images.props) return;

    // Street lamp: appears to be around x=96, w=16, h=64 in the sprite
    // Mailbox: around x=0, w=24, h=32
    // Barrier: around x=64, w=48, h=40

    const propTypes = [
        { srcX: 96, srcY: 0, srcW: 16, srcH: 64, name: 'lamp', scale: 2 },
        { srcX: 0, srcY: 0, srcW: 24, srcH: 32, name: 'mailbox', scale: 1.5 },
        { srcX: 48, srcY: 70, srcW: 64, srcH: 24, name: 'barrier', scale: 2 },
    ];

    for (let x = 100; x < WORLD_WIDTH - 100; x += 150 + Math.random() * 200) {
        const prop = propTypes[Math.floor(Math.random() * propTypes.length)];
        props.push({
            x: x,
            y: GROUND_Y - prop.srcH * prop.scale,
            ...prop,
        });
    }
}

// ============ PLAYER ============
const player = {
    x: 200,
    y: GROUND_Y - 60,
    w: 28,
    h: 44,
    vx: 0,
    vy: 0,
    speed: 5,
    jumpForce: -13,
    onGround: false,
    facing: 1, // 1 = right, -1 = left
    health: 100,
    maxHealth: 100,
    ammo: 30,
    maxAmmo: 30,
    fireRate: 100, // ms
    lastShot: 0,
    reloading: false,
    reloadTime: 1500,
    reloadStart: 0,
    dashCooldown: 0,
    dashMaxCooldown: 2000,
    dashing: false,
    dashTimer: 0,
    dashDuration: 150,
    dashSpeed: 18,
    invincible: false,
    invincibleTimer: 0,
    // Animation
    animFrame: 0,
    animTimer: 0,
    muzzleFlash: 0,
    // Sprite animation state
    spriteState: 'idle',
    spriteFrame: 0,
    spriteTimer: 0,
    isDead: false,
    deathAnimDone: false,
};

function resetPlayer() {
    player.x = 200;
    player.y = GROUND_Y - 60;
    player.vx = 0;
    player.vy = 0;
    player.health = 100;
    player.ammo = 30;
    player.onGround = false;
    player.reloading = false;
    player.dashCooldown = 0;
    player.dashing = false;
    player.invincible = true;
    player.invincibleTimer = 3000;
    player.muzzleFlash = 0;
    player.spriteState = 'idle';
    player.spriteFrame = 0;
    player.spriteTimer = 0;
    player.isDead = false;
    player.deathAnimDone = false;
}

function updatePlayer(dt) {
    const msdt = dt * 1000;

    // Movement
    let moveX = 0;
    if (keys['a'] || keys['arrowleft']) moveX -= 1;
    if (keys['d'] || keys['arrowright']) moveX += 1;

    if (player.dashing) {
        player.dashTimer -= msdt;
        player.vx = player.dashSpeed * player.facing;
        if (player.dashTimer <= 0) {
            player.dashing = false;
        }
    } else {
        player.vx = moveX * player.speed;
    }

    // Face toward mouse
    const worldMouseX = mouse.x + camera.x;
    player.facing = worldMouseX > player.x + player.w / 2 ? 1 : -1;

    // Jump
    if ((keys['w'] || keys['arrowup'] || keys[' ']) && player.onGround && !player.dashing) {
        player.vy = player.jumpForce;
        player.onGround = false;
        // Consume the key to prevent holding
        keys['w'] = false;
        keys['arrowup'] = false;
    }

    // Dash
    if (keys[' '] && player.dashCooldown <= 0 && !player.dashing && !player.onGround) {
        player.dashing = true;
        player.dashTimer = player.dashDuration;
        player.dashCooldown = player.dashMaxCooldown;
        player.vy = 0;
        player.invincible = true;
        player.invincibleTimer = player.dashDuration;
        keys[' '] = false;
    }

    if (player.dashCooldown > 0) {
        player.dashCooldown -= msdt;
    }

    if (player.invincible) {
        player.invincibleTimer -= msdt;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }

    // Gravity
    if (!player.dashing) {
        player.vy += GRAVITY;
    }

    // Apply velocity
    player.x += player.vx;
    player.y += player.vy;

    // Clamp to world
    player.x = Math.max(0, Math.min(player.x, WORLD_WIDTH - player.w));

    // Platform collision
    player.onGround = false;
    for (const plat of platforms) {
        if (player.x + player.w > plat.x && player.x < plat.x + plat.w) {
            // Falling down onto platform
            if (player.vy >= 0 && player.y + player.h > plat.y && player.y + player.h < plat.y + plat.h + player.vy + 5) {
                player.y = plat.y - player.h;
                player.vy = 0;
                player.onGround = true;
            }
        }
    }

    // Reload
    if (keys['r'] && !player.reloading && player.ammo < player.maxAmmo) {
        player.reloading = true;
        player.reloadStart = Date.now();
    }

    if (player.reloading) {
        const elapsed = Date.now() - player.reloadStart;
        if (elapsed >= player.reloadTime) {
            player.ammo = player.maxAmmo;
            player.reloading = false;
        }
    }

    // Shooting
    if (mouse.down && !player.reloading && player.ammo > 0) {
        const now = Date.now();
        if (now - player.lastShot >= player.fireRate) {
            shoot();
            player.lastShot = now;
        }
    }

    // Auto reload when empty
    if (player.ammo <= 0 && !player.reloading) {
        player.reloading = true;
        player.reloadStart = Date.now();
    }

    // Muzzle flash decay
    if (player.muzzleFlash > 0) {
        player.muzzleFlash -= dt * 15;
    }

    // Determine sprite animation state
    let newState = 'idle';
    if (player.isDead) {
        newState = 'death';
    } else if (player.dashing) {
        newState = 'dash';
    } else if (!player.onGround && player.vy < -1) {
        newState = 'jump';
    } else if (!player.onGround && player.vy > 1) {
        newState = 'fall';
    } else if (Math.abs(player.vx) > 0.5) {
        newState = 'run';
    }

    // Reset frame on state change
    if (newState !== player.spriteState) {
        player.spriteState = newState;
        player.spriteFrame = 0;
        player.spriteTimer = 0;
    }

    // Advance sprite animation
    const spriteConfig = PLAYER_SPRITES[player.spriteState];
    const animSpeed = player.spriteState === 'run' ? 0.09 :
        player.spriteState === 'death' ? 0.12 : 0.13;
    player.spriteTimer += dt;
    if (player.spriteTimer > animSpeed) {
        player.spriteTimer = 0;
        if (player.spriteState === 'death') {
            // Death: play once, stop at last frame
            if (player.spriteFrame < spriteConfig.frames - 1) {
                player.spriteFrame++;
            } else {
                player.deathAnimDone = true;
            }
        } else {
            player.spriteFrame = (player.spriteFrame + 1) % spriteConfig.frames;
        }
    }

    // Legacy anim frame for leg animation fallback
    player.animTimer += dt;
    if (player.animTimer > 0.15) {
        player.animTimer = 0;
        player.animFrame = (player.animFrame + 1) % 4;
    }
}

function drawPlayer() {
    const sx = player.x - camera.x + screenShake.x;
    const sy = player.y - camera.y + screenShake.y;
    const spriteConfig = PLAYER_SPRITES[player.spriteState];
    const spriteImg = images[spriteConfig.asset];

    ctx.save();

    // Invincibility flash
    if (player.invincible && Math.floor(Date.now() / 50) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Sprite rendering
    // Pixel analysis: character body spans Y=33..63 in the 96x96 frame
    // Feet at Y=63, head at Y=33, character ~31px tall, gun tip at (60, 44)
    const frameW = PLAYER_SPRITE_SIZE;
    const frameH = PLAYER_SPRITE_SIZE;
    const drawScale = 2.0; // Scale up so 31px character becomes ~62px (matches enemy size)
    const drawW = frameW * drawScale;
    const drawH = frameH * drawScale;

    // Feet are at Y=63 in the 96px sprite frame
    // Player collision box bottom = sy + player.h
    // drawY + 63*drawScale should equal sy + player.h
    const feetOffsetInSprite = 63 * drawScale;
    const drawX = sx + player.w / 2 - drawW / 2;
    const drawY = sy + player.h - feetOffsetInSprite;

    ctx.save();
    // Flip for facing direction
    if (player.facing === -1) {
        ctx.translate(drawX + drawW, drawY);
        ctx.scale(-1, 1);
    } else {
        ctx.translate(drawX, drawY);
    }

    // Draw the current sprite frame
    ctx.imageSmoothingEnabled = false; // Crispy pixel art
    if (spriteImg && spriteImg.complete) {
        const srcX = player.spriteFrame * frameW;
        ctx.drawImage(
            spriteImg,
            srcX, 0, frameW, frameH,  // source: clip from horizontal strip
            0, 0, drawW, drawH         // destination
        );
    } else {
        // Fallback: colored rectangle
        ctx.fillStyle = '#2a1a4e';
        ctx.fillRect(drawW * 0.25, drawH * 0.45, drawW * 0.5, drawH * 0.45);
    }
    ctx.restore();
    ctx.imageSmoothingEnabled = true;

    // Dash trail effect (draw ghostly afterimages)
    if (player.dashing && spriteImg && spriteImg.complete) {
        ctx.imageSmoothingEnabled = false;
        for (let g = 1; g <= 3; g++) {
            const gx = sx - player.facing * g * 14;
            const gy = sy;
            ctx.save();
            ctx.globalAlpha = 0.15 / g;
            const gdx = gx + player.w / 2 - drawW / 2;
            const gdy = gy + player.h - feetOffsetInSprite;
            if (player.facing === -1) {
                ctx.translate(gdx + drawW, gdy);
                ctx.scale(-1, 1);
            } else {
                ctx.translate(gdx, gdy);
            }
            const srcX = player.spriteFrame * frameW;
            ctx.drawImage(spriteImg, srcX, 0, frameW, frameH, 0, 0, drawW, drawH);
            ctx.restore();
        }
        ctx.imageSmoothingEnabled = true;
    }

    // Muzzle flash only (no separate gun — the sprite already has one)
    // Pixel analysis: gun tip at (60, 44) in the 96px frame
    if (!player.isDead && player.muzzleFlash > 0) {
        const gunTipInSpriteX = 60 * drawScale;
        const gunTipInSpriteY = 44 * drawScale;
        // Convert to screen coords
        let flashX, flashY;
        if (player.facing === 1) {
            flashX = drawX + gunTipInSpriteX;
        } else {
            flashX = drawX + drawW - gunTipInSpriteX;
        }
        flashY = drawY + gunTipInSpriteY;

        ctx.save();
        ctx.fillStyle = `rgba(255, 200, 50, ${player.muzzleFlash})`;
        ctx.shadowColor = '#ffc832';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(flashX, flashY, 5 + player.muzzleFlash * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    ctx.restore();
}

// ============ BULLETS ============
let bullets = [];

function shoot() {
    // Gun tip in world coords. Sprite: gun at (60,44), feet at Y=63, drawScale=2.0
    // Gun X offset from center: (60 - 48) * 2.0 = 24px from player center
    // Gun Y offset from feet: (63 - 44) * 2.0 = 38px above feet (player.y + player.h)
    const gunWorldX = player.x + player.w / 2 + (player.facing === 1 ? 24 : -24);
    const gunWorldY = player.y + player.h - 38;

    const angle = Math.atan2(
        (mouse.y + camera.y) - gunWorldY,
        (mouse.x + camera.x) - gunWorldX
    );

    const speed = 16;
    const spread = (Math.random() - 0.5) * 0.08;

    bullets.push({
        x: gunWorldX + Math.cos(angle) * 8,
        y: gunWorldY + Math.sin(angle) * 8,
        vx: Math.cos(angle + spread) * speed,
        vy: Math.sin(angle + spread) * speed,
        life: 80,
        damage: 20 + Math.floor(Math.random() * 10),
        trail: [],
    });

    player.ammo--;
    player.muzzleFlash = 1;

    // Screen shake
    addScreenShake(2, 50);

    // Spawn casing particle
    particles.push(createParticle(
        gunWorldX,
        gunWorldY,
        (Math.random() - 0.5) * 3 - player.facing * 2,
        -3 - Math.random() * 2,
        '#d4a017',
        3,
        0.5
    ));
}

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 6) b.trail.shift();

        b.x += b.vx;
        b.y += b.vy;
        b.life--;

        // Hit enemies
        let hitEnemy = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
                e.health -= b.damage;
                hitEnemy = true;

                // Hit particles
                for (let k = 0; k < 5; k++) {
                    particles.push(createParticle(
                        b.x, b.y,
                        (Math.random() - 0.5) * 6,
                        (Math.random() - 0.5) * 6,
                        e.color,
                        3 + Math.random() * 2,
                        0.6
                    ));
                }

                // Damage number
                damageNumbers.push({
                    x: e.x + e.w / 2,
                    y: e.y,
                    value: b.damage,
                    life: 1,
                    vy: -2,
                });

                if (e.health <= 0) {
                    killEnemy(j);
                }
                break;
            }
        }

        // Hit platforms
        let hitPlatform = false;
        for (const plat of platforms) {
            if (b.x > plat.x && b.x < plat.x + plat.w && b.y > plat.y && b.y < plat.y + plat.h) {
                hitPlatform = true;
                // Spark particles
                for (let k = 0; k < 3; k++) {
                    particles.push(createParticle(
                        b.x, b.y,
                        (Math.random() - 0.5) * 4,
                        -Math.random() * 4,
                        '#ffa500',
                        2,
                        0.4
                    ));
                }
                break;
            }
        }

        if (b.life <= 0 || hitEnemy || hitPlatform || b.x < 0 || b.x > WORLD_WIDTH || b.y < 0 || b.y > WORLD_HEIGHT) {
            bullets.splice(i, 1);
        }
    }
}

function drawBullets() {
    for (const b of bullets) {
        const sx = b.x - camera.x + screenShake.x;
        const sy = b.y - camera.y + screenShake.y;

        // Trail
        ctx.lineWidth = 2;
        for (let i = 0; i < b.trail.length - 1; i++) {
            const alpha = i / b.trail.length;
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.moveTo(b.trail[i].x - camera.x + screenShake.x, b.trail[i].y - camera.y + screenShake.y);
            ctx.lineTo(b.trail[i + 1].x - camera.x + screenShake.x, b.trail[i + 1].y - camera.y + screenShake.y);
            ctx.stroke();
        }

        // Bullet
        ctx.fillStyle = '#e9d5ff';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// ============ ENEMIES ============
let enemies = [];

// New monster types using Enemies_2 animated sprites
// Each type references a monster in ENEMY_SPRITES with unique abilities
const EnemyTypes = {
    GOBLIN: {
        speed: 1.4, health: 50, damage: 10, color: '#4a7c3a',
        score: 100, shootRate: 0, accentColor: '#6baa3e',
        monster: 'goblin', scale: 1.6,
        ability: 'bomb', bombCooldown: 4000, // Throws bombs periodically
    },
    MUSHROOM: {
        speed: 0.6, health: 70, damage: 6, color: '#8b3a62',
        score: 200, shootRate: 2500, accentColor: '#c75d8e',
        monster: 'mushroom', scale: 1.8,
        ability: 'spore', // Shoots spore projectiles
    },
    SKELETON: {
        speed: 0.9, health: 120, damage: 15, color: '#a89060',
        score: 200, shootRate: 0, accentColor: '#d4b476',
        monster: 'skeleton', scale: 1.8,
        ability: 'sword', swordCooldown: 2500, // Throws spinning swords
    },
    FLYING_EYE: {
        speed: 1.0, health: 45, damage: 8, color: '#5c3a2e',
        score: 250, shootRate: 2000, accentColor: '#e87070',
        monster: 'flyingEye', scale: 2.0,
        ability: 'eyeBeam', isFlying: true, // Flies, shoots eye projectiles
    },
    BOSS_SKELETON: {
        speed: 0.45, health: 600, damage: 30, color: '#4a3a28',
        score: 1000, shootRate: 1500, accentColor: '#ff4444',
        monster: 'skeleton', scale: 3.0,
        ability: 'sword', swordCooldown: 1200, isBoss: true,
    },
};

function spawnEnemy(type) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const config = EnemyTypes[type];
    const spriteConfig = ENEMY_SPRITES[config.monster];
    const x = side === 1
        ? camera.x + canvas.width + 150 + Math.random() * 300
        : camera.x - 150 - Math.random() * 300;

    // Collision box derived from sprite's actual character pixels, scaled
    const collisionW = Math.floor(spriteConfig.charW * config.scale);
    const collisionH = Math.floor(spriteConfig.charH * config.scale);

    // Pick spawn position
    let spawnY = GROUND_Y - collisionH;
    if (!config.isFlying && Math.random() > 0.6) {
        const validPlatforms = platforms.filter(p => p.type === 'platform' && Math.abs(p.x - x) < 400);
        if (validPlatforms.length > 0) {
            const plat = validPlatforms[Math.floor(Math.random() * validPlatforms.length)];
            spawnY = plat.y - collisionH;
        }
    }

    // Flying enemies hover above ground
    if (config.isFlying) {
        spawnY = GROUND_Y - 120 - Math.random() * 80;
    }

    const renderW = Math.floor(spriteConfig.frameW * config.scale);
    const renderH = Math.floor(spriteConfig.frameH * config.scale);

    enemies.push({
        x: Math.max(0, Math.min(x, WORLD_WIDTH - collisionW)),
        y: spawnY,
        vx: 0,
        vy: 0,
        onGround: false,
        type,
        lastShot: 0,
        lastAbility: 0,
        animFrame: 0,
        animTimer: 0,
        hitFlash: 0,
        ...config,
        w: collisionW,
        h: collisionH,
        renderW,
        renderH,
        spriteConfig,
        maxHealth: config.health,
        hoverBase: spawnY, // For flying enemies
        hoverPhase: Math.random() * Math.PI * 2,
    });
}


// ============ HEALTH PICKUPS ============
let pickups = [];

function spawnPickup(x, y) {
    if (Math.random() < 0.3) { // 30% chance to drop health
        pickups.push({
            x: x,
            y: y,
            w: 16,
            h: 16,
            vy: -3,
            heal: 15 + Math.floor(Math.random() * 15),
            life: 10, // seconds before despawn
            bobTimer: 0,
        });
    }
}

function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        p.vy += 0.3;
        p.y += p.vy;
        p.life -= dt;
        p.bobTimer += dt;

        // Ground collision
        if (p.y + p.h > GROUND_Y) {
            p.y = GROUND_Y - p.h;
            p.vy = 0;
        }

        // Platform collision
        for (const plat of platforms) {
            if (p.x + p.w > plat.x && p.x < plat.x + plat.w) {
                if (p.vy >= 0 && p.y + p.h > plat.y && p.y + p.h < plat.y + plat.h + 10) {
                    p.y = plat.y - p.h;
                    p.vy = 0;
                }
            }
        }

        // Player pickup
        if (p.x + p.w > player.x && p.x < player.x + player.w &&
            p.y + p.h > player.y && p.y < player.y + player.h) {
            player.health = Math.min(player.maxHealth, player.health + p.heal);
            // Heal particles
            for (let k = 0; k < 8; k++) {
                particles.push(createParticle(
                    player.x + player.w / 2, player.y + player.h / 2,
                    (Math.random() - 0.5) * 4,
                    -Math.random() * 5,
                    '#22c55e',
                    3,
                    0.6
                ));
            }
            damageNumbers.push({
                x: player.x + player.w / 2,
                y: player.y - 10,
                value: '+' + p.heal + ' HP',
                life: 1.2,
                vy: -2,
                color: '#22c55e',
            });
            pickups.splice(i, 1);
            continue;
        }

        if (p.life <= 0) {
            pickups.splice(i, 1);
        }
    }
}

function drawPickups() {
    for (const p of pickups) {
        const sx = p.x - camera.x + screenShake.x;
        const sy = p.y - camera.y + screenShake.y + Math.sin(p.bobTimer * 3) * 3;

        // Glow
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 12;

        // Cross shape
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(sx + 5, sy + 1, 6, 14);
        ctx.fillRect(sx + 1, sy + 5, 14, 6);

        // Bright center
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(sx + 6, sy + 2, 4, 12);
        ctx.fillRect(sx + 2, sy + 6, 12, 4);

        ctx.shadowBlur = 0;

        // Blinking when about to despawn
        if (p.life < 3 && Math.floor(p.life * 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        ctx.globalAlpha = 1;
    }
}

// ============ AMBIENT PARTICLES ============
let ambientParticles = [];

function initAmbientParticles() {
    ambientParticles = [];
    for (let i = 0; i < 30; i++) {
        ambientParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 1 + Math.random() * 2,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: -0.2 - Math.random() * 0.3,
            alpha: 0.1 + Math.random() * 0.3,
            color: Math.random() > 0.5 ? 'rgba(168, 85, 247,' : 'rgba(236, 72, 153,',
        });
    }
}

function updateAmbientParticles(dt) {
    for (const p of ambientParticles) {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.y < -10) {
            p.y = canvas.height + 10;
            p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
    }
}

function drawAmbientParticles() {
    for (const p of ambientParticles) {
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function killEnemy(index) {
    const e = enemies[index];
    score += e.score;
    kills++;

    // Death explosion particles
    for (let i = 0; i < 15; i++) {
        const angle = (Math.PI * 2 / 15) * i;
        const speed = 2 + Math.random() * 4;
        particles.push(createParticle(
            e.x + e.w / 2, e.y + e.h / 2,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            e.color,
            3 + Math.random() * 3,
            0.8 + Math.random() * 0.4
        ));
    }

    // Score popup
    damageNumbers.push({
        x: e.x + e.w / 2,
        y: e.y - 10,
        value: '+' + e.score,
        life: 1.5,
        vy: -1.5,
        color: '#f59e0b',
    });

    // Chance to drop health pickup
    spawnPickup(e.x + e.w / 2 - 8, e.y + e.h / 2);

    addScreenShake(4, 100);
    enemies.splice(index, 1);
    waveEnemiesRemaining--;
}

function updateEnemies(dt) {
    const msdt = dt * 1000;

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        // AI - Move toward player
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Flying Eye: hover movement (no gravity)
        if (e.isFlying) {
            e.hoverPhase += dt * 2;
            const targetY = e.hoverBase + Math.sin(e.hoverPhase) * 30;
            e.vy = (targetY - e.y) * 2;
            // Strafe around player
            if (dist < 200) {
                e.vx = -Math.sign(dx) * e.speed * 1.5;
            } else if (dist > 350) {
                e.vx = Math.sign(dx) * e.speed;
            } else {
                e.vx = Math.sin(gameTime * 3 + e.hoverPhase) * e.speed * 2;
            }
        }
        // Mushroom: ranged, keeps distance
        else if (e.type === 'MUSHROOM') {
            if (dist < 180) {
                e.vx = -Math.sign(dx) * e.speed * 1.5;
            } else if (dist < 280) {
                e.vx = 0;
            } else {
                e.vx = Math.sign(dx) * e.speed;
            }
        }
        // Boss: slow advance
        else if (e.isBoss) {
            if (dist < 70) {
                e.vx = 0;
            } else {
                e.vx = Math.sign(dx) * e.speed;
            }
        }
        // Melee enemies (Goblin, Skeleton): close in for attack
        else if (e.shootRate === 0) {
            const meleeRange = e.w * 0.4 + 10;
            if (dist < meleeRange) {
                e.vx = 0;
            } else {
                e.vx = Math.sign(dx) * e.speed;
            }
        }
        // Default ranged
        else {
            e.vx = Math.sign(dx) * e.speed;
        }

        // Jump if obstacle ahead (ground enemies only)
        if (!e.isFlying && e.onGround && Math.random() < 0.02) {
            e.vy = -10;
            e.onGround = false;
        }

        // Gravity (skip for flying enemies)
        if (!e.isFlying) {
            e.vy += GRAVITY;
        }

        // Apply
        e.x += e.vx;
        e.y += e.vy;

        // Platform collision (skip for flying)
        if (!e.isFlying) {
            e.onGround = false;
            for (const plat of platforms) {
                if (e.x + e.w > plat.x && e.x < plat.x + plat.w) {
                    if (e.vy >= 0 && e.y + e.h > plat.y && e.y + e.h < plat.y + plat.h + e.vy + 5) {
                        e.y = plat.y - e.h;
                        e.vy = 0;
                        e.onGround = true;
                    }
                }
            }
        }

        // Clamp
        e.x = Math.max(0, Math.min(e.x, WORLD_WIDTH - e.w));

        // ---- ABILITIES ----
        const now = Date.now();

        // Ranged shooting (Mushroom spores, Flying Eye beams)
        if (e.shootRate > 0 && dist < 500) {
            if (now - e.lastShot >= e.shootRate) {
                const angle = Math.atan2(dy, dx);
                const projSpeed = e.type === 'FLYING_EYE' ? 5 : 4;
                enemyBullets.push({
                    x: e.x + e.w / 2,
                    y: e.y + e.h / 3,
                    vx: Math.cos(angle) * projSpeed,
                    vy: Math.sin(angle) * projSpeed,
                    life: 150,
                    damage: e.damage,
                    projType: e.ability, // 'spore', 'eyeBeam'
                    projAsset: e.spriteConfig.projAsset,
                    projFrameW: e.spriteConfig.projFrameW,
                    projFrameH: e.spriteConfig.projFrameH,
                    projFrames: e.spriteConfig.projFrames,
                    projFrame: 0,
                    projTimer: 0,
                });
                e.lastShot = now;
            }
        }

        // Goblin bomb throw
        if (e.ability === 'bomb' && dist < 400) {
            const cd = e.bombCooldown || 4000;
            if (now - e.lastAbility >= cd) {
                const angle = Math.atan2(dy - 50, dx); // Arc upward
                enemyBullets.push({
                    x: e.x + e.w / 2,
                    y: e.y,
                    vx: Math.cos(angle) * 4,
                    vy: -5, // Lob upward
                    life: 180,
                    damage: e.damage * 1.5,
                    projType: 'bomb',
                    projAsset: e.spriteConfig.projAsset,
                    projFrameW: e.spriteConfig.projFrameW,
                    projFrameH: e.spriteConfig.projFrameH,
                    projFrames: e.spriteConfig.projFrames,
                    projFrame: 0,
                    projTimer: 0,
                    gravity: true, // Bombs arc
                });
                e.lastAbility = now;
            }
        }

        // Skeleton sword throw
        if (e.ability === 'sword' && e.shootRate === 0 && dist < 350) {
            const cd = e.swordCooldown || 2500;
            if (now - e.lastAbility >= cd) {
                const angle = Math.atan2(dy, dx);
                enemyBullets.push({
                    x: e.x + e.w / 2,
                    y: e.y + e.h / 2,
                    vx: Math.cos(angle) * 5,
                    vy: Math.sin(angle) * 5,
                    life: 100,
                    damage: e.damage,
                    projType: 'sword',
                    projAsset: e.spriteConfig.projAsset,
                    projFrameW: e.spriteConfig.projFrameW,
                    projFrameH: e.spriteConfig.projFrameH,
                    projFrames: e.spriteConfig.projFrames,
                    projFrame: 0,
                    projTimer: 0,
                    spin: true, // Spinning animation
                });
                e.lastAbility = now;
            }
        }

        // Melee damage to player
        if (!player.invincible) {
            if (e.x + e.w > player.x && e.x < player.x + player.w &&
                e.y + e.h > player.y && e.y < player.y + player.h) {
                if (!e._damageCooldown || now - e._damageCooldown > 800) {
                    player.health -= e.damage;
                    e._damageCooldown = now;
                    addScreenShake(5, 150);

                    // Knockback
                    const knockDir = Math.sign(e.x - player.x) || 1;
                    e.vx = knockDir * 6;
                    e.vy = -3;
                    player.vx = -knockDir * 4;
                    player.x += player.vx * 3;

                    // Blood particles
                    for (let k = 0; k < 5; k++) {
                        particles.push(createParticle(
                            player.x + player.w / 2, player.y + player.h / 2,
                            (Math.random() - 0.5) * 6,
                            (Math.random() - 0.5) * 6,
                            '#ef4444',
                            3,
                            0.5
                        ));
                    }
                }
            }
        }

        // Hit flash
        if (e.hitFlash > 0) e.hitFlash -= dt * 10;

        // Animation - cycle through frames of the attack spritesheet
        e.animTimer += dt;
        const animSpeed = e.vx !== 0 ? 0.08 : 0.12;
        if (e.animTimer > animSpeed) {
            e.animTimer = 0;
            e.animFrame = (e.animFrame + 1) % (e.spriteConfig ? e.spriteConfig.frames : 4);
        }
    }
}


function drawEnemies() {
    for (const e of enemies) {
        const sx = e.x - camera.x + screenShake.x;
        const sy = e.y - camera.y + screenShake.y;
        const facing = player.x > e.x ? 1 : -1;
        const sc = e.spriteConfig;

        // Calculate sprite render offset to align feet with collision box bottom
        // The sprite frame is larger than the character; align based on sprite pixel bounds
        const feetYScaled = sc.feetY * e.scale;  // Where feet are in the scaled sprite
        const topYScaled = sc.topY * e.scale;     // Where character top is in scaled sprite
        const charHScaled = sc.charH * e.scale;

        // Position sprite so the character's feet in the sprite align with collision box bottom
        const renderOffX = (e.renderW - e.w) / 2;
        const renderOffY = feetYScaled - e.h; // Offset so feet line up

        ctx.save();

        // Hit flash
        if (e.hitFlash > 0) {
            ctx.globalAlpha = 0.7;
        }

        // Flip based on facing
        if (facing === -1) {
            ctx.translate(sx + e.w / 2, sy);
            ctx.scale(-1, 1);
            ctx.translate(-(e.w / 2), 0);
        } else {
            ctx.translate(sx, sy);
        }

        // Movement bob
        const bob = e.vx !== 0 ? Math.sin(e.animTimer * 10) * 2 : 0;

        // Draw animated sprite from individual spritesheet
        ctx.imageSmoothingEnabled = false;
        const sheet = images[sc.asset];
        if (sheet) {
            const frameX = e.animFrame * sc.frameW;
            ctx.drawImage(
                sheet,
                frameX, 0,           // Source: current frame in horizontal strip
                sc.frameW, sc.frameH, // Source size: one frame
                -renderOffX, -renderOffY + bob,  // Destination position
                e.renderW, e.renderH  // Destination size
            );

            // Hit flash overlay
            if (e.hitFlash > 0) {
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = `rgba(255, 255, 255, ${e.hitFlash * 0.8})`;
                ctx.fillRect(-renderOffX, -renderOffY + bob, e.renderW, e.renderH);
                ctx.globalCompositeOperation = 'source-over';
            }
        } else {
            // Fallback
            ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : e.color;
            ctx.fillRect(0, 0, e.w, e.h);
        }

        // Type-specific visual effects
        if (e.isBoss) {
            // Boss: menacing red glow aura
            ctx.shadowColor = '#ff4444';
            ctx.shadowBlur = 15 + Math.sin(gameTime * 5) * 5;
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3 + Math.sin(gameTime * 3) * 0.15;
            ctx.strokeRect(-renderOffX - 4, -renderOffY - 4 + bob, e.renderW + 8, e.renderH + 8);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        } else if (e.type === 'FLYING_EYE') {
            // Flying Eye: eerie glow ring underneath
            ctx.globalAlpha = 0.4 + Math.sin(gameTime * 4) * 0.2;
            ctx.shadowColor = '#e87070';
            ctx.shadowBlur = 12;
            ctx.strokeStyle = '#e87070';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(e.w / 2, e.h + 8 + bob, e.w * 0.6, 6, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        } else if (e.type === 'MUSHROOM') {
            // Mushroom: poison spore cloud
            ctx.globalAlpha = 0.25 + Math.sin(gameTime * 3) * 0.1;
            ctx.fillStyle = '#8b3a62';
            ctx.shadowColor = '#c75d8e';
            ctx.shadowBlur = 8;
            for (let s = 0; s < 3; s++) {
                const sporeX = e.w / 2 + Math.cos(gameTime * 2 + s * 2.1) * (e.w * 0.4);
                const sporeY = -5 + Math.sin(gameTime * 3 + s * 1.5) * 8;
                ctx.beginPath();
                ctx.arc(sporeX, sporeY + bob, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        } else if (e.type === 'GOBLIN') {
            // Goblin: subtle green aura at feet
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#4a7c3a';
            ctx.shadowColor = '#6baa3e';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.ellipse(e.w / 2, e.h + 2 + bob, e.w * 0.5, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        } else if (e.type === 'SKELETON') {
            // Skeleton: bone dust particles
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#d4b476';
            for (let s = 0; s < 2; s++) {
                const dustX = e.w / 2 + Math.cos(gameTime * 4 + s * 3) * (e.w * 0.3);
                const dustY = e.h + Math.sin(gameTime * 5 + s * 2) * 3;
                ctx.beginPath();
                ctx.arc(dustX, dustY + bob, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        ctx.restore();
        ctx.imageSmoothingEnabled = true;

        // Health bar (above enemy)
        if (e.health < e.maxHealth) {
            const hbW = e.w + 16;
            const hbH = 4;
            const hbX = sx + e.w / 2 - hbW / 2;
            const hbY = sy - 12;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(hbX - 1, hbY - 1, hbW + 2, hbH + 2);
            const hpRatio = e.health / e.maxHealth;
            ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
            ctx.fillRect(hbX, hbY, hbW * hpRatio, hbH);

            // Boss shows name label
            if (e.isBoss) {
                ctx.font = 'bold 10px "Orbitron", monospace';
                ctx.fillStyle = '#dc2626';
                ctx.textAlign = 'center';
                ctx.shadowColor = '#dc2626';
                ctx.shadowBlur = 5;
                ctx.fillText('UNDEAD LORD', sx + e.w / 2, hbY - 4);
                ctx.shadowBlur = 0;
                ctx.textAlign = 'left';
            }
        }
    }
}


// ============ ENEMY BULLETS ============
let enemyBullets = [];

function updateEnemyBullets(dt) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;

        // Gravity for bombs
        if (b.gravity) {
            b.vy += 0.15;
        }

        // Animate projectile sprite
        if (b.projFrames) {
            b.projTimer = (b.projTimer || 0) + dt;
            if (b.projTimer > 0.08) {
                b.projTimer = 0;
                b.projFrame = (b.projFrame + 1) % b.projFrames;
            }
        }

        // Hit player
        if (!player.invincible) {
            const hitRadius = b.projType === 'bomb' ? 25 : 12;
            if (b.x > player.x - hitRadius && b.x < player.x + player.w + hitRadius &&
                b.y > player.y - hitRadius && b.y < player.y + player.h + hitRadius) {
                player.health -= b.damage;
                addScreenShake(b.projType === 'bomb' ? 8 : 3, b.projType === 'bomb' ? 200 : 100);

                // Hit particles - colored by projectile type
                const hitColor = b.projType === 'bomb' ? '#ff8800' :
                                 b.projType === 'spore' ? '#c75d8e' :
                                 b.projType === 'sword' ? '#d4b476' :
                                 b.projType === 'eyeBeam' ? '#e87070' : '#ef4444';
                const particleCount = b.projType === 'bomb' ? 8 : 3;
                for (let k = 0; k < particleCount; k++) {
                    particles.push(createParticle(
                        b.x, b.y,
                        (Math.random() - 0.5) * (b.projType === 'bomb' ? 8 : 4),
                        (Math.random() - 0.5) * (b.projType === 'bomb' ? 8 : 4),
                        hitColor,
                        b.projType === 'bomb' ? 5 : 3,
                        b.projType === 'bomb' ? 0.6 : 0.4
                    ));
                }

                // Bomb explosion area damage
                if (b.projType === 'bomb') {
                    addScreenShake(10, 300);
                }

                enemyBullets.splice(i, 1);
                continue;
            }
        }

        // Hit platforms (bombs explode on impact)
        let hit = false;
        for (const plat of platforms) {
            if (b.x > plat.x && b.x < plat.x + plat.w && b.y > plat.y && b.y < plat.y + plat.h) {
                hit = true;
                // Bomb explosion particles on terrain hit
                if (b.projType === 'bomb') {
                    for (let k = 0; k < 6; k++) {
                        particles.push(createParticle(
                            b.x, b.y,
                            (Math.random() - 0.5) * 6,
                            -Math.random() * 5,
                            k < 3 ? '#ff8800' : '#ff4400',
                            4,
                            0.5
                        ));
                    }
                }
                break;
            }
        }

        if (b.life <= 0 || hit || b.x < 0 || b.x > WORLD_WIDTH || b.y < 0 || b.y > WORLD_HEIGHT) {
            enemyBullets.splice(i, 1);
        }
    }
}

function drawEnemyBullets() {
    for (const b of enemyBullets) {
        const sx = b.x - camera.x + screenShake.x;
        const sy = b.y - camera.y + screenShake.y;

        // Try to draw sprite-based projectile
        const projSheet = b.projAsset ? images[b.projAsset] : null;
        if (projSheet && b.projFrameW) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            const frame = b.projFrame || 0;
            const srcX = frame * b.projFrameW;
            const renderSize = b.projType === 'bomb' ? 40 : b.projType === 'sword' ? 36 : 24;

            // Spin effect for swords
            if (b.spin) {
                ctx.translate(sx, sy);
                ctx.rotate(gameTime * 12);
                ctx.drawImage(
                    projSheet,
                    srcX, 0,
                    b.projFrameW, b.projFrameH,
                    -renderSize / 2, -renderSize / 2,
                    renderSize, renderSize
                );
            } else {
                ctx.drawImage(
                    projSheet,
                    srcX, 0,
                    b.projFrameW, b.projFrameH,
                    sx - renderSize / 2, sy - renderSize / 2,
                    renderSize, renderSize
                );
            }

            // Glow effect
            ctx.globalAlpha = 0.4;
            const glowColor = b.projType === 'bomb' ? '#ff8800' :
                              b.projType === 'spore' ? '#c75d8e' :
                              b.projType === 'sword' ? '#d4b476' :
                              '#e87070';
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.arc(b.spin ? 0 : sx, b.spin ? 0 : sy, renderSize / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;

            ctx.restore();
            ctx.imageSmoothingEnabled = true;
        } else {
            // Fallback dot rendering
            ctx.fillStyle = '#ff4444';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(sx, sy, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}


// ============ PARTICLES ============
let particles = [];
let damageNumbers = [];

function createParticle(x, y, vx, vy, color, size, life) {
    return { x, y, vx, vy, color, size, life, maxLife: life };
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life -= dt;
        p.size *= 0.98;

        if (p.life <= 0 || p.size < 0.5) {
            particles.splice(i, 1);
        }
    }

    // Damage numbers
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const d = damageNumbers[i];
        d.y += d.vy;
        d.life -= dt;
        if (d.life <= 0) {
            damageNumbers.splice(i, 1);
        }
    }
}

function drawParticles() {
    for (const p of particles) {
        const sx = p.x - camera.x + screenShake.x;
        const sy = p.y - camera.y + screenShake.y;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Damage numbers
    ctx.font = 'bold 16px "Orbitron", monospace';
    ctx.textAlign = 'center';
    for (const d of damageNumbers) {
        const sx = d.x - camera.x + screenShake.x;
        const sy = d.y - camera.y + screenShake.y;
        ctx.globalAlpha = Math.min(1, d.life);
        ctx.fillStyle = d.color || '#ffffff';
        ctx.shadowColor = d.color || '#ffffff';
        ctx.shadowBlur = 5;
        ctx.fillText(String(d.value), sx, sy);
        ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
}

// ============ WAVE SYSTEM ============
function startWave(waveNum) {
    wave = waveNum;
    const enemyCount = 5 + wave * 3;
    waveEnemiesRemaining = enemyCount;
    waveCooldown = 0;

    // Show announcement
    const announce = document.getElementById('wave-announce');
    const announceText = document.getElementById('wave-announce-text');
    const announceSub = document.getElementById('wave-announce-sub');
    announceText.textContent = `WAVE ${wave}`;

    const subs = [
        'Survive the onslaught',
        'They\'re getting stronger',
        'Hold the line',
        'No mercy',
        'The city fights back',
        'Elite forces incoming',
        'Final stand',
    ];
    announceSub.textContent = subs[Math.min(wave - 1, subs.length - 1)] || 'Survive';

    announce.classList.remove('hidden');
    announce.style.animation = 'none';
    announce.offsetHeight; // trigger reflow
    announce.style.animation = 'waveAnnounce 3s ease forwards';
    setTimeout(() => announce.classList.add('hidden'), 3000);

    // Spawn enemies over time
    let spawned = 0;
    const spawnInterval = setInterval(() => {
        if (spawned >= enemyCount || gameState !== GameState.PLAYING) {
            clearInterval(spawnInterval);
            return;
        }

        // Choose enemy type based on wave progression
        let type = 'GOBLIN';
        const roll = Math.random();
        if (wave >= 7 && roll < 0.10) type = 'BOSS_SKELETON';
        else if (wave >= 5 && roll < 0.25) type = 'FLYING_EYE';
        else if (wave >= 3 && roll < 0.45) type = 'SKELETON';
        else if (wave >= 2 && roll < 0.65) type = 'MUSHROOM';


        spawnEnemy(type);
        spawned++;
    }, 1000 + Math.random() * 1500);
}

function updateWaves(dt) {
    if (waveEnemiesRemaining <= 0 && enemies.length === 0) {
        waveCooldown += dt * 1000;
        if (waveCooldown >= 3000) {
            startWave(wave + 1);
        }
    }
}

// ============ SCREEN EFFECTS ============
function addScreenShake(intensity, duration) {
    screenShake.intensity = Math.max(screenShake.intensity, intensity);
    screenShake.duration = Math.max(screenShake.duration, duration);
}

function updateScreenShake(dt) {
    if (screenShake.duration > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
        screenShake.duration -= dt * 1000;
        screenShake.intensity *= 0.95;
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
        screenShake.intensity = 0;
    }
}

// ============ RENDERING ============
function drawPlatforms() {
    const tileImg = images.tiles;

    for (const plat of platforms) {
        const sx = plat.x - camera.x + screenShake.x;
        const sy = plat.y - camera.y + screenShake.y;

        // Skip if off screen
        if (sx + plat.w < -50 || sx > canvas.width + 50) continue;
        if (sy + plat.h < -50 || sy > canvas.height + 50) continue;

        if (plat.type === 'ground') {
            if (tileImg) {
                // Use tiles spritesheet for ground
                ctx.drawImage(tileImg, 0, 0, 32, 32, sx, sy, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#1a1040';
                ctx.fillRect(sx, sy, plat.w, plat.h);
                ctx.fillStyle = '#2a1a5e';
                ctx.fillRect(sx, sy, plat.w, 4);
            }
        } else {
            // Platform
            if (tileImg) {
                // Draw platform with tile texture
                const numTiles = Math.ceil(plat.w / TILE_SIZE);
                for (let t = 0; t < numTiles; t++) {
                    const tw = Math.min(TILE_SIZE, plat.w - t * TILE_SIZE);
                    ctx.drawImage(tileImg, 0, 0, 32, 16, sx + t * TILE_SIZE, sy, tw, plat.h);
                }
            } else {
                ctx.fillStyle = '#2a1850';
                ctx.fillRect(sx, sy, plat.w, plat.h);
            }

            // Neon edge
            ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
            ctx.fillRect(sx, sy, plat.w, 2);
            // Side glow
            ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
            ctx.fillRect(sx, sy, 2, plat.h);
            ctx.fillRect(sx + plat.w - 2, sy, 2, plat.h);
        }
    }
}

function drawBuildings() {
    if (!images.buildings) return;

    for (const b of buildings) {
        const parallaxX = b.x - camera.x * b.depth + screenShake.x;
        const sy = b.y - camera.y * 0.3 + screenShake.y;

        if (parallaxX + b.w < -50 || parallaxX > canvas.width + 50) continue;

        ctx.globalAlpha = 0.6;
        ctx.drawImage(images.buildings, b.srcX, b.srcY, b.srcW, b.srcH, parallaxX, sy, b.w, b.h);
        ctx.globalAlpha = 1;
    }
}

function drawProps() {
    if (!images.props) return;

    for (const p of props) {
        const sx = p.x - camera.x + screenShake.x;
        const sy = p.y - camera.y + screenShake.y;

        if (sx + p.srcW * p.scale < -50 || sx > canvas.width + 50) continue;

        ctx.drawImage(images.props, p.srcX, p.srcY, p.srcW, p.srcH,
            sx, sy, p.srcW * p.scale, p.srcH * p.scale);
    }
}

function drawFog() {
    if (!images.frontalFog) return;

    // Draw scrolling fog overlay for atmosphere
    const fogW = images.frontalFog.width * 6;
    const fogH = canvas.height;
    const scrollX = gameTime * 20;

    ctx.globalAlpha = 0.15;
    for (let x = -(scrollX % fogW); x < canvas.width; x += fogW) {
        ctx.drawImage(images.frontalFog, x, 0, fogW, fogH);
    }
    ctx.globalAlpha = 1;
}

function drawVignette() {
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.4,
        canvas.width / 2, canvas.height / 2, canvas.height
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawDamageOverlay() {
    if (player.health < 30) {
        const pulse = 0.15 + Math.sin(gameTime * 5) * 0.1;
        ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// ============ HUD UPDATE ============
function updateHUD() {
    // Health
    const healthBar = document.getElementById('health-bar');
    const healthText = document.getElementById('health-text');
    const healthPct = Math.max(0, player.health) / player.maxHealth;
    healthBar.style.width = (healthPct * 100) + '%';
    healthText.textContent = Math.max(0, Math.ceil(player.health));
    healthBar.className = 'health-bar';
    if (healthPct < 0.25) healthBar.classList.add('low');
    else if (healthPct < 0.5) healthBar.classList.add('mid');

    // Ammo
    document.getElementById('ammo-text').textContent = `${player.ammo} / ${player.maxAmmo}`;

    // Score & kills
    document.getElementById('score-value').textContent = score.toLocaleString();
    document.getElementById('kills-value').textContent = kills;

    // Wave
    document.getElementById('wave-number').textContent = wave;

    // Reload indicator
    const reloadIndicator = document.getElementById('reload-indicator');
    const reloadBar = document.getElementById('reload-bar');
    if (player.reloading) {
        reloadIndicator.classList.remove('hidden');
        const elapsed = Date.now() - player.reloadStart;
        reloadBar.style.width = (elapsed / player.reloadTime * 100) + '%';
    } else {
        reloadIndicator.classList.add('hidden');
    }

    // Dash indicator
    const dashBar = document.getElementById('dash-bar');
    const dashPct = Math.max(0, 1 - player.dashCooldown / player.dashMaxCooldown);
    dashBar.style.width = (dashPct * 100) + '%';
}

// ============ UTILITY ============
function darkenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
}

// ============ GAME FLOW ============
function startGame() {
    gameState = GameState.PLAYING;
    score = 0;
    kills = 0;
    wave = 0;
    enemies = [];
    bullets = [];
    enemyBullets = [];
    particles = [];
    damageNumbers = [];
    pickups = [];
    resetPlayer();
    generatePlatforms();
    generateBuildings();
    generateProps();
    createParallaxLayers();
    initAmbientParticles();

    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('crosshair').classList.remove('hidden');

    startWave(1);
}

function pauseGame() {
    gameState = GameState.PAUSED;
    document.getElementById('pause-screen').classList.remove('hidden');
    document.body.style.cursor = 'default';
}

function resumeGame() {
    gameState = GameState.PLAYING;
    document.getElementById('pause-screen').classList.add('hidden');
    document.body.style.cursor = 'none';
}

function gameOver() {
    gameState = GameState.GAMEOVER;
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('crosshair').classList.add('hidden');
    document.getElementById('gameover-screen').classList.remove('hidden');
    document.getElementById('final-score').textContent = score.toLocaleString();
    document.getElementById('final-wave').textContent = wave;
    document.getElementById('final-kills').textContent = kills;
    document.body.style.cursor = 'default';
}

function showMenu() {
    gameState = GameState.MENU;
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('crosshair').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.body.style.cursor = 'default';
}

// ============ MAIN GAME LOOP ============
function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);

    deltaTime = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    if (gameState === GameState.PLAYING) {
        gameTime += deltaTime;

        updatePlayer(deltaTime);
        updateBullets(deltaTime);
        updateEnemies(deltaTime);
        updateEnemyBullets(deltaTime);
        updatePickups(deltaTime);
        updateParticles(deltaTime);
        updateAmbientParticles(deltaTime);
        updateWaves(deltaTime);
        updateScreenShake(deltaTime);

        // Check death
        if (player.health <= 0) {
            gameOver();
            return;
        }

        camera.update(player.x + player.w / 2, player.y + player.h / 2);
        updateHUD();
    }

    // Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === GameState.PLAYING || gameState === GameState.PAUSED) {
        // Background
        for (const layer of parallaxLayers) {
            layer.draw(camera.x);
        }

        drawBuildings();
        drawPlatforms();
        drawProps();
        drawPickups();
        drawEnemyBullets();
        drawEnemies();
        drawPlayer();
        drawBullets();
        drawParticles();
        drawAmbientParticles();
        drawFog();
        drawVignette();
        drawDamageOverlay();
    } else if (gameState === GameState.MENU || gameState === GameState.GAMEOVER) {
        // Animated menu background
        drawMenuBackground(timestamp);
    }
}

function drawMenuBackground(timestamp) {
    // Draw a simplified version of the game scene
    if (images.baseColor) {
        const scale = Math.max(canvas.width / images.baseColor.width, canvas.height / images.baseColor.height);
        ctx.drawImage(images.baseColor, 0, 0, images.baseColor.width, images.baseColor.height,
            0, 0, images.baseColor.width * scale, images.baseColor.height * scale);
    }

    if (images.bgProps) {
        const t = timestamp / 1000;
        const scrollX = t * 15;
        const w = images.bgProps.width * 3;
        const h = images.bgProps.height * 3;
        ctx.globalAlpha = 0.5;
        for (let x = -(scrollX % w); x < canvas.width; x += w) {
            ctx.drawImage(images.bgProps, x, canvas.height - h, w, h);
        }
        ctx.globalAlpha = 1;
    }

    // Buildings slow scroll
    if (images.buildings) {
        const t = timestamp / 1000;
        const scrollX = t * 8;
        ctx.globalAlpha = 0.3;
        for (let x = -(scrollX % 400) - 400; x < canvas.width + 400; x += 400) {
            ctx.drawImage(images.buildings, 0, 0, 48, 48, x, canvas.height - 250, 200, 200);
            ctx.drawImage(images.buildings, 48, 0, 48, 48, x + 150, canvas.height - 300, 180, 250);
        }
        ctx.globalAlpha = 1;
    }

    // Fog
    if (images.frontalFog) {
        const t = timestamp / 1000;
        const scrollX = t * 10;
        const fogW = images.frontalFog.width * 6;
        ctx.globalAlpha = 0.2;
        for (let x = -(scrollX % fogW); x < canvas.width; x += fogW) {
            ctx.drawImage(images.frontalFog, x, 0, fogW, canvas.height);
        }
        ctx.globalAlpha = 1;
    }

    drawVignette();
}

// ============ UI EVENT LISTENERS ============
document.getElementById('btn-start').addEventListener('click', () => {
    startGame();
    document.body.style.cursor = 'none';
});

document.getElementById('btn-controls').addEventListener('click', () => {
    document.getElementById('controls-modal').classList.remove('hidden');
});

document.getElementById('btn-close-controls').addEventListener('click', () => {
    document.getElementById('controls-modal').classList.add('hidden');
});

document.getElementById('btn-resume').addEventListener('click', () => {
    resumeGame();
});

document.getElementById('btn-quit').addEventListener('click', () => {
    showMenu();
});

document.getElementById('btn-retry').addEventListener('click', () => {
    startGame();
    document.body.style.cursor = 'none';
});

document.getElementById('btn-menu').addEventListener('click', () => {
    showMenu();
});

// ============ INIT ============
async function init() {
    await loadAssets();

    // Hide loading, show menu
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    gameState = GameState.MENU;

    createParallaxLayers();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

init();
