create type issue_type_enum as enum('task', 'bug', 'story','subtask', 'epic');
create type issue_status_enum as enum('open', 'in_progress', 'reopened', 'resolved', 'closed','building', 'build_broken', 'to_do' ,'done');
create type issue_priority_enum as enum('lowest', 'low', 'medium', 'high', 'highest');

create table issue(
    issue_id serial primary key,
    project_id int not null,
--  TODO: add  sprint_id int,
--  TODO: add  epic_id int,
    issue_name text not null,
    issue_type issue_type_enum not null,
    issue_priority issue_priority_enum,
    issue_status issue_status_enum,
    reporter int not null,
    assignee int,
    created_date timestamptz,
    updated_date timestamptz,
    foreign key(project_id) references project(project_id)
--  TODO: add  foreign key(sprint_id) references sprint(sprint_id)
--  TODO: add  foreign key(epic_id) references epic(epic_id)
);

alter table issue alter column created_date set default now();
alter table issue alter column updated_date set default now();
alter table issue alter column issue_status set default 'open';
alter table issue alter column issue_priority set default 'medium';

--use enum type
ALTER TABLE issue ALTER COLUMN issue_type type issue_type_enum USING issue_type::text::issue_type_enum;

--use enum type
ALTER TABLE issue ALTER COLUMN issue_status type issue_status_enum USING issue_status::text::issue_status_enum;

--use enum type
ALTER TABLE issue ALTER COLUMN issue_priority type issue_priority_enum USING issue_priority::text::issue_priority_enum;
