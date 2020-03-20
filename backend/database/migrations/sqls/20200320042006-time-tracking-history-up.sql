create type time_tracking_history_action_enum as enum('logged', 'updated');

create table time_tracking_history(
    time_tracking_history_id serial primary key,
    time_tracking_id int not null,
    issue_id int not null,
    person_id int not null,
    time_tracking_history_action time_tracking_history_action_enum,
    new_content text,
    old_content text,
    updated_content_type varchar(255),
    created_date timestamptz
);
-- automatically set those dates upon creation
alter table time_tracking_history alter column created_date set default now();

--use enum type
alter table time_tracking_history alter COLUMN time_tracking_history_action type time_tracking_history_action_enum using time_tracking_history_action::text::time_tracking_history_action_enum;
