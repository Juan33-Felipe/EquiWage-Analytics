import React from 'react';
import { Button } from '../atoms/Button';
import { ArrowRight } from 'lucide-react';

export function HeroCard() {
  return (
    <div className="bg-gradient-to-br from-primary-hover to-primary-light rounded-xl shadow-soft p-6 flex flex-col justify-between text-white relative overflow-hidden">
      <div className="relative z-10">
        <p className="text-xs font-semibold tracking-wider text-white/80 uppercase mb-2">
          Compensation Equity Pla...
        </p>
        <p className="text-sm font-medium text-white/90 mb-1">Total Adjustment Budget</p>
        <h2 className="text-4xl font-bold mb-2 tracking-tight">$128,450</h2>
        <p className="text-xs text-white/80 max-w-[200px]">
          Estimated budget to address internal equity gaps
        </p>
      </div>
      
      <div className="flex items-end justify-between relative z-10 mt-6">
        <div>
          <p className="text-[10px] text-white/80 mb-1">Median target<br/>fulfillment</p>
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= 3 ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
            <span className="text-xs font-bold ml-2">72%</span>
          </div>
        </div>
        <Button variant="dark" className="pl-4 pr-3 py-2 gap-2 text-xs">
          Simulate<br/>Budget <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4" />
    </div>
  );
}
