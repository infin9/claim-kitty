import * as React from 'react';



export function Header() {
  return (
    <header>
        <img className="logo" src="/Design/Logo.png" alt="ClaimKitty Logo" width="80px" height="80px"/>
        <div className="button" id="connect-wallet">
        Connect Wallet
        </div>
    </header>
  );
}