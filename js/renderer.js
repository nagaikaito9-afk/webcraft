// High-Performance WebGL2 Shader & Voxel Mesh Renderer (Release 2.0.0 with Day/Night & Bugfixes)
class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2');
        if (!this.gl) {
            alert('WebGL 2.0 is required for Webcraft.');
            throw new Error('WebGL2 not supported');
        }

        this.skyColor = [0.55, 0.72, 0.98]; // Daytime sky
        this.initGLState();
        this.initShaders();
        this.initOverlayShaders();
        this.vertexCount = 0;
    }

    initGLState() {
        const gl = this.gl;
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(this.skyColor[0], this.skyColor[1], this.skyColor[2], 1.0);
    }

    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    initShaders() {
        const gl = this.gl;

        const vsSource = `#version 300 es
        in vec3 a_position;
        in vec2 a_uv;
        in vec3 a_normal;
        in float a_block_type;
        in float a_light;

        uniform mat4 u_viewProj;

        out vec2 v_uv;
        out vec3 v_normal;
        out float v_block_type;
        out float v_light;
        out vec3 v_fragPos;

        void main() {
            v_uv = a_uv;
            v_normal = a_normal;
            v_block_type = a_block_type;
            v_light = a_light;
            v_fragPos = a_position;
            gl_Position = u_viewProj * vec4(a_position, 1.0);
        }
        `;

        const fsSource = `#version 300 es
        precision mediump float;

        in vec2 v_uv;
        in vec3 v_normal;
        in float v_block_type;
        in float v_light;
        in vec3 v_fragPos;

        uniform sampler2D u_atlas;
        uniform vec3 u_cameraPos;
        uniform vec3 u_skyColor;

        out vec4 fragColor;

        void main() {
            int bType = int(v_block_type + 0.5);
            float slot = 0.0;

            if (bType == 1) { // Grass
                if (v_normal.y > 0.5) slot = 0.0;
                else if (v_normal.y < -0.5) slot = 2.0;
                else slot = 1.0;
            } else if (bType == 2)  slot = 2.0;
            else if (bType == 3)  slot = 3.0;
            else if (bType == 4)  slot = 4.0;
            else if (bType == 5) {
                if (v_normal.y > 0.5 || v_normal.y < -0.5) slot = 6.0;
                else slot = 5.0;
            }
            else if (bType == 6)  slot = 7.0;
            else if (bType == 7)  slot = 8.0;
            else if (bType == 8)  slot = 9.0;
            else if (bType == 9)  slot = 10.0;
            else if (bType == 10) slot = 11.0;
            else if (bType == 11) slot = 12.0;
            else if (bType == 12) slot = 13.0;
            else if (bType == 13) slot = 14.0;
            else if (bType == 14) slot = 15.0;
            else if (bType == 15) slot = 16.0;
            else if (bType == 16) slot = 17.0;
            else if (bType == 17) {
                if (v_normal.y > 0.5 || v_normal.y < -0.5) slot = 8.0;
                else slot = 18.0;
            }
            else if (bType == 18) slot = 19.0;
            else if (bType == 19) {
                if (v_normal.y > 0.5) slot = 20.0;
                else if (v_normal.z > 0.5) slot = 22.0;
                else slot = 21.0;
            }
            else if (bType == 20) {
                if (v_normal.y > 0.5 || v_normal.y < -0.5) slot = 23.0;
                else slot = 24.0;
            }
            else if (bType == 21) slot = 25.0;
            else if (bType == 22) slot = 26.0;
            else if (bType >= 23 && bType <= 28) slot = float(27 + (bType - 23));
            else if (bType == 29) slot = 33.0; // Water
            else if (bType == 30) slot = 34.0; // Lava

            float col = mod(slot, 16.0);
            float row = floor(slot / 16.0);
            vec2 atlasUV = vec2((col + v_uv.x) / 16.0, (row + v_uv.y) / 5.0);

            vec4 texColor = texture(u_atlas, atlasUV);
            if (texColor.a < 0.1) discard;

            // Semi-transparent Water
            if (bType == 29) {
                texColor.a = 0.65;
            }

            // Lava Emissive Light
            float lightMult = v_light;
            if (bType == 30) {
                lightMult = 1.3;
            }

            vec3 lightColor = texColor.rgb * lightMult;

            // Day/Night Distance Fog
            float dist = length(v_fragPos - u_cameraPos);
            float fogFactor = clamp((dist - 40.0) / (110.0 - 40.0), 0.0, 0.85);

            fragColor = vec4(mix(lightColor, u_skyColor, fogFactor), texColor.a);
        }
        `;

        const vs = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
        const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);
        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);

        this.attribs = {
            position: gl.getAttribLocation(this.program, 'a_position'),
            uv: gl.getAttribLocation(this.program, 'a_uv'),
            normal: gl.getAttribLocation(this.program, 'a_normal'),
            blockType: gl.getAttribLocation(this.program, 'a_block_type'),
            light: gl.getAttribLocation(this.program, 'a_light')
        };

        this.uniforms = {
            viewProj: gl.getUniformLocation(this.program, 'u_viewProj'),
            atlas: gl.getUniformLocation(this.program, 'u_atlas'),
            cameraPos: gl.getUniformLocation(this.program, 'u_cameraPos'),
            skyColor: gl.getUniformLocation(this.program, 'u_skyColor')
        };

        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
    }

    initOverlayShaders() {
        const gl = this.gl;
        const vsSource = `#version 300 es
        in vec3 a_position;
        in vec2 a_uv;
        uniform mat4 u_viewProj;
        out vec2 v_uv;
        void main() {
            v_uv = a_uv;
            gl_Position = u_viewProj * vec4(a_position, 1.0);
        }`;

        const fsSource = `#version 300 es
        precision mediump float;
        in vec2 v_uv;
        uniform sampler2D u_atlas;
        uniform float u_crackStage; // -1 for wireframe, 0..9 for crack
        out vec4 fragColor;
        void main() {
            if (u_crackStage < 0.0) {
                fragColor = vec4(0.0, 0.0, 0.0, 0.75); // Target Wireframe Box
            } else {
                float slot = 48.0 + u_crackStage;
                float col = mod(slot, 16.0);
                float row = floor(slot / 16.0);
                vec2 atlasUV = vec2((col + v_uv.x) / 16.0, (row + v_uv.y) / 5.0);
                vec4 texColor = texture(u_atlas, atlasUV);
                if (texColor.a < 0.1) discard;
                fragColor = vec4(texColor.rgb, texColor.a * 0.85);
            }
        }`;

        const vs = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
        const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);
        this.overlayProgram = gl.createProgram();
        gl.attachShader(this.overlayProgram, vs);
        gl.attachShader(this.overlayProgram, fs);
        gl.linkProgram(this.overlayProgram);

        this.overlayUniforms = {
            viewProj: gl.getUniformLocation(this.overlayProgram, 'u_viewProj'),
            atlas: gl.getUniformLocation(this.overlayProgram, 'u_atlas'),
            crackStage: gl.getUniformLocation(this.overlayProgram, 'u_crackStage')
        };

        this.wireframeVao = gl.createVertexArray();
        this.wireframeVbo = gl.createBuffer();

        const cubeLines = new Float32Array([
            0,0,0, 1,0,0,  1,0,0, 1,0,1,  1,0,1, 0,0,1,  0,0,1, 0,0,0,
            0,1,0, 1,1,0,  1,1,0, 1,1,1,  1,1,1, 0,1,1,  0,1,1, 0,1,0,
            0,0,0, 0,1,0,  1,0,0, 1,1,0,  1,0,1, 1,1,1,  0,0,1, 0,1,1
        ]);

        gl.bindVertexArray(this.wireframeVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.wireframeVbo);
        gl.bufferData(gl.ARRAY_BUFFER, cubeLines, gl.STATIC_DRAW);
        const posLoc = gl.getAttribLocation(this.overlayProgram, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);
    }

    loadTextureAtlas(atlasCanvas) {
        const gl = this.gl;
        this.atlasTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    updateMeshBuffer(floatData) {
        const gl = this.gl;
        this.vertexCount = floatData.length / 10;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, floatData, gl.DYNAMIC_DRAW);

        const stride = 10 * 4;
        gl.enableVertexAttribArray(this.attribs.position);
        gl.vertexAttribPointer(this.attribs.position, 3, gl.FLOAT, false, stride, 0);

        gl.enableVertexAttribArray(this.attribs.uv);
        gl.vertexAttribPointer(this.attribs.uv, 2, gl.FLOAT, false, stride, 3 * 4);

        gl.enableVertexAttribArray(this.attribs.normal);
        gl.vertexAttribPointer(this.attribs.normal, 3, gl.FLOAT, false, stride, 5 * 4);

        gl.enableVertexAttribArray(this.attribs.blockType);
        gl.vertexAttribPointer(this.attribs.blockType, 1, gl.FLOAT, false, stride, 8 * 4);

        gl.enableVertexAttribArray(this.attribs.light);
        gl.vertexAttribPointer(this.attribs.light, 1, gl.FLOAT, false, stride, 9 * 4);

        gl.bindVertexArray(null);
    }

    setSkyColor(r, g, b) {
        this.skyColor = [r, g, b];
        if (this.gl) {
            this.gl.clearColor(r, g, b, 1.0);
        }
    }

    render(camera, targetBlock = null, miningProgress = 0.0) {
        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (this.vertexCount === 0) return;

        let view = camera.getViewMatrix();
        let proj = camera.getProjectionMatrix();
        let viewProj = Mat4.multiply(proj, view);

        // Draw World Mesh
        gl.useProgram(this.program);
        gl.uniformMatrix4fv(this.uniforms.viewProj, false, viewProj);
        gl.uniform3fv(this.uniforms.cameraPos, camera.position);
        gl.uniform3fv(this.uniforms.skyColor, this.skyColor);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
        gl.uniform1i(this.uniforms.atlas, 0);

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);

        // Draw Target Box Wireframe & Crack Overlay
        if (targetBlock) {
            gl.useProgram(this.overlayProgram);

            let model = Mat4.identity();
            model[12] = targetBlock[0] - 0.002;
            model[13] = targetBlock[1] - 0.002;
            model[14] = targetBlock[2] - 0.002;
            model[0] = 1.004; model[5] = 1.004; model[10] = 1.004;

            let wireframeViewProj = Mat4.multiply(viewProj, model);
            gl.uniformMatrix4fv(this.overlayUniforms.viewProj, false, wireframeViewProj);

            // Line wireframe
            gl.uniform1f(this.overlayUniforms.crackStage, -1.0);
            gl.bindVertexArray(this.wireframeVao);
            gl.lineWidth(2.5);
            gl.drawArrays(gl.LINES, 0, 24);

            // Progressive Destruction Cracks Overlay
            if (miningProgress > 0.0) {
                let stage = Math.min(9, Math.floor(miningProgress * 10.0));
                gl.uniform1f(this.overlayUniforms.crackStage, Number(stage)); // Fixed ReferenceError: float is not defined
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
                gl.uniform1i(this.overlayUniforms.atlas, 0);
            }
        }

        gl.bindVertexArray(null);
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
}
