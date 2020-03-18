
create table person(
    person_id serial primary key,
    auth_user_id int unique,
    first_name varchar(255) not null,
    last_name varchar(255)  not null,
    created_date timestamptz,
    updated_date timestamptz,
    email varchar(255) unique,
    foreign key(auth_user_id) references auth_user(auth_user_id)
);

-- index first and last anme
create index first_name_index on person (first_name);
create index last_name_index on person (last_name);

-- automatically set those dates upon creation
alter table person alter column created_date set default now();
alter table person alter column updated_date set default now();

-- trigger to trigger update_timestamp function when there's an update
create trigger trigger_auth_user_updated_date
before update on person
for each row
execute procedure update_timestamp();
