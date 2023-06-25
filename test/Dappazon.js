const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ID = 1;
const NAME = "Shoes";
const CATEGORY = "Clothing";
const IMAGE =
  "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg";
const COST = tokens(1);
const RATING = 4;
const STOCK = 5;

describe("Decentral_Amazon", () => {
  let decentral_Amazon;
  let deployer, buyer;

  beforeEach(async () => {
    //set up accounts
    [deployer, buyer] = await ethers.getSigners();

    //deploy contract
    const Decentral_Amazon = await ethers.getContractFactory(
      "Decentral_Amazon"
    );
    decentral_Amazon = await Decentral_Amazon.deploy();
  });

  describe("Deployment", async () => {
    it("Sets the owner", async () => {
      expect(await decentral_Amazon.owner()).to.equal(deployer.address);
    });
  });

  describe("Listing", async () => {
    let transaction;
    beforeEach(async () => {
      transaction = await decentral_Amazon
        .connect(deployer)
        .list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);

      await transaction.wait();
    });

    it("reverts if not owner", async () => {
      await expect(
        decentral_Amazon.connect(buyer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("returns item attributes", async () => {
      const item = await decentral_Amazon.items(ID);
      expect(item.id).to.equal(ID);
      expect(item.name).to.equal(NAME);
      expect(item.category).to.equal(CATEGORY);
      expect(item.image).to.equal(IMAGE);
      expect(item.cost).to.equal(COST);
      expect(item.rating).to.equal(RATING);
      expect(item.stock).to.equal(STOCK);
    });

    it("emits a List event", async () => {
      expect(transaction).to.emit(decentral_Amazon, "List")
    });
  });


  describe("Buying", async () => {
    let transaction;

    beforeEach(async () => {

      // List a item
      transaction = await decentral_Amazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // Buy a item
      transaction = await decentral_Amazon.connect(buyer).buy(ID, { value: COST })
      await transaction.wait()
    });

    it("Updates the contact balance", async () => {
      const result = await ethers.provider.getBalance(decentral_Amazon.address);
      expect(result).to.equal(COST);
    });

    it("Updates buyer's order count", async () => {
      const result = await decentral_Amazon.orderCount(buyer.address)
      expect(result).to.equal(1)
    })

    it("Addes the order", async () => {
      const order = await decentral_Amazon.orders(buyer.address,1);
      expect(order.time).to.be.greaterThan(0);
      expect(order.item.name).to.equal(NAME);
    })

    it("Emits Buy event",()=>{
      expect(transaction).to.emit(decentral_Amazon,"Buy")
    })
  });

  describe("Withdrawing",async()=>{
    let balanceBefore
    beforeEach(async ()=>{
      let transaction
      transaction = await decentral_Amazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // Buy a item
      transaction = await decentral_Amazon.connect(buyer).buy(ID, { value: COST })
      await transaction.wait()

      balanceBefore = await ethers.provider.getBalance(deployer.address)

      transaction = await decentral_Amazon.connect(deployer).withdraw()
      await transaction.wait()

    })
    it("Updates the owner balance",async ()=>{
      const balanceAfter = await ethers.provider.getBalance(deployer.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    })

    it("Updates the contract balance", async ()=>{
      const result = await ethers.provider.getBalance(decentral_Amazon.address)
      expect(result).to.equal(0)
    })

  })
});
