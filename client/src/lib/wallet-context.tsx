import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>;
  isPhantomInstalled: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: PublicKey }>;
      disconnect: () => Promise<void>;
      signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>;
      signTransaction: (transaction: Transaction) => Promise<Transaction>;
      on: (event: string, callback: () => void) => void;
      off: (event: string, callback: () => void) => void;
      publicKey: PublicKey | null;
    };
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);

  useEffect(() => {
    const checkPhantom = () => {
      const isInstalled = typeof window !== "undefined" && !!window.solana?.isPhantom;
      setIsPhantomInstalled(isInstalled);
      
      if (isInstalled && window.solana?.publicKey) {
        setPublicKey(window.solana.publicKey.toString());
        setConnected(true);
      }
    };

    if (typeof window !== "undefined") {
      if (document.readyState === "complete") {
        checkPhantom();
      } else {
        window.addEventListener("load", checkPhantom);
        return () => window.removeEventListener("load", checkPhantom);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.solana?.isPhantom) {
      const handleConnect = () => {
        if (window.solana?.publicKey) {
          setPublicKey(window.solana.publicKey.toString());
          setConnected(true);
        }
      };
      
      const handleDisconnect = () => {
        setConnected(false);
        setPublicKey(null);
      };

      const handleAccountChange = () => {
        if (window.solana?.publicKey) {
          setPublicKey(window.solana.publicKey.toString());
        } else {
          setConnected(false);
          setPublicKey(null);
        }
      };

      window.solana.on("connect", handleConnect);
      window.solana.on("disconnect", handleDisconnect);
      window.solana.on("accountChanged", handleAccountChange);

      return () => {
        window.solana?.off("connect", handleConnect);
        window.solana?.off("disconnect", handleDisconnect);
        window.solana?.off("accountChanged", handleAccountChange);
      };
    }
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;
    
    if (!window.solana?.isPhantom) {
      window.open("https://phantom.app/", "_blank");
      return;
    }

    setConnecting(true);
    try {
      const response = await window.solana.connect();
      setPublicKey(response.publicKey.toString());
      setConnected(true);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (window.solana) {
      window.solana.disconnect();
    }
    setConnected(false);
    setPublicKey(null);
  }, []);

  const signAndSendTransaction = useCallback(async (transaction: Transaction): Promise<{ signature: string }> => {
    if (!window.solana || !connected) {
      throw new Error("Wallet not connected");
    }
    
    try {
      const result = await window.solana.signAndSendTransaction(transaction);
      return result;
    } catch (error) {
      console.error("Failed to sign and send transaction:", error);
      throw error;
    }
  }, [connected]);

  return (
    <WalletContext.Provider
      value={{
        connected,
        connecting,
        publicKey,
        connect,
        disconnect,
        signAndSendTransaction,
        isPhantomInstalled,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
