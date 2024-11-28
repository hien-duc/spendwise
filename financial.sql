-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enum type for transaction types
create type transaction_type as enum ('expense', 'income', 'investment');

-- Profiles Table: Basic user information
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    name text,
    email text,
    initial_balance decimal(12,2) default 0.00
);

-- Categories Table: Transaction categories
create table public.categories (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    name text not null,
    type transaction_type not null,
    icon text not null,           -- Icon identifier for UI display
    color text not null,          -- Hex color code for UI display
    is_default boolean default false
);

-- Transactions Table: Financial transactions
create table public.transactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    category_id uuid references public.categories(id) on delete set null,
    amount decimal(12,2) not null,
    note text,
    date date not null default current_date,
    type transaction_type not null
);

-- Create default categories for new users
create or replace function public.create_default_categories(user_id_param uuid)
returns void as $$
begin
    insert into public.categories (user_id, name, type, icon, color, is_default) values
    -- Expense categories
    (user_id_param, 'Food', 'expense', 'food', '#FF9800', true),
    (user_id_param, 'Transportation', 'expense', 'transport', '#795548', true),
    (user_id_param, 'Houseware', 'expense', 'home', '#4CAF50', true),
    (user_id_param, 'Bills', 'expense', 'bill', '#F44336', true),
    (user_id_param, 'Shopping', 'expense', 'shopping', '#9C27B0', true),
    -- Income categories
    (user_id_param, 'Salary', 'income', 'salary', '#2196F3', true),
    (user_id_param, 'Freelance', 'income', 'freelance', '#8BC34A', true),
    (user_id_param, 'Bonus', 'income', 'bonus', '#00BCD4', true),
    -- Investment categories
    (user_id_param, 'Stocks', 'investment', 'stocks', '#3F51B5', true),
    (user_id_param, 'Real Estate', 'investment', 'real-estate', '#009688', true),
    (user_id_param, 'Crypto', 'investment', 'crypto', '#607D8B', true);
end;
$$ language plpgsql;

-- Financial Goals table
create table public.financial_goals (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    name text not null,
    target_amount decimal(12,2) not null,
    current_amount decimal(12,2) default 0,
    deadline date,
    -- priority text check (priority in ('low', 'medium', 'high')),
    -- status text default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled'));
);

-- Handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, name, email)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', ''),
        new.email
    );
    perform public.create_default_categories(new.id);
    return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Create trigger for new user registration
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Get transactions by date
-- Can use in the calendar page
create or replace function get_transactions_by_date(
    user_id_param uuid,
    date_param date
)
returns table (
    category_name text,
    amount decimal(12,2),
    type text,
    note text
) as $$
begin
    return query
    select 
        c.name as category_name,
        t.amount,
        t.type::text,
        t.note
    from transactions t
    join categories c on t.category_id = c.id
    where t.user_id = user_id_param
    and t.date = date_param
    order by t.id desc;
end;
$$ language plpgsql;

-- Get monthly balance details
-- use in calendar
create or replace function get_monthly_balance_by_month_year(
    user_id_param uuid,
    year_param integer,
    month_param integer
)
returns table (
    total_income decimal(12,2),
    total_expense decimal(12,2),
    total_investment decimal(12,2),
    net_balance decimal(12,2)
) as $$
begin
    return query
    with monthly_totals as (
        select
            coalesce(sum(case when type = 'income' then amount else 0 end), 0.00) as income,
            coalesce(sum(case when type = 'expense' then amount else 0 end), 0.00) as expense,
            coalesce(sum(case when type = 'investment' then amount else 0 end), 0.00) as investment
        from transactions
        where user_id = user_id_param
        and extract(year from date) = year_param
        and extract(month from date) = month_param
    )
    select
        income as total_income,
        expense as total_expense,
        investment as total_investment,
        (income - expense - investment) as net_balance
    from monthly_totals;
end;
$$ language plpgsql;

-- Get spending breakdown by category

create or replace function get_category_summary(
    user_id_param uuid,
    year_param integer,
    month_param integer,
    type_param transaction_type
)
returns table (
    category_name text,
    total_amount decimal(12,2),
    percentage decimal(5,2)
) as $$
begin
    return query
    with category_totals as (
        select 
            c.name,
            coalesce(sum(t.amount), 0.00) as amount
        from categories c
        left join transactions t on 
            t.category_id = c.id
            and extract(year from t.date) = year_param
            and extract(month from t.date) = month_param
            and t.user_id = user_id_param
        where c.user_id = user_id_param
        and c.type = type_param
        group by c.id, c.name
        having coalesce(sum(t.amount), 0.00) > 0
    )
    select 
        name as category_name,
        amount as total_amount,
        round((amount / sum(amount) over() * 100)::numeric, 2) as percentage
    from category_totals
    order by amount desc;
