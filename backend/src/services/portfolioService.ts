/**
 * Portfolio Service
 * 
 * Handles portfolio operations and trading statistics.
 */

import { Env, Portfolio, Trade, ApiResponse } from '../types';

/**
 * Get user portfolio
 */
export async function getUserPortfolio(env: Env, userId: number): Promise<Portfolio | null> {
  const portfolio = await env.DB.prepare(
    'SELECT * FROM portfolios WHERE user_id = ?'
  ).bind(userId).first<Portfolio>();
  
  return portfolio;
}

/**
 * Create portfolio for new user
 */
export async function createPortfolio(env: Env, userId: number): Promise<Portfolio> {
  const timestamp = Math.floor(Date.now() / 1000);
  
  const result = await env.DB.prepare(
    `INSERT INTO portfolios (user_id, total_invested, total_pnl, total_trades, winning_trades, losing_trades, updated_at)
     VALUES (?, 0, 0, 0, 0, 0, ?)
     RETURNING *`
  ).bind(userId, timestamp).first<Portfolio>();
  
  if (!result) {
    throw new Error('Failed to create portfolio');
  }
  
  return result;
}

/**
 * Record a trade and update portfolio
 */
export async function recordTrade(
  env: Env,
  userId: number,
  sessionId: number | null,
  symbol: string,
  side: 'BUY' | 'SELL',
  price: number,
  quantity: number,
  pnl: number
): Promise<ApiResponse<{ trade: Trade; portfolio: Portfolio }>> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create trade record
    const trade = await env.DB.prepare(
      `INSERT INTO trades (user_id, session_id, symbol, side, price, quantity, pnl, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`
    ).bind(userId, sessionId, symbol, side, price, quantity, pnl, timestamp).first<Trade>();
    
    if (!trade) {
      return { status: 'error', error: 'Failed to create trade' };
    }
    
    // Update portfolio statistics
    const portfolio = await getUserPortfolio(env, userId);
    if (!portfolio) {
      return { status: 'error', error: 'Portfolio not found' };
    }
    
    const newTotalPnL = portfolio.total_pnl + pnl;
    const newTotalTrades = portfolio.total_trades + 1;
    const newWinningTrades = pnl > 0 ? portfolio.winning_trades + 1 : portfolio.winning_trades;
    const newLosingTrades = pnl < 0 ? portfolio.losing_trades + 1 : portfolio.losing_trades;
    
    const updatedPortfolio = await env.DB.prepare(
      `UPDATE portfolios 
       SET total_pnl = ?, total_trades = ?, winning_trades = ?, losing_trades = ?, updated_at = ?
       WHERE user_id = ?
       RETURNING *`
    ).bind(newTotalPnL, newTotalTrades, newWinningTrades, newLosingTrades, timestamp, userId).first<Portfolio>();
    
    if (!updatedPortfolio) {
      return { status: 'error', error: 'Failed to update portfolio' };
    }
    
    return {
      status: 'success',
      data: { trade, portfolio: updatedPortfolio },
    };
  } catch (error) {
    console.error('Record trade error:', error);
    return { status: 'error', error: 'Failed to record trade' };
  }
}

/**
 * Get trade history
 */
export async function getTradeHistory(
  env: Env,
  userId: number,
  limit = 50,
  offset = 0
): Promise<Trade[]> {
  const trades = await env.DB.prepare(
    `SELECT * FROM trades 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`
  ).bind(userId, limit, offset).all<Trade>();
  
  return trades.results;
}
