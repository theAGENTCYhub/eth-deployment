-- Insert standard parameter definitions
INSERT INTO parameter_definitions (
  parameter_key,
  parameter_name,
  description,
  data_type,
  default_value,
  validation_rules,
  display_order,
  is_required
) VALUES 
  ('TOKEN_NAME', 'Token Name', 'The name of the token', 'string', 'MyToken', '{"minLength": 1, "maxLength": 50}', 1, true),
  ('TOKEN_SYMBOL', 'Token Symbol', 'The symbol of the token', 'string', 'MTK', '{"minLength": 1, "maxLength": 10}', 2, true),
  ('TOTAL_SUPPLY', 'Total Supply', 'Total token supply in whole units', 'number', '100000000000', '{"min": 1, "max": 1000000000000}', 3, true),
  ('DECIMALS', 'Decimals', 'Number of decimal places', 'number', '9', '{"min": 0, "max": 18}', 4, true),
  ('INITIAL_BUY_TAX', 'Initial Buy Tax (%)', 'Initial buy tax percentage', 'number', '18', '{"min": 0, "max": 50}', 5, true),
  ('INITIAL_SELL_TAX', 'Initial Sell Tax (%)', 'Initial sell tax percentage', 'number', '22', '{"min": 0, "max": 50}', 6, true),
  ('FINAL_BUY_TAX', 'Final Buy Tax (%)', 'Final buy tax percentage after reduction', 'number', '0', '{"min": 0, "max": 50}', 7, true),
  ('FINAL_SELL_TAX', 'Final Sell Tax (%)', 'Final sell tax percentage after reduction', 'number', '0', '{"min": 0, "max": 50}', 8, true),
  ('REDUCE_BUY_TAX_AT', 'Reduce Buy Tax At', 'Buy count when buy tax reduces', 'number', '1', '{"min": 0, "max": 1000}', 9, true),
  ('REDUCE_SELL_TAX_AT', 'Reduce Sell Tax At', 'Buy count when sell tax reduces', 'number', '22', '{"min": 0, "max": 1000}', 10, true),
  ('PREVENT_SWAP_BEFORE', 'Prevent Swap Before', 'Buy count before allowing swaps', 'number', '22', '{"min": 0, "max": 1000}', 11, true),
  ('TRANSFER_TAX', 'Transfer Tax (%)', 'Tax on regular transfers', 'number', '0', '{"min": 0, "max": 50}', 12, true),
  ('MAX_TX_AMOUNT_PERCENT', 'Max Transaction Amount (%)', 'Maximum transaction as percentage of total supply', 'number', '2', '{"min": 0.1, "max": 10}', 13, true),
  ('MAX_WALLET_SIZE_PERCENT', 'Max Wallet Size (%)', 'Maximum wallet size as percentage of total supply', 'number', '2', '{"min": 0.1, "max": 10}', 14, true),
  ('TAX_SWAP_LIMIT_PERCENT', 'Tax Swap Limit (%)', 'Minimum tokens for tax swap as percentage', 'number', '2', '{"min": 1, "max": 500}', 15, true),
  ('MAX_SWAP_LIMIT_PERCENT', 'Max Swap Limit (%)', 'Maximum swap amount as percentage', 'number', '2', '{"min": 0.1, "max": 10}', 16, true),
  ('TAX_WALLET', 'Tax Wallet', 'Address to receive tax fees', 'address', NULL, '{"pattern": "^0x[a-fA-F0-9]{40}$"}', 17, true);

