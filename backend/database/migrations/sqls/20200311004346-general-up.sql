create or replace function update_timestamp()
returns trigger as $$
begin
    new.updated_date = NOW();
    return new;
end;
$$ LANGUAGE plpgsql;

create type project_type_enum as enum('software_development');
