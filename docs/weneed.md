## EveryFirst — 合约与前端/后端交互实施方案

下面的文档给出合约实现位置、合约逻辑概要、前端与后端之间的交互契约（API）、事件与数据格式示例，以及关键边界/安全注意点，目标是让开发者可以立刻开始实现并联调。

---

## 变更概览（简短计划）

- 新建/修改文件路径（建议）：
	- `smart_contract/contracts/EveryFirstNote.sol` — ERC-721 合约实现
	- `smart_contract/scripts/deploy.js` — 部署脚本（Hardhat）
	- `smart_contract/test/EveryFirstNote.test.js` — 单元测试
	- `server/`（若尚未存在）— 后端服务
		- `server/src/index.ts` — Express 启动
		- `server/src/routes/upload.ts` — 图片 & metadata pin 路由
		- `server/src/routes/notes.ts` — 草稿/查询/生成 metadata
	- `front/src/services/contract.tsx` — 前端合约交互封装
	- `front/src/stores/noteStore.tsx` — 状态管理（Zustand）扩展

---

## 合约实现逻辑（核心）

目标：提供安全、最小化链上存储的 ERC-721，用于铸造便签 NFT。合约应支持管理员（MINTER）权限、事件上报、可选的懒铸（voucher）路径。

主要合约：`EveryFirstNote.sol`

关键要点：
- 继承 OpenZeppelin 的 `ERC721`, `ERC721URIStorage`, `AccessControl`, `Ownable`。
- 定义 MINTER_ROLE，铸造仅允许拥有该角色的地址调用（后端或合约所有者）。
- 链上仅存储 `tokenURI`（IPFS URL）和可选的 `metadataDigest`（bytes32，keccak256 of metadata JSON 或 CID）用于完整性校验。
- 触发事件 `NoteMinted(uint256 indexed tokenId, address indexed owner, bytes32 digest, uint256 date)`。
- 支持 `mintWithURI(address to, string calldata uri, bytes32 digest, uint256 date)` 返回 tokenId。
- 可选支持 `redeem(Voucher voucher, bytes signature)` 用于懒铸（EIP-712），签名由后端或平台私钥生成，由用户支付 Gas 触发铸造。

简单 contract “契约” 摘要：
- 输入：mint 请求包含 `to`, `tokenURI`, `metadataDigest`, `date`（便签日期）
- 输出：tokenId，合约事件 `NoteMinted`
- 错误模式：非 MINTER 调用 revert；URI 为空 revert；重复 digest 视需求可允许或禁止（建议允许但记录）。

安全注意：
- 使用 `onlyRole(MINTER_ROLE)` 保护铸造入口。若项目采用懒铸，确保 voucher 的签名机制防止重放（nonce + 到期时间）。
- 避免在合约中存放图片或大量数据；只存 `tokenURI`。

示意 Solidity 接口（非完整代码，仅契约说明）：

function mintWithURI(address to, string memory uri, bytes32 digest, uint256 date) external onlyRole(MINTER_ROLE) returns (uint256 tokenId);

event NoteMinted(uint256 indexed tokenId, address indexed owner, bytes32 digest, uint256 date);

---

## 前端 / 后端 / 合约 交互逻辑（端到端流程）

目标：用户在前端创建便签 → 前端将图片与草稿发给后端 pin 到 IPFS → 后端返回 `tokenURI` → 用户（或后端）调用合约 mint → 铸造完成，前端更新状态。

流程步骤（详尽）:

1) 用户在前端打开 `NoteEditorModal`，填写 title/description/date/location/mood/tags，并上传图片。

2) 图片上传到后端（或直接到 web3.storage）：
	 - 前端发送 `POST /api/upload/image`（multipart/form-data）给后端。
	 - 后端接收后，调用 Pin 服务（web3.storage 或 Pinata），并返回 `{ cid, ipfsGateway, ipfsUri }`。

3) 保存草稿（可选）：
	 - 前端调用 `POST /api/notes` 保存草稿到数据库（包含图片 CID、metadata 字段），返回 `draftId`。

4) 生成并 Pin metadata（准备铸造）：
	 - 前端请求 `POST /api/notes/:id/pin` 或 `POST /api/pin-metadata`，后端读取草稿，生成 metadata JSON：

{
	"name": "{title} - {date}",
	"description": "{description}",
	"image": "ipfs://{imageCid}",
	"external_url": "https://<app>/note/{noteId}",
	"attributes": [ {"trait_type": "Date","value":"YYYY-MM-DD"}, ... ]
}

	 - 后端将 JSON pin 到 IPFS，计算 `digest = keccak256(bytes(jsonString))`，并返回 `{ tokenURI: "ipfs://<cid>", digest }`。

5) 铸造（两种方式可选）:
	 A) 前端直接调用合约（用户自己付 Gas）：
			- 前端用 Ethers.js 创建 `contract.connect(signer).mintWithURI(userAddress, tokenURI, digest, date)`。
			- 监听交易 hash 与 `NoteMinted` 事件；交易确认后，后端可通过事件监听补全数据库（tokenId, txHash, tokenURI）。

	 B) 后端代为发起铸造（平台付 Gas，需谨慎）：
			- 后端调用智能合约 `mintWithURI`（使用服务器持有的私钥），返回 txHash 与 tokenId（可在事件中读取）。
			- 仅在信任模型允许且合规时使用。

	 C) 懒铸（推荐可选）：
			- 后端生成 EIP-712 voucher（包含 tokenURI, digest, to, date, nonce, deadline），并对其签名。
			- 前端把 voucher 传给合约 `redeem(voucher, signature)`，由用户支付 Gas 完成铸造；合约验证签名、nonce 并 mint。

