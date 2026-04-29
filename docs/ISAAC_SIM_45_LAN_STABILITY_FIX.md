# Isaac Sim 4.5 LAN Stability Fix Guide

本文档专门处理一类典型问题：

- 页面能打开
- 点击 `Connect` 后状态一直停在 `Connecting` 或连续 `update`
- 本机有时能出画面，其他电脑黑屏
- 换一个网络后表现发生明显变化

这类问题多数不是页面层问题，而是 WebRTC 媒体路径、候选地址、端口策略或旧进程残留的问题。

相关文档：

- [Native WebRTC LAN Guide](./ISAAC_SIM_45_NATIVE_WEBRTC_LAN_GUIDE.md)
- [Diagnostics](./diagnostics.md)

---

## 1. 先把症状拆开

### 1.1 页面能打开

这说明前端静态页面或 Vite 预览服务本身可访问。

### 1.2 点击 `Connect` 后进入 `Connecting`

这通常说明页面已经开始尝试建立 signaling。

### 1.3 本机偶尔成功，其他机器更容易失败

这通常说明问题集中在媒体路径，而不是 UI 或基础 HTTP 页面。

### 1.4 切到其他 Wi-Fi / 热点后表现变化

这通常说明活跃网卡、IPv4 地址、candidate 生成或路由顺序发生了变化。

---

## 2. 本环境里确认过的关键事实

### 2.1 `49100` 是 signaling 端口，不是网页端口

`49100` 对应 Isaac Sim WebRTC signaling。

因此：

- 页面访问地址应为 `http://<web-host>:3000`
- WebRTC signaling 由页面内部逻辑连接 `49100`

直接访问 `http://127.0.0.1:49100` 返回 `501` 是正常现象，不说明 streaming 坏掉。

### 2.2 候选地址和媒体端口可能导致“能连但不出画面”

排查中实际出现过这样的问题：

- signaling 已经建立
- 但服务端对外给出的媒体 candidate 不适合当前网络路径
- 本机偶尔依赖回环或本地路由成功
- 远端机器反而更容易黑屏

这就是为什么“页面能开”和“视频能出”必须分开判断。

### 2.3 网络切换后如果不重启 streaming，状态会更乱

当主机在 Wi-Fi、热点或不同网段之间切换时：

- 当前对外 IPv4 可能变化
- 活跃网卡可能变化
- 旧 streaming 进程里缓存的网络状态可能已经失效

如果服务端不重启，浏览器看到的行为往往会非常随机。

### 2.4 旧 streaming 进程残留会导致“拿不到有效 offer”

如果同一台机器上同时残留多个 streaming 实例，常见现象是：

- signaling 看起来成功
- 但页面迟迟收不到有效 offer
- 或收到的协商状态不一致

这正是当前仓库保留 `isaac-sim.streaming.stop.bat` 的原因。

---

## 3. 当前仓库采用的修复策略

推荐统一使用：

```bat
set ISAAC_SIM_ROOT=D:\isaac-sim
isaac-sim.streaming.lan.bat
```

这个脚本会：

- 启动前清理旧 streaming 进程
- 自动探测较可能用于局域网访问的 IPv4
- 固定 signaling port 为 `49100`
- 固定 media/public endpoint port 为 `47998`
- 将探测到的 IP 传给 `publicEndpointAddress`

如果自动探测 IP 不符合预期，可以手动指定：

```bat
set ISAAC_SIM_ROOT=D:\isaac-sim
set ISAACSIM_PUBLIC_IP=192.168.1.20
isaac-sim.streaming.lan.bat
```

---

## 4. 推荐排障顺序

### 4.1 先确认页面访问正常

验证：

- `http://127.0.0.1:3000`
- `http://<host-ip>:3000`

### 4.2 再确认使用的是正确的 Isaac Sim 主机 IP

不要默认使用：

- `127.0.0.1`
- 虚拟网卡地址
- 旧网络留下的地址

页面里的 `Server IP` 应该与当前用于局域网访问的主机 IPv4 一致。

### 4.3 确认旧 streaming 已经清理

执行：

```bat
isaac-sim.streaming.stop.bat
```

然后重新启动：

```bat
isaac-sim.streaming.lan.bat
```

### 4.4 观察页面日志

重点看：

- 是否收到 `offer`
- 是否有 `pc:addRemoteCandidate`
- `pc:iceConnection` 是否进入 `connected` / `completed`
- `pc:stats` 是否有已选 candidate pair

### 4.5 如果日志卡在 signaling 成功但没有媒体

优先排查：

- Windows 防火墙
- UDP 媒体端口
- 活跃网卡是否正确
- `publicEndpointAddress` 是否错误

---

## 5. 当前页面里最有用的几个错误信号

### 5.1 `0xC0F22219`

含义：

- signaling 成功
- 但浏览器没有收到有效 offer

优先怀疑：

- 旧 streaming 进程残留
- 端口路径混乱
- 服务端状态未重启干净

### 5.2 `0xC0F22226`

含义：

- signaling 成功
- 但浏览器没有收到 STUN 响应

优先怀疑：

- 媒体路径 UDP 被阻断
- 错误的对外 candidate 地址
- 防火墙或网络策略拦截

### 5.3 `pc:iceConnection checking` 长时间不推进

这通常说明：

- candidate 收到了
- 但没有找到可用的媒体路径

---

## 6. 最稳定的实际操作方式

推荐每次切换网络后都重新执行以下顺序：

1. 停止旧 streaming
2. 重新启动 `isaac-sim.streaming.lan.bat`
3. 重新打开网页
4. 清空或更新页面中的主机 IP
5. 再次连接

这一步不能省，尤其是在：

- Wi-Fi 和热点之间切换
- 从单机测试转到局域网测试
- 主机获得了新的 DHCP 地址

---

## 7. 判断问题到底在页面层还是媒体层

可以用下面的判断方式快速分层：

### 页面层问题

常见表现：

- 页面根本打不开
- 页面资源 404
- 前端脚本报错导致按钮不可用

### signaling 层问题

常见表现：

- 点击 `Connect` 后很快报连接失败
- 页面没有任何远端协商事件

### 媒体层问题

常见表现：

- 页面能打开
- signaling 看起来已经成功
- 仍然没有画面
- 日志停在 candidate / ICE 相关阶段

局域网黑屏问题，大多数都落在第三类。

---

## 8. 最终建议

处理 Isaac Sim 4.5 LAN 稳定性问题时，优先把注意力放在下面四件事上：

1. 单实例运行，避免旧 streaming 残留
2. 固定媒体端口策略
3. 显式选择正确的局域网 IPv4
4. 每次网络切换后重启 streaming

这四件事落实后，局域网可用性会明显稳定下来。