-- Insert sample ERC20 template (standardized version of the actual contract)
INSERT INTO contract_templates (
  name,
  description,
  source_code,
  version,
  category,
  tags
) VALUES (
  'Standard ERC20 Token',
  'A customizable ERC20 token with buy/sell taxes, max transaction limits, and marketing wallet',
  '// SPDX-License-Identifier: MIT

/*
Website: https://ellieeth.com
Telegram: t.me/EllieDog
X: x.com/EllieGoldERC
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

contract TOKEN is Context, IERC20, Ownable {
    using SafeMath for uint256;
    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowances;
    mapping (address => bool) private _isExcludedFromFee;
    mapping (address => bool) private bots;
    address payable private _taxWallet;

    uint256 private _initialBuyTax={{INITIAL_BUY_TAX}};
    uint256 private _initialSellTax={{INITIAL_SELL_TAX}};
    uint256 private _finalBuyTax={{FINAL_BUY_TAX}};
    uint256 private _finalSellTax={{FINAL_SELL_TAX}};
    uint256 private _reduceBuyTaxAt={{REDUCE_BUY_TAX_AT}};
    uint256 private _reduceSellTaxAt={{REDUCE_SELL_TAX_AT}};
    uint256 private _preventSwapBefore={{PREVENT_SWAP_BEFORE}};
    uint256 private _transferTax={{TRANSFER_TAX}};
    uint256 private _buyCount=0;

    uint8 private constant _decimals = {{DECIMALS}};
    uint256 private constant _tTotal = {{TOTAL_SUPPLY}} * 10**_decimals;
    string private constant _name = "{{TOKEN_NAME}}";
    string private constant _symbol = "{{TOKEN_SYMBOL}}"; 
    uint256 public _maxTxAmount = {{MAX_TX_AMOUNT_PERCENT}} * (_tTotal/100);
    uint256 public _maxWalletSize = {{MAX_WALLET_SIZE_PERCENT}} * (_tTotal/100);
    uint256 public _taxSwapLimit = {{TAX_SWAP_LIMIT_PERCENT}} * (_tTotal/1000);
    uint256 public _maxSwapLimitX = {{MAX_SWAP_LIMIT_PERCENT}} * (_tTotal/100);
    
    IUniswapV2Router02 private uniswapV2Router;
    address private uniswapV2Pair;
    bool private tradingOpen;
    bool private inSwap = false;
    bool private swapEnabled = false;
    uint256 private sellCount = 0;
    uint256 private lastSellBlock = 0;

    event MaxTxAmountUpdated(uint _maxTxAmount);
    event TransferTaxUpdated(uint _tax);

    modifier lockTheSwap {
        inSwap = true;
        _;
        inSwap = false;
    }

    constructor () payable {
        _taxWallet = payable({{TAX_WALLET}});
        _balances[_msgSender()] = _tTotal;
        _isExcludedFromFee[owner()] = true;
        _isExcludedFromFee[address(this)] = true;
        _isExcludedFromFee[_taxWallet] = true;

        emit Transfer(address(0), _msgSender(), _tTotal);
    }

    function name() public pure returns (string memory) {
        return _name;
    }

    function symbol() public pure returns (string memory) {
        return _symbol;
    }

    function decimals() public pure returns (uint8) {
        return _decimals;
    }

    function totalSupply() public pure override returns (uint256) {
        return _tTotal;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, _msgSender(), _allowances[sender][_msgSender()].sub(amount, "ERC20: transfer amount exceeds allowance"));
        return true;
    }

    function _approve(address owner, address spender, uint256 amount) private {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _transfer(address from, address to, uint256 amount) private {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(amount > 0, "Transfer amount must be greater than zero");
        uint256 taxAmount=0;
        if (from != owner() && to != owner()) {
            require(!bots[from] && !bots[to]);

            if(_buyCount==0){
                taxAmount = amount.mul((_buyCount>_reduceBuyTaxAt)?_finalBuyTax:_initialBuyTax).div(100);
            }
            if(_buyCount>0){
                taxAmount = amount.mul(_transferTax).div(100);
            }

            if (from == uniswapV2Pair && to != address(uniswapV2Router) && ! _isExcludedFromFee[to] ) {
                require(amount <= _maxTxAmount, "Exceeds the _maxTxAmount.");
                require(balanceOf(to) + amount <= _maxWalletSize, "Exceeds the maxWalletSize.");
                _buyCount++;
                taxAmount = amount.mul((_buyCount>_reduceBuyTaxAt)?_finalBuyTax:_initialBuyTax).div(100);
            }

            if(to == uniswapV2Pair && from!= address(this) ){
                taxAmount = amount.mul((_buyCount>_reduceSellTaxAt)?_finalSellTax:_initialSellTax).div(100);
            }

            uint256 contractTokenBalance = balanceOf(address(this));
            if (!inSwap && to == uniswapV2Pair && swapEnabled && contractTokenBalance > _taxSwapLimit && _buyCount > _preventSwapBefore) {
                if (block.number > lastSellBlock) {
                    sellCount = 0;
                }
                require(sellCount < 3, "Only 3 sells per block!");
                swapTokensForEth(min(amount, min(contractTokenBalance, _maxSwapLimitX)));
                uint256 contractETHBalance = address(this).balance;
                if (contractETHBalance > 0) {
                    sendETHToFee(address(this).balance);
                }
                sellCount++;
                lastSellBlock = block.number;
            }
        }

        if(taxAmount>0){
          _balances[address(this)]=_balances[address(this)].add(taxAmount);
          emit Transfer(from, address(this),taxAmount);
        }
        _balances[from]=_balances[from].sub(amount);
        _balances[to]=_balances[to].add(amount.sub(taxAmount));
        emit Transfer(from, to, amount.sub(taxAmount));
    }

    function min(uint256 a, uint256 b) private pure returns (uint256){
      return (a>b)?b:a;
    }

    function swapTokensForEth(uint256 tokenAmount) private lockTheSwap {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = uniswapV2Router.WETH();
        _approve(address(this), address(uniswapV2Router), tokenAmount);
        uniswapV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            0,
            path,
            address(this),
            block.timestamp
        );
    }

    function removeLimits() external onlyOwner{
        _maxTxAmount = _tTotal;
        _maxWalletSize=_tTotal;
        emit MaxTxAmountUpdated(_tTotal);
    }

    function sendETHToFee(uint256 amount) private {
        _taxWallet.transfer(amount);
    }

    function openTrading() external onlyOwner() {
        require(!tradingOpen,"trading is already open");
        uniswapV2Router = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
        _approve(address(this), address(uniswapV2Router), _tTotal);
        transfer(address(this), balanceOf(msg.sender).mul(97).div(100));
        uniswapV2Pair = IUniswapV2Factory(uniswapV2Router.factory()).createPair(address(this), uniswapV2Router.WETH());
        _approve(address(this), address(uniswapV2Router), type(uint256).max);
        uniswapV2Router.addLiquidityETH{value: address(this).balance}(address(this),balanceOf(address(this)),0,0,owner(),block.timestamp);
        IERC20(uniswapV2Pair).approve(address(uniswapV2Router), type(uint).max);
        swapEnabled = true;
        tradingOpen = true;
    }

    function openTradingV2() external onlyOwner() {
        require(!tradingOpen,"trading is already open");
        uniswapV2Router = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
        swapEnabled = true;
        tradingOpen = true;
    }

    function excludeFromFee(address account) external onlyOwner {
        _isExcludedFromFee[account] = true;
    }

    function includeInFee(address account) external onlyOwner {
        _isExcludedFromFee[account] = false;
    }

    function isExcludedFromFee(address account) external view returns (bool) {
        return _isExcludedFromFee[account];
    }

    receive() external payable {}

    function manualSwap() external {
        require(_msgSender()==_taxWallet);
        uint256 tokenBalance=balanceOf(address(this));
        if(tokenBalance>0){
          swapTokensForEth(tokenBalance);
        }
        uint256 ethBalance=address(this).balance;
        if(ethBalance>0){
          sendETHToFee(ethBalance);
        }
    }

    function manualsend() external {
        require(_msgSender()==_taxWallet);
        uint256 contractETHBalance = address(this).balance;
        sendETHToFee(contractETHBalance);
    }
}',
  '1.0.0',
  'Token',
  ARRAY['ERC20', 'token', 'tax', 'marketing', 'uniswap']
); 