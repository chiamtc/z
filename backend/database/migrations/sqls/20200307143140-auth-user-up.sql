create table auth_user(
    auth_user_id serial primary key,
    primary_email varchar(255) unique not null,
    auth_user_username varchar(255) unique not null,
    auth_user_password text not null,
    created_date timestamptz,
    updated_date timestamptz
);
alter table auth_user alter column created_date set default now();
alter table auth_user alter column updated_date set default now();
