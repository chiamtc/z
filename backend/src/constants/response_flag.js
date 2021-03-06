const ResponseFlag = {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    USER_EXISTS_IN_DATABASE: 'User exists in database',
    INVALID_CREDENTIALS: 'Invalid credentials',
    UNAUTHORIZED_ENDPOINT_ACCESS: 'Unauthorized endpoint access',
    JWT_TOKEN_ERROR: 'Either JWT token has expired or invalid JWT',
    OK:'ok',
    AUTH_ERROR :'auth_error',
    INTERNAL_ERROR:'internal_error',
    API_ERROR:'api_error',
    API_ERROR_MESSAGE:'experiences issue',
    OBJECT_NOT_FOUND:'Object not found',
    OBJECT_NOT_DELETED:'Object not deleted',
    OBJECT_NOT_UPDATED:'Object was not updated ',
    STORAGE_API_ERROR:'storage'
};

export default ResponseFlag;
