/*
SpendWise Financial App Database Schema
=====================================

This schema supports a comprehensive financial tracking application with the following features:

1. Transaction Types
   - Expense: Track daily spending
   - Income: Monitor earnings
   - Investment: Track investment activities

2. Annual Reports
   - Monthly breakdown of transactions
   - Category-wise analysis
   - Percentage distribution
   - Transaction counts

3. Category Management
   - Custom icons and colors
   - Default categories for new users
   - Support for all transaction types
   - Display order for UI

4. Security
   - OAuth integration (GitHub, Google)
   - Row Level Security
   - User data isolation

Main Features Supported:
----------------------
1. Annual Report View
   - Bar chart showing monthly totals
   - Supports all transaction types
   - Year navigation
   - Transaction counts

2. Category Annual Report
   - Donut chart for category distribution
   - Percentage breakdown
   - Category icons and colors
   - Transaction type tabs
*/

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Transaction type definitions
-- Used to categorize financial activities
create type transaction_type as enum ('expense', 'income', 'investment');
create type transaction_status as enum ('pending', 'completed', 'cancelled');
create type recurring_period as enum ('daily', 'weekly', 'monthly', 'yearly');

-- User profiles table
-- Stores user information from OAuth providers (GitHub, Google)
create table if not exists profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text,        -- From OAuth provider
    avatar_url text,       -- User's profile picture
    email text,           -- User's email address
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories table
-- Defines transaction categories with visual elements for UI
create table if not exists categories (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references profiles(id) on delete cascade not null,
    name text not null,                -- Category name (e.g., 'Food', 'Salary')
    type transaction_type not null,    -- Category type (expense/income/investment)
    icon text not null,                -- Icon name for UI (e.g., 'restaurant', 'briefcase')
    color text not null,               -- Hex color code for UI (e.g., '#FF6B6B')
    display_order integer default 0,    -- Order in UI lists
    is_default boolean default false,   -- Whether it's a system-provided category
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transactions table
-- Stores all financial transactions
create table if not exists transactions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references profiles(id) on delete cascade not null,
    category_id uuid references categories(id) on delete set null,
    type transaction_type not null,     -- Transaction type (expense/income/investment)
    amount decimal(12,2) not null check (amount >= 0),  -- Transaction amount
    date timestamp with time zone not null,             -- Transaction date
    notes text,                                         -- Optional transaction notes
    status transaction_status default 'completed',      -- Transaction status
    recurring_period recurring_period,                  -- For recurring transactions
    recurring_end_date timestamp with time zone,        -- End date for recurring transactions
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Annual Report Function
-- Returns monthly breakdown of transactions for bar chart
create or replace function get_annual_report(
    user_id_param uuid,
    year_param integer,
    type_param transaction_type
)
returns table (
    month integer,         -- Month number (1-12)
    month_name text,       -- Month name (January, February, etc.)
    amount decimal(12,2),  -- Total amount for the month
    transaction_count integer  -- Number of transactions in the month
) as $$
begin
    return query
    with all_months as (
        select generate_series(1, 12) as month_num
    )
    select 
        m.month_num as month,
        to_char(make_date(year_param, m.month_num, 1), 'Month') as month_name,
        coalesce(sum(t.amount), 0.00) as amount,
        count(t.id) as transaction_count
    from all_months m
    left join transactions t on 
        extract(month from t.date) = m.month_num
        and extract(year from t.date) = year_param
        and t.user_id = user_id_param
        and t.type = type_param
    group by m.month_num
    order by m.month_num;
end;
$$ language plpgsql;

-- Category Annual Report Function
-- Returns category breakdown for donut chart
create or replace function get_category_annual_report(
    user_id_param uuid,
    year_param integer,
    type_param transaction_type
)
returns table (
    category_id uuid,          -- Category identifier
    category_name text,        -- Category name
    category_icon text,        -- Icon for UI
    category_color text,       -- Color for UI
    total_amount decimal(12,2),-- Total amount in category
    percentage decimal(5,2),   -- Percentage of total (for donut chart)
    transaction_count integer  -- Number of transactions
) as $$
declare
    total_amount_all_categories decimal(12,2);
begin
    -- Calculate total amount for percentage calculation
    select coalesce(sum(t.amount), 0.00)
    into total_amount_all_categories
    from transactions t
    where t.user_id = user_id_param
    and extract(year from t.date) = year_param
    and t.type = type_param;

    return query
    select 
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        coalesce(sum(t.amount), 0.00) as total_amount,
        case 
            when total_amount_all_categories > 0 then 
                round((sum(t.amount) / total_amount_all_categories * 100)::numeric, 2)
            else 0.00 
        end as percentage,
        count(t.id) as transaction_count
    from categories c
    left join transactions t on 
        t.category_id = c.id 
        and extract(year from t.date) = year_param
        and t.type = type_param
        and t.user_id = user_id_param
    where c.user_id = user_id_param
    and c.type = type_param
    group by c.id, c.name, c.icon, c.color
    having sum(t.amount) > 0
    order by total_amount desc;
end;
$$ language plpgsql;

-- Default Categories Function
-- Creates starter categories for new users
create or replace function create_default_categories(user_id_param uuid)
returns void as $$
begin
    -- Expense categories
    insert into categories (user_id, name, type, icon, color, is_default, display_order) values
    (user_id_param, 'Food', 'expense', 'restaurant', '#FF6B6B', true, 1),
    (user_id_param, 'Transportation', 'expense', 'car', '#4ECDC4', true, 2),
    (user_id_param, 'Shopping', 'expense', 'shopping-bag', '#45B7D1', true, 3),
    (user_id_param, 'Bills', 'expense', 'file-text', '#96CEB4', true, 4),
    (user_id_param, 'Entertainment', 'expense', 'film', '#D4A5A5', true, 5);

    -- Income categories
    insert into categories (user_id, name, type, icon, color, is_default, display_order) values
    (user_id_param, 'Salary', 'income', 'briefcase', '#4CAF50', true, 1),
    (user_id_param, 'Freelance', 'income', 'edit', '#8BC34A', true, 2),
    (user_id_param, 'Investments', 'income', 'trending-up', '#009688', true, 3);

    -- Investment categories
    insert into categories (user_id, name, type, icon, color, is_default, display_order) values
    (user_id_param, 'Stocks', 'investment', 'bar-chart', '#673AB7', true, 1),
    (user_id_param, 'Real Estate', 'investment', 'home', '#3F51B5', true, 2),
    (user_id_param, 'Crypto', 'investment', 'bitcoin', '#2196F3', true, 3);
end;
$$ language plpgsql;

-- Indexes for Performance
create index if not exists idx_transactions_user_date 
    on transactions(user_id, date);  -- For date-based queries

create index if not exists idx_transactions_type_year 
    on transactions (
        type,
        user_id,
        (extract(year from date))
    );  -- For annual reports

create index if not exists idx_transactions_category 
    on transactions(category_id);  -- For category queries

create index if not exists idx_categories_user 
    on categories(user_id);  -- For user's categories

-- Security Policies
-- Ensure users can only access their own data
alter table profiles enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;

create policy "Users can view own profile"
    on profiles for select
    using (auth.uid() = id);

create policy "Users can update own profile"
    on profiles for update
    using (auth.uid() = id);

create policy "Users can CRUD own categories"
    on categories for all
    using (auth.uid() = user_id);

create policy "Users can CRUD own transactions"
    on transactions for all
    using (auth.uid() = user_id);

-- Trigger for creating default categories for new users
create or replace function handle_new_user()
returns trigger as $$
begin
    -- Create profile
    insert into public.profiles (id, full_name, avatar_url, email)
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'name'
        ),
        coalesce(
            new.raw_user_meta_data->>'avatar_url',
            new.raw_user_meta_data->>'picture'
        ),
        new.email
    );

    -- Create default categories
    perform create_default_categories(new.id);

    return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on signup
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Helper function to get monthly summary with investments
create or replace function get_monthly_summary(
    user_id_param uuid,
    year_param integer,
    month_param integer
)
returns table (
    income decimal(12,2),
    expense decimal(12,2),
    investment decimal(12,2),
    total decimal(12,2)
) as $$
begin
    return query
    select
        coalesce(sum(case when type = 'income' then amount else 0 end), 0.00) as income,
        coalesce(sum(case when type = 'expense' then amount else 0 end), 0.00) as expense,
        coalesce(sum(case when type = 'investment' then amount else 0 end), 0.00) as investment,
        coalesce(sum(case 
            when type = 'income' then amount 
            when type = 'expense' then -amount 
            when type = 'investment' then -amount  -- Investments are treated as outgoing money initially
            else 0 
        end), 0.00) as total
    from transactions
    where user_id = user_id_param
    and extract(year from date) = year_param
    and extract(month from date) = month_param;
