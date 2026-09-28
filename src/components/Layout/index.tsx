import type { ReactNode } from "react";
import { LayoutDashboard, PawPrint, Gift, Heart, BarChart3, Globe, LogOut, Bell, Search } from "lucide-react";
import logo from "../../assets/logo.png";
import "./style.css";

const navItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "animais", label: "Animais", icon: PawPrint },
    { key: "doacoes", label: "Doações", icon: Gift },
    { key: "adocoes", label: "Adoções", icon: Heart },
    { key: "relatorios", label: "Relatórios", icon: BarChart3 },
    { key: "area-publica", label: "Área Pública", icon: Globe },
];

interface LayoutProps {
    active: string;
    children: ReactNode;
}

export default function Layout({ active, children }: LayoutProps) {
    return (
        <div className="layout">
            <aside className="layout-sidebar">
                <div className="layout-brand">
                    <img src={logo} alt="Anjos Protetores" />
                    <span>
                        Anjos
                        <strong>Protetores</strong>
                    </span>
                </div>

                <nav className="layout-nav">
                    {navItems.map(({ key, label, icon: Icon }) => (
                        <div key={key} className={`layout-nav-item${active === key ? " layout-nav-item--active" : ""}`}>
                            <Icon size={18} aria-hidden />
                            {label}
                        </div>
                    ))}
                </nav>

                <div className="layout-nav-item layout-nav-item--exit">
                    <LogOut size={18} aria-hidden />
                    Sair
                </div>
            </aside>

            <div className="layout-content">
                <header className="layout-header">
                    <div className="layout-header-search">
                        <Search size={16} aria-hidden />
                        <input type="text" placeholder="Buscar animal, doador ou protocolo..." />
                    </div>

                    <div className="layout-header-actions">
                        <button className="layout-header-bell" aria-label="Notificações">
                            <Bell size={18} aria-hidden />
                        </button>
                        <div className="layout-header-user">
                            <span className="layout-header-avatar">U</span>
                        </div>
                    </div>
                </header>

                <main className="layout-main">{children}</main>
            </div>
        </div>
    );
}
