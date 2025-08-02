-- Update the contract template to use parameter placeholders for social media links
UPDATE contract_templates 
SET source_code = '// SPDX-License-Identifier: MIT

/*
Website: {{WEBSITE_LINK}}
Telegram: {{TELEGRAM_LINK}}
X: {{TWITTER_LINK}}
*/

pragma solidity ^0.8.28;

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
}

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;
        return c;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");
        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        uint256 c = a / b;
        return c;
    }
}

contract Ownable is Context {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor () {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    function owner() public view returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(_owner == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }
}

interface IUniswapV2Factory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IUniswapV2Router02 {
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    function factory() external pure returns (address);
    function WETH() external pure returns (address);
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
}

contract ERC20 is Context, IERC20, Ownable {
    using SafeMath for uint256;
    
    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowances;
    
    uint256 private _totalSupply;
    string private _name;
    string private _symbol;
    uint8 private constant _decimals = {{DECIMALS}};
    
    // Tax and trading parameters
    uint256 public initialBuyTax = {{INITIAL_BUY_TAX}};
    uint256 public initialSellTax = {{INITIAL_SELL_TAX}};
    uint256 public finalBuyTax = {{FINAL_BUY_TAX}};
    uint256 public finalSellTax = {{FINAL_SELL_TAX}};
    uint256 public reduceBuyTaxAt = {{REDUCE_BUY_TAX_AT}};
    uint256 public reduceSellTaxAt = {{REDUCE_SELL_TAX_AT}};
    uint256 public preventSwapBefore = {{PREVENT_SWAP_BEFORE}};
    uint256 public transferTax = {{TRANSFER_TAX}};
    uint256 public maxTxAmountPercent = {{MAX_TX_AMOUNT_PERCENT}};
    uint256 public maxWalletSizePercent = {{MAX_WALLET_SIZE_PERCENT}};
    uint256 public taxSwapLimitPercent = {{TAX_SWAP_LIMIT_PERCENT}};
    uint256 public maxSwapLimitPercent = {{MAX_SWAP_LIMIT_PERCENT}};
    
    // Trading state
    bool public tradingEnabled = false;
    bool public swapEnabled = false;
    uint256 public buyCount = 0;
    
    // Addresses
    address public taxWallet = {{TAX_WALLET}};
    address public uniswapV2Router;
    address public uniswapV2Pair;
    
    // Events
    event TradingEnabled();
    event SwapEnabled();
    event BuyCountUpdated(uint256 buyCount);
    
    constructor() {
        _name = "{{TOKEN_NAME}}";
        _symbol = "{{TOKEN_SYMBOL}}";
        _totalSupply = {{TOTAL_SUPPLY}} * 10**_decimals;
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }
    
    function name() public view returns (string memory) {
        return _name;
    }
    
    function symbol() public view returns (string memory) {
        return _symbol;
    }
    
    function decimals() public view returns (uint8) {
        return _decimals;
    }
    
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }
    
    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, _allowances[sender][msg.sender].sub(amount, "ERC20: transfer amount exceeds allowance"));
        return true;
    }
    
    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender].add(addedValue));
        return true;
    }
    
    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender].sub(subtractedValue, "ERC20: decreased allowance below zero"));
        return true;
    }
    
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(amount > 0, "ERC20: transfer amount must be greater than zero");
        
        uint256 maxTxAmount = _totalSupply.mul(maxTxAmountPercent).div(100);
        uint256 maxWalletSize = _totalSupply.mul(maxWalletSizePercent).div(100);
        
        if (sender != owner() && recipient != owner()) {
            require(amount <= maxTxAmount, "ERC20: transfer amount exceeds max transaction");
            if (recipient != uniswapV2Pair) {
                require(_balances[recipient].add(amount) <= maxWalletSize, "ERC20: transfer would exceed max wallet size");
            }
        }
        
        uint256 taxAmount = 0;
        if (sender == uniswapV2Pair && recipient != address(uniswapV2Router)) {
            // Buy transaction
            if (!tradingEnabled) {
                require(sender == owner() || recipient == owner(), "Trading not enabled");
            }
            if (buyCount < preventSwapBefore) {
                require(recipient == owner(), "Trading not allowed before prevent swap count");
            }
            buyCount++;
            emit BuyCountUpdated(buyCount);
            
            uint256 buyTax = buyCount <= reduceBuyTaxAt ? initialBuyTax : finalBuyTax;
            taxAmount = amount.mul(buyTax).div(100);
        } else if (recipient == uniswapV2Pair && sender != address(uniswapV2Router)) {
            // Sell transaction
            if (!tradingEnabled) {
                require(sender == owner() || recipient == owner(), "Trading not enabled");
            }
            
            uint256 sellTax = buyCount <= reduceSellTaxAt ? initialSellTax : finalSellTax;
            taxAmount = amount.mul(sellTax).div(100);
        } else if (sender != uniswapV2Pair && recipient != uniswapV2Pair) {
            // Transfer transaction
            taxAmount = amount.mul(transferTax).div(100);
        }
        
        uint256 transferAmount = amount.sub(taxAmount);
        
        _balances[sender] = _balances[sender].sub(amount, "ERC20: transfer amount exceeds balance");
        _balances[recipient] = _balances[recipient].add(transferAmount);
        
        if (taxAmount > 0) {
            _balances[taxWallet] = _balances[taxWallet].add(taxAmount);
            emit Transfer(sender, taxWallet, taxAmount);
        }
        
        emit Transfer(sender, recipient, transferAmount);
    }
    
    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
    
    // Owner functions
    function enableTrading() external onlyOwner {
        tradingEnabled = true;
        emit TradingEnabled();
    }
    
    function enableSwap() external onlyOwner {
        swapEnabled = true;
        emit SwapEnabled();
    }
    
    function setTaxWallet(address _taxWallet) external onlyOwner {
        taxWallet = _taxWallet;
    }
    
    function setUniswapV2Router(address _router) external onlyOwner {
        uniswapV2Router = _router;
        uniswapV2Pair = IUniswapV2Factory(IUniswapV2Router02(_router).factory()).getPair(address(this), IUniswapV2Router02(_router).WETH());
    }
}'
WHERE name = 'Standard ERC20 Token'; 