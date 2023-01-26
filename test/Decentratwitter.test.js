const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Decentratwitter", function () {
    let Decentratwitter
    let deployer,user1,user2,users
    let URI ="SampleURI"
    let postHash ="SampleHash"

    beforeEach(async () => {
        [deployer, user1, user2, ...users] = await ethers.getSigners();

        const DecentratwitterFactory = await ethers.getContractFactory("Decentratwitter");

        decentratwitter = await DecentratwitterFactory.deploy();

        await decentratwitter.connect(user1).mint(URI)

    })

    describe('Deployment',async() => {
        it("Should track name and symbol", async function () {
            const nftName ="Decentratwitter"
            const nftSymbol = "DAPP"
            expect(await decentratwitter.name()).to.equal(nftName);
            expect(await decentratwitter.symbol()).to.equal(nftSymbol);
        });
    })

    describe('Minting NFTs', async () => {
        it("Should track each minted NFT", async function () {
            expect(await decentratwitter.tokenCount()).to.equal(1);
            expect(await decentratwitter.balanceOf(user1.address)).to.equal(1);
            expect(await decentratwitter.tokenURI(1)).to.equal(URI);

            await decentratwitter.connect(user2).mint(URI)
            expect(await decentratwitter.tokenCount()).to.equal(2);
            expect(await decentratwitter.balanceOf(user2.address)).to.equal(1);
            expect(await decentratwitter.tokenURI(2)).to.equal(URI);
        });
    })

    describe('Setting profiles', async () => {
        it("Should allow users to select which NFT they own to represent their profile", async function () {
            await decentratwitter.connect(user1).mint(URI)

            expect(await decentratwitter.profiles(user1.address)).to.equal(2);

            await decentratwitter.connect(user1).setProfile(1)

            expect(await decentratwitter.profiles(user1.address)).to.equal(1);

       });
    })

    describe('Uploading posts', async () => {
        it("Should track posts uploaded only by users who own an NFT", async function () {
          // user1 uploads a post
          await expect(decentratwitter.connect(user1).uploadPost(postHash))
            .to.emit(decentratwitter, "PostCreated")
            .withArgs(
              1,
              postHash,
              0,
              user1.address
            )
          const postCount = await decentratwitter.postCount()
          expect(postCount).to.equal(1);
          
          const post = await decentratwitter.posts(postCount)
          expect(post.id).to.equal(1)
          expect(post.hash).to.equal(postHash)
          expect(post.tipAmount).to.equal(0)
          expect(post.author).to.equal(user1.address)
        });
      })

    describe('Tipping posts', async () =>{
        it("Should allow users to tip posts and track each posts tip amount", async function () {
            await decentratwitter.connect(user1).uploadPost(postHash)

            const initAuthorBalance = await ethers.provider.getBalance(user1.address)

            const tipAmount = ethers.utils.parseEther("1")

            await expect(decentratwitter.connect(user2).tipPostOwner(1,{ value: tipAmount})).to.emit(decentratwitter,"PostTipped").withArgs(1,postHash,tipAmount, user1.address)

            const post = await decentratwitter.posts(1)

            expect(post.tipAmount).to.equal(tipAmount)

            const finalAuthorBalance = await ethers.provider.getBalance(user1.address)

            expect(finalAuthorBalance).to.equal(initAuthorBalance.add(tipAmount))
        });
    })
    describe("Getter functions", function () {
        let ownedByUser1 = [1, 2]
        let ownedByUser2 = [3]
        beforeEach(async function () {
          // user 1 makes a post
          await decentratwitter.connect(user1).uploadPost(postHash)
          // user 1 mints another NFT
          await decentratwitter.connect(user1).mint(URI)
          // user 2 mints an NFT
          await decentratwitter.connect(user2).mint(URI)
          // user 2 makes a post
          await decentratwitter.connect(user2).uploadPost(postHash)
        })
    
        it("getAllPosts should fetch all the posts", async function () {
          const allPosts = await decentratwitter.getAllPosts()
          // Check that the length is correct
          expect(allPosts.length).to.equal(2)
        });
        it("getMyNfts should fetch all nfts the user owns", async function () {
          const user1Nfts = await decentratwitter.connect(user1).getMyNfts()
          expect(user1Nfts.length).to.equal(2)
          const user2Nfts = await decentratwitter.connect(user2).getMyNfts()
          expect(user2Nfts.length).to.equal(1)
        });
      });
});
