import faker from 'faker';

export const email = faker.internet.email();
export const firstName = faker.name.firstName();
export const lastName = faker.name.lastName();
export const username = faker.lorem.words();
export const password = faker.random.uuid();

