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
    BLOCK_PLANKS = 5,
    BLOCK_BRICKS = 6
};

struct Vertex {
    float x, y, z;
    float u, v;
    float nx, ny, nz;
    float block_type;
    float face_lighting; // AO & directional light multiplier
};

class World {
public:
    static const int WORLD_SIZE_X = 64;
    static const int WORLD_SIZE_Y = 64;
    static const int WORLD_SIZE_Z = 64;

private:
    std::vector<uint8_t> blocks;
    PerlinNoise noiseGen;

public:
    World(unsigned int seed = 12345);
    void generateTerrain();
    uint8_t getBlock(int x, int y, int z) const;
    void setBlock(int x, int y, int z, uint8_t type);
    bool isOpaque(int x, int y, int z) const;
    
    // Returns mesh float data for WebGL buffer: [x,y,z, u,v, nx,ny,nz, blockType, light]
    std::vector<float> buildMesh();
};

#endif
