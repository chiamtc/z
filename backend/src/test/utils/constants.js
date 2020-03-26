import faker from 'faker';

export const email = faker.internet.email();
export const firstName = faker.name.firstName();
export const lastName = faker.name.lastName();
export const username = faker.lorem.words();
export const password = faker.random.uuid();

export const projectName = faker.lorem.words();
export const projectDesc = faker.lorem.sentences();
export const projectType = faker.random.arrayElement(['software_development']);

export const issueName = faker.lorem.words();
export const issueType = faker.random.arrayElement(['story', 'bug','subtask', 'task', 'epic']);
export const issuePriority = faker.random.arrayElement(['lowest', 'low', 'medium', 'high','highest']);
export const issueStatus = faker.random.arrayElement(['open', 'in_progress', 'reopened', 'resolved', 'closed','building', 'build_broken', 'to_do' ,'done']);
export const issueDesc = faker.lorem.sentences();
export const issueStoryPoint = faker.random.number();

export const sprintName = faker.lorem.words();
export const sprintGoals = faker.lorem.sentences();
export const sprintStartDate = faker.date.past();
export const sprintEndDate = faker.date.future();

export const commentContent = faker.lorem.paragraphs();

export const role_name = faker.lorem.words();
export const description = faker.lorem.sentences();
