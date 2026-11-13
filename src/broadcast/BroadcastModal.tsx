import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Cast,
  Monitor,
  Smartphone,
  Copy,
  Check,
  X,
  ExternalLink,
  Wifi,
  Users,
  ArrowRight,
} from 'lucide-react';
import { useBroadcast } from './BroadcastContext';

export interface BroadcastModalProps {
  currentDeckSlideIndex?: number;
  currentDeckSubStep?: number;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  currentDeckSlideIndex = 0,
  currentDeckSubStep = 0,
}) => {
  const {
    mode,
    roomId,
    connected,
    roomState,
    isBroadcastModalOpen,
    networkInfo,
    closeBroadcastModal,
    startPresenting,
    joinAsScreen,
    joinAsPresenter,
    leaveBroadcast,
  } = useBroadcast();

  const [activeTab, setActiveTab] = useState<'host' | 'join'>('host');
  const [qrTargetRole, setQrTargetRole] = useState<'screen' | 'presenter'>('screen');
  const [selectedBaseUrl, setSelectedBaseUrl] = useState<string>('');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Lista de URLs base disponíveis (IPs da rede LAN local + URL atual do navegador)
  const availableBaseUrls = useMemo(() => {
    const list: Array<{ label: string; url: string }> = [];
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      const isLocalhost =
        currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');

      if (networkInfo?.lanUrls && networkInfo.lanUrls.length > 0) {
        networkInfo.lanUrls.forEach((lanUrl, idx) => {
          list.push({
            label: `Rede LAN Local (${networkInfo.lanIps[idx] || idx + 1})`,
            url: lanUrl,
          });
        });
      }

      if (!isLocalhost || list.length === 0) {
        list.unshift({
          label: isLocalhost ? 'Este Dispositivo (Localhost)' : 'Endereço de Rede Atual',
          url: currentOrigin,
        });
      } else {
        list.push({
          label: 'Este Computador (Localhost)',
          url: currentOrigin,
        });
      }
    }
    return list;
  }, [networkInfo]);

  useEffect(() => {
    if (availableBaseUrls.length > 0 && !selectedBaseUrl) {
      setSelectedBaseUrl(availableBaseUrls[0].url);
    }
  }, [availableBaseUrls, selectedBaseUrl]);

  const shareUrl = useMemo(() => {
    const base =
      selectedBaseUrl ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const roleParam = qrTargetRole === 'screen' ? 'tela' : 'apresentador';
    return `${base}/?sala=${encodeURIComponent(roomId)}&modo=${roleParam}`;
  }, [selectedBaseUrl, roomId, qrTargetRole]);

  useEffect(() => {
    if (!isBroadcastModalOpen || !shareUrl) return;
    let active = true;
    QRCode.toDataURL(shareUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#080d1a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [isBroadcastModalOpen, shareUrl]);

  if (!isBroadcastModalOpen) return null;

  const screensCount = roomState.presence.filter((p) => p.role === 'screen').length;
  const presentersCount = roomState.presence.filter((p) => p.role === 'presenter').length;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignora se bloqueado pelo navegador
    }
  };

  return (
    <div
      onClick={closeBroadcastModal}
      className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl bg-[#f7f5ef] border border-stone-200 shadow-2xl overflow-hidden text-[#0f0f0f]"
      >
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 bg-[#080d1a] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#dc143c] flex items-center justify-center shrink-0">
              <Cast className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-extrabold tracking-tight truncate">
                Transmissão Multi-Telas em Rede (LAN)
              </h2>
              <p className="font-sans text-xs text-white/70 truncate">
                Sincronize slides, laser pointer, desenhos e tela do apresentador entre dispositivos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeBroadcastModal}
            aria-label="Fechar janela de transmissão"
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor de Modo (Transmitir vs Conectar a uma Sala) */}
        <div className="px-6 pt-4 flex items-center justify-between gap-4 flex-wrap border-b border-stone-200 pb-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-200/75">
            <button
              type="button"
              onClick={() => setActiveTab('host')}
              className={`px-4 py-2 rounded-lg font-sans text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'host'
                  ? 'bg-white text-[#080d1a] shadow-sm'
                  : 'text-stone-600 hover:text-[#080d1a]'
              }`}
            >
              Transmitir / Gerenciar Sala ({roomId})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('join')}
              className={`px-4 py-2 rounded-lg font-sans text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'join'
                  ? 'bg-white text-[#080d1a] shadow-sm'
                  : 'text-stone-600 hover:text-[#080d1a]'
              }`}
            >
              Digitar Código de Outra Sala
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-sans text-stone-600">
            <Wifi className={`w-4 h-4 ${connected ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span>
              {connected ? 'Servidor em Tempo Real Conectado' : 'Conectando à sala...'}
            </span>
          </div>
        </div>

        {activeTab === 'host' ? (
          <div className="p-6 space-y-5">
            {/* Linha Principal: QR Code + Detalhes da Sala */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              {/* Coluna QR Code */}
              <div className="md:col-span-5 rounded-2xl bg-white border border-stone-200 p-4 flex flex-col items-center justify-between text-center">
                <div className="w-full flex items-center justify-center gap-1 p-1 rounded-lg bg-stone-100 mb-3">
                  <button
                    type="button"
                    onClick={() => setQrTargetRole('screen')}
                    className={`flex-1 py-1.5 px-2 rounded-md font-sans text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      qrTargetRole === 'screen'
                        ? 'bg-[#003893] text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    QR para Telão
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrTargetRole('presenter')}
                    className={`flex-1 py-1.5 px-2 rounded-md font-sans text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      qrTargetRole === 'presenter'
                        ? 'bg-[#dc143c] text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    QR para Celular
                  </button>
                </div>

                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code de conexão rápida na rede LAN"
                    className="w-44 h-44 rounded-xl border border-stone-100"
                  />
                ) : (
                  <div className="w-44 h-44 rounded-xl bg-stone-100 flex items-center justify-center text-xs text-stone-400">
                    Gerando QR...
                  </div>
                )}

                <p className="font-sans text-xs text-stone-600 mt-2.5 leading-snug">
                  {qrTargetRole === 'screen'
                    ? 'Escaneie ou abra o link na Smart TV / Projetor para receber os slides'
                    : 'Escaneie com seu Celular para usá-lo como Console do Apresentador'}
                </p>
              </div>

              {/* Coluna Código & Endereço de Rede */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                <div className="rounded-2xl bg-white border border-stone-200 p-4 flex items-center justify-between">
                  <div>
                    <div className="font-sans text-xs font-bold uppercase tracking-wider text-stone-500">
                      Código da Sala
                    </div>
                    <div className="font-mono text-3xl font-black tracking-[0.18em] text-[#003893] tabular-nums mt-0.5">
                      {roomId}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-stone-600">
                      <Users className="w-4 h-4 text-[#003893]" />
                      <span className="tabular-nums">
                        {screensCount} {screensCount === 1 ? 'telão' : 'telões'} · {presentersCount}{' '}
                        {presentersCount === 1 ? 'controle' : 'controles'}
                      </span>
                    </div>
                    <div className="mt-1">
                      <a
                        href={`/?sala=${encodeURIComponent(roomId)}&modo=tela`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#dc143c] hover:underline"
                      >
                        <span>Abrir Aba de Telão (HDMI)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Seletor de IP / Rede */}
                {availableBaseUrls.length > 1 && (
                  <div>
                    <label className="block font-sans text-xs font-bold text-stone-600 mb-1">
                      Endereço na Rede Local (LAN / Wi-Fi):
                    </label>
                    <select
                      value={selectedBaseUrl}
                      onChange={(e) => setSelectedBaseUrl(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 font-sans text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#003893]"
                    >
                      {availableBaseUrls.map((item) => (
                        <option key={item.url} value={item.url}>
                          {item.label} — {item.url}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Link Copiável */}
                <div>
                  <label className="block font-sans text-xs font-bold text-stone-600 mb-1">
                    {qrTargetRole === 'screen'
                      ? 'Link Direto para Telas Receptoras:'
                      : 'Link Direto para Console do Apresentador:'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 min-w-0 rounded-xl border border-stone-300 bg-white px-3 py-2 font-mono text-xs text-stone-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-sans text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações Principais para Este Dispositivo */}
            <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {mode !== 'standalone' ? (
                <button
                  type="button"
                  onClick={leaveBroadcast}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-200/70 text-stone-700 font-sans text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
                >
                  Desconectar Este Dispositivo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => joinAsScreen(roomId)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-[#08254c] font-sans text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Monitor className="w-4 h-4 text-[#003893]" />
                  <span>Usar Esta Tela como Telão Receptor</span>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  startPresenting(roomId, {
                    slideIndex: currentDeckSlideIndex,
                    subStep: currentDeckSubStep,
                  })
                }
                className="px-5 py-3 rounded-xl bg-[#dc143c] hover:bg-[#b81032] text-white font-sans text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>
                  {mode === 'presenter'
                    ? 'Voltar ao Console do Apresentador'
                    : 'Transmitir Daqui (Abrir Tela do Apresentador)'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Aba 2: Conectar a uma Sala Existente pelo Código de 4 Dígitos */
          <div className="p-6 space-y-5">
            <div>
              <label className="block font-sans text-sm font-bold text-[#080d1a] mb-1.5">
                Digite o Código de 4 dígitos exibido no dispositivo principal:
              </label>
              <input
                type="text"
                maxLength={8}
                placeholder="Ex: 4829"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 font-mono text-2xl font-black tracking-[0.25em] text-center text-[#003893] focus:outline-none focus:ring-2 focus:ring-[#003893]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={!joinCodeInput.trim()}
                onClick={() => joinAsScreen(joinCodeInput)}
                className="p-4 rounded-2xl border border-stone-300 bg-white hover:border-[#003893] disabled:opacity-40 disabled:cursor-not-allowed text-left transition-all cursor-pointer flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-[#003893]/10 text-[#003893] flex items-center justify-center shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-sans text-sm font-extrabold text-[#080d1a]">
                    Receber como Telão
                  </div>
                  <div className="font-sans text-xs text-stone-600">
                    Exibe os slides em tela cheia acompanhando o apresentador
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={!joinCodeInput.trim()}
                onClick={() => joinAsPresenter(joinCodeInput)}
                className="p-4 rounded-2xl border border-[#dc143c]/30 bg-[#dc143c]/[0.05] hover:bg-[#dc143c]/[0.10] disabled:opacity-40 disabled:cursor-not-allowed text-left transition-all cursor-pointer flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-[#dc143c] text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-sans text-sm font-extrabold text-[#080d1a]">
                    Assumir como Apresentador
                  </div>
                  <div className="font-sans text-xs text-stone-600">
                    Controla slides, laser, desenhos e lê anotações
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
