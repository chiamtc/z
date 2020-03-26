create table role(
    role_id serial primary key,
    role_name varchar(255),
    description text,
    project_id int references project(project_id),
    created_date timestamptz,
    updated_date timestamptz
);

-- automatically set those dates upon creation
alter table role alter column created_date set default now();
alter table role alter column updated_date set default now();

-- trigger to trigger update_timestamp function when there's an update
create trigger trigger_role_updated_date
before update on role
for each row
execute procedure update_timestamp();


