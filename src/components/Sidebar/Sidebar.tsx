import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import type { Dancer, Shape } from '../../types';
import styles from './Sidebar.module.scss';

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
  { shape: 'star', label: 'Star', Icon: ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24"><polygon points="12,1.2 15.53,7.15 22.27,8.66 17.71,13.85 18.35,20.74 12,18 5.65,20.74 6.29,13.85 1.73,8.66 8.47,7.15" fill="currentColor" /></svg> },
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

  const handleSave = useCallback(() => {
    onUpdate({ name: name.trim() || dancer.name, color, shape });
    onClose();
  }, [name, color, shape, dancer.name, onUpdate, onClose]);

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
  }, [handleSave]);

  return (
    <div
      ref={panelRef}
      className={styles.editPanel}
    >
      {/* Name */}
      <div className={styles.field}>
        <label className={styles.label}>Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
          autoFocus
          className={styles.nameInput}
        />
      </div>

      {/* Shape */}
      <div className={styles.field}>
        <label className={styles.label}>Shape</label>
        <div className={styles.shapeRow}>
          {SHAPE_OPTIONS.map(({ shape: s, label, Icon }) => (
            <button
              key={s}
              title={label}
              onClick={() => setShape(s)}
              className={styles.shapeButton}
              style={{
                border: `2px solid ${shape === s ? color : 'var(--border-color)'}`,
                background: shape === s ? 'var(--bg-hover)' : 'transparent',
                color: shape === s ? color : 'var(--text-muted)',
              }}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Color grid */}
      <div className={styles.field}>
        <label className={styles.label}>Color</label>
        <div className={styles.colorGrid}>
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={styles.colorButton}
              style={{
                backgroundColor: c,
                border: color === c ? '2px solid white' : '2px solid transparent',
                outline: color === c ? '2px solid rgba(255,255,255,0.5)' : 'none',
              }}
            />
          ))}
        </div>
        {/* Custom color picker */}
        <div className={styles.customColorRow}>
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className={styles.colorInput}
          />
          <span className={styles.hexValue}>{color}</span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          onClick={handleSave}
          className={styles.saveButton}
        >
          <Check size={14} /> Save
        </button>
        <button
          onClick={() => { onDelete(); onClose(); }}
          className={styles.deleteButton}
          title="Delete dancer"
        >
          <Trash2 size={14} />
        </button>
        <button
          onClick={onClose}
          className={styles.cancelButton}
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
  const editingDancer = editingId !== null ? dancers.find(d => d.id === editingId) : null;

  const DancerShape = ({ dancer }: { dancer: Dancer }) => {
    switch (dancer.shape) {
      case 'square':
        return <svg width="14" height="14" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2" fill={dancer.color} /></svg>;
      case 'triangle':
        return <svg width="14" height="14" viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22" fill={dancer.color} /></svg>;
      case 'star':
        return <svg width="14" height="14" viewBox="0 0 24 24"><polygon points="12,1.2 15.53,7.15 22.27,8.66 17.71,13.85 18.35,20.74 12,18 5.65,20.74 6.29,13.85 1.73,8.66 8.47,7.15" fill={dancer.color} /></svg>;
      default:
        return <svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill={dancer.color} /></svg>;
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <span>Performers</span>
        <button className={styles.addDancerBtn} onClick={onAddDancer} title="Add Dancer">
          <Plus size={18} />
        </button>
      </div>

      <div className={styles.dancersList}>
        {dancers.map(dancer => (
          <div
            key={dancer.id}
            className={styles.dancerRow}
          >
            <div
              className={`${styles.dancerItem} ${editingId === dancer.id ? styles.isActive : ''}`}
              onClick={() => setEditingId(editingId === dancer.id ? null : dancer.id)}
            >
              <DancerShape dancer={dancer} />
              <span style={{ flex: 1, marginLeft: '8px', fontSize: '13px' }}>{dancer.name}</span>
              <Pencil size={13} style={{ opacity: 0.4, flexShrink: 0 }} />
            </div>
          </div>
        ))}
      </div>

      {editingDancer && (
        <DancerEditPanel
          dancer={editingDancer}
          onUpdate={(updates) => onUpdateDancer(editingDancer.id, updates)}
          onDelete={() => onDeleteDancer(editingDancer.id)}
          onClose={() => setEditingId(null)}
        />
      )}
    </aside>
  );
}
