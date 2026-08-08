// Webcraft 2.0 Real-Time P2P WebRTC Multiplayer Manager (PeerJS)
class MultiplayerManager {
    constructor(worldBridge, onStatusChange) {
        this.world = worldBridge;
        this.onStatusChange = onStatusChange || (() => {});
        this.peer = null;
        this.connections = {}; // peerId -> DataConnection
        this.remotePlayers = {}; // peerId -> { pos: [x,y,z], yaw, pitch, heldItem }
        this.isHost = false;
        this.roomId = null;
        this.myPeerId = null;
    }

    init() {
        if (typeof Peer === 'undefined') {
            console.warn('[Webcraft MP] PeerJS library not loaded.');
            return;
        }

        // Random Peer ID for Webcraft
        const randomId = 'webcraft-' + Math.floor(1000 + Math.random() * 9000);
        this.peer = new Peer(randomId, {
            debug: 1
        });

        this.peer.on('open', (id) => {
            this.myPeerId = id;
            this.roomId = id;
            console.log('%c[Webcraft MP] PeerJS connected! ID: ' + id, 'color: #38bdf8; font-weight: bold;');
            this.onStatusChange('ready', id);
        });

        this.peer.on('connection', (conn) => {
            this.handleConnection(conn);
        });

        this.peer.on('error', (err) => {
            console.error('[Webcraft MP] Peer error:', err);
            this.onStatusChange('error', err.message);
        });
    }

    handleConnection(conn) {
        let peerId = conn.peer;
        this.connections[peerId] = conn;

        conn.on('open', () => {
            console.log('%c[Webcraft MP] Player joined: ' + peerId, 'color: #4ade80; font-weight: bold;');
            this.onStatusChange('connected', peerId);
        });

        conn.on('data', (data) => {
            this.handleData(peerId, data);
        });

        conn.on('close', () => {
            console.log('[Webcraft MP] Player left:', peerId);
            delete this.connections[peerId];
            delete this.remotePlayers[peerId];
            this.onStatusChange('disconnected', peerId);
        });
    }

    joinRoom(targetRoomId) {
        if (!this.peer || !targetRoomId) return;
        console.log('[Webcraft MP] Joining room: ' + targetRoomId);
        const conn = this.peer.connect(targetRoomId);
        this.handleConnection(conn);
    }

    handleData(peerId, data) {
        if (!data || !data.type) return;

        if (data.type === 'player_transform') {
            this.remotePlayers[peerId] = {
                pos: data.pos,
                yaw: data.yaw,
                pitch: data.pitch,
                heldItem: data.heldItem
            };
        } else if (data.type === 'block_update') {
            this.world.setBlock(data.x, data.y, data.z, data.blockType);
            if (this.onBlockUpdateCallback) {
                this.onBlockUpdateCallback(data.x, data.y, data.z, data.blockType);
            }
        }
    }

    sendTransform(pos, yaw, pitch, heldItem) {
        let payload = {
            type: 'player_transform',
            pos: pos,
            yaw: yaw,
            pitch: pitch,
            heldItem: heldItem
        };
        for (let id in this.connections) {
            if (this.connections[id] && this.connections[id].open) {
                this.connections[id].send(payload);
            }
        }
    }

    sendBlockUpdate(x, y, z, blockType) {
        let payload = {
            type: 'block_update',
            x: x, y: y, z: z, blockType: blockType
        };
        for (let id in this.connections) {
            if (this.connections[id] && this.connections[id].open) {
                this.connections[id].send(payload);
            }
        }
    }
}
