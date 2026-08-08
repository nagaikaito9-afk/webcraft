// Dynamic Pixel-Perfect Texture Atlas Generator for Webcraft (Minecraft Cave Game visual style)
const TextureGenerator = {
    TILE_SIZE: 16,
    ATLAS_SLOTS: 8, // 128x16 texture atlas

    // Texture IDs in Atlas
    TEX_GRASS_TOP: 0,
    TEX_GRASS_SIDE: 1,
    TEX_DIRT: 2,
    TEX_STONE: 3,
    TEX_COBBLESTONE: 4,
    TEX_PLANKS: 5,
    TEX_BRICKS: 6,

    generateAtlas() {
        const canvas = document.createElement('canvas');
        canvas.width = this.TILE_SIZE * this.ATLAS_SLOTS;
        canvas.height = this.TILE_SIZE;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Helper to set pixel
        const setPixel = (x, y, r, g, b, a = 255) => {
            ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
            ctx.fillRect(x, y, 1, 1);
        };

        // Pseudo-random noise for pixel variation
        const noise = (x, y, seed = 1) => {
            let n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
            return n - Math.floor(n);
        };

        // 0: Grass Top
        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 16; y++) {
                let n = noise(x, y, 1.2);
                let g = 140 + Math.floor(n * 60);
                let r = 70 + Math.floor(n * 30);
                let b = 30 + Math.floor(n * 20);
                setPixel(0 * 16 + x, y, r, g, b);
            }
        }

        // 2: Dirt
        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 16; y++) {
                let n = noise(x, y, 2.5);
                let r = 110 + Math.floor(n * 35);
                let g = 75 + Math.floor(n * 25);
                let b = 45 + Math.floor(n * 20);
                setPixel(2 * 16 + x, y, r, g, b);
            }
        }

        // 1: Grass Side
        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 16; y++) {
                let grassHeight = 3 + Math.floor(noise(x, 0, 3.1) * 3);
                if (y <= grassHeight) {
                    let n = noise(x, y, 1.2);
                    let g = 140 + Math.floor(n * 60);
                    let r = 70 + Math.floor(n * 30);
                    let b = 30 + Math.floor(n * 20);
                    setPixel(1 * 16 + x, y, r, g, b);
                } else {
                    let n = noise(x, y, 2.5);
                    let r = 110 + Math.floor(n * 35);
                    let g = 75 + Math.floor(n * 25);
                    let b = 45 + Math.floor(n * 20);
                    setPixel(1 * 16 + x, y, r, g, b);
                }
            }
        }

        // 3: Stone
        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 16; y++) {
                let n = noise(x, y, 4.1);
                let v = 110 + Math.floor(n * 50);
                setPixel(3 * 16 + x, y, v, v, v);
            }
        }

        // 4: Cobblestone
        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 16; y++) {
                let isBorder = (x % 4 === 0) || (y % 4 === 0) || ((x + y) % 5 === 0);
                let n = noise(x, y, 5.7);
                let v = isBorder ? 60 + Math.floor(n * 30) : 130 + Math.floor(n * 50);
                setPixel(4 * 16 + x, y, v, v, v);
            }
        }

        // 5: Planks
        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 16; y++) {
                let isLine = (y % 4 === 0) || (x % 8 === 0 && (y % 8 < 4));
                let n = noise(x, y, 6.2);
                let r = isLine ? 90 : 160 + Math.floor(n * 30);
                let g = isLine ? 60 : 110 + Math.floor(n * 25);
                let b = isLine ? 30 : 60 + Math.floor(n * 15);
                setPixel(5 * 16 + x, y, r, g, b);
            }
        }

        // 6: Bricks
        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 16; y++) {
                let row = Math.floor(y / 4);
                let offset = (row % 2 === 0) ? 0 : 4;
                let isMortar = (y % 4 === 0) || ((x + offset) % 8 === 0);
                let n = noise(x, y, 7.8);
                if (isMortar) {
                    setPixel(6 * 16 + x, y, 180, 180, 185);
                } else {
                    let r = 160 + Math.floor(n * 40);
                    let g = 60 + Math.floor(n * 20);
                    let b = 50 + Math.floor(n * 20);
                    setPixel(6 * 16 + x, y, r, g, b);
                }
            }
        }

        return canvas;
    }
};
