create table participant_issue(
    participant_id int references person(person_id),
    issue_id int references issue(issue_id),
    created_date timestamptz
);

alter table participant_issue alter column created_date set default now();
