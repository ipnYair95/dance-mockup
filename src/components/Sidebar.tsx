import { Plus, User } from 'lucide-react';
import type { Dancer } from '../types';

interface SidebarProps {
  dancers: Dancer[];
  onAddDancer: () => void;
}

export function Sidebar({ dancers, onAddDancer }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span>Performers</span>
        <button className="add-dancer-btn" onClick={onAddDancer} title="Add Dancer">
          <Plus size={18} />
        </button>
      </div>
      
      <div className="dancers-list">
        {dancers.map(dancer => (
          <div key={dancer.id} className="dancer-item">
            <User size={16} style={{ marginRight: '10px' }} />
            <span>{dancer.name}</span>
            <div 
              className="dancer-color" 
              style={{ backgroundColor: dancer.color }}
            />
          </div>
        ))}
      </div>
    </aside>
  );
}