end;
$$ language plpgsql;

-- Helper function to get calendar data for a month with investment highlighting
create or replace function get_calendar_month_data(
    user_id_param uuid,
    year_param integer,
    month_param integer
)
returns table (
    date date,
    total_amount decimal(12,2),
    has_transactions boolean,
    expense_amount decimal(12,2),
    income_amount decimal(12,2),
    investment_amount decimal(12,2)
) as $$
begin
    return query
    select 
        d::date as date,
        coalesce(sum(case 
            when t.type = 'income' then t.amount 
            when t.type in ('expense', 'investment') then -t.amount 
            else 0 
        end), 0.00) as total_amount,
        count(t.id) > 0 as has_transactions,
        coalesce(sum(case when t.type = 'expense' then t.amount else 0 end), 0.00) as expense_amount,
        coalesce(sum(case when t.type = 'income' then t.amount else 0 end), 0.00) as income_amount,
        coalesce(sum(case when t.type = 'investment' then t.amount else 0 end), 0.00) as investment_amount
    from generate_series(
        date_trunc('month', make_date(year_param, month_param, 1))::date,
        (date_trunc('month', make_date(year_param, month_param, 1)) + interval '1 month - 1 day')::date,
        '1 day'::interval
    ) d
    left join transactions t on t.date = d::date and t.user_id = user_id_param
    group by d::date
    order by d::date;
