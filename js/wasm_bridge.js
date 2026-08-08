// WebAssembly Bridge with High-Performance JS Fallback Engine (128x64x128 & Natural Biomes)
class WorldBridge {
    constructor() {
        this.isWasmLoaded = false;
        this.wasmInstance = null;

        this.WORLD_SIZE_X = 128;
        this.WORLD_SIZE_Y = 64;
        this.WORLD_SIZE_Z = 128;
        this.blocks = new Uint8Array(this.WORLD_SIZE_X * this.WORLD_SIZE_Y * this.WORLD_SIZE_Z);
    }

    async init(seed = 1337) {
        if (window.Module && typeof window.Module.ccall === 'function') {
            try {
                this.wasmInitWorld = window.Module.cwrap('initWorld', null, ['number']);
                this.wasmGetBlockType = window.Module.cwrap('getBlockType', 'number', ['number', 'number', 'number']);
                this.wasmSetBlockType = window.Module.cwrap('setBlockType', null, ['number', 'number', 'number', 'number']);
                this.wasmGenerateMeshBuffer = window.Module.cwrap('generateMeshBuffer', 'number', ['number']);

                this.wasmInitWorld(seed);
                this.isWasmLoaded = true;
                console.log('%c[Webcraft 1.1] C++ WebAssembly Engine initialized!', 'color: #00ff88; font-weight: bold;');
                return;
            } catch (e) {
                console.warn('[Webcraft 1.1] Wasm load failed, switching to JS Voxel Engine.', e);
            }
        }

        console.log('%c[Webcraft 1.1] Running High-Performance JS Fallback Voxel Engine (128x64x128)', 'color: #3b82f6; font-weight: bold;');
        this.generateJSTerrain(seed);
    }

