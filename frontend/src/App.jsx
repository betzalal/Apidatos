import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  LayoutDashboard, Users, Activity, Inbox, DollarSign, Package,
  BarChart2, List, Settings, Menu
} from 'lucide-react';

import DashboardView from './views/DashboardView';
import DataViewer from './views/DataViewer';
import SalesHub from './views/SalesHub';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [conexionStatus, setConexionStatus] = useState('Conectando...');

  // Data state
  const [clientes, setClientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    ventas_totales: 0,
    ganancias: 0,
    productos_vendidos: 0
  });

  const [nuevosIds, setNuevosIds] = useState(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      try {
        const [clientesRes, mensualRes] = await Promise.all([
          fetch(`${SOCKET_URL}/api/clientes`),
          fetch(`${SOCKET_URL}/api/mensual`)
        ]);

        if (clientesRes.ok) {
          const data = await clientesRes.json();
          // Parse questions JSON string from DB
          const parsedData = data.map(item => ({
            ...item,
            preguntas_respuestas: item.preguntas_respuestas ? JSON.parse(item.preguntas_respuestas) : []
          }));
          setClientes(parsedData);
        }

        if (mensualRes.ok) {
          const data = await mensualRes.json();
          if (data.length > 0) {
            const totales = data.reduce((acc, curr) => ({
              ventas_totales: acc.ventas_totales + curr.ventas_totales,
              ganancias: acc.ganancias + curr.ganancias,
              productos_vendidos: acc.productos_vendidos + curr.productos_vendidos
            }), { ventas_totales: 0, ganancias: 0, productos_vendidos: 0 });
            setEstadisticas(totales);
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchData();

    // Setup Socket
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => setConexionStatus('En vivo'));
    newSocket.on('disconnect', () => setConexionStatus('Desconectado'));

    newSocket.on('nuevo_cliente', (cliente) => {
      const parsedCliente = {
        ...cliente,
        preguntas_respuestas: typeof cliente.preguntas_respuestas === 'string'
          ? JSON.parse(cliente.preguntas_respuestas)
          : cliente.preguntas_respuestas
      };

      setClientes(prev => [parsedCliente, ...prev]);

      // Destacar como nuevo
      setNuevosIds(prev => new Set([...prev, cliente.id]));
      setTimeout(() => {
        setNuevosIds(prev => {
          const next = new Set(prev);
          next.delete(cliente.id);
          return next;
        });
      }, 5000);
    });

    newSocket.on('nuevo_mensual', (stats) => {
      setEstadisticas(prev => ({
        ventas_totales: prev.ventas_totales + stats.ventas_totales,
        ganancias: prev.ganancias + stats.ganancias,
        productos_vendidos: prev.productos_vendidos + stats.productos_vendidos
      }));
    });

    newSocket.on('nueva_venta_batch', (data) => {
      // Trigger update if needed (will be handled by SalesHub itself if active)
    });

    return () => newSocket.close();
  }, []);

  return (
    <div className="layout-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar \${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <LayoutDashboard size={28} color="var(--primary)" />
          {isSidebarOpen && <span className="logo-text">Recepcion<span style={{ color: 'var(--secondary)' }}>Total</span></span>}
        </div>

        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={20} />
            {isSidebarOpen && <span>Resumen General</span>}
          </NavLink>
          <NavLink to="/datos" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <List size={20} />
            {isSidebarOpen && <span>Listado de Entradas</span>}
          </NavLink>
          <NavLink to="/sales" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} style={{ borderLeft: '3px solid var(--secondary)' }}>
            <Activity size={20} color="var(--secondary)" />
            {isSidebarOpen && <span style={{ color: 'var(--secondary)' }}>Sales Data Hub</span>}
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="status-badge-sidebar" style={{
            color: conexionStatus === 'En vivo' ? 'var(--accent)' : '#ef4444',
            borderColor: conexionStatus === 'En vivo' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
          }}>
            <div className="status-dot-sidebar" style={{
              background: conexionStatus === 'En vivo' ? 'var(--accent)' : '#ef4444',
              boxShadow: conexionStatus === 'En vivo' ? '0 0 8px var(--accent)' : 'none'
            }}></div>
            {isSidebarOpen && <span>{conexionStatus}</span>}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-header">
          <button className="menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu size={24} />
          </button>
          <div className="system-title">Centro de Control</div>
        </header>

        <div className="content-scroll">
          <Routes>
            <Route path="/" element={<DashboardView clientes={clientes} estadisticas={estadisticas} />} />
            <Route path="/datos" element={<DataViewer clientes={clientes} nuevosIds={nuevosIds} />} />
            <Route path="/sales" element={<SalesHub />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
