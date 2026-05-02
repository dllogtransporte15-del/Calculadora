import React, { useState, useEffect } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Search, Download, Calculator, Route, Calendar, User, MapPin, X, Building2, FileText, FileCode, Trash2 } from 'lucide-react';
import { getStays, getQuotes, StayRecord, QuoteRecord, getClients, Client, deleteStay, deleteQuote } from '../utils/storage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface HistoryProps {
  companyId: string;
}

export default function History({ companyId }: HistoryProps) {
  const [activeTab, setActiveTab] = useState<'estadias' | 'cotacoes'>('estadias');
  const [stays, setStays] = useState<StayRecord[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterDestination, setFilterDestination] = useState('');
  const [filterClient, setFilterClient] = useState('');

  useEffect(() => {
    setStays(getStays(companyId));
    setQuotes(getQuotes(companyId));
    setClients(getClients(companyId));
  }, [companyId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const clearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterDriver('');
    setFilterOrigin('');
    setFilterDestination('');
    setFilterClient('');
  };

  const isDateInRange = (dateStr: string) => {
    if (!filterStartDate && !filterEndDate) return true;
    
    const date = parseISO(dateStr);
    const start = filterStartDate ? startOfDay(parseISO(filterStartDate)) : new Date(0);
    const end = filterEndDate ? endOfDay(parseISO(filterEndDate)) : new Date(8640000000000000);
    
    return isWithinInterval(date, { start, end });
  };

  const filteredStays = stays.filter(stay => {
    const matchDate = isDateInRange(stay.date);
    const matchDriver = filterDriver 
      ? stay.driver.toLowerCase().includes(filterDriver.toLowerCase()) || stay.plate.toLowerCase().includes(filterDriver.toLowerCase())
      : true;
    const matchDest = filterDestination ? stay.destination.toLowerCase().includes(filterDestination.toLowerCase()) : true;
    const matchClient = filterClient ? stay.clientName?.toLowerCase().includes(filterClient.toLowerCase()) : true;
    return matchDate && matchDriver && matchDest && matchClient;
  });

  const filteredQuotes = quotes.filter(quote => {
    const matchDate = isDateInRange(quote.date);
    const matchOrigin = filterOrigin ? quote.origin.toLowerCase().includes(filterOrigin.toLowerCase()) : true;
    const matchDest = filterDestination ? quote.destination.toLowerCase().includes(filterDestination.toLowerCase()) : true;
    const matchClient = filterClient ? quote.clientName?.toLowerCase().includes(filterClient.toLowerCase()) : true;
    return matchDate && matchOrigin && matchDest && matchClient;
  });

  const currentResultsCount = activeTab === 'estadias' ? filteredStays.length : filteredQuotes.length;

  const generateQuotePDF = (quote: QuoteRecord) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text('Cotação de Frete', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`ID: ${quote.id} | Data: ${format(parseISO(quote.date), 'dd/MM/yyyy HH:mm')}`, 105, 28, { align: 'center' });
    
    // Content
    const tableData = [
      ['Cliente', quote.clientName || 'Não Informado'],
      ['Origem', quote.origin],
      ['Destino', quote.destination],
      ['Distância', `${quote.distance} KM`],
      ['Eixos', `${quote.axes} Eixos`],
      ['Tipo de Carga', quote.cargoType],
      ['Peso (Tonelagem)', `${quote.weight} T`],
      ['Pedágio Estimado', formatCurrency(quote.tollValue)],
      ['Piso Mínimo ANTT', formatCurrency(quote.anttValue)],
      ['', ''],
      ['Frete Motorista (por Ton)', formatCurrency(quote.driverFreightPerTon)],
      ['', ''],
      ['Margem Líquida', `${quote.margin}%`],
      ['ICMS', `${quote.icms}%`],
      ['Frete Empresa (por Ton)', formatCurrency(quote.companyFreightPerTon)],
      ['', ''],
      ['CUSTOS DO TRANSPORTADOR', ''],
      ['Preço Diesel', formatCurrency(quote.dieselPrice || 0)],
      ['Consumo Médio', `${quote.averageConsumption || 0} KM/L`],
      ['Comissão Motorista', `${quote.driverCommissionPercent || 0}%`],
      ['Custo Total Diesel', formatCurrency(quote.dieselCost || 0)],
      ['Valor Comissão', formatCurrency(quote.commissionValue || 0)],
      ['LUCRO LÍQUIDO TRANSPORTADOR', formatCurrency(quote.carrierNetProfit || 0)],
      ['Margem de Lucro', `${(quote.carrierProfitMargin || 0).toFixed(1)}%`],
    ];

    autoTable(doc, {
      startY: 35,
      head: [['Campo', 'Informação']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { top: 35 }
    });

    doc.save(`cotacao_${quote.id}.pdf`);
  };

  const generateStayPDF = (stay: StayRecord) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text('Relatório de Estadia', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`ID: ${stay.id} | Data: ${format(parseISO(stay.date), 'dd/MM/yyyy HH:mm')}`, 105, 28, { align: 'center' });
    
    const tableData = [
      ['Cliente', stay.clientName || 'Não Informado'],
      ['Motorista', stay.driver],
      ['Placa', stay.plate],
      ['NF', stay.invoice || '-'],
      ['Origem', stay.origin],
      ['Destino', stay.destination],
      ['Local', stay.location],
      ['Entrada', format(parseISO(stay.entryDate), 'dd/MM/yyyy HH:mm')],
      ['Saída', format(parseISO(stay.exitDate), 'dd/MM/yyyy HH:mm')],
      ['Total Horas', `${stay.totalHours.toFixed(2)}h`],
      ['Tolerância', `${stay.tolerance}h`],
      ['Peso', `${stay.weight} T`],
      ['Valor por Hora', formatCurrency(stay.valuePerHour)],
      ['Valor Total', formatCurrency(stay.totalValue)]
    ];

    autoTable(doc, {
      startY: 35,
      head: [['Campo', 'Informação']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { top: 35 }
    });

    doc.save(`estadia_${stay.id}.pdf`);
  };

  const handleDeleteStay = (id: string) => {
    deleteStay(id);
    setStays(getStays(companyId));
  };

  const handleDeleteQuote = (id: string) => {
    deleteQuote(id);
    setQuotes(getQuotes(companyId));
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const title = activeTab === 'estadias' ? 'Relatório de Estadias Filtradas' : 'Relatório de Cotações Filtradas';
    
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text(title, 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 22, { align: 'center' });

    if (activeTab === 'estadias') {
      const headers = [['NF', 'Cliente', 'Origem', 'Destino', 'Peso (T)', 'Valor/h', 'Tol (h)', 'Entrada', 'Saída', 'Total']];
      const data = filteredStays.map(s => [
        s.invoice || '-',
        s.clientName || '-',
        s.origin,
        s.destination,
        s.weight.toString(),
        formatCurrency(s.valuePerHour),
        s.tolerance.toString(),
        format(parseISO(s.entryDate), 'dd/MM/yyyy HH:mm'),
        format(parseISO(s.exitDate), 'dd/MM/yyyy HH:mm'),
        formatCurrency(s.totalValue)
      ]);

      autoTable(doc, {
        startY: 30,
        head: headers,
        body: data,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 7 }
      });
      doc.save('historico_estadias_filtrado.pdf');
    } else {
      // Specific columns requested by user for Quotes PDF:
      // - Client
      // - Origin/Destination
      // - Company Value (Per Ton)
      // - ICMS Info
      const headers = [['Cliente', 'Origem / Destino', 'Frete Empresa (Ton)', 'ICMS']];
      const data = filteredQuotes.map(q => [
        q.clientName || 'Não Informado',
        `${q.origin} -> ${q.destination}`,
        formatCurrency(q.companyFreightPerTon),
        q.icms > 0 ? `${q.icms}%` : 'Não'
      ]);

      autoTable(doc, {
        startY: 30,
        head: headers,
        body: data,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 }
      });
      doc.save('historico_cotacoes_filtrado.pdf');
    }
  };

  const exportCSV = () => {
    if (activeTab === 'estadias') {
      const headers = ['ID', 'Data Registro', 'Cliente', 'Motorista', 'Placa', 'NF', 'Origem', 'Destino', 'Local', 'Entrada', 'Saída', 'Total Horas', 'Peso', 'Valor/h', 'Tolerância', 'Valor Total'];
      const rows = filteredStays.map(s => [
        s.id,
        format(parseISO(s.date), 'dd/MM/yyyy HH:mm'),
        s.clientName || 'Não Informado',
        s.driver,
        s.plate,
        s.invoice,
        s.origin,
        s.destination,
        s.location,
        format(parseISO(s.entryDate), 'dd/MM/yyyy HH:mm'),
        format(parseISO(s.exitDate), 'dd/MM/yyyy HH:mm'),
        s.totalHours.toFixed(2),
        s.weight.toString(),
        s.valuePerHour.toString(),
        s.tolerance.toString(),
        s.totalValue.toFixed(2)
      ]);
      downloadCSV('historico_estadias.csv', headers, rows);
    } else {
      const headers = ['ID', 'Data Registro', 'Cliente', 'Origem', 'Destino', 'Distância (KM)', 'Eixos', 'Tipo Carga', 'Pedágio (R$)', 'Piso ANTT (R$)', 'Frete Motorista (Ton)', 'Frete Empresa (Ton)', 'Margem (%)', 'ICMS (%)', 'Preço Diesel', 'Consumo (KM/L)', 'Comissão (%)', 'Custo Diesel', 'Valor Comissão', 'Lucro Transportador', 'Margem Transportador (%)'];
      const rows = filteredQuotes.map(q => [
        q.id,
        format(parseISO(q.date), 'dd/MM/yyyy HH:mm'),
        q.clientName || 'Não Informado',
        q.origin,
        q.destination,
        q.distance.toString(),
        (q.axes || 0).toString(),
        q.cargoType || '-',
        (q.tollValue || 0).toFixed(2),
        (q.anttValue || 0).toFixed(2),
        q.driverFreightPerTon.toFixed(2),
        q.companyFreightPerTon.toFixed(2),
        q.margin.toString(),
        q.icms.toString(),
        (q.dieselPrice || 0).toFixed(2),
        (q.averageConsumption || 0).toFixed(1),
        (q.driverCommissionPercent || 0).toFixed(1),
        (q.dieselCost || 0).toFixed(2),
        (q.commissionValue || 0).toFixed(2),
        (q.carrierNetProfit || 0).toFixed(2),
        (q.carrierProfitMargin || 0).toFixed(1)
      ]);
      downloadCSV('historico_cotacoes.csv', headers, rows);
    }
  };

  const exportXML = () => {
    if (activeTab === 'cotacoes') {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<cotacoes>\n';
      filteredQuotes.forEach(q => {
        xml += '  <cotacao>\n';
        xml += `    <id>${q.id}</id>\n`;
        xml += `    <data_registro>${format(parseISO(q.date), 'yyyy-MM-dd HH:mm:ss')}</data_registro>\n`;
        xml += `    <cliente>${q.clientName || 'Não Informado'}</cliente>\n`;
        xml += `    <origem>${q.origin}</origem>\n`;
        xml += `    <destino>${q.destination}</destino>\n`;
        xml += `    <distancia_km>${q.distance}</distancia_km>\n`;
        xml += `    <eixos>${q.axes}</eixos>\n`;
        xml += `    <tipo_carga>${q.cargoType}</tipo_carga>\n`;
        xml += `    <peso_ton>${q.weight}</peso_ton>\n`;
        xml += `    <frete_motorista_ton>${q.driverFreightPerTon.toFixed(2)}</frete_motorista_ton>\n`;
        xml += `    <frete_empresa_ton>${q.companyFreightPerTon.toFixed(2)}</frete_empresa_ton>\n`;
        xml += `    <margem_percent>${q.margin}</margem_percent>\n`;
        xml += `    <icms_percent>${q.icms}</icms_percent>\n`;
        xml += `    <preco_diesel>${q.dieselPrice || 0}</preco_diesel>\n`;
        xml += `    <consumo_kml>${q.averageConsumption || 0}</consumo_kml>\n`;
        xml += `    <comissao_percent>${q.driverCommissionPercent || 0}</comissao_percent>\n`;
        xml += `    <custo_diesel>${(q.dieselCost || 0).toFixed(2)}</custo_diesel>\n`;
        xml += `    <valor_comissao>${(q.commissionValue || 0).toFixed(2)}</valor_comissao>\n`;
        xml += `    <lucro_transportador>${(q.carrierNetProfit || 0).toFixed(2)}</lucro_transportador>\n`;
        xml += `    <margem_transportador>${(q.carrierProfitMargin || 0).toFixed(1)}</margem_transportador>\n`;
        xml += '  </cotacao>\n';
      });
      xml += '</cotacoes>';

      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'historico_cotacoes.xml');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('estadias'); clearFilters(); }}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'estadias'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Histórico de Estadias
          </button>
          <button
            onClick={() => { setActiveTab('cotacoes'); clearFilters(); }}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'cotacoes'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Route className="w-4 h-4 mr-2" />
            Histórico de Cotações
          </button>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={exportCSV}
            className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            PDF (Lista)
          </button>
          {activeTab === 'cotacoes' && (
            <button 
              onClick={exportXML}
              className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm"
            >
              <FileCode className="w-4 h-4 mr-2" />
              XML
            </button>
          )}
        </div>
      </div>

      <div className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-slate-700">Filtros de Busca</h3>
          <button 
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-indigo-600 flex items-center transition-colors"
          >
            <X className="w-3 h-3 mr-1" /> Limpar Filtros
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-4">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filtrar por Cliente"
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              list="history-clients-list"
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
            <datalist id="history-clients-list">
              {clients.map(c => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              title="Data Início"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              title="Data Fim"
            />
          </div>
          
          {activeTab === 'estadias' ? (
            <div className="relative md:col-span-2">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Filtrar por Motorista ou Placa"
                value={filterDriver}
                onChange={(e) => setFilterDriver(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
          ) : (
            <>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Origem"
                  value={filterOrigin}
                  onChange={(e) => setFilterOrigin(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Destino"
                  value={filterDestination}
                  onChange={(e) => setFilterDestination(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="text-xs text-slate-500 pt-2 flex items-center">
          <Search className="w-3 h-3 mr-1" />
          Foram encontrados <span className="font-semibold text-indigo-600 mx-1">{currentResultsCount}</span> registros para este filtro.
        </div>
      </div>

      <div className="overflow-x-auto">
        {activeTab === 'estadias' ? (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">ID / Data</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Motorista / Placa</th>
                <th className="px-6 py-3 font-medium">Rota</th>
                <th className="px-6 py-3 font-medium">Tempos</th>
                <th className="px-6 py-3 font-medium text-right">Valor Total</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStays.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
              ) : (
                filteredStays.map(stay => (
                  <tr key={stay.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{stay.id}</div>
                      <div className="text-xs text-slate-500">{format(parseISO(stay.date), 'dd/MM/yyyy HH:mm')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{stay.clientName || 'Não Informado'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{stay.driver}</div>
                      <div className="text-xs text-slate-500">{stay.plate} | NF: {stay.invoice || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{stay.origin} <ArrowRight className="inline w-3 h-3 mx-1 text-slate-400"/> {stay.destination}</div>
                      <div className="text-xs text-slate-500">{stay.location}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{stay.totalHours.toFixed(1)}h totais</div>
                      <div className="text-xs text-slate-500">Tol: {stay.tolerance}h</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-emerald-600">{formatCurrency(stay.totalValue)}</div>
                      <div className="text-xs text-slate-500">{stay.weight}T × {formatCurrency(stay.valuePerHour)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => generateStayPDF(stay)}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Gerar PDF"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStay(stay.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">ID / Data</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Rota / Distância</th>
                <th className="px-6 py-3 font-medium">Parâmetros (ANTT)</th>
                <th className="px-6 py-3 font-medium text-right">Frete Motorista (Ton)</th>
                <th className="px-6 py-3 font-medium text-right">Frete Empresa (Ton)</th>
                <th className="px-6 py-3 font-medium text-right">Lucro Transp.</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
              ) : (
                filteredQuotes.map(quote => {
                  const driverTotal = quote.driverTotalValue || (quote.distance * quote.valuePerKm);
                  const profit = quote.carrierNetProfit || 0;
                  const margin = quote.carrierProfitMargin || 0;
                  return (
                    <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{quote.id}</div>
                        <div className="text-xs text-slate-500">{format(parseISO(quote.date), 'dd/MM/yyyy HH:mm')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{quote.clientName || 'Não Informado'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900">{quote.origin} <ArrowRight className="inline w-3 h-3 mx-1 text-slate-400"/> {quote.destination}</div>
                        <div className="text-xs text-slate-500">{quote.distance} km | Pedágio: {formatCurrency(quote.tollValue || 0)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900">{quote.axes || '-'} Eixos | {quote.cargoType || '-'}</div>
                        <div className="text-xs text-slate-500">Piso: {formatCurrency(quote.anttValue || 0)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium text-slate-900">{formatCurrency(quote.driverFreightPerTon)}</div>
                        <div className="text-xs text-slate-500">Total: {formatCurrency(driverTotal)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium text-indigo-600">{formatCurrency(quote.companyFreightPerTon)}</div>
                        <div className="text-xs text-slate-500">Total: {formatCurrency(quote.companyTotalFreight)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(profit)}
                        </div>
                        <div className="text-xs text-slate-500">{margin.toFixed(1)}%</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => generateQuotePDF(quote)}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Gerar PDF"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteQuote(quote.id)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Simple ArrowRight component for the table
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
