import React, { useState } from "react";
import { User } from "../types";
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  KeyRound, 
  Globe, 
  CheckCircle2, 
  Cpu, 
  FolderLock, 
  Sparkles, 
  FolderDown, 
  Laptop 
} from "lucide-react";

interface AuthPortalProps {
  onLoginSuccess: (user: User) => void;
}

type Language = "zh" | "en";

export function AuthPortal({ onLoginSuccess }: AuthPortalProps) {
  const [lang, setLang] = useState<Language>("zh");
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Translation Dictionaries
  const t = {
    zh: {
      appName: "灵感卫士 • 独立安全提示词库",
      appSub: "独立沙盒云提示词库 • 极客级生图图集安全存贮舱",
      introTitle: "关于 PROMPT VAULT 灵感卫士",
      introSub: "为独立生图创作者精心量身定制的无共享、纯单兵、极客级私密画集与 AI 提示词档案柜。",
      feat1Title: "多用户沙盒全隔离",
      feat1Desc: "每个账户对应完全独立的沙盒数据，绝对没有公共游客/分享页，防止任何商业灵感泄露。",
      feat2Title: "AI 逆向微调推荐",
      feat2Desc: "直连服务端多模态 Gemini 节点，拖拽图片秒级反推底层精妙提示词，并全自动标记推荐标签。",
      feat3Title: "活页子合集立体整理",
      feat3Desc: "支持创建无限子文件夹、合集归档，配合多维度快速搜索、标签过滤，灵感瞬息可达。",
      feat4Title: "本地及离线双缓存",
      feat4Desc: "所有敏感图形资产数据随走随存，断网状态丝毫不降级，给您带来丝滑的纯本地安全感。",
      loginTab: "安全密令登入",
      registerTab: "自助开通账户",
      emailLabel: "本地档案锁账户 (支持任意格式邮箱/用户名)",
      emailPlace: "例如: user@example.com 或 任意账号/邮箱名",
      passwordLabel: "密保登入暗号 (密码)",
      passwordPlace: "至少 6 位数字或字符密码",
      confirmLabel: "再次确认密码 (Confirm Password)",
      confirmPlace: "再次输入相同的字符密码",
      submitLogin: "授权密钥 • 切入保险库",
      submitRegister: "确认无误 • 开通我的私库",
      btnConnecting: "加密通道连接中...",
      warningSandbox: "LOCAL SANDBOX SECURE",
      warningIsolated: "ISOLATED PER USER",
      alertNoFields: "请完整填写所有必填字段。",
      alertEmailInvalid: "管理员/账户名无效：请输入至少3个字符(支持任意格式的邮箱及名称)。",
      alertPasswordShort: "密码安全级别过低：密码长度至少需要 6 个字符。",
      alertPasswordMismatch: "两次输入的暗号密码不一致，请仔细核对。",
      alertUserExists: "该邮箱或账户名已被注册！请直接登录或换用其它名称。",
      alertRegisterSuccess: "账号开通成功！已自动为您切换到登录界面。",
      alertLoginFail: "验证未通过！邮箱/账户不存在或登入密码错误。",
      languageSwitch: "Language / 语言更换"
    },
    en: {
      appName: "PROMPT VAULT",
      appSub: "Isolated Local AI Prompt Vault & Premium Artwork Security Storage",
      introTitle: "About PROMPT VAULT",
      introSub: "A highly-secured, no-sharing, multi-user isolated bunker crafted custom for visual prompt craftspeople.",
      feat1Title: "Isolated Sandbox Storage",
      feat1Desc: "Complete division of account databases. No guest or public sharing links, fully preserving exclusive ideas.",
      feat2Title: "AI Reverse Multimodal Eng.",
      feat2Desc: "Direct server-side multimodal Gemini integration. Drag-and-drop to reverse-engineer prompts instantly.",
      feat3Title: "Subcollections Hierarchy",
      feat3Desc: "Organize files into dynamic subfolders. Locate any inspiration instantly with structured labels & speed filters.",
      feat4Title: "Resilient Storage Sandbox",
      feat4Desc: "Data persistent directly in your personal sandbox container, operational even under disconnected networks.",
      loginTab: "Vault Sign In",
      registerTab: "Self-service Activation",
      emailLabel: "E-mail / Username Sandbox Account",
      emailPlace: "e.g., coder@aistudio.com or any user-ID",
      passwordLabel: "Master Credentials Password",
      passwordPlace: "At least 6 characters",
      confirmLabel: "Re-confirm Credentials Code",
      confirmPlace: "Type your security key again",
      submitLogin: "Authorize Key • Connect Vault",
      submitRegister: "Build Sandbox • Initialize Storage",
      btnConnecting: "Establishing Security Tunnel...",
      warningSandbox: "LOCAL SANDBOX SECURE",
      warningIsolated: "ISOLATED PER USER",
      alertNoFields: "Please complete all fields to proceed.",
      alertEmailInvalid: "Invalid account name/email format (must be at least 3 characters).",
      alertPasswordShort: "Security risk: Password must be at least 6 characters.",
      alertPasswordMismatch: "The passwords entered do not match. Please review.",
      alertUserExists: "Email or account name already exists! Please log in directly or use an alternative.",
      alertRegisterSuccess: "Account initialized successfully! Redirected to sign-in.",
      alertLoginFail: "Verification denied. Incorrect mailbox or security code.",
      languageSwitch: "Switch Language / 语言更换"
    }
  };

  const validateEmail = (emailStr: string) => {
    return emailStr.trim().length >= 3;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError(t[lang].alertNoFields);
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError(t[lang].alertEmailInvalid);
      return;
    }

    if (trimmedPassword.length < 6) {
      setError(t[lang].alertPasswordShort);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const storedUsersRaw = localStorage.getItem("prompt_vault_users");
      const users: Array<{ id: string; email: string; password?: string }> = storedUsersRaw
        ? JSON.parse(storedUsersRaw)
        : [];

      if (isRegister) {
        if (trimmedPassword !== confirmPassword.trim()) {
          setError(t[lang].alertPasswordMismatch);
          setIsLoading(false);
          return;
        }

        const userExists = users.some((u) => u.email === trimmedEmail);
        if (userExists) {
          setError(t[lang].alertUserExists);
          setIsLoading(false);
          return;
        }

        const newUser = {
          id: "usr-" + Date.now().toString(36),
          email: trimmedEmail,
          password: trimmedPassword,
        };

        const updatedUsers = [...users, newUser];
        localStorage.setItem("prompt_vault_users", JSON.stringify(updatedUsers));

        setSuccess(t[lang].alertRegisterSuccess);
        setIsRegister(false);
        setPassword("");
        setConfirmPassword("");
        setIsLoading(false);
      } else {
        const foundUser = users.find(
          (u) => u.email === trimmedEmail && u.password === trimmedPassword
        );

        if (!foundUser) {
          setError(t[lang].alertLoginFail);
          setIsLoading(false);
          return;
        }

        onLoginSuccess({
          id: foundUser.id,
          email: foundUser.email,
        });
        setIsLoading(false);
      }
    }, 1100);
  };

  return (
    <div className="min-h-screen bg-[#020005] flex items-center justify-center p-4 lg:p-8 relative overflow-hidden font-sans select-none selection:bg-purple-550/30 selection:text-white">
      {/* Decorative Blur Background Radiance */}
      <div className="absolute top-[-25%] left-[-15%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[700px] h-[700px] bg-fuchsia-955/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[350px] h-[350px] bg-purple-950/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Main Double-Sided Container Grid */}
      <div className="w-full max-w-[1040px] bg-[#070311] border border-purple-500/10 rounded-3xl grid grid-cols-1 md:grid-cols-12 overflow-hidden shadow-[0_35px_90px_rgba(0,0,0,0.9)] relative z-10 animate-scale-in">
        
        {/* LEFT PANEL: App Intro & Highlights + Language Switcher */}
        <div className="md:col-span-6 bgs-[#070311] bg-gradient-to-b from-[#0b0518] to-[#05020c] p-8 lg:p-11 flex flex-col justify-between border-b md:border-b-0 md:border-r border-purple-500/10 relative">
          {/* Grid deco Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          
          <div className="relative z-10 space-y-8">
            {/* Upper Logo block */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-950/10 shrink-0">
                <KeyRound className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-100 tracking-tight leading-none flex items-center gap-2">
                  <span>{t[lang].appName}</span>
                  <span className="bg-purple-500/15 text-purple-400 text-[9px] tracking-widest px-2 py-0.5 rounded border border-purple-500/25 font-mono">
                    V2.5
                  </span>
                </h1>
                <p className="text-[11px] text-white/35 tracking-tight mt-1.5 font-medium select-text font-mono">
                  SECURE VAULT SANDBOX
                </p>
              </div>
            </div>

            {/* Intro text */}
            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-200 tracking-tight flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400 shrink-0" />
                <span>{t[lang].introTitle}</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                {t[lang].introSub}
              </p>
            </div>

            {/* Feature lists structured beautifully */}
            <div className="space-y-4 pt-2">
              {/* Feature 1 */}
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-purple-500/5 border border-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <FolderLock size={12} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold text-slate-300 tracking-wide uppercase">
                    {t[lang].feat1Title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-sm leading-relaxed font-medium">
                    {t[lang].feat1Desc}
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-purple-500/5 border border-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <Cpu size={12} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold text-slate-300 tracking-wide uppercase">
                    {t[lang].feat2Title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-sm leading-relaxed font-medium">
                    {t[lang].feat2Desc}
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-purple-500/5 border border-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <FolderDown size={12} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold text-slate-300 tracking-wide uppercase">
                    {t[lang].feat3Title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-sm leading-relaxed font-medium">
                    {t[lang].feat3Desc}
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-purple-500/5 border border-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <Laptop size={12} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold text-slate-300 tracking-wide uppercase">
                    {t[lang].feat4Title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-sm leading-relaxed font-medium">
                    {t[lang].feat4Desc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* LOWER SECTION: Language Changer toggles */}
          <div className="mt-8 pt-5 border-t border-white/[0.04] relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Globe size={13} className="text-slate-500" />
              <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wide">
                LANGS:
              </span>
            </div>
            
            {/* Language Selection pills */}
            <div className="flex bg-[#020005]/95 border border-purple-500/10 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setLang("zh")}
                className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                  lang === "zh"
                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/20 shadow-sm"
                    : "text-slate-500 hover:text-slate-400"
                }`}
              >
                🇨🇳 繁简中文
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                  lang === "en"
                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/20 shadow-sm"
                    : "text-slate-500 hover:text-slate-400"
                }`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>
        </div>


        {/* RIGHT PANEL: Authentic Interactive Forms (Registration & Log-in) */}
        <div className="md:col-span-6 p-8 lg:p-11 flex flex-col justify-center bg-[#05020c]">
          
          {/* Form Header info */}
          <div className="mb-6">
            <h3 className="text-sm font-extrabold text-slate-200 tracking-wide">
              {isRegister ? t[lang].registerTab : t[lang].loginTab}
            </h3>
            {lang === "zh" ? (
              isRegister ? (
                <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed bg-zinc-950/40 p-2.5 rounded-lg border border-white/5 font-normal select-text">
                  💡 <span className="font-semibold text-slate-200">本地自助开通：</span>输入任意格式的邮箱和 6 位密码即可创建您的本地主档案锁（这会生成一套全新的专属沙盒，与其他本地账户的画集完全隔离）。
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  通过已绑定的专属密令账户切入存贮档案柜。本系统安全隔离，绝对隐私。
                </p>
              )
            ) : (
              isRegister ? (
                <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed bg-zinc-950/40 p-2.5 rounded-lg border border-white/5 font-normal select-text font-mono">
                  💡 <span className="font-semibold text-slate-200 font-sans">Self-service Activation:</span> Input any format of email/id and a 6-digit password to initialize your exclusive isolated sandbox vault, completely separate from others.
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-mono">
                  Connect to your exclusive vault container using your registered credentials.
                </p>
              )
            )}
          </div>

          {/* Inline Tab Switching buttons to select sign-up or log-in */}
          <div className="grid grid-cols-2 gap-1 bg-[#020005]/45 border border-purple-500/10 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
                setSuccess(null);
              }}
              className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                !isRegister
                  ? "bg-[#0b0518] text-purple-400 border border-purple-500/20 shadow-xs"
                  : "text-slate-500 hover:text-slate-455"
              }`}
            >
              {t[lang].loginTab}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
                setSuccess(null);
              }}
              className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                isRegister
                  ? "bg-[#0b0518] text-purple-400 border border-purple-500/20 shadow-xs"
                  : "text-slate-500 hover:text-slate-455"
              }`}
            >
              {t[lang].registerTab}
            </button>
          </div>

          {/* Error and Alert boxes */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-[10px] text-red-400 font-bold leading-relaxed animate-shake">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/25 text-[11px] text-emerald-400 font-bold leading-relaxed animate-fade-in">
              ✨ {success}
            </div>
          )}

          {/* Form Actions */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input E-mail */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold tracking-wider text-white/35 uppercase">
                {t[lang].emailLabel}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                  <Mail size={12} />
                </span>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder={t[lang].emailPlace}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#020005]/85 hover:bg-[#020005] focus:bg-[#020005] border border-purple-500/10 focus:border-purple-500/35 rounded-xl py-2 pl-8.5 pr-4 text-xs font-mono text-slate-200 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500/15 transition-all"
                />
              </div>
            </div>

            {/* Input Security Password Code */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold tracking-wider text-white/35 uppercase">
                {t[lang].passwordLabel}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                  <Lock size={12} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  placeholder={t[lang].passwordPlace}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#020005]/85 hover:bg-[#020005] focus:bg-[#020005] border border-purple-500/10 focus:border-purple-500/35 rounded-xl py-2 pl-8.5 pr-9 text-xs text-slate-200 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500/15 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 hover:text-slate-200 text-slate-500 cursor-pointer"
                  title={showPassword ? "隐藏" : "显示"}
                >
                  {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>

            {/* Input Confirm Password for Sign-Up tab */}
            {isRegister && (
              <div className="space-y-1 animate-scale-in">
                <label className="block text-[9px] font-bold tracking-wider text-white/35 uppercase">
                  {t[lang].confirmLabel}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                    <Lock size={12} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isLoading}
                    placeholder={t[lang].confirmPlace}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#020005]/85 hover:bg-[#020005] focus:bg-[#020005] border border-purple-500/10 focus:border-purple-500/35 rounded-xl py-2 pl-8.5 pr-4 text-xs text-slate-200 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500/15 transition-all font-mono"
                  />
                </div>
              </div>
            )}

            {/* Standard submit button for email login/account build */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 bg-purple-700 hover:bg-purple-650 disabled:opacity-50 text-white font-bold text-xs tracking-wider rounded-xl transition-all shadow-md shadow-purple-955/40 cursor-pointer flex items-center justify-center gap-2 active:scale-99"
            >
              {isLoading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>{t[lang].btnConnecting}</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={13} />
                  <span>{isRegister ? t[lang].submitRegister : t[lang].submitLogin}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-3 text-[10px] text-white/20 font-mono">
            <span>{t[lang].warningSandbox}</span>
            <span>•</span>
            <span>{t[lang].warningIsolated}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
