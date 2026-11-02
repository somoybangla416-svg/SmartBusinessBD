-- Smart Business BD Database Schema & RPC Functions
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    balance DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.packages (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    daily_return DECIMAL(10,2) NOT NULL,
    duration_days INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.investments (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    package_id INT REFERENCES public.packages(id),
    amount DECIMAL(10,2) NOT NULL,
    daily_return DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deposits (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    amount DECIMAL(10,2) NOT NULL,
    method TEXT NOT NULL,
    trx_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.withdrawals (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    amount DECIMAL(10,2) NOT NULL,
    method TEXT NOT NULL,
    account_no TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notices (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Secure RPC Functions
CREATE OR REPLACE FUNCTION handle_deposit(p_amount DECIMAL, p_method TEXT, p_trx_id TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.deposits (user_id, amount, method, trx_id)
    VALUES (auth.uid(), p_amount, p_method, p_trx_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_withdrawal(p_amount DECIMAL, p_method TEXT, p_account TEXT)
RETURNS VOID AS $$
DECLARE
    v_balance DECIMAL;
BEGIN
    SELECT balance INTO v_balance FROM public.profiles WHERE id = auth.uid();
    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'অপর্যাপ্ত ব্যালেন্স';
    END IF;
    
    UPDATE public.profiles SET balance = balance - p_amount WHERE id = auth.uid();
    
    INSERT INTO public.withdrawals (user_id, amount, method, account_no)
    VALUES (auth.uid(), p_amount, p_method, p_account);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
