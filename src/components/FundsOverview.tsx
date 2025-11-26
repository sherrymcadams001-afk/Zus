import { ArrowDownRight, ArrowUpRight, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface Position {
  id: number;
  symbol: string;
  type: 'CALL' | 'PUT';
  entry: number;
  current: number;
  size: number;
  pnl: number;
  pnlPercent: number;
}

// Simulated positions
const POSITIONS: Position[] = [
  { id: 1, symbol: 'BTC', type: 'CALL', entry: 97200, current: 97450, size: 0.5, pnl: 125, pnlPercent: 0.26 },
  { id: 2, symbol: 'ETH', type: 'CALL', entry: 3380, current: 3420, size: 5.2, pnl: 208, pnlPercent: 1.18 },
  { id: 3, symbol: 'SOL', type: 'PUT', entry: 188, current: 185, size: 45, pnl: 135, pnlPercent: 1.60 },
  { id: 4, symbol: 'BNB', type: 'CALL', entry: 625, current: 618, size: 3.2, pnl: -22.4, pnlPercent: -1.12 },
  { id: 5, symbol: 'XRP', type: 'PUT', entry: 2.45, current: 2.52, size: 2500, pnl: -175, pnlPercent: -2.86 },
];

const WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f8AbC1';

/**
 * FundsOverview - Dense table with cognitive economy (icons over text)
 */
export function FundsOverview() {
  const totalPnL = POSITIONS.reduce((sum, p) => sum + p.pnl, 0);
  const totalValue = 24580.45;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-white/5 bg-orion-panel">
      {/* Header with Wallet */}
      <div className="border-b border-white/5 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-3 w-3 text-slate-500" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Portfolio
            </span>
          </div>
          <span
            className="cursor-pointer text-[9px] text-slate-600 transition-colors hover:text-orion-neon-blue"
            title={WALLET_ADDRESS}
          >
            {WALLET_ADDRESS.slice(0, 6)}...{WALLET_ADDRESS.slice(-4)}
          </span>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-2 border-b border-white/5 p-2">
        <div className="rounded bg-white/5 p-2">
          <div className="text-[9px] uppercase text-slate-600">Total Value</div>
          <div className="text-sm font-medium tabular-nums text-white">
            ${totalValue.toLocaleString()}
          </div>
        </div>
        <div className="rounded bg-white/5 p-2">
          <div className="text-[9px] uppercase text-slate-600">Session P&L</div>
          <div className={`flex items-center gap-1 text-sm font-medium tabular-nums ${
            totalPnL >= 0 ? 'text-orion-neon-green' : 'text-orion-neon-red'
          }`}>
            {totalPnL >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-[10px]">
          <thead className="sticky top-0 bg-orion-panel">
            <tr className="border-b border-white/5 text-[9px] uppercase text-slate-600">
              <th className="px-2 py-1.5 font-medium">Asset</th>
              <th className="px-2 py-1.5 font-medium text-center">Type</th>
              <th className="px-2 py-1.5 font-medium text-right">Size</th>
              <th className="px-2 py-1.5 font-medium text-right">P&L</th>
            </tr>
          </thead>
          <tbody>
            {POSITIONS.map((position) => (
              <tr
                key={position.id}
                className="border-b border-white/5 transition-colors hover:bg-white/5"
              >
                <td className="px-2 py-1.5">
                  <span className="font-medium text-white">{position.symbol}</span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  {position.type === 'CALL' ? (
                    <ArrowDownRight className="inline h-3 w-3 text-orion-neon-green" />
                  ) : (
                    <ArrowUpRight className="inline h-3 w-3 text-orion-neon-red" />
                  )}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-slate-400">
                  {position.size}
                </td>
                <td className={`px-2 py-1.5 text-right tabular-nums font-medium ${
                  position.pnl >= 0 ? 'text-orion-neon-green' : 'text-orion-neon-red'
                }`}>
                  {position.pnl >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