end;
$$ language plpgsql;

-- Helper function to get daily transactions with category details (including investments)
create or replace function get_daily_transactions(
    user_id_param uuid,
    date_param date
)
returns table (
    category_name text,
    category_icon text,
    amount decimal(12,2),
    type text,
    note text,
    color text  -- Added to support different colors per transaction type
) as $$
begin
    return query
    select 
        c.name as category_name,
        c.icon as category_icon,
        t.amount,
        t.type,
        t.note,
        c.color
    from transactions t
    join categories c on t.category_id = c.id
    where t.user_id = user_id_param
    and t.date = date_param
    order by 
        case t.type  -- Order by transaction type
            when 'income' then 1
            when 'expense' then 2
            when 'investment' then 3
        end,
        t.created_at;
end;
$$ language plpgsql;

-- Helper function to get monthly category breakdown
create or replace function get_monthly_category_breakdown(
    user_id_param uuid,
    year_param integer,
    month_param integer,
    type_param text  -- 'expense', 'income', or 'investment'
)
returns table (
    category_name text,
    category_icon text,
    category_color text,
    amount decimal(12,2),
    percentage decimal(5,2)  -- For showing percentages like 95.8%
) as $$
declare
    total_amount decimal(12,2);
begin
    -- Calculate total amount for the specified type
    select coalesce(sum(amount), 0.00)
    into total_amount
    from transactions t
    where t.user_id = user_id_param
    and extract(year from t.date) = year_param
    and extract(month from t.date) = month_param
    and t.type = type_param;

    -- Return category breakdown with percentages
    return query
    select 
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        coalesce(sum(t.amount), 0.00) as amount,
        case 
            when total_amount > 0 then 
                round((coalesce(sum(t.amount), 0.00) / total_amount * 100)::numeric, 2)
            else 0.00 
        end as percentage
    from categories c
    left join transactions t on 
        t.category_id = c.id 
        and extract(year from t.date) = year_param
        and extract(month from t.date) = month_param
    where c.user_id = user_id_param
    and c.type = type_param
    and (t.id is null or t.user_id = user_id_param)
    group by c.id, c.name, c.icon, c.color
    having coalesce(sum(t.amount), 0.00) > 0
    order by amount desc;  -- Orders by amount to show highest spending categories first
end;
$$ language plpgsql;

