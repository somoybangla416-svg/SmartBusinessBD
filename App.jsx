import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Shield, Wallet, ArrowDownRight, ArrowUpRight, Package, LifeBuoy, LogOut } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 text-xl font-bold">লোড হচ্ছে...</div>;
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      <Sidebar profile={profile} tab={tab} setTab={setTab} />
      <main className="flex-1 p-6 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-emerald-400 capitalize">{tab.replace('_', ' ')}</h1>
          <div className="flex items-center gap-4">
            <span className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-sm">
              ব্যালেন্স: <strong className="text-emerald-400">৳{profile?.balance || 0}</strong>
            </span>
            <button onClick={() => supabase.auth.signOut()} className="bg-red-600/20 text-red-400 px-3 py-2 rounded-lg hover:bg-red-600/30 flex items-center gap-2 text-sm">
              <LogOut size={16} /> লগআউট
            </button>
          </div>
        </header>

        {tab === 'dashboard' && <Dashboard profile={profile} />}
        {tab === 'deposit' && <DepositSection />}
        {tab === 'withdrawal' && <WithdrawSection profile={profile} />}
        {tab === 'packages' && <PackagesSection />}
        {tab === 'support' && <SupportSection />}
        {tab === 'admin' && profile?.role === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}

function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data?.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          { id: data.user.id, full_name: fullName, phone: phone, role: 'member', balance: 0 }
        ]);
        if (profileError) setError(profileError.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-6 text-emerald-400">Smart Business BD</h2>
        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="text-sm text-slate-400">পূর্ণ নাম</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400">মোবাইল নম্বর</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1 focus:border-emerald-500 outline-none" />
              </div>
            </>
          )}
          <div>
            <label className="text-sm text-slate-400">ইমেইল</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1 focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="text-sm text-slate-400">পাসওয়ার্ড</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1 focus:border-emerald-500 outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold p-3 rounded-lg transition-all">
            {loading ? 'অপেক্ষা করুন...' : (isLogin ? 'লগইন করুন' : 'রেজিস্ট্রেশন করুন')}
          </button>
        </form>
        <p className="text-center text-sm text-slate-400 mt-6">
          {isLogin ? 'একাউন্ট নেই?' : 'ইতিমধ্যেই একাউন্ট আছে?'} {' '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-emerald-400 hover:underline font-semibold">
            {isLogin ? 'রেজিস্ট্রেশন করুন' : 'লগইন করুন'}
          </button>
        </p>
      </div>
    </div>
  );
}

function Sidebar({ profile, tab, setTab }) {
  return (
    <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between">
      <div>
        <h1 className="text-xl font-bold text-emerald-400 mb-8">Smart Business</h1>
        <nav className="space-y-2">
          <button onClick={() => setTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${tab === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Wallet size={18} /> ড্যাশবোর্ড
          </button>
          <button onClick={() => setTab('deposit')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${tab === 'deposit' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <ArrowDownRight size={18} /> ডিপোজিট
          </button>
          <button onClick={() => setTab('withdrawal')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${tab === 'withdrawal' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <ArrowUpRight size={18} /> উইথড্রয়াল
          </button>
          <button onClick={() => setTab('packages')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${tab === 'packages' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Package size={18} /> বিজনেস প্যাকেজ
          </button>
          <button onClick={() => setTab('support')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${tab === 'support' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LifeBuoy size={18} /> সাপোর্ট
          </button>
          {profile?.role === 'admin' && (
            <button onClick={() => setTab('admin')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${tab === 'admin' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Shield size={18} /> অ্যাডমিন প্যানেল
            </button>
          )}
        </nav>
      </div>
    </aside>
  );
}

function Dashboard({ profile }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <p className="text-sm text-slate-400">মোট ব্যালেন্স</p>
          <h3 className="text-3xl font-bold text-emerald-400 mt-2">৳{profile?.balance || 0}</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <p className="text-sm text-slate-400">একাউন্টের ধরণ</p>
          <h3 className="text-3xl font-bold text-emerald-400 mt-2 capitalize">{profile?.role}</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <p className="text-sm text-slate-400">স্ট্যাটাস</p>
          <h3 className="text-3xl font-bold text-emerald-400 mt-2">সক্রিয়</h3>
        </div>
      </div>
    </div>
  );
}

function DepositSection() {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bKash');
  const [trxId, setTrxId] = useState('');
  const [message, setMessage] = useState(null);

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.rpc('handle_deposit', {
      p_amount: parseFloat(amount),
      p_method: method,
      p_trx_id: trxId
    });
    if (error) setMessage(error.message);
    else {
      setMessage('ডিপোজিট রিকোয়েস্ট সফলভাবে জমা হয়েছে!');
      setAmount('');
      setTrxId('');
    }
  };

  return (
    <div className="max-w-md bg-slate-900 border border-slate-800 p-6 rounded-xl">
      <h2 className="text-xl font-bold mb-4">টাকা ডিপোজিট করুন</h2>
      {message && <p className="mb-4 text-sm text-emerald-400">{message}</p>}
      <form onSubmit={handleDepositSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-slate-400">পরিমাণ (৳)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1" />
        </div>
        <div>
          <label className="text-sm text-slate-400">পেমেন্ট মেথড</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1">
            <option value="bKash">বিকাশ</option>
            <option value="Nagad">নগদ</option>
            <option value="Rocket">রকেট</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-400">ট্রানজেকশন আইডি (TrxID)</label>
          <input type="text" value={trxId} onChange={(e) => setTrxId(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1" />
        </div>
        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold p-3 rounded-lg">ডিপোজিট রিকোয়েস্ট পাঠান</button>
      </form>
    </div>
  );
}

function WithdrawSection({ profile }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bKash');
  const [account, setAccount] = useState('');
  const [message, setMessage] = useState(null);

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.rpc('handle_withdrawal', {
      p_amount: parseFloat(amount),
      p_method: method,
      p_account: account
    });
    if (error) setMessage(error.message);
    else {
      setMessage('উইথড্রয়াল রিকোয়েস্ট সফলভাবে জমা হয়েছে!');
      setAmount('');
      setAccount('');
    }
  };

  return (
    <div className="max-w-md bg-slate-900 border border-slate-800 p-6 rounded-xl">
      <h2 className="text-xl font-bold mb-4">টাকা উইথড্র করুন</h2>
      {message && <p className="mb-4 text-sm text-emerald-400">{message}</p>}
      <form onSubmit={handleWithdrawSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-slate-400">পরিমাণ (৳)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1" />
        </div>
        <div>
          <label className="text-sm text-slate-400">উইথড্র পদ্ধতি</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1">
            <option value="bKash">বিকাশ</option>
            <option value="Nagad">নগদ</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-400">একাউন্ট নম্বর</label>
          <input type="text" value={account} onChange={(e) => setAccount(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1" />
        </div>
        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold p-3 rounded-lg">উইথড্র রিকোয়েস্ট পাঠান</button>
      </form>
    </div>
  );
}

function PackagesSection() {
  return <div className="text-slate-400">বিজনেস প্যাকেজ তালিকা লোড হচ্ছে...</div>;
}

function SupportSection() {
  return <div className="text-slate-400">সাপোর্ট টিকিট সিস্টেম সক্রিয়।</div>;
}

function AdminPanel() {
  return <div className="text-emerald-400 font-bold">অ্যাডমিন কন্ট্রোল প্যানেল (সুরক্ষিত RLS সহ সংযুক্ত)।</div>;
}
