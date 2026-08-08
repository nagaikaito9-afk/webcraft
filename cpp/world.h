#ifndef WORLD_H
#ifndef WORLD_H
#define WORLD_H

#include <vector>
#include <cstdint>
#include "noise.h"

enum BlockType : uint8_t {
    BLOCK_AIR = 0,
    BLOCK_GRASS = 1,
    BLOCK_DIRT = 2,
    BLOCK_STONE = 3,
    BLOCK_COBBLESTONE = 4,
    BLOCK_OAK_LOG = 5,
    BLOCK_OAK_LEAVES = 6,
    BLOCK_OAK_PLANKS = 7,
    BLOCK_SAND = 8,
    BLOCK_SANDSTONE = 9,
    BLOCK_GLASS = 10,
    BLOCK_COAL_ORE = 11,
    BLOCK_IRON_ORE = 12,
    BLOCK_GOLD_ORE = 13,
    BLOCK_DIAMOND_ORE = 14,
    BLOCK_OBSIDIAN = 15,
    BLOCK_BRICKS = 16,
    BLOCK_BOOKSHELF = 17,
    BLOCK_MOSSY_COBBLE = 18,
    BLOCK_CRAFTING_TABLE = 19,
    BLOCK_CHEST = 20,
    BLOCK_TNT = 21,
    BLOCK_SPONGE = 22,
    BLOCK_WOOL_WHITE = 23,
    BLOCK_WOOL_RED = 24,
    BLOCK_WOOL_BLUE = 25,
    BLOCK_WOOL_GREEN = 26,
    BLOCK_WOOL_YELLOW = 27,
    BLOCK_WOOL_BLACK = 28
};

class World {
public:
    static const int WORLD_SIZE_X = 128;
    static const int WORLD_SIZE_Y = 64;
    static const int WORLD_SIZE_Z = 128;

private:
    std::vector<uint8_t> blocks;
    PerlinNoise noiseGen;

    void generateTree(int cx, int cy, int cz);

public:
    World(unsigned int seed = 12345);
    void generateTerrain();
    uint8_t getBlock(int x, int y, int z) const;
    void setBlock(int x, int y, int z, uint8_t type);
    bool isOpaque(int x, int y, int z) const;
    bool isTransparent(uint8_t type) const;
    
    // Returns mesh float data for WebGL buffer: [x,y,z, u,v, nx,ny,nz, blockType, light]
    std::vector<float> buildMesh();
};

#endif
