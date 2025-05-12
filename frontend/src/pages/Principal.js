import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Disciplinas from './componentsPrincipal/Disciplinas';
import Estatisticas from './componentsPrincipal/Estatisticas';
import Configuracoes from './componentsPrincipal/Configuracoes';
import Sidebar from './componentsPrincipal/SideBar';
import "../css/Principal.css";

function Principal() {
    const [username, setUsername] = useState('');
    const [selectedPage, setSelectedPage] = useState('Disciplinas');
    const navigate = useNavigate();  // Adicionei o hook de navegação

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, []);

    const handleTabChange = (page) => {
        setSelectedPage(page);
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('access_token');
            
            const response = await fetch('http://localhost:8000/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                //localStorage.removeItem('username');
                //localStorage.removeItem('access_token');
                // Limpa todo o localStorage
                localStorage.clear();
                navigate('/'); // em "App.js" a página de login já está mapeada para a rota raiz
            } else {
                console.error('Erro ao fazer logout');
            }
        } catch (error) {
            console.error('Erro na conexão com o servidor:', error);
        }
    };

    return (
        <div id="webcrumbs-principal">
            <div className="flex w-full min-h-screen bg-white">
                <Sidebar handleTabChange={handleTabChange} handleLogout={handleLogout} /> {/* Passa a função de mudança de página para o Sidebar, e logout */}

                {/* Main Content */}
                <div className="flex-1 p-8">
                    <header className="mb-8 flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-800">
                            {selectedPage === 'Disciplinas' && 'Bem-vindo, ' + username + '!'}
                            {selectedPage === 'Estatísticas' && 'Estatísticas'}
                            {selectedPage === 'Configurações' && 'Configurações'}
                        </h1>
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
                    {selectedPage === 'Disciplinas' && <Disciplinas />}
                    {selectedPage === 'Estatísticas' && <Estatisticas />}
                    {selectedPage === 'Configurações' && <Configuracoes />}
                </div>
            </div>
        </div>
    );
}

export default Principal;