-- Helper function to get report summary
create or replace function get_report_summary(
    user_id_param uuid,
    year_param integer,
    month_param integer
)
returns table (
    expense_total decimal(12,2),
    income_total decimal(12,2),
    investment_total decimal(12,2),
    net_total decimal(12,2),
    expense_count integer,
    income_count integer,
    investment_count integer,
    most_used_category text,
    highest_transaction decimal(12,2),
    average_transaction decimal(12,2)
) as $$
begin
    return query
    with transaction_stats as (
        select
            sum(case when type = 'expense' then amount else 0 end) as exp_total,
            sum(case when type = 'income' then amount else 0 end) as inc_total,
            sum(case when type = 'investment' then amount else 0 end) as inv_total,
            count(case when type = 'expense' then 1 end) as exp_count,
            count(case when type = 'income' then 1 end) as inc_count,
            count(case when type = 'investment' then 1 end) as inv_count,
            max(amount) as max_amount,
            avg(amount) as avg_amount
        from transactions
        where user_id = user_id_param
        and extract(year from date) = year_param
        and extract(month from date) = month_param
    ),
    category_usage as (
        select c.name
        from transactions t
        join categories c on t.category_id = c.id
        where t.user_id = user_id_param
        and extract(year from t.date) = year_param
        and extract(month from t.date) = month_param
        group by c.name
        order by count(*) desc
        limit 1
    )
    select
        coalesce(ts.exp_total, 0.00),
        coalesce(ts.inc_total, 0.00),
        coalesce(ts.inv_total, 0.00),
        coalesce(ts.inc_total - ts.exp_total - ts.inv_total, 0.00),
        coalesce(ts.exp_count, 0),
        coalesce(ts.inc_count, 0),
        coalesce(ts.inv_count, 0),
        cu.name,
        coalesce(ts.max_amount, 0.00),
        coalesce(ts.avg_amount, 0.00)
    from transaction_stats ts
    cross join category_usage cu;
end;
$$ language plpgsql;

-- Helper function to get annual report data with monthly breakdown
create or replace function get_annual_report(
    user_id_param uuid,
    year_param integer,
    type_param text  -- 'expense', 'income', 'investment', or 'total'
)
returns table (
    month integer,
    month_name text,
    amount decimal(12,2),
    transaction_count integer
) as $$
begin
    return query
    with all_months as (
        -- Generate all months of the year
        select generate_series(1, 12) as month_num
    )
    select 
        m.month_num as month,
        to_char(make_date(year_param, m.month_num, 1), 'Month') as month_name,
        coalesce(
            case 
                when type_param = 'total' then
                    sum(case 
                        when t.type = 'income' then t.amount
                        else -t.amount 
                    end)
                when type_param = 'expense' then sum(t.amount)
                when type_param = 'income' then sum(t.amount)
                when type_param = 'investment' then sum(t.amount)
            end,
            0.00
        ) as amount,
        count(t.id) as transaction_count
    from all_months m
    left join transactions t on 
        extract(month from t.date) = m.month_num
        and extract(year from t.date) = year_param
        and t.user_id = user_id_param
        and (
            type_param = 'total' 
            or t.type = type_param
        )
    group by m.month_num
    order by m.month_num;
end;
$$ language plpgsql;

-- Helper function to get annual summary
create or replace function get_annual_summary(
    user_id_param uuid,
    year_param integer
)
returns table (
    total_income decimal(12,2),
    total_expense decimal(12,2),
    total_investment decimal(12,2),
    net_total decimal(12,2),
    highest_expense_month integer,
    highest_income_month integer,
    highest_investment_month integer,
    total_transactions integer,
    average_monthly_expense decimal(12,2),
    average_monthly_income decimal(12,2),
    average_monthly_investment decimal(12,2)
) as $$
begin
    return query
    with monthly_totals as (
        select
            extract(month from date)::integer as month,
            sum(case when type = 'income' then amount else 0 end) as month_income,
            sum(case when type = 'expense' then amount else 0 end) as month_expense,
            sum(case when type = 'investment' then amount else 0 end) as month_investment,
            count(*) as transaction_count
        from transactions
        where user_id = user_id_param
        and extract(year from date) = year_param
        group by month
    )
    select
        coalesce(sum(month_income), 0.00) as total_income,
        coalesce(sum(month_expense), 0.00) as total_expense,
        coalesce(sum(month_investment), 0.00) as total_investment,
        coalesce(sum(month_income) - sum(month_expense) - sum(month_investment), 0.00) as net_total,
        (select month from monthly_totals where month_expense = max(mt.month_expense) limit 1) as highest_expense_month,
        (select month from monthly_totals where month_income = max(mt.month_income) limit 1) as highest_income_month,
        (select month from monthly_totals where month_investment = max(mt.month_investment) limit 1) as highest_investment_month,
        coalesce(sum(transaction_count), 0) as total_transactions,
        coalesce(avg(nullif(month_expense, 0)), 0.00) as average_monthly_expense,
        coalesce(avg(nullif(month_income, 0)), 0.00) as average_monthly_income,
        coalesce(avg(nullif(month_investment, 0)), 0.00) as average_monthly_investment
    from monthly_totals mt;
