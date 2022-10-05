import * as React from 'react';


import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'



export function Header() {

  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  })
  const { disconnect } = useDisconnect()
  
  return (
    <header>
        <img className="logo" src="/Design/Logo.png" alt="ClaimKitty Logo" width="80px" height="80px"/>
        {
          isConnected === false ? 
          <div className="button" id="connect-wallet" onClick={()=>connect()}>
            Connect Wallet
          </div>
          :
          <div style={{position: "absolute", top: 15, right: 15, textAlign:"right"}}>
            <span>Connected Wallet : {address?.slice(0, 6)}.......{address?.slice(address!.length - 5, address!.length)}</span>
            <br/>
            <a href="#" onClick={(e)=>{e.preventDefault();disconnect()}}>Disconnect</a>
          </div>

        }
    </header>
  );
}