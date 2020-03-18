
create type project_type_enum as enum('software_development');

create table project(
    project_id serial primary key,
    project_name varchar(255) not null,
    project_desc text,
    project_type project_type_enum,
    project_lead int not null,
    created_date timestamptz,
    updated_date timestamptz
);

-- automatically set those dates upon creation
alter table project alter column created_date set default now();
alter table project alter column updated_date set default now();

-- index on project name
create index project_name_index on project (project_name);

--use enum type
alter table project alter COLUMN project_type type project_type_enum using project_type::text::project_type_enum;

-- trigger to trigger update_timestamp function when there's an update
create trigger trigger_project_updated_date
before update on project
for each row
execute procedure update_timestamp();