end;
$$ language plpgsql;

-- get_category_breakdown_by_type will show:
--Food         | 500.00 | 60.00   (includes categories with zero amounts)
--Transport    | 200.00 | 24.00
--Bills        | 133.33 | 16.00
--Entertainment|   0.00 |  0.00   <- Shows this

-- get_category_summary will show:
--Food         | 500.00 | 60.00   (only shows categories with amounts > 0)
--Transport    | 200.00 | 24.00
--Bills        | 133.33 | 16.00


-- Get total monthly income
create or replace function get_monthly_income_total(
    user_id_param uuid,
    month_param integer,
    year_param integer
)
returns decimal(12,2) as $$
declare
    total_income decimal(12,2);
begin
    select coalesce(sum(amount), 0)
    into total_income
    from transactions
    where 
        user_id = user_id_param
        and type = 'income'
        and extract(month from date) = month_param
        and extract(year from date) = year_param;
    
    return total_income;
end;
$$ language plpgsql;

-- Get total monthly expense
create or replace function get_monthly_expense_total(
    user_id_param uuid,
    month_param integer,
    year_param integer
)
returns decimal(12,2) as $$
declare
    total_expense decimal(12,2);
begin
    select coalesce(sum(amount), 0)
    into total_expense
    from transactions
    where 
        user_id = user_id_param
        and type = 'expense'
        and extract(month from date) = month_param
        and extract(year from date) = year_param;
    
    return total_expense;
end;
$$ language plpgsql;

-- Get total monthly investment
create or replace function get_monthly_investment_total(
    user_id_param uuid,
    month_param integer,
    year_param integer
)
returns decimal(12,2) as $$
declare
    total_investment decimal(12,2);
begin
    select coalesce(sum(amount), 0)
    into total_investment
    from transactions
    where 
        user_id = user_id_param
        and type = 'investment'
        and extract(month from date) = month_param
        and extract(year from date) = year_param;
    
    return total_investment;
end;
$$ language plpgsql;

-- Calculate monthly net balance (income - expense - investment)
create or replace function get_monthly_net_balance(
    user_id_param uuid,
    month_param integer,
    year_param integer
)
returns decimal(12,2) as $$
declare
    income decimal(12,2);
    expense decimal(12,2);
    investment decimal(12,2);
begin
    income := get_monthly_income_total(user_id_param, month_param, year_param);
    expense := get_monthly_expense_total(user_id_param, month_param, year_param);
    investment := get_monthly_investment_total(user_id_param, month_param, year_param);
    
    return income - expense - investment;
end;
$$ language plpgsql;

-- Example usage with sample outputs:

-- 1. Get income for January 2024
-- SELECT get_monthly_income_total('user-uuid', 1, 2024);
-- Sample output:
--  get_monthly_income_total
-- ------------------------
--              5000.00

-- 2. Get expense for January 2024
-- SELECT get_monthly_expense_total('user-uuid', 1, 2024);
-- Sample output:
--  get_monthly_expense_total
-- -------------------------
--               2500.00

-- 3. Get investment for January 2024
-- SELECT get_monthly_investment_total('user-uuid', 1, 2024);
-- Sample output:
--  get_monthly_investment_total
-- ----------------------------
--                1000.00

-- 4. Get net balance for January 2024
-- SELECT get_monthly_net_balance('user-uuid', 1, 2024);
-- Sample output:
--  get_monthly_net_balance
-- -----------------------
--              1500.00    -- (5000.00 - 2500.00 - 1000.00)

-- 5. Get all totals for January 2024 in one query
-- SELECT 
--     get_monthly_income_total('user-uuid', 1, 2024) as total_income,
--     get_monthly_expense_total('user-uuid', 1, 2024) as total_expense,
--     get_monthly_investment_total('user-uuid', 1, 2024) as total_investment,
--     get_monthly_net_balance('user-uuid', 1, 2024) as net_balance;
-- Sample output:
--  total_income | total_expense | total_investment | net_balance
-- -------------+---------------+-----------------+-------------
--     5000.00  |     2500.00   |       1000.00   |    1500.00
-- Get category-wise breakdown with percentages for a specific transaction type and period


