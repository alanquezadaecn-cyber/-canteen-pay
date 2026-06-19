import React from 'react';
import { Card, CardContent } from './ui/Card';
import { cn } from '../lib/utils';

interface BalanceCardProps {
  balance: string;
  name: string;
  className?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  name,
  className
}) => {
  const balanceNumber = parseFloat(balance);

  return (
    <Card
      className={cn(
        'bg-gradient-to-br from-slate-900 to-slate-800 border-0 text-white overflow-hidden relative',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent"></div>
      <CardContent className="relative pt-8 pb-8">
        <div className="flex justify-between items-start mb-12">
          <div>
            <p className="text-sm text-slate-400 mb-2">Saldo Disponible</p>
            <h2 className="text-4xl font-bold">
              ${balanceNumber.toFixed(2)}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-slate-500">Titular</p>
            <p className="text-sm font-medium text-white">{name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Estado</p>
            <p className="text-sm font-medium text-emerald-400">Activo</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
