import React, { useEffect, useState } from "react";
import { QrReader } from 'react-qr-reader';
import { ethers } from "ethers";
import './App.css';

function App() {

  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [buttonText, setButtonText] = useState("Connect");
  const [data, setData] = useState('No data');
  const [isData, setIsData] = useState(false);

  const connect = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("Connected to Ethereum");
        setAccount(await window.ethereum.enable());
        setIsConnected(true);
      } catch (error) {
        console.log("User denied account access");
        setIsConnected(false);
      }
    }
  }

  const formatAddress = (address) => {
    if (address.length === 42) {
      return address.substring(0, 4) + "..." + address.substring(38);
    } else {
      return address;
    }
  }

  useEffect(() => {
    if (isConnected) {
      setButtonText(formatAddress(account[0]));
    }
  }, [isConnected]);

  // useEffect(() => {
  //   if (data) {
  //     setIsData(true);
  //   }
  // } , [data]);

  return (
    <div className="App">
      <button onClick={connect}>{buttonText}</button>
        <div className="scan">
          <h2 className="scan-title">Scan user QR Code</h2>
          {!isData ? (
            <QrReader
              delay={300}
              style={{ width: "100%" }}
              constraints={{ facingMode: "environment" }}
              onResult={(result, error) => {
                if (!!result) {
                  setData(result?.text);
                  setIsData(true);
                }
      
                if (!!error) {
                  console.info(error);
                }
              }}
              />
          ) : (
            <p>{data}</p>
          )}
        </div>
    </div>
  );
}

export default App;
