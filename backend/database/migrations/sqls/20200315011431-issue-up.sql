create type issue_type_enum as enum('task', 'bug', 'story','subtask', 'epic');
create type issue_status_enum as enum('open', 'in_progress', 'reopened', 'resolved', 'closed','building', 'build_broken', 'to_do' ,'done');
create type issue_priority_enum as enum('lowest', 'low', 'medium', 'high', 'highest');
--create type issue_resolution_enum as enum('done', 'wont_do', 'duplicate', 'cannot_reproduce');
create table issue(
    issue_id serial primary key,
    parent_issue_id int,
    project_id int not null,
    sprint_id int,
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
    foreign key(parent_issue_id) references issue(issue_id),
    foreign key(sprint_id) references sprint(sprint_id)
);

alter table issue alter column created_date set default now();
alter table issue alter column updated_date set default now();
alter table issue alter column issue_status set default 'open';
alter table issue alter column issue_priority set default 'medium';

create index issue_name_index on issue (issue_name);

--use enum type
alter table issue alter COLUMN issue_type type issue_type_enum using issue_type::text::issue_type_enum;

--use enum type
alter table issue alter COLUMN issue_status type issue_status_enum using issue_status::text::issue_status_enum;

--use enum type
alter table issue alter COLUMN issue_priority type issue_priority_enum using issue_priority::text::issue_priority_enum;


-- trigger to trigger update_timestamp function when there's an update
create trigger trigger_issue_updated_date
before update on issue
for each row
execute procedure update_timestamp();

--use enum type
--ALTER TABLE issue ALTER COLUMN issue_resolution type issue_resolution_enum USING issue_resolution::text::issue_resolution_enum;
/*
create or replace function mytrigger(uid integer)
RETURNS trigger AS $$
declare
    _issue_name text;
    _issue_desc text;
    _issue_story_point float;
    _issue_type varchar(255);
    _issue_priority varchar(255);
    _issue_status varchar(255);
begin
--     code for Insert
     if  (TG_OP = 'INSERT') then
           insert into history(person_id, issue_id,history_action) values(new.reporter, new.issue_id, 'created');
     end if;

--     code for update
     if  (TG_OP = 'UPDATE') then
        SELECT i.issue_name, i.issue_desc, i.issue_story_point, i.issue_type, i.issue_priority, i.issue_status INTO
        _issue_name, _issue_desc, _issue_story_point, _issue_type, _issue_priority, _issue_status
        from issue i where issue_id = old.issue_id;

        if new.issue_name <> old.issue_name  then
            insert into history(person_id, issue_id, history_action, old_content, new_content, updated_content_type) values(uid, old.issue_id, 'udpated', old.old_content, new.new_content, 'issue_name');
        end if;

        if new.issue_desc != old.issue_desc then
            insert into history(person_id, issue_id, history_action, old_content, new_content, updated_content_type) values(uid, old.issue_id, 'udpated', old.issue_desc, new.new_content, 'issue_desc');
        end if;
     end if;
return new;
end;
$$ LANGUAGE plpgsql*/

-- fucking genius https://stackoverflow.com/questions/25148585/pl-pgsql-general-way-to-update-n-columns-in-trigger
