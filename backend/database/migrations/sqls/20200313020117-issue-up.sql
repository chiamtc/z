create type issue_type_enum as enum('task', 'bug', 'story','subtask', 'epic');
create type issue_status_enum as enum('open', 'in_progress', 'reopened', 'resolved', 'closed','building', 'build_broken', 'to_do' ,'done');
create type issue_priority_enum as enum('lowest', 'low', 'medium', 'high', 'highest');
--create type issue_resolution_enum as enum('done', 'wont_do', 'duplicate', 'cannot_reproduce');
create table issue(
    issue_id serial primary key,
    parent_issue_id int,
    project_id int not null,
--  TODO: add  sprint_id int,
    issue_name text not null,
    issue_desc text,
    issue_story_point decimal,
    issue_type issue_type_enum not null,
    issue_priority issue_priority_enum,
    issue_status issue_status_enum,
    reporter int not null,
    created_date timestamptz,
    updated_date timestamptz,
    foreign key (reporter) references person(person_id),
    foreign key(project_id) references project(project_id),
    foreign key(parent_issue_id) references issue(issue_id)
--  TODO: add  foreign key(sprint_id) references sprint(sprint_id)
);

alter table issue alter column created_date set default now();
alter table issue alter column updated_date set default now();
alter table issue alter column issue_status set default 'open';
alter table issue alter column issue_priority set default 'medium';

-- trigger to trigger update_timestamp function when there's an update
create trigger trigger_issue_updated_date
before update on issue
for each row
execute procedure update_timestamp();

--use enum type
ALTER TABLE issue ALTER COLUMN issue_type type issue_type_enum USING issue_type::text::issue_type_enum;

--use enum type
ALTER TABLE issue ALTER COLUMN issue_status type issue_status_enum USING issue_status::text::issue_status_enum;

--use enum type
ALTER TABLE issue ALTER COLUMN issue_priority type issue_priority_enum USING issue_priority::text::issue_priority_enum;

--use enum type
--ALTER TABLE issue ALTER COLUMN issue_resolution type issue_resolution_enum USING issue_resolution::text::issue_resolution_enum;
