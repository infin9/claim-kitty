import { SUPPORTED_CHAINS } from 'app/chains';
import * as React from 'react';
import styled from 'styled-components';

import {
  useAccount,
  useConnect,
  useDisconnect,
  useNetwork,
  useSwitchNetwork,
} from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { chain, chains } = useNetwork();
  const { switchNetwork, pendingChainId } = useSwitchNetwork({
    throwForSwitchChainNotSupported: true,
    onError: (errr, variables) => {
      const chainId = variables.chainId;
      const chain = SUPPORTED_CHAINS.find(c => c.chain.id == chainId);
      if (chain) {
        console.log(chain.parseJSONForMetamask);
        try {
          window.ethereum
            ?.request({
              method: 'wallet_addEthereumChain',
              params: [chain.parseJSONForMetamask],
            })
            .catch(e => {
              alert(
                "Couldn't add the network. Try again after adding this network to your wallet",
              );
            });
        } catch (e) {
          console.log(e);
          alert(
            "Couldn't switch to this network. Try again after adding this network to your wallet",
          );
        }
      }
    },
  });
  const { disconnect } = useDisconnect();

  function switchToNetwork(chainIdString: string | undefined) {
    if (switchNetwork) {
      if (chainIdString !== undefined) {
        const chainId = parseInt(chainIdString);
        switchNetwork(chainId);
      }
    }
  }

  return (
    <header>
      <div className="iconContainer">
        <div className="icon" id="twitter-icon"></div>
        <div className="icon" id="discord-icon"></div>
        <div className="icon" id="flarum-icon"></div>
      </div>

      <img
        className="logo"
        src="/Design/Logo.png"
        alt="ClaimKitty Logo"
        width="80px"
        height="80px"
      />
      {isConnected === false ? (
        <div className="button" id="connect-wallet" onClick={() => connect()}>
          Connect Wallet
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 15,
            right: 15,
            textAlign: 'right',
          }}
        >
          <b>Connected</b>
          <br />
          <b>
            Wallet: {address?.slice(0, 8)}.......
            {address?.slice(address!.length - 8, address!.length)} (
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                disconnect();
              }}
            >
              Disconnect
            </a>
            )
          </b>
          <br />
          <span>
            <b>Network: </b>
            <ChainSelect
              value={chain?.id}
              onChange={e => {
                switchToNetwork(e.target.value);
              }}
            >
              {SUPPORTED_CHAINS.findIndex(c => c.chain.id == chain?.id) ===
                -1 && <option>Unsupported Network</option>}
              {SUPPORTED_CHAINS.map(c => (
                <option key={c.chain.id} value={c.chain.id}>
                  {c.chain.name}
                </option>
              ))}
            </ChainSelect>
          </span>
        </div>
      )}
    </header>
  );
}

const ChainSelect = styled.select`
  border-radius: 10px;
  padding: 0px 5px;
  border: none;
  margin-top: 2px;
`;