end;
$$ language plpgsql;

-- Helper function to get annual category breakdown
create or replace function get_annual_category_breakdown(
    user_id_param uuid,
    year_param integer,
    type_param text  -- 'expense', 'income', or 'investment'
)
returns table (
    category_id uuid,
    category_name text,
    category_icon text,
    category_color text,
    total_amount decimal(12,2),
    percentage decimal(5,2),
    transaction_count integer
) as $$
declare
    total_amount_all_categories decimal(12,2);
begin
    -- Calculate total amount for percentage calculation
    select coalesce(sum(t.amount), 0.00)
    into total_amount_all_categories
    from transactions t
    where t.user_id = user_id_param
    and extract(year from t.date) = year_param
    and t.type = type_param;

    return query
    select 
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        coalesce(sum(t.amount), 0.00) as total_amount,
        case 
            when total_amount_all_categories > 0 then 
                round((sum(t.amount) / total_amount_all_categories * 100)::numeric, 2)
            else 0.00 
        end as percentage,
        count(t.id) as transaction_count
    from categories c
    left join transactions t on 
        t.category_id = c.id 
        and extract(year from t.date) = year_param
        and t.type = type_param
        and t.user_id = user_id_param
    where c.user_id = user_id_param
    and c.type = type_param
    group by c.id, c.name, c.icon, c.color
    having sum(t.amount) > 0
    order by total_amount desc;
end;
$$ language plpgsql;

-- Helper function to get annual totals by type
create or replace function get_annual_type_totals(
    user_id_param uuid,
    year_param integer
)
returns table (
    transaction_type text,
    total_amount decimal(12,2),
    transaction_count integer
) as $$
begin
    return query
    select 
        t.type as transaction_type,
        coalesce(sum(t.amount), 0.00) as total_amount,
        count(*) as transaction_count
    from transactions t
    where t.user_id = user_id_param
    and extract(year from t.date) = year_param
    group by t.type
    order by t.type;
end;
$$ language plpgsql;

-- Helper function to get category comparison across transaction types
create or replace function get_category_type_comparison(
    user_id_param uuid,
    year_param integer
)
returns table (
    transaction_type text,
    total_categories integer,
    total_amount decimal(12,2),
    highest_category_name text,
    highest_category_amount decimal(12,2),
    highest_category_percentage decimal(5,2),
    average_per_category decimal(12,2),
    year_over_year_growth decimal(5,2)
) as $$
begin
    return query
    with type_totals as (
        select 
            t.type,
            count(distinct t.category_id) as category_count,
            sum(t.amount) as total_amount,
            max(t.amount) as max_transaction
        from transactions t
        where t.user_id = user_id_param
        and extract(year from t.date) = year_param
        group by t.type
    ),
    category_totals as (
        select 
            t.type,
            c.name as category_name,
            sum(t.amount) as category_amount,
            count(*) as transaction_count
        from transactions t
        join categories c on c.id = t.category_id
        where t.user_id = user_id_param
        and extract(year from t.date) = year_param
        group by t.type, c.name
    ),
    prev_year_totals as (
        select 
            type,
            sum(amount) as prev_year_amount
        from transactions
        where user_id = user_id_param
        and extract(year from date) = year_param - 1
        group by type
    )
    select 
        tt.type as transaction_type,
        tt.category_count as total_categories,
        tt.total_amount,
        ct.category_name as highest_category_name,
        ct.category_amount as highest_category_amount,
        round((ct.category_amount / tt.total_amount * 100)::numeric, 2) as highest_category_percentage,
        round((tt.total_amount / tt.category_count)::numeric, 2) as average_per_category,
        case
            when py.prev_year_amount > 0 then
                round(((tt.total_amount - py.prev_year_amount) / py.prev_year_amount * 100)::numeric, 2)
            else null
        end as year_over_year_growth
    from type_totals tt
    join category_totals ct on ct.type = tt.type
    left join prev_year_totals py on py.type = tt.type
    where ct.category_amount = (
        select max(category_amount)
        from category_totals
        where type = tt.type
    )
    order by tt.type;
