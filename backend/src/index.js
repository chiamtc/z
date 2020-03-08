import app from './server';

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is listening to ${PORT}....`);
    console.log('Press Ctrl+C to quit.');
});
