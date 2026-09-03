import type { ReactNode } from 'react';

import {
  Bell,
  Bot,
  Boxes,
  ChevronDown,
  CircleDollarSign,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Settings,
  ShoppingBag,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

import {
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useState } from 'react';

import { LanguageSelector } from '../LanguageSelector';

import {
  getTranslations,
  useLanguage,
} from '../../i18n';

const iconMap = {
  dashboard: LayoutDashboard,
  sales: CircleDollarSign,
  purchases: ShoppingBag,
  products: Package,
  inventory: Boxes,
  expenses: ReceiptText,
  udhaar: WalletCards,
  customers: Users,
debt: CircleDollarSign,
  schemes: Landmark,
  coach: Bot,
  settings: Settings,
};

export function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const language = useLanguage();

  const loc = useLocation();
  const navigate = useNavigate();

  const t = getTranslations();

  const section =
    loc.pathname.split('/')[1];

  const title =
    (t.nav as any)[section] ??
    'Bizz Brains';

  void language;

  const nav = Object.entries(iconMap).map(
    ([key, Icon]) =>
      [
        `/${key}`,
        (t.nav as any)[key],
        Icon,
      ] as const,
  );

  const mobileNav = [
    [
      '/dashboard',
      'Home',
      LayoutDashboard,
    ],
    [
      '/sales',
      'Sales',
      CircleDollarSign,
    ],
    [
      '/inventory',
      'Stock',
      Boxes,
    ],
    [
      '/udhaar',
      'Udhaar',
      WalletCards,
    ],
    [
      '/coach',
      'Coach',
      Bot,
    ],
  ] as const;

  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${
          open ? 'open' : ''
        }`}
      >
        <div className="brand">
          <span className="brand-mark">
            B
          </span>

          <span>
            Bizz <b>Brains</b>

            <small>
              Your business. Smarter decisions.
            </small>
          </span>

          <button
            className="sidebar-close icon-button"
            onClick={() =>
              setOpen(false)
            }
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>

        <nav>
          {nav.map(
            ([
              to,
              label,
              Icon,
            ]) => (
              <NavLink
                to={to}
                onClick={() =>
                  setOpen(false)
                }
                key={to}
                className={({
                  isActive,
                }) =>
                  isActive
                    ? 'active'
                    : ''
                }
              >
                <Icon size={19} />
                {label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="profile">
          <div className="avatar">
            RK
          </div>

          <div>
            <strong>
              Ravi Kumar
            </strong>

            <span>
              Ravi Kirana Store
            </span>
          </div>

          <button
            title="Log out"
            onClick={() =>
              navigate('/login')
            }
            className="icon-button"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {open && (
        <button
          className="sidebar-scrim"
          aria-label="Close menu"
          onClick={() =>
            setOpen(false)
          }
        />
      )}

      <main>
        <header className="topbar">
          <div className="top-title">
            <button
              className="menu-button icon-button"
              onClick={() =>
                setOpen(true)
              }
              aria-label="Open menu"
            >
              <Menu />
            </button>

            <div>
              <span className="eyebrow">
                Ravi Kirana Store
              </span>

              <h1>
                {title}
              </h1>
            </div>
          </div>

          <div className="top-actions">
            <LanguageSelector />

            <button
              className="icon-button notify"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <i />
            </button>

            <button className="user-menu">
              <span className="avatar">
                RK
              </span>

              <span>
                Ravi
              </span>

              <ChevronDown
                size={15}
              />
            </button>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>

      <nav
        className="bottom-nav"
        aria-label="Main navigation"
      >
        {mobileNav.map(
          ([
            to,
            label,
            Icon,
          ]) => (
            <NavLink
              key={to}
              to={to}
              className={({
                isActive,
              }) =>
                isActive
                  ? 'active'
                  : ''
              }
            >
              <Icon size={20} />

              <span>
                {label}
              </span>
            </NavLink>
          ),
        )}
      </nav>
    </div>
  );
}
