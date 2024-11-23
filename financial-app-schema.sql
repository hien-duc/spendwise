-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for transaction types
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS investment_type CASCADE;
DROP TYPE IF EXISTS goal_status CASCADE;
DROP TYPE IF EXISTS bill_status CASCADE;
DROP TYPE IF EXISTS bill_frequency CASCADE;

CREATE TYPE transaction_type AS ENUM ('expense', 'income', 'investment', 'transfer');
CREATE TYPE transaction_status AS ENUM ('completed', 'pending', 'cancelled');
CREATE TYPE investment_type AS ENUM ('stocks', 'bonds', 'crypto', 'real_estate', 'mutual_funds', 'other');
CREATE TYPE goal_status AS ENUM ('in_progress', 'completed', 'cancelled');
CREATE TYPE bill_status AS ENUM ('paid', 'unpaid', 'overdue');
CREATE TYPE bill_frequency AS ENUM ('one_time', 'daily', 'weekly', 'monthly', 'yearly');

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.financial_goals CASCADE;
DROP TABLE IF EXISTS public.investments CASCADE;
DROP TABLE IF EXISTS public.bills CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_default BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    status transaction_status DEFAULT 'completed',
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    location TEXT,
    notes TEXT,
    attachments TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    due_date DATE NOT NULL,
    frequency bill_frequency NOT NULL,
    status bill_status DEFAULT 'unpaid',
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    reminder_days INTEGER DEFAULT 3,
    auto_pay BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type investment_type NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT,
    quantity DECIMAL(15,6),
    purchase_price DECIMAL(12,2),
    current_price DECIMAL(12,2),
    purchase_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.financial_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date DATE NOT NULL,
    status goal_status DEFAULT 'in_progress',
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_goal_dates CHECK (target_date >= start_date),
    CONSTRAINT valid_amounts CHECK (current_amount >= 0 AND target_amount > 0)
);

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Call function to create default categories
    PERFORM create_default_categories(NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.create_default_categories(user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Income categories
    INSERT INTO categories (user_id, name, icon, color, is_default) VALUES
    (user_id, 'Salary', '💰', '#2ecc71', true),
    (user_id, 'Investments', '📈', '#27ae60', true),
    (user_id, 'Freelance', '💻', '#2980b9', true),
    (user_id, 'Gifts', '🎁', '#8e44ad', true);

    -- Expense categories
    INSERT INTO categories (user_id, name, icon, color, is_default) VALUES
    (user_id, 'Housing', '🏠', '#e74c3c', true),
    (user_id, 'Transportation', '🚗', '#d35400', true),
    (user_id, 'Food', '🍽️', '#f39c12', true),
    (user_id, 'Utilities', '💡', '#f1c40f', true),
    (user_id, 'Healthcare', '⚕️', '#e67e22', true),
    (user_id, 'Entertainment', '🎬', '#9b59b6', true),
    (user_id, 'Shopping', '🛍️', '#3498db', true),
    (user_id, 'Education', '📚', '#1abc9c', true),
    (user_id, 'Personal Care', '💆', '#16a085', true),
    (user_id, 'Pets', '🐾', '#f1c40f', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.bills
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.investments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.financial_goals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
    ON public.transactions(user_id, date);

CREATE INDEX IF NOT EXISTS idx_transactions_category 
    ON public.transactions(category_id);

CREATE INDEX IF NOT EXISTS idx_budgets_user_dates 
    ON public.budgets(user_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_bills_user_due_date 
    ON public.bills(user_id, due_date);

CREATE INDEX IF NOT EXISTS idx_investments_user_type 
    ON public.investments(user_id, type);

CREATE INDEX IF NOT EXISTS idx_goals_user_status 
    ON public.financial_goals(user_id, status);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view own categories"
    ON public.categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own budgets"
    ON public.budgets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own budgets"
    ON public.budgets FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bills"
    ON public.bills FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bills"
    ON public.bills FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own investments"
    ON public.investments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own investments"
    ON public.investments FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own financial goals"
    ON public.financial_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own financial goals"
    ON public.financial_goals FOR ALL
    USING (auth.uid() = user_id);
