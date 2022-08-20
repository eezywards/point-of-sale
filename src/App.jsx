import React, { useEffect, useState } from "react";
import { QrReader } from 'react-qr-reader';
import { QRCodeSVG } from 'qrcode.react';
import { ethers } from "ethers";
import './App.css';

function App() {

  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [buttonText, setButtonText] = useState("Connect");
  const [data, setData] = useState('No data');
  const [isData, setIsData] = useState(false); // change to false if you want to show the QR reader

  const [total, setTotal] = useState(0);
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [checkout, setCheckout] = useState(false);
  const [maticValue, setMaticValue] = useState(0);

  const [discount, setDiscount] = useState(0);
  const [hasCoupon, setHasCoupon] = useState(false);

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

  const getValueInMatic = async (value) => {
    const total = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=mxn");
    const totalJson = await total.json();
    const totalValue = totalJson["matic-network"]["mxn"];
    setMaticValue(value / totalValue * 1e18);
  }

  const getProducts = async () => {
    const data = await fetch("https://eezypos.azurewebsites.net/api/GetProducts");
    const products = await data.json();
    console.log(products.products);
    setProducts(products.products);
  }


  const addToCart = async (product) => {
    if (!cart.find(item => item.name === product.name)) {
      setCart([...cart, { ...product, quantity: 1 }]);
    } else {
      const newCart = cart.map(item => {
        console.log(item.name);
        console.log(product.name);
        if (item.name === product.name) {
          return { ...item, quantity: item.quantity + 1 };
        } else {
          return item;
        }
      }
      );
      setCart(newCart);
    }
    setTotal(total + parseFloat(product.price));
  }

  const removeFromCart = async (product) => {
    setCart(cart.map(item => {
      if (item.name === product.name) {
        if (item.quantity > 1) {
          return { ...item, quantity: item.quantity - 1 };
        } else {
          return cart.filter(item => item.name !== product.name);
        }
      } else {
        return item;
      }
    }
    ));

    setTotal(total - product.price);
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

  useEffect(() => {
    getProducts();
  }, []);

  useEffect(() => {
    getValueInMatic(total);
  }, [total]);

  useEffect(() => {
    if (discount > 0) {
      console.log("Discount: " + discount);
      console.log("Total: " + total);
      console.log(total * discount / 100);
      setTotal(total - (total * discount / 100));
    }
  } , [discount]);

  return (
    <div className="App">
      <button onClick={connect}>{buttonText}</button>
      {!isData ? (
        <div className="scan">
          <h2 className="scan-title">Scan user QR Code</h2>
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
        </div>
      ) : (
        <>
          {!checkout ? (
            <div className="product-selection">
              <h2 className="product-selection-title">Product Selection</h2>
              {products.map(product => (
                <div className="product-selection-item" key={product.name}>
                  <p className="product-selection-item-name">{product.name}</p>
                  <p className="product-selection-item-price">{product.price}</p>
                  <button onClick={() => addToCart(product)}>Add to Cart</button>
                </div>
              ))}
              <div className="cart">
                <h2 className="cart-title">Cart</h2>
                {cart.map(item => (
                  <div className="cart-item" key={item.product}>
                    <p className="cart-item-name">{item.name}</p>
                    {item.quantity > 0 ? (
                      <button onClick={() => removeFromCart(item)}>Remove from Cart</button>
                    ) : (
                      <></>
                    )}
                  </div>
                ))}
                <p className="cart-total">Total: ${total.toFixed(2)}</p>
              </div>
              <button onClick={() => setCheckout(true)}>Checkout</button>
            </div>
          ) : (
            <div className="checkout">
              {hasCoupon ? ( // TODO: validate coupon ownership
                <div className="scan">
                  <h2 className="scan-title">Scan coupon code</h2>
                  <QrReader
                    delay={300}
                    style={{ width: "100%" }}
                    constraints={{ facingMode: "environment" }}
                    onResult={(result, error) => {
                      if (!!result) {
                        setDiscount(result?.text.slice(0, 2));
                        console.log(discount);
                        setHasCoupon(false);
                      }
                      if (!!error) {
                        console.info(error);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="final">
                  <h2 className="checkout-title">Checkout</h2>
                  <QRCodeSVG value={"https://metamask.app.link/send/0xa395B7B0b0E1109599f8d3B4c1bC4436481378C3@80001?value=" + maticValue} />
                  <p className="checkout-total">Total: ${total.toFixed(2)}</p>
                  <button onClick={() => setHasCoupon(true)}>Add coupon</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
