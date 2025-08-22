// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
//主和约部分
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract EveryFirst is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // 元数据结构
    struct FirstTimeMemory {
        uint256 timestamp;
        string title;
        string description;
        string location;
        string mood;
        string[] tags;
        string imageCID;
    }

    // 存储元数据摘要
    mapping(uint256 => bytes32) private _metadataDigests;

    // 事件
    event MemoryMinted(
        address indexed owner,
        uint256 indexed tokenId,
        string tokenURI,
        bytes32 metadataDigest
    );

    constructor() ERC721("EveryFirst", "EFIRST") Ownable(msg.sender) {}

    // 铸造新的记忆NFT
    function mintMemory(
        address to,
        string memory tokenURI,
        bytes32 metadataDigest
    ) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _metadataDigests[tokenId] = metadataDigest;
        
        emit MemoryMinted(to, tokenId, tokenURI, metadataDigest);
        return tokenId;
    }

    // 获取元数据摘要
    function getMetadataDigest(uint256 tokenId) public view returns (bytes32) {
        require(_exists(tokenId), "Token does not exist");
        return _metadataDigests[tokenId];
    }

    // 重写基础URI
    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
    }

    // 设置tokenURI（内部）
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(_exists(tokenId), "ERC721Metadata: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    // 获取tokenURI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);
        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();
        
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        return super.tokenURI(tokenId);
    }

    // 支持接口
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}