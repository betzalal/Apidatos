import React from 'react';
import { Users, Activity, DollarSign, Package } from 'lucide-react';

function DashboardView({ clientes, estadisticas }) {
    return (
        <div className="view-container">
            <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Resumen General</h2>
                <p style={{ color: 'var(--text-muted)' }}>Métricas principales en tiempo real.</p>
            </div>

            <div className="stats-grid">
                <StatsCard
                    title="Clientes Recibidos"
                    value={clientes.length}
                    icon={<Users size={28} color="#a5b4fc" />}
                />
                <StatsCard
                    title="Ventas Totales"
                    value={`$${estadisticas.ventas_totales.toLocaleString()}`}
                    icon={<Activity size={28} color="#ec4899" />}
                />
                <StatsCard
                    title="Ganancias Totales"
                    value={`$${estadisticas.ganancias.toLocaleString()}`}
                    icon={<DollarSign size={28} color="#10b981" />}
                />
                <StatsCard
                    title="Inventario Vendido"
                    value={estadisticas.productos_vendidos.toLocaleString()}
                    icon={<Package size={28} color="#fbbf24" />}
                />
            </div>

            {clientes.length > 0 && (
                <div className="glass-panel" style={{ marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} color="var(--primary)" /> Última Actividad
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Show only the latest 3 for the summary */}
                        {clientes.slice(0, 3).map(cliente => (
                            <div key={cliente.id} style={{
                                display: 'flex', justifyContent: 'space-between', padding: '1rem',
                                background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem',
                                borderLeft: '3px solid var(--primary)'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#fff' }}>{cliente.nombre_empresa}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{cliente.nombre_completo}</div>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {new Date(cliente.fecha_creacion).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatsCard({ title, value, icon }) {
    return (
        <div className="glass-panel stat-card" style={{ padding: '2rem' }}>
            <div className="stat-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                {icon}
                {title}
            </div>
            <div className="stat-value" style={{ fontSize: '3rem' }}>{value}</div>
        </div>
    );
}

export default DashboardView;
