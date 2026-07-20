import { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import type { Dancer, Shape } from '../types';

interface SidebarProps {
  dancers: Dancer[];
  onAddDancer: () => void;
  onUpdateDancer: (id: string, updates: Partial<{ name: string; color: string; shape: Shape }>) => void;
  onDeleteDancer: (id: string) => void;
}

const PRESET_COLORS = [
  '#E91E63', '#F44336', '#FF5722', '#FF9800',
  '#FFC107', '#CDDC39', '#4CAF50', '#009688',
  '#00BCD4', '#2196F3', '#3F51B5', '#9C27B0',
  '#E040FB', '#FFFFFF', '#90A4AE',
];

const SHAPE_OPTIONS: { shape: Shape; label: string; Icon: React.FC<{ size: number }> }[] = [
  { shape: 'circle', label: 'Circle', Icon: ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor" /></svg> },
  { shape: 'square', label: 'Square', Icon: ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2" fill="currentColor" /></svg> },
  { shape: 'triangle', label: 'Triangle', Icon: ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22" fill="currentColor" /></svg> },
];

function DancerEditPanel({
  dancer,
  onUpdate,
  onDelete,
  onClose,
}: {
  dancer: Dancer;
  onUpdate: (updates: Partial<{ name: string; color: string; shape: Shape }>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(dancer.name);
  const [color, setColor] = useState(dancer.color);
  const [shape, setShape] = useState<Shape>(dancer.shape);
  const panelRef = useRef<HTMLDivElement>(null);

  // Save on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleSave();
      }
    };
    // Slight delay so the click that opened the panel doesn't immediately close it
    setTimeout(() => document.addEventListener('mousedown', handler), 10);
    return () => document.removeEventListener('mousedown', handler);
  }, [name, color, shape]);

  const handleSave = () => {
    onUpdate({ name: name.trim() || dancer.name, color, shape });
    onClose();
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        left: '220px',
        top: 0,
        zIndex: 100,
        width: '220px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Name */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
          autoFocus
          style={{
            width: '100%',
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '6px 8px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Shape */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Shape</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {SHAPE_OPTIONS.map(({ shape: s, label, Icon }) => (
            <button
              key={s}
              title={label}
              onClick={() => setShape(s)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: '6px',
                border: `2px solid ${shape === s ? color : 'var(--border-color)'}`,
                background: shape === s ? 'var(--bg-hover)' : 'transparent',
                color: shape === s ? color : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Color grid */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Color</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '50%',
                backgroundColor: c,
                border: color === c ? '2px solid white' : '2px solid transparent',
                outline: color === c ? '2px solid rgba(255,255,255,0.5)' : 'none',
                cursor: 'pointer',
                transition: 'transform 0.1s',
              }}
            />
          ))}
        </div>
        {/* Custom color picker */}
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0, background: 'none' }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{color}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            padding: '7px', borderRadius: '6px', fontSize: '12px',
            background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer'
          }}
        >
          <Check size={14} /> Save
        </button>
        <button
          onClick={() => { onDelete(); onClose(); }}
          style={{
            padding: '7px 10px', borderRadius: '6px', fontSize: '12px',
            background: 'rgba(244,67,54,0.15)', color: '#f44336',
            border: '1px solid rgba(244,67,54,0.3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Delete dancer"
        >
          <Trash2 size={14} />
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '7px 10px', borderRadius: '6px', fontSize: '12px',
            background: 'var(--bg-hover)', color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Cancel"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ dancers, onAddDancer, onUpdateDancer, onDeleteDancer }: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const DancerShape = ({ dancer }: { dancer: Dancer }) => {
    switch (dancer.shape) {
      case 'square':
        return <svg width="14" height="14" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2" fill={dancer.color} /></svg>;
      case 'triangle':
        return <svg width="14" height="14" viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22" fill={dancer.color} /></svg>;
      default:
        return <svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill={dancer.color} /></svg>;
    }
  };

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
          <div
            key={dancer.id}
            style={{ position: 'relative' }}
          >
            <div
              className={`dancer-item ${editingId === dancer.id ? 'active' : ''}`}
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setEditingId(editingId === dancer.id ? null : dancer.id)}
            >
              <DancerShape dancer={dancer} />
              <span style={{ flex: 1, marginLeft: '8px', fontSize: '13px' }}>{dancer.name}</span>
              <Pencil size={13} style={{ opacity: 0.4, flexShrink: 0 }} />
            </div>

            {editingId === dancer.id && (
              <DancerEditPanel
                dancer={dancer}
                onUpdate={(updates) => onUpdateDancer(dancer.id, updates)}
                onDelete={() => onDeleteDancer(dancer.id)}
                onClose={() => setEditingId(null)}
              />
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