end;
$$ language plpgsql;

-- Helper function to get monthly breakdown for a specific category
create or replace function get_category_monthly_breakdown(
    user_id_param uuid,
    category_id_param uuid,
    year_param integer
)
returns table (
    month integer,
    month_name text,
    amount decimal(12,2),
    transaction_count integer,
    percentage_of_month decimal(5,2)
) as $$
begin
    return query
    with all_months as (
        -- Generate all months
        select generate_series(1, 12) as month_num
    ),
    monthly_totals as (
        -- Get total amount per month for percentage calculation
        select 
            extract(month from date)::integer as month,
            sum(amount) as month_total
        from transactions
        where user_id = user_id_param
        and extract(year from date) = year_param
        and type = (
            select type from categories where id = category_id_param
        )
        group by month
    )
    select 
        m.month_num as month,
        to_char(make_date(year_param, m.month_num, 1), 'Month') as month_name,
        coalesce(sum(t.amount), 0.00) as amount,
        count(t.id) as transaction_count,
        case 
            when mt.month_total > 0 then 
                round((coalesce(sum(t.amount), 0.00) / mt.month_total * 100)::numeric, 2)
            else 0.00 
        end as percentage_of_month
    from all_months m
    left join transactions t on 
        extract(month from t.date) = m.month_num
        and extract(year from t.date) = year_param
        and t.category_id = category_id_param
        and t.user_id = user_id_param
    left join monthly_totals mt on mt.month = m.month_num
    group by m.month_num, mt.month_total
    order by m.month_num;
end;
$$ language plpgsql;

-- Create indexes for better performance
create index if not exists idx_transactions_user_date 
    on transactions(user_id, date);

create index if not exists idx_transactions_type_year 
    on transactions (
        type,
        user_id,
        (extract(year from date))
    );

create index if not exists idx_transactions_category 
    on transactions(category_id);

create index if not exists idx_categories_user 
    on categories(user_id);

-- Enable RLS
alter table profiles enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;

-- Create RLS policies
create policy "Users can view own profile"
    on profiles for select
    using (auth.uid() = id);

create policy "Users can update own profile"
    on profiles for update
    using (auth.uid() = id);

create policy "Users can CRUD own categories"
    on categories for all
    using (auth.uid() = user_id);

create policy "Users can CRUD own transactions"
    on transactions for all
    using (auth.uid() = user_id);

-- Add index for better calendar query performance
create index if not exists idx_transactions_user_date 
    on transactions(user_id, date);

create index if not exists idx_transactions_type 
    on transactions(type);

-- Add index for better annual report performance
create index if not exists idx_transactions_year_month 
    on transactions (
        user_id,
        (extract(year from date)),
        (extract(month from date))
    );

-- Add index for better category report performance
create index if not exists idx_transactions_category_year 
    on transactions (
        category_id,
        user_id,
        type,
        (extract(year from date))
    );

-- Add index for better type comparison performance
create index if not exists idx_transactions_type_year 
    on transactions (
        type,
        user_id,
        (extract(year from date))
    );

-- Create functions for updating timestamps
create or replace function handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers for updating timestamps
create trigger set_timestamp before update
    on public.profiles
    for each row
    execute procedure handle_updated_at();

create trigger set_timestamp before update
    on public.transactions
    for each row
    execute procedure handle_updated_at();

create trigger set_timestamp before update
    on public.budgets
    for each row
    execute procedure handle_updated_at();

create trigger set_timestamp before update
    on public.bills
    for each row
    execute procedure handle_updated_at();

create trigger set_timestamp before update
    on public.investments
    for each row
    execute procedure handle_updated_at();

create trigger set_timestamp before update
    on public.financial_goals
    for each row
    execute procedure handle_updated_at();

-- Trigger to automatically create profile on signup
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
