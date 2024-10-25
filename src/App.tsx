import React, { useState, useEffect } from 'react';

function App() {
  interface gasPriceSpread {
    safe: number;
    propose: number;
    fast: number;
  }
  interface transactionObject {
    to: string; 
    value: string;
    gasUsed: string;
    hash: string
  }
  const [priceObject, setPriceObject] = useState({ethusd: 2500, ethbtc: 0.300});
  const [gasObject, setGasObject] = useState<gasPriceSpread>({safe: 10.00, propose: 20.00, fast: 30.00});
  const [balance, setBalance] = useState(0);
  const [txList, setTxList] = useState<transactionObject[]>([{ to:"", value:"", gasUsed:"", hash:""}]);
  const [balanceDenomination, setBalanceDenomination] = useState<"eth" | "usd">("eth");
  const [priceDenomination, setPriceDenomination] = useState<"btc" | "usd">("usd");
  const [address, setAddress] = useState("0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae");
  let timeoutId: ReturnType<typeof setTimeout>; 

  // eth price (eth/usd and eth/btc)
  // balance (eth/usd)
  //
  // rendering price (eth/usd eth/btc)
  // rendering balance (usd/eth eth/usd)
  //
  // don't mutate price or balance 
  // when to render eth/usd?
  //    when multiple = 1
  //        onClick will set multiple to 1 
  // when to render eth/btc?
  //    when multiple = something
  //        fetchPrice() will set multiple

  useEffect(() => {
    const fetchPrice = async () => {
    const api_eth_price = `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=7U73E2G9C5NGIHAU6MGS644R933I2AFPKY`;
      try {
        const responseBody = await fetch(api_eth_price);
        const jsonResponse = await responseBody.json();
        setPriceObject({
          ethusd: jsonResponse.result.ethusd,
          ethbtc: jsonResponse.result.ethbtc,
          });
      } catch (error) {
        console.error('Error fetching Ethereum price:', error);
      }
    };
    const fetchGas = async () => {
      const gas_api = 'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=7U73E2G9C5NGIHAU6MGS644R933I2AFPKY';
      const raw_gas_apiResponseBody = await fetch(gas_api);
      const gasApi = await raw_gas_apiResponseBody.json();
      setGasObject({
        safe: gasApi.result.SafeGasPrice,
        propose: gasApi.result.ProposeGasPrice,
        fast: gasApi.result.FastGasPrice,
        });

    }
    const fetchAddBalance = async () => {
      let addBalanceApi = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=7U73E2G9C5NGIHAU6MGS644R933I2AFPKY`;
      const response_body = await fetch(addBalanceApi);
      const balance_api = await response_body.json();
      let ethBalance = balance_api.result * 10**(-18);
      setBalance(prevbalance => ethBalance);
    }

    const fetchTransactions = async () => {
      const transaction_api = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=3&sort=asc&apikey=7U73E2G9C5NGIHAU6MGS644R933I2AFPKY`
      const response_body = await fetch(transaction_api);
      const transactions = await response_body.json()
      const result = transactions.result;
      
      if (Array.isArray(result)) {
        setTxList(prevList => {
          const newTxs = result.map((tx: transactionObject) => ({
            to: tx.to === "" ? "none" : truncAdd(tx.to),
            value: tx.value,
            gasUsed: tx.gasUsed,
            hash: tx.hash
          }));
          
          return newTxs;
        });
      } else {
        console.error("Result is not an array");
      }
    }

    const getPriceChange = (price: number) => {
      let change = Math.random() < .5 
      ? 1 + Math.random() * .00075 
      : 1 - Math.random() * .00075;
      return twoDigitPrecision(price * change);
    };


    const fetchRepeatedly = () => {
      fetchPrice(); 
      fetchGas();
      fetchAddBalance();
      fetchTransactions();
      timeoutId = setTimeout(fetchRepeatedly, 2000 ); 
    };
    fetchRepeatedly(); 

    return () => clearTimeout(timeoutId); 
  }, [balanceDenomination, priceDenomination, address]); 

const twoDigitPrecision = (num: number) => {
  num = Math.trunc(num * 100);
  return num / 100;
}

function truncAdd(tx: string) {
  const shortAdd = '0x' + tx.charAt(3) + tx.charAt(4) + '...' + tx.charAt(tx.length - 2) + tx.charAt(tx.length - 2);
  return shortAdd;
}

function weiToEth(wei: string) {
  return Number(wei) * 10**(-18);
}

const handleButtonClick = (e: React.FormEvent) => {
    const inputElement = document.querySelector('input'); 
    if (inputElement) {
      setAddress(inputElement.value); 
      inputElement.value = ''; 
    }
};


  // maybe something like 
  // instead of {ethPrice}
  //            {adjustEthPrice(priceDenomination)}
  //            maybe i pass in ethprice too idk
  //            but this function returns the corrected price for eth 
  //            so ethPrice stays pure
  return (
    <>
      <div className='address-container'>
        <input className='address-input' type='text' placeholder='Enter your address'/>
        <button onClick={handleButtonClick}>submit</button>
      </div>
      <div className='dashboard'>
        <div className='price-container container'>
          <p className='container-title'>Ethereum Price:</p>
          <p className='price-data midfontsize'>{priceDenomination === "usd" ? priceObject.ethusd : priceObject.ethbtc}</p>
          <div className='exchange-container'>
            <p className='exchange-button' onClick={() => setPriceDenomination("usd")} >ETH/USD</p>
            <p className='exchange-button' onClick={() => setPriceDenomination("btc")}>ETH/BTC</p>
          </div>
          <div className='arrow'></div>
        </div>
        <div className='gas-container container'>
            <p className='container-title'>Gas Fees:</p>
            <div className='gas-labels'>
              <p className=''>SAFE</p> 
              <p className=''>CURRENT</p>
              <p className=''>FAST</p>
            </div>
            <div className='gas-meter'></div> 
            <div className='gas-prices'>
              <p className='safe gas-data midfontsize'>{twoDigitPrecision(gasObject.safe)}</p>
              <p className='propose gas-data midfontsize'>{twoDigitPrecision(gasObject.propose)}</p>
              <p className='fast gas-data midfontsize'>{twoDigitPrecision(gasObject.fast)}</p>
            </div>
        </div>
        <div className='balance-container container'>
          <p className='container-title'>Account Balance:</p>
          <p className='balance-data midfontsize'>{balanceDenomination === "eth" ? balance : twoDigitPrecision(balance * priceObject.ethusd)}</p>
          <div className='exchange-container'>
            <p className='exchange-button' onClick={() => setBalanceDenomination("eth")}>ETH</p>
            <p className='exchange-button' onClick={() => setBalanceDenomination("usd")}>USD</p>
          </div>
        </div>
        <div className='trans-container container'>
          <p className='container-title'>Recent Transactions:</p>
            <div className='transaction-info-container'>
              <p className='address-header'>Address</p>
              <p className='gas-header'>Gas Fee</p>
              <p className='value-header'>Value</p>
            </div>
          <ul className='transaction-data midfontsize'>
            {txList.map(tx => 
              <>
                <li className='txto'>{tx.to}</li>
                <li className='txgas'>{tx.gasUsed}</li>
                <li className='txvalue'>{tx.value}</li>
              </>
              )}
          </ul>
        </div>
      </div>
    </>
  );
}

export default App;