create or replace function get_category_breakdown_by_type(
    user_id_param uuid,
    year_param integer,
    month_param integer,
    type_param transaction_type
)
returns table (
    category_name text,
    amount decimal(12,2),
    percentage decimal(5,2)
) as $$
begin
    return query
    with category_totals as (
        select 
            c.name as category_name,
            coalesce(sum(t.amount), 0.00) as amount
        from categories c
        left join transactions t on c.id = t.category_id
            and extract(year from t.date) = year_param
            and extract(month from t.date) = month_param
        where c.user_id = user_id_param
            and c.type = type_param
            and (t.id is null or t.user_id = user_id_param)
        group by c.name
    ),
    total_amount as (
        select coalesce(sum(amount), 0.00) as total
        from category_totals
        where amount > 0
    )
    select 
        ct.category_name,
        ct.amount,
        case 
            when ta.total > 0 then round((ct.amount / ta.total * 100)::numeric, 2)
            when ct.amount > 0 then 100.00
            else 0.00
        end as percentage
    from category_totals ct
    cross join total_amount ta
    where ct.amount > 0
    order by ct.amount desc;
end;
$$ language plpgsql;

-- Usage:
-- For expenses in January 2024
-- SELECT * FROM get_category_breakdown_by_type('your-user-id', 2024, 1, 'expense');

-- For income in January 2024
-- SELECT * FROM get_category_breakdown_by_type('your-user-id', 2024, 1, 'income');

-- For investments in January 2024
-- SELECT * FROM get_category_breakdown_by_type('your-user-id', 2024, 1, 'investment');

-- Core fucnitions that take from Money Note app
-- Example output:

-- category_name | amount | percentage
--------------+--------+------------
-- Food         | 500.00 |      60.00
-- Transport    | 200.00 |      24.00
-- Bills        | 133.33 |      16.00


-- Get monthly income totals for the year
create or replace function get_monthly_income_trend(
    user_id_param uuid,
    year_param integer
)
returns table (
    month integer,
    month_name text,
    amount decimal(12,2),
    running_total decimal(12,2),
    year_to_date_total decimal(12,2)
) as $$
begin
    return query
    with months as (
        select generate_series(1, 12) as month_number
    ),
    year_to_date as (
        select coalesce(sum(amount), 0.00) as total
        from transactions
        where user_id = user_id_param
        and extract(year from date) = year_param
        and extract(month from date) <= extract(month from current_date)
        and type = 'income'
    )
    select 
        m.month_number as month,
        to_char(to_date(m.month_number::text, 'MM'), 'Month') as month_name,
        coalesce(sum(t.amount), 0.00) as amount,
        sum(coalesce(sum(t.amount), 0.00)) over (order by m.month_number) as running_total,
        (select total from year_to_date) as year_to_date_total
    from months m
    left join transactions t on 
        extract(month from t.date) = m.month_number
        and extract(year from t.date) = year_param
        and t.type = 'income'
        and t.user_id = user_id_param
    where m.month_number <= extract(month from current_date)
        or year_param < extract(year from current_date)
    group by m.month_number
    order by m.month_number;
end;
$$ language plpgsql;

-- Get monthly expense totals for the year
create or replace function get_monthly_expense_trend(
    user_id_param uuid,
    year_param integer
)
returns table (
    month integer,
    month_name text,
    amount decimal(12,2),
    running_total decimal(12,2),
    year_to_date_total decimal(12,2)
) as $$
begin
    return query
    with months as (
        select generate_series(1, 12) as month_number
    ),
    year_to_date as (
        select coalesce(sum(amount), 0.00) as total
        from transactions
        where user_id = user_id_param
        and extract(year from date) = year_param
        and extract(month from date) <= extract(month from current_date)
        and type = 'expense'
    )
    select 
        m.month_number as month,
        to_char(to_date(m.month_number::text, 'MM'), 'Month') as month_name,
        coalesce(sum(t.amount), 0.00) as amount,
        sum(coalesce(sum(t.amount), 0.00)) over (order by m.month_number) as running_total,
        (select total from year_to_date) as year_to_date_total
    from months m
    left join transactions t on 
        extract(month from t.date) = m.month_number
        and extract(year from t.date) = year_param
        and t.type = 'expense'
        and t.user_id = user_id_param
    where m.month_number <= extract(month from current_date)
        or year_param < extract(year from current_date)
    group by m.month_number
    order by m.month_number;
end;
$$ language plpgsql;

