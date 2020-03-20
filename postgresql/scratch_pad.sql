
-- to list all the enum
-- select enum_range(null::color_t) 
-- or
-- \dT+ <enum_name> in psql

-- edit
-- ALTER TABLE job ALTER COLUMN job_status TYPE status_enum USING status::text::status_enum;

-- delete from history where history_id = 10;
-- select * from participant_issue;
-- select * from history where issue_id=10;
-- delete from participant_issue where participant_id=10 and issue_id=1 returning *;

-- create table tester(
-- 	start_date timestamptz CHECK (start_date < end_date),
-- 	end_date timestamptz check (end_date > start_date)
-- )
-- insert into tester (start_date, end_date) values('2019-10-19T22:20:51.849Z', '2019-10-19T22:17:51.849Z')
-- select * from tester;

-- insert into participant_issue(participant_id, issue_id, participant_type) values(1, 1, 'assignee');
-- update issue set sprint_id = null where sprint_id=2 returning select * from sprint where sprint_id=2;

-- insert into issue(issue_name, project_id, parent_issue_id, issue_type, reporter) values( 'sub', 1, 1,'task',1);
-- delete from issue where parent_issue_id=10;
-- create table issue_comment(cid int primary key);
-- select p.first_name, p.last_name ,c.* from person p right join comment c on p.person_id = c.person_id where c.issue_id=2;
-- insert into comment(person_id, issue_id, content, edited) values(1, 1, 'new content', false);
-- delete from issue where issue_id=1;
-- drop function update_timestamp();
-- drop table comment; drop table participant_issue; drop table issue_history; drop table issue; drop table sprint; drop table project_participant; drop table project; drop table person; drop table auth_user;
-- drop table participant_issue;  drop table issue; drop table issue_history; drop table sprint; drop table project_participant; drop table project; drop table person; drop table auth_user;
-- drop type comment_history_action_enum; drop type issue_history_action_enum; drop type issue_priority_enum; drop type issue_status_enum; drop type issue_type_enum; drop type participant_type_enum; drop type project_type_enum;
-- drop function update_timestamp();
-- drop table migrations;
-- drop type issue_history_action_enum; drop type issue_priority_enum; drop type issue_status_enum; drop type issue_type_enum; drop type participant_type_enum;
-- select * from issue_history order by created_date desc;
-- insert into issue_history (issue_id, person_id, issue_history_action, new_content, old_content, updated_content_type) values(1,1,'updated', 'new task name', 'deserunt et sequi','issue_name' )


-- update time_tracking set remaining_estimation = original_estimation - 0 where issue_id=2;
-- update time_tracking set time_spent=0, original_estimation = 0, remaining_estimation=0 where issue_id=2;
-- update time_tracking set remaining_estimation=1000;
-- update time_tracking set original_estimation = 1000;
-- update time_tracking set time_spent = time_spent + 400,remaining_estimation = case
--                     when remaining_estimation > 0 then
--                         remaining_estimation - 400
--                             else
--                                 1000
--                         end
-- where issue_id =2 returning *;

select * from time_tracking;
-- delete from time_tracking where time_tracking_id =2;
