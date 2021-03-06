-- TODO: should have on delete cascade on participant_id but rarely user will delete their account
create table project_participant(
    project_id int references project(project_id) on delete cascade,
    participant_id int references person(person_id),
    role_id int references role(role_id),
    created_date timestamptz,
    updated_date timestamptz
);
-- automatically set those dates upon creation
alter table project_participant alter column created_date set default now();
alter table project_participant alter column updated_date set default now();

-- trigger to trigger update_timestamp function when there's an update
create trigger trigger_project_participant_updated_date
before update on project_participant
for each row
execute procedure update_timestamp();