-- Get monthly investment totals for the year
create or replace function get_monthly_investment_trend(
    user_id_param uuid,
    year_param integer
)
returns table (
    month integer,
    month_name text,
    amount decimal(12,2),
    running_total decimal(12,2),
    year_to_date_total decimal(12,2)
) as $$
begin
    return query
    with months as (
        select generate_series(1, 12) as month_number
    ),
    year_to_date as (
        select coalesce(sum(amount), 0.00) as total
        from transactions
        where user_id = user_id_param
        and extract(year from date) = year_param
        and extract(month from date) <= extract(month from current_date)
        and type = 'investment'
    )
    select 
        m.month_number as month,
        to_char(to_date(m.month_number::text, 'MM'), 'Month') as month_name,
        coalesce(sum(t.amount), 0.00) as amount,
        sum(coalesce(sum(t.amount), 0.00)) over (order by m.month_number) as running_total,
        (select total from year_to_date) as year_to_date_total
    from months m
    left join transactions t on 
        extract(month from t.date) = m.month_number
        and extract(year from t.date) = year_param
        and t.type = 'investment'
        and t.user_id = user_id_param
    where m.month_number <= extract(month from current_date)
        or year_param < extract(year from current_date)
    group by m.month_number
    order by m.month_number;
end;
$$ language plpgsql;

-- Usage example:

-- Get income trend for 2024
--SELECT * FROM get_monthly_income_trend('your-user-id', 2024);

-- Get expense trend for 2024
-- SELECT * FROM get_monthly_expense_trend('your-user-id', 2024);

-- Get investment trend for 2024
-- SELECT * FROM get_monthly_investment_trend('your-user-id', 2024);

-- Sample output:
-- month | month_name | amount | running_total | year_to_date_total
-- ------+------------+--------+---------------+-------------------
--     1 | January    | 500.00 |       500.00 |           2400.00
--     2 | February   | 300.00 |       800.00 |           2400.00
--     3 | March      | 400.00 |      1200.00 |           2400.00
--     4 | April      | 300.00 |      1500.00 |           2400.00
--     5 | May        | 900.00 |      2400.00 |           2400.00
--    ... (only shows up to current month)

-- Features:

-- Shows all months up to current month
-- Includes months with zero amounts
-- Properly formatted month names
-- Ordered by month number
-- For bar charts in the detail report page

-- Get annual income report with monthly breakdown and total
create or replace function get_annual_income_report(
    user_id_param uuid,
    year_param integer
)
returns table (
    month_number integer,
    month_name text,
    monthly_amount decimal(12,2),
    running_total decimal(12,2)
) as $$
begin
    return query
    with months as (
        select generate_series(1, 12) as month_num
    ),
    monthly_data as (
        select 
            extract(month from date)::integer as month_num,
            coalesce(sum(amount), 0.00) as amount
        from transactions
        where user_id = user_id_param
        and extract(year from date) = year_param
        and type = 'income'
        group by extract(month from date)
    )
    select 
        m.month_num as month_number,
        to_char(to_date(m.month_num::text, 'MM'), 'Month') as month_name,
        coalesce(md.amount, 0.00) as monthly_amount,
        sum(coalesce(md.amount, 0.00)) over (order by m.month_num) as running_total
    from months m
    left join monthly_data md on md.month_num = m.month_num
    order by m.month_num;
end;
$$ language plpgsql;

-- Get annual expense report with monthly breakdown and total
create or replace function get_annual_expense_report(
    user_id_param uuid,
    year_param integer
)
returns table (
    month_number integer,
    month_name text,
    monthly_amount decimal(12,2),
    running_total decimal(12,2)
) as $$
begin
    return query
    with months as (
        select generate_series(1, 12) as month_num
    ),
    monthly_data as (
        select 
            extract(month from date)::integer as month_num,
            coalesce(sum(amount), 0.00) as amount
        from transactions
        where user_id = user_id_param
        and extract(year from date) = year_param
        and type = 'expense'
        group by extract(month from date)
    )
    select 
        m.month_num as month_number,
        to_char(to_date(m.month_num::text, 'MM'), 'Month') as month_name,
        coalesce(md.amount, 0.00) as monthly_amount,
        sum(coalesce(md.amount, 0.00)) over (order by m.month_num) as running_total
    from months m
    left join monthly_data md on md.month_num = m.month_num
    order by m.month_num;
end;
$$ language plpgsql;

-- Get annual investment report with monthly breakdown and total
create or replace function get_annual_investment_report(
    user_id_param uuid,
    year_param integer
)
returns table (
    month_number integer,
    month_name text,
    monthly_amount decimal(12,2),
    running_total decimal(12,2)
) as $$
begin
    return query
    with months as (
        select generate_series(1, 12) as month_num
    ),
    monthly_data as (
        select 
            extract(month from date)::integer as month_num,
            coalesce(sum(amount), 0.00) as amount
        from transactions
        where user_id = user_id_param
        and extract(year from date) = year_param
        and type = 'investment'
        group by extract(month from date)
    )
    select 
        m.month_num as month_number,
        to_char(to_date(m.month_num::text, 'MM'), 'Month') as month_name,
        coalesce(md.amount, 0.00) as monthly_amount,
        sum(coalesce(md.amount, 0.00)) over (order by m.month_num) as running_total
    from months m
    left join monthly_data md on md.month_num = m.month_num
    order by m.month_num;
