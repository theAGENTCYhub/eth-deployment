async function main() {
    const hre = require("hardhat");
    const { ethers } = hre;
  
    const UNISWAP_V2_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const UNISWAP_V2_ROUTER_ABI = [
      "function factory() external view returns (address)",
      "function WETH() external pure returns (address)"
    ];
  
    const router = await ethers.getContractAt(UNISWAP_V2_ROUTER_ABI, UNISWAP_V2_ROUTER_ADDRESS);
    
    const factoryAddress = await router.factory();
    const wethAddress = await router.WETH();
  
    console.log("✅ Uniswap V2 Router found!");
    console.log("Factory address:", factoryAddress);
    console.log("WETH address:", wethAddress);
  }
  
  main().catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });