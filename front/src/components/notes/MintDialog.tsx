import { useState, useEffect } from 'react';
import { estimateGasMint, mintWithURI, onNoteMinted, offNoteMinted, loadAbi } from '../../services/contract';

type Props = {
  open: boolean;
  onClose: () => void;
  tokenURI: string;
  digest: string;
  date: string; // ISO date or timestamp
  to: string; // address
  onMinted?: (tokenId: number, txHash: string) => void;
}

const MintDialog = ({ open, onClose, tokenURI, digest, date, to, onMinted }: Props) => {
  const [estimGas, setEstimGas] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTxHash(null);
    setBusy(false);

    // 初始化时加载 ABI
    (async () => {
      try {
        await loadAbi();
      } catch (e) {
        console.error('Failed to load contract ABI:', e);
      }
    })();

    const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
    // If contract address is missing, set an informational notice but continue — mintWithURI will use mock path.
    if (!CONTRACT_ADDRESS) {
      setInfo('合约地址未配置 — 将使用本地模拟铸造（非链上）');
    } else {
      setInfo(null);
    }

    // estimate gas (best-effort). If estimate fails, keep null and allow minting.
    (async () => {
      try {
        const gas = await estimateGasMint(to, tokenURI, digest, Date.parse(date) || 0);
        setEstimGas(Number(gas.toString()));
      } catch (e: any) {
        setEstimGas(null);
      }
    })();

    const handler = (_tokenId: number, owner: string, _d: string, _dt: number) => {
      // if `to` is empty, accept any owner (useful for mock flows where `to` is not provided)
      if (!to || owner.toLowerCase() === to.toLowerCase()) {
        if (onMinted) onMinted(_tokenId, txHash || '');
      }
    };

    let registeredGlobal = false;
    try {
      onNoteMinted(handler);
    } catch (e) {
      // contract not available — register global fallback
      try {
        // 使用动态 import 替代 require
        (async () => {
          const contractModule = await import('../../services/contract');
          contractModule.__registerOnNoteMinted(handler);
          registeredGlobal = true;
        })();
      } catch (e) {}
    }

    return () => {
      try { offNoteMinted(); } catch (e) {}
      if (registeredGlobal) {
        try {
          // 使用动态 import 替代 require
          (async () => {
            const contractModule = await import('../../services/contract');
            contractModule.__unregisterOnNoteMinted();
          })();
        } catch (e) {}
      }
    };
  }, [open]);

  async function handleMint() {
    setBusy(true);
    setError(null);
    if (!tokenURI) {
      setError('tokenURI 缺失，无法铸造');
      setBusy(false);
      return;
    }
  // allow mint even if CONTRACT_ADDRESS missing (will use mock behavior)
    try {
      // 修改后的代码 - 保留完整的 IPFS URI
      const tx = await mintWithURI(to, tokenURI, digest, Date.parse(date) || 0);
      setTxHash(tx.hash || tx.transactionHash || null);
      await tx.wait();
      if (onMinted) onMinted(1, tx.hash || tx.transactionHash || '');
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>确认铸造 NFT</h3>
        <div className="form-row">
          <label>Token URI</label>
          <div className="small">{tokenURI}</div>
        </div>
        <div className="form-row">
          <label>Digest</label>
          <div className="small">{digest}</div>
        </div>
        <div className="form-row">
          <label>估算 Gas</label>
          <div className="small">{estimGas ? estimGas : '无法估算'}</div>
        </div>
        {txHash && <div className="form-row"><label>Tx</label><div className="small">{txHash}</div></div>}
  {info && <div className="form-row"><label>提示</label><div className="small">{info}</div></div>}
  {error && <div className="form-row"><label style={{color: 'red'}}>错误</label><div className="small">{error}</div></div>}
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose} disabled={busy}>取消</button>
          <button className="btn" onClick={handleMint} disabled={busy}>{busy ? '铸造中...' : '确认铸造'}</button>
        </div>
      </div>
    </div>
  );
}

export default MintDialog;