end;
$$ language plpgsql;

-- Usage examples:
-- SELECT * FROM get_annual_income_report('your-user-id', 2024);
-- SELECT * FROM get_annual_expense_report('your-user-id', 2024);
-- SELECT * FROM get_annual_investment_report('your-user-id', 2024);

-- Sample output:
-- month_number | month_name | monthly_amount | running_total
-- -------------+------------+----------------+---------------
--           1 | January    |         500.00 |        500.00
--           2 | February   |         300.00 |        800.00
--           3 | March      |         400.00 |       1200.00
--           4 | April      |           0.00 |       1200.00
--          ...and so on

-- Get annual balance report
create or replace function get_annual_balance_report(
    user_id_param uuid,
    year_param integer
)
returns table (
    month_number integer,
    month_name text,
    income_amount decimal(12,2),
    expense_amount decimal(12,2),
    investment_amount decimal(12,2),
    monthly_balance decimal(12,2),
    running_balance decimal(12,2)
) as $$
begin
    return query
    with months as (
        select generate_series(1, 12) as month_num
    ),
    monthly_data as (
        select 
            extract(month from date)::integer as month_num,
            sum(case when type = 'income' then amount else 0 end) as income,
            sum(case when type = 'expense' then amount else 0 end) as expense,
            sum(case when type = 'investment' then amount else 0 end) as investment
        from transactions
        where user_id = user_id_param
        and extract(year from date) = year_param
        group by extract(month from date)
    )
    select 
        m.month_num,
        to_char(to_date(m.month_num::text, 'MM'), 'Month'),
        coalesce(md.income, 0.00),
        coalesce(md.expense, 0.00),
        coalesce(md.investment, 0.00),
        (coalesce(md.income, 0.00) - coalesce(md.expense, 0.00) - coalesce(md.investment, 0.00)),
        sum(coalesce(md.income, 0.00) - coalesce(md.expense, 0.00) - coalesce(md.investment, 0.00)) over (order by m.month_num)
    from months m
    left join monthly_data md on md.month_num = m.month_num
    order by m.month_num;
end;
$$ language plpgsql;

-- Usage example:
-- SELECT * FROM get_annual_balance_report('your-user-id', 2024);
-- Sample output:
-- month_number | month_name | income_amount | expense_amount | investment_amount | monthly_balance | running_balance
-- -------------+------------+---------------+----------------+-------------------+-----------------+-----------------
--           1 | January    |         500.00 |         500.00 |               0.00 |           0.00 |           0.00
--           2 | February   |         300.00 |           0.00 |               0.00 |           0.00 |           0.00
--           3 | March      |         400.00 |           0.00 |               0.00 |           0.00 |           0.00
--           4 | April      |           0.00 |           0.00 |               0.00 |           0.00 |           0.00
--          ...and so on

-- Get annual income by categories report
create or replace function get_annual_income_by_categories(
    user_id_param uuid,
    year_param integer
)
returns table (
    category_name text,
    total_amount decimal(12,2),
    percentage decimal(5,2)
) as $$
begin
    return query
    with category_totals as (
        select 
            c.name,
            coalesce(sum(t.amount), 0.00) as amount
        from categories c
        left join transactions t on 
            t.category_id = c.id
            and extract(year from t.date) = year_param
            and t.user_id = user_id_param
        where c.user_id = user_id_param
        and c.type = 'income'
        group by c.id, c.name
    ),
    total as (
        select sum(amount) as total_amount from category_totals where amount > 0
    )
    select 
        name as category_name,
        amount as total_amount,
        case 
            when (select total_amount from total) > 0 
            then round((amount / (select total_amount from total) * 100)::numeric, 2)
            else 0.00 
        end as percentage
    from category_totals
    where amount > 0
    order by amount desc;
end;
$$ language plpgsql;

