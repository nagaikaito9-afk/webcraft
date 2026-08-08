#include "world.h"
#include <cstdlib>

World::World(unsigned int seed) : noiseGen(seed) {
    blocks.resize(WORLD_SIZE_X * WORLD_SIZE_Y * WORLD_SIZE_Z, BLOCK_AIR);
}

uint8_t World::getBlock(int x, int y, int z) const {
    if (x < 0 || x >= WORLD_SIZE_X || y < 0 || y >= WORLD_SIZE_Y || z < 0 || z >= WORLD_SIZE_Z) {
        return BLOCK_AIR;
    }
    return blocks[(y * WORLD_SIZE_Z + z) * WORLD_SIZE_X + x];
}

void World::setBlock(int x, int y, int z, uint8_t type) {
    if (x >= 0 && x < WORLD_SIZE_X && y >= 0 && y < WORLD_SIZE_Y && z >= 0 && z < WORLD_SIZE_Z) {
        blocks[(y * WORLD_SIZE_Z + z) * WORLD_SIZE_X + x] = type;
    }
}

bool World::isOpaque(int x, int y, int z) const {
    uint8_t b = getBlock(x, y, z);
    if (b == BLOCK_AIR) return false;
    return !isTransparent(b);
}

bool World::isTransparent(uint8_t type) const {
    return (type == BLOCK_GLASS || type == BLOCK_OAK_LEAVES);
}

void World::generateTree(int cx, int cy, int cz) {
    int trunkHeight = 4 + (rand() % 2);
    for (int y = 0; y < trunkHeight; y++) {
        setBlock(cx, cy + y, cz, BLOCK_OAK_LOG);
    }

    int leafBase = cy + trunkHeight - 2;
    for (int ly = leafBase; ly <= cy + trunkHeight + 1; ly++) {
        int radius = (ly >= cy + trunkHeight) ? 1 : 2;
        for (int lx = cx - radius; lx <= cx + radius; lx++) {
            for (int lz = cz - radius; lz <= cz + radius; lz++) {
                if (getBlock(lx, ly, lz) == BLOCK_AIR) {
                    setBlock(lx, ly, lz, BLOCK_OAK_LEAVES);
                }
            }
        }
    }
}

void World::generateTerrain() {
    for (int x = 0; x < WORLD_SIZE_X; x++) {
        for (int z = 0; z < WORLD_SIZE_Z; z++) {
            double nx = (double)x / 45.0;
            double nz = (double)z / 45.0;
            
            // Biome noise: > 0.35 Desert, else Grass/Forest
            double biomeVal = noiseGen.octaveNoise(nx * 0.4, 0.2, nz * 0.4, 2, 0.5);
            bool isDesert = biomeVal > 0.25;

            double elevation = noiseGen.octaveNoise(nx, 0.5, nz, 4, 0.5);
            int surfaceY = 22 + (int)(elevation * 18);
            if (surfaceY >= WORLD_SIZE_Y - 2) surfaceY = WORLD_SIZE_Y - 3;
            if (surfaceY < 2) surfaceY = 2;

            for (int y = 0; y < WORLD_SIZE_Y; y++) {
                if (y > surfaceY) {
                    setBlock(x, y, z, BLOCK_AIR);
                } else if (y == surfaceY) {
                    setBlock(x, y, z, isDesert ? BLOCK_SAND : BLOCK_GRASS);
                } else if (y > surfaceY - 4) {
                    setBlock(x, y, z, isDesert ? BLOCK_SANDSTONE : BLOCK_DIRT);
                } else {
                    // Underground Ores Generation
                    double oreNoise1 = noiseGen.noise(x * 0.15, y * 0.15, z * 0.15);
                    double oreNoise2 = noiseGen.noise(x * 0.2, y * 0.2, z * 0.2);

                    if (y < 12 && oreNoise1 > 0.72) {
                        setBlock(x, y, z, BLOCK_DIAMOND_ORE);
                    } else if (y < 20 && oreNoise2 > 0.70) {
                        setBlock(x, y, z, BLOCK_GOLD_ORE);
                    } else if (y < 35 && oreNoise1 > 0.65) {
                        setBlock(x, y, z, BLOCK_IRON_ORE);
                    } else if (oreNoise2 > 0.60) {
                        setBlock(x, y, z, BLOCK_COAL_ORE);
                    } else {
                        setBlock(x, y, z, BLOCK_STONE);
                    }
                }
            }

            // Tree population on Grassland
            if (!isDesert && surfaceY > 20 && x > 4 && x < WORLD_SIZE_X - 4 && z > 4 && z < WORLD_SIZE_Z - 4) {
                double treeChance = noiseGen.noise(x * 0.8, 1.0, z * 0.8);
                if (treeChance > 0.78 && getBlock(x, surfaceY, z) == BLOCK_GRASS) {
                    generateTree(x, surfaceY + 1, z);
                }
            }
        }
    }
}

