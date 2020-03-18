create table sprint(
    sprint_id serial primary key,
    sprint_name text not null,
    sprint_goal text,
    start_date TIMESTAMPTZ not null check(start_date < end_date),
    end_date TIMESTAMPTZ not null check(end_date > start_date),
    project_id int not null,
    created_date TIMESTAMPTZ,
    updated_date TIMESTAMPTZ,
    foreign key(project_id) references project(project_id)
);

-- index sprint name
create index sprint_name_index on sprint (sprint_name);

-- automatically set those dates upon creation
alter table sprint alter column created_date set default now();
alter table sprint alter column updated_date set default now();

-- trigger to trigger update_timestamp function when there's an update
create trigger trigger_sprint_updated_date
before update on sprint
for each row
execute procedure update_timestamp();