6) 铸造后：
	 - 后端/前端通过链上事件或 RPC 查询获取 `tokenId`，并更新笔记记录：{ tokenId, tokenURI, txHash, mintedAt }
	 - 前端在用户界面中显示 NFT 链接（区块浏览器 + IPFS metadata）。

---

## HTTP API 设计（后端）

基础路径：`/api`，鉴权采用 SIWE 或 JWT（推荐）。示例路由：

- POST /api/upload/image
	- 输入：multipart/form-data field `file`
	- 输出：{ cid: string, ipfsUri: string, gatewayUrl: string }

- POST /api/notes
	- 功能：保存草稿
	- 输入：{ title, description, date, location, mood, tags[], imageCid }
	- 输出：{ id }

- POST /api/notes/:id/pin
	- 功能：生成 metadata、pin 到 IPFS、返回 tokenURI 与 digest
	- 输出：{ tokenURI: string, digest: string }

- GET /api/notes?owner=&month=
	- 功能：按 owner & 月份查询便签清单
	- 输出：列表，包含 `{ id, date, title, imageCid, tokenId? }`

- POST /api/nft/mint
	- 可选：后端代铸入口
	- 输入：{ to, tokenURI, digest, date }
	- 输出：{ txHash, tokenId }

安全措施：所有写操作需验证请求发起者为资源所有者（签名/JWT）。上传大文件要做大小限制和类型白名单。

---

## 前端合约封装（示例）

位置：`front/src/services/contract.tsx`

职责：封装 Ethers.js 的 Contract 实例与常用方法：connectProvider, connectSigner, mintWithURI, listenEvents, fetchTokenURI。

示例方法描述：
- async mintWithURI(signer, to, tokenURI, digest, date) -> returns tx
- function onNoteMinted(callback) 注册事件监听器

错误与 UX：在调用 mint 前，前端应展示 Gas 估算与确认对话，交易发出后展示 spinner 并在交易确认后刷新本地状态。

---

## 数据契约与示例

metadata JSON 示例：

{
	"name": "First Dive - 2025-08-01",
	"description": "那天我第一次潜水，心情无比激动……",
	"image": "ipfs://bafy...",
	"external_url": "https://everyfirst.app/note/123",
	"attributes": [
		{"trait_type": "Date", "value": "2025-08-01"},
		{"trait_type": "Mood", "value": "Excited"},
		{"trait_type": "Tags", "value": "dive,travel"},
		{"trait_type": "Location", "value": "Bali"}
	]
}

后端返回给前端的 Pin 响应示例：

{
	"tokenURI": "ipfs://bafy...",
	"digest": "0xabc123..." // keccak256(metadataString)
}

合约 `NoteMinted` 事件监听示例（前端）：

contract.on('NoteMinted', (tokenId, owner, digest, date, event) => {
	// 更新本地 DB -> tokenId, txHash
});

---

## 边界情况与测试要点

- 图片上传失败或 Pin 超时：后端应返回合理的错误代码并支持重试；前端显示明确错误并允许重新上传。
- metadata JSON 不合法：后端应在 pin 前校验并拒绝。
- 重放攻击（懒铸）：voucher 需包含 nonce 与 deadline，合约持有映射已使用 nonce。
- 异链验证差异：前端在显示 tokenURI 时要使用 IPFS 网关或 raw CID 解析，避免依赖单一网关。
- 用户在错误链上（chainId 不匹配）：前端在发起合约调用前检测 chainId，提示切换网络。

测试用例（建议覆盖）：
- mint 成功、事件触发、tokenURI 可解析到元数据
- 非 MINTER 调用 mint 被拒绝
- 懒铸：voucher 过期或 nonce 重放被拒
- 后端 pin metadata 成功/失败的异常处理

---

## 部署/运行建议（最低步）

- 合约：使用 Hardhat，配置 `.env` 包含 RPC 与 DEPLOYER_PRIVATE_KEY，脚本 `npx hardhat run scripts/deploy.js --network sepolia`。
- 后端：在 `server/` 下 `npm install`，使用 `WEB3_STORAGE_TOKEN` 或 `PINATA_JWT` 做 pin 服务，配置 `DATABASE_URL`（sqlite dev）和 `JWT_SECRET`。
- 前端：在 `front/` 安装新增依赖 `ethers axios zustand date-fns web3.storage`，配置 `VITE_CONTRACT_ADDRESS` 与 `VITE_BACKEND_URL`。

---

## 完成标准（验收）

1) 合约 `EveryFirstNote.sol` 在本地测试网通过单元测试，并输出 ABI。
2) 后端接口能接受图片并返回 `ipfs://` tokenURI 与 digest。
3) 前端能发起 mint：用户付 Gas 情况下完成单笔铸造并在 UI 显示 tokenId 与 metadata 链接。

---

如果你希望，我可以：
- 生成 `EveryFirstNote.sol` 的完整 Solidity 源码样板并添加到 `smart_contract/contracts/`。
- 在 `front/` 添加 `contract.tsx` 的 Ethers 封装样板。
- 在 `server/` 搭建最小 Express + pin 到 web3.storage 的实现样例。

请告诉我接下来优先要我完成哪一项（合约源码 / 前端封装 / 后端 pin 示例 / 或全部）。
