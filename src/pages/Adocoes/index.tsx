import { Heart } from "lucide-react";
import Layout from "../../components/Layout";
import "./style.css";

interface Solicitacao {
    id: string;
    solicitante: string;
    animal: string;
    data: string;
    status: "pendente" | "em_analise" | "aprovado" | "recusado";
}

export default function Adocoes() {
    const solicitacoes: Solicitacao[] = [];

    return (
        <Layout active="adocoes">
            <div className="adocoes-page">
                <div className="adocoes-header">
                    <h1 className="adocoes-title">Adoções</h1>
                    <p className="adocoes-subtitle">Acompanhe e gerencie todas as solicitações.</p>
                </div>

                <div className="adocoes-content">
                    <div className="adocoes-list">
                        {solicitacoes.length === 0 && (
                            <div className="adocoes-empty">
                                <Heart size={28} aria-hidden />
                                <p>Nenhuma solicitação de adoção ainda.</p>
                            </div>
                        )}
                    </div>

                    <div className="adocoes-detail adocoes-detail--empty">
                        <p>Selecione uma solicitação para ver os detalhes.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
