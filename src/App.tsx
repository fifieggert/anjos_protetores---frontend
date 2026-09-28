import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Animais from "./pages/Animais";
import Doacoes from "./pages/Doacoes";
import Adocoes from "./pages/Adocoes";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/animais" element={<Animais />} />
                <Route path="/doacoes" element={<Doacoes />} />
                <Route path="/adocoes" element={<Adocoes />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
