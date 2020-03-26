create or replace function update_timestamp()
returns trigger as $$
begin
    new.updated_date = NOW();
    return new;
end;
$$ LANGUAGE plpgsql;
