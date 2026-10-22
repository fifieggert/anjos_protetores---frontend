import axios from "axios";
import { lerToken } from "../utils/armazenamento";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Rotas públicas (/publico/*): instância sem interceptores, para não enviar o token de
// quem estiver logado nem tratar um erro como sessão expirada.
export const apiPublica = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Chamado quando uma requisição autenticada recebe 401 (token inválido ou expirado).
// O AuthProvider registra aqui o logout + redirecionamento para /login.
let aoNaoAutorizado: (() => void) | null = null;

export function registrarAoNaoAutorizado(callback: () => void) {
    aoNaoAutorizado = callback;
    return () => {
        if (aoNaoAutorizado === callback) aoNaoAutorizado = null;
    };
}

api.interceptors.request.use((config) => {
    const token = lerToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const ehLogin = axios.isAxiosError(error) && error.config?.url?.endsWith("/auth/login");
        if (axios.isAxiosError(error) && error.response?.status === 401 && !ehLogin) {
            aoNaoAutorizado?.();
        }
        return Promise.reject(error);
    },
);
