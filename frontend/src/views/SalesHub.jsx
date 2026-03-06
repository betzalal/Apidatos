import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, ScatterChart, Scatter, ZAxis, Treemap, Cell, PieChart, Pie
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import { Activity, Map as MapIcon, Package, TrendingUp, DollarSign, Filter } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Coordenadas aproximadas para Bolivia centralizadas
const coordinatesMap = {
    "Norte": [-13.5, -66.5],
    "Sur": [-21.5, -64.5],
    "Este": [-17.5, -61.5],
    "Oeste": [-16.5, -68.5],
    "Centro": [-17.3, -65.9]
};

// Paleta clara y brillante, sin morados. Tonos azul claro, verde esmeralda, naranja, ámbar.
const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6'];

function SalesHub() {
    const [tiempoData, setTiempoData] = useState([]);
    const [regionData, setRegionData] = useState([]);
    const [productoData, setProductoData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states para Map
    const [mapFilterType, setMapFilterType] = useState('all'); // 'all', 'producto', 'monto_mayor', 'monto_menor'
    const [mapFilterValue, setMapFilterValue] = useState('');

    const fetchOlapData = async () => {
        try {
            // Re-fetch regular stats
            const [resTiempo, resProductos] = await Promise.all([
                fetch(`${SOCKET_URL}/api/olap/tiempo`),
                fetch(`${SOCKET_URL}/api/olap/productos`)
            ]);

            if (resTiempo.ok) setTiempoData(await resTiempo.json());
            if (resProductos.ok) {
                const prodData = await resProductos.json();
                setProductoData(prodData.sort((a, b) => b.rentabilidad - a.rentabilidad));
            }

            // Re-fetch region con parametros condicionales
            let mapUrl = `${SOCKET_URL}/api/olap/mapa`;
            if (mapFilterType !== 'all' && mapFilterValue) {
                mapUrl += `?filtroTipo=${mapFilterType}&filtroValor=${encodeURIComponent(mapFilterValue)}`;
            }
            const resMapa = await fetch(mapUrl);
            if (resMapa.ok) setRegionData(await resMapa.json());

        } catch (e) {
            console.error("Error cargando OLAP", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOlapData();

        const socket = io(SOCKET_URL);
        socket.on('nueva_venta_batch', () => {
            fetchOlapData();
        });

        return () => socket.close();
    }, [mapFilterType, mapFilterValue]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--primary)' }}>
            <div className="neon-pulse" style={{ fontSize: '1.5rem', fontWeight: 600 }}>Cargando Datasets (OLAP)...</div>
        </div>
    );

    // KPIs Calculations
    const totalRevenue = tiempoData.reduce((acc, curr) => acc + curr.ingresos, 0);
    const totalSales = regionData.reduce((acc, curr) => acc + curr.productos_vendidos, 0);

    // Formatear Data para el Treemap
    const treemapData = productoData.map((prod) => ({
        name: prod.nombre_producto,
        size: prod.rentabilidad,
        cantidad: prod.total_cantidad
    }));

    return (
        <div className="view-container sales-hub-dark" style={{ paddingBottom: '3rem' }}>

            {/* Header & KPIs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(90deg, #0ea5e9, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        My Datasets (Hub)
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>Procesamiento analítico en tiempo real de toda Bolivia</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-panel stat-card-neon" style={{ borderLeft: '4px solid #0ea5e9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ingresos Brutos Top-Level</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>${(totalRevenue / 1000).toFixed(1)}k</div>
                        </div>
                        <DollarSign size={36} color="#0ea5e9" opacity={0.8} />
                    </div>
                </div>

                <div className="glass-panel stat-card-neon" style={{ borderLeft: '4px solid #10b981' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Unidades Despachadas</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>{totalSales.toLocaleString()}</div>
                        </div>
                        <Package size={36} color="#10b981" opacity={0.8} />
                    </div>
                </div>

                <div className="glass-panel stat-card-neon" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Regiones Activas</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>{regionData.length}</div>
                        </div>
                        <MapIcon size={36} color="#f59e0b" opacity={0.8} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* ROW 1: Tendencia Temporal & TreeMap de Productos */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                    {/* Gráfico Temporal (Curved Area) */}
                    <div className="glass-panel neon-box" style={{ height: '400px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <Activity color="#0ea5e9" />
                            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Tendencia de Volumen de Operaciones</h3>
                        </div>
                        <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={tiempoData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorGlow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="fecha" stroke="var(--text-muted)" tickFormatter={(val) => val.split('-').slice(1).join('/')} axisLine={false} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: 'rgba(15, 17, 26, 0.95)', border: '1px solid #0ea5e9', borderRadius: '8px', boxShadow: '0 0 15px rgba(14, 165, 233, 0.3)' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Ingresos Brutos']}
                                />
                                <Area type="monotone" dataKey="ingresos" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorGlow)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Treemap (Rendimiento Dominante de Productos) */}
                    <div className="glass-panel neon-box" style={{ height: '400px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <Package color="#10b981" />
                            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Dominancia de Productos (Treemap)</h3>
                        </div>
                        <ResponsiveContainer width="100%" height="85%">
                            <Treemap
                                data={treemapData}
                                dataKey="size"
                                ratio={4 / 3}
                                stroke="#0f111a"
                                fill="#10b981"
                            >
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: 'rgba(15, 17, 26, 0.95)', border: '1px solid #10b981', borderRadius: '8px' }}
                                    formatter={(value, name, props) => [
                                        `$${Number(value).toLocaleString()}`, `Rentabilidad`
                                    ]}
                                />
                            </Treemap>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ROW 2: Mapa Geográfico & Métricas Desglosadas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                    {/* Mapa de Calor / Burbujas de Bolivia */}
                    <div className="glass-panel neon-box map-container-custom" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapIcon color="#f59e0b" />
                                <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Geografía Analítica Dinámica</h3>
                            </div>

                            {/* Sub-Pestañas / Menu para filtrar el mapa */}
                            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <select
                                    className="map-filter-select"
                                    value={mapFilterType}
                                    onChange={(e) => {
                                        setMapFilterType(e.target.value);
                                        if (e.target.value === 'all') setMapFilterValue('');
                                    }}
                                    style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', outline: 'none', cursor: 'pointer', padding: '0.25rem' }}
                                >
                                    <option value="all">Todo Bolivia</option>
                                    <option value="producto">Por Producto Mapeado</option>
                                    <option value="monto_mayor">Monto Mayor de Venta</option>
                                </select>

                                {mapFilterType !== 'all' && (
                                    <input
                                        type={mapFilterType === 'producto' ? "text" : "number"}
                                        placeholder={mapFilterType === 'producto' ? "Ej: Licencia..." : "Mínimo $"}
                                        value={mapFilterValue}
                                        onChange={(e) => setMapFilterValue(e.target.value)}
                                        style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', width: '120px' }}
                                    />
                                )}
                            </div>
                        </div>

                        <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <MapContainer center={[-16.2902, -63.5887]} zoom={5} style={{ height: "100%", width: "100%", background: '#090a0f' }} zoomControl={false}>
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; CARTO'
                                />
                                {regionData.map((reg, idx) => {
                                    const coords = coordinatesMap[reg.region] || [-16.2902, -63.5887];
                                    const radius = Math.max(10, Math.min(40, reg.volumen_dinero / 2000));

                                    return (
                                        <CircleMarker
                                            key={idx}
                                            center={coords}
                                            radius={radius}
                                            fillColor="#f59e0b"
                                            color="#fbbf24"
                                            weight={2}
                                            opacity={0.8}
                                            fillOpacity={0.5}
                                        >
                                            <Popup className="dark-popup">
                                                <div style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                    <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Zona {reg.region}</strong>
                                                    <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>${reg.volumen_dinero.toLocaleString()}</div>
                                                    <div style={{ color: '#aaa', fontSize: '0.9rem' }}>{reg.productos_vendidos} Unidades</div>
                                                </div>
                                            </Popup>
                                        </CircleMarker>
                                    );
                                })}
                            </MapContainer>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Gráfico 3: Matriz de Rentabilidad (Scatter) */}
                        <div className="glass-panel neon-box" style={{ height: '240px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <TrendingUp color="#3b82f6" />
                                <h3 style={{ fontSize: '1rem', color: '#fff' }}>Detector de Minas de Oro (Precio vs Demanda)</h3>
                            </div>
                            <ResponsiveContainer width="100%" height="85%">
                                <ScatterChart margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" dataKey="total_cantidad" name="Cantidad Vendida" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis type="number" dataKey="precio_promedio" name="Precio $" stroke="var(--text-muted)" tickFormatter={(val) => `$${val}`} fontSize={12} tickLine={false} axisLine={false} />
                                    <ZAxis type="number" dataKey="rentabilidad" range={[60, 400]} name="Rentabilidad Bruta" />
                                    <RechartsTooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        contentStyle={{ backgroundColor: 'rgba(15, 17, 26, 0.95)', border: '1px solid #3b82f6', borderRadius: '8px' }}
                                        formatter={(val, name) => {
                                            if (name === 'Precio $') return [`$${Number(val).toFixed(2)}`, 'Precio Promedio'];
                                            if (name === 'Rentabilidad Bruta') return [`$${Number(val).toLocaleString()}`, name];
                                            return [val, name];
                                        }}
                                    />
                                    <Scatter name="Productos" data={productoData} fill="#3b82f6" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Gráfico 4: Top 5 Productos (BarChart Vertical) */}
                        <div className="glass-panel neon-box" style={{ height: '240px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Package color="#f43f5e" />
                                <h3 style={{ fontSize: '1rem', color: '#fff' }}>Star Products (Top 5 Rendimiento)</h3>
                            </div>
                            <ResponsiveContainer width="100%" height="85%">
                                <BarChart layout="vertical" data={productoData.slice(0, 5)} margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" stroke="var(--text-muted)" tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} fontSize={12} />
                                    <YAxis type="category" dataKey="nombre_producto" stroke="var(--text-muted)" axisLine={false} tickLine={false} fontSize={12} width={100} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: 'rgba(15, 17, 26, 0.95)', border: '1px solid #f43f5e', borderRadius: '8px' }}
                                        formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Rentabilidad']}
                                    />
                                    <Bar dataKey="rentabilidad" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20}>
                                        {productoData.slice(0, 5).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default SalesHub;
