import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, MapPin, Route, Weight, DollarSign, Percent, ArrowRight, Loader2, Truck, Save, Trash2, CheckCircle2, Building2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { saveQuote, getClients, saveClient, Client } from '../utils/storage';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngBoundsExpression } from 'leaflet';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customTollIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapUpdater({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

interface TollPoint {
  lat: number;
  lng: number;
  cost: number;
  name: string;
}

interface RouteData {
  coordinates: [number, number][];
  tollPoints: TollPoint[];
  bounds: LatLngBoundsExpression | null;
  originCoords: [number, number];
  destCoords: [number, number];
}

interface FreightData {
  clientName: string;
  origin: string;
  destination: string;
  distance: string;
  axes: number;
  cargoType: string;
  inputMode: 'PER_KM' | 'PER_TON';
  valuePerKm: string;
  driverFreightPerTonInput: string;
  tollValue: string;
  weight: string;
  margin: string;
  icms: string;
  dieselPrice: string;
  averageConsumption: string;
  driverCommissionPercent: string;
}

interface Coordinates {
  lat: number;
  lon: number;
}

interface FreightQuoteProps {
  companyId: string;
}

export default function FreightQuote({ companyId }: FreightQuoteProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [routeData, setRouteData] = useState<RouteData | null>(null);

  useEffect(() => {
    setClients(getClients(companyId));
  }, [companyId]);

  const initialData: FreightData = {
    clientName: '',
    origin: '',
    destination: '',
    distance: '',
    axes: 6,
    cargoType: 'Carga Geral',
    inputMode: 'PER_TON',
    valuePerKm: '',
    driverFreightPerTonInput: '',
    tollValue: '',
    weight: '',
    margin: '',
    icms: '',
    dieselPrice: '',
    averageConsumption: '',
    driverCommissionPercent: ''
  };

  const [formData, setFormData] = useState<FreightData>(initialData);
  const [isLoadingDistance, setIsLoadingDistance] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setSaveSuccess(false);
  };

  const clearFields = () => {
    setFormData(initialData);
    setSaveSuccess(false);
    setDistanceError(null);
    setRouteData(null);
  };

  const fetchCoordinates = async (city: string): Promise<Coordinates | null> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      }
      return null;
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      return null;
    }
  };

  const calculateToll = (distance: number, axes: number) => {
    // Estimativa mais realista: R$ 0.18 por KM por Eixo (média das principais concessões)
    return distance * axes * 0.18;
  };

  const calculateDistance = async () => {
    if (!formData.origin || !formData.destination) {
      setDistanceError("Preencha origem e destino.");
      return;
    }

    setIsLoadingDistance(true);
    setDistanceError(null);

    try {
      const originCoords = await fetchCoordinates(formData.origin);
      const destCoords = await fetchCoordinates(formData.destination);

      if (!originCoords || !destCoords) {
        setDistanceError("Não foi possível encontrar as coordenadas das cidades.");
        setIsLoadingDistance(false);
        return;
      }

      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}?overview=full&geometries=geojson`);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Math.round(route.distance / 1000);
        const estimatedToll = calculateToll(distanceKm, formData.axes);
        
        const coordinates: [number, number][] = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        
        const tollPoints: TollPoint[] = [];
        const tollIntervalKm = 100;
        const numTolls = Math.floor(distanceKm / tollIntervalKm);
        
        if (numTolls > 0) {
          const tollCost = estimatedToll / numTolls;
          const step = Math.floor(coordinates.length / (numTolls + 1));
          for (let i = 1; i <= numTolls; i++) {
            tollPoints.push({
              lat: coordinates[i * step][0],
              lng: coordinates[i * step][1],
              cost: tollCost,
              name: `Pedágio ${i}`
            });
          }
        } else if (estimatedToll > 0) {
           tollPoints.push({
              lat: coordinates[Math.floor(coordinates.length / 2)][0],
              lng: coordinates[Math.floor(coordinates.length / 2)][1],
              cost: estimatedToll,
              name: `Pedágio Único`
           });
        }

        const bounds = L.latLngBounds(coordinates);

        setRouteData({
          coordinates,
          tollPoints,
          bounds,
          originCoords: [originCoords.lat, originCoords.lon],
          destCoords: [destCoords.lat, destCoords.lon]
        });
        
        setFormData(prev => ({ 
          ...prev, 
          distance: String(distanceKm),
          tollValue: String(estimatedToll)
        }));
      } else {
        setDistanceError("Não foi possível calcular a rota.");
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
      setDistanceError("Erro ao calcular a distância.");
    } finally {
      setIsLoadingDistance(false);
    }
  };

  const calculateANTT = (distance: number, axes: number, cargoType: string) => {
    // Coeficientes da Tabela II - Lotação (Resolução ANTT 5.867/2020 - Atualizada)
    // CC = Custo Fixo, CV = Custo Variável
    const coefficients: Record<number, { cc: number, cv: number }> = {
      2: { cc: 247.54, cv: 2.30 },
      3: { cc: 295.41, cv: 2.80 },
      4: { cc: 367.12, cv: 3.40 },
      5: { cc: 442.18, cv: 4.10 },
      6: { cc: 512.45, cv: 4.80 },
      7: { cc: 605.12, cv: 5.60 },
      9: { cc: 785.34, cv: 7.20 }
    };

    const typeMultipliers: Record<string, number> = {
      'Carga Geral': 1.0,
      'Granel Sólido': 1.13,
      'Granel Líquido': 1.18,
      'Frigorificada': 1.28,
      'Neogranel': 1.08,
      'Perigosa': 1.35
    };

    const coef = coefficients[axes] || coefficients[6];
    const multiplier = typeMultipliers[cargoType] || 1.0;

    // Fórmula ANTT: Piso = (CC + (CV * Distância)) * Multiplicador
    return (coef.cc + (coef.cv * distance)) * multiplier;
  };

  const result = useMemo(() => {
    const distance = parseFloat(formData.distance) || 0;
    const weight = parseFloat(formData.weight) || 0;
    const axes = formData.axes;
    const cargoType = formData.cargoType;
    const valuePerKm = parseFloat(formData.valuePerKm) || 0;
    const driverFreightPerTonInput = parseFloat(formData.driverFreightPerTonInput) || 0;
    const tollValue = parseFloat(formData.tollValue) || 0;
    const margin = parseFloat(formData.margin) || 0;
    const icms = parseFloat(formData.icms) || 0;
    const dieselPrice = parseFloat(formData.dieselPrice) || 0;
    const averageConsumption = parseFloat(formData.averageConsumption) || 0;
    const driverCommissionPercent = parseFloat(formData.driverCommissionPercent) || 0;

    if (!distance || !weight) return null;

    const anttValue = calculateANTT(distance, axes, cargoType);
    
    let driverTotalFreight = 0;
    let driverFreightPerKm = 0;
    let driverFreightPerTon = 0;

    if (formData.inputMode === 'PER_KM') {
      driverFreightPerKm = valuePerKm;
      driverTotalFreight = distance * valuePerKm;
      driverFreightPerTon = driverTotalFreight / weight;
    } else {
      driverFreightPerTon = driverFreightPerTonInput;
      driverTotalFreight = driverFreightPerTon * weight;
      driverFreightPerKm = driverTotalFreight / distance;
    }

    // O valor líquido que o motorista recebe (descontando o pedágio que ele vai pagar na rota)
    const driverNetValue = driverTotalFreight - tollValue;
    const driverNetValuePerKm = driverNetValue / distance;

    // Frete Empresa = FreteMotorista / (1 - (Margem + ICMS) / 100)
    const divisor = 1 - ((margin + icms) / 100);
    
    if (divisor <= 0) return null;

    const companyFreightPerTon = driverFreightPerTon / divisor;
    const companyTotalFreight = companyFreightPerTon * weight;

    const icmsValue = companyTotalFreight * (icms / 100);
    const netProfit = companyTotalFreight - driverTotalFreight - icmsValue;

    // Operational Costs for Carrier
    const dieselLiters = averageConsumption > 0 ? distance / averageConsumption : 0;
    const dieselCost = dieselLiters * dieselPrice;
    const commissionValue = driverTotalFreight * (driverCommissionPercent / 100);
    const carrierNetProfit = driverTotalFreight - tollValue - dieselCost - commissionValue;
    const carrierProfitMargin = driverTotalFreight > 0 ? (carrierNetProfit / driverTotalFreight) * 100 : 0;

    const isBelowANTT = driverNetValue < anttValue;

    return {
      anttValue,
      driverTotalFreight,
      driverFreightPerKm,
      driverNetValue,
      driverNetValuePerKm,
      driverFreightPerTon,
      companyFreightPerTon,
      companyTotalFreight,
      icmsValue,
      netProfit,
      dieselCost,
      commissionValue,
      carrierNetProfit,
      carrierProfitMargin,
      isBelowANTT
    };
  }, [formData]);

  const handleSave = () => {
    if (!result) return;
    
    if (!formData.origin || !formData.destination || !formData.distance || !formData.weight) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }

    if (formData.clientName) {
      saveClient(companyId, formData.clientName);
      setClients(getClients(companyId));
    }

    saveQuote({
      companyId,
      clientName: formData.clientName || 'Não Informado',
      origin: formData.origin,
      destination: formData.destination,
      distance: parseFloat(formData.distance) || 0,
      axes: formData.axes,
      cargoType: formData.cargoType,
      inputMode: formData.inputMode,
      valuePerKm: result.driverFreightPerKm,
      driverTotalValue: result.driverTotalFreight,
      tollValue: parseFloat(formData.tollValue) || 0,
      anttValue: result.anttValue,
      weight: parseFloat(formData.weight) || 0,
      margin: parseFloat(formData.margin) || 0,
      icms: parseFloat(formData.icms) || 0,
      driverFreightPerTon: result.driverFreightPerTon,
      companyFreightPerTon: result.companyFreightPerTon,
      companyTotalFreight: result.companyTotalFreight,
      dieselPrice: parseFloat(formData.dieselPrice) || 0,
      averageConsumption: parseFloat(formData.averageConsumption) || 0,
      driverCommissionPercent: parseFloat(formData.driverCommissionPercent) || 0,
      dieselCost: result.dieselCost,
      commissionValue: result.commissionValue,
      carrierNetProfit: result.carrierNetProfit,
      carrierProfitMargin: result.carrierProfitMargin
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium flex items-center text-slate-800">
              <Route className="w-5 h-5 mr-2 text-indigo-500" />
              Auditoria e Cotação de Rota
            </h2>
            <button 
              onClick={clearFields}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Limpar Campos
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <Building2 className="w-4 h-4 mr-1.5 text-slate-400" /> Cliente (Opcional)
              </label>
              <input 
                type="text" 
                name="clientName" 
                value={formData.clientName} 
                onChange={handleInputChange} 
                list="clients-list"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                placeholder="Clique para selecionar ou digite um novo" 
              />
              <datalist id="clients-list">
                {clients.map(c => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-slate-400" /> Origem *
              </label>
              <input type="text" name="origin" value={formData.origin} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Cidade - Estado" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-slate-400" /> Destino *
              </label>
              <input type="text" name="destination" value={formData.destination} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Cidade - Estado" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <Truck className="w-4 h-4 mr-1.5 text-slate-400" /> Número de Eixos
              </label>
              <select 
                name="axes" 
                value={formData.axes} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
              >
                {[2, 3, 4, 5, 6, 7, 9].map(axis => (
                  <option key={axis} value={axis}>{axis} Eixos</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <Weight className="w-4 h-4 mr-1.5 text-slate-400" /> Tipo de Carga (ANTT)
              </label>
              <select 
                name="cargoType" 
                value={formData.cargoType} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
              >
                {['Carga Geral', 'Granel Sólido', 'Granel Líquido', 'Frigorificada', 'Neogranel', 'Perigosa'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <button 
                onClick={calculateDistance}
                disabled={isLoadingDistance || !formData.origin || !formData.destination}
                className="w-full flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingDistance ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calculando Rota e Pedágios...</>
                ) : (
                  <><Route className="w-4 h-4 mr-2" /> Buscar Distância e Pedágio Automáticos</>
                )}
              </button>
              {distanceError && <p className="text-xs text-red-500 mt-1">{distanceError}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <Route className="w-4 h-4 mr-1.5 text-slate-400" /> Distância (KM) *
              </label>
              <input type="number" name="distance" value={formData.distance} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Ex: 700" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <DollarSign className="w-4 h-4 mr-1.5 text-slate-400" /> Pedágio Estimado (R$)
              </label>
              <input type="number" step="0.01" name="tollValue" value={formData.tollValue} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Ex: 450.00" />
            </div>

            <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-slate-100">
              <label className="text-sm font-medium text-slate-700 flex items-center mb-2">
                Modo de Entrada do Frete Motorista
              </label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, inputMode: 'PER_TON' }))}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.inputMode === 'PER_TON' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Valor por Tonelada Manual
                </button>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, inputMode: 'PER_KM' }))}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.inputMode === 'PER_KM' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Por KM Rodado
                </button>
              </div>
            </div>

            {formData.inputMode === 'PER_TON' ? (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-slate-700 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1.5 text-slate-400" /> Valor por Tonelada Desejado para o Motorista (R$) *
                </label>
                <input type="number" step="0.01" name="driverFreightPerTonInput" value={formData.driverFreightPerTonInput} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Ex: 200.00" />
              </div>
            ) : (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-slate-700 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1.5 text-slate-400" /> Valor por KM (R$) *
                </label>
                <input type="number" step="0.01" name="valuePerKm" value={formData.valuePerKm} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Ex: 10.00" />
              </div>
            )}

            <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-slate-100">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <Weight className="w-4 h-4 mr-1.5 text-slate-400" /> Tonelagem Média *
              </label>
              <input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Ex: 35" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <Percent className="w-4 h-4 mr-1.5 text-slate-400" /> Margem Líquida (%)
              </label>
              <input type="number" step="0.1" name="margin" value={formData.margin} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Ex: 10" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <Percent className="w-4 h-4 mr-1.5 text-slate-400" /> ICMS (%)
              </label>
              <input type="number" step="0.1" name="icms" value={formData.icms} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Ex: 12" />
            </div>

            <div className="space-y-1.5 md:col-span-2 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center mb-3">
                <Truck className="w-4 h-4 mr-2 text-indigo-500" /> Custos do Trajeto (Transportador)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Preço do Diesel (R$)</label>
                  <input type="number" step="0.01" name="dieselPrice" value={formData.dieselPrice} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Ex: 6.00" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Consumo Médio (KM/L)</label>
                  <input type="number" step="0.1" name="averageConsumption" value={formData.averageConsumption} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Ex: 2.2" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Comissão Motorista (%)</label>
                  <input type="number" step="0.1" name="driverCommissionPercent" value={formData.driverCommissionPercent} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Ex: 10" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        {routeData && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-medium flex items-center text-slate-800 mb-4">
              <MapPin className="w-5 h-5 mr-2 text-indigo-500" />
              Visualização da Rota
            </h3>
            <div className="h-[400px] rounded-xl overflow-hidden border border-slate-200 relative z-0">
              <MapContainer 
                center={routeData.originCoords} 
                zoom={6} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater bounds={routeData.bounds} />
                
                <Polyline positions={routeData.coordinates} color="#4f46e5" weight={4} opacity={0.7} />
                
                <Marker position={routeData.originCoords} icon={originIcon}>
                  <Popup>
                    <strong>Origem:</strong> {formData.origin}
                  </Popup>
                </Marker>
                
                <Marker position={routeData.destCoords} icon={destIcon}>
                  <Popup>
                    <strong>Destino:</strong> {formData.destination}
                  </Popup>
                </Marker>

                {routeData.tollPoints.map((toll, idx) => (
                  <Marker key={idx} position={[toll.lat, toll.lng]} icon={customTollIcon}>
                    <Popup>
                      <div className="text-center">
                        <strong className="block text-slate-800">{toll.name}</strong>
                        <span className="text-indigo-600 font-semibold">{formatCurrency(toll.cost)}</span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-medium flex items-center text-slate-800">
              <Calculator className="w-5 h-5 mr-2 text-indigo-500" />
              Painel de Auditoria
            </h2>
          </div>
          
          <div className="p-6 flex-1 flex flex-col">
            {result ? (
              <div className="space-y-6 flex-1 flex flex-col">
                
                {/* Referência ANTT */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-sm font-medium text-slate-600 mb-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      Referências de Custo
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">Tabela II - Lotação</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Piso Mínimo ANTT</div>
                      <div className="text-lg font-semibold text-slate-800">{formatCurrency(result.anttValue)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Pedágio Estimado</div>
                      <div className="text-lg font-semibold text-slate-800">{formatCurrency(parseFloat(formData.tollValue) || 0)}</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 italic">
                    * Cálculo baseado na Resolução 5.867/2020 (CC + CV * KM).
                  </p>
                </div>

                {/* Alerta ANTT */}
                {result.isBelowANTT && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800">Risco de Infração ANTT</h4>
                      <p className="text-xs text-red-600 mt-1">
                        O valor líquido para o motorista ({formatCurrency(result.driverNetValue)}) está abaixo do piso mínimo da ANTT ({formatCurrency(result.anttValue)}).
                      </p>
                    </div>
                  </div>
                )}

                {/* Motorista */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-sm font-medium text-slate-600 mb-3 flex items-center">
                    <Truck className="w-4 h-4 mr-2" />
                    Frete Motorista (Custo Operacional)
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Valor Bruto Total</div>
                      <div className="text-xl font-bold text-slate-900">{formatCurrency(result.driverTotalFreight)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Valor Líquido (S/ Pedágio)</div>
                      <div className={`text-xl font-bold ${result.isBelowANTT ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(result.driverNetValue)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 border-t border-slate-200 pt-2">
                    <span>Líquido por KM: {formatCurrency(result.driverNetValuePerKm)}</span>
                    <span>Bruto por Ton: {formatCurrency(result.driverFreightPerTon)}</span>
                  </div>
                </div>

                {/* Empresa */}
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <div className="text-sm font-medium text-indigo-800 mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Frete Empresa (Markup)
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs text-indigo-600/80 mb-1">Valor por Tonelada</div>
                      <div className="text-xl font-semibold text-indigo-900">{formatCurrency(result.companyFreightPerTon)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-indigo-600/80 mb-1">Valor Total a Cobrar</div>
                      <div className="text-2xl font-bold text-indigo-700">{formatCurrency(result.companyTotalFreight)}</div>
                    </div>
                  </div>
                </div>

                {/* Resultado Estimado para o Transportador */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                    <Truck className="w-4 h-4 mr-2 text-slate-500" />
                    Resultado Estimado para o Transportador
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Receita Bruta (Frete Motorista)</span>
                      <span className="font-medium text-slate-900">{formatCurrency(result.driverTotalFreight)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">(-) Despesas Fixas (Pedágio)</span>
                      <span className="font-medium text-red-600">{formatCurrency(parseFloat(formData.tollValue) || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">(-) Despesas Variáveis (Diesel + Comissão)</span>
                      <span className="font-medium text-red-600">{formatCurrency(result.dieselCost + result.commissionValue)}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Lucro Líquido Estimado</div>
                      <div className={`text-xl font-bold ${result.carrierNetProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(result.carrierNetProfit)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Margem de Lucro</div>
                      <div className={`text-lg font-bold ${result.carrierProfitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {result.carrierProfitMargin.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-3 py-4 border-t border-slate-100 mt-auto">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Demonstrativo de Custos</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Repasse Motorista (Bruto)</span>
                    <span className="font-medium text-slate-900">{formatCurrency(result.driverTotalFreight)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Imposto (ICMS {parseFloat(formData.icms) || 0}%)</span>
                    <span className="font-medium text-red-600">{formatCurrency(result.icmsValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                    <span className="text-slate-800 font-medium">Lucro Líquido ({parseFloat(formData.margin) || 0}%)</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(result.netProfit)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 mt-auto pt-4">
                  {saveSuccess && (
                    <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl flex items-center text-sm font-medium border border-emerald-100">
                      <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-500" />
                      Dados salvos com sucesso no histórico!
                    </div>
                  )}
                  <button 
                    onClick={handleSave}
                    className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Cotação
                  </button>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 space-y-4 py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <Calculator className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm max-w-[250px]">Preencha a distância, peso e valores para visualizar a auditoria da cotação.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
