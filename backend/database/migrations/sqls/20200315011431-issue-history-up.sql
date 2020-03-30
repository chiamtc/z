create type issue_history_action_enum as enum('created', 'updated', 'removed','added');
create table issue_history(
    issue_history_id serial primary key,
    issue_id int not null,
    person_id int not null,
    issue_history_action issue_history_action_enum,
    new_content text,
    old_content text,
    updated_content_type varchar(255),
    created_date timestamptz
);
-- automatically set those dates upon creation
alter table issue_history alter column created_date set default now();

--use enum type
alter table issue_history alter COLUMN issue_history_action type issue_history_action_enum using issue_history_action::text::issue_history_action_enum;

