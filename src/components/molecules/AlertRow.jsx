import React from 'react';
import { Avatar } from '../atoms/Avatar';

export function AlertRow({ initials, name, role, gap, colorClass }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors px-2 -mx-2 rounded-lg cursor-pointer">
      <div className="flex items-center gap-3">
        <Avatar initials={initials} colorClass={colorClass} />
        <div>
          <h4 className="text-sm font-semibold text-content-main">{name}</h4>
          <p className="text-xs text-content-muted">{role}</p>
        </div>
      </div>
      <div className="text-sm font-semibold text-danger bg-red-50 px-2 py-1 rounded-md">
        {gap}
      </div>
    </div>
  );
}
