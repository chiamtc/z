create type history_action_enum as enum('created', 'updated');
create table history(
    history_id serial primary key,
    issue_id int not null,
    person_id int not null,
    history_action history_action_enum,
    new_content text,
    old_content text,
    created_date timestamptz
);

alter table history alter column created_date set default now();

--use enum type
ALTER TABLE history ALTER COLUMN history_action type history_action_enum USING history_action::text::history_action_enum;

