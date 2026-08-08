# Emscripten Build Script for Webcraft C++ Core Engine
Write-Host "Checking for Emscripten (emcc)..." -ForegroundColor Cyan

if (Get-Command emcc -ErrorAction SilentlyContinue) {
    Write-Host "emcc found! Building WebAssembly binary..." -ForegroundColor Green
    emcc cpp/noise.cpp cpp/world.cpp cpp/mesh_builder.cpp -O3 -s WASM=1 -s EXPORTED_FUNCTIONS="['_initWorld','_getBlockType','_setBlockType','_generateMeshBuffer','_getWorldSizeX','_getWorldSizeY','_getWorldSizeZ','_malloc','_free']" -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap','HEAPF32']" -o js/webcraft_wasm.js
    Write-Host "Build finished successfully! Output generated in js/webcraft_wasm.js and js/webcraft_wasm.wasm" -ForegroundColor Green
} else {
    Write-Host "Notice: emcc is not installed or not in PATH." -ForegroundColor Yellow
    Write-Host "Webcraft will seamlessly run using its built-in JavaScript high-performance voxel engine fallback." -ForegroundColor Yellow
}
