import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ── PALETA DE CORES ──────────────────────────────────────────────────────────
const C = {
  primary:      "#2E7D32",
  primaryDark:  "#1B5E20",
  primaryLight: "#4CAF50",
  accent:       "#66BB6A",
  success:      "#2E7D32",
  successLight: "#E8F5E9",
  danger:       "#D32F2F",
  dangerLight:  "#FFEBEE",
  warning:      "#F9A825",
  warningLight: "#FFF8E1",
  text:         "#1A1A2E",
  textSec:      "#666",
  border:       "#E0E8E0",
  bg:           "#F5F9F5",
};

// ── SVG PATHS ────────────────────────────────────────────────────────────────
const paths = {
  truck:    "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zM18 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
  check:    "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  water:    "M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2z",
  lock:     "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
  person:   "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  phone:    "M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  location: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  logout:   "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
};
const Icon = ({ name, size = 20, color = C.text }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d={paths[name] || ""}/></svg>
);

// ── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (v) => Number(v || 0).toFixed(2).replace(".", ",");
const fmtDate = (d) => {
  if (!d) return "-";
  const str = typeof d === "string" && !d.includes("T") ? d + "T12:00" : d;
  return new Date(str).toLocaleDateString("pt-BR");
};

const btn = (extra = {}) => ({
  border: "none", borderRadius: 12, cursor: "pointer", display: "flex",
  alignItems: "center", gap: 6, fontFamily: "inherit", fontWeight: "600",
  transition: "all 0.15s", ...extra,
});

const card = (extra = {}) => ({
  background: "#fff", borderRadius: 16, padding: 20,
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: `1px solid ${C.border}`, ...extra,
});

