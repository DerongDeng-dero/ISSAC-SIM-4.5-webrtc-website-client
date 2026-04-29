# Windows 启动脚本

这个仓库现在带上了几类和 Isaac Sim 4.5 联动最常用的 Windows 脚本，方便你直接从客户端仓库根目录启动。

## 根目录脚本

### `isaac-sim.webrtc.web.bat`

构建并预览当前网页客户端。

等价于：

- `build.bat`
- `preview.bat`

### `isaac-sim.streaming.bat`

代理调用 Isaac Sim 安装目录里的原生 `isaac-sim.streaming.bat`。

这个脚本本身不重写 streaming 行为，只是让你可以从当前客户端仓库根目录直接转发启动。

### `isaac-sim.streaming.lan.bat`

这是最有用的局域网启动包装脚本。它会：

- 调用 `isaac-sim.streaming.stop.bat` 清理旧 streaming 进程
- 自动探测局域网 IPv4
- 固定 signaling port 为 `49100`
- 固定 media/public endpoint port 为 `47998`
- 把探测到的 IP 传给 Isaac Sim 的 `publicEndpointAddress`

你也可以手动指定：

```bat
set ISAACSIM_PUBLIC_IP=192.168.1.20
isaac-sim.streaming.lan.bat
```

### `isaac-sim.streaming.stop.bat`

停止旧的 `isaacsim.exp.full.streaming.kit` 进程，避免同机残留 streaming 实例导致浏览器一直拿不到有效 offer。

### `isaac-sim.webrtc.bridge.bat`

代理调用 Isaac Sim 安装目录里的 `isaac-sim.webrtc.bridge.bat`。

注意这个脚本只有在你的 Isaac Sim 安装里已经具备 bridge 入口时才有意义；当前客户端仓库本身不包含 Isaac Sim bridge 扩展实现。

## 根目录解析规则

这些脚本会按下面的顺序找到 Isaac Sim 安装目录：

1. 环境变量 `ISAAC_SIM_ROOT`
2. 自动识别“当前仓库位于 `ISAAC_SIM_ROOT\tools\webrtc-web-client`”的目录布局

如果你的仓库是独立 clone 到别的位置，启动前建议先设置：

```bat
set ISAAC_SIM_ROOT=D:\isaac-sim
```

## 内部脚本

- `scripts/windows/_resolve_isaac_sim_root.bat`: 解析 Isaac Sim 根目录
- `scripts/windows/detect_public_ipv4.ps1`: 选择最可能的局域网 IPv4

## 推荐用法

如果你的目标只是局域网网页接入，通常只需要：

1. `set ISAAC_SIM_ROOT=D:\isaac-sim`
2. `isaac-sim.streaming.lan.bat`
3. `isaac-sim.webrtc.web.bat`
