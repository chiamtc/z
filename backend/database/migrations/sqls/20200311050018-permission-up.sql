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

insert into permission(can_create, can_read, can_update, can_delete) values(0, 0, 0, 0);
insert into permission(can_create, can_read, can_update, can_delete) values(0, 0, 0, 1);
insert into permission(can_create, can_read, can_update, can_delete) values(0, 0, 1, 0);
insert into permission(can_create, can_read, can_update, can_delete) values(0, 0, 1, 1);
insert into permission(can_create, can_read, can_update, can_delete) values(0, 1, 0, 0);
insert into permission(can_create, can_read, can_update, can_delete) values(0, 1, 0, 1);
insert into permission(can_create, can_read, can_update, can_delete) values(0, 1, 1, 0);
insert into permission(can_create, can_read, can_update, can_delete) values(0, 1, 1, 1);
insert into permission(can_create, can_read, can_update, can_delete) values(1, 0, 0, 0);
insert into permission(can_create, can_read, can_update, can_delete) values(1, 0, 0, 1);
insert into permission(can_create, can_read, can_update, can_delete) values(1, 0, 1, 0);
insert into permission(can_create, can_read, can_update, can_delete) values(1, 0, 1, 1);
insert into permission(can_create, can_read, can_update, can_delete) values(1, 1, 0, 0);
insert into permission(can_create, can_read, can_update, can_delete) values(1, 1, 0, 1);
insert into permission(can_create, can_read, can_update, can_delete) values(1, 1, 1, 0);
insert into permission(can_create, can_read, can_update, can_delete) values(1, 1, 1, 1);

--c r u d
--0,0, 0, 0 = 0
--0,0, 0, 1 = 1
--0,0, 1, 0 = 2
--0,0, 1, 1 = 3
--0,1, 0, 0 = 4
--0,1, 0, 1 = 5
--0,1, 1, 0 = 6
--0,1, 1, 1 = 7
--1,0, 0, 0 = 8
--1,0, 0, 1 = 9
--1,0, 1, 0 = 10
--1,0, 1, 1 = 11
--1,1, 0, 0 = 12
--1,1, 0, 1 = 13
--1,1, 1, 0 = 14
--1,1, 1, 1 = 15

--4 , 2 , 1