    generateJSTree(cx, cy, cz) {
        // Distance check to avoid tree clustering
        for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
                for (let dy = 0; dy <= 6; dy++) {
                    let b = this.getBlock(cx + dx, cy + dy, cz + dz);
                    if (b === 5 || b === 6) return;
                }
            }
        }

        let trunkH = 4 + Math.floor(Math.random() * 2);
        for (let y = 0; y < trunkH; y++) {
            this.setBlock(cx, cy + y, cz, 5); // Oak Log
        }

        let leafBase = cy + trunkH - 2;
        for (let ly = leafBase; ly <= cy + trunkH + 1; ly++) {
            let radius = (ly >= cy + trunkH) ? 1 : 2;
            for (let lx = cx - radius; lx <= cx + radius; lx++) {
                for (let lz = cz - radius; lz <= cz + radius; lz++) {
                    if (this.getBlock(lx, ly, lz) === 0) {
                        this.setBlock(lx, ly, lz, 6); // Oak Leaves
                    }
                }
            }
        }
    }

    generateJSTerrain(seed) {
        const noise = (x, z, scale = 45.0) => {
            let nx = x / scale;
            let nz = z / scale;
            let val = Math.sin(nx * 3.14 + seed) * Math.cos(nz * 3.14) * 0.5 +
                      Math.sin(nx * 6.28) * 0.25 +
                      Math.cos(nz * 6.28) * 0.25;
            return (val + 1.0) * 0.5;
        };

        for (let x = 0; x < this.WORLD_SIZE_X; x++) {
            for (let z = 0; z < this.WORLD_SIZE_Z; z++) {
                let isDesert = noise(x, z, 90.0) > 0.6;
                let elevation = noise(x, z, 40.0);
                let surfaceY = 22 + Math.floor(elevation * 18);
                if (surfaceY >= this.WORLD_SIZE_Y - 2) surfaceY = this.WORLD_SIZE_Y - 3;

                for (let y = 0; y < this.WORLD_SIZE_Y; y++) {
                    let idx = (y * this.WORLD_SIZE_Z + z) * this.WORLD_SIZE_X + x;
                    if (y > surfaceY) {
                        this.blocks[idx] = 0; // Air
                    } else if (y === surfaceY) {
                        this.blocks[idx] = isDesert ? 8 : 1; // Sand or Grass
                    } else if (y > surfaceY - 4) {
                        this.blocks[idx] = isDesert ? 9 : 2; // Sandstone or Dirt
                    } else {
                        // Ores & Stone ONLY (no wood under desert)
                        let o1 = noise(x + y, z + y, 8.0);
                        let o2 = noise(x - y, z - y, 6.0);
                        if (y < 12 && o1 > 0.8) this.blocks[idx] = 14;      // Diamond Ore
                        else if (y < 20 && o2 > 0.78) this.blocks[idx] = 13; // Gold Ore
                        else if (y < 35 && o1 > 0.72) this.blocks[idx] = 12; // Iron Ore
                        else if (o2 > 0.65) this.blocks[idx] = 11;          // Coal Ore
                        else this.blocks[idx] = 3;                         // Stone
                    }
                }

                // Natural trees ONLY on Grassland
                if (!isDesert && surfaceY > 20 && x > 6 && x < this.WORLD_SIZE_X - 6 && z > 6 && z < this.WORLD_SIZE_Z - 6) {
                    if (noise(x * 2, z * 2, 1.0) > 0.84 && this.getBlock(x, surfaceY, z) === 1) {
                        this.generateJSTree(x, surfaceY + 1, z);
                    }
                }
            }
        }
    }

    getBlock(x, y, z) {
        if (x < 0 || x >= this.WORLD_SIZE_X || y < 0 || y >= this.WORLD_SIZE_Y || z < 0 || z >= this.WORLD_SIZE_Z) {
            return 0;
        }
        if (this.isWasmLoaded) {
            return this.wasmGetBlockType(x, y, z);
        }
        return this.blocks[(y * this.WORLD_SIZE_Z + z) * this.WORLD_SIZE_X + x];
    }

    setBlock(x, y, z, type) {
        if (x < 0 || x >= this.WORLD_SIZE_X || y < 0 || y >= this.WORLD_SIZE_Y || z < 0 || z >= this.WORLD_SIZE_Z) {
            return;
        }
        if (this.isWasmLoaded) {
            this.wasmSetBlockType(x, y, z, type);
        } else {
            this.blocks[(y * this.WORLD_SIZE_Z + z) * this.WORLD_SIZE_X + x] = type;
        }
    }

    buildMesh() {
        if (this.isWasmLoaded) {
            let outSizePtr = window.Module._malloc(4);
            let ptr = this.wasmGenerateMeshBuffer(outSizePtr);
            let size = window.Module.getValue(outSizePtr, 'i32');
            window.Module._free(outSizePtr);

            let meshArray = new Float32Array(window.Module.HEAPF32.buffer, ptr, size);
            return new Float32Array(meshArray);
        }

        return this.buildJSMesh();
    }

    buildJSMesh() {
        const meshData = [];
        const isTransparent = (type) => (type === 6 || type === 10);
        const shouldDrawFace = (x, y, z, curType) => {
            let adj = this.getBlock(x, y, z);
            if (adj === 0) return true;
            if (isTransparent(adj) && adj !== curType) return true;
            return false;
        };

        const addFace = (x, y, z, nx, ny, nz, u1, v1, u2, v2, blockType, light, faceIdx) => {
            let p = [[0,0,0], [0,0,0], [0,0,0], [0,0,0]];
            switch (faceIdx) {
                case 0: p = [[x,y,z+1], [x+1,y,z+1], [x+1,y+1,z+1], [x,y+1,z+1]]; break;
                case 1: p = [[x+1,y,z], [x,y,z], [x,y+1,z], [x+1,y+1,z]]; break;
                case 2: p = [[x,y+1,z+1], [x+1,y+1,z+1], [x+1,y+1,z], [x,y+1,z]]; break;
                case 3: p = [[x,y,z], [x+1,y,z], [x+1,y,z+1], [x,y,z+1]]; break;
                case 4: p = [[x+1,y,z+1], [x+1,y,z], [x+1,y+1,z], [x+1,y+1,z+1]]; break;
                case 5: p = [[x,y,z], [x,y,z+1], [x,y+1,z+1], [x,y+1,z]]; break;
            }

            const indices = [0, 1, 2, 0, 2, 3];
            const uvs = [[u1, v2], [u2, v2], [u2, v1], [u1, v1]];

            for (let i = 0; i < 6; i++) {
                let idx = indices[i];
                meshData.push(
                    p[idx][0], p[idx][1], p[idx][2],
                    uvs[idx][0], uvs[idx][1],
                    nx, ny, nz,
                    blockType, light
                );
            }
        };

        for (let x = 0; x < this.WORLD_SIZE_X; x++) {
            for (let y = 0; y < this.WORLD_SIZE_Y; y++) {
                for (let z = 0; z < this.WORLD_SIZE_Z; z++) {
                    let type = this.getBlock(x, y, z);
                    if (type === 0) continue;

                    if (shouldDrawFace(x, y, z + 1, type)) addFace(x, y, z, 0, 0, 1, 0, 0, 1, 1, type, 0.7, 0);
                    if (shouldDrawFace(x, y, z - 1, type)) addFace(x, y, z, 0, 0, -1, 0, 0, 1, 1, type, 0.7, 1);
                    if (shouldDrawFace(x, y + 1, z, type)) addFace(x, y, z, 0, 1, 0, 0, 0, 1, 1, type, 1.0, 2);
                    if (shouldDrawFace(x, y - 1, z, type)) addFace(x, y, z, 0, -1, 0, 0, 0, 1, 1, type, 0.5, 3);
                    if (shouldDrawFace(x + 1, y, z, type)) addFace(x, y, z, 1, 0, 0, 0, 0, 1, 1, type, 0.85, 4);
                    if (shouldDrawFace(x - 1, y, z, type)) addFace(x, y, z, -1, 0, 0, 0, 0, 1, 1, type, 0.85, 5);
                }
            }
        }

        return new Float32Array(meshData);
    }
}