-- Get annual expenses by categories report
create or replace function get_annual_expense_by_categories(
    user_id_param uuid,
    year_param integer
)
returns table (
    category_name text,
    total_amount decimal(12,2),
    percentage decimal(5,2)
) as $$
begin
    return query
    with category_totals as (
        select 
            c.name,
            coalesce(sum(t.amount), 0.00) as amount
        from categories c
        left join transactions t on 
            t.category_id = c.id
            and extract(year from t.date) = year_param
            and t.user_id = user_id_param
        where c.user_id = user_id_param
        and c.type = 'expense'
        group by c.id, c.name
    ),
    total as (
        select sum(amount) as total_amount from category_totals where amount > 0
    )
    select 
        name as category_name,
        amount as total_amount,
        case 
            when (select total_amount from total) > 0 
            then round((amount / (select total_amount from total) * 100)::numeric, 2)
            else 0.00 
        end as percentage
    from category_totals
    where amount > 0
    order by amount desc;
end;
$$ language plpgsql;

-- Get annual investments by categories report
create or replace function get_annual_investment_by_categories(
    user_id_param uuid,
    year_param integer
)
returns table (
    category_name text,
    total_amount decimal(12,2),
    percentage decimal(5,2)
) as $$
begin
    return query
    with category_totals as (
        select 
            c.name,
            coalesce(sum(t.amount), 0.00) as amount
        from categories c
        left join transactions t on 
            t.category_id = c.id
            and extract(year from t.date) = year_param
            and t.user_id = user_id_param
        where c.user_id = user_id_param
        and c.type = 'investment'
        group by c.id, c.name
    ),
    total as (
        select sum(amount) as total_amount from category_totals where amount > 0
    )
    select 
        name as category_name,
        amount as total_amount,
        case 
            when (select total_amount from total) > 0 
            then round((amount / (select total_amount from total) * 100)::numeric, 2)
            else 0.00 
        end as percentage
    from category_totals
    where amount > 0
    order by amount desc;
end;
$$ language plpgsql;

-- Usage examples:
-- SELECT * FROM get_annual_income_by_categories('your-user-id', 2024);
-- SELECT * FROM get_annual_expense_by_categories('your-user-id', 2024);
-- SELECT * FROM get_annual_investment_by_categories('your-user-id', 2024);

-- Sample output:
-- category_name | total_amount | percentage
-- -------------+--------------+------------
-- Salary       |     50000.00 |     75.00
-- Freelance    |     15000.00 |     22.50
-- Other        |      1666.67 |      2.50





-- Get annual income trend with total
create or replace function get_annual_income_trend(
    user_id_param uuid,
    year_param integer
)
returns table (
    year_number integer,
    month_number integer,
    month_name text,
    amount decimal(12,2),
    running_total decimal(12,2),
    year_total decimal(12,2)
) as $$
begin
    return query
    with months as (
        select generate_series(1, 12) as month_num
    ),
    yearly_total as (
        select coalesce(sum(amount), 0.00) as total
        from transactions
        where user_id = user_id_param
        and extract(year from date) = year_param
        and type = 'income'
    )
    select 
        year_param as year_number,
        m.month_num as month_number,
        to_char(to_date(m.month_num::text, 'MM'), 'Month') as month_name,
        coalesce(sum(t.amount), 0.00) as amount,
        sum(coalesce(sum(t.amount), 0.00)) over (order by m.month_num) as running_total,
        (select total from yearly_total) as year_total
    from months m
    left join transactions t on 
        extract(month from t.date) = m.month_num
        and extract(year from t.date) = year_param
        and t.type = 'income'
        and t.user_id = user_id_param
    group by m.month_num
    order by m.month_num;
end;
$$ language plpgsql;

-- Get annual expense trend with total
create or replace function get_annual_expense_trend(
    user_id_param uuid,
    year_param integer
)
returns table (
    year_number integer,
    month_number integer,
    month_name text,
    amount decimal(12,2),
    running_total decimal(12,2),
    year_total decimal(12,2)
) as $$
begin
    return query
    with months as (
        select generate_series(1, 12) as month_num
    ),
    yearly_total as (
        select coalesce(sum(amount), 0.00) as total
        from transactions
        where user_id = user_id_param
        and extract(year from date) = year_param
        and type = 'expense'
    )
    select 
        year_param as year_number,
        m.month_num as month_number,
        to_char(to_date(m.month_num::text, 'MM'), 'Month') as month_name,
        coalesce(sum(t.amount), 0.00) as amount,
        sum(coalesce(sum(t.amount), 0.00)) over (order by m.month_num) as running_total,
        (select total from yearly_total) as year_total
    from months m
    left join transactions t on 
        extract(month from t.date) = m.month_num
        and extract(year from t.date) = year_param
        and t.type = 'expense'
        and t.user_id = user_id_param
    group by m.month_num
    order by m.month_num;
