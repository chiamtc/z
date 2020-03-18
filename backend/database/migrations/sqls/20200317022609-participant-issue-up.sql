create type participant_type_enum as enum('reporter', 'assignee');
create table participant_issue(
    participant_id int references person(person_id),
    issue_id int references issue(issue_id) on delete cascade,
    participant_type participant_type_enum,
    created_date timestamptz
);
-- automatically set those dates upon creation
alter table participant_issue alter column created_date set default now();

--use enum type
alter table issue alter COLUMN issue_type type issue_type_enum using issue_type::text::issue_type_enum;
