import app from './server';

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is listening to ${PORT}....`);
    console.log('Press Ctrl+C to quit.');
});
