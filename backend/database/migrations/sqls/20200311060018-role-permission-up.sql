create table role_permission(
    role_permission serial primary key,
    permission_id int references permission(permission_id) on delete cascade,
    role_id int references role(role_id) on delete cascade,
    created_date timestamptz,
    updated_date timestamptz
);

-- automatically set those dates upon creation
alter table role_permission alter column created_date set default now();
alter table role_permission alter column updated_date set default now();

-- trigger to trigger update_timestamp function when there's an update
create trigger trigger_role_permission_updated_date
before update on role_permission
for each row
execute procedure update_timestamp();

