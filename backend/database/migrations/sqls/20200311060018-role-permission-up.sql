create table role_permission(
    role_permission serial primary key,
    permission_id int references permission(permission_id) on delete cascade,
    role_id int references role(role_id) on delete cascade,
    created_date timestamptz
);

-- automatically set those dates upon creation
alter table role_permission alter column created_date set default now();
