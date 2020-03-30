-- TODO: mime_type restricts to certain types
create table comment_attachment(
    comment_attachment_id serial primary key,
    file_path text not null,
    file_name text not null,
    mime_type varchar(255),
    file_size bigint,
    comment_id int references comment(comment_id) on delete cascade,
    created_date timestamptz
);

-- automatically set those dates upon creation
alter table comment_attachment alter column created_date set default now();
