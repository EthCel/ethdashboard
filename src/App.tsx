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
  type etherscanResponse = {
    status: number,
    message: string,
    result: {
      ethbtc: number,
      ethbtc_timestamp: number,
      ethusd: number,
      ethusd_timestamp: number,
    }
  }
type T_PriceResponse = {
  ethbtc: number,
  ethusd: number,
}
  const [ethPrice, setEthPrice] = useState(0);
  const [gasObject, setGasObject] = useState<gasPriceSpread>({safe: 0, propose: 0, fast: 0});
  const [balance, setBalance] = useState(0);
  const [txList, setTxList] = useState<transactionObject[]>([{ to:"", value:"", gasUsed:"", hash:""}]);
  const [balanceDenomination, setBalanceDenomination] = useState<"eth" | "usd">("eth");
  const [priceDenomination, setPriceDenomination] = useState<"btc" | "usd">("usd");
  let timeoutId: ReturnType<typeof setTimeout>; 
  function truncAdd(tx: string) {
    const shortAdd = '0x' + tx.charAt(3) + tx.charAt(4) + '...' + tx.charAt(tx.length - 2) + tx.charAt(tx.length - 2);
    return shortAdd;
  }

  /* 
   * only use this function if you don't wanna use the api
  function rateChange(numPrice: number, denomPrice: number, amount: number) {
    const rate = (numPrice / denomPrice);
    return (amount * rate);
  }
  */

  const twoDigitPrecision = (num: number) => {
    num = Math.trunc(num * 100);
    return num / 100;
  }

  // theres a problem
  // i have two dependencies which cause the entire app to get rerendered
  // so price and balance go blank for a second while the data fills back in 
  // 
  // actually maybe this is all wrong idk can't tell
  useEffect(() => {
    const fetchPrice = async () => {
    const api_eth_price = `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=7U73E2G9C5NGIHAU6MGS644R933I2AFPKY`;
    const api_address_balance = 'https://api.etherscan.io/api?module=account&action=balance&address=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae&tag=latest&apikey=7U73E2G9C5NGIHAU6MGS644R933I2AFPKY';
      try {
        const responseBody = await fetch(api_eth_price);
        const jsonResponse = await responseBody.json();

        console.log(priceDenomination);
        if (priceDenomination === "usd") {
          setEthPrice(twoDigitPrecision(jsonResponse.result.ethusd));
        } else if (priceDenomination === "btc") {
          setEthPrice(jsonResponse.result.ethbtc);
        }
        // use this in case you don't wanna use the etherscan api // setEthPrice(prevPrice => getPriceChange(prevPrice));
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
    // simplest shit ever 
    // literally just fucking changing a string
    //
    // i think its stale state
    //
    // the idea is 
    //      change the currency (denomination)
    //      eth is default
    //      changing to usd multiplies balance by ethprice
    //      change to eth divides balance by ethprice
    //
    //      also maybe use attributes to color the selected denominator rate
    //
    //      then do the same for eth/btc 
    //      and btc usd 
    //      i think just multiply eth/usd and eth/btc
    const fetchAddBalance = async () => {
      const addBalanceApi = 'https://api.etherscan.io/api?module=account&action=balance&address=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae&tag=latest&apikey=7U73E2G9C5NGIHAU6MGS644R933I2AFPKY'
      const response_body = await fetch(addBalanceApi);
      const balance_api = await response_body.json();
      let ethBalance = balance_api.result * 10**(-18);

      if (balanceDenomination === "eth") {
        setBalance(prevbalance => ethBalance);
      } else {
        setBalance(ethPrice * ethBalance);
      }
    }

    const fetchTransactions = async () => {
      const transaction_api = 'https://api.etherscan.io/api?module=account&action=txlist&address=0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC&startblock=0&endblock=99999999&page=1&offset=3&sort=asc&apikey=7U73E2G9C5NGIHAU6MGS644R933I2AFPKY'
      const response_body = await fetch(transaction_api);
      const transactions = await response_body.json()
      const result = transactions.result;
      
      // truncate the addresses
      //    then do css 
      // get the balanace 
      //    why do i have balance api inside fetch price?
      // maybe do the event handlers to convert to diff exchange rates?
      // and do gas fees 
      //    get three numbers 
      //        i could make an object like for transactions
      //    make a long pill shape
      //        give it a gradient
      //    put three circles on it
      //        the cirlces don't have to move
      if (Array.isArray(result)) {
        setTxList(prevList => {
          const newTxs = result.map((tx: transactionObject) => ({
            // 0x + first two ... last two chars 
            to: tx.to == "" ? "none" : truncAdd(tx.to),
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
;
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
  }, [balanceDenomination, priceDenomination]); 

  // i think i need two denominations 
  // i cant do this dynamically i think its impossible
  //
  // one denom for price 
  // one for balance 
  return (
    <div className='dashboard'>
      <div className='price-container container'>
        <p className='container-title'>Ethereum Price:</p>
        <p className='price-data midfontsize'>{ethPrice}</p>
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
        <p className='balance-data midfontsize'>{balance}</p>
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
  );
}

export default App;

