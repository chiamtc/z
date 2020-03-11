create table project(
    project_id serial primary key,
    project_name varchar(255) not null,
    project_desc text,
    project_type varchar(255) not null,
    project_lead int unique not null,
    created_date timestamptz,
    updated_date timestamptz,
    foreign key(project_lead) references person(person_id)
);

alter table person alter column created_date set default now();
alter table person alter column updated_date set default now();

-- trigger to trigger update_timestamp function when there's an update
create trigger trigger_project_updated_date
before update on project
for each row
execute procedure update_timestamp();
