# Webcraft (Cave Game Phase)

Minecraftの初期プロトタイプ「Cave Game」を現代のWeb技術（C++, WebAssembly, WebGL 2.0, Modern CSS3, HTML5）で再構築したオープンソースWebボクセルゲームエンジンです。

---

## 🎮 特長 (Features)

- **C++ WebAssembly & JS ハイブリッドエンジン**:
  - `cpp/` ディレクトリ内の C++ コードでパーリンノイズ地形生成、ブロック管理、隣接面削除（Face Culling）を実施。
  - Emscripten環境がない場合でも完全に同等かつ60fpsで動作するJSフォールバックエンジンを標準内蔵。
- **レトロ＆モダンなグラフィック**:
  - ドット絵テクスチャ（草、土、石、丸石、木板、レンガ）をHTML Canvasで自動生成。
  - WebGL 2.0 による高速レンダリング、Cave Game特有のレトロ距離フォグ、ライティング、対象ブロック選択枠表示。
- **物理・操作系**:
  - Pointer Lock API による快適な1人称（FPS）操作。
  - 軸平行境界ボックス (AABB) 衝突検出、重力、ジャンプ、3D DDAレイキャスティングによるブロック破壊・設置。

---

## 🕹️ 操作方法 (Controls)

| 操作 | キー / マウス |
|---|---|
| 移動 | `W`, `A`, `S`, `D` |
| ジャンプ | `Space` |
| スニーク | `Shift` |
| ブロック破壊 | 左クリック |
| ブロック設置 | 右クリック |
| ブロック切り替え | `1` 〜 `6` キー / マウスホイール |
| デバッグHUD切替 | `F3` |
| マウス解放 | `Esc` |

---

## 🛠️ C++ビルド手順 (C++ WebAssembly Build)

Emscripten (`emcc`) がインストールされている環境では、プロジェクト直下の `build.ps1` を実行することで C++ コードを `.wasm` および `.js` バインディングにコンパイルできます。

```powershell
./build.ps1
```
