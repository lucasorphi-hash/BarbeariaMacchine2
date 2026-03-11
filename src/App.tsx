import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  ChevronRight, 
  CheckCircle2,
  MapPin,
  Instagram,
  Facebook,
  Menu,
  X,
  Trash2,
  RefreshCw
} from 'lucide-react';

// --- Types ---

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
}

interface Appointment {
  customer_name: string;
  customer_phone: string;
  service: string;
  date: string;
  time: string;
}

// --- Constants ---

const SERVICES: Service[] = [
  { id: '1', name: 'Corte de Cabelo', price: 30, duration: '30 min' },
  { id: '2', name: 'Corte + Sobrancelha', price: 35, duration: '30 min' },
  { id: '3', name: 'Barba Completa', price: 30, duration: '30 min' },
  { id: '4', name: 'Barba + Sobrancelha', price: 35, duration: '30 min' },
  { id: '5', name: 'Combo (Corte + Barba + Sobrancelha)', price: 60, duration: '1h' },
];

const TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
];

// --- Components ---

const LogoImage = ({ className = "" }: { className?: string }) => {
  return (
   <img
  src="/logo.jpg"
  alt="Barbearia Macchine"
  style={{
    height: "120px",
    objectFit: "contain"
  }}
/>
  );
};

export default function App() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [filterToday, setFilterToday] = useState(false);
  const [dbDiagnostic, setDbDiagnostic] = useState<any>(null);

  const fetchAppointments = async () => {
    setIsSubmitting(true);
    try {
      // Add timestamp to prevent caching
      const response = await fetch(`/api/appointments?t=${Date.now()}`);
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        console.log('Fetched appointments:', data);
        setAppointments(data);
        setLastUpdated(new Date().toLocaleTimeString());
        setError('');
      } else {
        // If it's an error object or not an array, handle it gracefully
        console.error('API Error or unexpected format:', data);
        setAppointments([]); // Reset to empty array to prevent .filter crashes
        setError(data.error || 'Erro ao carregar agendamentos');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setAppointments([]); // Reset to empty array
      setError('Erro de conexão com o servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    
    // Refresh when window gets focus to avoid stale data
    const handleFocus = () => fetchAppointments();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAppointments();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      const booked = appointments
        .filter((apt: any) => apt.date === selectedDate)
        .map((apt: any) => apt.time);
      setBookedTimes(booked);
    } else {
      setBookedTimes([]);
    }
  }, [selectedDate, appointments]);

  useEffect(() => {
    if (isAdmin && isAdminAuthenticated) {
      fetchAppointments();
    }
  }, [isAdmin, isAdminAuthenticated]);

  const handleCancelAppointment = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        fetchAppointments();
      } else {
        setError(data.error || 'Erro ao cancelar agendamento');
      }
    } catch (err) {
      console.error('Error canceling appointment:', err);
      setError('Erro de conexão ao tentar cancelar');
    }
  };

  const handleAdminLogin = () => {
    // Simple password check for the owner
    if (adminPassword === '47381491') {
      setIsAdminAuthenticated(true);
      fetchAppointments();
    } else {
      setError('Senha incorreta');
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedDate('');
    setSelectedTime('');
    setCustomerName('');
    setCustomerPhone('');
    setIsSuccess(false);
    setError('');
    setIsAdmin(false);
    setIsAdminAuthenticated(false);
  };

  const runDiagnostic = async () => {
    try {
      const response = await fetch(`/api/debug?t=${Date.now()}`);
      const data = await response.json();
      if (response.ok) {
        setDbDiagnostic(data);
      } else {
        setDbDiagnostic({ error: data.error || 'Falha ao obter diagnóstico' });
      }
    } catch (err) {
      setDbDiagnostic({ error: 'Falha ao conectar ao servidor de diagnóstico' });
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Final availability check before proceeding
      const checkResponse = await fetch(`/api/appointments?t=${Date.now()}`);
      const latestAppointments = await checkResponse.json();
      
      if (checkResponse.ok && Array.isArray(latestAppointments)) {
        const isCombo = selectedService.duration === '1h';
        const timesToCheck = [selectedTime];
        if (isCombo) {
          const index = TIMES.indexOf(selectedTime);
          const nextTime = TIMES[index + 1];
          if (nextTime) timesToCheck.push(nextTime);
        }

        const alreadyBooked = latestAppointments.some((apt: any) => 
          apt.date === selectedDate && timesToCheck.includes(apt.time)
        );

        if (alreadyBooked) {
          setError('Desculpe, este horário acabou de ser reservado por outra pessoa. Por favor, escolha outro.');
          setAppointments(latestAppointments);
          setStep(3);
          setIsSubmitting(false);
          return;
        }
      }

      const isCombo = selectedService.duration === '1h';
      let extraTime = '';
      if (isCombo) {
        const index = TIMES.indexOf(selectedTime);
        extraTime = TIMES[index + 1] || '';
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          service: selectedService.name,
          date: selectedDate,
          time: selectedTime,
          extra_time: extraTime
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao agendar');
      }

      setIsSuccess(true);
      setStep(5);
      fetchAppointments(); // Update list in background

      // Construct WhatsApp message and redirect
      const formattedDate = selectedDate.split('-').reverse().join('/');
      const timeText = isCombo ? `${selectedTime} (Duração: 1h)` : selectedTime;
      
      const message = encodeURIComponent(
        `Olá! Acabei de agendar um horário na Barbearia Macchine.\n\n` +
        `*Cliente:* ${customerName}\n` +
        `*Serviço:* ${selectedService.name}\n` +
        `*Data:* ${formattedDate}\n` +
        `*Horário:* ${timeText}\n\n` +
        `Confirmado pelo sistema! ✅`
      );
      
      const whatsappUrl = `https://wa.me/5515997278405?text=${message}`;
      setWhatsappUrl(whatsappUrl);
      
      // Small delay to let the success screen show before redirecting
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark text-paper selection:bg-gold selection:text-dark">
      {/* Header / Logo Section */}
      <header className="relative py-12 px-4 flex flex-col items-center border-b border-white/5 bg-black overflow-hidden">
        {/* Header Background Image */}
        <img 
          src="/logo.jpg"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover opacity-30 scale-110 blur-[1px]"
          referrerPolicy="no-referrer"
        />
        {/* Gradient Overlay for the header */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black" />

        <div className="relative z-10 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-64 h-64 mb-4 cursor-pointer active:scale-95 transition-transform"
            onClick={resetForm}
          >
            <div className="w-full h-full rounded-2xl border-2 border-gold flex items-center justify-center p-2 bg-black/40 backdrop-blur-md overflow-hidden shadow-2xl shadow-gold/20 relative">
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <LogoImage />
              </div>
            </div>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-display text-gold tracking-widest uppercase drop-shadow-md"
          >
            Agendamento Online
          </motion.h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-display mb-8 border-l-4 border-gold pl-4">Escolha o Serviço</h2>
              <div className="grid gap-4">
                {SERVICES.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setStep(2);
                    }}
                    className="group relative flex items-center justify-between p-5 glass rounded-xl hover:border-gold/50 transition-all text-left"
                  >
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-gold transition-colors">{service.name}</h3>
                      <p className="text-paper/50 text-sm font-mono">{service.duration}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-gold font-bold text-xl">R$ {service.price}</span>
                      <ChevronRight className="inline-block ml-2 text-paper/20 group-hover:text-gold" size={20} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Date Selection */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <button onClick={() => { setStep(1); setError(''); }} className="text-gold text-sm flex items-center mb-4">
                ← Voltar aos serviços
              </button>
              <h2 className="text-2xl font-display mb-8 border-l-4 border-gold pl-4">Selecione a Data</h2>
              <p className="text-xs text-paper/40 mb-2 uppercase tracking-widest">Atendimento de Terça a Sábado</p>
              <input 
                type="date" 
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-4 glass rounded-xl text-paper focus:outline-none focus:ring-2 focus:ring-gold/50"
                onChange={(e) => {
                  const date = new Date(e.target.value + 'T00:00:00');
                  const day = date.getDay();
                  // 0 = Sunday, 1 = Monday
                  if (day === 0 || day === 1) {
                    setError('A barbearia não abre aos domingos e segundas. Por favor, escolha de terça a sábado.');
                    return;
                  }
                  setError('');
                  setSelectedDate(e.target.value);
                  setStep(3);
                }}
              />
              {error && step === 2 && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </motion.div>
          )}

          {/* Step 3: Time Selection */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <button onClick={() => { setStep(2); setError(''); }} className="text-gold text-sm flex items-center mb-4">
                ← Voltar à data
              </button>
              <h2 className="text-2xl font-display mb-8 border-l-4 border-gold pl-4">Horários Disponíveis</h2>
              <div className="grid grid-cols-3 gap-3">
                {TIMES.map((time, index) => {
                  const isBooked = bookedTimes.includes(time);
                  let isNextBooked = false;
                  
                  // If it's a 1h service (Combo), we need to check if the NEXT slot is also free
                  if (selectedService?.duration === '1h') {
                    const nextTime = TIMES[index + 1];
                    // If there's no next slot (end of day) or the next slot is booked
                    isNextBooked = !nextTime || bookedTimes.includes(nextTime);
                  }

                  const isDisabled = isBooked || isNextBooked;

                  return (
                    <button
                      key={time}
                      disabled={isDisabled}
                      onClick={() => {
                        setSelectedTime(time);
                        setStep(4);
                      }}
                      className={`p-3 glass rounded-lg text-center font-mono transition-all ${
                        isDisabled 
                          ? 'opacity-20 cursor-not-allowed line-through grayscale' 
                          : 'hover:bg-gold hover:text-dark'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 4: Customer Info */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <button onClick={() => { setStep(3); setError(''); }} className="text-gold text-sm flex items-center mb-4">
                ← Voltar ao horário
              </button>
              <h2 className="text-2xl font-display mb-8 border-l-4 border-gold pl-4">Seus Dados</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-paper/50">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" size={18} />
                    <input 
                      type="text" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full pl-12 pr-4 py-4 glass rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-paper/50">WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" size={18} />
                    <input 
                      type="tel" 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full pl-12 pr-4 py-4 glass rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                </div>

                <div className="mt-8 p-4 bg-zinc-900 rounded-xl border border-white/5 space-y-2">
                  <p className="text-xs text-paper/40 uppercase tracking-tighter">Resumo do Agendamento</p>
                  <div className="flex justify-between">
                    <span className="text-gold">{selectedService?.name}</span>
                    <span className="font-mono">R$ {selectedService?.price}</span>
                  </div>
                  <div className="flex justify-between text-sm text-paper/60">
                    <span>{selectedDate}</span>
                    <span>{selectedTime}</span>
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button 
                  onClick={handleBooking}
                  disabled={isSubmitting}
                  className="w-full py-5 gold-gradient text-dark font-bold rounded-xl uppercase tracking-widest shadow-lg shadow-gold/20 active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {isSubmitting ? 'Processando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-12"
            >
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                  <CheckCircle2 size={64} />
                </div>
              </div>
              <h2 className="text-3xl font-display text-gold">Agendado com Sucesso!</h2>
              <p className="text-paper/60">
                Tudo pronto, {customerName.split(' ')[0]}!<br />
                Te esperamos dia {selectedDate.split('-').reverse().join('/')} às {selectedTime} {selectedService?.duration === '1h' ? '(Duração: 1h)' : ''}.
              </p>
              
              <div className="space-y-4 pt-4">
                <a 
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full p-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-900/20"
                >
                  <Phone size={20} />
                  Confirmar no WhatsApp
                </a>
                
                <button 
                  onClick={resetForm}
                  className="w-full p-3 border border-white/10 text-paper/40 text-sm rounded-xl hover:bg-white/5 transition-all"
                >
                  Novo Agendamento
                </button>
              </div>
            </motion.div>
          )}

          {/* Admin Dashboard */}
          {isAdmin && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-display text-gold">Painel do Barbeiro</h2>
                <button onClick={() => setIsAdmin(false)} className="text-paper/40 hover:text-gold">Fechar</button>
              </div>

              {!isAdminAuthenticated ? (
                <div className="space-y-4 max-w-xs mx-auto text-center">
                  <p className="text-sm text-paper/60">Digite a senha para acessar os agendamentos</p>
                  <input 
                    type="password" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Senha"
                    className="w-full px-4 py-3 glass rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 text-center"
                  />
                  {error && <p className="text-red-400 text-xs">{error}</p>}
                  <button 
                    onClick={handleAdminLogin}
                    className="w-full py-3 gold-gradient text-dark font-bold rounded-xl uppercase tracking-widest"
                  >
                    Acessar
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                    <div>
                      <p className="text-[10px] text-paper/40 uppercase tracking-[0.2em]">Status da Agenda</p>
                      <p className="text-sm font-medium text-paper/80">{appointments.length} Agendamentos</p>
                      {lastUpdated && <p className="text-[9px] text-paper/20 uppercase mt-1">Atualizado às {lastUpdated}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={runDiagnostic}
                        className="p-2 bg-white/5 text-paper/40 rounded-lg hover:text-gold transition-colors"
                        title="Diagnóstico do Banco"
                      >
                        <RefreshCw size={14} className={dbDiagnostic ? 'animate-pulse' : ''} />
                      </button>
                      <button 
                        onClick={() => setFilterToday(!filterToday)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                          filterToday 
                            ? 'bg-gold text-dark border-gold' 
                            : 'bg-white/5 text-paper/40 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {filterToday ? 'Hoje' : 'Todos'}
                      </button>
                      <button 
                        onClick={fetchAppointments} 
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold border border-gold/20 rounded-lg hover:bg-gold/20 transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={isSubmitting ? 'animate-spin' : ''} />
                        {isSubmitting ? 'Carregando...' : 'Atualizar'}
                      </button>
                    </div>
                  </div>

                  {dbDiagnostic && (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-[10px] font-mono text-blue-300 space-y-1">
                      <div className="flex justify-between">
                        <span>DB Status: {dbDiagnostic.status}</span>
                        <button onClick={() => setDbDiagnostic(null)} className="text-paper/40 hover:text-white">X</button>
                      </div>
                      <div>Total no Banco: {dbDiagnostic.total_appointments}</div>
                      {dbDiagnostic.last_appointment && (
                        <div>Último: {dbDiagnostic.last_appointment.customer_name} ({dbDiagnostic.last_appointment.time})</div>
                      )}
                      {dbDiagnostic.error && <div className="text-red-400">Erro: {dbDiagnostic.error}</div>}
                    </div>
                  )}
                  
                  {error && isAdminAuthenticated && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {(() => {
                      const now = new Date();
                      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                      const filtered = filterToday 
                        ? appointments.filter(apt => apt.date === today)
                        : appointments;

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-12 space-y-4">
                            <p className="text-paper/20 italic">
                              {filterToday ? 'Nenhum agendamento para hoje.' : 'Nenhum agendamento encontrado.'}
                            </p>
                            {filterToday && appointments.length > 0 && (
                              <button onClick={() => setFilterToday(false)} className="text-gold text-xs underline">Ver todos os agendamentos</button>
                            )}
                          </div>
                        );
                      }

                      return filtered.map((apt: any) => (
                        <div key={apt.id} className="glass p-4 rounded-xl border border-white/5 space-y-2 hover:border-gold/20 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-gold">{apt.customer_name}</h3>
                              <p className="text-xs text-paper/60">{apt.customer_phone}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-right">
                                <p className="text-sm font-mono text-paper/80">
                                  {apt.date ? apt.date.split('-').reverse().join('/') : '---'}
                                </p>
                                <p className="text-gold font-bold text-lg">{apt.time}</p>
                              </div>
                              <button 
                                onClick={() => handleCancelAppointment(apt.id)}
                                className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                title="Cancelar Agendamento"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                            <span className="text-[10px] uppercase tracking-widest text-paper/30">Serviço</span>
                            <span className="text-xs font-medium text-paper/90">{apt.service}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="mt-auto py-12 px-6 border-t border-white/5 bg-black/50">
        <div className="max-w-md mx-auto grid grid-cols-1 gap-8 text-center sm:text-left">
          <div className="space-y-4">
            <h4 className="font-display text-gold tracking-widest uppercase text-sm">Onde Estamos</h4>
            <div className="flex items-center justify-center sm:justify-start gap-3 text-paper/60">
              <MapPin size={18} className="text-gold" />
              <p className="text-sm">Rua Expedícionaro Souza Filho, 244 - Centro<br />Boituva, SP</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-display text-gold tracking-widest uppercase text-sm">Contato</h4>
            <div className="flex items-center justify-center sm:justify-start gap-3 text-paper/60">
              <Phone size={18} className="text-gold" />
              <a href="https://wa.me/5515997278405" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-gold transition-colors">
                (15) 99727-8405
              </a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-display text-gold tracking-widest uppercase text-sm">Siga-nos</h4>
            <div className="flex justify-center sm:justify-start gap-6">
              <a href="https://www.instagram.com/barbearia.macchine/" target="_blank" rel="noopener noreferrer" className="text-paper/40 hover:text-gold transition-colors"><Instagram size={24} /></a>
              <a href="https://www.facebook.com/barbeariamacchine" target="_blank" rel="noopener noreferrer" className="text-paper/40 hover:text-gold transition-colors"><Facebook size={24} /></a>
            </div>
          </div>

          <p className="text-[10px] text-paper/20 uppercase tracking-[0.2em] pt-8">
            © 2026 Barbearia Macchine. Todos os direitos reservados.
          </p>
          <button 
            onClick={() => { setIsAdmin(true); setError(''); }} 
            className="text-[10px] text-paper/10 hover:text-gold/30 transition-colors uppercase tracking-[0.2em] mt-2"
          >
            Acesso Restrito
          </button>
        </div>
      </footer>
    </div>
  );
}
