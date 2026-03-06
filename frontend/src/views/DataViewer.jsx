import React, { useState } from 'react';
import { Inbox, Search, ChevronDown, ChevronUp } from 'lucide-react';

function DataViewer({ clientes, nuevosIds, historialSubidas = [] }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClientes = clientes.filter(c =>
        (c.nombre_empresa && c.nombre_empresa.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.nit && c.nit.includes(searchTerm)) ||
        (c.nombre_completo && c.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="view-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Listado de Entradas</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Ve el detalle completo de todos los JSON recibidos ({clientes.length} total).</p>
                </div>

                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por empresa, NIT o contacto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 12px 12px 40px',
                            borderRadius: '0.75rem',
                            border: '1px solid var(--panel-border)',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'white',
                            outline: 'none',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>
            </div>

            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {filteredClientes.length === 0 ? (
                    <div className="empty-state">
                        <Inbox />
                        <p>No se encontraron registros que coincidan con la búsqueda.</p>
                    </div>
                ) : (
                    <div className="feed-container" style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                        {filteredClientes.map(cliente => (
                            <ClienteCard
                                key={cliente.id}
                                cliente={cliente}
                                isNew={nuevosIds.has(cliente.id)}
                                history={historialSubidas.find(h => h.cliente_nit === cliente.nit) || { subidas: 0 }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ClienteCard({ cliente, isNew, history }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="glass-panel client-card" style={{ background: 'rgba(255,255,255,0.03)', gap: '0' }}>
            {isNew && <div className="new-badge">¡NUEVO!</div>}

            <div
                className="client-header"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ cursor: 'pointer', userSelect: 'none', alignItems: 'center' }}
            >
                <div className="company-info" style={{ flex: 1 }}>
                    <div className="company-name" style={{ fontSize: '1.25rem' }}>{cliente.nombre_empresa || 'Empresa Sin Nombre'}</div>
                    <div className="brand" style={{ fontSize: '0.9rem' }}>{cliente.marca} • {cliente.dedicacion}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="badge">{cliente.nit}</div>
                    {isExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                </div>
            </div>

            {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--panel-border)', paddingTop: '1.5rem' }}>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Contacto</span>
                            <span className="info-value">{cliente.nombre_completo}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Email</span>
                            <span className="info-value">{cliente.correo_electronico}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Usuario</span>
                            <span className="info-value">{cliente.usuario}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Contraseña Registrada</span>
                            <span className="info-value" style={{ fontFamily: 'monospace', color: 'var(--secondary)' }}>
                                {cliente.contrasena ? '••••••••' : 'No provista'}
                            </span>
                        </div>
                    </div>

                    {cliente.preguntas_respuestas && cliente.preguntas_respuestas.length > 0 && (
                        <div className="questions-section">
                            <div className="questions-title">Formulario Interrogatorio (Cuestionario)</div>
                            <div className="qa-list">
                                {cliente.preguntas_respuestas.map((qa, i) => (
                                    <div key={i} className="qa-item">
                                        <div className="q">Q{i + 1}: {qa.pregunta}</div>
                                        <div className="a">
                                            {(Array.isArray(qa.respuestas) ? qa.respuestas.join(', ') : qa.respuestas) || 'Sin respuesta'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', marginTop: '0.5rem', border: '1px solid var(--panel-border)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Registro Analítico (Subidas al Data Hub)</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{history.subidas} Lotes Enviados</span>
                            {history.subidas > 0 && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Último: {new Date(history.ultima_subida).toLocaleString()}</span>
                            )}
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Cliente Creado: {new Date(cliente.fecha_creacion).toLocaleString()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataViewer;
