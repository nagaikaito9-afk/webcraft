// WebAssembly Bridge with High-Performance JS Fallback Engine
class WorldBridge {
    constructor() {
        this.isWasmLoaded = false;
        this.wasmInstance = null;

        // JS Fallback Engine State
        this.WORLD_SIZE_X = 64;
        this.WORLD_SIZE_Y = 64;
        this.WORLD_SIZE_Z = 64;
        this.blocks = new Uint8Array(this.WORLD_SIZE_X * this.WORLD_SIZE_Y * this.WORLD_SIZE_Z);
    }

    async init(seed = 1337) {
        // Try initializing Wasm if available
        if (window.Module && typeof window.Module.ccall === 'function') {
            try {
                this.wasmInitWorld = window.Module.cwrap('initWorld', null, ['number']);
                this.wasmGetBlockType = window.Module.cwrap('getBlockType', 'number', ['number', 'number', 'number']);
                this.wasmSetBlockType = window.Module.cwrap('setBlockType', null, ['number', 'number', 'number', 'number']);
                this.wasmGenerateMeshBuffer = window.Module.cwrap('generateMeshBuffer', 'number', ['number']);

                this.wasmInitWorld(seed);
                this.isWasmLoaded = true;
                console.log('%c[Webcraft] C++ WebAssembly Engine initialized successfully!', 'color: #00ff88; font-weight: bold;');
                return;
            } catch (e) {
                console.warn('[Webcraft] Wasm load failed, switching to JS Voxel Engine.', e);
            }
        }

        // JS Engine Initialization
        console.log('%c[Webcraft] Running High-Performance JS Fallback Voxel Engine', 'color: #3b82f6; font-weight: bold;');
        this.generateJSTerrain(seed);
    }

    // JS Perlin Noise generator for fallback
    generateJSTerrain(seed) {
        const noise = (x, z) => {
            let nx = x / 28.0;
            let nz = z / 28.0;
            let val = Math.sin(nx * 3.14 + seed) * Math.cos(nz * 3.14) * 0.5 +
                      Math.sin(nx * 6.28) * 0.25 +
                      Math.cos(nz * 6.28) * 0.25;
            return (val + 1.0) * 0.5;
        };

        for (let x = 0; x < this.WORLD_SIZE_X; x++) {
            for (let z = 0; z < this.WORLD_SIZE_Z; z++) {
                let elevation = noise(x, z);
                let surfaceY = 22 + Math.floor(elevation * 14);
                if (surfaceY >= this.WORLD_SIZE_Y) surfaceY = this.WORLD_SIZE_Y - 1;

                for (let y = 0; y < this.WORLD_SIZE_Y; y++) {
                    let idx = (y * this.WORLD_SIZE_Z + z) * this.WORLD_SIZE_X + x;
                    if (y > surfaceY) {
                        this.blocks[idx] = 0; // Air
                    } else if (y === surfaceY) {
                        this.blocks[idx] = 1; // Grass
                    } else if (y > surfaceY - 4) {
                        this.blocks[idx] = 2; // Dirt
                    } else {
                        this.blocks[idx] = 3; // Stone
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
            // Return copy of array
            return new Float32Array(meshArray);
        }

        // JS Face Culling Mesh Generator
        return this.buildJSMesh();
    }

    buildJSMesh() {
        const meshData = [];
        const isOpaque = (x, y, z) => this.getBlock(x, y, z) !== 0;

        const addFace = (x, y, z, nx, ny, nz, u1, v1, u2, v2, blockType, light, faceIdx) => {
            let p = [
                [0,0,0], [0,0,0], [0,0,0], [0,0,0]
            ];
            switch (faceIdx) {
                case 0: // +Z
                    p = [[x,y,z+1], [x+1,y,z+1], [x+1,y+1,z+1], [x,y+1,z+1]]; break;
                case 1: // -Z
                    p = [[x+1,y,z], [x,y,z], [x,y+1,z], [x+1,y+1,z]]; break;
                case 2: // +Y
                    p = [[x,y+1,z+1], [x+1,y+1,z+1], [x+1,y+1,z], [x,y+1,z]]; break;
                case 3: // -Y
                    p = [[x,y,z], [x+1,y,z], [x+1,y,z+1], [x,y,z+1]]; break;
                case 4: // +X
                    p = [[x+1,y,z+1], [x+1,y,z], [x+1,y+1,z], [x+1,y+1,z+1]]; break;
                case 5: // -X
                    p = [[x,y,z], [x,y,z+1], [x,y+1,z+1], [x,y+1,z]]; break;
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

                    if (!isOpaque(x, y, z + 1)) addFace(x, y, z, 0, 0, 1, 0, 0, 1, 1, type, 0.7, 0);
                    if (!isOpaque(x, y, z - 1)) addFace(x, y, z, 0, 0, -1, 0, 0, 1, 1, type, 0.7, 1);
                    if (!isOpaque(x, y + 1, z)) addFace(x, y, z, 0, 1, 0, 0, 0, 1, 1, type, 1.0, 2);
                    if (!isOpaque(x, y - 1, z)) addFace(x, y, z, 0, -1, 0, 0, 0, 1, 1, type, 0.5, 3);
                    if (!isOpaque(x + 1, y, z)) addFace(x, y, z, 1, 0, 0, 0, 0, 1, 1, type, 0.85, 4);
                    if (!isOpaque(x - 1, y, z)) addFace(x, y, z, -1, 0, 0, 0, 0, 1, 1, type, 0.85, 5);
                }
            }
        }

        return new Float32Array(meshData);
    }
}
