create table permission(
    permission_id serial primary key,
    can_create int,
    can_read int,
    can_update int,
    can_delete int,
    created_date timestamptz
);

-- automatically set those dates upon creation
alter table permission alter column created_date set default now();

--e v c
--0 0 0 = 0
--0 0 1 = 1
--0 1 0 = 2
--0 1 1 = 3
--1 0 0 = 4
--1 0 1 = 5
--1 1 0 = 6
--1 1 1 = 7
--4 , 2 , 1
