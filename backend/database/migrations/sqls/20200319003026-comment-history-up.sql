create type comment_history_action_enum as enum('deleted');
create table comment_history(
    comment_history_id serial primary key,
    comment_id int not null,
    person_id int not null,
    issue_id int not null,
    comment_history_action comment_history_action_enum,
    created_date timestamptz
);
-- automatically set those dates upon creation
alter table comment_history alter column created_date set default now();

--use enum type
alter table comment_history alter COLUMN comment_history_action type comment_history_action_enum using comment_history_action::text::comment_history_action_enum;

