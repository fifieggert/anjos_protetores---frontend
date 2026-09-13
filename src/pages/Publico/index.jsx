import { useState } from "react";
import { Link } from "react-router-dom";
import { PawPrint, Heart } from "lucide-react";
import logo from "../../assets/logo.png";
import "./style.css";

const FILTROS = ["Todos", "Cão", "Gato"];

export default function Publico() {
    const [filtro, setFiltro] = useState("Todos");

    return (
        <div className="publico-screen">
            <header className="publico-header">
                <div className="publico-brand">
                    <img src={logo} alt="Anjos Protetores" />
                    <span>Anjos Protetores</span>
                </div>

                <nav className="publico-nav">
                    <a href="#inicio">Início</a>
                    <a href="#animais">Animais</a>
                </nav>

                <Link className="publico-login-btn" to="/login">
                    Login
                </Link>
            </header>

            <main>
                <section className="publico-hero" id="inicio">
                    <span className="publico-badge">
                        <Heart size={14} aria-hidden />
                        Adoção responsável
                    </span>
                    <h1 className="publico-title">
                        Encontre um novo <span>melhor amigo</span>
                    </h1>
                    <p className="publico-subtitle">
                        Somos um abrigo dedicado a resgatar, cuidar e encontrar lares amorosos para cães e gatos.
                    </p>
                    <a className="publico-cta" href="#animais">
                        <PawPrint size={18} aria-hidden />
                        Quero adotar
                    </a>
                </section>

                <section className="publico-animais" id="animais">
                    <h2 className="publico-section-title">Disponíveis para adoção</h2>

                    <div className="publico-filtros">
                        {FILTROS.map((opcao) => (
                            <button
                                key={opcao}
                                type="button"
                                className={`publico-filtro${filtro === opcao ? " is-active" : ""}`}
                                onClick={() => setFiltro(opcao)}
                            >
                                {opcao}
                            </button>
                        ))}
                    </div>

                    <div className="publico-vazio">
                        <PawPrint size={32} aria-hidden />
                        <p>Nenhum animal cadastrado no momento. Volte em breve!</p>
                    </div>
                </section>
            </main>

            <footer className="publico-footer">
                <p>© {new Date().getFullYear()} Anjos Protetores · Feito com ♥ no Brasil</p>
            </footer>
        </div>
    );
}
