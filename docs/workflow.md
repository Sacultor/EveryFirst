阶段 A — 修复并准备合约（必做）
目标：确保 Solidity 合约可编译、合约接口符合设计（MINTER/onlyOwner/懒铸可选）。

主要文件

smart_contract/contracts/EveryFirstNote.sol（或把现有 everyfirst.sol 改名/替换）
smart_contract/hardhat.config.js
smart_contract/scripts/deploy.js
smart_contract/test/EveryFirstNote.test.js
步骤

在 smart_contract/ 初始化（若未初始化）：
在该目录运行：
修复合约常见问题（基于之前检查）：
使用 ERC721URIStorage 或显式声明 _tokenURIs 映射。
不在 Ownable 构造中传参（删除 Ownable(msg.sender)）。
为铸造添加权限（onlyOwner 或 AccessControl MINTER_ROLE）。
把 tokenId 从 1 开始（先 increment 再 current）。
编写部署脚本 scripts/deploy.js（读取 .env RPC 和私钥）。
添加基本单元测试（用 Hardhat + Chai）覆盖：
只有授权者能 mint
mint 后 tokenURI 可读，metadataDigest 可读
事件 NoteMinted 发出
本地编译与测试：
验收

npx hardhat test 全部通过，ABI 文件可用（artifacts/contracts/...）。
阶段 B — 后端最小实现（必做）
目标：实现 image upload、metadata pin、notes 草稿接口，使前端能拿到 tokenURI 与 digest。

文件/路径建议

server/package.json
server/src/index.ts
server/src/routes/upload.ts
server/src/routes/notes.ts
server/.env（WEB3_STORAGE_TOKEN / DATABASE_URL / JWT_SECRET）
步骤

新建 server/，初始化并安装依赖：
实现 /api/upload/image（使用 multer），上传后调用 web3.storage 或 Pinata，并返回 { cid, ipfsUri, gatewayUrl }。
实现 /api/notes（保存草稿到 sqlite 简单表）和 /api/notes/:id/pin（读取草稿、生成 metadata JSON、pin、计算 keccak256 digest，返回 { tokenURI, digest }）。
加入基本 auth（SIWE 或签名 + 简单 JWT）。在 MVP 可先用简单签名验证 owner 字段。
启动后端：
验收

能通过 Postman 或 curl 上传图片并拿到 ipfs://<cid>，能 pin 元数据并返回 digest。
阶段 C — 前端合约封装与 UI 集成（必做）
目标：前端发起上传、pin、并调用合约 mintWithURI（用户付 gas）。实现事件监听并更新本地 DB。

路径/文件

front/src/services/contract.tsx（或 .ts）
front/src/stores/noteStore.tsx（扩展）
front/src/components/NoteEditorModal.tsx（已存在，可集成）
env: front/.env 中设置 VITE_CONTRACT_ADDRESS、VITE_BACKEND_URL
步骤

安装前端依赖（在 front/）：
在 front/src/services/contract.tsx 实现：
连接 provider / signer
导出 mintWithURI(signer, to, tokenURI, digest, date)：调用 contract.connect(signer).mintWithURI(...) 并返回 tx 对象
onNoteMinted(callback)：contract.on('NoteMinted', ...)
在编辑器流程中加入：
上传图片 -> 保存草稿 -> POST /api/notes/:id/pin -> 得到 { tokenURI, digest } -> 打开确认 dialog 显示 Gas 估算 -> 调用 mintWithURI -> 等待确认 -> 使用事件或 RPC 更新本地草稿为已铸造。
处理链与网络：
在发起交易前校验 signer 的 chainId 与合约部署链一致，必要时引导用户切换网络（MetaMask）。
本地运行前端：
验收

前端能完成“上传→pin→mint”全流程，交易在 Etherscan（测试网）可见，metadata 可通过 ipfs:// 打开。
阶段 D — 懒铸（可选 / 推荐）
目标：实现 EIP‑712 voucher 签名 + 合约 redeem，使后端签名，用户付 gas。

步骤简述

合约：添加 redeem 功能，验证 EIP‑712 签名、nonce、deadline，并 mint。
后端：生成 voucher（包含 tokenURI, digest, to, date, nonce, deadline），签名后返回给前端。
前端：调用 contract.redeem(voucher, signature)。
验收

通过 voucher 能完成铸造；过期或已用 nonce 被拒。
阶段 E — 测试、CI、部署
编写更多单元测试覆盖边界（非 MINTER、重复 digest、不合法 metadata）。
配置 GitHub Actions（可选）在 PR 时跑 npx hardhat test 与前端 lint/build。
上线：
Hardhat 部署脚本运行到测试网（Sepolia/Base Sepolia）：
后端部署到你选的主机（Render/Heroku/VPS），设置 env 变量。
前端构建并部署（Vercel/Netlify/Static host）。
关键边界与安全检查（务必完成）
铸造权限（onlyOwner / MINTER_ROLE）或懒铸签名防重放（nonce+deadline）。
后端私钥不可用于代铸，若代铸存在，使用安全密钥管理。
file size/type 验证、Pin 超时和重试策略。
前端在发起交易前校验 chainId、account。
metadata JSON 显示敏感信息需审查（隐私提醒）。
推荐开发顺序（优先级）
合约修复与单元测试（阶段 A） — 必做。
后端最小实现（阶段 B）— 使前端可拿到 tokenURI。
前端合约封装与集成（阶段 C）— 用户可端到端测试。
懒铸（阶段 D）与增强测试（阶段 E）。