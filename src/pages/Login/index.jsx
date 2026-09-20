import { useState } from "react";
import { Mail, Lock, PawPrint } from "lucide-react";
import logo from "../../assets/logo.png";
import "./style.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [lembrar, setLembrar] = useState(false);
    const [enviando, setEnviando] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setEnviando(true);
        try {
            // TODO: integrar com o endpoint de login do backend quando estiver disponível
            console.log({ email, senha, lembrar });
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="login-screen">
            <div className="login-showcase">
                <div className="login-brand">
                    <img src={logo} alt="Anjos Protetores" />
                    <span>Anjos Protetores</span>
                </div>

                <div className="login-showcase-body">
                    <div className="login-paw">
                        <PawPrint size={40} aria-hidden />
                    </div>
                    <h1 className="login-title">Cuidar é um ato de amor.</h1>
                    <p className="login-subtitle">
                        Gerencie animais, doações e adoções do seu abrigo com simplicidade e carinho.
                    </p>
                </div>

                <p className="login-footer">© {new Date().getFullYear()} Anjos Protetores · Feito com ♥ no Brasil</p>

                <div className="login-blob login-blob--top" />
                <div className="login-blob login-blob--bottom" />
            </div>

            <div className="login-form-side">
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-brand login-mobile-brand">
                        <img src={logo} alt="Anjos Protetores" />
                        <span>Anjos Protetores</span>
                    </div>

                    <div>
                        <h2 className="login-heading">Bem-vinda de volta</h2>
                        <p className="login-subheading">Entre com sua conta para continuar.</p>
                    </div>

                    <div className="login-field-group">
                        <label className="login-field-label">
                            <span className="login-field-label-text">E-mail</span>
                            <div className="login-input-wrap">
                                <Mail size={16} aria-hidden />
                                <input
                                    className="login-input"
                                    type="email"
                                    required
                                    placeholder="mariana@anjos.org"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </div>
                        </label>

                        <label className="login-field-label">
                            <span className="login-field-label-text">Senha</span>
                            <div className="login-input-wrap">
                                <Lock size={16} aria-hidden />
                                <input
                                    className="login-input"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    autoComplete="current-password"
                                />
                            </div>
                        </label>
                    </div>

                    <div className="login-row-between">
                        <label className="login-remember">
                            <input
                                type="checkbox"
                                checked={lembrar}
                                onChange={(e) => setLembrar(e.target.checked)}
                            />
                            Lembrar de mim
                        </label>
                        <a className="login-link" href="#">
                            Esqueci minha senha
                        </a>
                    </div>

                    <button className="login-submit" type="submit" disabled={enviando}>
                        {enviando ? "Entrando..." : "Entrar"}
                    </button>

                    <p className="login-visitor">
                        Visitante?{" "}
                        <a className="login-link" href="/publico">
                            Conheça os animais para adoção
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}
