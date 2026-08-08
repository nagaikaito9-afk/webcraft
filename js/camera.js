// First Person Camera with Mouse Lock and Matrix Math
class Camera {
    constructor() {
        this.position = [64.0, 38.0, 64.0];
        this.yaw = -90.0;   // Degrees
        this.pitch = 0.0;   // Degrees
        
        this.front = [0, 0, -1];
        this.up = [0, 1, 0];
        this.right = [1, 0, 0];
        this.worldUp = [0, 1, 0];

        this.mouseSensitivity = 0.12;
        this.fov = 70.0 * Math.PI / 180.0;
        this.aspect = window.innerWidth / window.innerHeight;
        this.near = 0.1;
        this.far = 1000.0;

        this.updateCameraVectors();
    }

    handleMouseMove(deltaX, deltaY) {
        this.yaw += deltaX * this.mouseSensitivity;
        this.pitch -= deltaY * this.mouseSensitivity;

        if (this.pitch > 89.0) this.pitch = 89.0;
        if (this.pitch < -89.0) this.pitch = -89.0;

        this.updateCameraVectors();
    }

    updateCameraVectors() {
        let yawRad = this.yaw * Math.PI / 180.0;
        let pitchRad = this.pitch * Math.PI / 180.0;

        let fx = Math.cos(yawRad) * Math.cos(pitchRad);
        let fy = Math.sin(pitchRad);
        let fz = Math.sin(yawRad) * Math.cos(pitchRad);

        // Normalize front
        let len = Math.sqrt(fx * fx + fy * fy + fz * fz);
        this.front = [fx / len, fy / len, fz / len];

        // Right = normalize(cross(front, worldUp))
        let rx = this.front[1] * this.worldUp[2] - this.front[2] * this.worldUp[1];
        let ry = this.front[2] * this.worldUp[0] - this.front[0] * this.worldUp[2];
        let rz = this.front[0] * this.worldUp[1] - this.front[1] * this.worldUp[0];
        let rlen = Math.sqrt(rx * rx + ry * ry + rz * rz);
        this.right = [rx / rlen, ry / rlen, rz / rlen];

        // Up = normalize(cross(right, front))
        let ux = this.right[1] * this.front[2] - this.right[2] * this.front[1];
        let uy = this.right[2] * this.front[0] - this.right[0] * this.front[2];
        let uz = this.right[0] * this.front[1] - this.right[1] * this.front[0];
        this.up = [ux, uy, uz];
    }

    getViewMatrix() {
        let eye = this.position;
        let target = [
            eye[0] + this.front[0],
            eye[1] + this.front[1],
            eye[2] + this.front[2]
        ];
        return Mat4.lookAt(eye, target, this.up);
    }

    getProjectionMatrix() {
        return Mat4.perspective(this.fov, this.aspect, this.near, this.far);
    }
}

// Minimal 4x4 Matrix Utilities for WebGL
const Mat4 = {
    identity() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    },

    perspective(fov, aspect, near, far) {
        let f = 1.0 / Math.tan(fov / 2);
        let nf = 1.0 / (near - far);
        let out = new Float32Array(16);
        out[0] = f / aspect;
        out[5] = f;
        out[10] = (far + near) * nf;
        out[11] = -1.0;
        out[14] = (2.0 * far * near) * nf;
        return out;
    },

    lookAt(eye, target, up) {
        let z0 = eye[0] - target[0];
        let z1 = eye[1] - target[1];
        let z2 = eye[2] - target[2];
        let len = 1.0 / Math.hypot(z0, z1, z2);
        z0 *= len; z1 *= len; z2 *= len;

        let x0 = up[1] * z2 - up[2] * z1;
        let x1 = up[2] * z0 - up[0] * z2;
        let x2 = up[0] * z1 - up[1] * z0;
        len = Math.hypot(x0, x1, x2);
        if (!len) {
            x0 = 0; x1 = 0; x2 = 0;
        } else {
            len = 1.0 / len;
            x0 *= len; x1 *= len; x2 *= len;
        }

        let y0 = z1 * x2 - z2 * x1;
        let y1 = z2 * x0 - z0 * x2;
        let y2 = z0 * x1 - z1 * x0;
        len = Math.hypot(y0, y1, y2);
        if (!len) {
            y0 = 0; y1 = 0; y2 = 0;
        } else {
            len = 1.0 / len;
            y0 *= len; y1 *= len; y2 *= len;
        }

        let out = new Float32Array(16);
        out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
        out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
        out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
        out[12] = -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]);
        out[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]);
        out[14] = -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]);
        out[15] = 1;
        return out;
    },

    multiply(a, b) {
        let out = new Float32Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                out[j * 4 + i] =
                    a[i] * b[j * 4] +
                    a[i + 4] * b[j * 4 + 1] +
                    a[i + 8] * b[j * 4 + 2] +
                    a[i + 12] * b[j * 4 + 3];
            }
        }
        return out;
    }
};
