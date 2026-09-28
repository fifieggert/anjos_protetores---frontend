import { useState } from "react";
import { Plus, Gift } from "lucide-react";
import Layout from "../../components/Layout";
import "./style.css";

interface Doacao {
    id: string;
    item: string;
    categoria: string;
    quantidade: string;
    entrada: string;
    doador: string;
}

const categorias = ["Todos", "Ração", "Limpeza", "Brinquedos", "Medicamento"];

export default function Doacoes() {
    const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");

    const doacoes: Doacao[] = [];

    return (
        <Layout active="doacoes">
            <div className="doacoes-page">
                <div className="doacoes-header">
                    <div>
                        <h1 className="doacoes-title">Doações & Estoque</h1>
                        <p className="doacoes-subtitle">Controle entradas e saídas de itens.</p>
                    </div>
                    <button className="doacoes-add-btn" type="button">
                        <Plus size={16} aria-hidden />
                        Nova doação
                    </button>
                </div>

                <div className="doacoes-filters">
                    {categorias.map((categoria) => (
                        <button
                            key={categoria}
                            type="button"
                            className={`doacoes-filter-pill${categoriaAtiva === categoria ? " doacoes-filter-pill--active" : ""}`}
                            onClick={() => setCategoriaAtiva(categoria)}
                        >
                            {categoria}
                        </button>
                    ))}
                </div>

                <div className="doacoes-table-wrap">
                    <table className="doacoes-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Categoria</th>
                                <th>Quantidade</th>
                                <th>Entrada</th>
                                <th>Doador</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doacoes.length === 0 && (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="doacoes-empty">
                                            <Gift size={28} aria-hidden />
                                            <p>Nenhuma doação registrada ainda.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}
