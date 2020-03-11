create table project_participant(
    project_id int,
    participant_id int,
    foreign key(project_id) references project(project_id),
    foreign key(participant_id) references person(person_id)
);
