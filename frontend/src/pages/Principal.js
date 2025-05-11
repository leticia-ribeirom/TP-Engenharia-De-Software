import React, { useEffect, useState } from 'react';
import PaginaInicial from './componentsPrincipal/PaginaInicial';
import Disciplinas from './componentsPrincipal/Disciplinas';
import Estatisticas from './componentsPrincipal/Estatisticas';
import Configuracoes from './componentsPrincipal/Configuracoes';
import Sidebar from './componentsPrincipal/SideBar';
import "../css/Principal.css";
import axios from "axios";

function Principal() {
    const [username, setUsername] = useState('');
    const [selectedPage, setSelectedPage] = useState('Página Inicial');

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, []);

    const handleTabChange = (page) => {
        setSelectedPage(page);
    };

    return (
        <div id="webcrumbs-principal">
            <div className="flex w-full min-h-screen bg-white">
                <Sidebar handleTabChange={handleTabChange} /> {/* Passa a função de mudança de página para o Sidebar */}

                {/* Main Content */}
                <div className="flex-1 p-8">
                    <header className="mb-8 flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-800">Bem-vindo à Plataforma Educacional</h1>
                        <div className="flex items-center space-x-4">
                            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200">
                                <span className="material-symbols-outlined">notifications</span>
                            </button>
                            <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center hover:shadow-md transition-all duration-200">
                                <span className="material-symbols-outlined">person</span>
                            </div>
                        </div>
                    </header>

                    {/* Exibindo o conteúdo baseado no selectedPage */}
                    {selectedPage === 'Página Inicial' && <PaginaInicial />}
                    {selectedPage === 'Disciplinas' && <Disciplinas />}
                    {selectedPage === 'Estatísticas' && <Estatisticas />}
                    {selectedPage === 'Configurações' && <Configuracoes />}
                </div>
            </div>
        </div>
    );
}

export default Principal;
