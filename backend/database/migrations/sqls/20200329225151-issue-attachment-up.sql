-- TODO: mime_type restricts to certain types
create table issue_attachment(
    issue_attachment_id serial primary key,
    file_path text not null,
    file_name text not null,
    mime_type varchar(255),
    file_size bigint,
    issue_id int references issue(issue_id) on delete cascade,
    created_date timestamptz
);

-- automatically set those dates upon creation
alter table issue_attachment alter column created_date set default now();
