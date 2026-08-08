#include "world.h"
#include <cstdlib>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

static World* g_world = nullptr;
static std::vector<float> g_meshCache;

extern "C" {

EMSCRIPTEN_KEEPALIVE
void initWorld(unsigned int seed) {
    if (g_world) delete g_world;
    g_world = new World(seed);
    g_world->generateTerrain();
}

EMSCRIPTEN_KEEPALIVE
int getBlockType(int x, int y, int z) {
    if (!g_world) return 0;
    return g_world->getBlock(x, y, z);
}

EMSCRIPTEN_KEEPALIVE
void setBlockType(int x, int y, int z, int type) {
    if (g_world) {
        g_world->setBlock(x, y, z, (uint8_t)type);
    }
}

EMSCRIPTEN_KEEPALIVE
float* generateMeshBuffer(int* outSize) {
    if (!g_world) {
        *outSize = 0;
        return nullptr;
    }
    g_meshCache = g_world->buildMesh();
    *outSize = (int)g_meshCache.size();
    return g_meshCache.data();
}

EMSCRIPTEN_KEEPALIVE
int getWorldSizeX() { return World::WORLD_SIZE_X; }

EMSCRIPTEN_KEEPALIVE
int getWorldSizeY() { return World::WORLD_SIZE_Y; }

EMSCRIPTEN_KEEPALIVE
int getWorldSizeZ() { return World::WORLD_SIZE_Z; }

}
