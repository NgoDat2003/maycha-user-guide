import { Card, Badge, Tag } from 'antd';
import type { RoleTag } from '../types/guide';

export interface HeroRoleSelectorProps {
  counts: Record<'SITE' | 'ACCOUNTANT' | 'LEGAL' | 'ADMIN', number>;
  activeRole: RoleTag | null;
  onSelectRole: (role: RoleTag | null) => void;
}

const ROLE_CARDS: { role: Exclude<RoleTag, 'ALL'>; label: string; badge: string; color: string; desc: string }[] = [
  { role: 'SITE', label: 'Phòng Mặt bằng', badge: 'SITE', color: 'green', desc: 'Khảo sát, tiếp nhận & số hóa hợp đồng thuê' },
  { role: 'ACCOUNTANT', label: 'Phòng Kế toán', badge: 'ACCOUNTANT', color: 'blue', desc: 'Master Data, lịch thanh toán, phụ lục & xuất SAP' },
  { role: 'LEGAL', label: 'Phòng Pháp lý', badge: 'LEGAL', color: 'gold', desc: 'Hồ sơ pháp lý, cảnh báo hạn & thanh lý' },
  { role: 'ADMIN', label: 'Ban Giám đốc', badge: 'ADMIN', color: 'geekblue', desc: 'Điều hành 360°, quản trị người dùng & bảo mật' },
];

export function HeroRoleSelector({ counts, activeRole, onSelectRole }: HeroRoleSelectorProps) {
  return (
    <div className="hero-role-selector">
      <h2 className="hero-title">Bạn thuộc phòng ban nào? Chọn để xem đúng việc của mình</h2>
      <div className="hero-role-grid">
        {ROLE_CARDS.map((c) => {
          const isActive = activeRole === c.role;
          return (
            <Card
              key={c.role}
              className={`role-card ${isActive ? 'role-card-active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelectRole(isActive ? null : c.role)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRole(isActive ? null : c.role);
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Tag color={c.color}>{c.badge}</Tag>
                <Badge count={counts[c.role]} overflowCount={999} showZero color={c.color} />
              </div>
              <h3 style={{ margin: '4px 0', fontSize: 16, fontWeight: 700 }}>{c.label}</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>{c.desc}</p>
            </Card>
          );
        })}
      </div>
      {activeRole !== null && (
        <button type="button" className="role-reset" onClick={() => onSelectRole(null)}>
          ← Xem tất cả các phòng ban
        </button>
      )}
    </div>
  );
}
