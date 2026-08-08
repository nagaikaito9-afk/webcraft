// Dynamic Pixel-Perfect Texture Atlas Generator for Webcraft 1.1 (30+ Blocks, Items & 10 Crack Stages)
const TextureGenerator = {
    TILE_SIZE: 16,
    ATLAS_COLS: 16,
    ATLAS_ROWS: 5, // 16x5 = 80 Tile Slots (256x80 px Atlas)

    // Block Texture Slot IDs
    TEX_GRASS_TOP: 0,
    TEX_GRASS_SIDE: 1,
    TEX_DIRT: 2,
    TEX_STONE: 3,
    TEX_COBBLESTONE: 4,
    TEX_OAK_LOG_SIDE: 5,
    TEX_OAK_LOG_TOP: 6,
    TEX_OAK_LEAVES: 7,
    TEX_OAK_PLANKS: 8,
    TEX_SAND: 9,
    TEX_SANDSTONE: 10,
    TEX_GLASS: 11,
    TEX_COAL_ORE: 12,
    TEX_IRON_ORE: 13,
    TEX_GOLD_ORE: 14,
    TEX_DIAMOND_ORE: 15,
    TEX_OBSIDIAN: 16,
    TEX_BRICKS: 17,
    TEX_BOOKSHELF_SIDE: 18,
    TEX_MOSSY_COBBLE: 19,
    TEX_CRAFTING_TABLE_TOP: 20,
    TEX_CRAFTING_TABLE_SIDE: 21,
    TEX_CRAFTING_TABLE_FRONT: 22,
    TEX_CHEST_TOP: 23,
    TEX_CHEST_SIDE: 24,
    TEX_TNT_SIDE: 25,
    TEX_SPONGE: 26,
    TEX_WOOL_WHITE: 27,
    TEX_WOOL_RED: 28,
    TEX_WOOL_BLUE: 29,
    TEX_WOOL_GREEN: 30,
    TEX_WOOL_YELLOW: 31,
    TEX_WOOL_BLACK: 32,

    // Crack Stages Start at Slot 48 (48..57 for 10 stages)
    CRACK_START_SLOT: 48,

    generateAtlas() {
        const canvas = document.createElement('canvas');
        canvas.width = this.TILE_SIZE * this.ATLAS_COLS;
        canvas.height = this.TILE_SIZE * this.ATLAS_ROWS;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const setPixel = (slot, px, py, r, g, b, a = 255) => {
            let col = slot % this.ATLAS_COLS;
            let row = Math.floor(slot / this.ATLAS_COLS);
            let startX = col * this.TILE_SIZE + px;
            let startY = row * this.TILE_SIZE + py;

            ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
            ctx.fillRect(startX, startY, 1, 1);
        };

        const noise = (x, y, seed = 1) => {
            let n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
            return n - Math.floor(n);
        };

        // 0: Grass Top
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let n = noise(x, y, 1.2);
            setPixel(0, x, y, 70 + Math.floor(n * 30), 140 + Math.floor(n * 60), 30 + Math.floor(n * 20));
        }

        // 1: Grass Side
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let grassH = 3 + Math.floor(noise(x, 0, 3.1) * 3);
            if (y <= grassH) {
                let n = noise(x, y, 1.2);
                setPixel(1, x, y, 70 + Math.floor(n * 30), 140 + Math.floor(n * 60), 30 + Math.floor(n * 20));
            } else {
                let n = noise(x, y, 2.5);
                setPixel(1, x, y, 110 + Math.floor(n * 35), 75 + Math.floor(n * 25), 45 + Math.floor(n * 20));
            }
        }

        // 2: Dirt
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let n = noise(x, y, 2.5);
            setPixel(2, x, y, 110 + Math.floor(n * 35), 75 + Math.floor(n * 25), 45 + Math.floor(n * 20));
        }

        // 3: Stone
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let n = noise(x, y, 4.1);
            let v = 110 + Math.floor(n * 50);
            setPixel(3, x, y, v, v, v);
        }

        // 4: Cobblestone
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let isBorder = (x % 4 === 0) || (y % 4 === 0) || ((x + y) % 5 === 0);
            let n = noise(x, y, 5.7);
            let v = isBorder ? 60 + Math.floor(n * 30) : 130 + Math.floor(n * 50);
            setPixel(4, x, y, v, v, v);
        }

        // 5: Oak Log Side
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let isLine = (x % 3 === 0);
            let n = noise(x, y, 6.1);
            let r = isLine ? 80 : 120 + Math.floor(n * 25);
            let g = isLine ? 55 : 85 + Math.floor(n * 20);
            let b = isLine ? 30 : 45 + Math.floor(n * 15);
            setPixel(5, x, y, r, g, b);
        }

        // 6: Oak Log Top
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let dist = Math.hypot(x - 7.5, y - 7.5);
            let isRing = Math.floor(dist) % 2 === 0;
            let n = noise(x, y, 6.5);
            let r = isRing ? 160 + Math.floor(n * 25) : 120 + Math.floor(n * 20);
            let g = isRing ? 120 + Math.floor(n * 20) : 85 + Math.floor(n * 15);
            let b = isRing ? 70 + Math.floor(n * 15) : 45 + Math.floor(n * 10);
            setPixel(6, x, y, r, g, b);
        }

        // 7: Oak Leaves
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let n = noise(x, y, 7.3);
            let alpha = (n > 0.15) ? 255 : 0;
            let g = 110 + Math.floor(n * 70);
            setPixel(7, x, y, 35 + Math.floor(n * 20), g, 20 + Math.floor(n * 15), alpha);
        }

        // 8: Oak Planks
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let isLine = (y % 4 === 0) || (x % 8 === 0 && (y % 8 < 4));
            let n = noise(x, y, 8.1);
            let r = isLine ? 100 : 170 + Math.floor(n * 30);
            let g = isLine ? 65 : 120 + Math.floor(n * 25);
            let b = isLine ? 35 : 65 + Math.floor(n * 15);
            setPixel(8, x, y, r, g, b);
        }

        // 9: Sand
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let n = noise(x, y, 9.2);
            let r = 220 + Math.floor(n * 25);
            let g = 205 + Math.floor(n * 25);
            let b = 150 + Math.floor(n * 20);
            setPixel(9, x, y, r, g, b);
        }

        // 10: Sandstone
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let isBorder = (y % 4 === 0);
            let n = noise(x, y, 10.1);
            let r = isBorder ? 190 : 215 + Math.floor(n * 20);
            let g = isBorder ? 175 : 195 + Math.floor(n * 20);
            let b = isBorder ? 120 : 140 + Math.floor(n * 15);
            setPixel(10, x, y, r, g, b);
        }

        // 11: Glass
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let isFrame = (x === 0 || x === 15 || y === 0 || y === 15);
            let isStreak = (x + y === 8 || x + y === 9);
            if (isFrame) setPixel(11, x, y, 220, 240, 255, 200);
            else if (isStreak) setPixel(11, x, y, 255, 255, 255, 160);
            else setPixel(11, x, y, 200, 230, 255, 45);
        }

        const drawOre = (slot, oreR, oreG, oreB, seed) => {
            for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
                let sn = noise(x, y, 4.1);
                let v = 110 + Math.floor(sn * 50);
                let on = noise(x, y, seed);
                if (on > 0.68) {
                    setPixel(slot, x, y, oreR, oreG, oreB);
                } else {
                    setPixel(slot, x, y, v, v, v);
                }
            }
        };

        drawOre(12, 30, 30, 30, 12.5);   // Coal
        drawOre(13, 215, 165, 130, 13.5); // Iron
        drawOre(14, 245, 215, 60, 14.5);  // Gold
        drawOre(15, 60, 220, 240, 15.5);  // Diamond

        // 16: Obsidian
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let n = noise(x, y, 16.2);
            setPixel(16, x, y, 25 + Math.floor(n * 25), 15 + Math.floor(n * 20), 45 + Math.floor(n * 40));
        }

        // 17: Bricks
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let row = Math.floor(y / 4);
            let offset = (row % 2 === 0) ? 0 : 4;
            let isMortar = (y % 4 === 0) || ((x + offset) % 8 === 0);
            let n = noise(x, y, 17.1);
            if (isMortar) setPixel(17, x, y, 180, 180, 185);
            else setPixel(17, x, y, 160 + Math.floor(n * 40), 60 + Math.floor(n * 20), 50 + Math.floor(n * 20));
        }

        // 18: Bookshelf Side
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let isFrame = (y < 2 || y > 13 || x < 2 || x > 13);
            let n = noise(x, y, 18.2);
            if (isFrame) setPixel(18, x, y, 150 + Math.floor(n * 20), 100 + Math.floor(n * 15), 50 + Math.floor(n * 10));
            else {
                let bookIdx = Math.floor(x / 3);
                let colors = [[180, 40, 40], [40, 120, 180], [40, 160, 60], [200, 160, 40], [140, 50, 160]];
                let c = colors[bookIdx % colors.length];
                setPixel(18, x, y, c[0], c[1], c[2]);
            }
        }

        // 19: Mossy Cobble
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let isBorder = (x % 4 === 0) || (y % 4 === 0) || ((x + y) % 5 === 0);
            let n = noise(x, y, 5.7);
            let mn = noise(x, y, 19.3);
            if (mn > 0.6) setPixel(19, x, y, 50 + Math.floor(mn * 40), 130 + Math.floor(mn * 50), 40 + Math.floor(mn * 20));
            else {
                let v = isBorder ? 60 + Math.floor(n * 30) : 130 + Math.floor(n * 50);
                setPixel(19, x, y, v, v, v);
            }
        }

        // 20: Crafting Table Top
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let isGrid = (x === 0 || x === 15 || y === 0 || y === 15 || x === 7 || y === 7);
            let n = noise(x, y, 20.1);
            if (isGrid) setPixel(20, x, y, 90, 55, 25);
            else setPixel(20, x, y, 180 + Math.floor(n * 25), 130 + Math.floor(n * 20), 75 + Math.floor(n * 15));
        }

        // 21: Crafting Table Side
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let isLine = (y % 4 === 0) || (x % 8 === 0 && (y % 8 < 4));
            let n = noise(x, y, 8.1);
            setPixel(21, x, y, isLine ? 100 : 170 + Math.floor(n * 30), isLine ? 65 : 120 + Math.floor(n * 25), isLine ? 35 : 65 + Math.floor(n * 15));
        }

        // 22: Crafting Table Front
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let isSaw = (x >= 4 && x <= 11 && y >= 4 && y <= 11);
            let n = noise(x, y, 22.1);
            if (isSaw) setPixel(22, x, y, 200, 200, 210);
            else setPixel(22, x, y, 150 + Math.floor(n * 25), 100 + Math.floor(n * 20), 50 + Math.floor(n * 15));
        }

        // 23: Chest Top
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let isBorder = (x === 0 || x === 15 || y === 0 || y === 15);
            let n = noise(x, y, 23.1);
            if (isBorder) setPixel(23, x, y, 80, 50, 20);
            else setPixel(23, x, y, 160 + Math.floor(n * 20), 105 + Math.floor(n * 15), 45 + Math.floor(n * 10));
        }

        // 24: Chest Side
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let isLatch = (x >= 7 && x <= 8 && y >= 6 && y <= 9);
            let isBorder = (x === 0 || x === 15 || y === 0 || y === 15 || y === 6);
            let n = noise(x, y, 24.1);
            if (isLatch) setPixel(24, x, y, 220, 220, 230);
            else if (isBorder) setPixel(24, x, y, 80, 50, 20);
            else setPixel(24, x, y, 160 + Math.floor(n * 20), 105 + Math.floor(n * 15), 45 + Math.floor(n * 10));
        }

        // 25: TNT Side
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let isStripe = (y >= 5 && y <= 10);
            let n = noise(x, y, 25.1);
            if (isStripe) setPixel(25, x, y, 240, 240, 245);
            else setPixel(25, x, y, 210 + Math.floor(n * 30), 40 + Math.floor(n * 20), 30 + Math.floor(n * 20));
        }

        // 26: Sponge
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
            let sn = noise(x, y, 26.1);
            let isHole = (sn > 0.65);
            setPixel(26, x, y, isHole ? 160 : 220 + Math.floor(sn * 30), isHole ? 140 : 210 + Math.floor(sn * 25), isHole ? 30 : 60);
        }

        // Wool colors (27-32)
        const woolColors = [
            [235, 235, 240], [210, 45, 45], [45, 80, 210], [45, 170, 50], [235, 210, 45], [25, 25, 30]
        ];
        woolColors.forEach((c, idx) => {
            let slot = 27 + idx;
            for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
                let n = noise(x, y, 27.0 + idx);
                setPixel(slot, x, y, Math.max(0, Math.min(255, c[0] - 20 + Math.floor(n * 30))),
                                      Math.max(0, Math.min(255, c[1] - 20 + Math.floor(n * 30))),
                                      Math.max(0, Math.min(255, c[2] - 20 + Math.floor(n * 30))));
            }
        });

        // ----------------------------------------------------
        // 10 Progressive Mining Crack Textures (Slots 48..57)
        // ----------------------------------------------------
        for (let stage = 0; stage < 10; stage++) {
            let slot = this.CRACK_START_SLOT + stage;
            let density = (stage + 1) * 0.1;
            for (let x = 0; x < 16; x++) {
                for (let y = 0; y < 16; y++) {
                    let dx = Math.abs(x - 7.5);
                    let dy = Math.abs(y - 7.5);
                    let dist = Math.hypot(dx, dy);
                    let n = noise(x, y, 48.0 + stage);

                    let isCrackLine = (Math.abs(x - y) <= stage / 3) ||
                                      (Math.abs(x + y - 15) <= stage / 3) ||
                                      (x % 4 === 0 && y % 3 === 0 && dist < stage * 1.2);

                    if (isCrackLine && n < density + 0.3) {
                        setPixel(slot, x, y, 20, 20, 20, 220); // Dark black crack lines
                    }
                }
            }
        }

        return canvas;
    }
};
