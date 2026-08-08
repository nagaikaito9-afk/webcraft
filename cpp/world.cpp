#include "world.h"

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
    return b != BLOCK_AIR;
}

void World::generateTerrain() {
    for (int x = 0; x < WORLD_SIZE_X; x++) {
        for (int z = 0; z < WORLD_SIZE_Z; z++) {
            // 2D Perlin noise for surface height
            double nx = (double)x / 32.0;
            double nz = (double)z / 32.0;
            double elevation = noiseGen.octaveNoise(nx, 0.5, nz, 4, 0.5);
            
            int surfaceY = 24 + (int)(elevation * 16);
            if (surfaceY >= WORLD_SIZE_Y) surfaceY = WORLD_SIZE_Y - 1;
            if (surfaceY < 1) surfaceY = 1;

            for (int y = 0; y < WORLD_SIZE_Y; y++) {
                if (y > surfaceY) {
                    setBlock(x, y, z, BLOCK_AIR);
                } else if (y == surfaceY) {
                    setBlock(x, y, z, BLOCK_GRASS);
                } else if (y > surfaceY - 4) {
                    setBlock(x, y, z, BLOCK_DIRT);
                } else {
                    setBlock(x, y, z, BLOCK_STONE);
                }
            }
        }
    }
}

std::vector<float> World::buildMesh() {
    std::vector<float> meshData;
    meshData.reserve(WORLD_SIZE_X * WORLD_SIZE_Y * WORLD_SIZE_Z * 36 * 10);

    // Dynamic vertex generator helper
    auto addFace = [&](float x, float y, float z,
                        float nx, float ny, float nz,
                        float u1, float v1, float u2, float v2,
                        uint8_t blockType, float light,
                        int faceIdx) {
        // Define quad vertices depending on faceIdx (0:+Z, 1:-Z, 2:+Y, 3:-Y, 4:+X, 5:-X)
        float p[4][3];
        switch (faceIdx) {
            case 0: // +Z Front
                p[0][0] = x;     p[0][1] = y;     p[0][2] = z + 1;
                p[1][0] = x + 1; p[1][1] = y;     p[1][2] = z + 1;
                p[2][0] = x + 1; p[2][1] = y + 1; p[2][2] = z + 1;
                p[3][0] = x;     p[3][1] = y + 1; p[3][2] = z + 1;
                break;
            case 1: // -Z Back
                p[0][0] = x + 1; p[0][1] = y;     p[0][2] = z;
                p[1][0] = x;     p[1][1] = y;     p[1][2] = z;
                p[2][0] = x;     p[2][1] = y + 1; p[2][2] = z;
                p[3][0] = x + 1; p[3][1] = y + 1; p[3][2] = z;
                break;
            case 2: // +Y Top
                p[0][0] = x;     p[0][1] = y + 1; p[0][2] = z + 1;
                p[1][0] = x + 1; p[1][1] = y + 1; p[1][2] = z + 1;
                p[2][0] = x + 1; p[2][1] = y + 1; p[2][2] = z;
                p[3][0] = x;     p[3][1] = y + 1; p[3][2] = z;
                break;
            case 3: // -Y Bottom
                p[0][0] = x;     p[0][1] = y;     p[0][2] = z;
                p[1][0] = x + 1; p[1][1] = y;     p[1][2] = z;
                p[2][0] = x + 1; p[2][1] = y;     p[2][2] = z + 1;
                p[3][0] = x;     p[3][1] = y;     p[3][2] = z + 1;
                break;
            case 4: // +X Right
                p[0][0] = x + 1; p[0][1] = y;     p[0][2] = z + 1;
                p[1][0] = x + 1; p[1][1] = y;     p[1][2] = z;
                p[2][0] = x + 1; p[2][1] = y + 1; p[2][2] = z;
                p[3][0] = x + 1; p[3][1] = y + 1; p[3][2] = z + 1;
                break;
            case 5: // -X Left
                p[0][0] = x;     p[0][1] = y;     p[0][2] = z;
                p[1][0] = x;     p[1][1] = y;     p[1][2] = z + 1;
                p[2][0] = x;     p[2][1] = y + 1; p[2][2] = z + 1;
                p[3][0] = x;     p[3][1] = y + 1; p[3][2] = z;
                break;
        }

        // Two triangles for quad (0,1,2 and 0,2,3)
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

    for (int x = 0; x < WORLD_SIZE_X; x++) {
        for (int y = 0; y < WORLD_SIZE_Y; y++) {
            for (int z = 0; z < WORLD_SIZE_Z; z++) {
                uint8_t type = getBlock(x, y, z);
                if (type == BLOCK_AIR) continue;

                // Check 6 adjacent blocks for face culling
                // +Z Front
                if (!isOpaque(x, y, z + 1)) {
                    addFace(x, y, z, 0, 0, 1, 0, 0, 1, 1, type, 0.7f, 0);
                }
                // -Z Back
                if (!isOpaque(x, y, z - 1)) {
                    addFace(x, y, z, 0, 0, -1, 0, 0, 1, 1, type, 0.7f, 1);
                }
                // +Y Top
                if (!isOpaque(x, y + 1, z)) {
                    addFace(x, y, z, 0, 1, 0, 0, 0, 1, 1, type, 1.0f, 2);
                }
                // -Y Bottom
                if (!isOpaque(x, y - 1, z)) {
                    addFace(x, y, z, 0, -1, 0, 0, 0, 1, 1, type, 0.5f, 3);
                }
                // +X Right
                if (!isOpaque(x + 1, y, z)) {
                    addFace(x, y, z, 1, 0, 0, 0, 0, 1, 1, type, 0.85f, 4);
                }
                // -X Left
                if (!isOpaque(x - 1, y, z)) {
                    addFace(x, y, z, -1, 0, 0, 0, 0, 1, 1, type, 0.85f, 5);
                }
            }
        }
    }

    return meshData;
}
