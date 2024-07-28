// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import {Chainlink, ChainlinkClient} from "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";

contract LoveToken is IERC20, ChainlinkClient, ConfirmedOwner {
    using Chainlink for Chainlink.Request;

    uint256 private constant ORACLE_PAYMENT = (1 * LINK_DIVISIBILITY) / 10; // 0.1 * 10**18
    bytes32 private jobId;
    address private oracle;

    bool public isRainy;
    uint256 public isRainyModifiedAt = 0;
    bool public waitingToUpdate = false;
    bytes32 public latestRequestId;
    mapping(bytes32 => address[]) public requestIds;
    string apiUrl = "http://45.61.140.26:3000/is-it-raining";

    event RequestWeatherDataFulfilled(
        bytes32 indexed requestId,
        bool indexed isRainy
    );

    event NewFriendship(address lover, address beloved);
    event Thought(address lover, address beloved);
    event GoOut(address lover, address beloved, uint256 time);
    event Breakup(address exLover, address exBeloved);

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => uint256) private _inControlbalances;
    mapping(address => mapping(address => uint256)) private _allowances;
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    uint256 private _loveHour;
    uint256 private _loveMinute;
    uint256 private _loveStartRange;
    uint256 private _loveEndRange;
    uint256 public mintAmountPerTought = 100;
    uint256 public mintAmountPerDate = 500;

    struct Friendship {
        address friend;
        bool hasFriend;
        bool thoughtOfThem;
        uint256 thoughtTime;
        uint256 askOutTime;
        uint256 lastDateTime;
        uint256 totalMinted;
    }
    mapping(address => Friendship) public _friendships;
    mapping(address => mapping(address => bool)) private _friendRequests;
    mapping(address => mapping(address => bool)) private _askOutRequests;


    constructor(uint8 loveHour_, uint8 loveMinute_, string memory jobId_, address oracle_) ConfirmedOwner(msg.sender) {
        _name = "The Token of Love";
        _symbol = "TOL";
        _decimals = 18;
        _loveHour = loveHour_;
        _loveMinute = loveMinute_;
        _loveStartRange = _loveHour * 3600 + _loveMinute * 60;
        _loveEndRange = _loveStartRange + 59;

        _setChainlinkToken(0x779877A7B0D9E8603169DdbD7836e478b4624789);

        jobId = stringToBytes32(jobId_);
        oracle = oracle_;
    }

    function requestTehranWeather() internal returns (bytes32 requestId) {
        Chainlink.Request memory req = _buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillTehranWeather.selector
        );
        req._add(
            "get",
            apiUrl
        );
        req._add("path", "raining");
        requestId = _sendChainlinkRequestTo(oracle, req, ORACLE_PAYMENT);

        waitingToUpdate = true;
    }

    function fulfillTehranWeather(
        bytes32 _requestId,
        bool _isRainy
    ) public recordChainlinkFulfillment(_requestId) {
        emit RequestWeatherDataFulfilled(_requestId, _isRainy);
        isRainy = _isRainy;
        isRainyModifiedAt = block.timestamp;

        waitingToUpdate = false;

        if (isRainy) {
            uint256 n = requestIds[latestRequestId].length;
            while (n > 0) {
                n--;
                address _addr = requestIds[latestRequestId][n];
                askToGoOutFinish(_addr);
            }
        }
    }

    function withdrawLink() public onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(_chainlinkTokenAddress());
        require(
            link.transfer(msg.sender, link.balanceOf(address(this))),
            "Unable to transfer"
        );
    }

    function cancelRequest(
        bytes32 _requestId,
        uint256 _payment,
        bytes4 _callbackFunctionId,
        uint256 _expiration
    ) public onlyOwner {
        _cancelChainlinkRequest(
            _requestId,
            _payment,
            _callbackFunctionId,
            _expiration
        );
    }

    function stringToBytes32(
        string memory source
    ) private pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            // solhint-disable-line no-inline-assembly
            result := mload(add(source, 32))
        }
    }

    function setAPIUrl(string memory _url) external onlyOwner {
        apiUrl = _url;
    }


    function transfer(address recipient, uint256 amount)
        external
        returns (bool)
    {
        _balances[msg.sender] -= amount;
        _inControlbalances[msg.sender] -= amount;
        if (_friendships[msg.sender].hasFriend) {
            _friendships[msg.sender].totalMinted -= Math.min(_friendships[msg.sender].totalMinted, amount);
        }
        _balances[recipient] += amount;
        _inControlbalances[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    function loveHour() public view virtual returns (uint256) {
        return _loveHour;
    }

    function loveMinute() public view virtual returns (uint256) {
        return _loveMinute;
    }

    function loveStartRange() public view virtual returns (uint256) {
        return _loveStartRange;
    }

    function loveEndRange() public view virtual returns (uint256) {
        return _loveEndRange;
    }

    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    function inControlbalanceOf(address account) public view virtual returns (uint256) {
        return _inControlbalances[account];
    }

    function friendOf(address account) public view virtual returns (address) {
        return _friendships[account].friend;
    }

    function hasFriend(address account) public view virtual returns (bool) {
        require(account == msg.sender, "Are you non-monogamous?");
        return _friendships[account].hasFriend;
    }

    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    function getCurrentTimestamp() external view returns (uint256) {
        return block.timestamp;
    }

    function setLoveHour(uint256 loveHour_) external onlyOwner {
        _loveHour = loveHour_;

        _loveStartRange = _loveHour * 3600 + _loveMinute * 60;
        _loveEndRange = _loveStartRange + 59;
    }

    function setLoveMinute(uint256 loveMinute_) external onlyOwner {
        _loveMinute = loveMinute_;

        _loveStartRange = _loveHour * 3600 + _loveMinute * 60;
        _loveEndRange = _loveStartRange + 59;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount)
        external
        returns (bool)
    {
        _allowances[sender][msg.sender] -= amount;
        _balances[sender] -= amount;
        _inControlbalances[sender] -= amount;
        if (_friendships[sender].hasFriend) {
            _friendships[sender].totalMinted -= Math.min(_friendships[sender].totalMinted, amount);
        }
        _balances[recipient] += amount;
        _inControlbalances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }

    function _mint(address to, uint256 amount) internal {
        _balances[to] += amount;
        _inControlbalances[to] += amount;
        _totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        _balances[from] -= amount;
        _inControlbalances[from] -= amount;
        _totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    function weAreFriends(address myFriend) external {
        require(!_friendships[msg.sender].hasFriend, "Are you non-monogamous?");

        if (_friendRequests[myFriend][msg.sender]) {
            _friendRequests[myFriend][msg.sender] = false;

            _friendships[msg.sender].friend = myFriend;
            _friendships[msg.sender].hasFriend = true;

            _friendships[myFriend].friend = msg.sender;
            _friendships[myFriend].hasFriend = true;

            emit NewFriendship(msg.sender, myFriend);
        } else {
            _friendRequests[msg.sender][myFriend] = true;
        }
    }

    function weAreFriendsWithSender(address sender, address myFriend) external { // Only for test
        require(!_friendships[sender].hasFriend, "Are you non-monogamous?");

        if (_friendRequests[myFriend][sender]) {
            _friendRequests[myFriend][sender] = false;

            _friendships[sender].friend = myFriend;
            _friendships[sender].hasFriend = true;

            _friendships[myFriend].friend = sender;
            _friendships[myFriend].hasFriend = true;

            emit NewFriendship(sender, myFriend);
        } else {
            _friendRequests[sender][myFriend] = true;
        }
    }

    function askToGoOutFinish(address _addr) internal {
        Friendship memory friendship = _friendships[_addr];
        address friend = friendship.friend;

        _friendships[_addr].lastDateTime = block.timestamp;
        _friendships[friend].lastDateTime = block.timestamp;

        _mint(_addr, mintAmountPerDate);
        _mint(friend, mintAmountPerDate);

        _friendships[_addr].totalMinted += mintAmountPerDate;
        _friendships[friend].totalMinted += mintAmountPerDate;

        emit GoOut(_addr, friend, block.timestamp);
    }

    function askToGoOut() public {
        Friendship memory myFriendship = _friendships[msg.sender];
        address myFriend = myFriendship.friend;

        require(myFriendship.hasFriend, "You are single my friend");
        require(block.timestamp - myFriendship.lastDateTime > 86400, "Wait my friend. Too soon to go another date"); // 24 Hours
        
        bool isRainyUpdate = block.timestamp - isRainyModifiedAt <= 300;
        require(isRainy || !isRainyUpdate, "It's not raining");

        if (_askOutRequests[myFriendship.friend][msg.sender]) {
            _askOutRequests[myFriendship.friend][msg.sender] = false;
            if (block.timestamp - _friendships[myFriendship.friend].askOutTime > 10800) { // 3 Hours
                _askOutRequests[msg.sender][myFriend] = true;
                _friendships[msg.sender].askOutTime = block.timestamp;
            } else {
                if (isRainyUpdate) {
                    askToGoOutFinish(msg.sender);
                } else {
                    if (!waitingToUpdate) {
                        latestRequestId = requestTehranWeather();
                    }
                    requestIds[latestRequestId].push(msg.sender);
                }
            }
        } else {
            _askOutRequests[msg.sender][myFriendship.friend] = true;
            _friendships[msg.sender].askOutTime = block.timestamp;
        }
    }

    function thoughtOfThem()  external {
        Friendship memory myFriendship = _friendships[msg.sender];

        require(myFriendship.hasFriend, "You are single my friend");

        uint256 currentTimestamp = block.timestamp;
        uint256 secondsInDay = currentTimestamp % 86400;

        require(secondsInDay >= _loveStartRange && secondsInDay <= _loveEndRange,
                "You are not on time my friend");

        address myFriend = myFriendship.friend;
    
        emit Thought(msg.sender, myFriend);


        Friendship memory theirFriendship = _friendships[myFriend];
        if (theirFriendship.thoughtOfThem && (block.timestamp - theirFriendship.thoughtTime) < 60) {
            _friendships[myFriend].thoughtOfThem = false;

            _mint(msg.sender, mintAmountPerTought);
            _mint(myFriend, mintAmountPerTought);

            _friendships[msg.sender].totalMinted += mintAmountPerTought;
            _friendships[myFriend].totalMinted += mintAmountPerTought;
        } else {
            _friendships[msg.sender].thoughtOfThem = true;
            _friendships[msg.sender].thoughtTime = block.timestamp;
        }
    }

    function thoughtOfThemWithSender(address sender)  external { // Only for test
        Friendship memory myFriendship = _friendships[sender];

        require(myFriendship.hasFriend, "You are single my friend");

        uint256 currentTimestamp = block.timestamp;
        uint256 secondsInDay = currentTimestamp % 86400;

        require(secondsInDay >= _loveStartRange && secondsInDay <= _loveEndRange,
                "You are not on time my friend");

        address myFriend = myFriendship.friend;
    
        emit Thought(sender, myFriend);


        Friendship memory theirFriendship = _friendships[myFriend];
        if (theirFriendship.thoughtOfThem && (block.timestamp - theirFriendship.thoughtTime) < 60) {
            _friendships[myFriend].thoughtOfThem = false;

            _mint(sender, mintAmountPerTought);
            _mint(myFriend, mintAmountPerTought);

            _friendships[sender].totalMinted += mintAmountPerTought;
            _friendships[myFriend].totalMinted += mintAmountPerTought;
        } else {
            _friendships[sender].thoughtOfThem = true;
            _friendships[sender].thoughtTime = block.timestamp;
        }
    }

    function weCut() external{
        Friendship memory myFriendship = _friendships[msg.sender];

        require(myFriendship.hasFriend, "You are single my friend");

        _friendships[msg.sender].hasFriend = false;
        _inControlbalances[msg.sender] -= myFriendship.totalMinted;
        _friendships[msg.sender].totalMinted = 0;

        address myEx = myFriendship.friend;
        _friendships[myEx].hasFriend = false;
        _inControlbalances[myEx] -= _friendships[myEx].totalMinted;
        _friendships[myEx].totalMinted = 0;

        _friendships[myEx].friend = address(0);
        _friendships[msg.sender].friend = address(0);


        emit Breakup(msg.sender, myEx);
    }
}
