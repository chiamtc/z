create table auth_user(
    auth_user_id serial primary key,
    email varchar(255) unique not null,
    username varchar(255) unique not null,
    password text not null,
    created_date timestamptz,
    updated_date timestamptz,
    last_login timestamptz
);
-- automatically set those dates upon creation
alter table auth_user alter column created_date set default now();
alter table auth_user alter column updated_date set default now();
alter table auth_user alter column last_login set default now();

-- index username and email
create index username_index on auth_user (username);
create index email_index on auth_user (email);

-- trigger to trigger update_timestamp function when there's an update
create trigger trigger_person_updated_date
before update on auth_user
for each row
execute procedure update_timestamp();
