create table comment(
    comment_id serial primary key,
    person_id int not null references person(person_id),
    issue_id int not null  references issue(issue_id) on delete cascade,
    content text not null,
    edited boolean,
    created_date timestamptz,
    updated_date timestamptz
);

-- automatically set those dates upon creation
alter table comment alter column edited set default false;
alter table comment alter column created_date set default now();
alter table comment alter column updated_date set default now();

-- trigger to trigger update_timestamp function when there's an update
create trigger trigger_comment_updated_date
before update on comment
for each row
execute procedure update_timestamp();