// ── ESTOQUE ──────────────────────────────────────────────────────────────────
const decrementarEstoque = async (quantidade) => {
  if (!quantidade || quantidade <= 0) return;
  const { data: estoque } = await supabase
    .from("estoque").select("id, galoes_cheios, galoes_vazios").limit(1).single();
  if (estoque) {
    await supabase.from("estoque").update({
      galoes_cheios: Math.max(0, estoque.galoes_cheios - quantidade),
      galoes_vazios: estoque.galoes_vazios + quantidade,
    }).eq("id", estoque.id);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  TELA DE LOGIN
// ══════════════════════════════════════════════════════════════════════════════
const LoginScreen = ({ onLogin }) => {
  const [cpf, setCpf]           = useState("");
  const [senha, setSenha]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [erro, setErro]         = useState("");

  const cpfLimpo = (v) => v.replace(/\D/g, "");
  const cpfMask = (v) => {
    const n = cpfLimpo(v).slice(0, 11);
    if (n.length <= 3) return n;
    if (n.length <= 6) return n.slice(0,3) + "." + n.slice(3);
    if (n.length <= 9) return n.slice(0,3) + "." + n.slice(3,6) + "." + n.slice(6);
    return n.slice(0,3) + "." + n.slice(3,6) + "." + n.slice(6,9) + "-" + n.slice(9);
  };

  const entrar = async (e) => {
    e.preventDefault();
    const cpfNum = cpfLimpo(cpf);
    if (cpfNum.length !== 11) { setErro("CPF deve ter 11 dígitos"); return; }
    setLoading(true); setErro("");
    const email = cpfNum + "@entregador.acquaforever.com";
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      setErro("CPF ou senha inválidos");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:`linear-gradient(155deg, ${C.primaryDark} 0%, ${C.primary} 50%, ${C.accent} 100%)`,
      padding:20 }}>
      <div style={{ ...card({ padding:"32px 28px", maxWidth:380, width:"100%" }) }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ width:56, height:56, borderRadius:"50%",
            background:`linear-gradient(135deg,${C.primaryDark},${C.primary})`,
            display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
            <Icon name="truck" size={28} color="#fff"/>
          </div>
          <div style={{ fontSize:20, fontWeight:"800", color:C.text,
            fontFamily:"'Outfit',sans-serif" }}>Acqua Forever</div>
          <div style={{ fontSize:13, color:C.textSec, marginTop:2 }}>Painel do Entregador</div>
        </div>

        <form onSubmit={entrar}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:"700", color:C.textSec,
              display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.5px" }}>CPF</label>
            <input type="text" value={cpfMask(cpf)} onChange={e => setCpf(e.target.value)}
              required placeholder="000.000.000-00" maxLength={14}
              style={{ width:"100%", padding:"11px 14px", borderRadius:10,
                border:`1.5px solid ${C.border}`, fontSize:18, fontWeight:"700",
                fontFamily:"'Outfit',monospace", letterSpacing:"1px", textAlign:"center" }}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, fontWeight:"700", color:C.textSec,
              display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.5px" }}>Senha</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required
              placeholder="••••••••"
              style={{ width:"100%", padding:"11px 14px", borderRadius:10,
                border:`1.5px solid ${C.border}`, fontSize:14, fontFamily:"inherit" }}/>
          </div>

          {erro && (
            <div style={{ background:C.dangerLight, color:C.danger, padding:"8px 12px",
              borderRadius:10, fontSize:12, fontWeight:"600", marginBottom:14, textAlign:"center" }}>
              {erro}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ ...btn({ width:"100%", padding:"12px", justifyContent:"center", fontSize:15 }),
              background:`linear-gradient(135deg,${C.primaryDark},${C.primary})`,
              color:"#fff", opacity: loading ? 0.7 : 1 }}>
            <Icon name="lock" size={16} color="#fff"/>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  TELA PRINCIPAL — ENTREGAS EM ANDAMENTO
// ══════════════════════════════════════════════════════════════════════════════
const EntregasScreen = ({ perfil, onLogout }) => {
  const [abaEnt, setAbaEnt]       = useState("pendentes"); // "pendentes" | "historico"
  const [entregas, setEntregas]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [keywords, setKeywords]   = useState({});     // { deliveryId: "PURA47" }
  const [validando, setValidando] = useState(null);
  const [resultado, setResultado] = useState({});     // { deliveryId: "ok" | "erro" }
  const [historico, setHistorico] = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);

  const carregar = async () => {
    setLoading(true);
    // Deliveries em rota (via view com dados do cliente)
    const { data: delData } = await supabase.from("entregas_em_rota")
      .select("id, user_id, quantidade_planejada, data_agendada, keyword_code, full_name, celular, rua, numero, bairro")
      .order("data_agendada", { ascending: true });
    const entregas = (delData || []).map(e => ({
      ...e, _tipo: "delivery",
      profiles: { full_name: e.full_name, celular: e.celular, rua: e.rua, numero: e.numero, bairro: e.bairro },
    }));

    // Orders em entrega (pedidos avulsos)
    const { data: ordData } = await supabase.from("orders")
      .select("id, user_id, quantidade, keyword_code, created_at, numero, profiles(full_name, celular, rua, numero, bairro)")
      .eq("status", "em_entrega")
      .not("keyword_code", "is", null)
      .order("created_at", { ascending: true });
    const pedidos = (ordData || []).map(o => ({
      ...o, _tipo: "order",
      quantidade_planejada: o.quantidade,
      data_agendada: o.created_at,
    }));

    setEntregas([...entregas, ...pedidos]);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const validarKeyword = async (entrega) => {
    const digitada = (keywords[entrega.id] || "").trim().toUpperCase();
    if (!digitada) return;
    setValidando(entrega.id);

    if (digitada !== entrega.keyword_code?.toUpperCase()) {
      setResultado(r => ({ ...r, [entrega.id]: "erro" }));
      setValidando(null);
      return;
    }

    // Keyword válida — confirmar entrega
    const { data: configP } = await supabase.from("configuracoes").select("valor").eq("chave", "preco_galao_padrao").single();
    const precoUnit = Number(configP?.valor) || 13;
    const qty = entrega.quantidade_planejada || 1;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const entregadorId = authUser?.id || null;

    if (entrega._tipo === "order") {
      // Pedido avulso
      const { error } = await supabase.from("orders").update({
        status: "entregue", assinado: true, assinado_em: new Date().toISOString(),
        keyword_confirmed_at: new Date().toISOString(), entregador_id: entregadorId,
      }).eq("id", entrega.id);
      if (error) { alert("Erro: " + error.message); setValidando(null); return; }
      await decrementarEstoque(qty);
    } else {
      // Delivery agendada — usa data local (Brasília) pra evitar shift UTC
      const hoje = new Date();
      const dataLocal = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}-${String(hoje.getDate()).padStart(2,"0")}`;
      const { error } = await supabase.from("deliveries").update({
        status: "entregue", data_entregue: dataLocal,
        preco_unitario: precoUnit, keyword_confirmed_at: new Date().toISOString(),
        entregador_id: entregadorId,
      }).eq("id", entrega.id);
      if (error) { alert("Erro: " + error.message); setValidando(null); return; }
      await decrementarEstoque(qty);

      // Agenda próxima entrega
      const { data: profile } = await supabase.from("profiles")
        .select("frequencia_dias, galoes_por_entrega").eq("id", entrega.user_id).single();
      const freq = profile?.frequencia_dias || 7;
      const nextQty = profile?.galoes_por_entrega || qty;
      const prox = new Date(); prox.setDate(prox.getDate() + freq);
      const proxStr = prox.toISOString().split("T")[0];
      const { data: existe } = await supabase.from("deliveries").select("id")
        .eq("user_id", entrega.user_id).eq("status","agendada").gte("data_agendada", proxStr).maybeSingle();
      if (!existe) {
        await supabase.from("deliveries").insert({
          user_id: entrega.user_id, data_agendada: proxStr, status: "agendada", quantidade_planejada: nextQty,
        });
      }
    }

    setResultado(r => ({ ...r, [entrega.id]: "ok" }));
    setValidando(null);
    setTimeout(() => {
      setEntregas(prev => prev.filter(e => e.id !== entrega.id));
      setResultado(r => { const n = {...r}; delete n[entrega.id]; return n; });
    }, 2000);
  };

  const carregarHistorico = async () => {
    setLoadingHist(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { setLoadingHist(false); return; }

    // Deliveries confirmadas por este entregador
    const { data: delHist } = await supabase.from("deliveries")
      .select("id, quantidade_planejada, data_entregue, data_agendada, preco_unitario, profiles(full_name)")
      .eq("entregador_id", authUser.id).eq("status", "entregue")
      .order("data_entregue", { ascending: false }).limit(50);

    // Orders confirmadas por este entregador
    const { data: ordHist } = await supabase.from("orders")
      .select("id, quantidade, created_at, preco_unitario, numero, profiles(full_name)")
      .eq("entregador_id", authUser.id).eq("status", "entregue")
      .order("created_at", { ascending: false }).limit(50);

    const merged = [
      ...(delHist || []).map(d => ({
        _tipo: "delivery", id: d.id, cliente: d.profiles?.full_name || "—",
        qty: d.quantidade_planejada || 1, data: d.data_entregue || d.data_agendada,
        preco: d.preco_unitario,
      })),
      ...(ordHist || []).map(o => ({
        _tipo: "order", id: o.id, cliente: o.profiles?.full_name || "—",
        qty: o.quantidade || 1, data: o.created_at, preco: o.preco_unitario,
        numero: o.numero,
      })),
    ].sort((a, b) => new Date(b.data) - new Date(a.data));
    setHistorico(merged);
    setLoadingHist(false);
  };

  useEffect(() => { if (abaEnt === "historico") carregarHistorico(); }, [abaEnt]);

  // Totais do histórico
  const histTotal = historico.reduce((s, h) => s + h.qty, 0);
  const histValor = historico.reduce((s, h) => s + h.qty * Number(h.preco || 0), 0);

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${C.primaryDark},${C.primary})`,
        padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Icon name="truck" size={22} color="#fff"/>
          <div>
            <div style={{ fontSize:16, fontWeight:"800", color:"#fff",
              fontFamily:"'Outfit',sans-serif" }}>Entregas</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)" }}>
              {perfil?.full_name || "Entregador"}
            </div>
          </div>
        </div>
        <button onClick={onLogout} style={{ ...btn({ padding:"6px 12px", fontSize:12 }),
          background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.2)" }}>
          <Icon name="logout" size={14} color="#fff"/> Sair
        </button>
      </div>

      {/* Abas */}
      <div style={{ display:"flex", background:"#fff", borderBottom:`2px solid ${C.border}` }}>
        {[
          { id:"pendentes", label:"🚚 Pendentes", count: entregas.length },
          { id:"historico", label:"📋 Meu Histórico", count: historico.length },
        ].map(a => (
          <button key={a.id} onClick={() => setAbaEnt(a.id)}
            style={{ ...btn({ padding:"12px 20px", borderRadius:0, fontSize:13, fontWeight:"600", flex:1, justifyContent:"center" }),
              background: abaEnt===a.id ? C.primary : "transparent",
              color: abaEnt===a.id ? "#fff" : C.textSec,
              borderBottom: abaEnt===a.id ? `3px solid ${C.primaryDark}` : "3px solid transparent" }}>
            {a.label} {a.count > 0 ? `(${a.count})` : ""}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={{ padding:"16px 16px 32px" }}>

      {/* ════ ABA PENDENTES ════ */}
      {abaEnt === "pendentes" && (<>
        {/* Resumo */}
        <div style={{ ...card({ marginBottom:16, padding:"14px 18px",
          display:"flex", alignItems:"center", justifyContent:"space-between" }) }}>
          <div>
            <div style={{ fontSize:11, color:C.textSec, fontWeight:"700",
              textTransform:"uppercase", letterSpacing:"0.5px" }}>Em andamento</div>
            <div style={{ fontSize:28, fontWeight:"900", color:C.primary,
              fontFamily:"'Outfit',sans-serif" }}>{entregas.length}</div>
          </div>
          <button onClick={carregar} disabled={loading}
            style={{ ...btn({ padding:"8px 14px", fontSize:12 }),
              background:C.successLight, color:C.primary, border:`1px solid ${C.primary}33` }}>
            {loading ? "..." : "↻ Atualizar"}
          </button>
        </div>

        {/* Lista de entregas */}
        {loading ? (
          <div style={{ textAlign:"center", padding:40, color:C.textSec }}>Carregando...</div>
        ) : entregas.length === 0 ? (
          <div style={{ ...card({ textAlign:"center", padding:40 }) }}>
            <div style={{ fontSize:40, marginBottom:8 }}>🎉</div>
            <div style={{ fontSize:15, fontWeight:"700", color:C.text, marginBottom:4 }}>Nenhuma entrega pendente</div>
            <div style={{ fontSize:13, color:C.textSec }}>Todas as entregas foram concluídas!</div>
          </div>
        ) : entregas.map(e => {
          const res = resultado[e.id];
          return (
            <div key={e.id} style={{ ...card({ marginBottom:12, padding:0, overflow:"hidden",
              border: res === "ok" ? `2px solid ${C.success}` : res === "erro" ? `2px solid ${C.danger}` : `1px solid ${C.border}` }) }}>
              {/* Info do cliente */}
              <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:15, fontWeight:"700", color:C.text }}>{e.profiles?.full_name || "Cliente"}</span>
                      {e._tipo === "order" && (
                        <span style={{ fontSize:9, fontWeight:"700", color:C.primary, background:C.accent+"22",
                          padding:"2px 6px", borderRadius:4, textTransform:"uppercase" }}>Pedido {e.numero || ""}</span>
                      )}
                    </div>
                    <div style={{ fontSize:12, color:C.textSec, marginTop:2 }}>
                      <Icon name="phone" size={12} color={C.textSec}/> {e.profiles?.celular || "-"}
                    </div>
                  </div>
                  <div style={{ background:C.warningLight, color:C.warning, padding:"4px 10px",
                    borderRadius:8, fontSize:11, fontWeight:"700" }}>
                    📅 {fmtDate(e.data_agendada)}
                  </div>
                </div>
                {e.profiles?.rua && (
                  <div style={{ fontSize:12, color:C.textSec, display:"flex", alignItems:"center", gap:4, marginTop:4 }}>
                    <Icon name="location" size={13} color={C.textSec}/>
                    {e.profiles.rua}{e.profiles.numero ? `, ${e.profiles.numero}` : ""}{e.profiles.bairro ? ` — ${e.profiles.bairro}` : ""}
                  </div>
                )}
                <div style={{ marginTop:8, display:"flex", gap:8 }}>
                  <span style={{ background:C.accent+"22", color:C.primary, padding:"4px 10px",
                    borderRadius:8, fontSize:12, fontWeight:"700" }}>
                    <Icon name="water" size={12} color={C.primary}/> {e.quantidade_planejada || 1} galão{(e.quantidade_planejada || 1) > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Validação de keyword */}
              {res === "ok" ? (
                <div style={{ padding:"14px 16px", background:C.successLight, textAlign:"center" }}>
                  <Icon name="check" size={20} color={C.success}/>
                  <span style={{ marginLeft:8, fontSize:14, fontWeight:"700", color:C.success }}>
                    Entrega confirmada!
                  </span>
                </div>
              ) : (
                <div style={{ padding:"14px 16px", background:"#FAFFF5" }}>
                  <div style={{ fontSize:11, fontWeight:"700", color:C.textSec,
                    textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>
                    🔑 Palavra-chave do cliente
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <input
                      type="text"
                      placeholder="Digite a palavra-chave"
                      value={keywords[e.id] || ""}
                      onChange={ev => {
                        setKeywords(k => ({ ...k, [e.id]: ev.target.value.toUpperCase() }));
                        setResultado(r => { const n = {...r}; delete n[e.id]; return n; });
                      }}
                      style={{ flex:1, padding:"10px 14px", borderRadius:10, fontSize:15,
                        fontWeight:"700", fontFamily:"'Outfit',monospace", letterSpacing:"2px",
                        textTransform:"uppercase", textAlign:"center",
                        border: `2px solid ${res === "erro" ? C.danger : C.border}`,
                        background: res === "erro" ? C.dangerLight : "#fff" }}
                    />
                    <button onClick={() => validarKeyword(e)}
                      disabled={validando === e.id || !(keywords[e.id] || "").trim()}
                      style={{ ...btn({ padding:"10px 16px", fontSize:13, whiteSpace:"nowrap" }),
                        background:`linear-gradient(135deg,${C.primaryDark},${C.primary})`,
                        color:"#fff", opacity: validando === e.id ? 0.7 : 1 }}>
                      <Icon name="check" size={16} color="#fff"/>
                      {validando === e.id ? "..." : "Validar"}
                    </button>
                  </div>
                  {res === "erro" && (
                    <div style={{ marginTop:6, fontSize:12, color:C.danger, fontWeight:"600", textAlign:"center" }}>
                      ❌ Palavra-chave incorreta. Peça novamente ao cliente.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </>)}

      {/* ════ ABA HISTÓRICO ════ */}
      {abaEnt === "historico" && (
        <>
          {/* Resumo */}
          <div style={{ ...card({ marginBottom:16, padding:"14px 18px" }),
            display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontSize:11, color:C.textSec, fontWeight:"700",
                textTransform:"uppercase", letterSpacing:"0.5px" }}>Entregas realizadas</div>
              <div style={{ fontSize:28, fontWeight:"900", color:C.primary,
                fontFamily:"'Outfit',sans-serif" }}>{histTotal}
                <span style={{ fontSize:12, fontWeight:"500", color:C.textSec, marginLeft:4 }}>galões</span>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11, color:C.textSec, fontWeight:"700",
                textTransform:"uppercase", letterSpacing:"0.5px" }}>Valor total</div>
              <div style={{ fontSize:22, fontWeight:"900", color:C.text,
                fontFamily:"'Outfit',sans-serif" }}>R$ {fmt(histValor)}</div>
            </div>
            <button onClick={carregarHistorico} disabled={loadingHist}
              style={{ ...btn({ padding:"8px 14px", fontSize:12 }),
                background:C.successLight, color:C.primary, border:`1px solid ${C.primary}33` }}>
              {loadingHist ? "..." : "↻ Atualizar"}
            </button>
          </div>

          {/* Lista */}
          {loadingHist ? (
            <div style={{ textAlign:"center", padding:40, color:C.textSec }}>Carregando...</div>
          ) : historico.length === 0 ? (
            <div style={{ ...card({ textAlign:"center", padding:40 }) }}>
              <div style={{ fontSize:40, marginBottom:8 }}>📋</div>
              <div style={{ fontSize:15, fontWeight:"700", color:C.text }}>Nenhuma entrega registrada</div>
              <div style={{ fontSize:13, color:C.textSec }}>Suas entregas confirmadas aparecerão aqui.</div>
            </div>
          ) : historico.map((h, i) => (
            <div key={h.id} style={{ ...card({ marginBottom:8, padding:"12px 16px" }),
              display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:14, fontWeight:"600", color:C.text }}>{h.cliente}</span>
                  {h._tipo === "order" && (
                    <span style={{ fontSize:9, fontWeight:"700", color:C.primary, background:C.accent+"22",
                      padding:"2px 6px", borderRadius:4 }}>Pedido {h.numero || ""}</span>
                  )}
                </div>
                <div style={{ fontSize:12, color:C.textSec, marginTop:2 }}>
                  {fmtDate(h.data)} · {h.qty} galão{h.qty > 1 ? "s" : ""}
                  {h.preco ? ` · R$ ${fmt(h.preco)}/gal` : ""}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:15, fontWeight:"800", color:C.text,
                  fontFamily:"'Outfit',sans-serif" }}>
                  R$ {fmt(h.qty * Number(h.preco || 0))}
                </div>
                <span style={{ fontSize:10, fontWeight:"700", color:C.success,
                  background:C.successLight, padding:"2px 6px", borderRadius:4 }}>✓ Entregue</span>
              </div>
            </div>
          ))}
        </>
      )}

      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  APP ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [auth, setAuth]     = useState("loading"); // "loading" | "login" | "ok" | "denied"
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) verificarPerfil(session.user.id);
      else setAuth("login");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) verificarPerfil(session.user.id);
      else { setAuth("login"); setPerfil(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const verificarPerfil = async (userId) => {
    const { data } = await supabase.from("profiles")
      .select("full_name, perfil, ativo").eq("id", userId).single();
    if (data && (data.perfil === "entregador" || data.perfil === "admin") && data.ativo !== false) {
      setPerfil(data);
      setAuth("ok");
    } else {
      setAuth("denied");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuth("login");
  };

  if (auth === "loading") return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:C.bg }}>
      <div style={{ fontSize:16, color:C.textSec }}>Carregando...</div>
    </div>
  );

  if (auth === "denied") return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:C.bg, padding:20 }}>
      <div style={{ ...card({ textAlign:"center", padding:32, maxWidth:360 }) }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🚫</div>
        <div style={{ fontSize:16, fontWeight:"700", color:C.danger, marginBottom:8 }}>Acesso Negado</div>
        <div style={{ fontSize:13, color:C.textSec, marginBottom:16 }}>
          Este app é exclusivo para entregadores. Seu perfil não tem permissão de acesso.
        </div>
        <button onClick={logout} style={{ ...btn({ padding:"10px 20px", justifyContent:"center" }),
          background:C.dangerLight, color:C.danger, border:`1px solid ${C.danger}33` }}>
          <Icon name="logout" size={14} color={C.danger}/> Sair
        </button>
      </div>
    </div>
  );

  if (auth === "login") return <LoginScreen />;

  return <EntregasScreen perfil={perfil} onLogout={logout} />;
}
