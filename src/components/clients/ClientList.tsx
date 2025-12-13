'use client';

import { ClientListItem } from './ClientListItem';
import type { ClientSummary } from '@/lib/api';

export interface ClientListProps {
  clients: ClientSummary[];
}

export function ClientList({ clients }: ClientListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {clients.map((client, index) => (
        <div 
          key={client.clientName} 
          className="animate-slide-up"
          style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
        >
          <ClientListItem client={client} />
        </div>
      ))}
    </div>
  );
}

export default ClientList;
