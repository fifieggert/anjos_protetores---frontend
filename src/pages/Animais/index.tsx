import { useMemo, useState } from "react";
import { Plus, Search, PawPrint } from "lucide-react";
import Layout from "../../components/Layout";
import "./style.css";

type StatusAnimal = "disponivel" | "em_tratamento" | "em_espera" | "adotado";

interface Animal {
    id: string;
    nome: string;
    especie: string;
    raca: string;
    porte: "Pequeno" | "Médio" | "Grande";
    idade: string;
    status: StatusAnimal;
    vacinado: boolean;
    castrado: boolean;
    foto?: string;
}

const filtros: { key: "todos" | StatusAnimal; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "disponivel", label: "Disponível" },
    { key: "em_tratamento", label: "Em tratamento" },
    { key: "em_espera", label: "Em espera" },
    { key: "adotado", label: "Adotado" },
];

export default function Animais() {
    const [busca, setBusca] = useState("");
    const [filtroAtivo, setFiltroAtivo] = useState<(typeof filtros)[number]["key"]>("todos");

    const animais: Animal[] = [];

    const animaisFiltrados = useMemo(() => {
        return animais.filter((animal) => {
            const correspondeStatus = filtroAtivo === "todos" || animal.status === filtroAtivo;
            const correspondeBusca =
                busca.trim() === "" ||
                animal.nome.toLowerCase().includes(busca.toLowerCase()) ||
                animal.especie.toLowerCase().includes(busca.toLowerCase());
            return correspondeStatus && correspondeBusca;
        });
    }, [animais, busca, filtroAtivo]);

    return (
        <Layout active="animais">
            <div className="animais-page">
                <div className="animais-header">
                    <div>
                        <h1 className="animais-title">Gestão de animais</h1>
                        <p className="animais-subtitle">{animaisFiltrados.length} animais encontrados</p>
                    </div>
                    <button className="animais-add-btn" type="button">
                        <Plus size={16} aria-hidden />
                        Cadastrar animal
                    </button>
                </div>

                <div className="animais-toolbar">
                    <div className="animais-search">
                        <Search size={16} aria-hidden />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou espécie..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>

                    <div className="animais-filters">
                        {filtros.map((filtro) => (
                            <button
                                key={filtro.key}
                                type="button"
                                className={`animais-filter-pill${filtroAtivo === filtro.key ? " animais-filter-pill--active" : ""}`}
                                onClick={() => setFiltroAtivo(filtro.key)}
                            >
                                {filtro.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="animais-empty">
                    <div className="animais-empty-icon">
                        <PawPrint size={32} aria-hidden />
                    </div>
                    <h2>Nenhum animal cadastrado</h2>
                    <p>Cadastre o primeiro animal do abrigo para começar a gerenciar a adoção.</p>
                    <button className="animais-add-btn" type="button">
                        <Plus size={16} aria-hidden />
                        Cadastrar animal
                    </button>
                </div>
            </div>
        </Layout>
    );
}
