// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Decentral_Amazon {
    address public owner;

    struct Item {
        uint256 id;
        string name;
        string category;
        string image;
        uint256 cost;
        uint256 rating;
        uint256 stock;
    }

    struct Order {
        uint256 time;
        Item item;
    }

    mapping(uint256 => Item) public items;
    mapping(address => uint256) public orderCount;
    mapping(address => mapping(uint256 => Order)) public orders;

    event List(string name, uint256 cost, uint256 quantity);
    event Buy(address buyer, uint256 orderId, uint256 itemId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    //List products
    function list(
        uint256 _id,
        string memory _name,
        string memory _category,
        string memory _image,
        uint256 _cost,
        uint256 _rating,
        uint256 _stock
    ) public onlyOwner{
        


        // Create Item struct
        Item memory item = Item(
            _id,
            _name,
            _category,
            _image,
            _cost,
            _rating,
            _stock
        );

        // Save Item struct to blockchain
        items[_id] = item;

        // Trigger an event
        emit List(_name,_cost,_stock);
    }

    //Buy products
    function buy(uint256 _id) public payable{
        // recieve crypto

        //create an orde
        Item memory item = items[_id];

        require(msg.value>=item.cost,"Not enough ether sent");
        require(item.stock>0,"Not enough item stock");

        Order memory order = Order(block.timestamp, item);

        // add order to blockchain
        orderCount[msg.sender]++;
        orders[msg.sender][orderCount[msg.sender]] = order;


        // update stock
        items[_id].stock = items[_id].stock - 1;

        // emit event
        emit Buy(msg.sender,orderCount[msg.sender],item.id);

    }

    //Withdraw funds
    function withdraw() public onlyOwner {
        (bool success, ) = owner.call{value:address(this).balance}("");
        require(success);
    }
}