std::vector<float> World::buildMesh() {
    std::vector<float> meshData;
    meshData.reserve(WORLD_SIZE_X * WORLD_SIZE_Y * WORLD_SIZE_Z * 12);

    auto addFace = [&](float x, float y, float z,
                        float nx, float ny, float nz,
                        float u1, float v1, float u2, float v2,
                        uint8_t blockType, float light,
                        int faceIdx) {
        float p[4][3];
        switch (faceIdx) {
            case 0: // +Z
                p[0][0] = x;     p[0][1] = y;     p[0][2] = z + 1;
                p[1][0] = x + 1; p[1][1] = y;     p[1][2] = z + 1;
                p[2][0] = x + 1; p[2][1] = y + 1; p[2][2] = z + 1;
                p[3][0] = x;     p[3][1] = y + 1; p[3][2] = z + 1;
                break;
            case 1: // -Z
                p[0][0] = x + 1; p[0][1] = y;     p[0][2] = z;
                p[1][0] = x;     p[1][1] = y;     p[1][2] = z;
                p[2][0] = x;     p[2][1] = y + 1; p[2][2] = z;
                p[3][0] = x + 1; p[3][1] = y + 1; p[3][2] = z;
                break;
            case 2: // +Y
                p[0][0] = x;     p[0][1] = y + 1; p[0][2] = z + 1;
                p[1][0] = x + 1; p[1][1] = y + 1; p[1][2] = z + 1;
                p[2][0] = x + 1; p[2][1] = y + 1; p[2][2] = z;
                p[3][0] = x;     p[3][1] = y + 1; p[3][2] = z;
                break;
            case 3: // -Y
                p[0][0] = x;     p[0][1] = y;     p[0][2] = z;
                p[1][0] = x + 1; p[1][1] = y;     p[1][2] = z;
                p[2][0] = x + 1; p[2][1] = y;     p[2][2] = z + 1;
                p[3][0] = x;     p[3][1] = y;     p[3][2] = z + 1;
                break;
            case 4: // +X
                p[0][0] = x + 1; p[0][1] = y;     p[0][2] = z + 1;
                p[1][0] = x + 1; p[1][1] = y;     p[1][2] = z;
                p[2][0] = x + 1; p[2][1] = y + 1; p[2][2] = z;
                p[3][0] = x + 1; p[3][1] = y + 1; p[3][2] = z + 1;
                break;
            case 5: // -X
                p[0][0] = x;     p[0][1] = y;     p[0][2] = z;
                p[1][0] = x;     p[1][1] = y;     p[1][2] = z + 1;
                p[2][0] = x;     p[2][1] = y + 1; p[2][2] = z + 1;
                p[3][0] = x;     p[3][1] = y + 1; p[3][2] = z;
                break;
        }

        int indices[6] = { 0, 1, 2, 0, 2, 3 };
        float uvs[4][2] = { {u1, v2}, {u2, v2}, {u2, v1}, {u1, v1} };

        for (int i = 0; i < 6; i++) {
            int idx = indices[i];
            meshData.push_back(p[idx][0]);
            meshData.push_back(p[idx][1]);
            meshData.push_back(p[idx][2]);
            meshData.push_back(uvs[idx][0]);
            meshData.push_back(uvs[idx][1]);
            meshData.push_back(nx);
            meshData.push_back(ny);
            meshData.push_back(nz);
            meshData.push_back((float)blockType);
            meshData.push_back(light);
        }
    };

    auto shouldDrawFace = [&](int x, int y, int z, uint8_t curType) {
        uint8_t adj = getBlock(x, y, z);
        if (adj == BLOCK_AIR) return true;
        if (isTransparent(adj) && adj != curType) return true;
        return false;
    };

    for (int x = 0; x < WORLD_SIZE_X; x++) {
        for (int y = 0; y < WORLD_SIZE_Y; y++) {
            for (int z = 0; z < WORLD_SIZE_Z; z++) {
                uint8_t type = getBlock(x, y, z);
                if (type == BLOCK_AIR) continue;

                if (shouldDrawFace(x, y, z + 1, type)) addFace(x, y, z, 0, 0, 1, 0, 0, 1, 1, type, 0.7f, 0);
                if (shouldDrawFace(x, y, z - 1, type)) addFace(x, y, z, 0, 0, -1, 0, 0, 1, 1, type, 0.7f, 1);
                if (shouldDrawFace(x, y + 1, z, type)) addFace(x, y, z, 0, 1, 0, 0, 0, 1, 1, type, 1.0f, 2);
                if (shouldDrawFace(x, y - 1, z, type)) addFace(x, y, z, 0, -1, 0, 0, 0, 1, 1, type, 0.5f, 3);
                if (shouldDrawFace(x + 1, y, z, type)) addFace(x, y, z, 1, 0, 0, 0, 0, 1, 1, type, 0.85f, 4);
                if (shouldDrawFace(x - 1, y, z, type)) addFace(x, y, z, -1, 0, 0, 0, 0, 1, 1, type, 0.85f, 5);
            }
        }
    }

    return meshData;
}
