create type history_action_enum as enum('created', 'updated', 'removed', 'deleted');
create table history(
    history_id serial primary key,
    issue_id int not null,
    person_id int not null,
    history_action history_action_enum,
    new_content text,
    old_content text,
    updated_content_type varchar(255),
    created_date timestamptz
);
-- automatically set those dates upon creation
alter table history alter column created_date set default now();

--use enum type
alter table history alter COLUMN history_action type history_action_enum using history_action::text::history_action_enum;

