import React, { useState, useEffect } from 'react';

function App() {
  // i don't think i need this at all
  interface gasPriceSpread {
    safe: number;
    propose: number;
    fast: number;
  }
  interface transactionObject {
    to: string; 
    value: number;
    gasUsed: number;
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
  const [ethPrice, setEthPrice] = useState(2672);
  const [gasObject, setGasObject] = useState<gasPriceSpread>({safe: 0, propose: 0, fast: 0})
  const [balance, setBalance] = useState(0);
  const [txList, setTxList] = useState<transactionObject[]> ( [{ to: "", value: 0, gasUsed: 0, }] )
  const [conversion, setConversion] = useState(0);
  let timeoutId: ReturnType<typeof setTimeout>; 

  useEffect(() => {
    const fetchPrice = async () => {
    //const api_eth_price = `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=7U73E2G9C5NGIHAU6MGS644R933I2AFPKY`;
    const api_address_balance = 'https://api.etherscan.io/api?module=account&action=balance&address=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae&tag=latest&apikey=7U73E2G9C5NGIHAU6MGS644R933I2AFPKY';
      try {
        //const responseBody = await fetch(api_eth_price);
        //const jsonResponse = await responseBody.json();

        // two digit precision without rounding
        //  const ethusd_rate = Math.floor(Number(jsonResponse.result.ethusd) * 100) / 100;
        setEthPrice(prevPrice => getPriceChange(prevPrice));
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
    // just use my address
    const fetchAddBalance = async () => {
      const addBalanceApi = 'https://api.etherscan.io/api?module=account&action=balance&address=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae&tag=latest&apikey=7U73E2G9C5NGIHAU6MGS644R933I2AFPKY'
      const response_body = await fetch(addBalanceApi);
      const balance_api = await response_body.json();
      let ethBalance = balance_api.result / 18;
      setBalance(ethBalance);
    }

    const fetchTransactions = async () => {
      const transaction_api = 'https://api.etherscan.io/api?module=account&action=txlist&address=0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC&startblock=0&endblock=99999999&page=1&offset=6&sort=asc&apikey=7U73E2G9C5NGIHAU6MGS644R933I2AFPKY'
      const response_body = await fetch(transaction_api);
      const transactions = await response_body.json()
      const result = transactions.result;
      if (Array.isArray(result)) {
        console.log(txList);
        result.map((tx: transactionObject) => {
          setTxList(prevlist => [
          ...prevlist,
          {to: tx.to, value: tx.value, gasUsed: tx.gasUsed}
          ]);
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

    const twoDigitPrecision = (num: number) => {
      num = Math.round(num * 100) / 100; 
      return num;
    }

    const fetchRepeatedly = () => {
      fetchPrice(); 
      fetchGas();
      fetchAddBalance();
      fetchTransactions();
      timeoutId = setTimeout(fetchRepeatedly, 2000 ); 
    };
    fetchRepeatedly(); 

    return () => clearTimeout(timeoutId); 
  }, []); 

  return (
    <div className='dashboard'>
      <div className='price-container container'>
        <p className='container-title'>Ethereum Price:</p>
        <p className='price-data midfontsize'>{ethPrice}</p>
        <div className='exchange-container'>
          <p className='exchange-button'>ETH/USD</p>
          <p className='exchange-button'>ETH/BTC</p>
          <p className='exchange-button'>BTC/USD</p>
        </div>
      </div>
      <div className='gas-container container'>
        <p className='container-title'>Gas Fees:</p>
        <p className='gas-data midfontsize'>{gasObject.safe}</p>
      </div>
      <div className='balance-container container'>
        <p className='container-title'>Account Balance:</p>
        <p className='balance-data midfontsize'>$2,801.11</p>
      </div>
      <div className='trans-container container'>
        <p className='container-title'>Recent Transactions:</p>
        <ul className='transaction-data midfontsize'>
          {txList.map(tx => 
            <>
              <li className='toAddress'>{tx.to}</li>
              <li className='txValue'>{tx.value}</li>
              <li className='txgasUsed'>{tx.gasUsed}</li>
            </>
            )}
        </ul>
      </div>
    </div>
  );
}

export default App;
