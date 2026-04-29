# Isaac Sim 4.5 WebRTC Website Client

这是从当前 Isaac Sim 工作目录中整理出来的独立浏览器客户端项目。

它保留 Isaac Sim 4.5 原生 WebRTC 视频链路，并继续使用 NVIDIA 官方浏览器 SDK：

- `@nvidia/omniverse-webrtc-streaming-library`

这个仓库的定位不是“纯手写 WebRTC 协议客户端”，而是：

- 保留 Isaac Sim 4.5 原生 streaming 服务端
- 用自己的网页外壳承载视频流
- 提供连接参数面板、事件日志和桥接消息调试入口

## 目录

- `src/`: React + TypeScript 客户端源码
- `docs/server-setup.md`: Isaac Sim 4.5 服务端接入说明
- `docs/diagnostics.md`: 浏览器侧 WebRTC 诊断说明
- `docs/bridge-messages.md`: `isaacsim.webrtc.bridge` 消息桥说明
- `docs/windows-scripts.md`: 随仓库附带的 Windows 启动脚本说明
- `docs/ISAAC_SIM_45_NATIVE_WEBRTC_LAN_GUIDE.md`: 原生 WebRTC 局域网接入总指南
- `docs/ISAAC_SIM_45_OFFICIAL_BROWSER_SDK_BEGINNER_GUIDE.md`: 官方浏览器 SDK 路线说明
- `docs/ISAAC_SIM_45_LAN_STABILITY_FIX.md`: 局域网稳定性修复说明
- `install.bat` / `build.bat` / `dev.bat` / `preview.bat`: Windows 启动脚本
- `isaac-sim.*.bat`: 和 Isaac Sim 服务端联动的快捷脚本

## 环境要求

- Node.js 18+
- 或通过 `ISAAC_WEBRTC_NODE_DIR` 指向一个可用的 portable Node 目录
- 可访问 `@nvidia/omniverse-webrtc-streaming-library` 对应的 NVIDIA npm registry
- Isaac Sim 4.5 原生 WebRTC 服务端

仓库里的 `.npmrc` 已经保留了 public npm 和 NVIDIA registry 配置。

## 快速开始

1. 安装依赖

   ```bat
   install.bat
   ```

2. 本地开发

   ```bat
   dev.bat
   ```

3. 生产构建

   ```bat
   build.bat
   ```

4. 预览构建结果

   ```bat
   preview.bat
   ```

默认通过 `http://127.0.0.1:3000` 或 `http://<your-host-ip>:3000` 访问。

## 常用 Windows 快捷脚本

仓库根目录现在额外带上了这几类脚本：

- `isaac-sim.streaming.bat`
- `isaac-sim.streaming.lan.bat`
- `isaac-sim.streaming.stop.bat`
- `isaac-sim.webrtc.bridge.bat`
- `isaac-sim.webrtc.web.bat`

如果仓库不是直接放在 `Isaac Sim/tools/webrtc-web-client` 下，先设置：

```bat
set ISAAC_SIM_ROOT=D:\isaac-sim
```

再使用这些脚本。

## 默认连接参数

默认配置定义在 `src/defaultConfig.ts`：

- `server`: 取当前页面 hostname
- `signalingPort`: `49100`
- `mediaPort`: `47998`
- `width`: `1920`
- `height`: `1080`
- `fps`: `60`

如果 Isaac Sim 服务端使用了不同端口，直接在页面里改，或者修改 `src/defaultConfig.ts`。

## 当前功能

- Isaac Sim 4.5 native WebRTC 直连
- 连接/断开控制
- 低层 `RTCPeerConnection` 事件日志
- SDK 错误码提示
- 自定义 JSON 消息发送面板
- 面向 `isaacsim.webrtc.bridge` 的 RPC 调试入口

## 说明

- 该项目主要面向局域网接入，公网稳定支持不在 Isaac Sim 4.5 的推荐范围内。
- 如果只需要视频流，服务端只开启 native WebRTC 即可。
- 如果要使用页面里的 `Custom Message`，服务端还需要启用 `isaacsim.webrtc.bridge` 扩展。

具体接入方式见：

- [服务端接入](docs/server-setup.md)
- [诊断说明](docs/diagnostics.md)
- [桥接消息](docs/bridge-messages.md)
- [Windows 脚本](docs/windows-scripts.md)
- [Native WebRTC LAN Guide](docs/ISAAC_SIM_45_NATIVE_WEBRTC_LAN_GUIDE.md)
- [Official Browser SDK Guide](docs/ISAAC_SIM_45_OFFICIAL_BROWSER_SDK_BEGINNER_GUIDE.md)
- [LAN Stability Fix Guide](docs/ISAAC_SIM_45_LAN_STABILITY_FIX.md)
