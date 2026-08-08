#ifndef NOISE_H
#ifndef NOISE_H
#define NOISE_H

#include <vector>

class PerlinNoise {
private:
    std::vector<int> p;
    double fade(double t);
    double lerp(double t, double a, double b);
    double grad(int hash, double x, double y, double z);

public:
    PerlinNoise(unsigned int seed = 1337);
    double noise(double x, double y, double z);
    double octaveNoise(double x, double y, double z, int octaves, double persistence);
};

#endif
