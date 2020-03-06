create table person(
    person_id serial primary key,
    auth_user_id int unique,
    first_name varchar(255) not null,
    last_name varchar(255)  not null,
    created_date timestamptz,
    updated_date timestamptz,
    email varchar(255) unique,
    foreign key(auth_user_id) references auth_user(auth_user_id),
    foreign key(email) references auth_user(primary_email)
);

alter table person alter column created_date set default now();
alter table person alter column updated_date set default now();

insert into person (first_name, last_name, email) values ('jim', 'carrey', 'jim.c@test.com');