end;
$$ language plpgsql;

-- Get annual investment trend with total
create or replace function get_annual_investment_trend(
    user_id_param uuid,
    year_param integer
)
returns table (
    year_number integer,
    month_number integer,
    month_name text,
    amount decimal(12,2),
    running_total decimal(12,2),
    year_total decimal(12,2)
) as $$
begin
    return query
    with months as (
        select generate_series(1, 12) as month_num
    ),
    yearly_total as (
        select coalesce(sum(amount), 0.00) as total
        from transactions
        where user_id = user_id_param
        and extract(year from date) = year_param
        and type = 'investment'
    )
    select 
        year_param as year_number,
        m.month_num as month_number,
        to_char(to_date(m.month_num::text, 'MM'), 'Month') as month_name,
        coalesce(sum(t.amount), 0.00) as amount,
        sum(coalesce(sum(t.amount), 0.00)) over (order by m.month_num) as running_total,
        (select total from yearly_total) as year_total
    from months m
    left join transactions t on 
        extract(month from t.date) = m.month_num
        and extract(year from t.date) = year_param
        and t.type = 'investment'
        and t.user_id = user_id_param
    group by m.month_num
    order by m.month_num;
end;
$$ language plpgsql;

-- Usage examples:
-- SELECT * FROM get_annual_income_trend('your-user-id', 2024);
-- SELECT * FROM get_annual_expense_trend('your-user-id', 2024);
-- SELECT * FROM get_annual_investment_trend('your-user-id', 2024);

-- Sample output:
-- year_number | month_number | month_name | amount | running_total | year_total
-- ------------+--------------+------------+--------+---------------+------------
--       2024 |            1 | January    | 500.00 |       500.00 |   6000.00
--       2024 |            2 | February   | 300.00 |       800.00 |   6000.00
--       2024 |            3 | March      | 400.00 |      1200.00 |   6000.00
--       2024 |            4 | April      |   0.00 |      1200.00 |   6000.00
--      ...and so on

-- Add initial_balance column to profiles if it doesn't exist
alter table profiles 
add column if not exists initial_balance decimal(12,2) default 0.00;

-- Function to update initial balance
create or replace function update_initial_balance(
    user_id_param uuid,
    new_balance decimal(12,2)
)
returns void as $$
begin
    update profiles
    set initial_balance = new_balance
    where user_id = user_id_param;
end;
$$ language plpgsql;

-- Get all-time financial report with initial balance
create or replace function get_all_time_balance_report(
    user_id_param uuid
)
returns table (
    year integer,
    month integer,
    month_name text,
    income_amount decimal(12,2),
    expense_amount decimal(12,2),
    investment_amount decimal(12,2),
    net_amount decimal(12,2),
    initial_balance decimal(12,2),
    cumulative_balance decimal(12,2)
) as $$
begin
    return query
    with monthly_transactions as (
        select 
            extract(year from date)::integer as year,
            extract(month from date)::integer as month,
            sum(case when type = 'income' then amount else 0 end) as income,
            sum(case when type = 'expense' then amount else 0 end) as expense,
            sum(case when type = 'investment' then amount else 0 end) as investment
        from transactions
        where user_id = user_id_param
        group by extract(year from date), extract(month from date)
    ),
    initial_bal as (
        select coalesce(initial_balance, 0.00) as balance
        from profiles
        where user_id = user_id_param
    )
    select 
        mt.year,
        mt.month,
        to_char(to_date(mt.month::text, 'MM'), 'Month') as month_name,
        coalesce(mt.income, 0.00) as income_amount,
        coalesce(mt.expense, 0.00) as expense_amount,
        coalesce(mt.investment, 0.00) as investment_amount,
        (coalesce(mt.income, 0.00) - coalesce(mt.expense, 0.00) - coalesce(mt.investment, 0.00)) as net_amount,
        (select balance from initial_bal) as initial_balance,
        (select balance from initial_bal) + 
        sum(coalesce(mt.income, 0.00) - coalesce(mt.expense, 0.00) - coalesce(mt.investment, 0.00)) 
        over (order by mt.year, mt.month) as cumulative_balance
    from monthly_transactions mt
    order by mt.year, mt.month;
end;
$$ language plpgsql;

-- Usage examples:
-- First set initial balance:
-- SELECT update_initial_balance('your-user-id', 1000.00);

-- Then get the report:
-- SELECT * FROM get_all_time_balance_report('your-user-id');

