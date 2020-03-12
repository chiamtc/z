create table project(
    project_id serial primary key,
    project_name varchar(255) not null,
    project_desc text,
    project_type varchar(255) not null,
    project_lead int not null,
    created_date timestamptz,
    updated_date timestamptz
);

alter table project alter column created_date set default now();
alter table project alter column updated_date set default now();

--use enum type
ALTER TABLE project ALTER COLUMN project_type TYPE project_type_enum USING project_type::text::project_type_enum;

-- trigger to trigger update_timestamp function when there's an update
create trigger trigger_project_updated_date
before update on project
for each row
execute procedure update_timestamp();
