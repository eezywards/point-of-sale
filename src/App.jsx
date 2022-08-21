import React, { useEffect, useState } from "react";
import { QrReader } from 'react-qr-reader';
import { QRCodeSVG } from 'qrcode.react';
import { ethers } from "ethers";
import './App.css';
import { height } from "@mui/system";

function App() {

  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [buttonText, setButtonText] = useState("Connect");
  const [userAddress, setUserAddress] = useState('No data');
  const [isData, setIsData] = useState(false); // change to false if you want to show the QR reader
  const [bussinessId, setBussinessId] = useState("1"); //todo get from endpoint

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

  const sendTransaction = async (address, amount) => {
    const link = "https://eezypos.azurewebsites.net/api/transaction"
    const data = await fetch(link, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ethAddress: address,
        amount: amount.toFixed(2),
        businessId: bussinessId
    }
    )
    });
    const json = await data.json();
    console.log(json);
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
      setTotal(total - (total * discount / 100));
    }
  } , [discount]);

  return (
    <div className="App point-of-sale">
      {/* <div className="container-fluid">
        <div className="row">
          <div className="col-9 ls">
            <div className="container">
            <img className= "logoimg" src="img/logo/eezywards-logo.svg"/>
            <br></br>
              Products
              <div className="l-box">

              </div>
            </div>

          </div>
          <div className="col-3 rs">
            s
          </div>
        </div>
      </div> */}


      
      {!isData ? (
        <div className="initial-scan">
          <div className="container pt-4">
            <img className= "logoimg d-block mb-5" src="img/logo/eezywards-logo.png"/>
            <div className="title">Scan QR Code</div>
            <div className="qrsection">
            <QrReader
              delay={300}
              style={{ width: "100%"}}
              constraints={{ facingMode: "environment" }}
              onResult={(result, error) => {
                if (!!result) {
                  setUserAddress(result?.text);
                  setIsData(true);
                }

                if (!!error) {
                  console.info(error);
                }
              }}
            /></div>
          </div>
          <div className="foot">
            <div className="container">
              <div className="row">
                <div className="col-12 text-left">
                  <a href="/">Pizza Planeta</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {!checkout ? (
            <div className="container-fluid">
              <div className="product-selection row">
                <div className="col-9 ls">
                  <div className="container sp">
                    <img className= "logoimg" src="img/logo/eezywards-logo.png"/>
                    <p className="product-selection-title">Products</p>
                    <div className="l-box">
                      <div className="container">
                        {products.map(product => (
                          <div className="row product">
                            <div className="product-selection-item col-6" key={product.name}>
                              <p className="name">{product.name+" "}</p>
                              <p className="price">{"$"+product.price}</p>
                            </div>
                            <div className="col-sm-6 add-to-cart">
                              <button class="button type1" onClick={() => addToCart(product)}>Add to Cart</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="cart col-3 rs">
                  <div className="container">
                    <div className="cart-title">Order Summary</div>
                    {cart.map(item => (
                      <div className="cart-item" key={item.product}>
                        <div>
                        <p className="cart-item-name">{item.name}</p>
                        <p className="cart-item-count">{item.quantity}</p>
                        </div>
                        
                        {item.quantity > 0 ? (
                          <button class="button type3" onClick={() => removeFromCart(item)}><img className="trash-image" src="img/logo/trash.svg"/></button>
                        ) : (
                          <></>
                        )}
                      </div>
                    ))}
                    <p className="cart-total">Total: ${total.toFixed(2)}</p>
                    <button  class="button type2" onClick={() => setCheckout(true)}>Checkout</button>
                  </div>
                </div>
              </div>
              <div className="foot">
                <div className="container">
                  <div className="row">
                    <div className="col-12 text-left">
                      <a href="/">Pizza Planeta</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="container-fluid">
              <div className="product-selection row">
                <div className="col-9 ls">
                  <div className="container sp">
                    <img className= "logoimg" src="img/logo/eezywards-logo.png"/>
                    <p className="product-selection-title">Products</p>
                    <div className="l-box">
                      <div className="container">
                        {products.map(product => (
                          <div className="row product">
                            <div className="product-selection-item col-6" key={product.name}>
                              <p className="name">{product.name+" "}</p>
                              <p className="price">{"$"+product.price}</p>
                            </div>
                            <div className="col-sm-6 add-to-cart">
                              <button class="button type1" onClick={() => addToCart(product)}>Add to Cart</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="cart col-3 rs">
                  <div className="container">
                    <div className="cart-title">Order Summary</div>
                    {cart.map(item => (
                      <div className="cart-item" key={item.product}>
                        <div>
                        <p className="cart-item-name">{item.name}</p>
                        <p className="cart-item-count">{item.quantity}</p>
                        </div>
                        
                        {item.quantity > 0 ? (
                          <button class="button type3" onClick={() => removeFromCart(item)}><img className="trash-image" src="img/logo/trash.svg"/></button>
                        ) : (
                          <></>
                        )}
                      </div>
                    ))}
                    <p className="cart-total">Total: ${total.toFixed(2)}</p>
                    <button  class="button type2" onClick={() => setCheckout(true)}>Checkout</button>
                  </div>
                </div>
              </div>
              <div className="foot">
                <div className="container">
                  <div className="row">
                    <div className="col-12 text-left">
                      <a href="/">Pizza Planeta</a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="checkout">
                {hasCoupon ? ( // TODO: validate coupon ownership
                <div className="scan">
                  <h2 className="title">Scan coupon</h2>
                  <div className="qrsection">
                  <QrReader
                    delay={300}
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
                    videoStyle={{ width: '50vw' }}
                  />
                  </div>
                </div>
                ) : (
                  <div className="final">
                    <h2 className="checkout-title">Checkout</h2>
                    <QRCodeSVG value={"https://metamask.app.link/send/0xa395B7B0b0E1109599f8d3B4c1bC4436481378C3@80001?value=" + maticValue} />
                    <p className="checkout-total">Total: ${total.toFixed(2)}</p>
                    <button onClick={() => setHasCoupon(true)}>Add coupon</button>
                    <button onClick={() => sendTransaction(userAddress, total)}>Confirm purchase</button>
                  </div>
                )}
              </div>
            </div>
            
          )}
        </>
      )}
    </div>
  );
}

export default App;
