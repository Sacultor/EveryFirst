const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EveryFirst", function () {
	let EveryFirst, everyFirst, deployer, addr1;

		beforeEach(async function () {
			[deployer, addr1] = await ethers.getSigners();
			EveryFirst = await ethers.getContractFactory("EveryFirst");
			everyFirst = await EveryFirst.deploy();
			await everyFirst.waitForDeployment();
		});

	it("should allow MINTER to mint and emit event", async function () {
		const metadata = JSON.stringify({ name: "Test" });
		const digest = ethers.keccak256(ethers.toUtf8Bytes(metadata));
		const tx = await everyFirst.connect(deployer).mintWithURI(addr1.address, "bafy...", digest, 20250823);
		await tx.wait();
		const tokenId = 1; // first minted tokenId starts at 1
		expect(await everyFirst.ownerOf(tokenId)).to.equal(addr1.address);
		expect(await everyFirst.getMetadataDigest(tokenId)).to.equal(digest);
	});

	it("should revert mint when caller is not minter", async function () {
		const metadata = JSON.stringify({ name: "Test" });
		const digest = ethers.keccak256(ethers.toUtf8Bytes(metadata));
			await expect(
				everyFirst.connect(addr1).mintWithURI(addr1.address, "bafy...", digest, 20250823)
			).to.be.reverted;
	});
});
