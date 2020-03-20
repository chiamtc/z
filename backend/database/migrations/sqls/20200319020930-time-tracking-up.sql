create table time_tracking(
    time_tracking_id serial primary key,
    original_estimation int,
    time_spent int,
    remaining_estimation int,
    start_date timestamptz,
    created_date timestamptz,
    updated_date timestamptz,
    issue_id int unique references issue(issue_id) on delete cascade
);

-- automatically set those dates upon creation
alter table time_tracking alter column original_estimation set default 0;
alter table time_tracking alter column time_spent set default 0;
alter table time_tracking alter column remaining_estimation set default 0;
alter table time_tracking alter column created_date set default now();
alter table time_tracking alter column updated_date set default now();

-- trigger to trigger update_timestamp function when there's an update
create trigger trigger_time_tracking_updated_date
before update on time_tracking
for each row
execute procedure update_timestamp();