-- Sample output:
-- year | month | month_name | income_amount | expense_amount | investment_amount | net_amount | initial_balance | cumulative_balance
-- -----+-------+------------+--------------+----------------+------------------+------------+-----------------+-------------------
-- 2024 |     1 | January    |      1000.00 |        500.00 |          100.00 |     400.00 |         1000.00 |           1400.00
-- 2024 |     2 | February   |      1200.00 |        600.00 |          200.00 |     400.00 |         1000.00 |           1800.00
-- 2024 |     3 | March      |       800.00 |        400.00 |          100.00 |     300.00 |         1000.00 |           2100.00


-- Get all-time income by categories report
create or replace function get_all_time_income_by_categories(
    user_id_param uuid
)
returns table (
    category_name text,
    total_amount decimal(12,2),
    percentage decimal(5,2)
) as $$
begin
    return query
    with category_totals as (
        select 
            c.name,
            coalesce(sum(t.amount), 0.00) as amount
        from categories c
        left join transactions t on 
            t.category_id = c.id
            and t.user_id = user_id_param
        where c.user_id = user_id_param
        and c.type = 'income'
        group by c.id, c.name
    ),
    total as (
        select sum(amount) as total_amount from category_totals where amount > 0
    )
    select 
        name as category_name,
        amount as total_amount,
        case 
            when (select total_amount from total) > 0 
            then round((amount / (select total_amount from total) * 100)::numeric, 2)
            else 0.00 
        end as percentage
    from category_totals
    where amount > 0
    order by amount desc;
end;
$$ language plpgsql;

-- Get all-time expenses by categories report
create or replace function get_all_time_expense_by_categories(
    user_id_param uuid
)
returns table (
    category_name text,
    total_amount decimal(12,2),
    percentage decimal(5,2)
) as $$
begin
    return query
    with category_totals as (
        select 
            c.name,
            coalesce(sum(t.amount), 0.00) as amount
        from categories c
        left join transactions t on 
            t.category_id = c.id
            and t.user_id = user_id_param
        where c.user_id = user_id_param
        and c.type = 'expense'
        group by c.id, c.name
    ),
    total as (
        select sum(amount) as total_amount from category_totals where amount > 0
    )
    select 
        name as category_name,
        amount as total_amount,
        case 
            when (select total_amount from total) > 0 
            then round((amount / (select total_amount from total) * 100)::numeric, 2)
            else 0.00 
        end as percentage
    from category_totals
    where amount > 0
    order by amount desc;
end;
$$ language plpgsql;

-- Get all-time investments by categories report
create or replace function get_all_time_investment_by_categories(
    user_id_param uuid
)
returns table (
    category_name text,
    total_amount decimal(12,2),
    percentage decimal(5,2)
) as $$
begin
    return query
    with category_totals as (
        select 
            c.name,
            coalesce(sum(t.amount), 0.00) as amount
        from categories c
        left join transactions t on 
            t.category_id = c.id
            and t.user_id = user_id_param
        where c.user_id = user_id_param
        and c.type = 'investment'
        group by c.id, c.name
    ),
    total as (
        select sum(amount) as total_amount from category_totals where amount > 0
    )
    select 
        name as category_name,
        amount as total_amount,
        case 
            when (select total_amount from total) > 0 
            then round((amount / (select total_amount from total) * 100)::numeric, 2)
            else 0.00 
        end as percentage
    from category_totals
    where amount > 0
    order by amount desc;
end;
$$ language plpgsql;

-- Usage examples:
-- SELECT * FROM get_all_time_income_by_categories('your-user-id');
-- SELECT * FROM get_all_time_expense_by_categories('your-user-id');
-- SELECT * FROM get_all_time_investment_by_categories('your-user-id');

-- Sample output:
-- category_name | total_amount | percentage
-- -------------+--------------+------------
-- Salary       |    120000.00 |     75.00
-- Freelance    |     30000.00 |     18.75
-- Dividends    |     10000.00 |      6.25


-- Enable Row Level Security (RLS)
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

create policy "Users can view own categories"
    on categories for select
    using (auth.uid() = user_id);

create policy "Users can manage own categories"
    on categories for all
    using (auth.uid() = user_id);

create policy "Users can view own transactions"
    on transactions for select
    using (auth.uid() = user_id);

create policy "Users can manage own transactions"
    on transactions for all
    using (auth.uid() = user_id);

-- Add indexes for better performance
create index if not exists idx_transactions_user_date on transactions(user_id, date);
create index if not exists idx_transactions_category on transactions(category_id);
create index if not exists idx_categories_user on categories(user_id);
create index if not exists idx_transactions_type on transactions(type);
create index if not exists idx_transactions_date on transactions(date);
create index if not exists idx_categories_type on categories(type);