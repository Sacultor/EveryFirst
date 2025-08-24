// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// EveryFirst NFT 合约（修正版）
// - 使用 ERC721URIStorage 存储 tokenURI
// - 使用 AccessControl 提供 MINTER_ROLE
// - 链上仅存储 tokenURI 与 metadata digest

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract EveryFirst is ERC721URIStorage, AccessControl, Ownable {
    uint256 private _nextTokenId = 1;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // 存储元数据摘要 (keccak256 of metadata JSON or CID)
    mapping(uint256 => bytes32) private _metadataDigests;

    // 事件
    event NoteMinted(uint256 indexed tokenId, address indexed owner, bytes32 digest, uint256 date);

    constructor() ERC721("EveryFirst", "EFIRST") Ownable(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /// @notice 铸造新的 NFT，受 MINTER_ROLE 控制
    /// @param to 接收地址
    /// @param uri tokenURI 的 CID 或路径（不包含 base）
    /// @param digest keccak256(metadataJSON)
    /// @param date 便签日期（unix timestamp 或 YYYYMMDD 格式）
    function mintWithURI(
        address to,
        string calldata uri,
        bytes32 digest,
        uint256 date
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
    uint256 tokenId = _nextTokenId;
    _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _metadataDigests[tokenId] = digest;

        emit NoteMinted(tokenId, to, digest, date);
        return tokenId;
    }

    function getMetadataDigest(uint256 tokenId) public view returns (bytes32) {
        return _metadataDigests[tokenId];
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
    }

    // 为演示目的：允许任何人获取 MINTER_ROLE
    function requestMinterRole() external {
        _grantRole(MINTER_ROLE, msg.sender);
    }

    // supportsInterface 需要同时覆盖 AccessControl 与 ERC721 的实现
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}